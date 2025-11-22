"use client";

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Button,
  Divider,
  Chip,
  Avatar,
  Image,
} from "@heroui/react";
import { useDisclosure } from "@heroui/react";
import { Student } from "@/components/types/columns";
import { StatusStudentProp } from "../icon/StatusStudentProp";
import { SuccessCircleSvg } from "@/components/icon/success-circle";
import { DangerCircleSvg } from "@/components/icon/danger-circle";
import { Icon } from "@iconify/react";
import nationalities from "@/components/types/nationalities";

type ViewStudentProps = {
  student: Student;
  trigger?: React.ReactNode;
};

export default function ViewStudent({ student, trigger }: ViewStudentProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return "N/A";
    }
  };

  const getNationalityFlag = (nationalityName: string) => {
    const nationality = nationalities.find(
      (n) => n.name.toLowerCase() === nationalityName.toLowerCase()
    );
    return nationality
      ? `https://flagcdn.com/${nationality.code.toLowerCase()}.svg`
      : null;
  };

  const getPaymentStatusIcon = (status?: string) => {
    if (!status) return null;
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === "paid") return SuccessCircleSvg;
    if (normalizedStatus === "unpaid") return DangerCircleSvg;
    return null;
  };

  return (
    <>
      {trigger ? (
        <div
          onClick={onOpen}
          onTouchStart={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="inline-flex cursor-pointer touch-manipulation"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen();
            }
          }}
        >
          {trigger}
        </div>
      ) : (
        <Button color="primary" onPress={onOpen}>
          View Student
        </Button>
      )}

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="top-center"
        scrollBehavior="inside"
        size="2xl"
        classNames={{
          base: "max-w-[900px]",
        }}
      >
        <ModalContent className="dark text-foreground bg-background w-full max-w-[900px] p-2 sm:p-6">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 pb-4">
                <div className="flex items-center gap-4">
                  {student.image_url ? (
                    <Avatar
                      src={student.image_url}
                      className="w-20 h-20"
                      name={student.name || `${student.first_name} ${student.last_name}`}
                    />
                  ) : (
                    <Avatar
                      className="w-20 h-20 bg-default-200"
                      name={student.name || `${student.first_name} ${student.last_name}`}
                    />
                  )}
                  <div className="flex flex-col">
                    <h2 className="text-2xl font-bold text-foreground">
                      {student.first_name} {student.last_name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusStudentProp status={student.status} />
                    </div>
                  </div>
                </div>
              </ModalHeader>
              <Divider />
              <ModalBody className="gap-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Icon icon="solar:user-bold" width={20} />
                      Personal Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-default-500">Gender</p>
                        <p className="text-foreground capitalize">{student.gender}</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Date of Birth</p>
                        <p className="text-foreground">
                          {formatDate(student.date_of_birth)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Place of Birth</p>
                        <p className="text-foreground">{student.place_of_birth || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Nationality</p>
                        <div className="flex items-center gap-2">
                          {getNationalityFlag(student.nationality) && (
                            <Image
                              src={getNationalityFlag(student.nationality)!}
                              alt={student.nationality}
                              width={24}
                              height={16}
                              className="rounded"
                            />
                          )}
                          <p className="text-foreground">{student.nationality || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Icon icon="solar:phone-bold" width={20} />
                      Contact Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-default-500">Phone</p>
                        <p className="text-foreground">{student.phone || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Email</p>
                        <p className="text-foreground">{student.email || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Address</p>
                        <p className="text-foreground">{student.address || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Parent Contact</p>
                        <p className="text-foreground">{student.parent_contact || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Family Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Icon icon="solar:users-group-two-rounded-bold" width={20} />
                      Family Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-default-500">Mother's Name</p>
                        <p className="text-foreground">{student.mother_name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Mother's Occupation</p>
                        <p className="text-foreground">{student.mother_occupation || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Father's Name</p>
                        <p className="text-foreground">{student.father_name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Father's Occupation</p>
                        <p className="text-foreground">{student.father_occupation || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* School Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Icon icon="mdi:school" width={20} />
                      School Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-default-500">Branch</p>
                        <p className="text-foreground">{student.branch_name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Programs</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {(student as any).program_names && Array.isArray((student as any).program_names) && (student as any).program_names.length > 0 ? (
                            (student as any).program_names.map((program: string, index: number) => (
                              <Chip key={index} size="sm" variant="flat" color="primary">
                                {program}
                              </Chip>
                            ))
                          ) : student.program ? (
                            <Chip size="sm" variant="flat" color="primary">
                              {student.program}
                            </Chip>
                          ) : (
                            <p className="text-foreground">N/A</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Payment Status</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Chip
                            size="sm"
                            variant="flat"
                            color={
                              (student as any).payment_status?.toLowerCase() === "paid"
                                ? "success"
                                : "danger"
                            }
                            startContent={
                              getPaymentStatusIcon((student as any).payment_status) ? (
                                <div className="flex items-center mr-1">
                                  {getPaymentStatusIcon((student as any).payment_status)}
                                </div>
                              ) : null
                            }
                            classNames={{
                              content: "font-bold",
                            }}
                          >
                            {((student as any).payment_status 
                              ? (student as any).payment_status.charAt(0).toUpperCase() + (student as any).payment_status.slice(1).toLowerCase()
                              : "N/A")}
                          </Chip>
                        </div>
                      </div>
                      {(student as any).payment_note && (
                        <div>
                          <p className="text-sm text-default-500">Payment Note</p>
                          <p className="text-foreground">{(student as any).payment_note}</p>
                        </div>
                      )}
                      {(student as any).payment_end_date && (
                        <div>
                          <p className="text-sm text-default-500">Payment End Date</p>
                          <p className="text-foreground">
                            {formatDate((student as any).payment_end_date)}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-default-500">Admission Date</p>
                        <p className="text-foreground">
                          {formatDate(student.admission_date)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Insurance Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Icon icon="solar:shield-check-bold" width={20} />
                      Insurance Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-default-500">Insurance Number</p>
                        <p className="text-foreground">{student.insurance_number || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Insurance Expiry</p>
                        <p className="text-foreground">
                          {formatDate(student.insurance_expiry)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* System Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Icon icon="solar:settings-bold" width={20} />
                      System Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-default-500">Created By</p>
                        <p className="text-foreground">
                          {student.created_by_name || student.creator_name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Modified By</p>
                        <p className="text-foreground">
                          {student.modified_by_name || student.modifier_name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Created At</p>
                        <p className="text-foreground">
                          {student.created_at
                            ? new Date(student.created_at).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500">Updated At</p>
                        <p className="text-foreground">
                          {student.updated_at
                            ? new Date(student.updated_at).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Divider className="my-2" />
                <div className="flex justify-end">
                  <Button color="primary" radius="full" onPress={onClose}>
                    Close
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

