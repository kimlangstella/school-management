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
import { createClient } from '../../../lib/supabaseClient';

type Program = {
  id: string;
  name: string;
};

type Course = {
  name: string;
  code: string;
  description: string;
  program_id: string;
};

export default function AddCourse({ onSuccess }: { onSuccess?: () => void }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [formData, setFormData] = useState<Course>({
    name: '',
    code: '',
    description: '',
    program_id: '',
  });
  const [error, setError] = useState<string | null>(null);
const supabase = createClient();
  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    const { data, error } = await supabase.rpc('get_all_programs');
    if (error) setError(error.message);
    else setPrograms(data as Program[]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAdd = async () => {
    const { program_id, name, code, description } = formData;

    if (!program_id || !name || !code) {
      setError('Please fill in all required fields.');
      return;
    }



    const { error } = await supabase.rpc('insert_course', {
      _program_id: program_id,
      _name: name,
      _code: code,
      _description: description,
    });

    if (error) {
      setError(error.message);
    } else {
      setFormData({
        program_id: '',
        name: '',
        code: '',
        description: '',
      });
      setError(null);
      onOpenChange(false);
      onSuccess?.(); // Refresh the course list
    }
  };

  return (
    <>
      <Button
        color="primary"
        onPress={onOpen}
        endContent={<Icon icon="solar:add-circle-bold" width={20} />}
      >
        Add Course
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
        <ModalContent className="dark text-foreground bg-background w-full sm:w-[500px] max-w-full p-2 sm:p-3">
          {(onClose) => (
            <>
              <ModalBody>
                <div className="space-y-4">
                  <select
                    value={formData.program_id}
                    onChange={(e) =>
                      setFormData({ ...formData, program_id: e.target.value })
                    }
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

                  <Input
                    name="name"
                    label="Course Name"
                    placeholder="Enter course name"
                    value={formData.name}
                    onChange={handleChange}
                    isRequired
                  />

                  <Input
                    name="code"
                    label="Course Code"
                    placeholder="e.g. MATH101"
                    value={formData.code}
                    onChange={handleChange}
                    isRequired
                  />

                  <Input
                    name="description"
                    label="Description"
                    placeholder="Enter course description"
                    value={formData.description}
                    onChange={handleChange}
                  />

                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <Button variant="bordered" radius="full" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button color="primary" radius="full" onPress={handleAdd}>
                    Add Course
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
