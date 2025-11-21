'use client';

import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  Textarea,
  Autocomplete,
  AutocompleteItem,
  Listbox,
  ListboxItem,
  useDisclosure,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { createClient } from '../../../lib/supabaseClient';
import { WarningCircleSvg } from '../icon/warning-circle';
import { DefaultCircleSvg } from '../icon/default-circle';
import { DangerCircleSvg } from '../icon/danger-circle';
import { SuccessCircleSvg } from '../icon/success-circle';

type Program = {
  id: string;
  name: string;
  branch_id: number;
  branch_name: string;
};

type User = { id: string; name: string };
type Branch = { id: number; name: string };

export default function AddTrail({ onSuccess }: { onSuccess?: () => void }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
const supabase = createClient();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [status, setStatus] = useState('PENDING');
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    client: '',
    phone: '',
    number_student: 1,
    assign_by: '',
    handle_by: '',
    reason: '',
  });

  useEffect(() => {
    const fetchData = async () => {
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
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'number_student' ? Number(value) : value,
    }));
  };

  const handleAdd = async () => {
    const { client, phone, number_student, reason, assign_by, handle_by } =
      formData;

    if (
      !client ||
      !phone ||
      !reason ||
      selectedPrograms.length === 0 ||
      !assign_by ||
      !handle_by ||
      !selectedBranchId
    ) {
      setError('Please fill in all required fields.');
      return;
    }

    const { error } = await supabase.rpc('create_trial_with_programs', {
      _client: client,
      _phone: phone,
      _number_student: number_student,
      _reason: reason,
      _status: status,
      _assign_by: assign_by,
      _handle_by: handle_by,
      _branch: selectedBranchId,
      _program_ids: selectedPrograms,
    });

    if (error) {
      setError(error.message);
    } else {
      setFormData({
        client: '',
        phone: '',
        number_student: 1,
        assign_by: '',
        handle_by: '',
        reason: '',
      });
      setSelectedPrograms([]);
      setSelectedBranchId(null);
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
        Add Trial
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
        <ModalContent className="dark text-foreground bg-background w-full max-w-[1000px] p-3 sm:p-6 rounded-xl">
          {(onClose) => (
            <>
              <ModalBody>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    name="client"
                    isRequired
                    label="Client"
                    placeholder="Enter client name"
                    value={formData.client}
                    onChange={handleChange}
                  />

                  <Input
                    name="phone"
                    isRequired
                    label="Phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleChange}
                  />

                  <Input
                    name="number_student"
                    isRequired
                    type="number"
                    label="Number of Students"
                    placeholder="1"
                    value={formData.number_student.toString()}
                    onChange={handleChange}
                  />

                  <Autocomplete
                    name="branch"
                    isRequired
                    label="Branch"
                    labelPlacement="outside"
                    placeholder="Select branch"
                    showScrollIndicators={false}
                    items={branches}
                    value={
                      branches.find((b) => b.id === selectedBranchId)?.name ?? ''
                    }
                    onInputChange={(branchName: string) => {
                      const branchObj = branches.find((b) => b.name === branchName);
                      setSelectedBranchId(branchObj ? branchObj.id : null);
                      setSelectedPrograms([]);
                    }}
                  >
                    {(item) => (
                      <AutocompleteItem key={item.id}>{item.name}</AutocompleteItem>
                    )}
                  </Autocomplete>

                  <Autocomplete
                    name="status"
                    isRequired
                    label="Status of Trial"
                    labelPlacement="outside"
                    placeholder="Select status"
                    defaultInputValue="PENDING"
                    onInputChange={(val) => setStatus(val)}
                  >
                    <AutocompleteItem startContent={WarningCircleSvg}>
                      PENDING
                    </AutocompleteItem>
                    <AutocompleteItem startContent={DefaultCircleSvg}>
                      APPROVED
                    </AutocompleteItem>
                    <AutocompleteItem startContent={DangerCircleSvg}>
                      REJECTED
                    </AutocompleteItem>
                    <AutocompleteItem startContent={SuccessCircleSvg}>
                      COMPLETED
                    </AutocompleteItem>
                  </Autocomplete>

                  <div className="mt-4 col-span-2">
                    <label className="block mb-1 text-sm font-medium text-default-500">
                      Programs<span className="text-red-500">*</span>
                    </label>
                    <div className="w-full max-w-[600px] border px-2 py-2 rounded-xl border-default-200 dark:border-default-100">
                      <Listbox
                        classNames={{
                          base: 'max-w-full',
                          list: 'max-h-[150px] overflow-y-auto',
                        }}
                        selectedKeys={new Set(selectedPrograms)}
                        items={programs.filter((p) =>
                          selectedBranchId ? p.branch_id === selectedBranchId : true
                        )}
                        label="Select Programs"
                        selectionMode="multiple"
                        variant="flat"
                        onSelectionChange={(keys) => {
                          if (keys instanceof Set) {
                            setSelectedPrograms(Array.from(keys));
                          }
                        }}
                      >
                        {(program: Program) => (
                          <ListboxItem key={program.id} textValue={program.name}>
                            <div className="flex flex-col">
                              <span className="text-small font-medium">
                                {program.name}
                              </span>
                              <span className="text-tiny text-default-400">
                                {program.branch_name}
                              </span>
                            </div>
                          </ListboxItem>
                        )}
                      </Listbox>
                    </div>
                  </div>

                  <Textarea
                    name="reason"
                    isRequired
                    className="max-w-[600px] max-h-[100px]"
                    label="Reason"
                    labelPlacement="outside"
                    placeholder="Enter the reason"
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, reason: e.target.value }))
                    }
                  />

                  <div>
                    <label className="block text-sm font-medium mb-1">Assign By</label>
                    <select
                      name="assign_by"
                      value={formData.assign_by}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded bg-background text-foreground"
                      required
                    >
                      <option value="">Assign By</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Handle By</label>
                    <select
                      name="handle_by"
                      value={formData.handle_by}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded bg-background text-foreground"
                      required
                    >
                      <option value="">Handle By</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {error && (
                    <p className="text-sm text-red-500 col-span-2">{error}</p>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="bordered" radius="full" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button color="primary" radius="full" onPress={handleAdd}>
                    Add Trial
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
