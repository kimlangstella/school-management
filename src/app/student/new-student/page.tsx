"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Dropdown from "@/components/Dropdown";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { userSchema } from "@/validation/student_validation";
import Button from "@/components/Button";
import { string } from "yup";
interface FormDataType {
  first_name: string;
  last_name: string;
  gender: string;
  dob: string;
  pob: string;
  nationality: string;
  phone: string;
  email: string;
  mother_name: string;
  mother_occupation: string;
  father_name: string;
  father_occupation: string;
  address: string;
  parent_contact: string;
  student_passport: string;
  admission_date: string;
  branch: number | null; // Branch can be a number or null
  image: File | null;
  classrooms: number[];
  // courses: number[];
  // course_name: string[];
  insurance_number: string;
  insurance_expiry_date: string; // Array of classroom identifiers
}

const Page = () => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<FormDataType>>({});
  const [courses, setCourses] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [selectedClassrooms, setSelectedClassrooms] = useState<number[]>([]);
  const [formData, setFormData] = useState<FormDataType>({
    first_name: "",
    last_name: "",
    gender: "",
    dob: "",
    pob: "",
    nationality: "",
    phone: "",
    email: "",
    mother_name: "",
    mother_occupation: "",
    father_name: "",
    father_occupation: "",
    address: "",
    parent_contact: "",
    student_passport: "",
    admission_date: "",
    branch: null, 
    image: null, 
    classrooms: [], 
    insurance_number: "",
    insurance_expiry_date: "",
  });
  
  // const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   const selectedValues = Array.from(e.target.selectedOptions, (option) =>
  //     Number(option.value)
  //   );
  //   console.log("Selected Courses:", selectedValues);
  //   setFormData((prevData) => ({
  //     ...prevData,
  //     courses: selectedValues,
  //   }));
  // };
  useEffect(() => {
    const fetchCoursesAndClassrooms = async () => {
      if (!token) {
        console.warn("No token found, skipping fetch.");
        return;
      }

      try {
        const courseResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/course/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const fetchedCourses = courseResponse.data.results || courseResponse.data;
        if (Array.isArray(fetchedCourses)) {
          setCourses(fetchedCourses);
        } else {
          console.error("Unexpected course data format:", courseResponse.data);
        }
        const classroomResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/classroom/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const fetchedClassrooms = classroomResponse.data.results || classroomResponse.data;
        if (Array.isArray(fetchedClassrooms)) {
          setClassrooms(fetchedClassrooms);
        } else {
          console.error("Unexpected classroom data format:", classroomResponse.data);
        }
      } catch (error) {
        console.error("Error fetching courses/classrooms:", error);
      }
    };

    fetchCoursesAndClassrooms();
  }, [token]);
  useEffect(() => {
    const tokenFromLocalStorage = localStorage.getItem("authToken");
    if (tokenFromLocalStorage) {
      setToken(tokenFromLocalStorage);
    } else {
      router.push("/login");
    }
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, files } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: type === "file" ? (files ? files[0] : null) : value,
    });

    setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
  };

  const handleBranchChange = (selectedBranchId: number | null) => {
    setFormData({
      ...formData,
      branch: selectedBranchId, 
    });
  };  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    // ✅ Ensure classroom names are properly mapped
    const classroomNames = formData.classrooms
      .map((id) => {
        const classroom = classrooms.find((c) => c.id === id);
        return classroom ? classroom.name : null;
      })
      .filter(Boolean); // Remove null values
  
    // ✅ Build submission data
    const submissionData = {
      ...formData,
      branch_id: formData.branch,
      classroom_name: classroomNames, // ✅ Ensure classroom names are included
    };
  
    console.log("🚀 JSON Data to Send:", submissionData); // ✅ Debugging log
  
    try {
      let requestBody = submissionData;
      let headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
  
      // ✅ Handle Image Upload
      if (formData.image) {
        const formDataObject = new FormData();
        Object.entries(submissionData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((item) => formDataObject.append(`${key}[]`, String(item)));
          } else if (value !== null) {
            formDataObject.append(key, String(value));
          }
        });
        formDataObject.append("image", formData.image);
  
        let requestBody = formDataObject;
        headers["Content-Type"] = "multipart/form-data";
      }
  
      // ✅ Send API Request
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/students/`,
        requestBody,
        { headers }
      );
  
      console.log("✅ Form Submitted Successfully:", response.data);
      alert("Student created successfully.");
      router.push("/student/all-student");
    } catch (error) {
      console.error("❌ Error submitting the form:", error);
      alert("Failed to create student.");
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
  
    setFormData((prevData) => ({
      ...prevData,
      classrooms: selectedValues, // ✅ Ensuring correct data format
    }));
  };
  
  useEffect(() => {
    // console.log("Updated formData.classrooms:", formData.classrooms);
  }, [formData.classrooms]);
  
  return (
    <div className="lg:ml-[18%] ml-[11%] mt-20 h-[1040px] flex flex-col">
      <div className="lg:w-full w-[330px] h-[40px] p-4 bg-white flex items-center rounded-md justify-between">
        <span className="flex flex-row gap-2 text-[12px] lg:text-[15px]">
          Student |{" "}
          <Image src="/home.svg" width={15} height={15} alt="public" />{" "}
          New-student
        </span>

        <Link href="/#" passHref>
          <div className="h-[23px] w-[57px] bg-[#213458] flex items-center justify-center rounded-md">
            <Image src="/refresh.svg" width={16} height={16} alt="Refresh" />
          </div>
        </Link>
      </div>

      <h1 className="text-center text-2xl font-bold mb-8 mt-4 border-b-2">
        Admission Form
      </h1>
      <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid lg:grid-cols-3 flex-col gap-8">
            <div className="relative w-full">
              <label
                htmlFor="name"
                className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 ${
                  errors.first_name
                    ? "text-red-500 peer-focus:text-red-500"
                    : ""
                }`}
              >
                First Name
              </label>
              <input
                id="name"
                name="first_name"
                placeholder="Input FirstName"
                value={formData.first_name}
                onChange={handleChange}
                className={`peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent ${
                  errors.first_name ? "border-red-500" : ""
                }`}
              />

              {errors.first_name && (
                <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
              )}
            </div>

            <div className="relative w-full">
              <label
                htmlFor="name"
                className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 ${
                  errors.last_name ? "text-red-500 peer-focus:text-red-500" : ""
                }`}
              >
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                placeholder="Input LastName"
                value={formData.last_name}
                onChange={handleChange}
                className={`peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent  ${
                  errors.last_name ? "border-red-500" : ""
                }`}
              />
              {errors.last_name && (
                <p className="text-red-500 text-sm">{errors.last_name}</p>
              )}
            </div>
            <div className="relative w-full">
              <label
                htmlFor="name"
                className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 ${
                  errors.gender ? "text-red-500 peer-focus:text-red-500" : ""
                }`}
              >
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent 
                  
                "
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="relative w-full">
              <label
                htmlFor="name"
                className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 ${
                  errors.admission_date
                    ? "text-red-500 peer-focus:text-red-500"
                    : ""
                }`}
              >
                Admission Date
              </label>
              <input
                type="date"
                name="admission_date"
                placeholder="Input Admission Date"
                value={formData.admission_date}
                onChange={handleChange}
                className={`peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent  ${
                  errors.admission_date ? "border-red-500" : ""
                }`}
              />
              {errors.admission_date && (
                <p className="text-red-500 text-sm">{errors.admission_date}</p>
              )}
            </div>
            <div className="relative w-full">
              <label
                htmlFor="name"
                className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 ${
                  errors.insurance_number
                    ? "text-red-500 peer-focus:text-red-500"
                    : ""
                }`}
              >
                Insurance Number
              </label>
              <input
                type="text"
                name="insurance_number"
                placeholder="Input Insuance Numberj"
                value={formData.insurance_number}
                onChange={handleChange}
                className={`peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent  ${
                  errors.insurance_number ? "border-red-500" : ""
                }`}
              />
              {errors.insurance_number && (
                <p className="text-red-500 text-sm">
                  {errors.insurance_number}
                </p>
              )}
            </div>
              <div className="relative w-full">
              
              <label
                htmlFor="name"
                className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 ${
                  errors.insurance_expiry_date
                    ? "text-red-500 peer-focus:text-red-500"
                    : ""
                }`}
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
          </div>
          <div className="grid lg:grid-cols-3 flex-col gap-8">
            <div className="relative w-full">
              <label
                htmlFor="name"
                className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 ${
                  errors.dob ? "text-red-500 peer-focus:text-red-500" : ""
                }`}
              >
                Date of Birth
              </label>
              <input
                type="date"
                name="dob"
                placeholder="Input Date of Birth"
                value={formData.dob}
                onChange={handleChange}
                className={`peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent  ${
                  errors.dob ? "border-red-500" : ""
                }`}
              />
              {errors.dob && (
                <p className="text-red-500 text-sm">{errors.dob}</p>
              )}
            </div>
            <div className="relative w-full">
              <label
                htmlFor="name"
                className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 ${
                  errors.dob ? "text-red-500 peer-focus:text-red-500" : ""
                }`}
              >
                Nationality
              </label>
              <input
                type="text"
                name="nationality"
                placeholder="Input Nationality"
                value={formData.nationality}
                onChange={handleChange}
                className={`peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent  ${
                  errors.nationality ? "border-red-500" : ""
                }`}
              />
              {errors.nationality && (
                <p className="text-red-500 text-sm">{errors.nationality}</p>
              )}
            </div>
            
            <div className="relative w-full">
              <label
                htmlFor="name"
                className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 ${
                  errors.pob ? "text-red-500 peer-focus:text-red-500" : ""
                }`}
              >
                Place of Birth
              </label>
              <input
                type="text"
                name="pob"
                placeholder="Input Place Of Birth"
                value={formData.pob}
                onChange={handleChange}
                className={`peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent  ${
                  errors.pob ? "border-red-500" : ""
                }`}
              />
              {errors.pob && (
                <p className="text-red-500 text-sm">{errors.pob}</p>
              )}
            </div>
            <div className="relative w-full">
              <label
                htmlFor="name"
                className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 ${
                  errors.student_passport
                    ? "text-red-500 peer-focus:text-red-500"
                    : ""
                }`}
              >
                Student_passport
              </label>
              <input
                type="text"
                name="student_passport"
                placeholder="Input Student_passport"
                value={formData.student_passport}
                onChange={handleChange}
                className={`peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent  ${
                  errors.student_passport ? "border-red-500" : ""
                }`}
              />
              {errors.student_passport && (
                <p className="text-red-500 text-sm">
                  {errors.student_passport}
                </p>
              )}
            </div>
            <div className="relative w-full">
              <label
                htmlFor="name"
                className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 ${
                  errors.phone ? "text-red-500 peer-focus:text-red-500" : ""
                }`}
              >
                Phone
              </label>
              <input
                type="text"
                name="phone"
                placeholder="Input Phone"
                value={formData.phone}
                onChange={handleChange}
                className={`peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent  ${
                  errors.phone ? "border-red-500" : ""
                }`}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm">{errors.phone}</p>
              )}
            </div>
            <div className="relative w-full">
              <label
                htmlFor="name"
                className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 ${
                  errors.email ? "text-red-500 peer-focus:text-red-500" : ""
                }`}
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="Input Email"
                value={formData.email}
                onChange={handleChange}
                className={`peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent  ${
                  errors.email ? "border-red-500" : ""
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>
          </div>
          <div className="grid lg:grid-cols-3 flex-col gap-8">
            <div className="relative w-full">
              <label
                htmlFor="name"
                className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 ${
                  errors.father_name
                    ? "text-red-500 peer-focus:text-red-500"
                    : ""
                }`}
              >
                Father_Name
              </label>
              <input
                type="text"
                name="father_name"
                placeholder="Input Father Name"
                value={formData.father_name}
                onChange={handleChange}
                className={`peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent  ${
                  errors.father_name ? "border-red-500" : ""
                }`}
              />
              {errors.father_name && (
                <p className="text-red-500 text-sm">{errors.father_name}</p>
              )}
            </div>
            <div className="relative w-full">
              <label
                htmlFor="name"
                className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 ${
                  errors.father_occupation
                    ? "text-red-500 peer-focus:text-red-500"
                    : ""
                }`}
              >
                Father_Occupation
              </label>
              <input
                type="text"
                name="father_occupation"
                placeholder="Input Occupation"
                value={formData.father_occupation}
                onChange={handleChange}
                className={`peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent  ${
                  errors.father_occupation ? "border-red-500" : ""
                }`}
              />
              {errors.father_occupation && (
                <p className="text-red-500 text-sm">
                  {errors.father_occupation}
                </p>
              )}
            </div>
            <div className="relative w-full">
              <label
                htmlFor="name"
                className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 ${
                  errors.mother_name
                    ? "text-red-500 peer-focus:text-red-500"
                    : ""
                }`}
              >
                Mother_Name
              </label>
              <input
                type="text"
                name="mother_name"
                placeholder="Input Mother Name"
                value={formData.mother_name}
                onChange={handleChange}
                className={`peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent  ${
                  errors.mother_name ? "border-red-500" : ""
                }`}
              />
              {errors.mother_name && (
                <p className="text-red-500 text-sm">{errors.mother_name}</p>
              )}
            </div>
            <div className="relative w-full">
              <label
                htmlFor="name"
                className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 ${
                  errors.mother_occupation
                    ? "text-red-500 peer-focus:text-red-500"
                    : ""
                }`}
              >
                Mother_Occupation
              </label>
              <input
                type="text"
                name="mother_occupation"
                placeholder="Input Occupation"
                value={formData.mother_occupation}
                onChange={handleChange}
                className={`peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent  ${
                  errors.mother_occupation ? "border-red-500" : ""
                }`}
              />
              {errors.mother_occupation && (
                <p className="text-red-500 text-sm">
                  {errors.mother_occupation}
                </p>
              )}
            </div>
            <div className="relative w-full">
              <label
                htmlFor="name"
                className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 ${
                  errors.address ? "text-red-500 peer-focus:text-red-500" : ""
                }`}
              >
                Address
              </label>
              <input
                type="text"
                name="address"
                placeholder="Input Address"
                value={formData.address}
                onChange={handleChange}
                className={`peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent  ${
                  errors.address ? "border-red-500" : ""
                }`}
              />
              {errors.address && (
                <p className="text-red-500 text-sm">{errors.address}</p>
              )}
            </div>
            <div className="relative w-full">
              <label
                htmlFor="name"
                className={`absolute left-4 top 1/2 transform -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-blue-500 ${
                  errors.pob ? "text-red-500 peer-focus:text-red-500" : ""
                }`}
              >
                Parent_Contact
              </label>
              <input
                type="text"
                name="parent_contact"
                placeholder="Input Parent_Contact"
                value={formData.parent_contact}
                onChange={handleChange}
                className={`peer w-full px-4 py-2 text-sm text-gray-700 bg-white border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent  ${
                  errors.parent_contact ? "border-red-500" : ""
                }`}
              />
              {errors.parent_contact && (
                <p className="text-red-500 text-sm">{errors.parent_contact}</p>
              )}
            </div>
            {/* <div className="mb-4">
            <label className="block font-semibold text-gray-700">Select Courses:</label>
            <select
              name="courses"
              multiple
              className="w-full border rounded p-2"
              value={formData.courses.map(String)}
              onChange={handleCourseChange}
            >
              {courses.length > 0 ? (
                courses.map((course) => (
                  <option key={course.id} value={String(course.id)}>
                    {course.name}
                  </option>
                ))
              ) : (
                <option disabled>⚠️ Failed to load courses</option>
              )}
            </select>
          </div> */}
          {/* Classroom Selection Dropdown */}
          <div className="mb-4">
            <label className="block font-semibold text-gray-700">Select Classrooms:</label>
            <select
              name="classrooms"
              multiple
              className="w-full border rounded p-2"
              value={formData.classrooms.map(String)} // ✅ Convert to string[]
              onChange={handleClassroomChange}
            >
              {classrooms.length > 0 ? (
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
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Branch
              </label>
              <Dropdown
                value={formData.branch ?? undefined} // Use undefined if branch is null
                onChange={handleBranchChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Image
              </label>
              <input
                type="file"
                name="image"
                onChange={handleChange}
                className="mt-1 block lg:w-[272px] w-[329px] h-[40px] rounded-md outline-none border-gray-300 shadow-sm bg-white text-black"
              />
            </div>
          </div>
        <div className="flex justify-center items-center space-x-4">
          <Button
            bg="secondary"
            onClick={() => router.push("/student/all-student")}
          >
            Cancel
          </Button>
          <Button>Submit</Button>
        </div>
      </form>
    </div>
  );
};
export default Page;