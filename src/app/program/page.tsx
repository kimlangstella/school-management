'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import CardAaa from '@/components/card/card-aaa';
import AddProgram from '@/components/modal/add-program';
import EditProgramModal from '@/components/modal/edit-program';

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
      <div className="flex items-center justify-between px-6 mt-6 mb-4">
        <h2 className="text-xl font-bold">Programs</h2>
        <AddProgram onSuccess={fetchPrograms} />
      </div>

      <div className="flex flex-wrap items-center gap-3 px-6 mb-6">
        <button
          className={`px-4 py-2 rounded-md border text-sm ${
            selectedBranch === null ? 'bg-primary text-white' : 'bg-default-100'
          }`}
          onClick={() => setSelectedBranch(null)}
        >
          All Branches
        </button>
        {branches.map(branch => (
          <button
            key={branch.id}
            className={`px-4 py-2 rounded-md border text-sm ${
              selectedBranch === branch.id ? 'bg-primary text-white' : 'bg-default-100'
            }`}
            onClick={() => setSelectedBranch(branch.id)}
          >
            {branch.name}
          </button>
        ))}
      </div>

      <div className="px-6 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
