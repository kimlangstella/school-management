'use client';

import {
    Input,
    Select,
    SelectItem,
    Spinner,
    Table,
    TableHeader,
    TableBody,
    TableColumn,
    TableRow,
    TableCell,
    Chip,
    Card,
    CardBody
} from "@heroui/react";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "../../../lib/supabaseClient";

const supabase = createClient();

type Payment = {
    id: string;
    student_id: string;
    amount: number;
    payment_method: string;
    payment_for: string;
    paid_date: string;
    due_date: string;
    status: "Paid" | "Unpaid";
};

type Student = {
    id: string;
    first_name: string;
    last_name?: string;
    program_id: string;
    branch_id: string;
};

type Program = {
    id: string;
    name: string;
};

type Branch = {
    id: string;
    name: string;
};

type StudentPaymentSummary = {
    id: string;
    full_name: string;
    program?: string;
    branch?: string;
    paymentStatus: "Paid" | "Unpaid";
    totalAmount: number;
    latestMethod?: string;
    latestFor?: string;
    latestPaid?: string;
    latestDue?: string;
};

export default function StudentPaymentsTable() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [filtered, setFiltered] = useState<StudentPaymentSummary[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Removed unused state 'editingPayment' which caused 'any' error

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const [paymentRes, studentRes, programRes, branchRes] = await Promise.all([
            supabase.rpc("get_all_payments"),
            supabase.rpc("get_all_students"),
            supabase.rpc("get_all_programs"),
            supabase.rpc("get_all_branches")
        ]);

        if (paymentRes.error || studentRes.error || programRes.error || branchRes.error) {
            setError(
                paymentRes.error?.message ||
                studentRes.error?.message ||
                programRes.error?.message ||
                branchRes.error?.message ||
                "Failed to load data"
            );
        } else {
            setPayments(paymentRes.data || []);
            setStudents(studentRes.data || []);
            setPrograms(programRes.data || []);
            setBranches(branchRes.data || []);
        }

        setLoading(false);
    };

    const getFullName = (s: Student) =>
        `${s.first_name} ${s.last_name || ""}`.trim();

    const getProgramName = (id: string) =>
        programs.find((p) => p.id === id)?.name || "-";

    const getBranchName = (id: string) =>
        branches.find((b) => b.id === id)?.name || "-";

    // FIX: Wrapped in useCallback to satisfy exhaustive-deps
    const filterStudents = useCallback(() => {
        const studentSummaries: StudentPaymentSummary[] = students.map((student) => {
            const studentPayments = payments
                .filter((p) => p.student_id === student.id)
                .sort((a, b) => new Date(b.paid_date).getTime() - new Date(a.paid_date).getTime());

            const hasPaid = studentPayments.some((p) => p.status === "Paid");
            const totalAmount = studentPayments.reduce((sum, p) => sum + (p.status === "Paid" ? p.amount : 0), 0);
            const latest = studentPayments[0];

            return {
                id: student.id,
                full_name: getFullName(student),
                program: getProgramName(student.program_id),
                branch: getBranchName(student.branch_id),
                paymentStatus: hasPaid ? "Paid" : "Unpaid",
                totalAmount,
                latestMethod: latest?.payment_method || "-",
                latestFor: latest?.payment_for || "-",
                latestPaid: latest?.paid_date || "-",
                latestDue: latest?.due_date || "-"
            };
        });

        const filteredResult = studentSummaries.filter((s) => {
            const matchesStatus = statusFilter === "All" || s.paymentStatus === statusFilter;
            const matchesSearch = s.full_name.toLowerCase().includes(search.toLowerCase());
            return matchesStatus && matchesSearch;
        });

        setFiltered(filteredResult);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [payments, students, search, statusFilter, programs, branches]);

    // FIX: Added filterStudents to dependency array
    useEffect(() => {
        filterStudents();
    }, [filterStudents]);

    // Removed unused handleEdit function

    if (loading) return <div className="flex justify-center mt-10"><Spinner size="lg" /></div>;
    if (error) return <p className="text-red-600 text-center mt-6">{error}</p>;

    return (
        <div className="max-w-6xl mx-auto mt-4 sm:mt-10 px-2 sm:px-4">
            <Card>
                <CardBody className="p-2 sm:p-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                        <Input
                            type="text"
                            label="Search by student"
                            placeholder="Enter student name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full sm:w-1/3"
                        />

                        <Select
                            label="Filter by status"
                            className="w-full sm:w-1/4"
                            selectedKeys={[statusFilter]}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <SelectItem key="All">All</SelectItem>
                            <SelectItem key="Paid">Paid</SelectItem>
                            <SelectItem key="Unpaid">Unpaid</SelectItem>
                        </Select>
                    </div>

                    <div className="overflow-x-auto">
                        <Table isStriped isCompact aria-label="Student Payment Summary Table" className="min-w-[800px]">
                        <TableHeader>
                            <TableColumn>#</TableColumn>
                            <TableColumn>Student</TableColumn>
                            <TableColumn>Program</TableColumn>
                            <TableColumn>Branch</TableColumn>
                            <TableColumn>Total Amount</TableColumn>
                            <TableColumn>Status</TableColumn>
                            <TableColumn>Method</TableColumn>
                            <TableColumn>For</TableColumn>
                            <TableColumn>Paid</TableColumn>
                            <TableColumn>Due</TableColumn>
                            <TableColumn>Action</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent="No matching students.">
                            {filtered.map((student, index) => (
                                <TableRow key={student.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{student.full_name}</TableCell>
                                    <TableCell>{student.program}</TableCell>
                                    <TableCell>{student.branch}</TableCell>
                                    <TableCell>${student.totalAmount.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Chip color={student.paymentStatus === "Paid" ? "success" : "danger"}>
                                            {student.paymentStatus}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>{student.latestMethod}</TableCell>
                                    <TableCell>{student.latestFor}</TableCell>
                                    <TableCell>{student.latestPaid}</TableCell>
                                    <TableCell>{student.latestDue}</TableCell>
                                    <TableCell>
                                        <button
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                                            onClick={() => console.log("Edit clicked for", student)}
                                        >
                                            Edit
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}