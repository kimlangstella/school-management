'use client';

import { useState, useEffect } from 'react';
import AddAttendanceModal from '@/components/modal/add-attendance';
import AttendanceTable from '@/components/table/attendance-table';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { supabase } from '../../../lib/supabaseClient';

type AttendanceRecord = {
  id: string;
  student_id: string;
  program_id: string;
  branch_id: string;
  attendance_date: string;
  status: string;
  remarks: string;
};

export default function AttendancePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onOpenChange = () => setIsOpen((prev) => !prev);

  const fetchAttendance = async () => {
    const { data, error } = await supabase.rpc('get_all_attendance_records');
    if (error) setError(error.message);
    else setRecords(data as AttendanceRecord[]);
  };

  useEffect(() => {
    fetchAttendance(); // initial load
  }, []);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">📋 Student Attendance</h1>
        <Button
          color="primary"
          onPress={() => setIsOpen(true)}
          endContent={<Icon icon="solar:add-circle-bold" width={20} />}
        >
          Add Attendance
        </Button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Pass records to AttendanceTable */}
      <AttendanceTable records={records} />

      <AddAttendanceModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onClose={() => setIsOpen(false)}
        onSuccess={() => {
          fetchAttendance(); // ✅ correct name
          setIsOpen(false);  // ✅ close modal
        }}
      />
    </div>
  );
}
