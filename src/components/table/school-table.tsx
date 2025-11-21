'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabaseClient';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Button,
  Card,
} from '@heroui/react';
import EditSchoolModal from '../modal/edit-school';

type School = {
  id: string;
  name: string;
  location: string;
  contact_info: string;
};

export default function SchoolTable() {
  const [schools, setSchools] = useState<School[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
const supabase = createClient();
  const fetchSchools = async () => {
    const { data, error } = await supabase.rpc('get_all_schools');
    if (error) {
      setError(error.message);
    } else {
      setSchools(data as School[]);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  return (
    <div className="p-6">
      <Card className="p-6 shadow-md border border-default-100 rounded-lg bg-background">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-default-900">School List</h2>

          {/* Optional: add button for adding new school */}
          {/* <Button color="primary" size="sm">Add School</Button> */}
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <Table
          isStriped
          aria-label="School Table"
          className="rounded-xl overflow-hidden w-full"
        >
          <TableHeader>
            <TableColumn>#</TableColumn>
            <TableColumn>School Name</TableColumn>
            <TableColumn>Address</TableColumn>
            <TableColumn>Phone</TableColumn>
            <TableColumn className="text-center">Action</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No schools found.">
            {schools.map((school, index) => (
              <TableRow key={school.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium text-default-800">{school.name}</TableCell>
                <TableCell>{school.location}</TableCell>
                <TableCell>{school.contact_info}</TableCell>
                <TableCell className="text-center">
                  <Button
                    size="sm"
                    color="warning"
                    variant="flat"
                    onClick={() => {
                      setSelectedSchool(school);
                      setEditModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Modal */}
      {selectedSchool && (
        <EditSchoolModal
          isOpen={editModalOpen}
          onOpenChange={() => setEditModalOpen((v) => !v)}
          onClose={() => setEditModalOpen(false)}
          school={selectedSchool}
          onSuccess={() => {
            setEditModalOpen(false);
            fetchSchools();
          }}
        />
      )}
    </div>
  );
}
