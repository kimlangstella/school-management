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
  Students,
} from "@/components/types/columns";
import { supabase } from "../../../lib/supabaseClient";
import nationalities from "@/components/types/nationalities";
import EditStudent from "../modal/edit-student";
import { EditLinearIcon } from "../icon/edit";
import AddStudent from "../modal/add-student";

export default function StudentTable() {
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [rowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([]);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "name",
    direction: "ascending",
  });

  const [workerTypeFilter, setWorkerTypeFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [startDateFilter, setStartDateFilter] = React.useState("all");
  const [students, setStudents] = useState<any[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = async () => {
    const { data, error } = await supabase.rpc("get_all_students");
console.log("data",data)
    if (error) {
      setError(error.message);
    } else {
      setStudents(data);
    }
  };

  const fetchBranches = async () => {
    const { data, error } = await supabase.rpc("get_all_branches");
    if (error) {
      setError(error.message);
    } else {
      setBranches(data as Branch[]);
    }
  };
  const fetchPrograms = async () => {
    const { data, error } = await supabase.rpc("get_all_programs");
    if (error) {
      setError(error.message);
    } else {
      setPrograms(data as Program[]);
    }
  };
    useEffect(() => {
    if (students.length > 0 && branches.length > 0) {
      console.log(
        "🟨 All Branch IDs:",
        branches.map((b) => b.id)
      );
      console.log(
        "🟦 All Student branch values:",
        students.map((s) => s.branch)
      );

      const matchedStudents = students
        .filter((student) =>
          branches.some(
            (branch) =>
              branch.id.toLowerCase() === student.branch?.toLowerCase()
          )
        )
        .map((student) => {
          const branch = branches.find(
            (b) => b.id.toLowerCase() === student.branch?.toLowerCase()
          );

          return {
            studentName: student.first_name + " " + student.last_name,
            branchId: student.branch,
            branchName: branch?.name ?? "Unknown Branch",
          };
        });

      console.log("✅ Matched students with branch names:", matchedStudents);
    }
  }, [students, branches]);
  useEffect(() => {
    if (students.length > 0 && programs.length > 0) {
      console.log(
        "📘 All Program IDs:",
        programs.map((p) => p.id)
      );
      console.log(
        "📗 All Student program values:",
        students.map((s) => s.program)
      );

      const matchedPrograms = students
        .filter((student) =>
          programs.some(
            (program) =>
              program.id.toLowerCase() === student.program?.toLowerCase()
          )
        )
        .map((student) => {
          const program = programs.find(
            (p) => p.id.toLowerCase() === student.program?.toLowerCase()
          );

          return {
            studentName: student.first_name + " " + student.last_name,
            programId: student.program,
            programName: program?.name ?? "Unknown Program",
          };
        });

      console.log("✅ Matched students with program names:", matchedPrograms);
    }
  }, [students, programs]);
  const getBranchNameById = (id: string) => {
    const branch = branches.find((b) => b.id === id);
    return branch?.name ?? "Unknown Branch";
  };
  const getProgramNameById = (id: string) => {
    const program = programs.find((p) => p.id === id);
    return program?.name ?? "Unknown Program";
  };

  const getUserNameById = (id: string): string => {
    const user = users.find((u) => u.id === id);
    return user ? user.full_name : "Unknown User";
  };
  useEffect(() => {
    fetchBranches();
    fetchPrograms();
    fetchStudents();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Delete this student?");
    if (!confirmDelete) return;

    const { error } = await supabase.rpc("delete_student", { _id: id });

    if (error) {
      setError(error.message);
    } else {
      fetchStudents(); // ✅ will now work
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
      const allWorkerType = workerTypeFilter === "all";
      const allStatus = statusFilter === "all";
      const allStartDate = startDateFilter === "all";

      return (
        (allWorkerType || workerTypeFilter === col.branch_id.toString()) &&
        (allStatus || statusFilter === col.status.toLowerCase()) &&
        (allStartDate ||
          new Date(
            new Date().getTime() -
              +(startDateFilter.match(/(\d+)(?=Days)/)?.[0] ?? 0) *
                24 *
                60 *
                60 *
                1000
          ) <= new Date(col.admission_date))
      );
    },
    [startDateFilter, statusFilter, workerTypeFilter]
  );

  const filteredItems = useMemo(() => {
    let filteredUsers = [...students];

    if (filterValue) {
      const lowercased = filterValue.toLowerCase();

      filteredUsers = filteredUsers.filter(
        (student) =>
          student.first_name?.toLowerCase().includes(lowercased) ||
          student.email?.toLowerCase().includes(lowercased) ||
          student.gender?.toLowerCase().includes(lowercased) ||
          student.phone?.toLowerCase().includes(lowercased) ||
          student.program?.toLowerCase().includes(lowercased) // <-- include any field you want
      );
    }

    filteredUsers = filteredUsers.filter(itemFilter); // this is your existing filter logic

    return filteredUsers;
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
      console.log("cellvalue", cellValue);
      switch (studentKey) {
        case "gender":
          return (
            {
              male: "Male",
              female: "Female",
              other: "Other",
            }[cellValue?.toLowerCase()] ?? "Unknown"
          );

        case "branch": {
          const branchName = getBranchNameById(student.branch);
          return (
            <Chip
              className="rounded-xl bg-default-100 px-[6px] capitalize text-default-800"
              size="sm"
              variant="flat"
            >
              {branchName}
            </Chip>
          );
        }

        case "program": {
          const programName = getProgramNameById(student.program); // ✅ FIX: use student.program not student.program_id
          return (
            <Chip
              className="rounded-xl bg-default-100 px-[6px] capitalize text-default-800"
              size="sm"
              variant="flat"
            >
              {programName}
            </Chip>
          );
        }

        case "date_of_birth":
          return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(new Date(student.date_of_birth));

        case "status":
          return <StatusStudentProp status={cellValue as StatusStudent} />;

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
        case "parent_contact":
          return <CopyText>{cellValue.replace(/[-\s]/g, "")}</CopyText>;

        case "nationality":
          const countryCode = nationalities.find(
            (n) => n.name.toLowerCase() === cellValue.toLowerCase()
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
                onUpdate={(updatedStudent) => {
                  setStudents((prev) =>
                    prev.map((s) =>
                      s.id === updatedStudent.id ? updatedStudent : s
                    )
                  );
                  fetchStudents();
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
                      <Radio value="1">Funmall TK</Radio>
                      <Radio value="2">OCIC Sakura Avenue</Radio>
                      <Radio value="3">Peng Hout Boueng Snor</Radio>
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

  const studentLength = useMemo(() => students.length, [students]);

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
        <AddStudent onUpdate={fetchStudents} />
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
