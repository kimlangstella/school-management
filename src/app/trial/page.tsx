"use client";

import dynamic from "next/dynamic";
import React, { Suspense } from "react";

// Dynamically import the trial table
const TrialTable = dynamic(() => import("@/components/table/trial-table"), {
  loading: () => <p className="p-8">Loading trials...</p>,
  ssr: false,
});

export default function TrialPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<div>Loading trial data...</div>}>
        <TrialTable />
      </Suspense>
    </div>
  );
}
