'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabaseClient';
import CardAaa from '@/components/card/card-aaa';
import AddProgram from '@/components/modal/add-program';
import EditProgramModal from '@/components/modal/edit-program';
import { Tabs, Tab } from '@heroui/react';

type Program = {
  id: string;
  name: string;
  description: string;
  age: string;
  branch_id: string;
};

type Branch = {
  id: string;
  name: string;
};

export default function ProgramPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
 const supabase = createClient();
  const fetchPrograms = async () => {
    const { data, error } = await supabase.rpc('get_all_programs');
    console.log("data",data)
    if (!error) setPrograms(data as Program[]);
  };

  const fetchBranches = async () => {
    const { data, error } = await supabase.rpc('get_all_branches');
    if (!error) setBranches(data as Branch[]);
  };

  useEffect(() => {
    fetchPrograms();
    fetchBranches();
  }, []);

// const handleDelete = async (id: string) => {
//   const confirmDelete = window.confirm('Delete this program?');
//   if (!confirmDelete) return;
//
//   const { error } = await supabase.rpc('delete_program', { _id: id });
//
//   if (error) {
//     console.error('Failed to delete program:', error.message);
//     alert(`Delete failed: ${error.message}`);
//   } else {
//     fetchPrograms();
//   }
// };

  // ✅ Filter programs based on selected branch
  const filteredPrograms = selectedBranch
    ? programs.filter(p => p.branch_id === selectedBranch)
    : programs;

  // ✅ Helper to get branch name by id
  const getBranchNameById = (id: string) => {
    const branch = branches.find(b => b.id === id);
    return branch ? branch.name : 'Unknown Branch';
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2 sm:px-4 lg:px-6 mt-4 sm:mt-6 mb-4">
        <h2 className="text-lg sm:text-xl font-bold">Programs</h2>
        <AddProgram onSuccess={fetchPrograms} />
      </div>

      <div className="px-2 sm:px-4 lg:px-6 mb-4 sm:mb-6">
        <Tabs
          selectedKey={selectedBranch ?? "all"}
          onSelectionChange={(key) => setSelectedBranch(key === "all" ? null : key as string)}
          variant="underlined"
          classNames={{
            base: "w-full",
            tabList: "gap-2 sm:gap-4 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-primary",
            tab: "max-w-fit px-3 sm:px-4 h-10 sm:h-12",
            tabContent: "group-data-[selected=true]:text-primary text-default-500",
          }}
        >
          <Tab
            key="all"
            title={
              <div className="flex items-center gap-2">
                <span>All</span>
                <span className="text-xs text-default-400">({programs.length})</span>
              </div>
            }
          />
          {branches.map(branch => {
            const branchProgramCount = programs.filter(p => p.branch_id === branch.id).length;
            return (
              <Tab
                key={branch.id}
                title={
                  <div className="flex items-center gap-2">
                    <span>{branch.name}</span>
                    <span className="text-xs text-default-400">({branchProgramCount})</span>
                  </div>
                }
              />
            );
          })}
        </Tabs>
      </div>

      <div className="px-2 sm:px-4 lg:px-6 pb-6 sm:pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredPrograms.length > 0 ? (
            filteredPrograms.map(program => (
              <CardAaa
                key={program.id}
                name={program.name}
                description={program.description}
                age={program.age}
                branch={getBranchNameById(program.branch_id)} 
                // onEdit={() => setSelectedProgram(program)}
                // onDelete={() => handleDelete(program.id)}
              />
            ))
          ) : (
            <p className="text-default-500 col-span-full">No programs found.</p>
          )}
        </div>

        {selectedProgram && (
          <EditProgramModal
            program={selectedProgram}
            onClose={() => setSelectedProgram(null)}
            onSuccess={fetchPrograms}
          />
        )}
      </div>
    </>
  );
}
