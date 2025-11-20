"use client";

import React, { Suspense } from "react";
import BranchCard from "@/components/card/branch-card";
import {Chip} from "@heroui/react";
import AddBranch from "@/components/modal/add-branch";

export default function TrialPage() {
    return (
        <div className="p-8">
            <div className="mb-[18px] flex items-center justify-between">
                <div className="flex w-[226px] items-center gap-2">
                    <h1 className="text-2xl font-[700] leading-[32px]">AAA Branches</h1>
                    <Chip className="hidden items-center text-default-500 sm:flex" size="sm" variant="flat">
                        3
                    </Chip>
                </div>
                    <div className="flex items-end justify-end mr-8 mb-2 mt-4">
                        <AddBranch />
                      </div>
            </div>
            <Suspense fallback={<div>Loading table...</div>}>
  <BranchCard />
</Suspense>

        </div>
    );
}
