'use client';

import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  useDisclosure,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { supabase } from '../../../lib/supabaseClient';

type Program = {
  id: string;
  name: string;
};

type User = {
  id: string;
  full_name: string;
};

type Branch = {
  id: string;
  name: string;
};

type Trail = {
  client: string;
  phone: string;
  number_student: number;
  reason: string;
  status: string;
  program: string;
  assign_by: string;
  handle_by: string;
  branch_id: string; // ✅ Correct name
};

export default function AddTrail({ onSuccess }: { onSuccess?: () => void }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [formData, setFormData] = useState<Trail>({
    client: '',
    phone: '',
    number_student: 1,
    reason: '',
    status: 'pending',
    program: '',
    assign_by: '',
    handle_by: '',
    branch_id: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProgramsAndUsers();
  }, []);

  const fetchProgramsAndUsers = async () => {
    const [programRes, userRes, branchRes] = await Promise.all([
      supabase.rpc('get_all_programs'),
      supabase.rpc('get_all_users'),
      supabase.rpc('get_all_branches'),
    ]);

    if (programRes.error || userRes.error || branchRes.error) {
      setError(
        programRes.error?.message ||
          userRes.error?.message ||
          branchRes.error?.message ||
          'Failed to fetch data'
      );
    } else {
      setPrograms(programRes.data || []);
      setUsers(userRes.data || []);
      setBranches(branchRes.data || []);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'number_student' ? Number(value) : value,
    }));
  };

  const handleAdd = async () => {
    const {
      client,
      phone,
      number_student,
      reason,
      status,
      program,
      assign_by,
      handle_by,
      branch_id,
    } = formData;

    if (
      !client ||
      !phone ||
      !reason ||
      !program ||
      !assign_by ||
      !handle_by ||
      !branch_id
    ) {
      setError('Please fill in all required fields.');
      return;
    }

    const { error } = await supabase.rpc('insert_trail', {
      _client: client,
      _phone: phone,
      _number_student: number_student,
      _reason: reason,
      _status: status,
      _program: program,
      _assign_by: assign_by,
      _handle_by: handle_by,
      _branch: branch_id,
    });

    if (error) {
      setError(error.message);
    } else {
      setFormData({
        client: '',
        phone: '',
        number_student: 1,
        reason: '',
        status: 'pending',
        program: '',
        assign_by: '',
        handle_by: '',
        branch_id: '',
      });
      setError(null);
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <>
      <Button
        color="primary"
        onPress={onOpen}
        endContent={<Icon icon="solar:add-circle-bold" width={20} />}
      >
        Add Trail
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
        <ModalContent className="dark text-foreground bg-background w-[500px] max-w-full p-3">
          {(onClose) => (
            <>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    name="client"
                    label="Client"
                    placeholder="Enter client name"
                    value={formData.client}
                    onChange={handleChange}
                    isRequired
                  />

                  <Input
                    name="phone"
                    label="Phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    isRequired
                  />

                  <Input
                    name="number_student"
                    type="number"
                    label="Number of Students"
                    placeholder="1"
                    value={formData.number_student.toString()}
                    onChange={handleChange}
                    isRequired
                  />

                  <Input
                    name="reason"
                    label="Reason"
                    placeholder="Reason for trail"
                    value={formData.reason}
                    onChange={handleChange}
                    isRequired
                  />
                  <label htmlFor="program" className="block mb-1 text-sm font-medium text-white">
  Program
</label>
                  <select
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded"
                    required
                  >
                    <option value="">Select Program</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name}
                      </option>
                    ))}
                  </select>
<label htmlFor="nranch_id" className="block mb-1 text-sm font-medium text-white">
  Branch
</label>
                  <select
                    name="branch_id"
                    value={formData.branch_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded"
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
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
                    required
                  >
                    <option value="">Assign By</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
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
                    required
                  >
                    <option value="">Handle By</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>

                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <Button variant="bordered" radius="full" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button color="primary" radius="full" onPress={handleAdd}>
                    Add Trail
                  </Button>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
