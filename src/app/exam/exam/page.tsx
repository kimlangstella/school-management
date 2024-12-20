"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import Image from "next/image";

const Page = () => {
  const [token, setToken] = useState<string | null>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]); // Initialize as an empty array
  const [classrooms, setClassrooms] = useState<any[]>([]); // Initialize as an empty array
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); // State for modal visibility
  const [examToDelete, setExamToDelete] = useState<number | null>(null); // State for tracking the exam to be deleted
  const router = useRouter();

  // Retrieve token from local storage
  useEffect(() => {
    const tokenFromLocalStorage = localStorage.getItem("authToken");
    if (tokenFromLocalStorage) {
      setToken(tokenFromLocalStorage);
    } else {
      router.push("/login");
    }
  }, [router]);

  // Fetch exam, course, and classroom data
  useEffect(() => {
    if (token) {
      setLoading(true);

      // Fetch exams
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/exams/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => setExams(data || []))
        .catch((error) => console.error("Error fetching exams:", error));

      // Fetch courses
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/course/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => setCourses(data || []))
        .catch((error) => console.error("Error fetching courses:", error));

      // Fetch classrooms (ensure we access the results field)
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/classroom/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => setClassrooms(data.results || [])) // Extract 'results'
        .catch((error) => console.error("Error fetching classrooms:", error));

      setLoading(false);
    }
  }, [token]);

  // Get course name by ID
  const getCourseName = (courseId: number) => {
    if (!Array.isArray(courses)) return "N/A"; // Guard clause
    const course = courses.find((course: any) => course.id === courseId);
    return course ? course.name : "N/A";
  };

  // Get classroom name by ID (from the 'results' array)
  const getClassroomName = (classroomId: number) => {
    if (!Array.isArray(classrooms)) return "N/A"; // Guard clause
    const classroom = classrooms.find((classroom: any) => classroom.id === classroomId);
    return classroom ? classroom.name : "N/A";
  };

  // Handle Edit
  const handleEdit = (id: number) => {
    router.push(`/exam/exam/edit/${id}`);
  };

  // Handle Delete
  const handleDelete = (id: number) => {
    setExamToDelete(id); // Set the exam to be deleted
    setShowModal(true); // Show the confirmation modal
  };

  // Handle Confirm Delete
  const confirmDelete = () => {
    if (examToDelete) {
      // Perform the delete request here
      fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/exams/${examToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to delete exam");
          }
          // Remove the deleted exam from the state
          setExams((prevExams) =>
            prevExams.filter((exam) => exam.id !== examToDelete)
          );
          setShowModal(false); // Close the modal after deletion
        })
        .catch((error) => {
          console.error("Error deleting exam:", error);
        });
    }
  };

  const handleButtonClick = () => {
    router.push(`/exam/exam/add`);
  };

  return (
    <div className="lg:ml-[16%] ml-[11%] mt-20">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold mb-6 col-span-full items-center justify-center flex">
          Exam Details
        </h1>

        {/* Button to add a new exam */}
        <div className="mb-2">
          <button
            onClick={handleButtonClick}
            className="bg-[#213458] text-white px-6 py-3 rounded-sm hover:bg-[#1b2d4e] shadow-lg transition-transform transform hover:scale-105 duration-300"
          >
            Add New Exam
          </button>
        </div>
      </div>

      {/* Conditional rendering for loading state */}
      {loading ? (
        <p className="text-lg text-gray-600">Loading exam details...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-[#213458] text-white">
              <tr>
                <th className="w-1/6 text-left py-3 px-4 uppercase font-semibold text-sm">
                  Course Name
                </th>
                <th className="w-1/6 text-left py-3 px-4 uppercase font-semibold text-sm">
                  Classroom
                </th>
                <th className="w-1/6 text-left py-3 px-4 uppercase font-semibold text-sm">
                  Title
                </th>
                <th className="w-1/6 text-left py-3 px-4 uppercase font-semibold text-sm">
                  Date
                </th>
                <th className="w-1/6 text-center py-3 px-4 uppercase font-semibold text-sm">
                  Start Time
                </th>
                <th className="w-1/6 text-center py-3 px-4 uppercase font-semibold text-sm">
                  End Time
                </th>
                <th className="w-1/6 text-center py-3 px-4 uppercase font-semibold text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {exams.map((exam) => (
                <tr
                  key={exam.id}
                  className="bg-gray-50 hover:bg-gray-100 transition-all"
                >
                  <td className="w-1/6 text-left py-3 px-4 font-medium">
                    {getCourseName(exam.course)}
                  </td>
                  <td className="w-1/6 text-left py-3 px-4 font-medium">
                    {getClassroomName(exam.class_instance)}
                  </td>
                  <td className="w-1/6 text-left py-3 px-4 font-medium">
                    {exam.title}
                  </td>
                  <td className="w-1/6 text-left py-3 px-4">{exam.exam_date}</td>
                  <td className="w-1/6 text-center py-3 px-4">
                    {exam.start_time}
                  </td>
                  <td className="w-1/6 text-center py-3 px-4">
                    {exam.end_time}
                  </td>
                  <td className="w-1/6 text-center py-3 px-4">
                    <div className="flex justify-center space-x-2">
                      <button
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => handleEdit(exam.id)}
                      >
                        <Image
                          src="/edit.svg"
                          alt="Edit"
                          width={25}
                          height={25}
                          className="w-[25px] h-[25px]"
                        />
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(exam.id)}
                      >
                        <Image
                          src="/delete.svg"
                          alt="Delete"
                          width={25}
                          height={25}
                          className="w-[25px] h-[25px]"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for delete confirmation */}
      {showModal && (
        <Modal
          onClose={() => setShowModal(false)}
          onConfirm={confirmDelete}
          message="Are you sure you want to delete this exam?"
        />
      )}
    </div>
  );
};

export default Page;
