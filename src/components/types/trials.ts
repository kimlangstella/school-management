import {JSX} from "react";
import {SuccessCircleSvg} from "@/components/icon/success-circle";
import {DangerCircleSvg} from "@/components/icon/danger-circle";
import {WarningCircleSvg} from "@/components/icon/warning-circle";
import {DefaultCircleSvg} from "@/components/icon/default-circle";



export const trialColumn = [
    { name: "Actions", uid: "actions" },
    { name: "ID", uid: "id" },
    { name: "Client Name", uid: "client" },
    { name: "Phone", uid: "phone" },
    { name: "Branch", uid: "branch_name" },
    { name: "Number of Student", uid: "number_student" },
    { name: "Program", uid: "program_name" },
    { name: "Status", uid: "status" },
    { name: "Reason", uid: "reason" },
    { name: "Assign By", uid: "assign_by" },     // ✅ fixed
    { name: "Handle By", uid: "handle_by" },     // ✅ fixed
    { name: "Modified by", uid: "modifier_by" },
    { name: "Modified at", uid: "updated_at" },
    { name: "Created at", uid: "created_at" },
];



export type ColumnsKey =
    | "id"
    | "client"
    | "phone"
    | "branch_name"
    | "program_name"
    | "number_student"
    | "status"
    | "reason"
    | "assign_by"
    | "handle_by"
    | "modifier_by"
    | "updated_at"
    | "created_at"
    | "actions";

export const INITIAL_VISIBLE_COLUMNS: ColumnsKey[] = [
    "client",
    "phone",
    "branch_name",
    "program_name",
    "number_student",
    "status",
    "reason",
    "assign_by",
    "handle_by",
    "modifier_by",
    "updated_at",
    "created_at",
    "actions",
];


export type StatusTrial = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
export const statusColorMap: Record<StatusTrial, JSX.Element> = {
    APPROVED: DefaultCircleSvg,
    COMPLETED: SuccessCircleSvg,
    REJECTED: DangerCircleSvg,
    PENDING: WarningCircleSvg,
};

export type Trials = {
    id: number;
    client: string;
    phone: string;
    number_student: string;
    branch_id: number;
    branch_name: string;
    program_name: string[];
    program_id: number[];
    status: StatusTrial;
    reason: string;
    assign_id: number;
    assign_name: string;
    modify_id: number[];
    modify_name: string[];
    updated_at: string;
    created_at: string;
    modified_by: number;
    modifier_name: string;
};

export interface Trial {
    // FIX: Replaced incorrect method signatures with optional properties
    program?: string[];
    handle_by?: string;
    assign_by?: string;
    branch?: string;

    // Added specific fields accessed in trial-table.tsx
    assign_by_name?: string;
    handle_by_name?: string;
    modified_by_name?: string;

    id: string; // Changed to string to match table usage
    client: string;
    phone: string;
    number_student: string;
    branch_id: number;
    branch_name: string;
    program_id: number[];
    program_name: string[];
    status: StatusTrial;
    reason: string;
    assign_id: number;
    assign_name: string;
    modify_id: number[];
    modify_name: string[];
    updated_at: string;
    created_at: string;
    modified_by: number;
    modifier_name: string;
}