"use client";

import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Card
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { supabase } from "../../../lib/supabaseClient";

// ---------- Type Definitions ----------
type Program = {
  id: string;
  name: string;
  program_name?: string;
};

type Student = {
  id: string;
  status: string;
};

type StudentProgram = {
  student_id: string;
  program_id: string;
};
type ProgramStat = {
  id: string;
  name: string;
  active_students: number;
};
export default function KpiState() {
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<ProgramStat[]>([]);
  const [studentLengthActual, setStudentLengthActual] = useState(0);
  const [studentLength, setStudentLength] = useState(0);
  const [activeStudentCount, setActiveStudentCount] = useState(0);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Recalculate filtered students by selected program
  useEffect(() => {
    if (selectedProgram && programs.length > 0) {
      const found = programs.find((p) => p.id === selectedProgram);
      setStudentLength(found?.active_students ?? 0);
    } else {
      setStudentLength(0);
    }
  }, [selectedProgram, programs]);

  const fetchAllData = async () => {
    const [programRes, studentRes, studentProgramRes] = await Promise.all([
      supabase.rpc("get_all_programs"),
      supabase.rpc("get_all_students_with_programs"),
      supabase.from("student_programs").select("*"),
    ]);

    if (
      programRes.error ||
      studentRes.error ||
      studentProgramRes.error
    ) {
      setError(
        programRes.error?.message ||
        studentRes.error?.message ||
        studentProgramRes.error?.message ||
        "Unknown error"
      );
      return;
    }

    const programData = programRes.data as Program[];
    const studentData = studentRes.data as Student[];
    const studentPrograms = studentProgramRes.data as StudentProgram[];

    setStudents(studentData);
    setStudentLengthActual(studentData.length);

    const activeStudents = studentData.filter((s) => s.status === "active");
    setActiveStudentCount(activeStudents.length);

    const activeStudentIds = new Set(activeStudents.map((s) => s.id));

    const programCounts: Record<string, number> = {};
    studentPrograms.forEach(({ student_id, program_id }) => {
      if (activeStudentIds.has(student_id)) {
        programCounts[program_id] = (programCounts[program_id] || 0) + 1;
      }
    });

    const programStats = programData.map((p) => ({
      id: p.id,
      name: p.name,
      active_students: programCounts[p.id] || 0,
    }));

    setPrograms(programStats);
  };

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

      {/* Active Students by Program */}
      <Card className="border border-transparent dark:border-default-100">
        <div className="flex p-4 relative">
          <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-md bg-success-100">
            <Icon className="text-success" icon="solar:users-group-rounded-linear" width={20} />
          </div>
          <div className="flex flex-col gap-y-2 w-full">
            <dt className="mx-4 text-small font-medium text-default-500">
              Active Students (by Program)
            </dt>
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
            <Icon className="text-success" icon="solar:users-group-rounded-linear" width={20} />
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
    </dl>
  );
}
