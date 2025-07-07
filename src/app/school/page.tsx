'use client';
import { useState } from 'react';
import AddSchoolModal from '@/components/modal/add-school';
import SchoolTable from '@/components/table/school-table';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

export default function SchoolPage() {
  const [isOpen, setIsOpen] = useState(false);

  const onOpenChange = () => setIsOpen((prev) => !prev);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">🏫 School List</h1>
        <Button
          color="primary"
          onPress={() => setIsOpen(true)}
          endContent={<Icon icon="solar:add-circle-bold" width={20} />}
        >
          Add School
        </Button>
      </div>

      <SchoolTable />

      <AddSchoolModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onClose={() => setIsOpen(false)}
        onSuccess={() => {
          setIsOpen(false);
          // Optional: trigger refetch in SchoolTable via prop, context, or event
        }}
      />
    </div>
  );
}
