'use client';

import { useEffect, useState } from 'react';
import AttendanceTable from '@/components/table/attendance-table';
import { createClient } from '../../../lib/supabaseClient';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from '@heroui/react';

type Branch = {
  id: string;
  name: string;
};

type Program = {
  id: string;
  name: string;
  branch_id: string;
};

export default function AttendancePage() {

  const [branches, setBranches] = useState<Branch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const supabase = createClient();
  useEffect(() => {
    const fetchMeta = async () => {
      const [{ data: branchesData }, { data: programsData }] = await Promise.all([
        supabase.rpc('get_all_branches'),
        supabase.rpc('get_all_programs'),
      ]);

      if (branchesData) setBranches(branchesData);
      if (programsData) setPrograms(programsData);
    };

    fetchMeta();
  }, []);

  const filteredPrograms = selectedBranchId
    ? programs.filter((p) => p.branch_id === selectedBranchId)
    : [];

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">📋 Student Attendance</h1>
       
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        {/* Branch Dropdown */}
        <div>
          <Dropdown>
            <DropdownTrigger>
              <Button variant="bordered" className="w-64 text-white">
                {branches.find((b) => b.id === selectedBranchId)?.name || 'All Branches'}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Select Branch"
              selectedKeys={new Set([selectedBranchId])}
              onAction={(key) => {
                setSelectedBranchId(key as string);
                setSelectedProgramId(''); // reset program on branch change
              }}
            >
              <DropdownItem key="">All Branches</DropdownItem>
              {branches.map((b) => (
                <DropdownItem key={b.id}>{b.name}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>

        {/* Program Dropdown */}
        <div>
          <Dropdown isDisabled={!selectedBranchId}>
            <DropdownTrigger>
              <Button variant="bordered" className="w-64 text-white">
                {filteredPrograms.find((p) => p.id === selectedProgramId)?.name ||
                  'All Programs'}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Select Program"
              selectedKeys={new Set([selectedProgramId])}
              onAction={(key) => setSelectedProgramId(key as string)}
            >
              <DropdownItem key="">All Programs</DropdownItem>
              {filteredPrograms.map((p) => (
                <DropdownItem key={p.id}>{p.name}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Attendance Table */}
      <AttendanceTable
        selectedBranchId={selectedBranchId}
        selectedProgramId={selectedProgramId}
      />

      {/* Add Modal */}
      
    </div>
  );
}
