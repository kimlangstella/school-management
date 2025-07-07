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

type Branch = {
  id: string;
  name: string;
};

type Program = {
  name: string;
  description: string;
  age: string;
  branch_id: string;
};

export default function AddProgram({ onSuccess }: { onSuccess?: () => void }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [formData, setFormData] = useState<Program>({
    name: '',
    description: '',
    age: '',
    branch_id: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    const { data, error } = await supabase.rpc('get_all_branches');
    if (error) setError(error.message);
    else setBranches(data as Branch[]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAdd = async () => {
    const { branch_id, name, description, age } = formData;
    if (!name || !age || !branch_id) {
      setError('All required fields must be filled.');
      return;
    }

    const { error } = await supabase.rpc('insert_program', {
      _branch_id: branch_id,
      _name: name,
      _description: description,
      _age: age,
    });

    if (error) {
      setError(error.message);
    } else {
      setFormData({ branch_id: '', name: '', description: '', age: '' });
      setError(null);
      onOpenChange(false);
      onSuccess?.(); // Refresh the list
    }
  };

  return (
    <>
      <Button
        color="primary"
        onPress={onOpen}
        endContent={<Icon icon="solar:add-circle-bold" width={20} />}
      >
        Add Program
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
        <ModalContent className="dark text-foreground bg-background w-[500px] max-w-full p-3">
          {(onClose) => (
            <>
              <ModalBody>
                <div className="space-y-4">
                  <select
                    value={formData.branch_id}
                    onChange={(e) =>
                      setFormData({ ...formData, branch_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>

                  <Input
                    name="name"
                    label="Program Name"
                    placeholder="Enter program name"
                    value={formData.name}
                    onChange={handleChange}
                    isRequired
                  />

                  <Input
                    name="description"
                    label="Description"
                    placeholder="Enter description"
                    value={formData.description}
                    onChange={handleChange}
                  />

                  <Input
                    name="age"
                    label="Age Range"
                    placeholder="Enter age (e.g. 12–15)"
                    value={formData.age}
                    onChange={handleChange}
                    isRequired
                  />

                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <Button variant="bordered" radius="full" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button color="primary" radius="full" onPress={handleAdd}>
                    Add Program
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
