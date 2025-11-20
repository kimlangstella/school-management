"use client";

import React, { useEffect, useState } from "react";
import { Autocomplete, AutocompleteItem, Button, Card } from "@heroui/react";
import { Icon } from "@iconify/react";
import { supabase } from "../../../lib/supabaseClient";

type ProgramStat = {
  id: string;          // program name as key
  name: string;
  active_students: number;
  branches: number;
};

export default function KpiState() {
  const [programs, setPrograms] = useState<ProgramStat[]>([]);
  const [studentLengthActual, setStudentLengthActual] = useState(0); // ✅ real total from DB
  const [studentLength, setStudentLength] = useState(0);             // active for selected program
  const [activeStudentCount, setActiveStudentCount] = useState(0);   // ✅ real active total from DB
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void fetchAllData(); }, []);

  useEffect(() => {
    if (!selectedProgram || programs.length === 0) {
      setStudentLength(0);
      return;
    }
    const found = programs.find(p => p.id === selectedProgram);
    setStudentLength(found?.active_students ?? 0);
  }, [selectedProgram, programs]);

  async function fetchAllData() {
    setError(null);

    const [totalsRes, byNameRes] = await Promise.all([
      supabase.rpc("kpi_totals"),            // returns [{ total_students, total_active }]
      supabase.rpc("get_all_students_with_programs") // returns [{ id,name,active_students,branches }, ...]
    ]);

    if (totalsRes.error || byNameRes.error) {
      setError(totalsRes.error?.message || byNameRes.error?.message || "Unknown error");
      return;
    }

    const totals = totalsRes.data?.[0] ?? { total_students: 0, total_active: 0 };
    setStudentLengthActual(Number(totals.total_students) || 0); // e.g., 1026 ✅
    setActiveStudentCount(Number(totals.total_active) || 0);

    const programStats = (byNameRes.data ?? []) as ProgramStat[];
    setPrograms(programStats);

    if (!selectedProgram && programStats.length > 0) {
      setSelectedProgram(programStats[0].id);
      setStudentLength(programStats[0].active_students);
    }
  }

  return (
    <dl className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
      {/* Total Students */}
      <Card className="border border-transparent dark:border-default-100">
        <div className="flex p-4 relative">
          <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-md bg-success-100">
            <Icon className="text-success" icon="solar:users-group-rounded-linear" width={20} />
          </div>
          <div className="flex flex-col gap-y-2">
            <dt className="mx-4 text-small font-medium text-default-500">Total Students</dt>
            <dd className="px-4 text-2xl font-semibold text-default-700">{studentLengthActual}</dd>
          </div>
        </div>
        <div className="bg-default-100">
          <Button fullWidth className="flex justify-start text-xs text-default-500" radius="none" variant="light">
            View All
          </Button>
        </div>
      </Card>

      {/* Active Students (by Program) */}
      <Card className="border border-transparent dark:border-default-100">
        <div className="flex p-4 relative">
          <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-md bg-success-100">
            <Icon className="text-success" icon="solar:chart-square-linear" width={20} />
          </div>
          <div className="flex flex-col gap-y-2 w-full">
            <dt className="mx-4 text-small font-medium text-default-500">Active Students (by Program)</dt>
            <dd className="px-4 text-2xl font-semibold text-default-700">{studentLength}</dd>

            <div className="px-4">
              <Autocomplete
                name="program"
                label="Program"
                placeholder="Select program"
                selectedKey={selectedProgram ?? undefined}
                onSelectionChange={(key) => setSelectedProgram(key ? String(key) : null)}
                items={programs}
                className="mt-2"
              >
                {(item) => (
                  <AutocompleteItem key={item.id} textValue={item.name}>
                    {item.name}
                  </AutocompleteItem>
                )}
              </Autocomplete>
            </div>
          </div>
        </div>
        <div className="bg-default-100">
          <Button fullWidth className="flex justify-start text-xs text-default-500" radius="none" variant="light">
            View All
          </Button>
        </div>
      </Card>

      {/* Total Active Students */}
      <Card className="border border-transparent dark:border-default-100">
        <div className="flex p-4 relative">
          <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-md bg-success-100">
            <Icon className="text-success" icon="solar:checklist-minimalistic-linear" width={20} />
          </div>
          <div className="flex flex-col gap-y-2">
            <dt className="mx-4 text-small font-medium text-default-500">Total Active Students</dt>
            <dd className="px-4 text-2xl font-semibold text-default-700">{activeStudentCount}</dd>
          </div>
        </div>
        <div className="bg-default-100">
          <Button fullWidth className="flex justify-start text-xs text-default-500" radius="none" variant="light">
            View All
          </Button>
        </div>
      </Card>

      {error && <div className="col-span-full text-danger px-2 text-sm">{error}</div>}
    </dl>
  );
}
