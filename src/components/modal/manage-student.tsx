"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Chip, Spinner, Checkbox,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "../../../lib/supabaseClient";

type Classroom = { id: string; class_name: string };

type EnrollmentRow = {
  enrollment_id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  classroom_id: string;
  registered_at: string;
  status: "active" | "paused" | "withdrawn" | "completed" | string;
};

type Props = {
  isOpen: boolean;
  classroom: Classroom;
  onClose: () => void;
  onChanged?: () => void;
};

export default function ManageStudentsModal({
  isOpen,
  classroom,
  onClose,
  onChanged,
}: Props) {
  const queryClient = useQueryClient();

  const [effectiveDate, setEffectiveDate] = useState<string>("");
  const [alsoDeleteAttendance, setAlsoDeleteAttendance] = useState(false);
  const supabase = createClient();
  useEffect(() => {
    if (isOpen) {
      setEffectiveDate(new Date().toISOString().slice(0, 10));
      setAlsoDeleteAttendance(false);
    }
  }, [isOpen]);

  const {
    data: enrollments = [],
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ["classroom-enrollments", classroom?.id],
    enabled: isOpen && !!classroom?.id,
    queryFn: async (): Promise<EnrollmentRow[]> => {
      const { data, error } = await supabase.rpc("get_classroom_enrollments", {
        p_classroom: classroom.id,
      });
      if (error) throw error;
      return (data ?? []) as EnrollmentRow[];
    },
    staleTime: 30_000,
  });

  // HARD DELETE
  const deleteEnrollment = async (row: EnrollmentRow) => {
    const ok = confirm(
      `Permanently remove ${row.first_name} ${row.last_name} from "${classroom.class_name}"?`
      + (alsoDeleteAttendance ? "\n\nThis will also delete their attendance history in this class." : "")
    );
    if (!ok) return;

    const { error } = await supabase.rpc("hard_remove_enrollment", {
      p_enrollment_id: row.enrollment_id,
      p_delete_attendance: alsoDeleteAttendance,
    });

    if (error) {
      alert(error.message);
      return;
    }

    await refetch();
    queryClient.invalidateQueries({ queryKey: ["classroom-enrollment-counts"] });
    onChanged?.();
  };

  const statusChip = (s: string) => {
    if (s === "active") return <Chip size="sm" color="success" variant="flat">active</Chip>;
    if (s === "withdrawn") return <Chip size="sm" color="danger" variant="flat">withdrawn</Chip>;
    if (s === "paused") return <Chip size="sm" color="warning" variant="flat">paused</Chip>;
    if (s === "completed") return <Chip size="sm" variant="flat">completed</Chip>;
    return <Chip size="sm" variant="flat">{s}</Chip>;
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} placement="top-center" size="lg">
      <ModalContent className="dark text-foreground bg-background">
        {(close) => (
          <>
            <ModalHeader className="flex items-center gap-2">
              <Icon icon="solar:users-group-rounded-linear" width={20} />
              Manage students — <span className="font-semibold">{classroom.class_name}</span>
            </ModalHeader>

            <ModalBody className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs font-semibold opacity-70">Effective date</label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="h-8 rounded-lg border border-default-200 bg-default-100 px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  size="sm"
                  variant="bordered"
                  className="h-8"
                  onPress={() => setEffectiveDate(new Date().toISOString().slice(0, 10))}
                >
                  Today
                </Button>

                <Checkbox
                  isSelected={alsoDeleteAttendance}
                  onValueChange={setAlsoDeleteAttendance}
                >
                  Also delete attendance in this class
                </Checkbox>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold opacity-80">Current Roster</h4>

                {isLoading ? (
                  <div className="flex items-center gap-2 py-2">
                    <Spinner size="sm" /> Loading…
                  </div>
                ) : error ? (
                  <p className="text-danger">Failed to load students.</p>
                ) : enrollments.length === 0 ? (
                  <p className="text-default-500">No students in this classroom.</p>
                ) : (
                  <ul className="divide-y divide-default-100 rounded-lg border border-default-100">
                    {enrollments.map((e) => (
                      <li
                        key={e.enrollment_id}
                        className="flex items-center justify-between gap-3 px-3 py-2"
                      >
                        <div className="min-w-0 truncate">
                          <span className="font-medium">
                            {e.first_name} {e.last_name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {statusChip(e.status)}
                          <Button
                            size="sm"
                            color="danger"
                            variant="flat"
                            onPress={() => deleteEnrollment(e)}
                          >
                            Delete
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </ModalBody>

            <ModalFooter>
              <Button variant="bordered" onPress={close}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
