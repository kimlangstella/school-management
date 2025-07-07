import { SuccessCircleSvg } from "@/components/icon/success-circle";
import { DangerCircleSvg } from "@/components/icon/danger-circle";
import { WarningCircleSvg } from "@/components/icon/warning-circle";
import { JSX } from "react";
import { StatusStudent } from "./student";

export const columns = [
  { name: "Actions", uid: "actions" },
  { name: "Name", uid: "name" },
  { name: "Gender", uid: "gender" },
  { name: "Nationality", uid: "nationality" },
  { name: "Date of Birth", uid: "date_of_birth" },
  { name: "Phone", uid: "phone" },
{ name: "Branch", uid: "branch" },
{ name: "Program", uid: "program" },

  { name: "Status", uid: "status" },
  { name: "Admission Date", uid: "admission_date" },
  { name: "Insurance ID", uid: "insurance_number" },
  { name: "Insurance Expiry", uid: "insurance_expiry" },
  { name: "Created by", uid: "created_by" },
  { name: "Modified by", uid: "modified_by" },
  { name: "Created at", uid: "created_at" },
  { name: "Updated at", uid: "updated_at" },
];

export type ColumnsKey =
  | "name"
  | "gender"
  | "nationality"
  | "date_of_birth"
  | "phone"
  | "branch"
  | "program"
  | "status"
  | "admission_date"
  | "insurance_number"
  | "insurance_expiry"
  | "created_by"
  | "modified_by"
  | "created_at"
  | "updated_at"
  | "actions";

export const INITIAL_VISIBLE_COLUMNS: ColumnsKey[] = [
  "name",
  "gender",
  "phone",
  "nationality",
  "date_of_birth",
  "status",
  "branch",
  "actions",
];

export const statusColorMap: Record<StatusStudent, JSX.Element> = {
  active: SuccessCircleSvg,
  inactive: DangerCircleSvg,
  graduated: WarningCircleSvg,
};

export type Gender = "male" | "female" | "other"; // based on DB CHECK
export type StatusStudent = "active" | "inactive" | "graduated";

export interface Student {
  id: string; // UUID from DB
  first_name: string;
  last_name: string;
  name?: string; // for UI display (first + last)

  gender: Gender;
  date_of_birth: string; // from DB DATE
  place_of_birth: string;
  nationality: string;

  phone: string;
  email: string;
  password?: string; // optional, probably not used on frontend

  mother_name: string;
  mother_occupation: string;
  father_name: string;
  father_occupation: string;

  address: string;
  parent_contact: string;

  image_url?: string; // renamed from image
  admission_date: string;

  status: StatusStudent;

  branch_id: string | null;
  branch?: string; // name resolved via join or client-side mapping

  insurance_number: string;
  insurance_expiry?: string;

  program_id?: string;
  program?: string;

  created_by: string;
  modified_by: string;

  creator_name?: string;
  modifier_name?: string;

  created_at: string;
  updated_at: string;
}
