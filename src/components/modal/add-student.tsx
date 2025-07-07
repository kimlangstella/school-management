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
  Select,
  SelectItem,
  useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import nationalities from "@/components/types/nationalities";
import { DangerCircleSvg } from "@/components/icon/danger-circle";
import { SuccessCircleSvg } from "@/components/icon/success-circle";
import { WarningCircleSvg } from "@/components/icon/warning-circle";
import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type BranchObject = {
  id: string;
  name: string;
};

type User = {
  id: string;
  name: string;
};

type Program = {
  id: string;
  name: string;
  branch_name: string;
};

type AddStudentProps = {
  onUpdate: () => void;
};

export default function AddStudent({ onUpdate }: AddStudentProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const [branches, setBranches] = useState<BranchObject[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null); // ✅ single
  const [selectedCreatedBy, setSelectedCreatedBy] = useState<string | null>(null);
  const [selectedModifiedBy, setSelectedModifiedBy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        setError("Unable to load authenticated user.");
        return;
      }

      setSelectedCreatedBy(userId);
      setSelectedModifiedBy(userId);

      const [{ data: branchData }, { data: programData }, { data: userList }] =
        await Promise.all([
          supabase.rpc("get_all_branches"),
          supabase.rpc("get_all_programs"),
          supabase.rpc("get_all_users"),
        ]);

      if (branchData) setBranches(branchData);
      if (programData) setPrograms(programData);
      if (userList) setUsers(userList);
    };

    fetchInitialData();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    let imageUrl = "";
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

    const parseDate = (val: FormDataEntryValue | null) =>
      val?.toString().trim() || null;

    const gender = formData.get("gender")?.toString().toLowerCase();
    const status = formData.get("status")?.toString().toLowerCase();
    if (!["male", "female", "other"].includes(gender || "")) {
      return setError("Invalid gender selected.");
    }
    if (!["active", "inactive", "hold"].includes(status || "")) {
      return setError("Invalid status selected.");
    }

    const payload = {
      _first_name: formData.get("first_name"),
      _last_name: formData.get("last_name"),
      _gender: gender,
      _date_of_birth: parseDate(formData.get("dob")),
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
      _branch: selectedBranchId,
      _program: selectedProgram, // ✅ correct field
      _image_url: imageUrl,
      _admission_date: parseDate(formData.get("admission_date")),
      _status: status,
      _insurance_number: formData.get("insurance_number"),
      _insurance_expiry: parseDate(formData.get("insurance_expiry_date")),
      _created_by: selectedCreatedBy,
      _modified_by: selectedModifiedBy,
    };

    const result = await supabase.rpc("insert_student", payload);

    if (result.error) {
      setError(`Insert failed: ${result.error.message}`);
      return;
    }

    onUpdate?.();
    onOpenChange();
  };

  return (
    <>
      <Button color="primary" onPress={onOpen} endContent={<Icon icon="solar:add-circle-bold" width={20} />}>
        Add Student
      </Button>

      <Modal isOpen={isOpen} placement="top-center" onOpenChange={onOpenChange}>
        <ModalContent className="dark text-foreground bg-background w-[1000px] max-w-full p-3">
          <ModalBody>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-4">
                <Input name="first_name" isRequired label="First Name" />
                <Input name="last_name" isRequired label="Last Name" />
                <Autocomplete name="gender" isRequired label="Gender">
                  <AutocompleteItem>Male</AutocompleteItem>
                  <AutocompleteItem>Female</AutocompleteItem>
                  <AutocompleteItem>Other</AutocompleteItem>
                </Autocomplete>
                <Input name="dob" isRequired label="Date of Birth" type="date" />
                <Input name="pob" isRequired label="Place of Birth" />
                <Autocomplete name="nationality" isRequired defaultItems={nationalities} label="Nationality">
                  {(item) => (
                    <AutocompleteItem
                      key={item.code}
                      startContent={
                        <Avatar
                          alt="Flag"
                          className="h-6 w-6"
                          src={`https://flagcdn.com/${item.code.toLowerCase()}.svg`}
                        />
                      }
                    >
                      {item.name}
                    </AutocompleteItem>
                  )}
                </Autocomplete>
                <Input name="phone" isRequired label="Phone" />
                <Input name="email" isRequired label="Email" />
                <Input name="mother_name" isRequired label="Mother's Name" />
                <Input name="mother_occupation" isRequired label="Mother's Occupation" />
                <Input name="father_name" isRequired label="Father's Name" />
                <Input name="father_occupation" isRequired label="Father's Occupation" />
                <Input name="address" isRequired label="Address" />
                <Input name="parent_contact" isRequired label="Parent's Contact" />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Input name="admission_date" isRequired label="Admission Date" type="date" />

                <Autocomplete name="branch" isRequired label="Branch" selectedKey={selectedBranchId ?? undefined}
                  onSelectionChange={(key) => setSelectedBranchId(key?.toString() ?? null)}
                  items={branches}>
                  {(item) => <AutocompleteItem key={item.id}>{item.name}</AutocompleteItem>}
                </Autocomplete>

                <Autocomplete
                  name="program"
                  isRequired
                  label="Program"
                  placeholder="Select program"
                  selectedKey={selectedProgram ?? undefined}
                  onSelectionChange={(key) => key && setSelectedProgram(String(key))}
                  items={programs}
                >
                  {(item: Program) => (
                    <AutocompleteItem key={item.id} textValue={item.name}>
                      {item.name}   
                    </AutocompleteItem>
                  )}
                </Autocomplete>

                <Autocomplete name="status" isRequired label="Status">
                  <AutocompleteItem startContent={SuccessCircleSvg}>Active</AutocompleteItem>
                  <AutocompleteItem startContent={WarningCircleSvg}>Hold</AutocompleteItem>
                  <AutocompleteItem startContent={DangerCircleSvg}>Inactive</AutocompleteItem>
                </Autocomplete>

                <Autocomplete
                  label="Created By"
                  isRequired
                  selectedKey={selectedCreatedBy ?? undefined}
                  onSelectionChange={(key) => key && setSelectedCreatedBy(String(key))}
                  items={users}
                >
                  {(user) => <AutocompleteItem key={user.id}>{user.name}</AutocompleteItem>}
                </Autocomplete>

                <Autocomplete
                  label="Modified By"
                  isRequired
                  selectedKey={selectedModifiedBy ?? undefined}
                  onSelectionChange={(key) => setSelectedModifiedBy(String(key))}
                  items={users}
                >
                  {(user) => <AutocompleteItem key={user.id}>{user.name}</AutocompleteItem>}
                </Autocomplete>

                <Input name="image" label="Image Profile" type="file" />
                <Input name="insurance_number" label="Insurance Number" />
                <Input name="insurance_expiry_date" label="Insurance Expiry Date" type="date" />
              </div>

              {error && <p className="text-red-500 mt-4">{error}</p>}

              <Divider className="my-4" />
              <div className="mt-6 flex justify-end gap-2">
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
