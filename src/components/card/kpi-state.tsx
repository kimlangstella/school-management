"use client";

import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Card,
  Chip
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { supabase } from "../../../lib/supabaseClient";
import { Student } from "@/components/types/columns"; // Adjust path if needed

type Program = {
  id: string;
  name: string;
  branch_name?: string;
};

export default function KpiState() {
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [studentLengthActual, setStudentLengthActual] = useState(0);
  const [studentLength, setStudentLength] = useState(0);
  const [activeStudentCount, setActiveStudentCount] = useState(0);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch students
  const fetchStudents = async () => {
    const { data, error } = await supabase.rpc("get_all_students");
    if (error) {
      console.error("Failed to fetch students:", error.message);
      setError(error.message);
    } else {
      setStudents(data);
      setStudentLengthActual(data.length);

      const active = data.filter((s: Student) => s.status === "active");
      setActiveStudentCount(active.length);
    }
  };

 const fetchPrograms = async () => {
     const { data, error } = await supabase.rpc('get_all_programs');
     if (!error) setPrograms(data as Program[]);
   };
 

 
   useEffect(() => {
     fetchPrograms();
   }, []);

  // Count filtered students
  useEffect(() => {
    if (selectedProgram) {
      const filtered = students.filter(
        (s: Student) => s.program === selectedProgram && s.status === "active"
      );
      setStudentLength(filtered.length);
    } else {
      setStudentLength(0);
    }
  }, [students, selectedProgram]);

  useEffect(() => {
    fetchStudents();
    fetchPrograms();
  }, []);

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
                onSelectionChange={(key) => key && setSelectedProgram(String(key))}
                items={programs}
                className="mt-2"
              >
                {(item) => (
                  <AutocompleteItem key={item.id} textValue={item.name}>
                    {item.name} {item.program_name ? `(${item.program_name})` : ""}
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
