'use client';

import { useEffect, useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalBody,
  Input,
  Button,
} from '@heroui/react';
import { supabase } from '../../../lib/supabaseClient';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onOpenChange: () => void;
  school: {
    id: string;
    name: string;
    location: string;
    contact_info: string;
  } | null;
  onSuccess: () => void;
};

export default function EditSchoolModal({
  isOpen,
  onClose,
  onOpenChange,
  school,
  onSuccess,
}: Props) {
  const [form, setForm] = useState({
    id: '',
    name: '',
    location: '',
    contact_info: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (school) {
      setForm({
        id: school.id,
        name: school.name,
        location: school.location,
        contact_info: school.contact_info,
      });
    }
  }, [school]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    const { id, name, location, contact_info } = form;
    if (!id || !name || !location || !contact_info) {
      setError('All fields are required.');
      return;
    }

    const { error } = await supabase.rpc('update_school', {
      _id: id,
      _name: name,
      _location: location,
      _contact_info: contact_info,
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
                <Input
                  name="name"
                  label="School Name"
                  placeholder="Enter school name"
                  value={form.name}
                  onChange={handleChange}
                  isRequired
                />
                <Input
                  name="location"
                  label="Location"
                  placeholder="Enter location"
                  value={form.location}
                  onChange={handleChange}
                  isRequired
                />
                <Input
                  name="contact_info"
                  label="Contact Info"
                  placeholder="Enter contact info"
                  value={form.contact_info}
                  onChange={handleChange}
                  isRequired
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
