"use client";

import React, { useEffect, useState } from "react";
import { Card, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "../../../lib/supabaseClient";

const supabase = createClient();

// Paginated fetch for RPC capped at 500 rows
async function fetchAllStudentsViaRPC(params?: {
  p_status?: string | null;
  p_branch_id?: string | null;
}) {
  const pageSize = 500;
  let offset = 0;
  let allRows: any[] = [];
  let totalCount: number | null = null;

  while (true) {
    const { data, error } = await supabase.rpc("get_all_student_with_programs_offset", {
      p_limit: pageSize,
      p_offset: offset,
      p_status: params?.p_status ?? null,
      p_branch_id: params?.p_branch_id ?? null,
    });

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as any[];

    if (rows.length > 0 && totalCount === null) {
      totalCount = Number(rows[0].total_count ?? rows.length);
    }

    allRows = allRows.concat(rows);

    if (rows.length < pageSize) break;

    offset += pageSize;

    if (totalCount !== null && allRows.length >= totalCount) break;
  }

  return { rows: allRows, totalCount: totalCount ?? allRows.length };
}

export default function KpiState() {
  const [totalStudents, setTotalStudents] = useState(0);
  const [activeStudents, setActiveStudents] = useState(0);
  const [paidAmongActive, setPaidAmongActive] = useState(0);
  const [unpaidAmongActive, setUnpaidAmongActive] = useState(0);
  const [inactiveStudents, setInactiveStudents] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchAllData();
  }, []);

  async function fetchAllData() {
    setError(null);

    try {
      // Fetch all students via paginated RPC
      const { rows, totalCount } = await fetchAllStudentsViaRPC();

      // Build student-level maps (consolidate multiple rows per student)
      const studentIds = new Set<string>();
      const statusMap: Record<string, "active" | "inactive" | string> = {};
      const paidMap: Record<string, boolean> = {};

      rows.forEach((row) => {
        const sid = String(row.id);
        if (!sid) return;

        studentIds.add(sid);

        // Normalize status (favor any row marking student 'active')
        const s = typeof row.status === "string" ? row.status.trim().toLowerCase() : "";
        if (statusMap[sid] !== "active") {
          statusMap[sid] = s as any;
        }

        // Normalize payment_status (string or boolean)
        const ps = row.payment_status;
        const isPaid =
          typeof ps === "boolean"
            ? ps
            : typeof ps === "string"
            ? ps.trim().toLowerCase() === "paid"
            : false;

        if (paidMap[sid] === undefined) paidMap[sid] = false;
        if (isPaid) paidMap[sid] = true;
      });

      const totalUnique = studentIds.size;
      const activeOnly = Array.from(studentIds).filter((sid) => statusMap[sid] === "active").length;
      const paidActiveOnly = Array.from(studentIds).filter(
        (sid) => statusMap[sid] === "active" && paidMap[sid] === true
      ).length;
      const unpaidActiveOnly = activeOnly - paidActiveOnly;
      const inactiveOnly = Array.from(studentIds).filter(
        (sid) => statusMap[sid] === "inactive" || statusMap[sid] === "hold"
      ).length;

      setTotalStudents(totalUnique);
      setActiveStudents(activeOnly);
      setPaidAmongActive(paidActiveOnly);
      setUnpaidAmongActive(unpaidActiveOnly);
      setInactiveStudents(inactiveOnly);

      // Logs for verification
      console.log("RPC total_count:", totalCount);
      console.log("Fetched rows:", rows.length);
      console.log("Unique students:", totalUnique);
      console.log("Active students (unique):", activeOnly);
      console.log("Paid among active (unique):", paidActiveOnly);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    }
  }

  return (
    <div className="w-full">
      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
        {/* First: Active students */}
        <Card className="border border-transparent dark:border-default-100">
          <div className="flex p-4 relative">
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-md bg-success-100">
              <Icon className="text-success" icon="solar:checklist-minimalistic-linear" width={20} />
            </div>
            <div className="flex flex-col gap-y-2">
              <dt className="mx-4 text-small font-medium text-default-500">Active students</dt>
              <dd className="px-4 text-2xl font-semibold text-default-700">{activeStudents}</dd>
            </div>
          </div>
        </Card>

        {/* Second: Paid with Unpaid below */}
        <Card className="border border-transparent dark:border-default-100">
          <div className="flex p-4 relative">
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-md bg-success-100">
              <Icon className="text-success" icon="solar:dollar-minimalistic-linear" width={20} />
            </div>
            <div className="flex flex-col gap-y-2 flex-1">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between mx-4">
                  <dt className="text-small font-medium text-default-500">Paid</dt>
                  <dd className="text-xl font-semibold text-success">{paidAmongActive}</dd>
                </div>
                <Divider className="mx-4" />
                <div className="flex items-center justify-between mx-4">
                  <dt className="text-small font-medium text-default-500">Unpaid</dt>
                  <dd className="text-xl font-semibold text-danger">{unpaidAmongActive}</dd>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Third: Inactive students */}
        <Card className="border border-transparent dark:border-default-100">
          <div className="flex p-4 relative">
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-md bg-danger-100">
              <Icon className="text-danger" icon="solar:user-cross-rounded-linear" width={20} />
            </div>
            <div className="flex flex-col gap-y-2">
              <dt className="mx-4 text-small font-medium text-default-500">Inactive students</dt>
              <dd className="px-4 text-2xl font-semibold text-default-700">{inactiveStudents}</dd>
            </div>
          </div>
        </Card>
      </dl>

      {error && <div className="mt-4 text-danger px-2 text-sm">{error}</div>}
    </div>
  );
}
