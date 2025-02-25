"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/Button";
import axios from "axios";
import Dropdown from "@/components/Dropdown";

interface Classroom {
  id: number;
  name: string;
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  admission_date: string;
  class: string;
  dob: string;
  address: string;
  pob: string;
  nationality: string;
  student_passport: string;
  father_name: string;
  father_occupation: string;
  father_phone: string;
  mother_name: string;
  mother_occupation: string;
  mother_phone: string;
  parent_contact: string;
  profile_picture: string;
  belt_level: string;
  phone: string;
  email: string;
  image: File | string;
  branch: number | null;
  classrooms: number[];
  // courses: number[];
  // course_name: string[];
  insurance_number: string;
  insurance_expiry_date: string;
}

const Page = () => {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.editId as string, 10);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [formData, setFormData] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errors, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  useEffect(() => {
    const tokenFromLocalStorage = localStorage.getItem("authToken");
    if (tokenFromLocalStorage) {
      setToken(tokenFromLocalStorage);
    } else {
      router.push("/login"); // Always navigate to login if no token
    }
  }, [router]);

  // Fetch student data when token and id are available
  useEffect(() => {
    const fetchStudent = async () => {
      if (!token) return;

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/students/${id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const studentData = response.data;
        setFormData(studentData);
        if (studentData.image) {
          setImagePreview(studentData.image); // Set initial image preview
        }
        setIsLoading(false);
      } catch (err) {
        setError("Failed to load student data");
        setIsLoading(false);
      }
    };

    fetchStudent();
  }, [id, token]);

  // Fetch classrooms when token is available
  useEffect(() => {
    const fetchClassrooms = async () => {
      if (!token) return;

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/classroom`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setClassrooms(response.data.results || []); // Assuming paginated data
      } catch (err) {
        setError("Failed to fetch classrooms");
      }
    };

    fetchClassrooms();
  }, [token]);

  if (!formData) {
    return <div className="text-center mt-20">Student not found</div>;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({ ...prevFormData!, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // Get the selected file

    if (file) {
      setFormData((prevData) => {
        if (!prevData) return null;
        return {
          ...prevData,
          image: file,
        };
      });

      // Generate a preview URL for the uploaded image
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleBranchChange = (selectedBranchId: number | null) => {
    // Handle the "All" option (null case)
    if (selectedBranchId === null) {
      console.log("All branches selected");
    } else {
      console.log("Selected branch ID:", selectedBranchId);
    }

    // Safely update form data
    setFormData((prevData) => {
      if (!prevData) return null; // Ensure `prevData` exists
      return {
        ...prevData,
        branch: selectedBranchId, // Allow null for "All"
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      Object.keys(formData!).forEach((key) => {
        if (formData![key as keyof Student]) {
          formDataToSend.append(key, (formData as any)[key]);
        }
      });
      const fileInput =
        document.querySelector<HTMLInputElement>("#profile_picture");
      const file = fileInput?.files?.[0];
      if (file) {
        formDataToSend.append("profile_picture", file);
      }

      await axios.put(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/students/${id}/`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      router.push("/student/all-student");
      alert("Student updated successfully");
    } catch (error) {
      console.error("Failed to update student", error);
      alert("Failed to update student");
    }
  };

  const handleClassroomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValues = Array.from(e.target.selectedOptions, (option) =>
      Number(option.value)
    );

    if (selectedValues.length === 0) {
      console.warn("⚠️ At least one classroom must be selected!");
      return;
    }

    console.log("✅ Selected Classrooms:", selectedValues);

    setFormData((prevData:any) => {
      if (!prevData) return { classrooms: selectedValues }; // ✅ Default to an empty object
    
      return {
        ...prevData,
        classrooms: selectedValues,
      };
    });

  return (
    <>
      <div className="lg:ml-[16%] ml-[11%] mt-20">
        <button
          type="button"
          onClick={() => router.back()}
          className=" bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
        >
          Back
        </button>
      </div>
      <div className="lg:ml-[219px] mt-4 flex flex-col">
        {/* <div className="lg:w-[1079px] w-[330px] h-[40px] p-4 bg-white flex items-center rounded-md justify-between">
        <span className="flex flex-row gap-2 text-[12px] lg:text-[16px]">
          Student |{" "}
          <Image src={"/home.svg"} width={15} height={15} alt="public" /> -
          Update Student
        </span>
        <Link href={"/#"} passHref>
          <div className="h-[23px] w-[57px] bg-[#213458] flex items-center justify-center rounded-md">
            <Image src={"/refresh.svg"} width={16} height={16} alt="Refresh" />
          </div>
        </Link>
      </div> */}
        <h1 className="text-center lg:text-2xl text-[16px] font-bold mb-8 mt-4 lg:mt-2 border-b-2">
          Edit Information Student Form
        </h1>
        <form
          className="space-y-8"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
        >
          {/* Student Information */}
          <section>
            <div className="grid lg:grid-cols-3 flex-col gap-8">
              <div className="relative w-full">
                <label
                  htmlFor="name"
                  className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 
                  `}
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name || ""}
                  onChange={handleChange}
                  className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
                />
              </div>
              <div className="relative w-full">
                <label
                  className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 
                  `}
                >
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
                />
              </div>
              <div className="relative w-full">
                <label
                  className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 
                  `}
                >
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="relative w-full">
                <label
                  className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 
                  `}
                >
                  Admission Date
                </label>
                <input
                  type="date"
                  name="admission_date"
                  value={formData.admission_date}
                  onChange={handleChange}
                  className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
                />
              </div>
              <div className="relative w-full">
              <label
                htmlFor="name"
                className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 `
                  }
              >
                Insurance Number
              </label>
              <input
                type="text"
                name="insurance_number"
                placeholder="Input Insuance Numberj"
                value={formData.insurance_number}
                onChange={handleChange}
                className={`peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent  `
                  }
              />
              
            </div>
              <div className="relative w-full">
              
              <label
                htmlFor="name"
                className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500`
                  }
              >
                Insurance exprired date
              </label>
              <input
                type="date"
                name="insurance_expiry_date"
                value={formData.insurance_expiry_date}
                onChange={handleChange}
                className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
              />
            </div>
              <div className="relative w-full">
                <label
                  className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 
                  `}
                >
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
                />
              </div>
              <div className="relative w-full">
                <label
                  className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 
                  `}
                >
                  Nationality
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
                />
              </div>
              <div className="relative w-full">
                <label
                  className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 
                  `}
                >
                  Place of Birth
                </label>
                <input
                  type="text"
                  name="pob"
                  value={formData.pob}
                  onChange={handleChange}
                  className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
                />
              </div>
              <div className="w-full relative">
                <label
                  className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 
                  `}
                >
                  Student Passport
                </label>
                <input
                  type="text"
                  name="student_passport"
                  value={formData.student_passport}
                  onChange={handleChange}
                  className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
                />
              </div>
              <div className="relative w-full">
                <label
                  className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 
                  `}
                >
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
                />
              </div>
              <div className="relative w-full">
                <label
                  className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 
                  `}
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
                />
              </div>
              <div className="relative w-full">
                <label
                  className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 
                  `}
                >
                  Father's Name
                </label>
                <input
                  type="text"
                  name="father_name"
                  value={formData.father_name}
                  onChange={handleChange}
                  className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
                />
              </div>
              <div className="relative w-full">
                <label
                  className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 
                  `}
                >
                  father's Occupation
                </label>
                <input
                  type="text"
                  name="father_occupation"
                  value={formData.father_occupation}
                  onChange={handleChange}
                  className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
                />
              </div>
              <div className="relative w-full">
                <label
                  className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 
                  `}
                >
                  Mother's Name
                </label>
                <input
                  type="text"
                  name="mother_name"
                  value={formData.mother_name}
                  onChange={handleChange}
                  className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
                />
              </div>
              <div className="relative w-full">
                <label
                  className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 
                  `}
                >
                  Mother's Occupation
                </label>
                <input
                  type="text"
                  name="mother_occupation"
                  value={formData.mother_occupation}
                  onChange={handleChange}
                  className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
                />
              </div>
              <div className="w-full relative">
                <label
                  className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 
                  `}
                >
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
                />
              </div>
              <div className="relative w-full">
                <label
                  className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 
                  `}
                >
                  Parent Contact
                </label>
                <input
                  type="text"
                  name="parent_contact"
                  value={formData.parent_contact}
                  onChange={handleChange}
                  className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block font-semibold text-gray-700">
                  Select Classrooms:
                </label>
                <select
                  name="classrooms"
                  multiple
                  className="w-full border rounded p-2"
                  value={
                    formData.classrooms ? formData.classrooms.map(String) : []
                  } // ✅ Ensure `formData.classrooms` is defined
                  onChange={handleClassroomChange}
                >
                  {classrooms && classrooms.length > 0 ? (
                    classrooms.map((classroom) => (
                      <option key={classroom.id} value={String(classroom.id)}>
                        {classroom.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>Loading classrooms...</option>
                  )}
                </select>
              </div>

              <div className="relative w-full">
                <label
                  className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 
                  `}
                >
                  Branch
                </label>
                <Dropdown
                  value={formData.branch ?? undefined} // Use undefined if branch is null
                  onChange={handleBranchChange}
                />
              </div>
              <div className="relative w-full">
                <label
                  className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 
                  `}
                >
                  Image
                </label>
                <input
                  type="file"
                  name="image"
                  onChange={handleFileChange}
                  className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
                />
                <div className="mt-2">
                  {/* Display the image preview */}
                  {imagePreview && (
                    <img
                      src={imagePreview} // Show the current or fetched image
                      alt="Student"
                      className="mt-2 w-40 h-40 object-cover rounded-md border border-gray-300"
                    />
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Form Actions */}
          <div className="flex justify-center items-center space-x-4">
            <Button bg="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button>Submit</Button>
          </div>
        </form>
      </div>
    </>
  );
};
}
export default Page;
