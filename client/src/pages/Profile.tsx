import { useState } from "react";

import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    course: user?.course ?? "",
    yearLevel: user?.yearLevel ?? "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await api.patch("/users/profile", form);
      setMessage("Profile updated successfully.");
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ??
          "Unable to update profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <h1>My Profile</h1>
      <section>
        <p>{user?.email}</p>
        <p>{user?.studentId}</p>
        {message && <p role="status">{message}</p>}
        {error && <p role="alert">{error}</p>}
        <form onSubmit={saveProfile}>
          <label>
            First name
            <input
              required
              value={form.firstName}
              onChange={(event) =>
                setForm({ ...form, firstName: event.target.value })
              }
            />
          </label>
          <label>
            Last name
            <input
              required
              value={form.lastName}
              onChange={(event) =>
                setForm({ ...form, lastName: event.target.value })
              }
            />
          </label>
          <label>
            Course
            <input
              value={form.course}
              onChange={(event) =>
                setForm({ ...form, course: event.target.value })
              }
            />
          </label>
          <label>
            Year level
            <input
              value={form.yearLevel}
              onChange={(event) =>
                setForm({ ...form, yearLevel: event.target.value })
              }
            />
          </label>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </button>
        </form>
      </section>
    </main>
  );
}
