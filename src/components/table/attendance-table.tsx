'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Chip,
  Button,
  Spinner,
  Input,
} from '@heroui/react';
import { Icon } from '@iconify/react';

import EditAttendanceModal from '../modal/edit-attendance';
import AddAttendanceModal from '../modal/add-attendance';
import { generateAttendancePDF } from '../../../lib/generateAttendancePDF';

/* ----------------------------- Types ----------------------------- */
type AttendanceRecord = {
  id: string;
  student_id: string;
  classroom_id?: string | null;
  program_id?: string | null;
  branch_id: string;
  attendance_date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'late' | string;
  remarks: string | null;
  student_name?: string | null;
  classroom_name?: string | null;
};

type Student   = { id: string; first_name: string; last_name: string };
type Classroom = { id: string; class_name: string; program_id: string };
type Branch    = { id: string; name: string };
type Program   = { id: string; name: string; branch_id: string };

type Props = {
  selectedBranchId: string;
  selectedProgramId: string;
};

/* --------------------------- Component --------------------------- */
export default function AttendanceTable({ selectedBranchId, selectedProgramId }: Props) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add Attendance modal
  const [addOpen, setAddOpen] = useState(false);

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>('');      // YYYY-MM-DD
  const [studentQuery, setStudentQuery] = useState<string>('');      // name search
  const [selectedClassroomId, setSelectedClassroomId] = useState(''); // classroom filter

  /* ----------------------- Helpers ----------------------- */
  const isUndefinedFunction = (err?: { code?: string; message?: string }) =>
    err?.code === '42883' || /function .* does not exist/i.test(err?.message ?? '');

  const toNull = (v?: string | null) => (v && v.trim() !== '' ? v : null);

  const getStudentNameById = (id: string) => {
    const s = students.find((x) => x.id === id);
    return s ? `${s.first_name} ${s.last_name}` : 'N/A';
  };
  const getClassroomNameById = (id?: string | null) => {
    if (!id) return 'N/A';
    const c = classrooms.find((x) => x.id === id);
    return c ? c.class_name : 'N/A';
  };
  const getBranchNameById = (id: string) => branches.find((b) => b.id === id)?.name ?? 'N/A';

  const chipProps = (status: string) => {
    if (status === 'present') return { color: 'success' as const, variant: 'flat' as const };
    if (status === 'late')    return { color: 'warning' as const, variant: 'flat' as const };
    return { color: 'danger' as const, variant: 'flat' as const };
  };

  /* ------------------------ Data ------------------------ */
  useEffect(() => {
    loadStaticLists();
  }, []);

  // Reset classroom filter whenever upstream branch/program changes
  useEffect(() => {
    setSelectedClassroomId('');
  }, [selectedBranchId, selectedProgramId]);

  // Refetch whenever branch/program/date changes
  useEffect(() => {
    const start = selectedDate || null;
    const end   = selectedDate || null;
    loadAttendance(toNull(selectedBranchId), toNull(selectedProgramId), start, end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId, selectedProgramId, selectedDate]);

  const loadStaticLists = async () => {
    setError(null);
    try {
      let studentsRes = await supabase.rpc('get_all_students');
      if (studentsRes.error && isUndefinedFunction(studentsRes.error)) {
        studentsRes = await supabase.rpc('get_all_student');
      }

      const [branchesRes, classroomsRes, programsRes] = await Promise.all([
        supabase.rpc('get_all_branches'),
        supabase.rpc('get_all_classrooms'),
        supabase.rpc('get_all_programs'),
      ]);

      if (studentsRes.error || branchesRes.error || classroomsRes.error || programsRes.error) {
        throw new Error(
          studentsRes.error?.message ||
            branchesRes.error?.message ||
            classroomsRes.error?.message ||
            programsRes.error?.message ||
            'Failed to load lists'
        );
      }
      setStudents((studentsRes.data ?? []) as Student[]);
      setBranches((branchesRes.data ?? []) as Branch[]);
      setClassrooms((classroomsRes.data ?? []) as Classroom[]);
      setPrograms((programsRes.data ?? []) as Program[]);
    } catch (e: any) {
      setError(e.message || 'Unexpected error while loading lists.');
    }
  };

  const loadAttendance = async (
    branchId: string | null,
    programId: string | null,
    start: string | null,
    end: string | null
  ) => {
    setLoading(true);
    setError(null);
    try {
      let res = await supabase.rpc('get_attendance_with_names', {
        _branch_id: branchId,
        _program_id: programId,
        _start: start,   // pass same date to _end for single-day
        _end: end,
      });
      if (res.error && isUndefinedFunction(res.error)) {
        res = await supabase.rpc('get_all_attendance_records');
      }
      if (res.error) throw new Error(res.error.message);
      setRecords((res.data ?? []) as AttendanceRecord[]);
    } catch (e: any) {
      setError(e.message || 'Failed to load attendance.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  /* ------------- Classroom options (scoped by filters) ------------- */
  const classroomOptions = useMemo(() => {
    if (selectedProgramId) {
      return classrooms.filter((c) => c.program_id === selectedProgramId);
    }
    if (selectedBranchId) {
      const ids = new Set(programs.filter((p) => p.branch_id === selectedBranchId).map((p) => p.id));
      return classrooms.filter((c) => ids.has(c.program_id));
    }
    return classrooms;
  }, [classrooms, programs, selectedBranchId, selectedProgramId]);

  /* --------------------- Client filter --------------------- */
  const filteredRecords = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    return records.filter((r) => {
      const okBranch    = selectedBranchId    ? r.branch_id === selectedBranchId : true;
      const okProg      = selectedProgramId   ? r.program_id === selectedProgramId : true;
      const okClassroom = selectedClassroomId ? r.classroom_id === selectedClassroomId : true;
      if (!okBranch || !okProg || !okClassroom) return false;

      if (!q) return true;
      const name = (r.student_name ?? getStudentNameById(r.student_id)).toLowerCase();
      return name.includes(q);
    });
  }, [records, selectedBranchId, selectedProgramId, selectedClassroomId, studentQuery, students]);

  /* ------------------------- UI ------------------------- */
  return (
    <div className="p-4">
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-end gap-3 sm:gap-4">
        {/* Search */}
        <div className="flex flex-col">
          <label className="mb-1 text-xs font-semibold text-gray-400">Search student</label>
          <Input
            aria-label="Search student"
            value={studentQuery}
            onValueChange={setStudentQuery}
            placeholder="Search"
            size="sm"
            radius="sm"
            variant="bordered"
            endContent={<Icon icon="solar:magnifer-linear" className="text-default-400" width={16} />}
            classNames={{
              inputWrapper:
                'h-8 w-full max-w-[240px] rounded-lg bg-default-100 border border-default-200 data-[hover=true]:bg-default-100',
              input: 'text-sm placeholder-default-500',
            }}
          />
        </div>

        {/* Date + Today/Clear */}
        <div className="flex flex-col">
          <label className="mb-1 text-xs font-semibold text-gray-400">Date</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-8 w-full max-w-[180px] rounded-lg border border-default-200 bg-default-100 px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              size="sm"
              variant="bordered"
              className="h-8"
              onPress={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
            >
              Today
            </Button>
            {selectedDate && (
              <Button
                size="sm"
                color="danger"
                variant="flat"
                className="h-8"
                onPress={() => setSelectedDate('')}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Classroom filter */}
        <div className="flex flex-col">
          <label className="mb-1 text-xs font-semibold text-gray-400">Classroom</label>
          <select
            value={selectedClassroomId}
            onChange={(e) => setSelectedClassroomId(e.target.value)}
            className="h-8 w-full max-w-[220px] rounded-lg border border-default-200 bg-default-100 px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Classrooms</option>
            {classroomOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.class_name}
              </option>
            ))}
          </select>
        </div>

        {/* Spacer + Add button */}
        <div className="grow" />
        <Button color="primary" size="sm" onPress={() => setAddOpen(true)}>
          <Icon icon="solar:add-circle-bold" width={18} className="mr-1" />
          Add Attendance
        </Button>
<Button
  color="secondary"
  size="sm"
  onPress={() => generateAttendancePDF(filteredRecords, branches)}
>
  Download Attendance PDF
</Button>

      </div>

      {error && <p className="mb-4 text-red-500">{error}</p>}

      <Table isStriped isCompact aria-label="Student Attendance Table">
        <TableHeader>
          <TableColumn>#</TableColumn>
          <TableColumn>Student</TableColumn>
          <TableColumn>Classroom</TableColumn>
          <TableColumn>Branch</TableColumn>
          <TableColumn>Date</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Remarks</TableColumn>
          {/* <TableColumn>Action</TableColumn> */}
        </TableHeader>

        <TableBody
          isLoading={loading}
          loadingContent={
            <div className="flex items-center gap-2 py-4">
              <Spinner size="sm" /> Loading attendance…
            </div>
          }
          emptyContent={loading ? null : 'No attendance records found.'}
        >
          {filteredRecords.map((record, index) => (
            <TableRow key={record.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{record.student_name ?? getStudentNameById(record.student_id)}</TableCell>
              <TableCell>{record.classroom_name ?? getClassroomNameById(record.classroom_id)}</TableCell>
              <TableCell>{getBranchNameById(record.branch_id)}</TableCell>
              <TableCell>{record.attendance_date}</TableCell>
              <TableCell>
                <Chip size="sm" {...chipProps(record.status)}>{record.status}</Chip>
              </TableCell>
              <TableCell>{record.remarks ?? ''}</TableCell>
              {/* <TableCell>
                <Button
                  color="warning"
                  size="sm"
                  onClick={() => {
                    setSelectedRecord(record);
                    setEditModalOpen(true);
                  }}
                >
                  Edit
                </Button>
              </TableCell> */}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit existing row */}
      {selectedRecord && (
        <EditAttendanceModal
          isOpen={editModalOpen}
          onOpenChange={() => setEditModalOpen((o) => !o)}
          onClose={() => setEditModalOpen(false)}
          record={selectedRecord}
          onSuccess={() => {
            setEditModalOpen(false);
            const d = selectedDate || null;
            loadAttendance(toNull(selectedBranchId), toNull(selectedProgramId), d, d);
          }}
        />
      )}

      {/* Add new attendance */}
      <AddAttendanceModal
        isOpen={addOpen}
        onOpenChange={() => setAddOpen((o) => !o)}
        onClose={() => setAddOpen(false)}
        onSuccess={() => {
          setAddOpen(false);
          const d = selectedDate || null;
          loadAttendance(toNull(selectedBranchId), toNull(selectedProgramId), d, d);
        }}
      />
    </div>
  );
}
