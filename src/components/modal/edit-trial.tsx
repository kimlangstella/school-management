"use client";

import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Input,
  Listbox,
  ListboxItem,
  Modal,
  ModalBody,
  ModalContent,
  Textarea,
} from "@heroui/react";
import { supabase } from "../../../lib/supabaseClient";

type Program = { id: string; name: string; branch_id: string };
type User = { id: string; name: string };
type Branch = { id: string; name: string };

type TrailFormData = {
  client: string;
  phone: string;
  number_student: number;
  reason: string;
  programs: string[];
  assign_by: string;
  handle_by: string;
  branch: string;
  status: "pending" | "approved" | "rejected" | "completed";
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editingId: string;
  initialData: Partial<TrailFormData>;
  onSuccess?: () => void;
}

export default function TrailFormModal({
  isOpen,
  onClose,
  editingId,
  initialData,
  onSuccess,
}: Props) {
  const [formData, setFormData] = useState<TrailFormData>({
    client: "",
    phone: "",
    number_student: 1,
    reason: "",
    programs: [],
    assign_by: "",
    handle_by: "",
    branch: "",
    status: "pending",
  });

  const [programs, setPrograms] = useState<Program[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load initial data when editing
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        programs: initialData.program_ids ?? [],
        branch: initialData.branch ?? "",
        status: initialData.status ?? "pending",
      }));
    }
  }, [initialData]);

  // Load all programs/users/branches
  useEffect(() => {
    const fetchOptions = async () => {
      const [pRes, uRes, bRes] = await Promise.all([
        supabase.rpc("get_all_programs"),
        supabase.rpc("get_all_users"),
        supabase.rpc("get_all_branches"),
      ]);

      if (!pRes.error) setPrograms(pRes.data);
      if (!uRes.error) setUsers(uRes.data);
      if (!bRes.error) setBranches(bRes.data);
    };

    fetchOptions();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "number_student" ? Number(value) : value,
    }));
  };

  const handleUpdate = async () => {
    const {
      client,
      phone,
      number_student,
      reason,
      programs,
      assign_by,
      handle_by,
      branch,
      status,
    } = formData;

    if (
      !client ||
      !phone ||
      !branch ||
      !assign_by ||
      !handle_by ||
      programs.length === 0
    ) {
      setError("Please fill out all required fields.");
      return;
    }

    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const modified_by =
      userData?.id || userData?.user?.id || localStorage.getItem("userId");

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(modified_by)) {
      setError("Invalid user ID format. UUID expected.");
      return;
    }

    const { error } = await supabase.rpc("update_trial_with_programs", {
      _id: editingId,
      _client: client,
      _phone: phone,
      _number_student: number_student,
      _reason: reason,
      _program_ids: programs,
      _assign_by: assign_by,
      _handle_by: handle_by,
      _branch: branch,
      _status: status,
      _modified_by: modified_by,
    });

    if (error) {
      setError(error.message);
    } else {
      setError(null);
      onSuccess?.();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} placement="top-center">
      <ModalContent className="dark text-foreground bg-background w-full max-w-lg p-5">
        <ModalBody className="space-y-4">
          <h2 className="text-xl font-semibold">Update Trial</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="client"
              label="Client"
              value={formData.client}
              onChange={handleChange}
            />
            <Input
              name="phone"
              label="Phone"
              value={formData.phone}
              onChange={handleChange}
            />
            <Input
              name="number_student"
              type="number"
              label="Number of Students"
              value={formData.number_student.toString()}
              onChange={handleChange}
            />
            <Input
              name="reason"
              label="Reason"
              value={formData.reason}
              onChange={handleChange}
              disabled={formData.status !== "rejected"}
            />

            <Autocomplete
              label="Branch"
              selectedKey={formData.branch}
              onSelectionChange={(key) =>
                setFormData((prev) => ({
                  ...prev,
                  branch: String(key),
                  programs: [],
                }))
              }
            >
              {branches.map((item) => (
                <AutocompleteItem key={item.id}>{item.name}</AutocompleteItem>
              ))}
            </Autocomplete>

            <Autocomplete
              label="Status"
              selectedKey={formData.status}
              onSelectionChange={(key) =>
                setFormData((prev) => ({
                  ...prev,
                  status: String(key) as TrailFormData["status"],
                }))
              }
            >
              <AutocompleteItem key="pending">PENDING</AutocompleteItem>
              <AutocompleteItem key="approved">APPROVED</AutocompleteItem>
              <AutocompleteItem key="rejected">REJECTED</AutocompleteItem>
              <AutocompleteItem key="completed">COMPLETED</AutocompleteItem>
            </Autocomplete>

            <div className="col-span-2">
              <label className="block mb-1 text-sm">
                Programs<span className="text-red-500">*</span>
              </label>
              <div className="w-full border px-2 py-2 rounded-xl border-default-200 dark:border-default-100">
                <Listbox
                  selectedKeys={new Set(formData.programs)}
                  items={programs.filter(
                    (p) => p.branch_id === formData.branch
                  )}
                  selectionMode="multiple"
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys).map((k) => String(k));
                    setFormData((prev) => ({ ...prev, programs: selected }));
                  }}
                >
                  {(program) => (
                    <ListboxItem key={program.id}>
                      <div className="flex flex-col">
                        <span className="text-small font-medium">
                          {program.name}
                        </span>
                      </div>
                    </ListboxItem>
                  )}
                </Listbox>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Assign By</label>
              <select
                name="assign_by"
                value={formData.assign_by}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded bg-background text-foreground"
              >
                <option value="">Assign By</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Handle By</label>
              <select
                name="handle_by"
                value={formData.handle_by}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded bg-background text-foreground"
              >
                <option value="">Handle By</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="bordered" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleUpdate}>
              Update Trial
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
