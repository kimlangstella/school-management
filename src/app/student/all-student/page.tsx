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
  const [statusFilter, setStatusFilter] = useState<"Active" | "Inactive">(
    "Active"
  );
  const [page, setPage] = useState<number>(1); // ✅ Track current page
  const [totalPages, setTotalPages] = useState<number>(1); // ✅ Track total pages
  const [token, setToken] = useState<string | null>(null);
  const [selectedProfiles, setSelectedProfiles] = useState<number[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([
    "nationality",
    "branch",
    "dob",
    "program",
  ]);
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
      fetchProfiles(1); // ✅ Reset to first page when status filter changes
    }
  }, [token, statusFilter]);

  /** ✅ Filter students based on search query */
  const filteredProfiles = profiles.filter((profile) => {
    const matchesBranch = selectedBranch
      ? profile.branch_id === selectedBranch
      : true;
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
  const toggleColumn = (column: string) => {
    setHiddenColumns((prev) =>
      prev.includes(column)
        ? prev.filter((col) => col !== column)
        : [...prev, column]
    );
  };
  return (
    <div className="lg:ml-[16%] ml-[11%] mt-20 flex flex-col">
      <div className="bg-white p-4 rounded-md shadow-sm flex justify-between items-center">
        <span className="text-lg font-semibold">Student List</span>
        <div className="flex mr-[56px] space-x-2">
          <Button
            className="bg-[#213458] text-white font-semibold py-2 px-2 rounded-lg shadow-md hover:bg-[#172B4D] transition-all duration-300"
            onClick={() => router.push(`/student/new-student`)}
          >
            New Student
          </Button>
          <Button
            className="bg-[#213458] text-white font-semibold py-2 px-2 rounded-lg shadow-md hover:bg-[#172B4D] transition-all duration-300"
            onClick={() => router.push(`/student/trial-student`)}
          >
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
      <div className="w-full lg:w-[300px] mt-4 flex flex-row gap-[500px] ">
        <div>
          <Dropdown
            onChange={(branchId: number | null) => setSelectedBranch(branchId)}
          ></Dropdown>
        </div>
        <div className=" mt-1 space-x-4">
          <input
            type="text"
            className="border p-2 rounded-md w-[256px]"
            placeholder="Search student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      {/* ✅ Show action buttons ABOVE the table only when at least one row is selected */}
      {selectedProfiles.length > 0 && (
        <div className="mt-4 flex space-x-4 bg-gray-100 p-4 rounded-lg shadow">
          <button
            onClick={() => handleView(selectedProfiles[0])}
            className="hover:scale-110 transition-transform transform pl-2 pr-2 rounded-full bg-gray-200 hover:bg-gray-300"
          >
            <EyeIcon className="w-5 h-5 text-blue-600" />
          </button>
          <button
            onClick={() => handleEdit(selectedProfiles[0])}
            className="hover:scale-110 transition-transform transform pl-2 pr-2 rounded-full bg-gray-200 hover:bg-gray-300"
          >
            <PencilSquareIcon className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      )}

      <div className="overflow-x-auto mt-6 h-[500px] p-4">
        <div className="flex flex-row gap-8 mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={!hiddenColumns.includes("nationality")}
              onChange={() => toggleColumn("nationality")}
            />
            <span>Show nationality</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={!hiddenColumns.includes("branch")}
              onChange={() => toggleColumn("branch")}
            />
            <span>Show Branch</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={!hiddenColumns.includes("program")}
              onChange={() => toggleColumn("program")}
            />
            <span>Show Program</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={!hiddenColumns.includes("dob")}
              onChange={() => toggleColumn("dob")}
            />
            <span>Date of Birth</span>
          </label>
        </div>
        <table className="border w-[1150px] bg-white rounded-lg shadow-md">
          <thead>
            <tr className="text-center  font-normal text-sm  text-black">
              <th className="pl-2 pr-2 border-2">
                <input type="checkbox" disabled />
              </th>
              <th className="pl-2 pr-2 border-2 w-[125px]">ID</th>
              <th className="pl-2 pr-2 border-2 w-[175px]">Insurance Number</th>
              <th className="p-3 border-2 w-[235px]">Name</th>
              <th className="pl-2 pr-2 border-2">Gender</th>
              {/* <th className="pl-2 pr-2 border-2">Nationality</th> */}
              {/* <th className="pl-2 pr-2 border-2 w-[185px]">Dath of Birth</th> */}
              {!hiddenColumns.includes("dob") && (
                <th className="pl-2 pr-2 border-2">Date Of Birth</th>
              )}
              {!hiddenColumns.includes("nationality") && (
                <th className="pl-2 pr-2 border-2">Nationality</th>
              )}
              {!hiddenColumns.includes("branch") && (
                <th className="pl-2 pr-2 border-2">Branch</th>
              )}
              {!hiddenColumns.includes("program") && (
                <th className="pl-2 pr-2 border-2">Program</th>
              )}
              {/* <th className="pl-2 pr-2 border-2">Program</th> */}
              {/* <th className="pl-2 pr-2 border-2">Age</th> */}
              <th className="pl-2 pr-2 border-2 w-[185px]">Admission Date</th>
              <th className="pl-2 pr-2 border-2 w-[155px]">Parent Contact</th>
              {/* <th className="pl-2 pr-2 border-2">Belt_Level</th> */}
              <th className="pl-2 pr-2 border-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center p-4">
                  Loading...
                </td>
              </tr>
            ) : filteredProfiles.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-4">
                  No students found.
                </td>
              </tr>
            ) : (
              filteredProfiles.map((profile) => (
                <tr key={profile.id} className="border-t text-center">
                  <td className="pl-2 pr-2 border-2">
                    <input
                      type="checkbox"
                      checked={isSelected(profile.id)}
                      onChange={() => toggleSelection(profile.id)}
                    />
                  </td>
                  <td className="pl-2 pr-2 border-2 w-[125px]">{profile.id}</td>
                  <td className="pl-2 pr-2 border-2">
                    {profile.insurance_number}
                  </td>
                  <td className="p-3 flex items-center space-x-3">
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
                  <td className="pl-2 pr-2 border-2">{profile.gender}</td>
                  {/* <td className="pl-2 pr-2 border-2">{profile.nationality}</td>  */}
                  {!hiddenColumns.includes("dob") && (
                    <td className="pl-2 pr-2 border-2">{profile.dob}</td>
                  )}
                  {!hiddenColumns.includes("nationality") && (
                    <td className="pl-2 pr-2 border-2">
                      {profile.nationality}
                    </td>
                  )}
                  {/* <td className="pl-2 pr-2 border-2">{profile.dob}</td>  */}
                  {/* <td className="pl-2 pr-2 border-2">{profile.branch_name}</td>  */}
                  {!hiddenColumns.includes("branch") && (
                    <td className="pl-2 pr-2 border-2">
                      {profile.branch_name}
                    </td>
                  )}
                  {!hiddenColumns.includes("program") && (
                    <td className="pl-2 pr-2 border-2  ">
<div className="flex w-[385px] justify-center items-center flex-row gap-4">
  {Array.isArray(profile.classroom_name) ? (
    profile.classroom_name.map((name: string, index: number) => (
      <span key={index} className="py-1">{name}</span> // ✅ Each name on a new row
    ))
  ) : (
    <span>{profile.classroom_name}</span>
  )}
</div>

                    </td>
                  )}

                  <td className="pl-2 pr-2 border-2">
                    {profile.admission_date}
                  </td>
                  <td className="pl-2 pr-2 border-2">
                    {profile.parent_contact}
                  </td>
                  {/* <td className="pl-2 pr-2 border-2 text-black">{profile.belt_level}</td> */}
                  <td className="pl-2 pr-2 border-2">
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
        <Button
          onClick={() => fetchProfiles(page + 1)}
          disabled={page >= totalPages}
        >
          Show More
        </Button>
      </div>
    </div>
  );
};

export default Page;
