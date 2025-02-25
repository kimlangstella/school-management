"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import Image from "next/image";
import { PencilSquareIcon } from "@heroicons/react/24/solid";

interface Student {
  teacher_name: string | string[];
  admin_name: string;
  program_name: string | string[];
  id: number;
  client: string;
  phone: string;
  number_student: number;
  programs: number[] | undefined;
  status: string;
  status_display: string;
  assign_by: number;
  handle_by: number[];
}

const Page: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [checkedStudentId, setCheckedStudentId] = useState<number | null>(null); // ✅ Track checked student
  const [showModal, setShowModal] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const tokenFromLocalStorage = localStorage.getItem("authToken");
    if (tokenFromLocalStorage) {
      setToken(tokenFromLocalStorage);
    } else {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!token) return;

    const fetchStudentData = async () => {
      try {
        const studentResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/student_trail/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setStudents(studentResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [token]);

  const handleBack = () => {
    router.push(`/student/trial-student`);
  };

  /** ✅ Toggle Checkbox Selection */
  const handleCheck = (id: number) => {
    setCheckedStudentId(checkedStudentId === id ? null : id);
  };

  const handleEdit = (id: number) => {
    router.push(`/student/trial-student/edit/${id}`);
  };

  const handleDeleteClick = (id: number) => {
    setSelectedStudentId(id);
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedStudentId && token) {
      try {
        await axios.delete(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/student_trail/${selectedStudentId}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setStudents((prev) =>
          prev.filter((student) => student.id !== selectedStudentId)
        );
        setShowModal(false);
      } catch (error) {
        console.error("Error deleting student:", error);
        alert("Failed to delete student.");
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const filteredStudents = students.filter(
    (student) =>
      student.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.phone.includes(searchQuery)
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="lg:ml-[219px] mt-20 ml-[25px] flex flex-col">
      <Button className="mb-4" onClick={handleBack}>Back</Button>
      <span className="text-[28px] font-semibold text-center">Trial List</span>

      {/* ✅ Action buttons appear only when a checkbox is selected */}
      {checkedStudentId && (
        <div className="mt-4 mb-4 flex space-x-4 bg-gray-100 p-4 rounded-lg shadow">
          <button
            onClick={() => handleEdit(checkedStudentId)}
            className="hover:scale-110 transition-transform transform p-2 rounded-full bg-gray-200 hover:bg-gray-300"
          >
            <PencilSquareIcon className="w-5 h-5 text-gray-700" />
          </button>
          <Image
            src="/delete.svg"
            width={20}
            height={20}
            alt="delete"
            className="cursor-pointer ml-3"
            onClick={() => handleDeleteClick(checkedStudentId)}
          />
        </div>
      )}

      <table className="border w-[1050px] bg-white rounded-lg shadow-md">
        <thead>
          <tr className="text-center font-normal text-black">
            <th className="p-2 border-2">
              <input type="checkbox" disabled />
            </th>
            <th className="border px-3 py-2">ID</th>
            <th className="border px-3 py-2">Client</th>
            <th className="border px-3 py-2">Phone</th>
            <th className="border px-3 py-2">Number of Students</th>
            <th className="border px-3 py-2">Programs</th>
            <th className="border px-3 py-2">Status</th>
            <th className="border px-3 py-2">Assigned By</th>
            <th className="border px-3 py-2">Handled By</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <tr key={student.id}>
                {/* ✅ Checkbox Selection */}
                <td className="p-2 border-2 text-center">
                  <input
                    type="checkbox"
                    checked={checkedStudentId === student.id}
                    onChange={() => handleCheck(student.id)}
                  />
                </td>
                <td className="border px-4 py-2">{student.id}</td>
                <td className="border px-4 py-2">{student.client}</td>
                <td className="border px-4 py-2">{student.phone}</td>
                <td className="border px-4 py-2 text-center">{student.number_student}</td>
                <td className="border px-4 py-2">
                  {Array.isArray(student.program_name)
                    ? student.program_name.join(", ")
                    : "No Programs"}
                </td>
                <td className="border px-4 py-2">{student.status_display}</td>
                <td className="border px-4 py-2">{student.admin_name || "Unknown"}</td>
                <td className="border px-4 py-2">
                  {Array.isArray(student.teacher_name)
                    ? student.teacher_name.join(", ")
                    : "No Teachers Assigned"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={9} className="border px-4 py-2 text-center text-gray-500">
                No students found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showModal && <Modal onClose={handleModalClose} onConfirm={handleDeleteConfirm} />}
    </div>
  );
};

export default Page;
