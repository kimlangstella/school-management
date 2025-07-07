'use client';

import React, { useEffect, useState } from 'react';
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
} from '@heroui/react';
import { supabase } from '../../../lib/supabaseClient';

type Program = { id: string; name: string };
type User = { id: string; full_name: string };
type Branch = { id: string; name: string };

type TrailFormData = {
  client: string;
  phone: string;
  number_student: number;
  reason: string;
  program: string;
  assign_by: string;
  handle_by: string;
  branch: string;
  status: 'pending' | 'approved' | 'rejected';
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editingId: string;
  initialData: Partial<TrailFormData>;
  onSuccess?: () => void;
}

export default function TrailFormModal({
  isOpen,
  onClose,
  editingId,
  initialData,
  onSuccess,
}: Props) {
  const [formData, setFormData] = useState<TrailFormData>({
    client: '',
    phone: '',
    number_student: 1,
    reason: '',
    program: '',
    assign_by: '',
    handle_by: '',
    branch: '',
    status: 'pending',
  });

  const [programs, setPrograms] = useState<Program[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  useEffect(() => {
    const fetchOptions = async () => {
      const [pRes, uRes, bRes] = await Promise.all([
        supabase.rpc('get_all_programs'),
        supabase.rpc('get_all_users'),
        supabase.rpc('get_all_branches'),
      ]);
      if (!pRes.error) setPrograms(pRes.data);
      if (!uRes.error) setUsers(uRes.data);
      if (!bRes.error) setBranches(bRes.data);
    };
    fetchOptions();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'number_student' ? Number(value) : value,
    }));
  };

  const handleUpdate = async () => {
    const {
      client,
      phone,
      number_student,
      reason,
      program,
      assign_by,
      handle_by,
      branch,
      status,
    } = formData;

    if (
      !client ||
      !phone ||
      !program ||
      !assign_by ||
      !handle_by ||
      !reason ||
      !branch ||
      (status === 'rejected' && !reason)
    ) {
      setError('Please fill out all required fields.');
      return;
    }

    const { error } = await supabase
  .rpc('update_trail', {
    _id: editingId,
    _client: client,
    _phone: phone,
    _number_student: number_student,
    _reason: reason,
    _program: program,
    _assign_by: assign_by,
    _handle_by: handle_by,
    _branch: branch,
    _status: status,
  }, { head: false, count: 'exact', schema: 'student' }); // <--- Important


    if (error) {
      setError(error.message);
    } else {
      setError(null);
      onSuccess?.();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} placement="top-center">
      <ModalContent className="dark text-foreground bg-background w-[500px] max-w-full p-3">
        <ModalBody>
          <div className="space-y-4">
            <Input name="client" label="Client" value={formData.client} onChange={handleChange} />
            <Input name="phone" label="Phone" value={formData.phone} onChange={handleChange} />
            <Input
              name="number_student"
              type="number"
              label="Number of Students"
              value={formData.number_student.toString()}
              onChange={handleChange}
            />
            <Input
              name="reason"
              label="Reason"
              value={formData.reason}
              onChange={handleChange}
              disabled={formData.status !== 'rejected'}
            />
<label htmlFor="program" className="block mb-1 text-sm font-medium text-white">
  Program
</label>
            <select
              name="program"
              value={formData.program}
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
<label htmlFor="status" className="block mb-1 text-sm font-medium text-white">
  Status
</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
<label htmlFor="branch" className="block mb-1 text-sm font-medium text-white">
  Branch
</label>
            <select
              name="branch"
              value={formData.branch}
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
<label htmlFor="assign_by" className="block mb-1 text-sm font-medium text-white">
  Assign By
</label>
            <select
              name="assign_by"
              value={formData.assign_by}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Assign By</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
<label htmlFor="handle_by" className="block mb-1 text-sm font-medium text-white">
  Handle By
</label>
            <select
              name="handle_by"
              value={formData.handle_by}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Handle By</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="bordered" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleUpdate}>
              Update Trail
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
