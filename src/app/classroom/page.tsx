"use client";

import React from "react";
import AddClassroomModal from "@/components/modal/add_classroom";
import ClassroomCard from "@/components/card/classroom-card";
import AddEnrollment from "@/components/modal/add-enrollment";

export default function ProgramPage() {
    return (
        <div className="p-8">
            <div className="flex justify-between">
                <h1 className="text-2xl font-bold mb-1">AAA Classes</h1>
                    <div className="flex justify-center mb-16 gap-3 items-end">
                        <AddEnrollment></AddEnrollment>
                        <AddClassroomModal></AddClassroomModal>
                    </div>
            </div>
            
            <div className={"container mx-auto flex flex-wrap justify-start gap-6"}>
                <ClassroomCard></ClassroomCard>
            </div>
        </div>
    );
}
