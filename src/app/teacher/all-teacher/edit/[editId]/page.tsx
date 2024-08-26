"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import Dropdown from "@/components/Dropdown";
import { useState } from "react";
const Page = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    program: "",
    branch: "",
    phone: "",
    uploadPicture: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(formData);
  };
  return (
    <div className="lg:ml-[219px] mt-20 flex flex-col">
      <div className="lg:w-[1079px] w-[330px] h-[40px] p-4 bg-white flex items-center rounded-md justify-between">
        <span className="flex flex-row gap-2 text-[12px] lg:text-[15px]">
          Teacher |{" "}
          <Image src={"/home.svg"} width={15} height={15} alt="public" />{" "}
          New-Teacher
        </span>

        <Link href={"/#"} passHref>
          <div className="h-[23px] w-[57px] bg-[#213458] flex items-center justify-center rounded-md">
            <Image src={"/refresh.svg"} width={16} height={16} alt="Refresh" />
          </div>
        </Link>
      </div>

      <h1 className="text-center text-2xl font-bold mb-8 mt-4 border-b-2">
        Teacher form
      </h1>
      <form className="space-y-8" onClick={handleSubmit}>
        <section>
          <h2 className="text-2xl font-bold mb-8 lg:mt-4 border-b-2">
            Student Information
          </h2>
          <div className="grid lg:grid-cols-3 flex-col gap-8">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700"
              >
                First Name:
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="mt-1 block lg:w-[272px] w-[329px] h-[40px] rounded-md outline-none border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700"
              >
                Last Name:
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="mt-1 block lg:w-[272px] w-[329px] h-[40px] rounded-md outline-none border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label
                htmlFor="age"
                className="block text-sm font-medium text-gray-700"
              >
                UserName
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.userName}
                onChange={handleChange}
                className="mt-1 block lg:w-[272px] w-[329px] h-[40px] rounded-md outline-none border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700"
              >
                Program
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.program}
                onChange={handleChange}
                className="mt-1 block lg:w-[272px] w-[329px] h-[40px] rounded-md outline-none border-gray-300 shadow-sm"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="branch"
                className="block text-sm font-medium text-gray-700"
              >
                Branch:
              </label>
              <Dropdown
                onChange={(value: any) =>
                  setFormData({ ...formData, branch: value })
                }
              />
            </div>
            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700"
              >
                Program
              </label>
              <select
                id="program"
                name="program"
                value={formData.program}
                onChange={handleChange}
                className="mt-1 block lg:w-[272px] w-[329px] h-[40px] rounded-md outline-none border-gray-300 shadow-sm"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="uploadPicture"
                className="block text-sm font-medium text-gray-700"
              >
                Upload Picture:
              </label>
              <input
                type="file"
                id="uploadPicture"
                name="uploadPicture"
                onChange={handleChange}
                className="mt-1 block lg:w-[272px] w-[329px] h-[40px]"
              />
            </div>
          </div>
        </section>
        <div className="flex justify-center items-center space-x-4">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent bg-[#CF510E] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex justify-center gap-1 rounded-md border border-transparent bg-[#123458] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default Page;