'use client'
import KpiState from "@/components/card/kpi-state";
import StudentTable from "@/components/table/student-table";

export default function Home() {
  return (
      <div className={"dark text-foreground bg-background p-3"}>
        <h1 className={"dark text-foreground bg-background mb-3 text-3xl"}>Welcome Back!!!</h1>
          <KpiState />
          <StudentTable />
      </div>
  );
}
