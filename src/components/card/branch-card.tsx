'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '../../../lib/supabaseClient';

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
import type { ButtonProps, CardProps } from '@heroui/react';

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

const supabase = createClient();
const fetchBranchesWithActiveStudents = async (): Promise<Branch[]> => {
    const [branchRes, studentRes] = await Promise.all([
        supabase.rpc('get_all_branches'),
        supabase.rpc('get_all_students'),
    ]);

    if (branchRes.error || studentRes.error) {
        throw new Error(branchRes.error?.message || studentRes.error?.message || 'Unknown error');
    }

    const branches = branchRes.data;
    const students = studentRes.data;

    // FIX: Replaced 'any' with 'string' for IDs
    return branches.map((branch: { id: string; name: string }) => {
        const activeStudents = students.filter(
            (s: { branch_id: string; status: string }) =>
                s.branch_id === branch.id && s.status === 'active'
        ).length;

        return {
            ...branch,
            active_students: activeStudents,
        };
    });
};

export default function BranchCard() {
    const chartColors: ButtonProps['color'][] = ['default', 'primary', 'secondary', 'success', 'warning'];

    const {
        data: branches = [],
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['branches-with-students'],
        queryFn: fetchBranchesWithActiveStudents,
        staleTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false,
        retry: 1,
    });

    if (isLoading) return <p>Loading branches...</p>;
    if (isError) return <p className="text-red-500">Error: {error?.message}</p>;

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
        <dl className="grid w-full grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                    <h3 className="text-small font-medium text-default-500">{title}</h3>
                    <Dropdown classNames={{ content: 'min-w-[120px]' }} placement="bottom-end">
                        <DropdownTrigger>
                            <Button isIconOnly radius="full" size="sm" variant="light">
                                <Icon height={16} icon="solar:menu-dots-bold" width={16} />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu 
                            itemClasses={{ title: 'text-tiny' }} 
                            variant="flat"
                            classNames={{
                                base: "dark text-foreground bg-background max-h-[300px] overflow-y-auto",
                            }}
                        >
                            <DropdownItem 
                                key="view-details"
                                classNames={{
                                    base: "text-foreground data-[hover=true]:bg-default-100",
                                }}
                            >
                                View Details
                            </DropdownItem>
                            <DropdownItem 
                                key="export-data"
                                classNames={{
                                    base: "text-foreground data-[hover=true]:bg-default-100",
                                }}
                            >
                                Export Data
                            </DropdownItem>
                            <DropdownItem 
                                key="set-alert"
                                classNames={{
                                    base: "text-foreground data-[hover=true]:bg-default-100",
                                }}
                            >
                                Set Alert
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
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
                            animationDuration={800}
                            animationEasing="ease-in-out"
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