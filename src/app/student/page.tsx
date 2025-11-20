"use client";

import dynamic from "next/dynamic";
import React, { Suspense } from "react";

// Dynamically import the student table component
const StudentTable = dynamic(() => import("@/components/table/student-table"), {
  loading: () => <p className="p-8">Loading students...</p>,
  ssr: false, 
});

export default function StudentPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<div>Loading table...</div>}>
        <StudentTable />
      </Suspense>
    </div>
  );
}
