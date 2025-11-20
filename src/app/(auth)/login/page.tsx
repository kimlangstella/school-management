"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Link, Form, Checkbox } from "@heroui/react";
import { Icon } from "@iconify/react";
import { AcmeIcon } from "@/components/acme";
import { supabase } from "../../../../lib/supabaseClient";
import Image from "next/image";
export default function LoginPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrorMessage("");
  setIsSubmitting(true);

  const { email, password } = formData;

  // Login with Supabase (cookie session auto-handled)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  console.log("Login result:", { data, error });

  if (error) {
    setErrorMessage("Login failed: " + error.message);
    setIsSubmitting(false);
    return;
  }

  if (!data?.session) {
    setErrorMessage("No session returned. Please check Supabase settings.");
    setIsSubmitting(false);
    return;
  }

  try {
    const userId = data.session.user.id;

    // Optional: fetch additional profile info (cleaner error handling)
    const { data: profileData, error: profileError } = await supabase.rpc("get_user_by_id", {
      _id: userId,
    });

    if (profileError) {
      console.warn("Profile fetch failed:", profileError.message);
    } else {
      const profile = Array.isArray(profileData) ? profileData[0] : profileData;
      console.log("User profile:", profile);
      // You can set profile in a context or global state here if needed
    }

    router.push("/");
  } catch (err) {
    setErrorMessage("Unexpected error during login.");
    console.error("Login error:", err);
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <div className=" dark flex h-screen w-full flex-col items-center justify-center">
      <div className="flex flex-col items-center pb-6">
            <Image
            src="/AAA_logo.png"
            alt="Logo"
            width={100}
            height={100}
            className="rounded-full"
          />
        <p className="text-xl font-medium">Welcome Back</p>
        <p className="text-small text-default-500">Log in to your account to continue</p>
      </div>
      <div className="mt-2 flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 py-6 shadow-small">
        {errorMessage && <p className="text-red-600 text-center">{errorMessage}</p>}

        <Form className="flex flex-col gap-3" validationBehavior="native" onSubmit={handleLogin}>
          <Input
            isRequired
            label="Email Address"
            name="email"
            placeholder="Enter your email"
            type="email"
            variant="bordered"
            onChange={handleChange}
          />
          <Input
            isRequired
            label="Password"
            name="password"
            placeholder="Enter your password"
            type={isVisible ? "text" : "password"}
            variant="bordered"
            endContent={
              <button type="button" onClick={toggleVisibility}>
                <Icon
                  className="pointer-events-none text-2xl text-default-400"
                  icon={isVisible ? "solar:eye-closed-linear" : "solar:eye-bold"}
                />
              </button>
            }
            onChange={handleChange}
          />
          <div className="flex w-full items-center justify-between px-1 py-2">
            <Checkbox name="remember" size="sm">Remember me</Checkbox>
            <Link className="text-default-500" href="#" size="sm">Forgot password?</Link>
          </div>
          <Button className="w-full" color="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log In"}
          </Button>
        </Form>
      </div>
    </div>
  );
}