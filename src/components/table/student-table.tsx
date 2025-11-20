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
import { supabase } from "../../../lib/supabaseClient";
import nationalities from "@/components/types/nationalities";
import EditStudent from "../modal/edit-student";
import { EditLinearIcon } from "../icon/edit";
import AddStudent from "../modal/add-student";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type Program = {
  id: string;
  name: string;
  description: string;
  age: string;
  branch_id: string;
};

type Branch = {
  id: string;
  name: string;
};
export default function StudentTable() {
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [rowsPerPage] = useState(20);
  const [page, setPage] = useState(1);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([]);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "name",
    direction: "ascending",
  });
const [programFilter, setProgramFilter] = React.useState("all");

  const [workerTypeFilter, setWorkerTypeFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [startDateFilter, setStartDateFilter] = React.useState("all");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [error, setError] = useState<string | null>(null);

const PAGE_SIZE = 500; // tweak 200–1000 if you want smaller chunks

const fetchStudents = async () => {
  let all: any[] = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await supabase.rpc(
      "get_all_student_with_programs_offset", // <-- the paginated RPC
      {
        p_limit: PAGE_SIZE,
        p_offset: offset,
        p_status: null,     // plug filters if you have them
        p_branch_id: null,
      }
    );

    if (error) throw new Error(error.message);

    const chunk = data ?? [];
    all.push(...chunk);

    if (chunk.length < PAGE_SIZE) break; // last page reached
    offset += chunk.length;
  }

  return all; 
};

// Call the function and log the result (optional)
fetchStudents()
  .then((students) => console.log("Fetched students:", students))
  .catch((err) => console.error("Error fetching students:", err.message));



  const fetchBranches = async () => {
    const { data, error } = await supabase.rpc("get_all_branches");
    if (error) throw new Error(error.message);
    return data;
  };

  // Inside component
  const queryClient = useQueryClient();

  const {
    data: students,
    isLoading: studentsLoading,
    isError: studentsError,
    error: studentsFetchError,
  } = useQuery({
    queryKey: ["students"],
    queryFn: fetchStudents,
    staleTime: 5 * 60 * 1000, 
cacheTime: 10 * 60 * 1000 
  });

  const {
    data: branches,
    isLoading: branchesLoading,
    isError: branchesError,
    error: branchesFetchError,
  } = useQuery({
    queryKey: ["branches"],
    queryFn: fetchBranches,
    staleTime: 5 * 60 * 1000, 
cacheTime: 10 * 60 * 1000  // 10 minutes
  });

type Program = { id: string; name: string; description: string; age: string; branch_id: string };

const fetchPrograms = async () => {
  const { data, error } = await supabase.rpc("get_all_programs");
  if (error) throw new Error(error.message);
  return data as Program[];
};

const {
  data: allPrograms,
  isLoading: programsLoading,
  isError: programsError,
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
      setError(error.message);
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
    const allStatus   = statusFilter === "all"; // keep if you still use status

    // Branch match
    const branchMatch =
      allBranch || String(col.branch_id ?? "") === String(workerTypeFilter);
    const programMatch =
      allProgram ||
      (Array.isArray(col.program_names) &&
        col.program_names.some(
          (n: string) => (n ?? "").toLowerCase() === programFilter.toLowerCase()
        ));

    // Status (optional)
    const statusMatch =
      allStatus ||
      (col.status ?? "").toString().toLowerCase() === statusFilter.toLowerCase();

    // Admission date
    const dateMatch =
      allStart ||
      new Date(
        new Date().getTime() -
          +(startDateFilter.match(/(\d+)(?=Days)/)?.[0] ?? 0) *
            24 * 60 * 60 * 1000
      ) <= new Date(col.admission_date ?? 0);

    return branchMatch && programMatch && statusMatch && dateMatch;
  },
  [workerTypeFilter, programFilter, statusFilter, startDateFilter]
);



useEffect(() => {
  setProgramFilter("all");
}, [workerTypeFilter]);
const programOptionsForBranch = useMemo(() => {
  const list = Array.isArray(allPrograms) ? allPrograms : [];
  const filtered = workerTypeFilter === "all"
    ? list
    : list.filter(p => String(p.branch_id) === String(workerTypeFilter));

  // dedupe by name and keep only valid names
  return Array.from(new Set(filtered.map(p => (p.name ?? "").trim()).filter(Boolean)));
}, [allPrograms, workerTypeFilter]);
const safeProgramFilter = useMemo(
  () => (programOptionsForBranch.includes(programFilter) ? programFilter : "all"),
  [programOptionsForBranch, programFilter]
);

const filteredItems = useMemo(() => {
  const safeStudents = Array.isArray(students) ? students : [];
  let filteredUsers = [...safeStudents];

  if (filterValue) {
    const lowercased = filterValue.toLowerCase();

filteredUsers = filteredUsers.filter((student) => {
  const lowercased = (filterValue || "").toLowerCase();

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
}, [filterValue, itemFilter, students]);


  const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    // Determine the correct property key. If the user wants to sort by "gender", use "gender_display".
    const sortColumn: keyof Students =
      sortDescriptor.column === "gender"
        ? "gender_display"
        : (sortDescriptor.column as keyof Students);

    return [...items].sort((a: Students, b: Students) => {
      let aValue = a[sortColumn];
      let bValue = b[sortColumn];

      // If the values are arrays (for example, classroom_name), join them into strings.
      if (Array.isArray(aValue)) aValue = aValue.join(", ");
      if (Array.isArray(bValue)) bValue = bValue.join(", ");

      let cmp: number;
      // Compare numbers
      if (typeof aValue === "number" && typeof bValue === "number") {
        cmp = aValue - bValue;
      }
      // Compare strings
      else if (typeof aValue === "string" && typeof bValue === "string") {
        cmp = aValue.localeCompare(bValue);
      }
      // Fallback: compare via string conversion
      else {
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
          <Chip
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
      className="rounded-xl px-[6px] capitalize"   // ← remove bg-default-100 so color shows
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
              {student.
payment_end_date
}
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
                  src: student.image_url || "/default-avatar.png", // ✅ fallback
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

        case "nationality":
          const cellValueSafe = (cellValue ?? "").toString().toLowerCase();
  const countryCode = nationalities.find(
    (n) => n.name.toLowerCase() === cellValueSafe
  )?.code;
          return (
            <div className="flex items-center gap-2">
              <Image
                src={`https://flagcdn.com/${countryCode?.toLowerCase()}.svg`}
                alt="Flag"
                className="h-[16px] w-[16px] object-cover rounded-full"
              />
              <p className="text-nowrap text-small text-default-foreground">
                {cellValue}
              </p>
            </div>
          );

        case "actions":
          return (
            <div className="flex items-center gap-2">
              <EyeFilledIcon
                {...getEyesProps()}
                className="cursor-pointer text-default-400"
                height={18}
                width={18}
              />

              <EditStudent
                student={student}
                onUpdate={() => {
                  queryClient.invalidateQueries({ queryKey: ["students"] });
                }}
                trigger={
                  <EditLinearIcon
                    className="cursor-pointer text-default-400 hover:text-warning"
                    width={18}
                    height={18}
                  />
                }
              />

              <DeleteFilledIcon
                {...getDeleteProps()}
                onClick={() => handleDelete(student.id)}
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
                      <Radio value="active">Active</Radio>
                      <Radio value="inactive">Inactive</Radio>
                      <Radio value="hold">Hold</Radio>
                    </RadioGroup>
<RadioGroup
  key={workerTypeFilter}          // force remount when Branch changes
  label="Program"
  value={safeProgramFilter}       // use safe, controlled value
  onValueChange={(val) => setProgramFilter(String(val))}
>
  <Radio value="all">All</Radio>
  {programOptionsForBranch.map((name) => (
    <Radio key={name} value={name}>{name}</Radio>
  ))}
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
                  items={columns.filter((c) => !["actions"].includes(c.uid))}
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
    >
      <DropdownItem key="selected-indicator" isReadOnly className="cursor-default text-default-400">
        {selectedCount} selected
      </DropdownItem>

      <DropdownItem
        key="mark-paid"
        startContent={<Icon icon="solar:check-circle-linear" width={16} className="text-success" />}
      >
        Mark as Paid
      </DropdownItem>

      <DropdownItem
        key="mark-unpaid"
        startContent={<Icon icon="solar:close-circle-linear" width={16} className="text-danger" />}
      >
        Mark as Unpaid
      </DropdownItem>

      <DropdownItem key="clear-selection" className="text-default-500">
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
    startDateFilter,
    programFilter,
  programOptionsForBranch,
    setWorkerTypeFilter,
    setStatusFilter,
    setStartDateFilter,
    onSearchChange,
    setVisibleColumns,
  ]);

// const studentLength = useMemo(() => (Array.isArray(students) ? students.length : 0), [students]);

const studentLength = filteredItems.length;

  const topBar = useMemo(() => {
    return (
      <div className="mb-[18px] flex items-center justify-between">
        <div className="flex w-[226px] items-center gap-2">
          <h1 className="text-2xl font-[700] leading-[32px]">Students</h1>
          <Chip
            className="hidden items-center text-default-500 sm:flex"
            size="sm"
            variant="flat"
          >
            {studentLength}
          </Chip>
        </div>
     <AddStudent onUpdate={() => queryClient.invalidateQueries(["students"])} />

      </div>
    );
  }, [studentLength]);

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

  const handleMemberClick = useMemoizedCallback(() => {
    setSortDescriptor({
      column: "memberInfo",
      direction:
        sortDescriptor.direction === "ascending" ? "descending" : "ascending",
    });
  });

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
    </div>
  );
}
