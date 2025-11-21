'use client';

import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalBody,
  Button,
  Input,
} from '@heroui/react';
import { createClient } from '../../../lib/supabaseClient';

const supabase = createClient();

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onOpenChange: () => void;
  onSuccess: () => void;
};

export default function AddSchoolModal({
  isOpen,
  onClose,
  onOpenChange,
  onSuccess,
}: Props) {
  const [newSchool, setNewSchool] = useState({
    name: '',
    location: '',
    contact_info: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSchool((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = async () => {
    const { name, location, contact_info } = newSchool;
    if (!name || !location || !contact_info) {
      setError('All fields are required.');
      return;
    }

    const { error } = await supabase.rpc('insert_school', {
      _name: name,
      _location: location,
      _contact_info: contact_info,
    });

    if (error) {
      setError(error.message);
    } else {
      setNewSchool({ name: '', location: '', contact_info: '' });
      setError(null);
      onSuccess(); // trigger refresh
      onClose();   // close modal
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
      <ModalContent className="dark text-foreground bg-background w-[500px] max-w-full p-3">
        {(onClose) => (
          <>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  name="name"
                  label="School Name"
                  placeholder="Enter school name"
                  value={newSchool.name}
                  onChange={handleChange}
                  isRequired
                />
                <Input
                  name="location"
                  label="Location"
                  placeholder="Enter location"
                  value={newSchool.location}
                  onChange={handleChange}
                  isRequired
                />
                <Input
                  name="contact_info"
                  label="Contact Info"
                  placeholder="Enter phone or email"
                  value={newSchool.contact_info}
                  onChange={handleChange}
                  isRequired
                />

                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="bordered" radius="full" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" radius="full" onPress={handleAdd}>
                  Add School
                </Button>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
