"use client";
import {
  Autocomplete,
  AutocompleteItem,
  Avatar,
  Button,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { DangerCircleSvg } from "@/components/icon/danger-circle";
import { SuccessCircleSvg } from "@/components/icon/success-circle";
import { WarningCircleSvg } from "@/components/icon/warning-circle";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { Student } from "@/components/types/columns";
import nationalities from "@/components/types/nationalities";

type BranchObject = { id: string; name: string };
type User = { id: string; name: string };
type Program = { id: string; name: string; branch_name: string };

type EditStudentProps = {
  student: Student;
  onUpdate: (updatedStudent: Student) => void;
  trigger?: React.ReactNode;
};

export default function EditStudent({ student, onUpdate, trigger }: EditStudentProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const [branches, setBranches] = useState<BranchObject[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [gender, setGender] = useState<string>(student.gender ?? "");
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(student.branch ?? null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(student.program ?? null);
  const nationalityCode = nationalities.find((n) => n.name === student.nationality)?.code;
  const [selectedNationality, setSelectedNationality] = useState<string | undefined>(nationalityCode);
  const [selectedModifiedBy, setSelectedModifiedBy] = useState<string | null>(student.modified_by ?? null);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: branchData }, { data: programData }, { data: userList }] = await Promise.all([
        supabase.rpc("get_all_branches"),
        supabase.rpc("get_all_programs"),
        supabase.rpc("get_all_users"),
      ]);
      if (branchData) setBranches(branchData);
      if (programData) setPrograms(programData);
      if (userList) setUsers(userList);
    };

    fetchData();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    const parseDateOrNull = (val: FormDataEntryValue | null) => val?.toString().trim() || null;
    const rawGender = formData.get("gender")?.toString().toLowerCase();
    const rawStatus = formData.get("status")?.toString().toLowerCase();

    if (!["male", "female", "other"].includes(rawGender || "")) {
      setError("Gender must be 'male', 'female', or 'other'.");
      return;
    }
    if (!["active", "inactive", "hold", "graduated"].includes(rawStatus || "")) {
      setError("Invalid status.");
      return;
    }

    // Image handling
    let imageUrl = student.image_url ?? "";
    const imageFile = formData.get("image") as File | null;

    if (imageFile && imageFile.name) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `students/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("student-images")
        .upload(filePath, imageFile);

      if (uploadError) {
        setError(`Image upload failed: ${uploadError.message}`);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("student-images")
        .getPublicUrl(filePath);

      imageUrl = publicUrlData?.publicUrl || "";
    }

    const payload = {
      _id: student.id,
      _first_name: formData.get("first_name"),
      _last_name: formData.get("last_name"),
      _gender: rawGender,
      _date_of_birth: parseDateOrNull(formData.get("dob")),
      _place_of_birth: formData.get("pob"),
      _nationality: formData.get("nationality"),
      _phone: formData.get("phone"),
      _email: formData.get("email"),
      _password: "12345678",
      _mother_name: formData.get("mother_name"),
      _mother_occupation: formData.get("mother_occupation"),
      _father_name: formData.get("father_name"),
      _father_occupation: formData.get("father_occupation"),
      _address: formData.get("address"),
      _parent_contact: formData.get("parent_contact"),
      _image_url: imageUrl,
      _admission_date: parseDateOrNull(formData.get("admission_date")),
      _status: rawStatus,
      _branch: selectedBranchId,
      _program: selectedProgramId,
      _insurance_number: formData.get("insurance_number"),
      _insurance_expiry: parseDateOrNull(formData.get("insurance_expiry_date")),
      _modified_by: selectedModifiedBy,
    };

    const result = await supabase.rpc("update_student", payload);
    if (result.error) {
      console.error("Update Error:", result.error.message);
      return setError(`Update failed: ${result.error.message}`);
    }

    onUpdate?.(student);
    onOpenChange();
  };

  return (
    <>
      {trigger ? (
        <div onClick={onOpen} className="inline-flex cursor-pointer">{trigger}</div>
      ) : (
        <Button color="warning" onPress={onOpen}>Edit Student</Button>
      )}

      <Modal isOpen={isOpen} placement="top-center" onOpenChange={onOpenChange}>
        <ModalContent className="dark text-foreground bg-background w-[1000px] max-w-full p-3">
          <ModalBody>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Input name="first_name" isRequired label="First Name" defaultValue={student.first_name} />
                <Input name="last_name" isRequired label="Last Name" defaultValue={student.last_name} />
                <Autocomplete name="gender" label="Gender" isRequired selectedKey={gender} onSelectionChange={(key) => setGender(key?.toString() ?? "")}>
                  <AutocompleteItem key="male">Male</AutocompleteItem>
                  <AutocompleteItem key="female">Female</AutocompleteItem>
                  <AutocompleteItem key="other">Other</AutocompleteItem>
                </Autocomplete>
                <Input name="dob" label="Date of Birth" type="date" defaultValue={student.date_of_birth?.split("T")[0]} />
                <Input name="pob" label="Place of Birth" defaultValue={student.place_of_birth} />
                <Autocomplete
                  name="nationality"
                  isRequired
                  label="Nationality"
                  selectedKey={selectedNationality}
                  onSelectionChange={(key) => setSelectedNationality(key?.toString())}
                  defaultItems={nationalities}
                >
                  {(item) => (
                    <AutocompleteItem
                      key={item.code}
                      startContent={<Avatar alt={item.name} className="h-6 w-6" src={`https://flagcdn.com/${item.code.toLowerCase()}.svg`} />}
                    >
                      {item.name}
                    </AutocompleteItem>
                  )}
                </Autocomplete>
                <Input name="phone" label="Phone" defaultValue={student.phone} />
                <Input name="email" label="Email" defaultValue={student.email} />
                <Input name="mother_name" label="Mother's Name" defaultValue={student.mother_name} />
                <Input name="mother_occupation" label="Mother's Occupation" defaultValue={student.mother_occupation} />
                <Input name="father_name" label="Father's Name" defaultValue={student.father_name} />
                <Input name="father_occupation" label="Father's Occupation" defaultValue={student.father_occupation} />
                <Input name="address" label="Address" defaultValue={student.address} />
                <Input name="parent_contact" label="Parent Contact" defaultValue={student.parent_contact} />
                <Input name="admission_date" label="Admission Date" type="date" defaultValue={student.admission_date?.split("T")[0]} />
                <Autocomplete
                  name="branch"
                  label="Branch"
                  selectedKey={selectedBranchId ?? undefined}
                  onSelectionChange={(key) => setSelectedBranchId(key?.toString() ?? null)}
                  items={branches}
                >
                  {(item) => <AutocompleteItem key={item.id}>{item.name}</AutocompleteItem>}
                </Autocomplete>
                <Autocomplete
                  name="program"
                  label="Program"
                  selectedKey={selectedProgramId ?? undefined}
                  onSelectionChange={(key) => setSelectedProgramId(key?.toString() ?? null)}
                  items={programs}
                >
                  {(item) => <AutocompleteItem key={item.id}>{item.name}</AutocompleteItem>}
                </Autocomplete>
                <Autocomplete
                  name="modified_by"
                  label="Modified By"
                  selectedKey={selectedModifiedBy ?? undefined}
                  onSelectionChange={(key) => setSelectedModifiedBy(key?.toString() ?? null)}
                  items={users}
                >
                  {(user) => <AutocompleteItem key={user.id}>{user.name}</AutocompleteItem>}
                </Autocomplete>
                <Autocomplete name="status" label="Status" isRequired selectedKey={student.status}>
                  <AutocompleteItem key="active" startContent={SuccessCircleSvg}>Active</AutocompleteItem>
                  <AutocompleteItem key="inactive" startContent={DangerCircleSvg}>Inactive</AutocompleteItem>
                  <AutocompleteItem key="graduated" startContent={WarningCircleSvg}>Graduated</AutocompleteItem>
                </Autocomplete>

                {/* Image display and upload */}
                {student.image_url && (
                  <div className="col-span-3">
                    <p className="text-sm text-default-500 mb-1">Current Image</p>
                    <img src={student.image_url} alt="Student" className="h-24 w-24 object-cover rounded" />
                  </div>
                )}
                <Input name="image" label="New Image (optional)" type="file" />

                <Input name="insurance_number" label="Insurance Number" defaultValue={student.insurance_number ?? ""} />
                <Input name="insurance_expiry_date" label="Insurance Expiry Date" type="date" defaultValue={student.insurance_expiry?.split("T")[0]} />
              </div>

              {error && <p className="text-red-500 mt-4">{error}</p>}

              <Divider className="my-4" />

              <div className="mt-6 flex w-full justify-end gap-2">
                <Button radius="full" variant="bordered" onPress={onOpenChange}>Cancel</Button>
                <Button color="primary" radius="full" type="submit">Save Changes</Button>
              </div>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
