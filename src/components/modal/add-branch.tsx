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

type School = {
  id: string;
  name: string;
};

type Branch = {
  school_id: string;
  name: string;
  address: string;
  phone: string;
};

export default function AddBranch({ onSuccess }: { onSuccess?: () => void }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [schools, setSchools] = useState<School[]>([]);
  const [formData, setFormData] = useState<Branch>({
    school_id: '',
    name: '',
    address: '',
    phone: '',
  });
  const [error, setError] = useState<string | null>(null);
const supabase = createClient();
  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    const { data, error } = await supabase.rpc('get_all_schools'); // Adjust this if needed
    if (error) setError(error.message);
    else setSchools(data as School[]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAdd = async () => {
    const { school_id, name, address, phone } = formData;

    if (!school_id || !name) {
      setError('School and branch name are required.');
      return;
    }

    const { error } = await supabase.rpc('insert_branch', {
      _school_id: school_id,
      _name: name,
      _address: address,
      _phone: phone,
    });

    if (error) {
      setError(error.message);
    } else {
      setFormData({
        school_id: '',
        name: '',
        address: '',
        phone: '',
      });
      setError(null);
      onOpenChange(false);
      onSuccess?.(); // Refresh branches list
    }
  };

  return (
    <>
      <Button
        color="primary"
        onPress={onOpen}
        endContent={<Icon icon="solar:add-circle-bold" width={20} />}
      >
        Add Branch
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
        <ModalContent className="dark text-foreground bg-background w-full sm:w-[500px] max-w-full p-2 sm:p-3">
          {(onClose) => (
            <>
              <ModalBody>
                <div className="space-y-4">
                  <select
                    value={formData.school_id}
                    onChange={(e) =>
                      setFormData({ ...formData, school_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                    required
                  >
                    <option value="">Select School</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>

                  <Input
                    name="name"
                    label="Branch Name"
                    placeholder="Enter branch name"
                    value={formData.name}
                    onChange={handleChange}
                    isRequired
                  />

                  <Input
                    name="address"
                    label="Address"
                    placeholder="Enter branch address"
                    value={formData.address}
                    onChange={handleChange}
                  />

                  <Input
                    name="phone"
                    label="Phone Number"
                    placeholder="Enter branch phone number"
                    value={formData.phone}
                    onChange={handleChange}
                  />

                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <Button variant="bordered" radius="full" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button color="primary" radius="full" onPress={handleAdd}>
                    Add Branch
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
