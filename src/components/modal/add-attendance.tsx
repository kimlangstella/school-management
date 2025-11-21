"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../lib/supabaseClient";
import {
    Button,
    Modal,
    ModalContent,
    ModalBody,
    Spinner,
    Tooltip,
} from "@heroui/react";

/* ------------------------- Props & Types ------------------------- */
type Props = {
    isOpen: boolean;
    onOpenChange: () => void;
    onClose: () => void;
    onSuccess: () => void;
};

type Branch = { id: string; name: string };
type Program = { id: string; name: string; branch_id: string | number };
type Classroom = { id: string; class_name: string; program_id: string | number };

type Status = "present" | "late" | "absent" | "unmarked";
type MatrixRow = {
    student_id: string;
    first_name: string;
    last_name: string;
    s1: Status; s2: Status; s3: Status; s4: Status; s5: Status;
    s6: Status; s7: Status; s8: Status; s9: Status; s10: Status; s11: Status;
};
const supabase = createClient();
const SESSIONS = Array.from({ length: 11 }, (_, i) => i + 1) as const;
type SessionNo = (typeof SESSIONS)[number];

/* ------------------------- Tiny UI Atoms ------------------------- */
function nextStatus(s: Status): Status {
    return s === "present" ? "absent" : s === "absent" ? "late" : s === "late" ? "unmarked" : "present";
}

function pillColor(value: Status) {
    switch (value) {
        case "present": return "bg-green-600";
        case "absent":  return "bg-red-600";
        case "late":    return "bg-amber-500";
        default:        return "bg-zinc-700/60";
    }
}

function StatusPill({
                        value,
                        onCycle,
                        size = 40,
                        title,
                    }: {
    value: Status;
    onCycle: () => void;
    size?: number;
    title?: string;
}) {
    const label = value === "unmarked" ? "•" : value === "present" ? "P" : value === "absent" ? "A" : "L";
    return (
        <button
            title={title}
            onClick={onCycle}
            className={`grid place-content-center rounded-full text-white shadow-sm hover:scale-[1.03] transition ${pillColor(value)}`}
            style={{ width: size, height: size, fontWeight: 800 }}
            aria-label={`Status ${label}`}
        >
            {label}
        </button>
    );
}

/* ------------------------- Component ------------------------- */
export default function AddAttendanceModal({
                                               isOpen,
                                               onOpenChange,
                                               onClose,
                                               onSuccess,
                                           }: Props) {
    /* Meta lists */
    const [branches, setBranches] = useState<Branch[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);

    /* Data */
    const [matrix, setMatrix] = useState<MatrixRow[]>([]);
    const [sessionDatesISO, setSessionDatesISO] = useState<Record<number, string>>({});
    const [remarksByKey, setRemarksByKey] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* Header date editor */
    const [editingSession, setEditingSession] = useState<number | null>(null);
    const [dateDraft, setDateDraft] = useState<string>("");

    /* Form */
    const [form, setForm] = useState({ branch_id: "", program_id: "", classroom_id: "" });

    /* UX: quick/grid + current session */
    const [viewMode, setViewMode] = useState<"quick" | "grid">("quick");
    const [activeSession, setActiveSession] = useState<SessionNo>(1);

    /* --------------- Helpers --------------- */
    const formatLabel = (iso?: string) =>
        iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : undefined;

    const totalPresent = useMemo(() => {
        let count = 0;
        matrix.forEach((r) => SESSIONS.forEach((n) => {
            // FIX: Safe key access instead of 'as any'
            const key = `s${n}` as keyof MatrixRow;
            if (r[key] === "present") count++;
        }));
        return count;
    }, [matrix]);

    const filteredPrograms = useMemo(
        () => programs.filter((p) => String(p.branch_id) === String(form.branch_id)),
        [programs, form.branch_id]
    );
    const filteredClassrooms = useMemo(() => {
        if (form.program_id) return classrooms.filter((c) => String(c.program_id) === String(form.program_id));
        if (form.branch_id) {
            const pids = new Set(programs.filter((p) => String(p.branch_id) === String(form.branch_id)).map((p) => String(p.id)));
            return classrooms.filter((c) => pids.has(String(c.program_id)));
        }
        return classrooms;
    }, [classrooms, programs, form.branch_id, form.program_id]);

    const keyFor = (studentId: string, sessionNo: number) => `${studentId}-${sessionNo}`;

    const resetAll = () => {
        setForm({ branch_id: "", program_id: "", classroom_id: "" });
        setMatrix([]);
        setSessionDatesISO({});
        setRemarksByKey({});
        setEditingSession(null);
        setDateDraft("");
        setError(null);
        setActiveSession(1);
        setViewMode("quick");
    };

    const handleClose = () => { resetAll(); onClose(); };

    /* --------------- Load meta lists --------------- */
    useEffect(() => {
        if (!isOpen) return;
        resetAll();
        (async () => {
            const [{ data: b, error: be }, { data: p, error: pe }, { data: c, error: ce }] =
                await Promise.all([
                    supabase.rpc("get_all_branches"),
                    supabase.rpc("get_all_programs"),
                    supabase.rpc("get_all_classrooms"),
                ]);
            if (be || pe || ce) {
                setError(be?.message || pe?.message || ce?.message || "Failed to load lists");
                return;
            }
            setBranches((b ?? []) as Branch[]);
            setPrograms((p ?? []) as Program[]);
            // FIX: Type casting for RPC response
            setClassrooms(((c ?? []) as Array<{ id: string; class_name: string; program_id: string | number }>).map((x) => ({
                id: x.id,
                class_name: x.class_name,
                program_id: String(x.program_id),
            })));
        })();
    }, [isOpen]); // FIX: Removed unused eslint-disable

    /* --------------- Filters change --------------- */
    const handleField = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));

        if (name === "branch_id") {
            setForm((f) => ({ ...f, program_id: "", classroom_id: "" }));
            setMatrix([]); setSessionDatesISO({}); setRemarksByKey({});
        }
        if (name === "program_id") {
            setForm((f) => ({ ...f, classroom_id: "" }));
            setMatrix([]); setSessionDatesISO({}); setRemarksByKey({});
        }
        if (name === "classroom_id") {
            setMatrix([]); setSessionDatesISO({}); setRemarksByKey({});
            setEditingSession(null);
            setActiveSession(1);
        }
    };

    /* --------------- Load dates + matrix --------------- */
    useEffect(() => {
        if (!form.classroom_id) return;
        (async () => {
            setLoading(true); setError(null);
            const [datesRes, matrixRes] = await Promise.all([
                supabase.rpc("get_class_session_dates", { p_classroom: form.classroom_id }),
                supabase.rpc("get_class_attendance_matrix", { p_classroom: form.classroom_id }),
            ]);
            setLoading(false);

            if (datesRes.error) setError(datesRes.error.message);
            else {
                const iso: Record<number, string> = {};
                // FIX: Type definition for row
                (datesRes.data ?? []).forEach((row: { session_no: number; scheduled_date: string }) => {
                    if (row.scheduled_date) iso[row.session_no] = row.scheduled_date;
                });
                setSessionDatesISO(iso);

                // choose first session with a date, else 1
                const firstWithDate = SESSIONS.find((n) => !!iso[n]) ?? 1;
                setActiveSession(firstWithDate as SessionNo);
            }

            if (matrixRes.error) { setError(matrixRes.error.message); setMatrix([]); }
            else {
                // FIX: Type assertion for matrix data
                const rows = (matrixRes.data ?? []).map((r: Record<string, unknown>) => ({
                    ...r,
                    s1: (r.s1 ?? "unmarked"),
                    s2: (r.s2 ?? "unmarked"),
                    s3: (r.s3 ?? "unmarked"),
                    s4: (r.s4 ?? "unmarked"),
                    s5: (r.s5 ?? "unmarked"),
                    s6: (r.s6 ?? "unmarked"),
                    s7: (r.s7 ?? "unmarked"),
                    s8: (r.s8 ?? "unmarked"),
                    s9: (r.s9 ?? "unmarked"),
                    s10: (r.s10 ?? "unmarked"),
                    s11: (r.s11 ?? "unmarked"),
                })) as MatrixRow[];
                setMatrix(rows);
            }
        })();
    }, [form.classroom_id]);

    /* --------------- Header date editing --------------- */
    const startEdit = (n: number) => {
        if (!form.classroom_id) return;
        setEditingSession(n);
        setDateDraft(sessionDatesISO[n] ?? new Date().toISOString().slice(0, 10));
    };

    const saveHeaderDate = async (n: number) => {
        if (!form.classroom_id || !dateDraft) { setEditingSession(null); return; }
        const { error } = await supabase.rpc("set_class_session_date", {
            _classroom: form.classroom_id,
            _session_no: n,
            _date: dateDraft,
        });
        if (error) { setError(error.message); return; }
        setSessionDatesISO((m) => ({ ...m, [n]: dateDraft }));
        setEditingSession(null);
    };

    /* --------------- Save a cell --------------- */
    const saveCell = async (studentId: string, sessionNo: number, newStatus: Status, remark?: string) => {
        if (!form.classroom_id) return;

        // must have a date first
        if (!sessionDatesISO[sessionNo]) {
            startEdit(sessionNo);
            setError(`Please set a date for Session ${sessionNo} first.`);
            return;
        }

        // optimistic update
        // FIX: Safe key assignment using keyof
        const key = `s${sessionNo}` as keyof MatrixRow;
        setMatrix((rows) =>
            rows.map((r) =>
                r.student_id === studentId ? ({ ...r, [key]: newStatus } as MatrixRow) : r
            )
        );

        setSaving(true);
        const { error } = await supabase.rpc("mark_attendance_session", {
            _classroom: form.classroom_id,
            _student: studentId,
            _session_no: sessionNo,
            _date: null, // header date
            _status: newStatus === "unmarked" ? null : newStatus,
            _remarks: remark ?? null,
        });
        setSaving(false);

        const k_key = keyFor(studentId, sessionNo);
        if (error) {
            // revert on error
            setMatrix((rows) =>
                rows.map((r) =>
                    r.student_id === studentId ? ({ ...r, [key]: "unmarked" } as MatrixRow) : r
                )
            );
            setError(error.message);
        } else {
            setRemarksByKey((m) => {
                const next = { ...m };
                if (remark) next[k_key] = remark; else delete next[k_key];
                return next;
            });
        }
    };

    /* --------------- Bulk actions (current session) --------------- */
    const bulkMarkAll = (status: Status) => {
        const n = activeSession;
        const key = `s${n}` as keyof MatrixRow;
        // FIX: Cast to MatrixRow
        const rows = matrix.map((r) => ({ ...r, [key]: status } as MatrixRow));
        setMatrix(rows);
        // fire-and-forget saves
        rows.forEach((r) => {
            void saveCell(r.student_id, n, r[key] as Status);
        });
    };

    const bulkClear = () => bulkMarkAll("unmarked");

    const bulkCopyLastSession = () => {
        const n = activeSession;
        if (n <= 1) return;
        const copyFrom = (n - 1) as SessionNo;
        const targetKey = `s${n}` as keyof MatrixRow;
        const sourceKey = `s${copyFrom}` as keyof MatrixRow;

        // FIX: Cast to MatrixRow and safe key access
        const rows = matrix.map((r) => ({ ...r, [targetKey]: r[sourceKey] } as MatrixRow));
        setMatrix(rows);
        rows.forEach((r) => {
            void saveCell(r.student_id, n, r[targetKey] as Status);
        });
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center" scrollBehavior="inside">
            <ModalContent className="dark text-foreground bg-background w-full sm:w-[1080px] max-w-[96vw] p-0">
                {() => (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-default-100">
                            <div className="text-sm font-semibold">Attendance — {form.classroom_id ? "" : "Choose a class"}</div>
                            {saving && <span className="text-xs opacity-70 inline-flex items-center gap-1"><Spinner size="sm" /> Saving…</span>}
                            <div className="ml-auto flex items-center gap-3">
                                <span className="text-xs opacity-70">Total ✓: <b>{totalPresent}</b></span>
                                {/* <Switch ... /> removed */}
                            </div>
                        </div>

                        <ModalBody className="px-4 py-4">
                            {/* Selection row (simplified but same data) */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 bg-default-100 p-4 rounded-xl shadow-sm">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-default-500">Branch</label>
                                    <select
                                        name="branch_id"
                                        value={form.branch_id}
                                        onChange={handleField}
                                        className="h-10 w-full rounded-md border border-default-300 bg-default-50 px-3 text-sm"
                                    >
                                        <option value="">Select Branch</option>
                                        {branches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-default-500">Program</label>
                                    <select
                                        name="program_id"
                                        value={form.program_id}
                                        onChange={handleField}
                                        disabled={!form.branch_id}
                                        className="h-10 w-full rounded-md border border-default-300 bg-default-50 px-3 text-sm disabled:opacity-60"
                                    >
                                        <option value="">Select Program</option>
                                        {/* FIX: Removed unnecessary 'as any' */}
                                        {filteredPrograms.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-default-500">Class</label>
                                    <select
                                        name="classroom_id"
                                        value={form.classroom_id}
                                        onChange={handleField}
                                        disabled={!form.program_id}
                                        className="h-10 w-full rounded-md border border-default-300 bg-default-50 px-3 text-sm disabled:opacity-60"
                                    >
                                        <option value="">Select Classroom</option>
                                        {filteredClassrooms.map((c) => (<option key={c.id} value={c.id}>{c.class_name}</option>))}
                                    </select>
                                </div>
                            </div>

                            {/* Session chips + bulk actions */}
                            {form.classroom_id && (
                                <div className="mt-4 rounded-xl border border-default-100">
                                    <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-default-50/40">
                                        <div className="text-xs font-semibold mr-1">Sessions:</div>
                                        <div className="flex gap-2 overflow-x-auto">
                                            {SESSIONS.map((n) => (
                                                <div key={n} className="min-w-[84px]">
                                                    {editingSession === n ? (
                                                        <input
                                                            type="date"
                                                            className="h-8 w-full rounded-md border border-default-300 bg-default-50 px-2 text-xs"
                                                            value={dateDraft}
                                                            onChange={(e) => setDateDraft(e.target.value)}
                                                            onBlur={() => saveHeaderDate(n)}
                                                            onKeyDown={(e) => { if (e.key === "Enter") saveHeaderDate(n); if (e.key === "Escape") setEditingSession(null); }}
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <button
                                                            className={`w-full rounded-md border px-2 py-1 text-xs transition ${
                                                                activeSession === n ? "bg-primary text-white border-primary" : "bg-default-100 border-default-200 hover:bg-default-200"
                                                            }`}
                                                            onClick={() => setActiveSession(n as SessionNo)}
                                                            onDoubleClick={() => startEdit(n)}
                                                            title="Double-click to set date"
                                                        >
                                                            {formatLabel(sessionDatesISO[n]) || `S${n}`}
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="ml-auto flex items-center gap-2">
                                            <Tooltip content="Set all in this session to Present">
                                                <Button size="sm" color="success" onPress={() => bulkMarkAll("present")} variant="flat">Mark all P</Button>
                                            </Tooltip>
                                            <Tooltip content="Copy statuses from previous session">
                                                <Button size="sm" variant="flat" onPress={bulkCopyLastSession} isDisabled={activeSession === 1}>
                                                    Copy last
                                                </Button>
                                            </Tooltip>
                                            <Tooltip content="Clear statuses for this session">
                                                <Button size="sm" variant="flat" onPress={bulkClear}>Clear</Button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Content */}
                            {!form.classroom_id && <div className="px-1 pt-4 text-sm opacity-70">Select Program & Classroom to load students.</div>}
                            {form.classroom_id && loading && (
                                <div className="px-1 pt-6 pb-8 flex items-center gap-2 text-sm opacity-70">
                                    <Spinner size="sm" /> Loading…
                                </div>
                            )}

                            {form.classroom_id && !loading && matrix.length > 0 && (
                                <>
                                    {viewMode === "quick" ? (
                                        <div className="mt-3 rounded-xl border border-default-100 overflow-hidden">
                                            <div className="max-h-[60vh] overflow-auto">
                                                {matrix.map((row) => {
                                                    // FIX: Safe key access
                                                    const key = `s${activeSession}` as keyof MatrixRow;
                                                    const s = row[key] as Status;
                                                    return (
                                                        <div key={row.student_id} className="flex items-center justify-between px-3 py-2 border-b border-default-100">
                                                            <div className="text-sm">{row.first_name} {row.last_name}</div>
                                                            <StatusPill
                                                                value={s}
                                                                onCycle={() => {
                                                                    const next = nextStatus(s);
                                                                    // Optional remark for Absent
                                                                    let remark: string | undefined;
                                                                    if (next === "absent") {
                                                                        remark = window.prompt("Permission remark (optional):", "") ?? undefined;
                                                                    }
                                                                    void saveCell(row.student_id, activeSession, next, remark);
                                                                }}
                                                                size={40}
                                                                title="Tap to cycle P → A → L → •"
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-3 rounded-xl border border-default-100 overflow-hidden">
                                            <div className="w-full overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="sticky top-0 bg-background z-10">
                                                    <tr>
                                                        <th className="text-left p-2 sticky left-0 bg-background z-20">Student</th>
                                                        {SESSIONS.map((n) => (
                                                            <th key={n} className="p-1 text-center min-w-24">
                                                                <button
                                                                    className={`w-full rounded-md border px-2 py-1 text-xs ${activeSession === n ? "bg-primary text-white border-primary" : "bg-default-100 border-default-200 hover:bg-default-200"}`}
                                                                    onClick={() => setActiveSession(n as SessionNo)}
                                                                    onDoubleClick={() => startEdit(n)}
                                                                    title="Double-click to set date"
                                                                >
                                                                    {formatLabel(sessionDatesISO[n]) || `S${n}`}
                                                                </button>
                                                            </th>
                                                        ))}
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {matrix.map((row) => (
                                                        <tr key={row.student_id} className="border-t border-default-100">
                                                            <td className="p-2 sticky left-0 bg-background z-10 whitespace-nowrap">
                                                                {row.first_name} {row.last_name}
                                                            </td>
                                                            {SESSIONS.map((n) => {
                                                                // FIX: Safe key access
                                                                const key = `s${n}` as keyof MatrixRow;
                                                                const s = row[key] as Status;
                                                                const k = keyFor(row.student_id, n);
                                                                return (
                                                                    <td key={n} className="p-1 text-center">
                                                                        <div className="inline-flex items-center gap-2">
                                                                            <StatusPill
                                                                                value={s}
                                                                                size={32}
                                                                                onCycle={() => {
                                                                                    const next = nextStatus(s);
                                                                                    let remark: string | undefined;
                                                                                    if (next === "absent") remark = window.prompt("Permission remark (optional):", "") ?? undefined;
                                                                                    void saveCell(row.student_id, n, next, remark);
                                                                                }}
                                                                            />
                                                                            {remarksByKey[k] && (
                                                                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-default-600" title={remarksByKey[k]} />
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {form.classroom_id && !loading && matrix.length === 0 && (
                                <div className="px-3 py-6 text-sm opacity-70">No students found for this classroom.</div>
                            )}

                            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
                        </ModalBody>

                        {/* Footer */}
                        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-default-100">
                            <div className="text-xs opacity-70">
                                Legend: <span className="inline-block mx-1 rounded px-2 py-[2px] text-white bg-green-600">P</span>
                                Present • <span className="inline-block mx-1 rounded px-2 py-[2px] text-white bg-red-600">A</span>
                                Absent • <span className="inline-block mx-1 rounded px-2 py-[2px] text-white bg-amber-500">L</span>
                                Late
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="bordered" radius="full" onPress={handleClose}>Close</Button>
                                <Button color="primary" radius="full" onPress={() => { onSuccess?.(); onClose(); }} isDisabled={!form.classroom_id}>
                                    Done
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}