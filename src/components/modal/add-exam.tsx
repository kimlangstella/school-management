'use client';

import React, { useEffect, useState } from 'react';
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  useDisclosure,
} from '@heroui/react';
import { supabase } from '../../../lib/supabaseClient';
import { Icon } from '@iconify/react';

type Exam = {
  id?: string;
  branch_id: string;
  program_id: string;
  name: string;
  description: string;
  exam_type: string;
  total_marks: number;
  exam_date: string;
};

type Branch = {
  id: string;
  name: string;
};

type Program = {
  id: string;
  name: string;
};

export default function AddExamModal({ onSuccess }: { onSuccess?: () => void }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [form, setForm] = useState<Exam>({
    id: '',
    branch_id: '',
    program_id: '',
    name: '',
    description: '',
    exam_type: '',
    total_marks: 0,
    exam_date: '',
  });

  const [branches, setBranches] = useState<Branch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchBranches();
    fetchPrograms();
  }, []);

  const fetchBranches = async () => {
    const { data, error } = await supabase.rpc('get_all_branches');
    if (!error) setBranches(data);
  };

  const fetchPrograms = async () => {
    const { data, error } = await supabase.rpc('get_all_programs');
    if (!error) setPrograms(data);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'total_marks' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      id, branch_id, program_id, name, description,
      exam_type, total_marks, exam_date,
    } = form;

    if (!branch_id || !program_id || !name || !exam_type || !total_marks || !exam_date) {
      setMessage('Please fill in all required fields.');
      return;
    }

    let error;
    if (id) {
      const { error: updateError } = await supabase.rpc('update_exam', {
        _id: id,
        _branch_id: branch_id,
        _program_id: program_id,
        _name: name,
        _description: description,
        _exam_type: exam_type,
        _total_marks: total_marks,
        _exam_date: exam_date,
      });
      error = updateError;
    } else {
      const { error: insertError } = await supabase.rpc('insert_exam', {
        _branch_id: branch_id,
        _program_id: program_id,
        _name: name,
        _description: description,
        _exam_type: exam_type,
        _total_marks: total_marks,
        _exam_date: exam_date,
      });
      error = insertError;
    }

    if (error) {
      setMessage('Error: ' + error.message);
    } else {
      setMessage(id ? 'Exam updated!' : 'Exam added!');
      setForm({
        id: '',
        branch_id: '',
        program_id: '',
        name: '',
        description: '',
        exam_type: '',
        total_marks: 0,
        exam_date: '',
      });
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <>
      <Button color="primary" onPress={onOpen} endContent={<Icon icon="solar:add-circle-bold" width={20} />}>
        Add Exam
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
        <ModalContent className="dark text-foreground bg-background w-[500px] max-w-full p-3">
          {(onClose) => (
            <>
              <ModalBody>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <select
                    name="branch_id"
                    value={form.branch_id}
                    onChange={handleChange}
                    required
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>

                  <select
                    name="program_id"
                    value={form.program_id}
                    onChange={handleChange}
                    required
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select Program</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <input
                    name="name"
                    placeholder="Exam Name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full border rounded px-3 py-2"
                  />

                  <input
                    name="description"
                    placeholder="Description"
                    value={form.description}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />

                  <select
                    name="exam_type"
                    value={form.exam_type}
                    onChange={handleChange}
                    required
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select Type</option>
                    <option value="Midterm">Midterm</option>
                    <option value="Final">Final</option>
                    <option value="Quiz">Quiz</option>
                  </select>

                  <input
                    name="total_marks"
                    type="number"
                    placeholder="Total Marks"
                    value={form.total_marks || ''}
                    onChange={handleChange}
                    required
                    className="w-full border rounded px-3 py-2"
                  />

                  <input
                    name="exam_date"
                    type="date"
                    value={form.exam_date}
                    onChange={handleChange}
                    required
                    className="w-full border rounded px-3 py-2"
                  />

                  {message && <p className="text-red-500 text-sm">{message}</p>}

                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="bordered" radius="full" onPress={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" color="primary" radius="full">
                      {form.id ? 'Update' : 'Add'} Exam
                    </Button>
                  </div>
                </form>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
