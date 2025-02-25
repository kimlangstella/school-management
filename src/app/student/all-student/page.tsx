"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Button from "@/components/Button";
import Image from "next/image";
import { PencilSquareIcon, EyeIcon } from "@heroicons/react/24/solid";
import Dropdown from "@/components/Dropdown";

const Page = () => {
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"Active" | "Inactive">("Active");
  const [page, setPage] = useState<number>(1); // ✅ Track current page
  const [totalPages, setTotalPages] = useState<number>(1); // ✅ Track total pages
  const [token, setToken] = useState<string | null>(null);
  const [selectedProfiles, setSelectedProfiles] = useState<number[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  useEffect(() => {
    const tokenFromLocalStorage = localStorage.getItem("authToken");
    if (tokenFromLocalStorage) {
      setToken(tokenFromLocalStorage);
    } else {
      router.push("/login");
    }
  }, [router]);

  const fetchProfiles = async (pageNumber = 1) => {
    if (!token) return;
    setLoading(true);

    try {
      const response = await axios.get(
        pageNumber === 1
          ? `https://api.adskh.com/api/academics/students/?status=${statusFilter}`
          : `https://api.adskh.com/api/academics/students/?status=${statusFilter}&p=${pageNumber}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.results && Array.isArray(response.data.results)) {
        setProfiles(response.data.results);
        setPage(pageNumber); // ✅ Update page number
        setTotalPages(response.data.total_pages || pageNumber + 1); // ✅ Track total pages (Assumed API provides this)
      } else {
        setProfiles([]);
      }
    } catch (err) {
      console.error("❌ API Error:", err);
      alert("Failed to load students. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfiles(1);// ✅ Reset to first page when status filter changes
    }
  }, [token, statusFilter]);

  /** ✅ Filter students based on search query */
  const filteredProfiles = profiles.filter((profile) =>{
    const matchesBranch = selectedBranch ? profile.branch_id === selectedBranch : true;
    const matchesSearch =
      profile.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.last_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBranch && matchesSearch;
});

  /** ✅ Handle student selection */
  const toggleSelection = (id: number) => {
    setSelectedProfiles((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const isSelected = (id: number) => selectedProfiles.includes(id);

  const getStatusBadge = (status: string) => {
    return status === "Active" ? (
      <span className="px-3 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">
        Active
      </span>
    ) : (
      <span className="px-3 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full">
        Inactive
      </span>
    );
  };
  const handleEdit = (id: number) => {
    router.push(`/student/all-student/edit/${id}`);
  };
  const handleView = (id: number) => {
    router.push(`/student/all-student/view/${id}`);
  };
  /** ✅ Handle delete */
  // const handleDelete = async (id: number) => {
  //   if (!token) {
  //     alert("Unauthorized! Please log in again.");
  //     return;
  //   }
  
  //   const confirmDelete = window.confirm("Are you sure you want to delete this student?");
  //   if (!confirmDelete) return;
  
  //   try {
  //     const response = await axios.delete(
  //       `${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/students/${id}`,
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       }
  //     );
  
  //     if (response.status === 204 || response.status === 200) {
  //       // ✅ Successfully deleted, remove from state
  //       setProfiles((prevProfiles) => prevProfiles.filter((profile) => profile.id !== id));
  //       alert("Student deleted successfully!");
  //     } else {
  //       alert("Failed to delete student. Please try again.");
  //     }
  //   } catch (error: any) {
  //     console.error("❌ Error deleting student:", error);
  //     alert(`Failed to delete student: ${error.response?.data?.message || error.message}`);
  //   }
  // };
  return (
<div className="lg:ml-[16%] ml-[11%] mt-20 flex flex-col">
      <div className="bg-white p-4 rounded-md shadow-sm flex justify-between items-center">
        <span className="text-lg font-semibold">Student List</span>
        <div className="flex space-x-2">
          <Button className="bg-[#213458] text-white font-semibold py-2 px-2 rounded-lg shadow-md hover:bg-[#172B4D] transition-all duration-300" onClick={() => router.push(`/student/new-student`)}>
            New Student
          </Button>
          <Button className="bg-[#213458] text-white font-semibold py-2 px-2 rounded-lg shadow-md hover:bg-[#172B4D] transition-all duration-300" onClick={() => router.push(`/student/trial-student`)}>
            New Trial
          </Button>
          <Button
            className="bg-[#213458] text-white font-semibold py-2 px-2 rounded-lg shadow-md hover:bg-[#172B4D] transition-all duration-300"
            onClick={() =>
              setStatusFilter(statusFilter === "Active" ? "Inactive" : "Active")
            }
          >
            {statusFilter === "Active" ? " Inactive" : " Active"}
          </Button>
        </div>
      </div>
      <div className="w-full lg:w-[300px] mt-4">
              <Dropdown  onChange={(branchId: number | null) => setSelectedBranch(branchId)}></Dropdown>
      </div>
      {/* ✅ Show action buttons ABOVE the table only when at least one row is selected */}
      {selectedProfiles.length > 0 && (
        <div className="mt-4 flex space-x-4 bg-gray-100 p-4 rounded-lg shadow">
          <button
            onClick={() => handleView(selectedProfiles[0])}
            className="hover:scale-110 transition-transform transform p-2 rounded-full bg-gray-200 hover:bg-gray-300"
          >
            <EyeIcon className="w-5 h-5 text-blue-600" />
          </button>
          <button
            onClick={() => handleEdit(selectedProfiles[0])}
            className="hover:scale-110 transition-transform transform p-2 rounded-full bg-gray-200 hover:bg-gray-300"
          >
            <PencilSquareIcon className="w-5 h-5 text-gray-700" />
          </button>
          {/* <button
            onClick={() => handleDelete(selectedProfiles[0])}
            className="hover:scale-110 transition-transform transform p-2 rounded-full bg-red-100 hover:bg-red-200"
          >
            <TrashIcon className="w-5 h-5 text-red-600" />
          </button> */}
        </div>
      )}

      {/* ✅ Search Box */}
      <div className="flex items-center mt-4 space-x-4">
        <input
          type="text"
          className="border p-2 rounded-md w-64"
          placeholder="Search student by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto mt-6 h-[500px] p-4">
        <table className="border w-[1050px] bg-white rounded-lg shadow-md">
          <thead>
            <tr className="text-center font-normal text-black">
              <th className="p-2 border-2">
                <input type="checkbox" disabled />
              </th>
              <th className="p-2 border-2">ID</th>
              <th className="p-2 border-2">Insurance Number</th>
              <th className="p-2 border-2">Name</th>
              {/* <th className="p-2 border-2">Age</th> */}
              {/* <th className="p-2 border-2">Admission Date</th> */}
              <th className="p-2 border-2">Parent Contact</th>
              {/* <th className="p-2 border-2">Belt_Level</th> */}
              <th className="p-2 border-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center p-4">
                  Loading...
                </td>
              </tr>
            ) :filteredProfiles.length === 0 ?(
              <tr>
                <td colSpan={8} className="text-center p-4">
                  No students found.
                </td>
              </tr>
            ) : (
              filteredProfiles.map((profile) => (
                <tr key={profile.id} className="border-t text-center">
                  <td className="p-2 border-2">
                    <input
                      type="checkbox"
                      checked={isSelected(profile.id)}
                      onChange={() => toggleSelection(profile.id)}
                    />
                  </td>
                  <td className="p-2 border-2">{profile.id}</td>
                  <td className="p-2 border-2">{profile.insurance_number}</td>
                  <td className="p-2 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex justify-center items-center overflow-hidden border border-gray-300">
                      <Image
                        src={profile.image ? profile.image : "/default.png"} // Ensure this is a valid image URL
                        alt={`${profile.first_name} ${profile.last_name}`}
                        width={40} // Ensure proper width
                        height={40} // Ensure proper height
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <span className="text-black">
                      {profile.first_name} {profile.last_name}
                    </span>
                  </td>
                  {/* <td className="p-2 border-2 text-black">
  {profile.age ? profile.age : "N/A"}
</td> */}

                  {/* <td className="p-2 border-2 text-black">{profile.age}</td> */}
                  {/* <td className="p-2 border-2">{profile.admission_date}</td> */}
                  <td className="p-2 border-2">{profile.parent_contact}</td>
                  {/* <td className="p-2 border-2 text-black">{profile.belt_level}</td> */}
                  <td className="p-2 border-2">
                    {getStatusBadge(profile.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between mt-6">
        <Button onClick={() => fetchProfiles(page - 1)} disabled={page === 1}>
          Back Page
        </Button>
        <Button onClick={() => fetchProfiles(page + 1)} disabled={page >= totalPages}>
          Show More
        </Button>
      </div>
    </div>
  );
};

export default Page;
