"use client";
import React, { useState, useEffect } from "react";
import TrailFormModal from "@/components/modal/edit-trial";
import StudentTable from "@/components/table/trial-table";
import AddTrail from "@/components/modal/add-trial";
import { supabase } from "../../../lib/supabaseClient";
export default function TrialPage() {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTrial, setEditingTrial] = useState(null);
  const [trails, setTrails] = useState([]);
  const [error, setError] = useState<string | null>(null);

  const fetchTrails = async () => {
    const { data: trailData, error: trailError } = await supabase.rpc(
      "get_all_trails"
    );
    console.log("data", trailData);
    if (trailError) {
      console.error("Failed to fetch trails:", trailError.message);
      setError(trailError.message);
    } else {
      setTrails(trailData || []);
      setError(null);
    }
  };

  useEffect(() => {
    fetchTrails();
  }, []);

  return (
    <>

      {/* <div>
        <AddTrail onSuccess={fetchTrails}></AddTrail>
      </div> */}
      <div className="p-8">
        <StudentTable
          onEdit={(trial) => {
            setEditingTrial(trial);
            setEditModalOpen(true);
          }}
        />

        {editingTrial && (
          <TrailFormModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setEditingTrial(null);
            }}
            editingId={editingTrial.id}
            initialData={editingTrial}
            onSuccess={() => {
              setEditModalOpen(false);
              setEditingTrial(null);
              fetchTrails();

            }}
          />
        )}
      </div>
    </>
  );
}
