"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabaseClient";
import {
    Button,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import ManageStudentsModal from "../modal/manage-student";

/* ---------------- Types ---------------- */
type Branch = { id: string; name: string };
type Program = { id: string; name: string; branch_id: string };

type Classroom = {
    id: string;
    class_name: string;
    scheduled_day: string;
    start_time: string; // "HH:mm:ss"
    end_time: string;   // "HH:mm:ss"
    status: string;     // "active" | "archived"
    program_id: string; // <-- added for filtering
};

/* --------------- Data fetchers --------------- */
const fetchClassrooms = async (): Promise<Classroom[]> => {
    const { data, error } = await supabase.rpc("get_all_classrooms");
    if (error) throw error;
    // ensure program_id is present as string
    // FIX: Replaced 'any' with specific object structure
    return (data ?? []).map((x: {
        id: string;
        class_name: string;
        scheduled_day: string;
        start_time: string;
        end_time: string;
        status: string;
        program_id: string | number
    }) => ({
        id: x.id,
        class_name: x.class_name,
        scheduled_day: x.scheduled_day,
        start_time: x.start_time,
        end_time: x.end_time,
        status: x.status,
        program_id: String(x.program_id),
    })) as Classroom[];
};

const fetchBranches = async (): Promise<Branch[]> => {
    const { data, error } = await supabase.rpc("get_all_branches");
    if (error) throw error;
    return (data ?? []) as Branch[];
};

const fetchPrograms = async (): Promise<Program[]> => {
    const { data, error } = await supabase.rpc("get_all_programs");
    if (error) throw error;
    return (data ?? []) as Program[];
};

const fetchEnrollmentCounts = async (
    classroomIds: string[]
): Promise<Record<string, number>> => {
    if (!classroomIds.length) return {};
    const entries = await Promise.all(
        classroomIds.map(async (id) => {
            const { data, error } = await supabase.rpc("get_classroom_enrollments", {
                p_classroom: id,
            });
            if (error) {
                console.warn("get_classroom_enrollments failed for", id, error);
                return [id, 0] as const;
            }
            // FIX: Replaced 'any' with { status: string }
            const count = (data ?? []).filter((row: { status: string }) => row.status === "active").length;
            return [id, count] as const;
        })
    );
    return Object.fromEntries(entries);
};

function formatTime(t: string) {
    const [hh, mm] = t.split(":");
    const d = new Date();
    d.setHours(Number(hh), Number(mm || 0), 0, 0);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/* ---------------- Component ---------------- */
export default function ClassroomCard() {
    const queryClient = useQueryClient();
    const [manageCls, setManageCls] = useState<Classroom | null>(null);

    /** Meta lists */
    const { data: branches = [] } = useQuery({
        queryKey: ["branches"],
        queryFn: fetchBranches,
        staleTime: 5 * 60 * 1000,
    });
    const { data: programs = [] } = useQuery({
        queryKey: ["programs"],
        queryFn: fetchPrograms,
        staleTime: 5 * 60 * 1000,
    });

    /** Filters */
    const [branchId, setBranchId] = useState<string>("");
    const [programId, setProgramId] = useState<string>("");
    const [query, setQuery] = useState("");

    /** Classrooms */
    const {
        data: classrooms = [],
        isLoading: loadingClassrooms,
        error: classroomsError,
    } = useQuery({
        queryKey: ["classrooms"],
        queryFn: fetchClassrooms,
        staleTime: 5 * 60 * 1000,
    });

    /** Apply filters */
    const programsInBranch = useMemo(
        () => programs.filter((p) => !branchId || String(p.branch_id) === String(branchId)),
        [programs, branchId]
    );

    const visibleClassrooms = useMemo(() => {
        let list = classrooms;
        if (programId) {
            list = list.filter((c) => String(c.program_id) === String(programId));
        } else if (branchId) {
            const pids = new Set(programsInBranch.map((p) => String(p.id)));
            list = list.filter((c) => pids.has(String(c.program_id)));
        }
        if (query.trim()) {
            const q = query.trim().toLowerCase();
            list = list.filter((c) => c.class_name.toLowerCase().includes(q));
        }
        return list;
    }, [classrooms, programId, branchId, programsInBranch, query]);

    /** Enrollment counts only for visible cards */
    const classroomIds = visibleClassrooms.map((c) => c.id);
    const {
        data: counts = {},
        isLoading: loadingCounts,
        error: countsError,
    } = useQuery({
        queryKey: ["classroom-enrollment-counts", classroomIds],
        queryFn: () => fetchEnrollmentCounts(classroomIds),
        enabled: classroomIds.length > 0,
        staleTime: 60 * 1000,
    });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ["classrooms"] });
        queryClient.invalidateQueries({ queryKey: ["classroom-enrollment-counts"] });
    };

    const archiveClassroom = async (id: string) => {
        const { error } = await supabase
            .schema("academic")
            .from("classroom")
            .update({ status: "archived" })
            .eq("id", id);
        if (error) return alert(error.message);
        refresh();
    };

    const deleteClassroom = async (id: string) => {
        if (!confirm("Delete this classroom permanently?")) return;
        const { error } = await supabase
            .schema("academic")
            .from("classroom")
            .delete()
            .eq("id", id);
        if (error) return alert(error.message);
        refresh();
    };

    const handleAction = async (key: string | number, cls: Classroom) => {
        switch (key) {
            case "manage":
                setManageCls(cls);
                break;
            case "archive":
                await archiveClassroom(cls.id);
                break;
            case "delete":
                await deleteClassroom(cls.id);
                break;
            default:
                break;
        }
    };

    if (loadingClassrooms) return <p>Loading classrooms…</p>;
    if (classroomsError) return <p className="text-red-500">Error loading classrooms</p>;
    if (countsError) console.warn("Failed to load enrollment counts:", countsError);

    return (
        <>
            <div className="mb-4 flex flex-wrap items-end gap-3">
                <div className="flex flex-col">
                    <label className="mb-1 text-xs font-semibold text-gray-400">Branch</label>
                    <select
                        value={branchId}
                        onChange={(e) => { setBranchId(e.target.value); setProgramId(""); }}
                        className="h-9 w-[220px] rounded-lg border border-default-200 bg-default-100 px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="">All Branches</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="mb-1 text-xs font-semibold text-gray-400">Program</label>
                    <select
                        value={programId}
                        onChange={(e) => setProgramId(e.target.value)}
                        className="h-9 w-[220px] rounded-lg border border-default-200 bg-default-100 px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="">All Programs</option>
                        {programsInBranch.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="mb-1 text-xs font-semibold text-gray-400">Search</label>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Classroom name…"
                        className="h-9 w-[220px] rounded-lg border border-default-200 bg-default-100 px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>
            {visibleClassrooms.length === 0 ? (
                <p className="text-default-500">No classrooms match your filters.</p>
            ) : (
                <div className="grid grid-cols-12 gap-6">
                    {visibleClassrooms.map((cls) => {
                        const studentCount = (counts as Record<string, number>)[cls.id] ?? 0;

                        return (
                            <div
                                key={cls.id}
                                className="relative col-span-12 max-w-sm sm:col-span-6 lg:col-span-4 rounded-lg border p-4 shadow-lg"
                            >
                                <div className="absolute right-2 top-2">
                                    <Dropdown>
                                        <DropdownTrigger>
                                            <Button isIconOnly size="sm" variant="light" aria-label="More actions">
                                                <Icon icon="solar:menu-dots-bold" width={18} />
                                            </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu aria-label="Classroom actions" onAction={(key) => handleAction(key, cls)}>
                                            <DropdownItem
                                                key="manage"
                                                startContent={<Icon icon="solar:users-group-rounded-linear" width={16} />}
                                            >
                                                Manage students
                                            </DropdownItem>
                                            <DropdownItem
                                                key="archive"
                                                startContent={<Icon icon="solar:archive-minimalistic-linear" width={16} />}
                                            >
                                                Archive
                                            </DropdownItem>
                                            <DropdownItem
                                                key="delete"
                                                className="text-danger"
                                                startContent={<Icon icon="solar:trash-bin-minimalistic-2-linear" width={16} />}
                                            >
                                                Delete
                                            </DropdownItem>
                                        </DropdownMenu>
                                    </Dropdown>
                                </div>
                                <h3 className="mb-1 text-2xl font-bold">{cls.class_name}</h3>

                                <div className="mb-3 flex items-center gap-2">
                  <span className="mr-2 inline-flex items-center rounded-full bg-red-500 px-3 py-0.5 text-xs font-bold text-white">
                    <Icon icon="solar:users-group-rounded-linear" width={20} />
                      {loadingCounts ? "…" : `${studentCount}`}
                  </span>
                                    <p className="font-mono text-xs text-default-500">
                                        {cls.scheduled_day} · {formatTime(cls.start_time)} – {formatTime(cls.end_time)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {manageCls && (
                <ManageStudentsModal
                    isOpen={!!manageCls}
                    classroom={manageCls}
                    onClose={() => setManageCls(null)}
                    onChanged={refresh}
                />
            )}
        </>
    );
}