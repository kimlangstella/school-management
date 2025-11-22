"use client";

import dynamic from "next/dynamic";
import React, { Suspense } from "react";

const StudentTable = dynamic(() => import("@/components/table/student-table"), {
  loading: () => <p className="p-8">Loading students...</p>,
  ssr: false, 
});

export default function StudentPage() {
  return (
    <div className="w-full">
      <Suspense fallback={<div>Loading table...</div>}>
        <StudentTable />
      </Suspense>
    </div>
  );
}
