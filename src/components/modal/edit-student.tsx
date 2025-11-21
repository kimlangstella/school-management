"use client";
import {
  Autocomplete,
  AutocompleteItem,
  Avatar,
  Button,
  Divider,
  Input,
  Listbox,
  ListboxItem,
  Modal,
  ModalBody,
  ModalContent,
  useDisclosure,
} from "@heroui/react";
import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabaseClient";
import { Student } from "@/components/types/columns";
import nationalities from "@/components/types/nationalities";
import { DangerCircleSvg } from "@/components/icon/danger-circle";
import { SuccessCircleSvg } from "@/components/icon/success-circle";
import "react-datepicker/dist/react-datepicker.css";
import Image from "next/image";

type BranchObject = { id: string; name: string };
type User = { id: string; name: string };
type Program = {
  branch_id: string;
  id: string;
  name: string;
  branch_name: string;
};

type EditStudentProps = {
  student: Student & { programs?: { id: string; name: string }[] };
  onUpdate: (updatedStudent: Student) => void;
  trigger?: React.ReactNode;
};

export default function EditStudent({
  student,
  onUpdate,
  trigger,
}: EditStudentProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
const supabase = createClient();
  const [branches, setBranches] = useState<BranchObject[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  // const [paymentDate, setPaymentDate] = useState(
  //   student.payment_end_date || ""
  // );

  const [gender, setGender] = useState<string>(student.gender ?? "male");
  const [status, setStatus] = useState<string>(student.status ?? "active");
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(
    student.branch_id ?? null
  );
  const [selectedModifiedBy, setSelectedModifiedBy] = useState<string | null>(
    student.modified_by ?? null
  );
  const nationalityCode = nationalities.find(
    (n) => n.name === student.nationality
  )?.code;
  const [selectedNationality, setSelectedNationality] = useState<
    string | undefined
  >(nationalityCode);
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([]);
  const [paymentStatus, setPaymentStatus] = useState(
    student.payment_status ?? "unpaid"
  );
  const [paymentNote, setPaymentNote] = useState(student.payment_note ?? "");

  // Load dropdown data
  useEffect(() => {
    const fetchData = async () => {
      const [{ data: branchData }, { data: programData }, { data: userList }] =
        await Promise.all([
          supabase.rpc("get_all_branches"),
          supabase.rpc("get_all_programs"),
          supabase.rpc("get_all_users"),
        ]);

      if (branchData) setBranches(branchData);
      if (userList) setUsers(userList);
      if (programData) setPrograms(programData);
      if (student.programs && Array.isArray(student.programs)) {
        const ids = student.programs.map((p) => p.id);
        setSelectedProgramIds(ids);
      }
    };
    fetchData();
  }, []);
useEffect(() => {
  if (isOpen && student?.program_names?.length && programs.length) {
    const ids = programs
      .filter((p) =>
        student.program_names.includes(p.name)
      )
      .map((p) => String(p.id));
    setSelectedProgramIds(ids);}

}, [isOpen, student, programs]);
const filteredPrograms = programs.filter(
  (p) =>
    !selectedBranchId ||
    p.branch_id === selectedBranchId ||
    selectedProgramIds.includes(p.id) // ✅ Always include old selections
);

const uniquePrograms = Array.from(
  new Map(filteredPrograms.map((p) => [p.name, p])).values()
);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    let imageUrl = student.image_url ?? "";
    const imageFile = formData.get("image") as File | null;
    if (imageFile && imageFile.name) {
      const ext = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;
      const filePath = `students/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("student-images")
        .upload(filePath, imageFile);

      if (uploadError) {
        setError("Image upload failed: " + uploadError.message);
        return;
      }

      const { data: publicUrl } = supabase.storage
        .from("student-images")
        .getPublicUrl(filePath);
      imageUrl = publicUrl?.publicUrl ?? imageUrl;
    }
    const finalProgramIds =
      selectedProgramIds.length > 0
        ? selectedProgramIds
        : student.programs?.map((p) => String(p.id)) || [];
    const payload = {
      _id: String(student.id),
      _first_name: formData.get("first_name")?.toString() || "",
      _last_name: formData.get("last_name")?.toString() || "",
      _gender: gender,
      _date_of_birth: formData.get("dob") || null,
      _place_of_birth: formData.get("pob")?.toString() || "",
      _nationality:
        nationalities.find((n) => n.code === selectedNationality)?.name || "",
      _mother_name: formData.get("mother_name")?.toString() || "",
      _mother_occupation: formData.get("mother_occupation")?.toString() || "",
      _father_name: formData.get("father_name")?.toString() || "",
      _father_occupation: formData.get("father_occupation")?.toString() || "",
      _address: formData.get("address")?.toString() || "",
      _parent_contact: formData.get("parent_contact")?.toString() || "",
      _phone: formData.get("phone")?.toString() || "",
      _email: formData.get("email")?.toString() || "",
      _password: student.password || "",
      _branch: selectedBranchId || null,
      _status: status,
      _admission_date: formData.get("admission_date") || null,
      _image_url: imageUrl,
      _insurance_number: formData.get("insurance_number")?.toString() || "",
      _insurance_expiry: formData.get("insurance_expiry_date") || null,
      _modified_by: selectedModifiedBy || null,
      _program_ids: finalProgramIds,
      _payment_status: paymentStatus,
      _payment_note: paymentNote,
      _payment_end_date: formData.get("payment_end_date") || null,
    };

    const { error: updateError } = await supabase.rpc(
      "update_student",
      payload
    );

    if (updateError) {
      console.error("❌ Update failed:", updateError.message);
      setError("Update failed: " + updateError.message);
      return;
    }

    onUpdate({ ...student, ...payload });
    onOpenChange();
  };

  return (
    <>
      {trigger ? (
        <div onClick={onOpen} className="inline-flex cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button color="warning" onPress={onOpen}>
          Edit Student
        </Button>
      )}

      <Modal isOpen={isOpen} placement="top-center" onOpenChange={onOpenChange}>
        <ModalContent className="dark text-foreground bg-background w-[1000px] max-w-full p-3">
          <ModalBody>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Input
                  name="first_name"
                  isRequired
                  label="First Name"
                  defaultValue={student.first_name}
                />
                <Input
                  name="last_name"
                  isRequired
                  label="Last Name"
                  defaultValue={student.last_name}
                />
                <Autocomplete
                  name="gender"
                  label="Gender"
                  isRequired
                  selectedKey={gender}
                  onSelectionChange={(key) => setGender(key?.toString() ?? "")}
                >
                  <AutocompleteItem key="male">Male</AutocompleteItem>
                  <AutocompleteItem key="female">Female</AutocompleteItem>
                  <AutocompleteItem key="other">Other</AutocompleteItem>
                </Autocomplete>
                <Input
                  name="dob"
                  label="Date of Birth"
                  type="date"
                  defaultValue={student.date_of_birth?.split("T")[0]}
                />
                <Input
                  name="pob"
                  label="Place of Birth"
                  defaultValue={student.place_of_birth}
                />
                <Autocomplete
                  name="nationality"
                  isRequired
                  label="Nationality"
                  selectedKey={selectedNationality}
                  onSelectionChange={(key) =>
                    setSelectedNationality(key?.toString())
                  }
                  defaultItems={nationalities}
                >
                  {(item) => (
                    <AutocompleteItem
                      key={item.code}
                      startContent={
                        <Avatar
                          alt={item.name}
                          className="h-6 w-6"
                          src={`https://flagcdn.com/${item.code.toLowerCase()}.svg`}
                        />
                      }
                    >
                      {item.name}
                    </AutocompleteItem>
                  )}
                </Autocomplete>
                <Input
                  name="phone"
                  label="Phone"
                  defaultValue={student.phone}
                />
                <Input
                  name="email"
                  label="Email"
                  defaultValue={student.email}
                />
                <Input
                  name="mother_name"
                  label="Mother's Name"
                  defaultValue={student.mother_name}
                />
                <Input
                  name="mother_occupation"
                  label="Mother's Occupation"
                  defaultValue={student.mother_occupation}
                />
                <Input
                  name="father_name"
                  label="Father's Name"
                  defaultValue={student.father_name}
                />
                <Input
                  name="father_occupation"
                  label="Father's Occupation"
                  defaultValue={student.father_occupation}
                />
                <Input
                  name="address"
                  label="Address"
                  defaultValue={student.address}
                />
                <Input
                  name="parent_contact"
                  label="Parent Contact"
                  defaultValue={student.parent_contact}
                />
                <Input
                  name="admission_date"
                  label="Admission Date"
                  type="date"
                  defaultValue={student.admission_date?.split("T")[0]}
                />

                <Autocomplete
                  name="branch"
                  label="Branch"
                  selectedKey={selectedBranchId ?? undefined}
                  onSelectionChange={(key) =>
                    setSelectedBranchId(key?.toString() ?? null)
                  }
                  items={branches}
                >
                  {(item) => (
                    <AutocompleteItem key={item.id}>
                      {item.name}
                    </AutocompleteItem>
                  )}
                </Autocomplete>

                {/* ✅ Fixed Programs Selector */}
<div>
      <label className="block mb-1 text-sm">
        Programs<span className="text-red-500">*</span>
      </label>
      <div className="w-full max-w-[400px] border px-2 py-2 rounded-xl border-default-200 dark:border-default-100">
<Listbox
  classNames={{
    base: "max-w-full",
    list: "max-h-[150px] overflow-y-auto",
  }}
  selectedKeys={new Set(selectedProgramIds)}
  items={uniquePrograms}
  selectionMode="multiple"
  variant="flat"
  onSelectionChange={(keys) => {
    if (keys instanceof Set) {
      setSelectedProgramIds(Array.from(keys).map(String));
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
                <Autocomplete
                  name="modified_by"
                  label="Modified By"
                  selectedKey={selectedModifiedBy ?? undefined}
                  onSelectionChange={(key) =>
                    setSelectedModifiedBy(key?.toString() ?? null)
                  }
                  items={users}
                >
                  {(user) => (
                    <AutocompleteItem key={user.id}>
                      {user.name}
                    </AutocompleteItem>
                  )}
                </Autocomplete>

                <Autocomplete
                  name="status"
                  label="Status"
                  isRequired
                  selectedKey={status}
                  onSelectionChange={(key) => setStatus(key?.toString() ?? "")}
                >
                  <AutocompleteItem
                    key="active"
                    startContent={SuccessCircleSvg}
                  >
                    Active
                  </AutocompleteItem>
                  <AutocompleteItem
                    key="inactive"
                    startContent={DangerCircleSvg}
                  >
                    Inactive
                  </AutocompleteItem>

                  <AutocompleteItem key="hold">Hold</AutocompleteItem>
                </Autocomplete>

                <Autocomplete
                  label="Payment Status"
                  isRequired
                  selectedKey={paymentStatus}
                  onSelectionChange={(key) => {
                    if (typeof key === "string") setPaymentStatus(key);
                  }}
                >
                  <AutocompleteItem key="unpaid">Unpaid</AutocompleteItem>
                  <AutocompleteItem key="paid">Paid</AutocompleteItem>
                </Autocomplete>

                <Input
                  label="Description"
                  placeholder=""
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                />

                {/* <Input
                  label="Payment Date"
                  type="date"
                  placeholder="e.g., Paid on July 1, 2025"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)} // ✅ Correct setter
                /> */}

                {student.image_url && (
                  <div className="col-span-3">
                    <p className="text-sm text-default-500 mb-1">
                      Current Image
                    </p>
                    <Image
                      src={student.image_url}
                      alt="Student"
                      className="h-24 w-24 object-cover rounded"
                    />
                  </div>
                )}
                <Input name="image" label="New Image (optional)" type="file" />
                <Input
                  name="insurance_number"
                  label="Insurance Number"
                  defaultValue={student.insurance_number ?? ""}
                />
                <Input
                  name="insurance_expiry_date"
                  label="Insurance Expiry Date"
                  type="date"
                  defaultValue={student.insurance_expiry?.split("T")[0]}
                />
              </div>

              {error && <p className="text-red-500 mt-4">{error}</p>}
              <Divider className="my-4" />

              <div className="mt-6 flex justify-end gap-2">
                <Button radius="full" variant="bordered" onPress={onOpenChange}>
                  Cancel
                </Button>
                <Button color="primary" radius="full" type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
