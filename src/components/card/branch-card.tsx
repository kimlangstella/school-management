'use client';

import type { ButtonProps, CardProps } from '@heroui/react';
import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Cell,
  PolarAngleAxis,
} from 'recharts';
import {
  Card,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  cn,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { supabase } from '../../../lib/supabaseClient';

type Branch = {
  id: string;
  name: string;
  active_students: number;
};

type ChartData = {
  name: string;
  value: number;
  fill: string;
};

type CircleChartProps = {
  title: string;
  color: ButtonProps['color'];
  chartData: ChartData[];
  total: number;
};

export default function BranchCard() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState<string | null>(null);


useEffect(() => {
  fetchBranchesWithStudents();
}, []);

const fetchBranchesWithStudents = async () => {
  const [branchRes, studentRes] = await Promise.all([
    supabase.rpc("get_all_branches"),
    supabase.rpc("get_all_students_with_programs")
  ]);

  if (branchRes.error || studentRes.error) {
    setError(branchRes.error?.message || studentRes.error?.message || "Unknown error");
    return;
  }

  const branches = branchRes.data;
  const students = studentRes.data;

  // Count students per branch
 const branchesWithCounts = branches.map((branch: { id: any; }) => {
  const activeStudents = students.filter(
    (s: { branch_id: any; status: string; }) => s.branch_id === branch.id && s.status === "active"
  ).length;

  return {
    ...branch,
    active_students: activeStudents
  };
});

  setBranches(branchesWithCounts);
};


  const chartColors: ButtonProps['color'][] = ['default', 'primary', 'secondary', 'success', 'warning'];

const chartData: CircleChartProps[] = branches.map((branch, index) => ({
  title: branch.name,
  color: chartColors[index % chartColors.length],
  total: branch.active_students,
  chartData: [
    {
      name: 'Active Student',
      value: branch.active_students,
      fill: `hsl(var(--heroui-${chartColors[index % chartColors.length]}))`,
    },
  ],
}));

  return (
    <dl className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
      {chartData.map((item, index) => (
        <CircleChartCard key={index} {...item} />
      ))}
    </dl>
  );
}

const formatTotal = (value: number | undefined) => {
  return value?.toLocaleString() ?? '0';
};

const CircleChartCard = React.forwardRef<
  HTMLDivElement,
  Omit<CardProps, 'children'> & CircleChartProps
>(({ className, title, color, chartData, total, ...props }, ref) => {
  return (
    <Card
      ref={ref}
      className={cn('h-[240px] border border-transparent dark:border-default-100', className)}
      {...props}
    >
      <div className="flex flex-col gap-y-2 p-4 pb-0">
        <div className="flex items-center justify-between gap-x-2">
          <dt>
            <h3 className="text-small font-medium text-default-500">{title}</h3>
          </dt>
          <div className="flex items-center justify-end gap-x-2">
            <Dropdown classNames={{ content: 'min-w-[120px]' }} placement="bottom-end">
              <DropdownTrigger>
                <Button isIconOnly radius="full" size="sm" variant="light">
                  <Icon height={16} icon="solar:menu-dots-bold" width={16} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu itemClasses={{ title: 'text-tiny' }} variant="flat">
                <DropdownItem key="view-details">View Details</DropdownItem>
                <DropdownItem key="export-data">Export Data</DropdownItem>
                <DropdownItem key="set-alert">Set Alert</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>
      <div className="flex h-full gap-x-3">
        <ResponsiveContainer
          className="[&_.recharts-surface]:outline-none"
          height="100%"
          width="100%"
        >
          <RadialBarChart
            barSize={10}
            cx="50%"
            cy="50%"
            data={chartData}
            endAngle={-270}
            innerRadius={90}
            outerRadius={70}
            startAngle={90}
          >
            <PolarAngleAxis angleAxisId={0} domain={[0, total]} tick={false} type="number" />
            <RadialBar
              angleAxisId={0}
              animationDuration={1000}
              animationEasing="ease"
              background={{
                fill: 'hsl(var(--heroui-default-100))',
              }}
              cornerRadius={12}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`hsl(var(--heroui-${color === 'default' ? 'foreground' : color}))`}
                />
              ))}
            </RadialBar>
            <g>
              <text textAnchor="middle" x="50%" y="48%">
                <tspan className="fill-default-500 text-tiny" dy="-0.5em" x="50%">
                  {chartData?.[0].name}
                </tspan>
                <tspan className="fill-foreground text-medium font-semibold" dy="1.5em" x="50%">
                  {formatTotal(total)}
                </tspan>
              </text>
            </g>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
});

CircleChartCard.displayName = 'CircleChartCard';
