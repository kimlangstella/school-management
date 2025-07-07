'use client';

import { useEffect, useState } from 'react';
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
} from '@heroui/react';
import EditAttendanceModal from '../modal/edit-attendance';

type AttendanceRecord = {
  id: number;
  student_id: string;
  program_id: string;
  branch_id: string;
  attendance_date: string;
  status: string;
  remarks: string;
};

const AttendanceTable = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [studentRes, programRes, branchRes, attendanceRes] = await Promise.all([
        supabase.rpc('get_all_students'),
        supabase.rpc('get_all_programs'),
        supabase.rpc('get_all_branches'),
        supabase.rpc('get_all_attendance_records'),
      ]);

      if (studentRes.error || programRes.error || branchRes.error || attendanceRes.error) {
        setError(
          studentRes.error?.message ||
            programRes.error?.message ||
            branchRes.error?.message ||
            attendanceRes.error?.message ||
            'Failed to load data'
        );
      } else {
        setStudents(studentRes.data || []);
        setPrograms(programRes.data || []);
        setBranches(branchRes.data || []);
        setRecords(attendanceRes.data || []);
      }
    } catch (err) {
      setError('Unexpected error while fetching data.');
      console.error(err);
    }
  };

  const getStudentNameById = (id: string) => {
    const student = students.find((s) => s.id === id);
    return student ? `${student.first_name} ${student.last_name}` : 'N/A';
  };

  const getNameById = (id: string, list: any[], key = 'name') => {
    const item = list.find((i) => i.id === id);
    return item ? item[key] || 'N/A' : 'N/A';
  };

  return (
    <div className="p-4">
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <Table isStriped isCompact aria-label="Student Attendance Table">
        <TableHeader>
          <TableColumn>#</TableColumn>
          <TableColumn>Student</TableColumn>
          <TableColumn>Program</TableColumn>
          <TableColumn>Branch</TableColumn>
          <TableColumn>Date</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Remarks</TableColumn>
          <TableColumn>Action</TableColumn>
        </TableHeader>

        <TableBody emptyContent="No attendance records found.">
          {records.map((record, index) => (
            <TableRow key={record.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{getStudentNameById(record.student_id)}</TableCell>
              <TableCell>{getNameById(record.program_id, programs)}</TableCell>
              <TableCell>{getNameById(record.branch_id, branches)}</TableCell>
              <TableCell>{record.attendance_date}</TableCell>
              <TableCell>
                <Chip
                  color={record.status === 'present' ? 'success' : 'danger'}
                  variant="flat"
                  size="sm"
                >
                  {record.status}
                </Chip>
              </TableCell>
              <TableCell>{record.remarks}</TableCell>
              <TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedRecord && (
        <EditAttendanceModal
          isOpen={editModalOpen}
          onOpenChange={() => setEditModalOpen((o) => !o)}
          onClose={() => setEditModalOpen(false)}
          record={selectedRecord}
          onSuccess={() => {
            setEditModalOpen(false);
            fetchAllData(); // ✅ refresh table after edit
          }}
        />
      )}
    </div>
  );
};

export default AttendanceTable;
