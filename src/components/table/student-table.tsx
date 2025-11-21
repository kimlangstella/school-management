"use client";

import { Image, Selection, SortDescriptor } from "@heroui/react";
import type { Key } from "@react-types/shared";

import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Input,
    Button,
    RadioGroup,
    Radio,
    Chip,
    User,
    Pagination,
    Divider,
    Tooltip,
    useButton,
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@heroui/react";
import { SearchIcon } from "@heroui/shared-icons";
import React, {
    useMemo,
    useRef,
    useCallback,
    useState,
    useEffect,
} from "react";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/react";

import { CopyText } from "../icon/copy-text";
import { EyeFilledIcon } from "../icon/eye";
import { DeleteFilledIcon } from "../icon/delete";
import { ArrowDownIcon } from "../icon/arrow-down";
import { ArrowUpIcon } from "../icon/arrow-up";

import { useMemoizedCallback } from "../use-memoized-callback";

import { StatusStudentProp } from "../icon/StatusStudentProp";
import {
    columns,
    INITIAL_VISIBLE_COLUMNS,
    ColumnsKey,
    StatusStudent,
    Student,
    statusPaid,
} from "@/components/types/columns";
import { createClient } from "../../../lib/supabaseClient";
import nationalities from "@/components/types/nationalities";
import EditStudent from "../modal/edit-student";
import { EditLinearIcon } from "../icon/edit";
import AddStudent from "../modal/add-student";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Type for programs fetched via RPC
type ProgramData = {
    id: string;
    name: string;
    description: string;
    age: string;
    branch_id: string;
};

export default function StudentTable() {
    const supabase = createClient();
    const [filterValue, setFilterValue] = useState("");
    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
    const [visibleColumns, setVisibleColumns] = useState<Selection>(
        new Set(INITIAL_VISIBLE_COLUMNS)
    );
    const [rowsPerPage] = useState(20);
    const [page, setPage] = useState(1);

    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "name",
        direction: "ascending",
    });
    const [programFilter, setProgramFilter] = React.useState("all");

    const [workerTypeFilter, setWorkerTypeFilter] = React.useState("all");
    const [statusFilter, setStatusFilter] = React.useState("active");
    const [paymentStatusFilter, setPaymentStatusFilter] = React.useState("all");
    const [startDateFilter, setStartDateFilter] = React.useState("all");

    const PAGE_SIZE = 500;

    const fetchStudents = async () => {
        // FIX: 'const' instead of 'let', and typed as Student[] instead of any[]
        const all: Student[] = [];
        let offset = 0;

        for (;;) {
            const { data, error } = await supabase.rpc(
                "get_all_student_with_programs_offset",
                {
                    p_limit: PAGE_SIZE,
                    p_offset: offset,
                    p_status: null,
                    p_branch_id: null,
                }
            );

            if (error) throw new Error(error.message);

            const chunk = (data as Student[]) ?? [];
            all.push(...chunk);

            if (chunk.length < PAGE_SIZE) break;
            offset += chunk.length;
        }

        return all;
    };

    const fetchBranches = async () => {
        const { data, error } = await supabase.rpc("get_all_branches");
        if (error) throw new Error(error.message);
        return data;
    };

    const fetchPrograms = async () => {
        const { data, error } = await supabase.rpc("get_all_programs");
        if (error) throw new Error(error.message);
        return data as ProgramData[];
    };

    // Inside component
    const queryClient = useQueryClient();

    const {
        data: students,
        isLoading: studentsLoading,
        isError: studentsError,
        error: studentsErrorDetails,
    } = useQuery({
        queryKey: ["students"],
        queryFn: fetchStudents,
        staleTime: 0, // Always consider data stale to allow refetching
        cacheTime: 10 * 60 * 1000
    });

    const {
        // data: branches, // Unused in UI currently
        // Removed unused destructuring
    } = useQuery({
        queryKey: ["branches"],
        queryFn: fetchBranches,
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000
    });

    const {
        data: allPrograms,
        // Removed unused destructuring
    } = useQuery({
        queryKey: ["programs"],
        queryFn: fetchPrograms,
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });

    const handleDelete = async (id: string) => {
        const confirmDelete = window.confirm("Delete this student?");
        if (!confirmDelete) return;

        const { error } = await supabase.rpc("delete_student", { _id: id });

        if (error) {
            alert(`Error deleting student: ${error.message}`);
        } else {
            queryClient.invalidateQueries({ queryKey: ["students"] });
        }
    };

    const headerColumns = useMemo(() => {
        if (visibleColumns === "all") return columns;

        return columns
            .map((item) => {
                if (item.uid === sortDescriptor.column) {
                    return {
                        ...item,
                        sortDirection: sortDescriptor.direction,
                    };
                }

                return item;
            })
            .filter((column) => Array.from(visibleColumns).includes(column.uid));
    }, [visibleColumns, sortDescriptor]);

    const itemFilter = useCallback(
        (col: Student) => {
            const allBranch   = workerTypeFilter === "all";
            const allProgram  = programFilter === "all";
            const allStart    = startDateFilter === "all";
            const allStatus   = statusFilter === "all";
            const allPayment  = paymentStatusFilter === "all";

            // Branch match
            const branchMatch =
                allBranch || String(col.branch_id ?? "") === String(workerTypeFilter);
            const programMatch =
                allProgram ||
                (Array.isArray(col.program_names) &&
                    col.program_names.some(
                        (n: string) => (n ?? "").toLowerCase() === programFilter.toLowerCase()
                    ));

            // Status
            const statusMatch =
                allStatus ||
                (col.status ?? "").toString().toLowerCase() === statusFilter.toLowerCase();

            // Payment Status
            const paymentMatch =
                allPayment ||
                (() => {
                    const paymentStatus = (col.payment_status ?? "").toString().toLowerCase();
                    const normalizedPayment = paymentStatus === "paid" ? "paid" : "unpaid";
                    return normalizedPayment === paymentStatusFilter.toLowerCase();
                })();

            // Admission date
            const dateMatch =
                allStart ||
                new Date(
                    new Date().getTime() -
                    +(startDateFilter.match(/(\d+)(?=Days)/)?.[0] ?? 0) *
                    24 * 60 * 60 * 1000
                ) <= new Date(col.admission_date ?? 0);

            return branchMatch && programMatch && statusMatch && paymentMatch && dateMatch;
        },
        [workerTypeFilter, programFilter, statusFilter, paymentStatusFilter, startDateFilter]
    );

    // Reset branch when status changes
    useEffect(() => {
        setWorkerTypeFilter("all");
    }, [statusFilter]);

    // Reset program and payment status when status or branch changes
    useEffect(() => {
        setProgramFilter("all");
        setPaymentStatusFilter("all");
    }, [statusFilter, workerTypeFilter]);

    // Get branches filtered by status
    const branchOptionsForStatus = useMemo(() => {
        const safeStudents = Array.isArray(students) ? students : [];
        const statusFiltered = statusFilter === "all"
            ? safeStudents
            : safeStudents.filter(s => (s.status ?? "").toString().toLowerCase() === statusFilter.toLowerCase());
        
        // Get unique branch IDs from filtered students
        const branchIds = new Set(
            statusFiltered
                .map(s => s.branch_id)
                .filter(Boolean)
                .map(String)
        );
        
        // Return all branches if status is "all", otherwise only branches with students of that status
        if (statusFilter === "all") {
            return [
                { id: "all", name: "All" },
                { id: "873bea75-e6c4-4c32-b625-d11dd4221a57", name: "Funmall TK" },
                { id: "659308e2-436f-43d7-a258-5a30adeb55dc", name: "PengHout" },
                { id: "67610209-6fd3-46a4-98bb-199d7a7faf27", name: "OCIC" },
            ];
        }
        
        return [
            { id: "all", name: "All" },
            ...(branchIds.has("873bea75-e6c4-4c32-b625-d11dd4221a57") ? [{ id: "873bea75-e6c4-4c32-b625-d11dd4221a57", name: "Funmall TK" }] : []),
            ...(branchIds.has("659308e2-436f-43d7-a258-5a30adeb55dc") ? [{ id: "659308e2-436f-43d7-a258-5a30adeb55dc", name: "PengHout" }] : []),
            ...(branchIds.has("67610209-6fd3-46a4-98bb-199d7a7faf27") ? [{ id: "67610209-6fd3-46a4-98bb-199d7a7faf27", name: "OCIC" }] : []),
        ];
    }, [students, statusFilter]);

    // Get programs filtered by status and branch
    const programOptionsForBranch = useMemo(() => {
        const safeStudents = Array.isArray(students) ? students : [];
        const allProgramsList = Array.isArray(allPrograms) ? allPrograms : [];
        
        // First filter by status
        const statusFiltered = statusFilter === "all"
            ? safeStudents
            : safeStudents.filter(s => (s.status ?? "").toString().toLowerCase() === statusFilter.toLowerCase());
        
        // Then filter by branch
        const branchFiltered = workerTypeFilter === "all"
            ? statusFiltered
            : statusFiltered.filter(s => String(s.branch_id ?? "") === String(workerTypeFilter));
        
        // Get unique program names from filtered students
        const programNames = new Set<string>();
        branchFiltered.forEach(s => {
            if (Array.isArray(s.program_names)) {
                s.program_names.forEach(name => {
                    if (name && name.trim()) {
                        programNames.add(name.trim());
                    }
                });
            }
        });
        
        // If no filters, return all programs
        if (statusFilter === "all" && workerTypeFilter === "all") {
            return Array.from(new Set(allProgramsList.map(p => (p.name ?? "").trim()).filter(Boolean)));
        }
        
        // Return only programs that exist in the filtered students
        return Array.from(programNames);
    }, [allPrograms, statusFilter, workerTypeFilter, students]);

    const safeProgramFilter = useMemo(
        () => (programOptionsForBranch.includes(programFilter) ? programFilter : "all"),
        [programOptionsForBranch, programFilter]
    );

    // FIX: Added helper since it was missing in snippet but used in filter
    const getProgramNameById = useCallback((id: string) => {
        return allPrograms?.find(p => p.id === id)?.name ?? "";
    }, [allPrograms]);

    // Helper function to count students for a specific filter (respecting hierarchy)
    const countStudentsForFilter = useCallback((filterType: 'branch' | 'status' | 'program' | 'date' | 'payment', filterValue: string) => {
        const safeStudents = Array.isArray(students) ? students : [];
        return safeStudents.filter((student) => {
            // Status counts are independent - show all students regardless of other filters
            if (filterType === 'status') {
                if (filterValue === 'all') return true;
                return (student.status ?? "").toString().toLowerCase() === filterValue.toLowerCase();
            }
            
            // Branch filter (only if status matches or status is "all")
            if (filterType === 'branch') {
                if (statusFilter !== 'all') {
                    if ((student.status ?? "").toString().toLowerCase() !== statusFilter.toLowerCase()) {
                        return false;
                    }
                }
                if (filterValue === 'all') return true;
                return String(student.branch_id ?? "") === String(filterValue);
            }
            
            // Payment Status filter (only if status and branch match or are "all")
            if (filterType === 'payment') {
                if (statusFilter !== 'all') {
                    if ((student.status ?? "").toString().toLowerCase() !== statusFilter.toLowerCase()) {
                        return false;
                    }
                }
                if (workerTypeFilter !== 'all') {
                    if (String(student.branch_id ?? "") !== String(workerTypeFilter)) {
                        return false;
                    }
                }
                if (filterValue === 'all') return true;
                const paymentStatus = (student.payment_status ?? "").toString().toLowerCase();
                const normalizedPayment = paymentStatus === "paid" ? "paid" : "unpaid";
                return normalizedPayment === filterValue.toLowerCase();
            }
            
            // Program filter (only if status and branch match or are "all")
            if (filterType === 'program') {
                if (statusFilter !== 'all') {
                    if ((student.status ?? "").toString().toLowerCase() !== statusFilter.toLowerCase()) {
                        return false;
                    }
                }
                if (workerTypeFilter !== 'all') {
                    if (String(student.branch_id ?? "") !== String(workerTypeFilter)) {
                        return false;
                    }
                }
                if (filterValue === 'all') return true;
                return Array.isArray(student.program_names) &&
                    student.program_names.some((n: string) => (n ?? "").toLowerCase() === filterValue.toLowerCase());
            }
            
            if (filterType === 'date') {
                if (filterValue === 'all') return true;
                const now = Date.now();
                const days = filterValue === 'last7Days' ? 7 : filterValue === 'last30Days' ? 30 : 60;
                const cutoff = now - (days * 24 * 60 * 60 * 1000);
                return new Date(student.admission_date ?? 0).getTime() >= cutoff;
            }
            return true;
        }).length;
    }, [students, statusFilter, workerTypeFilter]);

    const filteredItems = useMemo(() => {
        const safeStudents = Array.isArray(students) ? students : [];
        let filteredUsers = [...safeStudents];

        if (filterValue) {
            const lowercased = filterValue.toLowerCase();

            filteredUsers = filteredUsers.filter((student) => {
                // FIX: Removed shadowed 'lowercased' variable definition here

                const firstName = (student.first_name ?? "").toString().toLowerCase();
                const email = (student.email ?? "").toString().toLowerCase();
                const gender = (student.gender ?? "").toString().toLowerCase();
                const phone = (student.phone ?? "").toString().toLowerCase();

                return (
                    firstName.includes(lowercased) ||
                    email.includes(lowercased) ||
                    gender.includes(lowercased) ||
                    phone.includes(lowercased) ||
                    (student.programs || []).some((id: string) =>
                        ((getProgramNameById(id) ?? "").toString().toLowerCase()).includes(lowercased)
                    )
                );
            });
        }

        return filteredUsers.filter(itemFilter);
    }, [filterValue, itemFilter, students, getProgramNameById]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);

    const sortedItems = useMemo(() => {
        const sortColumn: keyof Student =
            sortDescriptor.column === "gender"
                ? "gender_display" as keyof Student
                : (sortDescriptor.column as keyof Student);

        return [...items].sort((a: Student, b: Student) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let aValue = a[sortColumn] as any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let bValue = b[sortColumn] as any;

            if (Array.isArray(aValue)) aValue = aValue.join(", ");
            if (Array.isArray(bValue)) bValue = bValue.join(", ");

            let cmp: number;
            if (typeof aValue === "number" && typeof bValue === "number") {
                cmp = aValue - bValue;
            } else if (typeof aValue === "string" && typeof bValue === "string") {
                cmp = aValue.localeCompare(bValue);
            } else {
                cmp = String(aValue).localeCompare(String(bValue));
            }

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, items]);

    const filterSelectedKeys = useMemo(() => {
        if (selectedKeys === "all") return selectedKeys;
        let resultKeys = new Set<Key>();

        if (filterValue) {
            filteredItems.forEach((item) => {
                const stringId = String(item.id);

                if ((selectedKeys as Set<string>).has(stringId)) {
                    resultKeys.add(stringId);
                }
            });
        } else {
            resultKeys = selectedKeys;
        }

        return resultKeys;
    }, [selectedKeys, filteredItems, filterValue]);

    const eyesRef = useRef<HTMLButtonElement | null>(null);
    const deleteRef = useRef<HTMLButtonElement | null>(null);
    const { getButtonProps: getEyesProps } = useButton({ ref: eyesRef });
    const { getButtonProps: getDeleteProps } = useButton({ ref: deleteRef });

    const handleMemberClick = useMemoizedCallback(() => {
        setSortDescriptor({
            column: "memberInfo",
            direction:
                sortDescriptor.direction === "ascending" ? "descending" : "ascending",
        });
    });

    const getMemberInfoProps = useMemoizedCallback(() => ({
        onClick: handleMemberClick,
    }));

    const renderCell = useMemoizedCallback(
        (student: Student, columnKey: React.Key) => {
            const studentKey = columnKey as ColumnsKey;
            const cellValue = student[studentKey as keyof Student] as string;
            switch (studentKey) {
                case "gender":
                    return (
                        {
                            male: "Male",
                            female: "Female",
                            other: "Other",
                        }[cellValue?.toLowerCase()] ?? "Unknown"
                    );
                case "modified_by": {
                    return <Chip
                        className="rounded-xl bg-default-100 px-[6px] capitalize text-default-800"
                        size="sm"
                        variant="flat"
                    >
                        {student.modified_by_name || "Unknown"}
                    </Chip>;
                }
                case "created_by": {
                    return (
                        <Chip
                            className="rounded-xl bg-default-100 px-[6px] capitalize text-default-800"
                            size="sm"
                            variant="flat"
                        >
                            {student.created_by_name}
                        </Chip>
                    );
                }
                case "payment_status": {
                    const raw = (student.payment_status ?? "").toString().trim();
                    const normalized = raw.toLowerCase() as "paid" | "unpaid";

                    const chipColor =
                        normalized === "paid" ? "success" :
                            normalized === "unpaid" ? "danger" : "default";

                    return (
                        <Chip
                            size="sm"
                            variant="flat"
                            color={chipColor}
                            className="rounded-xl px-[6px] capitalize"
                            startContent={statusPaid[normalized] ?? null}
                        >
                            {raw || "Unknown"}
                        </Chip>
                    );
                }
                case "payment_end_date": {
                    return (
                        <Chip
                            className="rounded-xl bg-default-100 px-[6px] capitalize text-default-800"
                            size="sm"
                            variant="flat"
                        >
                            {student.payment_end_date}
                        </Chip>
                    );
                }
                case "payment_noted": {
                    return (
                        <Chip
                            className="rounded-xl bg-default-100 px-[6px] capitalize text-default-800"
                            size="sm"
                            variant="flat"
                        >
                            {student.payment_noted}
                        </Chip>
                    );
                }
                case "branch":
                    return (
                        <Chip
                            className="rounded-xl bg-default-100 px-[6px] capitalize text-default-800"
                            size="sm"
                            variant="flat"
                        >
                            {student.branch_name || "Unknown"}
                        </Chip>
                    );

                case "program":
                    return (
                        <Chip
                            className="rounded-xl bg-default-100 px-[6px] capitalize text-default-800"
                            size="sm"
                            variant="flat"
                        >
                            {Array.isArray(student.program_names) &&
                            student.program_names.length > 0
                                ? student.program_names.join(", ")
                                : "No Program"}
                        </Chip>
                    );

                case "date_of_birth":
                    return new Intl.DateTimeFormat("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    }).format(new Date(student.date_of_birth));

                case "status":
                    return <StatusStudentProp status={cellValue as StatusStudent} />;
                case "created_at":
                    return new Intl.DateTimeFormat("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    }).format(new Date(student.created_at));
                case "name":
                    return (
                        <div className={"min-w-[250px]"}>
                            <User
                                avatarProps={{
                                    radius: "full",
                                    src: student.image_url || "/default-avatar.png",
                                }}
                                classNames={{
                                    name: "text-default-foreground capitalize",
                                    description: "text-default-500 lowercase",
                                }}
                                description={student.email}
                                name={`${student.first_name} ${student.last_name}`}
                            />
                        </div>
                    );

                case "phone":
                    return <Chip
                        className="rounded-xl bg-default-100 px-[6px] capitalize text-default-800"
                        size="sm"
                        variant="flat"
                    >
                        {student.parent_contact || "Unknown"}
                    </Chip>
                case "parent_contact":
                    return <CopyText>{cellValue.replace(/[-\s]/g, "")}</CopyText>;

                case "nationality": {
                    const cellValueSafe = (cellValue ?? "").toString().toLowerCase();
                    const countryCode = nationalities.find(
                        (n) => n.name.toLowerCase() === cellValueSafe
                    )?.code;
                    return (
                        <div className="flex items-center gap-2">
                            <Image
                                src={`https://flagcdn.com/${countryCode?.toLowerCase()}.svg`}
                                alt="Flag"
                                width={16}
                                height={16}
                                className="h-[16px] w-[16px] object-cover rounded-full"
                            />
                            <p className="text-nowrap text-small text-default-foreground">
                                {cellValue}
                            </p>
                        </div>
                    );
                }

                case "actions":
                    return (
                        <div className="flex items-center gap-2 sm:gap-2">
                            <div className="p-2 -m-2 touch-manipulation">
                                <EyeFilledIcon
                                    {...getEyesProps()}
                                    className="cursor-pointer text-default-400"
                                    height={20}
                                    width={20}
                                />
                            </div>

                            <div className="p-2 -m-2 touch-manipulation">
                                <EditStudent
                                    student={student}
                                    onUpdate={async () => {
                                        // Invalidate and refetch to ensure fresh data
                                        await queryClient.invalidateQueries({ queryKey: ["students"] });
                                        // Force refetch with exact match
                                        await queryClient.refetchQueries({ 
                                            queryKey: ["students"],
                                            exact: true 
                                        });
                                        console.log("🔄 Student data refreshed");
                                    }}
                                    trigger={
                                        <EditLinearIcon
                                            className="cursor-pointer text-default-400 hover:text-warning active:scale-95"
                                            width={20}
                                            height={20}
                                        />
                                    }
                                />
                            </div>

                            <div className="p-2 -m-2 touch-manipulation">
                                <DeleteFilledIcon
                                    {...getDeleteProps()}
                                    onClick={() => handleDelete(student.id)}
                                    className="cursor-pointer text-default-400 active:scale-95"
                                    height={20}
                                    width={20}
                                />
                            </div>
                        </div>
                    );

                default:
                    return cellValue;
            }
        }
    );

    const onNextPage = useMemoizedCallback(() => {
        if (page < pages) {
            setPage(page + 1);
        }
    });

    const onPreviousPage = useMemoizedCallback(() => {
        if (page > 1) {
            setPage(page - 1);
        }
    });

    const onSearchChange = useMemoizedCallback((value?: string) => {
        if (value) {
            setFilterValue(value);
            setPage(1);
        } else {
            setFilterValue("");
        }
    });

    const onSelectionChange = useMemoizedCallback((keys: Selection) => {
        if (keys === "all") {
            if (filterValue) {
                const resultKeys = new Set(
                    filteredItems.map((item) => String(item.id))
                );

                setSelectedKeys(resultKeys);
            } else {
                setSelectedKeys(keys);
            }
        } else if (keys.size === 0) {
            setSelectedKeys(new Set());
        } else {
            const resultKeys = new Set<Key>();

            keys.forEach((v) => {
                resultKeys.add(v);
            });
            const selectedValue =
                selectedKeys === "all"
                    ? new Set(filteredItems.map((item) => String(item.id)))
                    : selectedKeys;

            selectedValue.forEach((v) => {
                if (items.some((item) => String(item.id) === v)) {
                    return;
                }
                resultKeys.add(v);
            });
            setSelectedKeys(new Set(resultKeys));
        }
    });

    const getSelectedIds = useCallback((): string[] => {
        if (filterSelectedKeys === "all") return filteredItems.map((s) => String(s.id));
        return Array.from(filterSelectedKeys as Set<Key>).map(String);
    }, [filterSelectedKeys, filteredItems]);

    const selectedCount = useMemo(
        () => (filterSelectedKeys === "all"
            ? filteredItems.length
            : (filterSelectedKeys as Set<Key>).size),
        [filterSelectedKeys, filteredItems.length]
    );

    const markSelectedAs = useCallback(
        async (status: "Paid" | "Unpaid") => {
            const ids = getSelectedIds();
            if (!ids.length) return;

            const { error } = await supabase.rpc("update_payment_status_bulk", {
                student_ids: ids,
                new_status: status,
            });

            if (error) {
                alert(`Update failed: ${error.message}`);
                return;
            }

            await queryClient.invalidateQueries({ queryKey: ["students"] });
            setSelectedKeys(new Set()); // clear selection
        },
        [getSelectedIds, queryClient, setSelectedKeys]
    );

    const topContent = useMemo(() => {
        return (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 overflow-auto px-[6px] py-[4px]">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <Input
                            className="w-full sm:min-w-[200px]"
                            endContent={
                                <SearchIcon className="text-default-400" width={16} />
                            }
                            placeholder="Search"
                            size="sm"
                            value={filterValue}
                            onValueChange={onSearchChange}
                        />
                        <div>
                            <Popover placement="bottom-start" offset={10}>
                                <PopoverTrigger>
                                    <Button
                                        className="bg-default-100 text-default-800"
                                        size="sm"
                                        startContent={
                                            <Icon
                                                className="text-default-400"
                                                icon="solar:tuning-2-linear"
                                                width={16}
                                            />
                                        }
                                    >
                                        Filter
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 dark text-foreground bg-background border-default-200">
                                    <div className="flex w-full flex-col gap-6 px-2 py-4 max-h-[70vh] overflow-y-auto">
                                        <RadioGroup
                                            label="Status"
                                            value={statusFilter}
                                            onValueChange={setStatusFilter}
                                            classNames={{
                                                label: "text-foreground",
                                            }}
                                        >
                                            <Radio 
                                                value="all"
                                                classNames={{
                                                    label: "text-foreground",
                                                }}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span>All</span>
                                                    <Chip size="sm" variant="flat" className="ml-2">
                                                        {countStudentsForFilter('status', 'all')}
                                                    </Chip>
                                                </div>
                                            </Radio>
                                            <Radio 
                                                value="active"
                                                classNames={{
                                                    label: "text-foreground",
                                                }}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span>Active</span>
                                                    <Chip size="sm" variant="flat" className="ml-2">
                                                        {countStudentsForFilter('status', 'active')}
                                                    </Chip>
                                                </div>
                                            </Radio>
                                            <Radio 
                                                value="inactive"
                                                classNames={{
                                                    label: "text-foreground",
                                                }}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span>Inactive</span>
                                                    <Chip size="sm" variant="flat" className="ml-2">
                                                        {countStudentsForFilter('status', 'inactive')}
                                                    </Chip>
                                                </div>
                                            </Radio>
                                            <Radio 
                                                value="hold"
                                                classNames={{
                                                    label: "text-foreground",
                                                }}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span>Hold</span>
                                                    <Chip size="sm" variant="flat" className="ml-2">
                                                        {countStudentsForFilter('status', 'hold')}
                                                    </Chip>
                                                </div>
                                            </Radio>
                                        </RadioGroup>

                                        <RadioGroup
                                            label="Branch"
                                            value={workerTypeFilter}
                                            onValueChange={setWorkerTypeFilter}
                                            classNames={{
                                                label: "text-foreground",
                                            }}
                                        >
                                            {branchOptionsForStatus.map((branch) => (
                                                <Radio 
                                                    key={branch.id}
                                                    value={branch.id}
                                                    classNames={{
                                                        label: "text-foreground",
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between w-full">
                                                        <span>{branch.name}</span>
                                                        <Chip size="sm" variant="flat" className="ml-2">
                                                            {countStudentsForFilter('branch', branch.id)}
                                                        </Chip>
                                                    </div>
                                                </Radio>
                                            ))}
                                        </RadioGroup>

                                        <RadioGroup
                                            label="Payment Status"
                                            value={paymentStatusFilter}
                                            onValueChange={setPaymentStatusFilter}
                                            classNames={{
                                                label: "text-foreground",
                                            }}
                                        >
                                            <Radio 
                                                value="all"
                                                classNames={{
                                                    label: "text-foreground",
                                                }}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span>All</span>
                                                    <Chip size="sm" variant="flat" className="ml-2">
                                                        {countStudentsForFilter('payment', 'all')}
                                                    </Chip>
                                                </div>
                                            </Radio>
                                            <Radio 
                                                value="paid"
                                                classNames={{
                                                    label: "text-foreground",
                                                }}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span>Paid</span>
                                                    <Chip size="sm" variant="flat" className="ml-2">
                                                        {countStudentsForFilter('payment', 'paid')}
                                                    </Chip>
                                                </div>
                                            </Radio>
                                            <Radio 
                                                value="unpaid"
                                                classNames={{
                                                    label: "text-foreground",
                                                }}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span>Unpaid</span>
                                                    <Chip size="sm" variant="flat" className="ml-2">
                                                        {countStudentsForFilter('payment', 'unpaid')}
                                                    </Chip>
                                                </div>
                                            </Radio>
                                        </RadioGroup>

                                        <RadioGroup
                                            key={`${statusFilter}-${workerTypeFilter}`}          // force remount when Status or Branch changes
                                            label="Program"
                                            value={safeProgramFilter}       // use safe, controlled value
                                            onValueChange={(val) => setProgramFilter(String(val))}
                                            classNames={{
                                                label: "text-foreground",
                                            }}
                                        >
                                            <Radio 
                                                value="all"
                                                classNames={{
                                                    label: "text-foreground",
                                                }}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span>All</span>
                                                    <Chip size="sm" variant="flat" className="ml-2">
                                                        {countStudentsForFilter('program', 'all')}
                                                    </Chip>
                                                </div>
                                            </Radio>
                                            {programOptionsForBranch.map((name) => (
                                                <Radio 
                                                    key={name} 
                                                    value={name}
                                                    classNames={{
                                                        label: "text-foreground",
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between w-full">
                                                        <span>{name}</span>
                                                        <Chip size="sm" variant="flat" className="ml-2">
                                                            {countStudentsForFilter('program', name)}
                                                        </Chip>
                                                    </div>
                                                </Radio>
                                            ))}
                                        </RadioGroup>

                                        <RadioGroup
                                            label="Admission Date"
                                            value={startDateFilter}
                                            onValueChange={setStartDateFilter}
                                            classNames={{
                                                label: "text-foreground",
                                            }}
                                        >
                                            <Radio 
                                                value="all"
                                                classNames={{
                                                    label: "text-foreground",
                                                }}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span>All</span>
                                                    <Chip size="sm" variant="flat" className="ml-2">
                                                        {countStudentsForFilter('date', 'all')}
                                                    </Chip>
                                                </div>
                                            </Radio>
                                            <Radio 
                                                value="last7Days"
                                                classNames={{
                                                    label: "text-foreground",
                                                }}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span>Last 7 days</span>
                                                    <Chip size="sm" variant="flat" className="ml-2">
                                                        {countStudentsForFilter('date', 'last7Days')}
                                                    </Chip>
                                                </div>
                                            </Radio>
                                            <Radio 
                                                value="last30Days"
                                                classNames={{
                                                    label: "text-foreground",
                                                }}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span>Last 30 days</span>
                                                    <Chip size="sm" variant="flat" className="ml-2">
                                                        {countStudentsForFilter('date', 'last30Days')}
                                                    </Chip>
                                                </div>
                                            </Radio>
                                            <Radio 
                                                value="last60Days"
                                                classNames={{
                                                    label: "text-foreground",
                                                }}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span>Last 60 days</span>
                                                    <Chip size="sm" variant="flat" className="ml-2">
                                                        {countStudentsForFilter('date', 'last60Days')}
                                                    </Chip>
                                                </div>
                                            </Radio>
                                        </RadioGroup>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button
                                        className="bg-default-100 text-default-800"
                                        size="sm"
                                        startContent={
                                            <Icon
                                                className="text-default-400"
                                                icon="solar:sort-linear"
                                                width={16}
                                            />
                                        }
                                    >
                                        Sort
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                    aria-label="Sort"
                                    items={headerColumns.filter(
                                        (c) => !["name", "nationality"].includes(c.uid)
                                    )}
                                    classNames={{
                                        base: "dark text-foreground bg-background max-h-[300px] overflow-y-auto",
                                    }}
                                >
                                    {(item) => (
                                        <DropdownItem
                                            key={item.uid}
                                            onPress={() => {
                                                setSortDescriptor({
                                                    column: item.uid,
                                                    direction:
                                                        sortDescriptor.direction === "ascending"
                                                            ? "descending"
                                                            : "ascending",
                                                });
                                            }}
                                            classNames={{
                                                base: "text-foreground data-[hover=true]:bg-default-100",
                                            }}
                                        >
                                            {item.name}
                                        </DropdownItem>
                                    )}
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                        <div>
                            <Dropdown closeOnSelect={false}>
                                <DropdownTrigger>
                                    <Button
                                        className="bg-default-100 text-default-800"
                                        size="sm"
                                        startContent={
                                            <Icon
                                                className="text-default-400"
                                                icon="solar:sort-horizontal-linear"
                                                width={16}
                                            />
                                        }
                                    >
                                        Columns
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                    disallowEmptySelection
                                    aria-label="Columns"
                                    items={columns.filter((c) => !["actions"].includes(c.uid))}
                                    selectedKeys={visibleColumns}
                                    selectionMode="multiple"
                                    onSelectionChange={setVisibleColumns}
                                    classNames={{
                                        base: "dark text-foreground bg-background max-h-[300px] overflow-y-auto",
                                    }}
                                >
                                    {(item) => (
                                        <DropdownItem 
                                            key={item.uid}
                                            classNames={{
                                                base: "text-foreground data-[hover=true]:bg-default-100",
                                            }}
                                        >
                                            {item.name}
                                        </DropdownItem>
                                    )}
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    </div>

                    <Divider className="h-5" orientation="vertical" />

                    <div className="whitespace-nowrap text-sm text-default-800">
                        {filterSelectedKeys === "all"
                            ? "All items selected"
                            : `${filterSelectedKeys.size} Selected`}
                    </div>

                    {selectedCount > 0 && (
                        <Dropdown placement="bottom-start">
                            <DropdownTrigger>
                                <Button
                                    className="bg-default-100 text-default-800"
                                    endContent={<Icon className="text-default-400" icon="solar:alt-arrow-down-linear" />}
                                    size="sm"
                                    variant="flat"
                                >
                                    Selected Actions
                                </Button>
                            </DropdownTrigger>

                            <DropdownMenu
                                aria-label="Selected Actions"
                                onAction={(key) => {
                                    if (key === "mark-paid") markSelectedAs("Paid");
                                    if (key === "mark-unpaid") markSelectedAs("Unpaid");
                                    if (key === "clear-selection") setSelectedKeys(new Set());
                                }}
                                classNames={{
                                    base: "dark text-foreground bg-background max-h-[300px] overflow-y-auto",
                                }}
                            >
                                <DropdownItem 
                                    key="selected-indicator" 
                                    isReadOnly 
                                    className="cursor-default text-default-400"
                                >
                                    {selectedCount} selected
                                </DropdownItem>

                                <DropdownItem
                                    key="mark-paid"
                                    startContent={<Icon icon="solar:check-circle-linear" width={16} className="text-success" />}
                                    classNames={{
                                        base: "text-foreground data-[hover=true]:bg-default-100",
                                    }}
                                >
                                    Mark as Paid
                                </DropdownItem>

                                <DropdownItem
                                    key="mark-unpaid"
                                    startContent={<Icon icon="solar:close-circle-linear" width={16} className="text-danger" />}
                                    classNames={{
                                        base: "text-foreground data-[hover=true]:bg-default-100",
                                    }}
                                >
                                    Mark as Unpaid
                                </DropdownItem>

                                <DropdownItem 
                                    key="clear-selection" 
                                    className="text-default-400"
                                    classNames={{
                                        base: "text-default-400 data-[hover=true]:bg-default-100",
                                    }}
                                >
                                    Clear selection
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    )}

                </div>
            </div>
        );
    }, [
        filterValue,
        visibleColumns,
        filterSelectedKeys,
        headerColumns,
        sortDescriptor,
        statusFilter,
        workerTypeFilter,
        paymentStatusFilter,
        startDateFilter,
        safeProgramFilter, // FIX: used instead of programFilter
        programOptionsForBranch,
        branchOptionsForStatus,
        countStudentsForFilter,
        onSearchChange,
        markSelectedAs, // FIX: Added missing dependency
        selectedCount,  // FIX: Added missing dependency
    ]);

    const studentLength = filteredItems.length;
    const totalStudents = Array.isArray(students) ? students.length : 0;
    
    // Check if any filters are active (not "all")
    const hasActiveFilters = useMemo(() => {
        return workerTypeFilter !== "all" || 
               statusFilter !== "all" || 
               safeProgramFilter !== "all" || 
               paymentStatusFilter !== "all" ||
               startDateFilter !== "all" ||
               (filterValue && filterValue.trim() !== "");
    }, [workerTypeFilter, statusFilter, safeProgramFilter, paymentStatusFilter, startDateFilter, filterValue]);

    const topBar = useMemo(() => {
        return (
            <div className="mb-[18px] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-[700] leading-[32px]">Students</h1>
                    {hasActiveFilters && (
                        <Chip
                            className="flex items-center text-default-500"
                            size="sm"
                            variant="flat"
                            color="primary"
                        >
                            {studentLength} {studentLength === 1 ? 'student' : 'students'}
                        </Chip>
                    )}
                    {!hasActiveFilters && (
                        <Chip
                            className="hidden items-center text-default-500 sm:flex"
                            size="sm"
                            variant="flat"
                        >
                            {totalStudents}
                        </Chip>
                    )}
                </div>
                <AddStudent onUpdate={() => queryClient.invalidateQueries({ queryKey: ["students"] })} />

            </div>
        );
    }, [studentLength, totalStudents, hasActiveFilters, queryClient]); // FIX: Added queryClient dependency

    const bottomContent = useMemo(() => {
        return (
            <div className="flex flex-col items-center justify-between gap-2 px-2 py-2 sm:flex-row">
                <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={page}
                    total={pages}
                    onChange={setPage}
                />
                <div className="flex items-center justify-end gap-6">
          <span className="text-small text-default-400">
            {filterSelectedKeys === "all"
                ? "All items selected"
                : `${filterSelectedKeys.size} of ${filteredItems.length} selected`}
          </span>
                    <div className="flex items-center gap-3">
                        <Button
                            isDisabled={page === 1}
                            size="sm"
                            variant="flat"
                            onPress={onPreviousPage}
                        >
                            Previous
                        </Button>
                        <Button
                            isDisabled={page === pages}
                            size="sm"
                            variant="flat"
                            onPress={onNextPage}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        );
    }, [
        filterSelectedKeys,
        page,
        pages,
        filteredItems.length,
        onPreviousPage,
        onNextPage,
    ]);

    if (studentsError) {
        return (
            <div className="h-full w-full pr-2 pt-3 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 text-lg font-semibold">Error loading students</p>
                    <p className="text-default-500 text-sm mt-2">
                        {studentsErrorDetails instanceof Error 
                            ? studentsErrorDetails.message 
                            : "An unknown error occurred"}
                    </p>
                </div>
            </div>
        );
    }

    if (studentsLoading) {
        return (
            <div className="h-full w-full pr-2 pt-3 flex items-center justify-center">
                <p className="text-default-400">Loading students...</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full pr-0 sm:pr-2 pt-3 overflow-x-auto">
            {topBar}
            <div className="min-w-[800px]">
                <Table
                    isHeaderSticky
                    aria-label="Example table with custom cells, pagination and sorting"
                    bottomContent={bottomContent}
                    bottomContentPlacement="outside"
                    classNames={{
                        td: "before:bg-transparent",
                        wrapper: "overflow-x-auto",
                    }}
                    selectedKeys={filterSelectedKeys}
                    selectionMode="multiple"
                    sortDescriptor={sortDescriptor}
                    topContent={topContent}
                    topContentPlacement="outside"
                    onSelectionChange={onSelectionChange}
                    onSortChange={setSortDescriptor}
                >
                <TableHeader columns={headerColumns}>
                    {(column) => (
                        <TableColumn
                            key={column.uid}
                            align={column.uid === "actions" ? "end" : "start"}
                            className={cn([
                                column.uid === "actions"
                                    ? "flex items-center justify-end px-[20px]"
                                    : "",
                            ])}
                        >
                            {column.uid === "memberInfo" ? (
                                <div
                                    {...getMemberInfoProps()}
                                    className="flex w-full cursor-pointer items-center justify-between"
                                >
                                    {column.name}
                                    {sortDescriptor.direction === "ascending" ? (
                                        <ArrowUpIcon className="text-default-400" />
                                    ) : (
                                        <ArrowDownIcon className="text-default-400" />
                                    )}
                                </div>
                            ) : column.name ? (
                                <div className="flex min-w-[108px] items-center justify-between">
                                    {column.name}
                                    <Tooltip content={column.name}>
                                        <Icon
                                            className="text-default-300"
                                            height={16}
                                            icon="solar:info-circle-linear"
                                            width={16}
                                        />
                                    </Tooltip>
                                </div>
                            ) : (
                                column.name
                            )}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody emptyContent={"No users found"} items={sortedItems}>
                    {(item) => (
                        <TableRow key={item.id}>
                            {(columnKey) => (
                                <TableCell>{renderCell(item, columnKey)}</TableCell>
                            )}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            </div>
        </div>
    );
}