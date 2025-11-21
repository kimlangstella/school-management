'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalBody,
  ModalContent,
  Input,
  Button,
  useDisclosure,
} from '@heroui/react';
import { createClient } from '../../../lib/supabaseClient';

type Course = {
  id: string;
  name: string;
  code: string;
  description: string;
  program_id: string;
};

export default function EditCourseModal({
  course,
  onSuccess,
  onClose,
}: {
  course: Course;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [formData, setFormData] = useState<Course>(course);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  useEffect(() => {
    if (course) {
      setFormData(course);
      onOpen();
    }
  }, [course]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    const { id, program_id, name, code, description } = formData;
    if (!id || !program_id || !name || !code) return;

    const { error } = await supabase.rpc('update_course', {
      _id: id,
      _program_id: program_id,
      _name: name,
      _code: code,
      _description: description,
    });

    if (error) setError(error.message);
    else {
      onOpenChange(false);
      onClose();
      onSuccess();
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
      <ModalContent className="dark text-foreground bg-background w-[500px] max-w-full p-3">
        {(modalClose) => (
          <>
            <ModalBody>
              <h3 className="text-large font-semibold mb-4">Edit Course</h3>
              <div className="space-y-4">
                <Input
                  name="name"
                  label="Course Name"
                  value={formData.name}
                  onChange={handleChange}
                  isRequired
                />
                <Input
                  name="code"
                  label="Course Code"
                  value={formData.code}
                  onChange={handleChange}
                  isRequired
                />
                <Input
                  name="description"
                  label="Description"
                  value={formData.description}
                  onChange={handleChange}
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="bordered" onPress={modalClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={handleUpdate}>
                  Save Changes
                </Button>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
