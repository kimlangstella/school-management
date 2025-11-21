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
import { useEffect, useState, useMemo } from "react";
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const nationalityCode = nationalities.find(
    (n) => n.name === student.nationality
  )?.code;
  const [selectedNationality, setSelectedNationality] = useState<
    string | undefined
  >(nationalityCode);
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([]);
  const [paymentStatus, setPaymentStatus] = useState(
    (student as any).payment_status ?? "unpaid"
  );
  const [paymentNote, setPaymentNote] = useState((student as any).payment_note ?? "");

  // Load dropdown data and get current user
  useEffect(() => {
    const fetchData = async () => {
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      const [{ data: branchData }, { data: programData }, { data: userList }] =
        await Promise.all([
          supabase.rpc("get_all_branches"),
          supabase.rpc("get_all_programs"),
          supabase.rpc("get_all_users"),
        ]);

      if (branchData) setBranches(branchData);
      if (userList) setUsers(userList);
      if (programData) setPrograms(programData);
    };
    fetchData();
  }, []);

  // Initialize selected programs when modal opens
  // Only include programs that match the selected branch (if branch is selected)
  useEffect(() => {
    if (isOpen && programs.length > 0) {
      let ids: string[] = [];
      
      // Try to get program IDs from student.programs first (array of objects with id)
      if (student.programs && Array.isArray(student.programs) && student.programs.length > 0) {
        ids = student.programs.map((p: any) => String(p.id || p));
        console.log("🔍 Initializing from student.programs:", ids, student.programs);
      } 
      // Fallback to program_names if programs array is not available
      else if ((student as any)?.program_names?.length && programs.length) {
        ids = programs
          .filter((p) => (student as any).program_names?.includes(p.name))
          .map((p) => String(p.id));
        console.log("🔍 Initializing from program_names:", ids, (student as any).program_names);
      }
      
      // Filter to only include programs from the selected branch (if branch is selected)
      if (selectedBranchId && ids.length > 0) {
        const branchFilteredIds = ids.filter((id) => {
          const program = programs.find((p) => String(p.id) === id);
          return program && String(program.branch_id) === String(selectedBranchId);
        });
        console.log("🔍 Filtered by branch:", {
          original: ids,
          branch: selectedBranchId,
          filtered: branchFilteredIds
        });
        ids = branchFilteredIds;
      }
      
      // Only update if we found IDs and they're different from current selection
      if (ids.length > 0) {
        const currentIdsStr = selectedProgramIds.map(String).sort().join(',');
        const newIdsStr = ids.map(String).sort().join(',');
        if (currentIdsStr !== newIdsStr) {
          setSelectedProgramIds(ids);
        }
      } else if (selectedProgramIds.length > 0 && selectedBranchId) {
        // If branch is selected but no programs found for that branch, clear selections
        setSelectedProgramIds([]);
      }
    }
  }, [isOpen, student, programs, selectedBranchId]);

  // When branch changes, filter selected programs to only those from the new branch
  useEffect(() => {
    if (selectedBranchId && selectedProgramIds.length > 0 && programs.length > 0) {
      const branchFilteredIds = selectedProgramIds.filter((id) => {
        const program = programs.find((p) => String(p.id) === id);
        return program && String(program.branch_id) === String(selectedBranchId);
      });
      
      if (branchFilteredIds.length !== selectedProgramIds.length) {
        console.log("🔄 Branch changed - filtering selected programs:", {
          before: selectedProgramIds,
          after: branchFilteredIds,
          branch: selectedBranchId
        });
        setSelectedProgramIds(branchFilteredIds);
      }
    }
  }, [selectedBranchId]); // Only run when branch changes

  // Filter programs: ONLY show programs from the selected branch
  // If branch is selected, filter strictly by branch_id
  const filteredPrograms = useMemo(() => {
    if (!selectedBranchId) {
      // If no branch selected, show all programs
      return programs;
    }
    
    // Only show programs from the selected branch
    return programs.filter((p) => {
      return String(p.branch_id) === String(selectedBranchId);
    });
  }, [programs, selectedBranchId]);

  // Deduplicate programs by name within the selected branch
  // If multiple programs have the same name in the same branch, keep only one (prefer selected ones)
  const uniquePrograms = useMemo(() => {
    const programMap = new Map<string, Program>();
    
    filteredPrograms.forEach((p) => {
      const id = String(p.id);
      const name = p.name.trim().toLowerCase(); // Normalize name for comparison
      const branchId = String(p.branch_id);
      
      // Create a unique key: branch_id + normalized name
      const key = `${branchId}_${name}`;
      
      if (!programMap.has(key)) {
        // First time seeing this branch+name combination
        programMap.set(key, p);
      } else {
        // Duplicate found - prefer the one that's already selected
        const existing = programMap.get(key);
        const existingId = existing ? String(existing.id) : '';
        const isCurrentSelected = selectedProgramIds.includes(id);
        const isExistingSelected = selectedProgramIds.includes(existingId);
        
        // Replace with current if: current is selected and existing is not
        // OR if neither is selected, keep the first one (existing)
        if (isCurrentSelected && !isExistingSelected) {
          programMap.set(key, p);
        }
        // Otherwise keep the existing one
      }
    });
    
    const result = Array.from(programMap.values());
    console.log("🔍 Deduplicated programs:", result.map(p => ({
      id: p.id,
      name: p.name,
      branch: p.branch_name,
      branch_id: p.branch_id
    })));
    
    return result;
  }, [filteredPrograms, selectedProgramIds]);


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
    // Always use selectedProgramIds - if empty, it means user wants to remove all programs
    const finalProgramIds = selectedProgramIds;
    
    console.log("🔍 Debug - Selected Program IDs:", selectedProgramIds);
    console.log("🔍 Debug - Final Program IDs:", finalProgramIds);
    console.log("🔍 Debug - Original Student Programs:", student.programs);
    
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
      _modified_by: currentUserId || null,
      _program_ids: finalProgramIds,
      _payment_status: paymentStatus,
      _payment_note: paymentNote,
      _payment_end_date: formData.get("payment_end_date") || null,
    };

    console.log("📤 Submitting update payload:", payload);
    console.log("📤 Program IDs being sent:", payload._program_ids);
    
    const { error: updateError, data: updateData } = await supabase.rpc(
      "update_student",
      payload
    );

    if (updateError) {
      console.error("❌ Update failed:", updateError);
      setError("Update failed: " + updateError.message);
      return;
    }

    console.log("✅ Update successful:", updateData);
    
    // Close modal first
    onOpenChange();
    
    // Call onUpdate callback to invalidate queries and refresh the table
    // This should be called after closing to ensure UI updates properly
    onUpdate(student);
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
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpen();
                }
              }}
            >
              {trigger}
            </div>
          ) : (
            <Button color="warning" onPress={onOpen}>
              Edit Student
            </Button>
          )}

      <Modal 
        isOpen={isOpen} 
        placement="top-center" 
        onOpenChange={onOpenChange}
        scrollBehavior="inside"
        size="full"
        classNames={{
          base: "max-w-[1000px]",
        }}
      >
        <ModalContent className="dark text-foreground bg-background w-full sm:w-[1000px] max-w-full p-2 sm:p-3">
          <ModalBody>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      {!selectedBranchId ? (
        <div className="w-full max-w-[400px] border px-4 py-8 rounded-xl border-default-200 dark:border-default-100 flex items-center justify-center">
          <p className="text-sm text-default-500 text-center">
            Please select a branch first to view available programs
          </p>
        </div>
      ) : (
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
              if (keys === "all") {
                // If all selected, get all program IDs
                const allIds = uniquePrograms.map((p) => String(p.id));
                console.log("🔄 All programs selected:", allIds);
                setSelectedProgramIds(allIds);
              } else if (keys instanceof Set) {
                const newIds = Array.from(keys).map(String);
                console.log("🔄 Program selection changed:", newIds, "from keys:", Array.from(keys));
                setSelectedProgramIds(newIds);
              } else {
                console.log("🔄 Program selection cleared");
                setSelectedProgramIds([]);
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
      )}
    </div>
                {/* Modified By is automatically set to current user - hidden field */}
                {currentUserId && (
                  <Input
                    name="modified_by"
                    label="Modified By"
                    value={users.find(u => u.id === currentUserId)?.name || "Current User"}
                    isReadOnly
                    isDisabled
                  />
                )}

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

                <Input
                  name="payment_end_date"
                  label="Payment End Date"
                  type="date"
                  defaultValue={student.payment_end_date?.split("T")[0]}
                />

                {student.image_url && (
                  <div className="col-span-3">
                    <p className="text-sm text-default-500 mb-1">
                      Current Image
                    </p>
                    <Image
                      src={student.image_url}
                      alt="Student"
                      width={96}
                      height={96}
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
