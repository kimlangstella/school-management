"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Dropdown from "@/components/Dropdown";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { userSchema } from "@/validation/student_validation";
import Button from "@/components/Button";
import { string } from "yup";
interface FormDataType {
  id: any;
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
  const params = useParams();
  const id = parseInt(params.editId as string, 10);
  const [token, setToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<FormDataType>>({});
  const [courses, setCourses] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [selectedClassrooms, setSelectedClassrooms] = useState<number[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormDataType>({
    id: "", // ✅ Ensure `id` is included
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id || !token) return;
  
    const fetchStudent = async () => {
      try {
        console.log("Fetching student data...");
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/students/${id}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("API Response Data:", response.data);
        setFormData(response.data);
      } catch (err) {
        console.error("Failed to load student data:", err);
        // setErrors("Failed to load student data");
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchStudent();
  }, [id, token]);
  if (isLoading) {
    return <div className="text-center mt-20">Loading student data...</div>;
  }
  
  if (!formData) {
    return <div className="text-center mt-20 text-red-500">Student not found</div>;
  }
  
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
  
    // ✅ Ensure classroom names are mapped correctly
    const classroomNames = (formData?.classrooms ?? []).map((id) => {
      const classroom = classrooms.find((c) => c.id === id);
      return classroom ? classroom.name : null;
    });
  
    // ✅ Prepare the data to send
    const submissionData = {
      ...formData,
      branch_id: formData.branch,
      classroom_name: classroomNames, // ✅ Include classroom names
    };
  
    console.log("🚀 JSON Data to Send:", submissionData); // ✅ Debugging log
  
    try {
      let requestBody: any = submissionData;
      let headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
  
      // ✅ Handle Image Upload for Multipart Request
      if (formData.image && formData.image instanceof File) {
        const formDataObject = new FormData();
  
        Object.entries(submissionData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((item) => formDataObject.append(`${key}[]`, String(item)));
          } else if (value !== null) {
            formDataObject.append(key, String(value));
          }
        });
  
        formDataObject.append("image", formData.image);
        requestBody = formDataObject;
        headers["Content-Type"] = "multipart/form-data";
      }
  
      // ✅ Send PUT request to update student data
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/students/${formData.id}/`,
        requestBody,
        { headers }
      );
  
      console.log("✅ Student Updated Successfully:", response.data);
      alert("Student updated successfully.");
      router.push("/student/all-student");
  
    } catch (error) {
      console.error("❌ Error updating student data:", error);
      alert("Failed to update student.");
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
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // Get the selected file

    if (file) {
      setFormData((prevData:any) => {
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

  // useEffect(() => {
  //   // console.log("Updated formData.classrooms:", formData.classrooms);
  // }, [classrooms]);
  
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
        Update Stundet Form
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
    value={(formData?.classrooms ?? []).map(String)} // ✅ Ensures classrooms is always an array
    onChange={handleClassroomChange}
  >
    {classrooms?.length > 0 ? (
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