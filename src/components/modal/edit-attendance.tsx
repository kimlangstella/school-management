'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabaseClient';
import {
    Modal,
    ModalContent,
    ModalBody,
    Input,
    Button,
} from '@heroui/react'

// FIX: Defined specific type for the record
type AttendanceRecord = {
    id: string;
    student_id: string;
    program_id: string;
    branch_id: string;
    attendance_date: string;
    status: string;
    remarks: string;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onOpenChange: () => void;
    record: AttendanceRecord | null; // FIX: Replaced 'any'
    onSuccess: () => void;
};

// FIX: Helper types for lists
type Student = { id: string; first_name: string; last_name: string; full_name?: string };
type Program = { id: string; name: string };
type Branch = { id: string; name: string };

export default function EditAttendanceModal({
                                                isOpen,
                                                onClose,
                                                onOpenChange,
                                                record,
                                                onSuccess,
                                            }: Props) {
    // FIX: Added generic types to useState to avoid 'never' type issues
    const [students, setStudents] = useState<Student[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);

    const [form, setForm] = useState({
        student_id: '',
        program_id: '',
        branch_id: '',
        attendance_date: '',
        status: 'present',
        remarks: '',
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && record) {
            fetchData();
            setForm({
                student_id: record.student_id,
                program_id: record.program_id,
                branch_id: record.branch_id,
                attendance_date: record.attendance_date,
                status: record.status,
                remarks: record.remarks,
            });
        }
    }, [isOpen, record]);

    const fetchData = async () => {
        const studentsData = await supabase.rpc('get_all_students');
        const programsData = await supabase.rpc('get_all_programs');
        const branchesData = await supabase.rpc('get_all_branches');
        // FIX: safely cast data
        if (studentsData.data) setStudents(studentsData.data as Student[]);
        if (programsData.data) setPrograms(programsData.data as Program[]);
        if (branchesData.data) setBranches(branchesData.data as Branch[]);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async () => {
        if (!record) return; // Guard clause

        setError(null);

        const { error } = await supabase.rpc('update_attendance_record', {
            _id: record.id,
            _student_id: form.student_id,
            _program_id: form.program_id,
            _branch_id: form.branch_id,
            _attendance_date: form.attendance_date,
            _status: form.status,
            _remarks: form.remarks,
        });

        if (error) {
            setError(error.message);
        } else {
            onSuccess();
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
            <ModalContent className="dark text-foreground bg-background w-[500px] max-w-full p-3">
                {(onClose) => (
                    <>
                        <ModalBody>
                            <div className="space-y-4">
                                <select
                                    name="student_id"
                                    value={form.student_id}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded"
                                    required
                                >
                                    <option value="">Select Student</option>
                                    {students.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.full_name || `${s.first_name} ${s.last_name}`}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    name="program_id"
                                    value={form.program_id}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded"
                                >
                                    <option value="">Select Program</option>
                                    {programs.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    name="branch_id"
                                    value={form.branch_id}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded"
                                >
                                    <option value="">Select Branch</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    type="date"
                                    name="attendance_date"
                                    value={form.attendance_date}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded"
                                />

                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded"
                                >
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                </select>

                                <Input
                                    name="remarks"
                                    label="Remarks"
                                    placeholder="Optional remarks"
                                    value={form.remarks}
                                    onChange={handleChange}
                                />

                                {error && <p className="text-sm text-red-500">{error}</p>}
                            </div>

                            <div className="mt-6 flex justify-end gap-2">
                                <Button variant="bordered" radius="full" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button color="primary" radius="full" onPress={handleUpdate}>
                                    Update
                                </Button>
                            </div>
                        </ModalBody>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}