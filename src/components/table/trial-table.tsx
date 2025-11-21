"use client";

import { Selection, SortDescriptor } from "@heroui/react";
import type { Key } from "@react-types/shared";
import TrailFormModal from "@/components/modal/edit-trial";

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
} from "react";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/react";

import { CopyText } from "../icon/copy-text";
import { EyeFilledIcon } from "../icon/eye";
import { DeleteFilledIcon } from "../icon/delete";
import { ArrowDownIcon } from "../icon/arrow-down";
import { ArrowUpIcon } from "../icon/arrow-up";

import { useMemoizedCallback } from "../use-memoized-callback";
import { createClient } from "../../../lib/supabaseClient";
import {
    trialColumn,
    INITIAL_VISIBLE_COLUMNS,
    ColumnsKey,
    StatusTrial,
    Trial,
    Trials,
} from "@/components/types/trials";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StatusTrialProp } from "@/components/icon/StatusTrialProp";
import AddTrail from "../modal/add-trial";

type Branch = {
    id: string;
    name: string;
};

export default function StudentTable() {
    // Removed unused state (error, programs, users)
    const supabase = createClient();
    const [filterValue, setFilterValue] = useState("");
    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
    const [visibleColumns, setVisibleColumns] = useState<Selection>(
        new Set(INITIAL_VISIBLE_COLUMNS)
    );
    const [rowsPerPage] = useState(10);
    const [page, setPage] = useState(1);
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "name",
        direction: "ascending",
    });

    const [workerTypeFilter, setWorkerTypeFilter] = React.useState("all");
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [startDateFilter, setStartDateFilter] = React.useState("all");
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingTrial, setEditingTrial] = useState<Trial | null>(null);


    const queryClient = useQueryClient();

    const {
        data: trials = [],
        // Removed unused destructured variables
    } = useQuery({
        queryKey: ["trials"],
        queryFn: async () => {
            const { data, error } = await supabase.rpc("get_all_trial").range(0, 49);;
            if (error) throw new Error(error.message);
            return data;
        },
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000
    });

    const trialLength = Array.isArray(trials) ? trials.length : 0;

    const handleDelete = async (id: string) => {
        const { error } = await supabase.rpc("delete_trail", { _id: id });

        if (error) {
            console.error("Failed to delete:", error.message);
            alert("Error: " + error.message);
        } else {
            alert("Deleted successfully!");
            queryClient.invalidateQueries({ queryKey: ["trials"] });
        }
    };

    const fetchBranches = async (): Promise<Branch[]> => {
        const { data, error } = await supabase.rpc("get_all_branches");
        if (error) throw new Error(error.message);
        return data as Branch[];
    };

    const {
        data: branches = [], // Default to empty array to prevent undefined errors
        // Removed unused destructured variables
    } = useQuery({
        queryKey: ["branches"],
        queryFn: fetchBranches,
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000
    });



    const headerColumns = useMemo(() => {
        if (visibleColumns === "all") return trialColumn;

        return trialColumn
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
        (col: Trial) => {
            const allWorkerType = workerTypeFilter === "all";
            const allStatus = statusFilter === "all";
            const allStartDate = startDateFilter === "all";

            const selectedBranch = branches.find((b) => b.id === workerTypeFilter);
            const selectedBranchName = selectedBranch?.name;

            const branchMatch =
                allWorkerType || col.branch_name === selectedBranchName;

            return (
                branchMatch &&
                (allStatus || statusFilter === col.status?.toLowerCase()) &&
                (allStartDate ||
                    new Date(
                        new Date().getTime() -
                        +(startDateFilter.match(/(\d+)(?=Days)/)?.[0] ?? 0) *
                        24 * 60 * 60 * 1000
                    ) <= new Date(col.created_at))
            );
        },
        [startDateFilter, statusFilter, workerTypeFilter, branches]
    );

    const filteredItems = useMemo(() => {
        const safeTrials = Array.isArray(trials) ? trials : [];
        let filteredUsers = [...safeTrials];

        if (filterValue) {
            filteredUsers = filteredUsers.filter((trial) =>
                trial.client?.toLowerCase().includes(filterValue.toLowerCase())
            );
        }

        return filteredUsers.filter(itemFilter);
    }, [filterValue, itemFilter, trials]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);

    const sortedItems = useMemo(() => {
        const sortColumn: keyof Trials =
            sortDescriptor.column === "program"
                ? "program_name"
                : (sortDescriptor.column as keyof Trials);

        return [...items].sort((a: Trials, b: Trials) => {
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
    // Removed unused deleteRef
    const { getButtonProps: getEyesProps } = useButton({ ref: eyesRef });

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
        (trial: Trial, columnKey: React.Key) => {
            const trialKey = columnKey as ColumnsKey;

            const cellValue = trial[trialKey as unknown as keyof Trial] as string;

            switch (trialKey) {
                case "client":
                    return (
                        <User
                            avatarProps={{ radius: "lg" }}
                            classNames={{
                                name: "text-default-foreground",
                                description: "text-default-500",
                            }}
                            name={trial.client}
                        />
                    );
                case "branch_name": {
                    return (
                        <Chip
                            className="rounded-xl bg-default-100 px-[6px] capitalize text-default-800"
                            size="sm"
                            variant="flat"
                        >
                            {trial.branch_name || "Unknown"}
                        </Chip>
                    );
                }

                case "id":
                    return <CopyText>{cellValue}</CopyText>;
                case "assign_by": {
                    return (
                        <Chip
                            className="rounded-xl bg-default-100 px-[6px] capitalize text-default-800"
                            size="sm"
                            variant="flat"
                        >
                            {trial.assign_by_name || "Unknown"}
                        </Chip>
                    );
                }

                case "modifier_by": {
                    return (
                        <Chip
                            className="rounded-xl bg-default-100 px-[6px] capitalize text-default-800"
                            size="sm"
                            variant="flat"
                        >
                            {trial.modified_by_name}
                        </Chip>
                    );
                }
                case "handle_by": {
                    return (
                        <Chip
                            className="rounded-xl bg-default-100 px-[6px] capitalize text-default-800"
                            size="sm"
                            variant="flat"
                        >
                            {trial.handle_by_name}
                        </Chip>
                    );
                }

                case "program_name": {
                    return (
                        <div className="flex flex-wrap gap-1">
                            {[...new Set(trial.program_names || [])].map((name: string, index: number) => (
                                <Chip
                                    key={name + index}
                                    className="rounded-xl bg-default-100 px-[6px] capitalize text-default-800"
                                    size="sm"
                                    variant="flat"
                                >
                                    {name}
                                </Chip>
                            ))}
                        </div>
                    );
                }

                case "number_student":
                    return (
                        <div className="flex items-center justify-center gap-2">
                            <Chip color="success" className={"px-5 font-extrabold"}>
                                {cellValue}
                            </Chip>
                        </div>
                    );

                case "phone":
                    return <CopyText>{cellValue.replace(/[-\s]/g, "")}</CopyText>;
                case "created_at":
                    return (
                        <div className="flex items-center gap-1">
                            <Icon
                                className="h-[16px] w-[16px] text-default-300"
                                icon="solar:calendar-minimalistic-linear"
                            />
                            <p className="text-nowrap text-small capitalize text-default-foreground">
                                {new Intl.DateTimeFormat("en-US", {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                }).format(new Date(trial.created_at))}
                            </p>
                        </div>
                    );

                case "updated_at":
                    return (
                        <div className="flex items-center gap-1">
                            <Icon
                                className="h-[16px] w-[16px] text-default-300"
                                icon="solar:calendar-minimalistic-linear"
                            />
                            <p className="text-nowrap text-small capitalize text-default-foreground">
                                {new Intl.DateTimeFormat("en-US", {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                }).format(new Date(trial.updated_at))}
                            </p>
                        </div>
                    );

                case "status":
                    return <StatusTrialProp status={cellValue as StatusTrial} />;
                case "actions":
                    return (
                        <div className="flex items-center justify-start gap-2">
                            <EyeFilledIcon
                                {...getEyesProps()}
                                onClick={() => console.log("Viewing", trial)}
                                className="cursor-pointer text-default-400"
                                height={18}
                                width={18}
                            />

                            <Icon
                                icon="solar:pen-bold"
                                onClick={() => {
                                    setEditingTrial(trial);
                                    setEditModalOpen(true);
                                }}
                                className="cursor-pointer text-default-400"
                                height={18}
                                width={18}
                            />

                            <DeleteFilledIcon
                                onClick={() => {
                                    console.log("Delete clicked:", trial.id);
                                    handleDelete(trial.id);
                                }}
                                className="cursor-pointer text-default-400"
                                height={18}
                                width={18}
                            />
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

    const topContent = useMemo(() => {
        return (
            <div className="flex items-center gap-4 overflow-auto px-[6px] py-[4px]">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-4">
                        <Input
                            className="min-w-[200px]"
                            endContent={
                                <SearchIcon className="text-default-400" width={16} />
                            }
                            placeholder="Search"
                            size="sm"
                            value={filterValue}
                            onValueChange={onSearchChange}
                        />
                        <div>
                            <Popover placement="bottom">
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
                                <PopoverContent className="w-80">
                                    <div className="flex w-full flex-col gap-6 px-2 py-4">
                                        <RadioGroup
                                            label="Branch"
                                            value={workerTypeFilter}
                                            onValueChange={setWorkerTypeFilter}
                                        >
                                            <Radio value="all">All</Radio>
                                            <Radio value="873bea75-e6c4-4c32-b625-d11dd4221a57">Funmall TK</Radio>
                                            <Radio value="659308e2-436f-43d7-a258-5a30adeb55dc">PengHout</Radio>
                                            <Radio value="67610209-6fd3-46a4-98bb-199d7a7faf27">OCIC</Radio>
                                        </RadioGroup>

                                        <RadioGroup
                                            label="StatusStudent"
                                            value={statusFilter}
                                            onValueChange={setStatusFilter}
                                        >
                                            <Radio value="all">All</Radio>
                                            <Radio value="pending">Pending</Radio>
                                            <Radio value="rejected">Rejected</Radio>
                                            <Radio value="approved">Approved</Radio>
                                        </RadioGroup>

                                        <RadioGroup
                                            label="Admission Date"
                                            value={startDateFilter}
                                            onValueChange={setStartDateFilter}
                                        >
                                            <Radio value="all">All</Radio>
                                            <Radio value="last7Days">Last 7 days</Radio>
                                            <Radio value="last30Days">Last 30 days</Radio>
                                            <Radio value="last60Days">Last 60 days</Radio>
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
                                    items={trialColumn.filter(
                                        (c) => !["actions"].includes(c.uid)
                                    )}
                                    selectedKeys={visibleColumns}
                                    selectionMode="multiple"
                                    onSelectionChange={setVisibleColumns}
                                >
                                    {(item) => (
                                        <DropdownItem key={item.uid}>{item.name}</DropdownItem>
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

                    {(filterSelectedKeys === "all" || filterSelectedKeys.size > 0) && (
                        <Dropdown>
                            <DropdownTrigger>
                                <Button
                                    className="bg-default-100 text-default-800"
                                    endContent={
                                        <Icon
                                            className="text-default-400"
                                            icon="solar:alt-arrow-down-linear"
                                        />
                                    }
                                    size="sm"
                                    variant="flat"
                                >
                                    Selected Actions
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Selected Actions">
                                <DropdownItem key="send-email">Send email</DropdownItem>
                                <DropdownItem key="pay-invoices">Pay invoices</DropdownItem>
                                <DropdownItem key="bulk-edit">Bulk edit</DropdownItem>
                                <DropdownItem key="end-contract">End contract</DropdownItem>
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
        startDateFilter,
        setWorkerTypeFilter,
        setStatusFilter,
        setStartDateFilter,
        onSearchChange,
        setVisibleColumns,
    ]);

    const topBar = useMemo(() => {
        return (
            <div className="mb-[18px] flex items-center justify-between">
                <div className="flex w-[226px] items-center gap-2">
                    <h1 className="text-2xl font-[700] leading-[32px]">Trials</h1>
                    <Chip
                        className="hidden items-center text-default-500 sm:flex"
                        size="sm"
                        variant="flat"
                    >
                        {trialLength}
                    </Chip>
                </div>
                <AddTrail onSuccess={() => queryClient.invalidateQueries({ queryKey: ["trials"] })} />

            </div>
        );
    }, [trialLength, queryClient]); // FIX: Added queryClient dependency

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

    return (
        <div className="h-full w-full pr-2 pt-3">
            {topBar}
            <Table
                isHeaderSticky
                aria-label="Example table with custom cells, pagination and sorting"
                bottomContent={bottomContent}
                bottomContentPlacement="outside"
                classNames={{
                    td: "before:bg-transparent",
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

            {editingTrial && (
                <TrailFormModal
                    isOpen={editModalOpen}
                    onClose={() => {
                        setEditModalOpen(false);
                        setEditingTrial(null);
                    }}
                    editingId={editingTrial.id}
                    initialData={editingTrial}
                    onSuccess={async () => {
                        await queryClient.invalidateQueries({ queryKey: ["trials"] });

                        setEditModalOpen(false);
                        setEditingTrial(null);
                    }}
                />
            )}
        </div>
    );
}