import { Listbox } from "@headlessui/react";
import { useEffect, useState } from "react";
import axios from "axios";

interface Classroom {
  id: number;
  name: string;
}

export default function ClassroomDropdown() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassrooms, setSelectedClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem("authToken"); // Ensure token is retrieved properly

  useEffect(() => {
    if (!token) {
      setError("Unauthorized: No Token Found");
      setLoading(false);
      return;
    }

    const fetchClassrooms = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/classroom/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.status === 200 && Array.isArray(response.data)) {
          console.log("Fetched classrooms:", response.data);
          setClassrooms(response.data);
          setSelectedClassrooms([response.data[0]]); // ✅ Default selection
        } else {
          console.error("Unexpected API response format:", response);
          setError("Invalid response format from server.");
        }
      } catch (err) {
        console.error("Error fetching classrooms:", err);
        setError("Failed to fetch classrooms.");
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, [token]);

  if (loading) return <p>Loading classrooms...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="w-72">
      <Listbox value={selectedClassrooms} onChange={setSelectedClassrooms} multiple>
        <div className="relative mt-1">
          {/* Button */}
          <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-3 px-4 text-left shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            {selectedClassrooms.length > 0
              ? selectedClassrooms.map((classroom) => classroom.name).join(", ")
              : "Select a classroom"}
          </Listbox.Button>

          {/* Dropdown Menu */}
          <Listbox.Options className="absolute mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-gray-300 focus:outline-none">
            {classrooms.map((classroom) => (
              <Listbox.Option
                key={classroom.id}
                value={classroom}
                className={({ active, selected }) =>
                  `cursor-pointer select-none py-2 px-4 flex items-center ${
                    active ? "bg-blue-500 text-white" : "text-gray-900"
                  }`
                }
              >
                {({ selected }) => (
                  <>
                    <input
                      type="checkbox"
                      checked={selected}
                      readOnly
                      className="mr-2"
                    />
                    {classroom.name}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </div>
      </Listbox>
    </div>
  );
}
