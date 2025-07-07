"use client";

import React from "react";
import StudentTable from "@/components/table/student-table";
import AddStudent from "@/components/modal/add-student";
import { Student } from "@/components/types/columns";

export default function StudentPage() {
    return (
        <>
        {/* <div className="flex justify-between items-center mb-4">
            <AddStudent onUpdate={function (updatedStudent: Student): void {
                    throw new Error("Function not implemented.");
                } }></AddStudent>
        </div> */}
        <div className="p-8">
            <StudentTable />
        </div></>
    );
}
