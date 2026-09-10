import { useState } from "react";
import type { FormEvent } from "react";

import { useNavigate } from "react-router-dom";
import { api } from "../api/axios";
import BrandLogo from "../components/BrandLogo";

export default function Register() {
  const navigate =
    useNavigate();

  const [form, setForm] =
    useState({
      studentId: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      course: "",
      yearLevel: "",
    });

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (
      form.password !==
      form.confirmPassword
    ) {
      setError(
        "Passwords do not match",
      );
      return;
    }

    try {
      await api.post(
        "/auth/register",
        {
          studentId:
            form.studentId,
          firstName:
            form.firstName,
          lastName:
            form.lastName,
          email:
            form.email,
          password:
            form.password,
          course:
            form.course,
          yearLevel:
            form.yearLevel,
        },
      );

      navigate("/login");
    } catch (error: any) {
      setError(
        error?.response?.data
          ?.message ??
          "Unable to reach the server. Please try again.",
      );
    }
  }

  return (
    <div className="auth-page">
      <form
        className="auth-card"
        onSubmit={handleSubmit}
      >
      <BrandLogo />
      <h1>Create Voter Account</h1>

      {error && (
        <p>{error}</p>
      )}

      <input
        placeholder="Student ID"
        value={
          form.studentId
        }
        onChange={(e) =>
          setForm({
            ...form,
            studentId:
              e.target.value,
          })
        }
        required
      />

      <input
        placeholder="First Name"
        value={
          form.firstName
        }
        onChange={(e) =>
          setForm({
            ...form,
            firstName:
              e.target.value,
          })
        }
        required
      />

      <input
        placeholder="Last Name"
        value={
          form.lastName
        }
        onChange={(e) =>
          setForm({
            ...form,
            lastName:
              e.target.value,
          })
        }
        required
      />

      <input
        type="email"
        placeholder="Email"
        value={
          form.email
        }
        onChange={(e) =>
          setForm({
            ...form,
            email:
              e.target.value,
          })
        }
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={
          form.password
        }
        onChange={(e) =>
          setForm({
            ...form,
            password:
              e.target.value,
          })
        }
        required
      />

      <input
        type="password"
        placeholder="Confirm Password"
        value={
          form.confirmPassword
        }
        onChange={(e) =>
          setForm({
            ...form,
            confirmPassword:
              e.target.value,
          })
        }
        required
      />

      <input
        placeholder="Course"
        value={
          form.course
        }
        onChange={(e) =>
          setForm({
            ...form,
            course:
              e.target.value,
          })
        }
      />

      <input
        placeholder="Year Level"
        value={
          form.yearLevel
        }
        onChange={(e) =>
          setForm({
            ...form,
            yearLevel:
              e.target.value,
          })
        }
      />

      <button type="submit">
        Register
      </button>
      </form>
    </div>
  );
}