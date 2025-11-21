'use client'
import KpiState from "@/components/card/kpi-state";
import StudentTable from "@/components/table/student-table";

export default function Home() {
  return (
      <div className={"dark text-foreground bg-background p-2 sm:p-4 lg:p-6"}>
        <h1 className={"dark text-foreground bg-background mb-3 text-xl sm:text-2xl lg:text-3xl"}>Welcome Back!!!</h1>
          <KpiState />
          <StudentTable />
      </div>
  );
}
