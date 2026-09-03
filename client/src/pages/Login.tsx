import { useState } from "react";
import type { FormEvent } from "react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/BrandLogo";

export default function Login() {
  const navigate =
    useNavigate();

  const { login } =
    useAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const user =
        await login(
          email,
          password,
        );

      if (
        user.role === "ADMIN"
      ) {
        navigate(
          "/admin/dashboard",
        );
      } else {
        navigate(
          "/voter/dashboard",
        );
      }
    } catch (error: any) {
      setError(
        error?.response?.data
          ?.message ??
          "Unable to reach the server. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form
        className="auth-card"
        onSubmit={
          handleSubmit
        }
      >
        <BrandLogo />

        <p>
          Sign in to continue
        </p>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value,
            )
          }
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value,
            )
          }
          required
        />

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Signing in..."
            : "Sign In"}
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/register",
            )
          }
        >
          Create Account
        </button>
      </form>
    </div>
  );
}