"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Button from "@/components/Button";

interface Admin {
  id: number;
  username: string;
}

interface Teacher {
  id: number;
  username: string;
}

interface Program {
  id: number;
  name: string;
}

const UpdateTrialStudent = () => {
  const params = useParams();
  const router = useRouter();
  const trialId = parseInt(params.editId as string, 10);
  const [token, setToken] = useState<string | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<Program[]>([]);
  const [currentProgram, setCurrentProgram] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    client: "",
    phone: "",
    number_student: "",
    assign_by: "",
    handle_by: "",
    program_id: [] as number[], // ✅ FIXED: Properly initialize as an array of numbers
    status: "Pending",
    reason: "",
  });

  useEffect(() => {
    const tokenFromLocalStorage = localStorage.getItem("authToken");
    if (tokenFromLocalStorage) {
      setToken(tokenFromLocalStorage);
    } else {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (token) {
      const fetchData = async () => {
        try {
          console.log("Fetching admins, teachers, programs, and trial student data...");

          const [adminRes, teacherRes, programRes, trialRes] = await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/user?role_name=admin`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/user?role_name=teacher`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/program`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/student_trail/${trialId}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

          setAdmins(adminRes.data.results);
          setTeachers(teacherRes.data.results);
          setPrograms(programRes.data.results);

          const trialData = trialRes.data;
          setFormData({
            client: trialData.client || "",
            phone: trialData.phone || "",
            number_student: trialData.number_student || "",
            assign_by: trialData.admin_id?.toString() || "",
            handle_by: trialData.teacher_id?.[0]?.toString() || "", // ✅ FIXED: Convert to string
            status: trialData.status || "Pending",
            reason: trialData.reason ?? "", // ✅ FIXED: Ensure null is handled
            program_id: trialData.program_id || [], // ✅ FIXED: Ensure program_id is populated
          });

          setSelectedPrograms(
            programRes.data.results.filter((program: Program) =>
              trialData.program_id.includes(program.id)
            )
          );

          setLoading(false);
        } catch (error) {
          console.error("Error fetching data:", error);
          setError("Error loading data.");
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [token, trialId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProgram = () => {
    const program = programs.find((p) => p.id === Number(currentProgram));
    if (program && !selectedPrograms.some((p) => p.id === program.id)) {
      setSelectedPrograms([...selectedPrograms, program]);
      setFormData((prev) => ({
        ...prev,
        program_id: [...prev.program_id, program.id], // ✅ FIXED: Correctly updating program_id
      }));
    }
    setCurrentProgram("");
  };

  const handleRemoveProgram = (id: number) => {
    setSelectedPrograms(selectedPrograms.filter((p) => p.id !== id));
    setFormData((prev) => ({
      ...prev,
      program_id: prev.program_id.filter((programId) => programId !== id), // ✅ FIXED: Remove from formData
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) {
      alert("Authorization token is missing. Please log in.");
      return;
    }

    const updatedData = {
      ...formData,
      status: formData.status.toUpperCase(),
      admin_id: formData.assign_by ? Number(formData.assign_by) : null,
      teacher_id: formData.handle_by ? [Number(formData.handle_by)] : [], // ✅ FIXED: Convert to array
    };

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/student_trail/${trialId}/`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Response:", response);
      if (response.status === 200) {
        alert("Trial student updated successfully!");
        router.push("/student/trial-student/view");
      } else {
        alert("Failed to update trial student.");
      }
    } catch (error: any) {
      console.error("Error updating trial student:", error.response?.data || error.message);
      alert(`Error updating trial student: ${error.response?.data?.message || error.message}`);
    }
  };
  return (
    <div className="lg:ml-[219px] mt-20 ml-[25px] flex flex-col">
      <h1 className="text-center text-2xl font-bold mb-8 mt-4">
        Edit Trial Form
      </h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        <div className="relative w-full">
          <label
            htmlFor=""
            className="absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500"
          >
            Client Name
          </label>
          <input
            type="text"
            className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent "
            name="client"
            value={formData.client}
            onChange={handleChange}
            placeholder="Client Name"
            required
          />
        </div>
        <div className="relative w-full">
          <label
            htmlFor=" 
        "
            className="absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500"
          >
            Phone
          </label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone"
            className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent "
            required
          />
        </div>
        <div className="relative w-full">
          <label
            htmlFor=""
            className="absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500"
          >
            Number_Student
          </label>
          <input
            type="number"
            name="number_student"
            value={formData.number_student}
            onChange={handleChange}
            placeholder="Number of Students"
            className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent "
            required
          />
        </div>
        <div className="relative w-full">
          <label
            htmlFor=""
            className="absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500"
          >
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent "
          >
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div className="relative w-full">
          <label
            htmlFor="reason"
            className="absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500"
          >
            Reason
          </label>
          <input
            type="text"
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
           className="peer w-full px-4 py-2 text-sm text-gray-700  border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
          />
        </div >
        <div className="relative w-full">
          <label
            htmlFor=""
            className="absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500"
          >
            Handle_By
          </label>
          <select
            name="handle_by"
            value={formData.handle_by}
            onChange={handleChange}
            className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent "
          >
            <option value="">Select a teacher</option>
            {teachers.length > 0 ? (
              teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.username}
                </option>
              ))
            ) : (
              <option value="">No teachers available</option>
            )}
          </select>
        </div>
        <div className="relative w-full">
          <label
            htmlFor=""
            className="absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500"
          >
            Assign_By
          </label>
          <select
            name="assign_by"
            value={formData.assign_by}
            onChange={handleChange}
            className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent "
          >
            <option value="">Select an admin</option>
            {admins.length > 0 ? (
              admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.username}
                </option>
              ))
            ) : (
              <option value="">No admins available</option>
            )}
          </select>
        </div>
        <div className="relative w-full">
          <label className="absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500">
            Select a Program
          </label>
          <div className="flex items-center mt-4" >
            <select
              className="w-full h-[40px] p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={currentProgram}
              onChange={(e) => setCurrentProgram(e.target.value)} // Track dropdown selection
            >
              <option value="">Select a Program</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="ml-2 text-white bg-[#213458] hover:bg-[#213498] px-3 py-1 rounded"
              onClick={handleAddProgram} // Add selected student to the table
            >
              Add
            </button>
          </div>

          {/* Display selected students in a table */}
          {selectedPrograms.length > 0 && (
            <table className="mt-16 w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200 ">
                  <th className="border border-gray-300 px-4 py-2">Name</th>
                  <th className="border border-gray-300 px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedPrograms.map((program) => (
                  <tr key={program.id}>
                    <td className="border border-gray-300 px-4 py-2">
                      {program.name}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <button
                        type="button"
                        className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
                        onClick={() => handleRemoveProgram(program.id)} // Remove student from the table
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div  className="lg:col-span-3 flex justify-center items-center space-x-4">
          <Button className="lg:h-[40px] h-[40px] flex justify-center items-center px-6 py-2 bg-[#213458] text-white font-medium rounded hover:bg-blue-500">
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UpdateTrialStudent;
