"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import { useRouter } from "next/navigation";

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  // age: number;
  gender: string;
  admissionDate: string;
  // belt_level: string; 
  dob: string;
  address: string;
  pob: string; // Place of birth
  nationality: string;
  studentPassport: string;
  fatherName: string;
  fatherOccupation: string;
  fatherPhone?: string; 
  motherName: string;
  motherOccupation: string;
  motherPhone?: string; 
  parentContact: string;
  profilePicture?: string;
  classroom?: string; 
  insurance_number: string;
    insurance_expiry_date:string
}

const Page = () => {
  const router = useRouter();
  const { viewId } = useParams(); // Get the student ID from the URL
  const [student, setStudent] = useState<Student | null>(null); // Initialize as null
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<string>('');
  useEffect(() => {
    const tokenFromLocalStorage = localStorage.getItem("authToken");
    if (tokenFromLocalStorage) {
      setToken(tokenFromLocalStorage);
    } else {
      // Redirect to login if no token
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const fetchStudentAndClassroom = async () => {
      if (!token) return; // Ensure token is available before making API request

      try {
        // Fetch student data
        const studentResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/students/${viewId}`, 
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        const studentData = studentResponse.data;
        setIsActive(studentResponse.data.status)
        // Assuming the student data has a classroom ID, fetch classroom data
        const classroomId = studentData.classroom_id; // Make sure this field exists in the student data

        let classroomName = '';

        if (classroomId) {
          // Fetch classroom data using classroom ID
          const classroomResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/classroom/${classroomId}`, 
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          classroomName = classroomResponse.data.name; // Assuming the classroom has a 'name' field
        }

        const mappedStudent: Student = {
          id: studentData.id,
          first_name: studentData.first_name,
          last_name: studentData.last_name,
          // age: studentData.age,
          gender: studentData.gender,
          admissionDate: studentData.admission_date,
          // belt_level: studentData.belt_level || '', 
          dob: studentData.dob,
          address: studentData.address,
          pob: studentData.pob, // Place of birth
          nationality: studentData.nationality,
          studentPassport: studentData.student_passport,
          fatherName: studentData.father_name,
          fatherOccupation: studentData.father_occupation,
          fatherPhone: studentData.father_phone || '', // Optional field
          motherName: studentData.mother_name,
          motherOccupation: studentData.mother_occupation,
          motherPhone: studentData.mother_phone || '', // Optional field
          parentContact: studentData.parent_contact,
          profilePicture: studentData.image || '/default-photo.jpg', // Fallback if no profile picture
          classroom: classroomName, // Assign the classroom name if available
          insurance_number: studentData.insurance_number,
          insurance_expiry_date: studentData.insurance_expiry_date
        };

        setStudent(mappedStudent);
        setIsLoading(false);
      } catch (error: any) {
        setError("Failed to load student or classroom data");
        setIsLoading(false);
      }
    };

    fetchStudentAndClassroom();
  }, [viewId, token]);
  const studentActive = async (status: string): Promise<void> => {
    console.log(isActive)
    try {
      const endpoint = `${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/students/${viewId}/status/`;
      console.log(endpoint);
  
      // Set status as "Activate" or "Inactivate" based on the string passed
      const response = await axios.patch(
        endpoint,
        { status: status === 'Active' ? 'Active' : 'Inactive' }, // Map "Activate" or "Inactivate" to "Active" or "Inactive"
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      console.log('Student status updated:', response.data);
      console.log(status);  // This will log "Activate" or "Inactivate"
      setIsActive(status ); // Set status to 'Active' or 'Inactive'
      console.log(isActive)

    } catch (error) {
      console.error('Error updating student status:', error);
    }
  };
  if (isLoading) {
    return <div className="text-center mt-20">Loading...</div>;
  }

  if (error) {
    return <div className="text-center mt-20">{error}</div>;
  }

  if (!student) {
    return <div className="text-center mt-20">Student not found</div>;
  }

  return (
    <>
    <div className='lg:ml-[16%] ml-[11%] mt-20'>
            <button
            type="button"
            onClick={() => router.back()}
            className=" bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
          >
            Back
          </button>
      </div>

    <div className="lg:ml-[219px] mt-4 flex flex-col">
      <div className="bg-white p-6 rounded-lg lg:gap-12 gap-4 flex lg:flex-row flex-col shadow-lg w-[345px] lg:w-[854px] max-w-2xl mx-auto">
        <div className="flex lg:items-start items-center flex-col mb-4 ml-4">
          <Image
            src={student.profilePicture || '/default-photo.jpg'}
            alt={`${student.first_name} ${student.last_name}`}
            width={192}
            height={192}
            className="lg:w-48 lg:h-48 w-16 h-16 mr-4 object-cover"
          />
          <h3 className="mt-1 lg:ml-11 lg:font-bold mr-4 text-[12px] lg:text-[16px]">
            {student.last_name} {student.first_name}
          </h3>
          <button
              onClick={() => studentActive(isActive === 'Active' ? 'Inactive' : 'Active')} // Toggle between 'Activate' and 'Inactivate'
              className={`px-4 py-2 text-white rounded ${
                isActive === 'Active' ? 'bg-red-500' : 'bg-green-500'
              }`}
            >
              {isActive === 'Active' ? 'Deactivate Student' : 'Activate Student'}
          </button>
        </div>
        <div className="text-left">
          <h2 className="font-bold inline-block border-b-2 ml-28 lg:ml-0">About Me</h2>

          <p className="p-2 text-[12px] lg:text-[16px]"><strong>First Name:</strong> {student.first_name}</p>
          <p className="p-2 text-[12px] lg:text-[16px]"><strong>Last Name:</strong> {student.last_name}</p>
          {/* <p className="p-2 text-[12px] lg:text-[16px]"><strong>Age:</strong> {student.age}</p> */}
          <p className="p-2 text-[12px] lg:text-[16px]"><strong>Gender:</strong> {student.gender}</p>
          <p className="p-2 text-[12px] lg:text-[16px]"><strong>Admission Date:</strong> {student.admissionDate}</p>
          <p className="p-2 text-[12px] lg:text-[16px]"><strong>Insurance_number:</strong> {student.insurance_number}</p>
          <p className="p-2 text-[12px] lg:text-[16px]"><strong>Classroom:</strong> {student.classroom}</p>
          <p className="p-2 text-[12px] lg:text-[16px]"><strong>Insurance_expiry_date:</strong> {student.insurance_expiry_date}</p>
          
          {/* {student.belt_level && (
            <p className="p-2 text-[12px] lg:text-[16px]"><strong>Belt Level:</strong> {student.belt_level}</p>
          )} */}

          <p className="p-2 text-[12px] lg:text-[16px]"><strong>Date of Birth:</strong> {student.dob}</p>
          <p className="p-2 text-[12px] lg:text-[16px]"><strong>Address:</strong> {student.address}</p>
          <p className="p-2 text-[12px] lg:text-[16px]"><strong>Place of Birth:</strong> {student.pob}</p>
          <p className="p-2 text-[12px] lg:text-[16px]"><strong>Nationality:</strong> {student.nationality}</p>
          <p className="p-2 text-[12px] lg:text-[16px]"><strong>Student Passport:</strong> {student.studentPassport}</p>

          {/* Classroom information */}
          {student.classroom && (
            <p className="p-2 text-[12px] lg:text-[16px]"><strong>Classroom:</strong> {student.classroom}</p>
          )}

          <p className="p-2 text-[12px] lg:text-[16px]"><strong>Father's Name:</strong> {student.fatherName}</p>
          <p className="p-2 text-[12px] lg:text-[16px]"><strong>Father's Occupation:</strong> {student.fatherOccupation}</p>

          {student.fatherPhone && (
            <p className="p-2 text-[12px] lg:text-[16px]"><strong>Father's Phone:</strong> {student.fatherPhone}</p>
          )}

          <p className="p-2 text-[12px] lg:text-[16px]"><strong>Mother's Name:</strong> {student.motherName}</p>
          <p className="p-2 text-[12px] lg:text-[16px]"><strong>Mother's Occupation:</strong> {student.motherOccupation}</p>

          {student.motherPhone && (
            <p className="p-2 text-[12px] lg:text-[16px]"><strong>Mother's Phone:</strong> {student.motherPhone}</p>
          )}

          <p className="p-2 text-[12px] lg:text-[16px]"><strong>Parent Contact:</strong> {student.parentContact}</p>
        </div>
      </div>
    </div>
    </>
  );
};

export default Page;
