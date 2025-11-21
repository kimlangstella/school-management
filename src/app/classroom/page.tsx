"use client";

import React from "react";
import AddClassroomModal from "@/components/modal/add_classroom";
import ClassroomCard from "@/components/card/classroom-card";
import AddEnrollment from "@/components/modal/add-enrollment";

export default function ProgramPage() {
    return (
        <div className="p-2 sm:p-4 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                <h1 className="text-xl sm:text-2xl font-bold">AAA Classes</h1>
                <div className="flex justify-center sm:justify-end gap-2 sm:gap-3 items-end">
                    <AddEnrollment></AddEnrollment>
                    <AddClassroomModal></AddClassroomModal>
                </div>
            </div>
            
            <div className={"container mx-auto flex flex-wrap justify-start gap-4 sm:gap-6"}>
                <ClassroomCard></ClassroomCard>
            </div>
        </div>
    );
}
