'use client';

import { useEffect, useState } from 'react';
import {
  Modal,
  ModalBody,
  ModalContent,
  Input,
  Button,
  useDisclosure,
} from '@heroui/react';
import { createClient } from '../../../lib/supabaseClient';

type Program = {
  id: string;
  name: string;
  description: string;
  age:string;
};

export default function EditProgramModal({
  program,
  onClose,
  onSuccess,
}: {
  program: Program | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [formData, setFormData] = useState<Program | null>(program);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  useEffect(() => {
    if (program) {
      setFormData(program);
      onOpen(); // Automatically open when new program is passed in
    }
  }, [program]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData) return;
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUpdate = async () => {
    if (!formData?.id || !formData.name || !formData.age) {
      setError('Name is required.');
      return;
    }

    const { error } = await supabase.rpc('update_program', {
      _id: formData.id,
      _name: formData.name,
      _description: formData.description,
      _age:formData.age
    });
console.log("formdata",formData)
    if (error) {
      setError(error.message);
    } else {
      onOpenChange(false);
      onSuccess();     // Trigger refresh
      onClose();       // Clear selected program in parent
    }
  };

  if (!formData) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
      <ModalContent className="dark text-foreground bg-background w-full sm:w-[500px] max-w-full p-2 sm:p-3">
        {(modalClose) => (
          <>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  name="name"
                  label="Program Name"
                  value={formData.name}
                  onChange={handleChange}
                  isRequired
                />
                <Input
                  name="description"
                  label="Description"
                  value={formData.description}
                  onChange={handleChange}
                />
                <Input
                  name="age"
                  label="Age_Rank"
                  value={formData.age}
                  onChange={handleChange}
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="bordered" radius="full" onPress={modalClose}>
                  Cancel
                </Button>
                <Button color="primary" radius="full" onPress={handleUpdate}>
                  Save
                </Button>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
