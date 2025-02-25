"use client";
import axios from "axios";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface TeacherProfile {
  id: number;
  user: {
    username: string;
    email: string;
  };
  job: string;
  specialization: string;
}

interface Specialization {
  id: number;
  name: string;
}

const Page = () => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [profiles, setProfiles] = useState<TeacherProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const tokenFromLocalStorage = localStorage.getItem("authToken");
    if (tokenFromLocalStorage) {
      setToken(tokenFromLocalStorage);
    } else {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      if (token) {
        try {
          setLoading(true);

          const profilesResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/user`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const fetchedProfiles = profilesResponse.data.results
            .filter((user: any) => user.roles_name === "teacher")
            .map((teacher: any) => ({
              id: teacher.id,
              user: {
                username: teacher.username,
                email: teacher.email,
              },
              job: "Teacher",
              specialization: teacher.specialization || "General",
            }));
          setProfiles(fetchedProfiles);

          const specializationsResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/program/`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setSpecializations(specializationsResponse.data.results || []);
        } catch (error: any) {
          console.error("Error fetching data:", error);
          setError("An error occurred while fetching data.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [token]);

  const handleViewClick = (id: number) => {
    router.push(`/teacher/all-teacher/view/${id}`);
  };

  const handleEditClick = (id: number) => {
    router.push(`/teacher/all-teacher/edit/${id}`);
  };

  const handleDeleteClick = async (id: number) => {
    if (!token) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/user/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Remove the deleted profile from the state
      setProfiles(profiles.filter((profile) => profile.id !== id));
    } catch (error) {
      console.error("Error deleting teacher:", error);
    }
  };

  const handleSpecializationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSpecialization(event.target.value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const filteredProfiles = profiles.filter((profile) =>
    profile.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const finalProfiles = selectedSpecialization
    ? filteredProfiles.filter((profile) => profile.specialization === selectedSpecialization)
    : filteredProfiles;

  return (
    <div className="lg:ml-[16%] ml-[45px] mt-20 flex flex-col">
      <div className="lg:w-full w-[330px] h-[42px] p-4 bg-white rounded-md flex items-center justify-center">
        <span className="flex flex-row lg:gap-3 gap-2 text-[12px] lg:text-[26px] lg: font-semibold">
           All teachers
        </span>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div className="relative mt-2 flex flex-row justify-between">
        <select
          id="specialization"
          name="specialization"
          value={selectedSpecialization || ""}
          onChange={handleSpecializationChange}
          className="peer w-[325px] px-4 py-2 text-sm text-gray-700  border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
        >
          <option value="">Select a specialization</option>
          {specializations.map((spec) => (
            <option key={spec.id} value={spec.name}>
              {spec.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search by username or email"
          value={searchQuery}
          onChange={handleSearchChange}
          className="mt-1 block lg:w-[297px] text-[15px] p-2 w-[329px] h-[40px] rounded-md outline-none border-gray-300 shadow-sm"
        />
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="mt-5">
          <table className="min-w-full bg-white border border-gray-200 rounded-md shadow-md">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-gray-600 border-b">Name</th>
                <th className="px-4 py-2 text-left text-gray-600 border-b">Email</th>
                <th className="px-4 py-2 text-left text-gray-600 border-b">Job</th>
                <th className="px-4 py-2 text-left text-gray-600 border-b">Specialization</th>
              </tr>
            </thead>
            <tbody>
              {finalProfiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-gray-100">
                  <td className="px-4 py-2 border-b">{profile.user.username}</td>
                  <td className="px-4 py-2 border-b">{profile.user.email}</td>
                  <td className="px-4 py-2 border-b">{profile.job}</td>
                  <td className="px-4 py-2 border-b">{profile.specialization}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Page;
