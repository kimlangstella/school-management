'use client';

import {
  Button,
  Input,
  Autocomplete,
  AutocompleteItem,
  Modal,
  ModalContent,
  ModalBody,
  useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabaseClient";

type Branch = {
  id: string;
  name: string;
};

type Program = {
  id: string;
  name: string;
  branch_id: string;
};

export default function AddClassroom({ onUpdate }: { onUpdate?: () => void }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const supabase = createClient();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

  const [className, setClassName] = useState("");
  const [scheduledDay, setScheduledDay] = useState("Monday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [status, setStatus] = useState("active");

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: branches }, { data: programs }] = await Promise.all([
        supabase.rpc("get_all_branches"),
        supabase.rpc("get_all_programs"),
      ]);
      if (branches) setBranches(branches);
      if (programs) setPrograms(programs);
    };

    fetchData();
  }, []);

  const filteredPrograms = selectedBranchId
    ? programs.filter((p) => p.branch_id === selectedBranchId)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    const { error } = await supabase.rpc("create_classroom", {
      _program_id: selectedProgramId,
      _class_name: className,
      _scheduled_day: scheduledDay,
      _start_time: startTime,
      _end_time: endTime,
      _status: status,
    });

    setCreating(false);

    if (error) {
      setError(error.message);
    } else {
      onUpdate?.();
      onOpenChange(); // close modal
    }
  };

  return (
    <>
      <Button
        color="primary"
        onPress={onOpen}
        endContent={<Icon icon="solar:add-circle-bold" width={20} />}
      >
        Create Classroom
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
        <ModalContent className="dark text-foreground bg-background w-full sm:w-[600px] max-w-full p-2 sm:p-3">
          <ModalBody>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Autocomplete
                  label="Branch"
                  selectedKey={selectedBranchId ?? undefined}
                  onSelectionChange={(key) => {
                    setSelectedBranchId(key?.toString() ?? null);
                    setSelectedProgramId(null); // reset
                  }}
                  items={branches}
                  isRequired
                >
                  {(branch) => (
                    <AutocompleteItem key={branch.id}>{branch.name}</AutocompleteItem>
                  )}
                </Autocomplete>

                <Autocomplete
                  label="Program"
                  selectedKey={selectedProgramId ?? undefined}
                  onSelectionChange={(key) =>
                    setSelectedProgramId(key?.toString() ?? null)
                  }
                  items={filteredPrograms}
                  isRequired
                >
                  {(program) => (
                    <AutocompleteItem key={program.id}>{program.name}</AutocompleteItem>
                  )}
                </Autocomplete>

                <Input
                  label="Class Name"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  isRequired
                />

                <Autocomplete
                  label="Scheduled Day"
                  selectedKey={scheduledDay}
                  onSelectionChange={(key) => key && setScheduledDay(String(key))}
                >
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday","Saturday","Sunday"].map((day) => (
                    <AutocompleteItem key={day}>{day}</AutocompleteItem>
                  ))}
                </Autocomplete>

                <Input
                  label="Start Time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  isRequired
                />

                <Input
                  label="End Time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  isRequired
                />

                <Autocomplete
                  label="Status"
                  selectedKey={status}
                  onSelectionChange={(key) => key && setStatus(String(key))}
                >
                  <AutocompleteItem key="active">Active</AutocompleteItem>
                  <AutocompleteItem key="inactive">Inactive</AutocompleteItem>
                </Autocomplete>
              </div>

              {error && <p className="text-red-500 mb-2">{error}</p>}

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="bordered" onPress={onOpenChange}>
                  Cancel
                </Button>
                <Button type="submit" color="primary" isLoading={creating}>
                  Create
                </Button>
              </div>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
