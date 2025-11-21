"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../../../lib/supabaseClient";
const supabase = createClient();
function Modal({
                   open,
                   onClose,
                   title,
                   children,
                   widthClass = "max-w-3xl",
               }: {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    widthClass?: string;
}) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);
    if (!mounted || !open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100]">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div
                    className={`w-full ${widthClass} max-h-[85vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950/95 shadow-2xl`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800/70 bg-zinc-950/95 px-5 py-4">
                        <h2 className="text-lg font-semibold text-white">{title ?? "Modal"}</h2>
                        <button
                            aria-label="Close"
                            onClick={onClose}
                            className="rounded-lg px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="px-5 py-4">{children}</div>
                </div>
            </div>
        </div>,
        document.body
    );
}

/* ========== Types (align with your RPCs) ========== */
type Branch = { id: string; name: string };
type Program = { id: string; name: string; branch_id: string };
type Student = {
    id: string;
    first_name: string;
    last_name: string;
    branch_id?: string;
    program_ids?: string[];
    program_names?: string[];
};
type Classroom = {
    id: string;
    class_name?: string;
    room_name?: string;
    name?: string;
    program_id?: string | number;
    program_name?: string;
    program?: { id?: string | number; name?: string };
    branch_id?: string | number; // might not exist from your RPC; filtering uses program_id
    start_time?: string;
    end_time?: string;
    weekday?: string;
};

/* ========== RPC fetchers ========== */
const fetchBranches = async (): Promise<Branch[]> => {
    const { data, error } = await supabase.rpc("get_all_branches");
    if (error) throw new Error(error.message);
    return data ?? [];
};
const fetchPrograms = async (): Promise<Program[]> => {
    const { data, error } = await supabase.rpc("get_all_programs");
    if (error) throw new Error(error.message);
    return data ?? [];
};
const fetchStudents = async (): Promise<Student[]> => {
    const { data, error } = await supabase.rpc("get_all_student");
    if (error) throw new Error(error.message);
    return data ?? [];
};
const fetchClassrooms = async (): Promise<Classroom[]> => {
    const { data, error } = await supabase.rpc("get_all_classrooms");
    if (error) throw new Error(error.message);
    return data ?? [];
};

function classNames(...cls: Array<string | false | undefined>) {
    return cls.filter(Boolean).join(" ");
}

/* ========== The form content placed inside the modal ========== */
function EnrollmentForm({ onClose }: { onClose: () => void }) {
    const queryClient = useQueryClient();

    // Queries
    const { data: branches = [], isLoading: loadingBranches } = useQuery({
        queryKey: ["branches"],
        queryFn: fetchBranches,
    });
    const { data: programs = [], isLoading: loadingPrograms } = useQuery({
        queryKey: ["programs"],
        queryFn: fetchPrograms,
    });
    const { data: students = [], isLoading: loadingStudents } = useQuery({
        queryKey: ["students"],
        queryFn: fetchStudents,
    });
    const { data: classrooms = [], isLoading: loadingClassrooms } = useQuery({
        queryKey: ["classrooms"],
        queryFn: fetchClassrooms,
    });

    // State
    const [branchId, setBranchId] = useState("");
    const [programId, setProgramId] = useState("");
    const [classroomId, setClassroomId] = useState("");
    const [studentId, setStudentId] = useState(""); // single mode
    const [isMulti, setIsMulti] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [studentSearch, setStudentSearch] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Derived
    const filteredPrograms = useMemo(
        () => programs.filter((p) => String(p.branch_id) === String(branchId)),
        [programs, branchId]
    );
    const selectedProgram = useMemo(
        () => programs.find((p) => String(p.id) === String(programId)),
        [programs, programId]
    );
    const selectedProgramName = selectedProgram?.name ?? "";

    const filteredStudents = useMemo(() => {
        return students.filter((s) => {
            const inBranch = !s.branch_id || String(s.branch_id) === String(branchId);
            if (!programId) return inBranch;
            if (Array.isArray(s.program_ids)) {
                return inBranch && s.program_ids.includes(programId);
            }
            const names = Array.isArray(s.program_names) ? s.program_names : [];
            return inBranch && !!selectedProgramName && names.includes(selectedProgramName);
        });
    }, [students, branchId, programId, selectedProgramName]);

    const visibleStudents = useMemo(() => {
        const q = studentSearch.toLowerCase().trim();
        if (!q) return filteredStudents;
        return filteredStudents.filter((s) =>
            `${s.first_name} ${s.last_name}`.toLowerCase().includes(q)
        );
    }, [filteredStudents, studentSearch]);

    // 🔹 Classrooms filtered by Program (and Branch if Program not chosen yet)
    const filteredClassrooms = useMemo(() => {
        if (programId) {
            return classrooms.filter(
                (c) => String(c.program_id) === String(programId)
            );
        }
        if (branchId) {
            const programIdsInBranch = new Set(
                programs
                    .filter((p) => String(p.branch_id) === String(branchId))
                    .map((p) => String(p.id))
            );
            return classrooms.filter((c) =>
                programIdsInBranch.has(String(c.program_id))
            );
        }
        return classrooms;
    }, [classrooms, programs, branchId, programId]);

    // Multi helpers
    const toggleStudent = (id: string) =>
        setSelectedStudentIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    const selectAllVisible = () => setSelectedStudentIds(visibleStudents.map((s) => s.id));
    const clearSelection = () => setSelectedStudentIds([]);

    // Submit
    const canSubmit = isMulti
        ? Boolean(classroomId && selectedStudentIds.length && !submitting)
        : Boolean(classroomId && studentId && !submitting);

    const classroomLabel = (c: Classroom) =>
        c.class_name || c.room_name || c.name || `Classroom ${c.id}`;

    const handleEnroll = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        try {
            if (isMulti) {
                const { error } = await supabase.rpc("enroll_students_to_classroom", {
                    p_classroom: classroomId,
                    p_students: selectedStudentIds,
                });
                if (error) {
                    // fallback: single RPC in parallel
                    await Promise.all(
                        selectedStudentIds.map((id) =>
                            supabase.rpc("enroll_student_to_classroom", {
                                p_student: id,
                                p_classroom: classroomId,
                            })
                        )
                    );
                }
            } else {
                const { error } = await supabase.rpc("enroll_student_to_classroom", {
                    p_student: studentId,
                    p_classroom: classroomId,
                });
                if (error) throw error;
            }

            // success
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["students"] }),
                queryClient.invalidateQueries({ queryKey: ["classrooms"] }),
                queryClient.invalidateQueries({ queryKey: ["classroom-enrollment-counts"] }),
            ]);
            alert("Enrollment complete!");
            onClose();
        } catch (e: unknown) { // FIX: Replaced 'any' with 'unknown'
            // FIX: Safe access to error message
            const msg = e instanceof Error ? e.message : String(e);
            alert(`Enrollment failed: ${msg}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="grid gap-6 sm:grid-cols-2">
            {/* Selectors */}
            <div className="space-y-4">
                {/* Branch */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-200">Select Branch</label>
                    <select
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        value={branchId}
                        onChange={(e) => {
                            setBranchId(e.target.value);
                            // reset downstream
                            setProgramId("");
                            setStudentId("");
                            setSelectedStudentIds([]);
                            setClassroomId("");
                        }}
                        disabled={loadingBranches}
                    >
                        <option value="">-- Choose Branch --</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Program */}
                <div className={classNames(!branchId && "opacity-50 pointer-events-none")}>
                    <label className="mb-2 block text-sm font-medium text-zinc-200">Select Program</label>
                    <select
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        value={programId}
                        onChange={(e) => {
                            setProgramId(e.target.value);
                            // reset downstream
                            setStudentId("");
                            setSelectedStudentIds([]);
                            setClassroomId("");
                        }}
                        disabled={!branchId || loadingPrograms}
                    >
                        <option value="">-- Choose Program --</option>
                        {filteredPrograms.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Students */}
                <div className={classNames(!programId && "opacity-50 pointer-events-none")}>
                    <div className="mb-1 flex items-center justify-between">
                        <label className="block text-sm font-medium text-zinc-200">
                            Select Student{isMulti ? "s" : ""}
                        </label>
                        <label className="flex items-center gap-2 text-xs text-zinc-400">
                            <input
                                type="checkbox"
                                className="h-4 w-4 accent-blue-600"
                                checked={isMulti}
                                onChange={(e) => {
                                    const next = e.target.checked;
                                    setIsMulti(next);
                                    if (next) setStudentId("");
                                    else setSelectedStudentIds([]);
                                }}
                                disabled={!programId || loadingStudents}
                            />
                            Multi-select
                        </label>
                    </div>

                    <input
                        type="text"
                        placeholder="Search student name..."
                        className="mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        disabled={!programId || loadingStudents}
                    />

                    {!isMulti ? (
                        <select
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            disabled={!programId || loadingStudents}
                        >
                            <option value="">-- Choose Student --</option>
                            {visibleStudents.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.first_name} {s.last_name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <>
                            <div className="mb-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={selectAllVisible}
                                    className="rounded-lg bg-zinc-800 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-700"
                                >
                                    Select all ({visibleStudents.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    className="rounded-lg bg-zinc-800 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-700"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="max-h-60 overflow-auto rounded-xl border border-zinc-800">
                                {visibleStudents.map((s) => (
                                    <label key={s.id} className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-800/40">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 accent-blue-600"
                                            checked={selectedStudentIds.includes(s.id)}
                                            onChange={() => toggleStudent(s.id)}
                                        />
                                        <span className="text-sm text-zinc-100">
                      {s.first_name} {s.last_name}
                    </span>
                                    </label>
                                ))}
                                {visibleStudents.length === 0 && (
                                    <div className="px-3 py-6 text-sm text-zinc-500">No students match.</div>
                                )}
                            </div>
                            {selectedStudentIds.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {selectedStudentIds.map((id) => {
                                        const st = students.find((x) => x.id === id);
                                        if (!st) return null;
                                        return (
                                            <span
                                                key={id}
                                                className="inline-flex items-center gap-2 rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-100"
                                            >
                        {st.first_name} {st.last_name}
                                                <button onClick={() => toggleStudent(id)} className="text-zinc-400 hover:text-white">
                          ×
                        </button>
                      </span>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Classroom (filtered by Program/Branch) */}
                <div className={classNames(!programId && "opacity-50 pointer-events-none")}>
                    <label className="mb-2 block text-sm font-medium text-zinc-200">Select Classroom</label>
                    <select
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        value={classroomId}
                        onChange={(e) => setClassroomId(e.target.value)}
                        disabled={!programId || loadingClassrooms}
                    >
                        <option value="">-- Choose Classroom --</option>
                        {filteredClassrooms.map((c) => (
                            <option key={c.id} value={c.id}>
                                {classroomLabel(c)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary & actions */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <h3 className="mb-3 text-sm font-semibold text-zinc-200">Summary</h3>
                <ul className="space-y-2 text-sm text-zinc-100">
                    <li>
                        <span className="text-zinc-400">Branch: </span>
                        {branches.find((b) => String(b.id) === String(branchId))?.name ?? (
                            <em className="text-zinc-500">not selected</em>
                        )}
                    </li>
                    <li>
                        <span className="text-zinc-400">Program: </span>
                        {selectedProgram?.name ?? <em className="text-zinc-500">not selected</em>}
                    </li>
                    <li>
                        <span className="text-zinc-400">Students: </span>
                        {isMulti
                            ? selectedStudentIds.length
                                ? `${selectedStudentIds.length} selected`
                                : <em className="text-zinc-500">not selected</em>
                            : studentId
                                ? (() => {
                                    const s = students.find((x) => x.id === studentId);
                                    return s ? `${s.first_name} ${s.last_name}` : studentId;
                                })()
                                : <em className="text-zinc-500">not selected</em>}
                    </li>
                    <li>
                        <span className="text-zinc-400">Classroom: </span>
                        {classroomId
                            ? (() => {
                                const c = classrooms.find((x) => x.id === classroomId);
                                return c ? classroomLabel(c) : classroomId;
                            })()
                            : <em className="text-zinc-500">not selected</em>}
                    </li>
                </ul>

                <div className="mt-4 flex gap-2">
                    <button
                        onClick={onClose}
                        className="w-1/3 rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleEnroll}
                        disabled={!canSubmit}
                        className={classNames(
                            "w-2/3 rounded-xl px-4 py-2 text-sm font-semibold",
                            canSubmit ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-zinc-800 text-zinc-500"
                        )}
                    >
                        {submitting ? "Enrolling…" : "Enroll Student(s)"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ========== Button that opens the modal ========== */
export default function AddEnrollmentModalButton({
                                                     buttonClassName = "rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700",
                                                     children,
                                                 }: {
    buttonClassName?: string;
    children?: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button className={buttonClassName} onClick={() => setOpen(true)} type="button">
                {children ?? "Enroll Student(s)"}
            </button>

            <Modal open={open} onClose={() => setOpen(false)} title="Enroll Student(s)">
                <EnrollmentForm onClose={() => setOpen(false)} />
            </Modal>
        </>
    );
}