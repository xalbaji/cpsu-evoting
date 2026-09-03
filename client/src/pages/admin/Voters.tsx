import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import { api } from "../../api/axios";

interface Voter {
  _id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  course?: string;
  yearLevel?: string;
  isActive: boolean;
  isVerified: boolean;
  hasVoted: boolean;
}

interface Pagination {
  page: number;
  pages: number;
  total: number;
}

export default function Voters() {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  async function loadVoters() {
    setLoading(true);
    try {
      const response = await api.get("/users", {
        params: { search, page, limit: 10 },
      });
      setVoters(response.data.data);
      setPagination(response.data.pagination);
    } catch {
      setMessage("Unable to load voters.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVoters();
  }, [page]);

  async function updateVoter(
    voter: Voter,
    field: "isActive" | "isVerified",
  ) {
    setUpdating(voter._id);
    setMessage("");
    try {
      await api.patch(`/users/${voter._id}`, {
        [field]: !voter[field],
      });
      await loadVoters();
    } catch {
      setMessage("Unable to update voter.");
    } finally {
      setUpdating(null);
    }
  }

  async function deleteVoter(voterId: string) {
    if (!window.confirm("Delete this voter account?")) return;
    try {
      await api.delete(`/users/${voterId}`);
      await loadVoters();
    } catch {
      setMessage("Unable to delete voter.");
    }
  }

  async function importCsv(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post(
        "/users/import",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setMessage(
        `Imported ${response.data.data.imported} voters; rejected ${response.data.data.rejected}.`,
      );
      await loadVoters();
    } catch {
      setMessage("Unable to import voters.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function searchVoters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    loadVoters();
  }

  return (
    <main>
      <h1>Voter Management</h1>

      <form onSubmit={searchVoters}>
        <label>
          Search
          <input
            value={search}
            placeholder="Student ID, name, or email"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <button type="submit">Search</button>
      </form>

      <label>
        Import CSV
        <input
          type="file"
          accept=".csv,text/csv"
          disabled={uploading}
          onChange={importCsv}
        />
      </label>

      {message && <p role="status">{message}</p>}

      {loading ? (
        <p>Loading voters...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Course</th>
              <th>Year</th>
              <th>Status</th>
              <th>Verified</th>
              <th>Voting Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {voters.map((voter) => (
              <tr key={voter._id}>
                <td>{voter.studentId}</td>
                <td>{voter.firstName} {voter.lastName}</td>
                <td>{voter.email}</td>
                <td>{voter.course ?? "-"}</td>
                <td>{voter.yearLevel ?? "-"}</td>
                <td>{voter.isActive ? "Active" : "Inactive"}</td>
                <td>{voter.isVerified ? "Yes" : "No"}</td>
                <td>{voter.hasVoted ? "Voted" : "Not voted"}</td>
                <td>
                  <button
                    type="button"
                    disabled={updating === voter._id}
                    onClick={() => updateVoter(voter, "isActive")}
                  >
                    {voter.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    disabled={updating === voter._id}
                    onClick={() => deleteVoter(voter._id)}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    disabled={updating === voter._id}
                    onClick={() => updateVoter(voter, "isVerified")}
                  >
                    {voter.isVerified ? "Unverify" : "Verify"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <nav aria-label="Voter pages">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        {Array.from({ length: pagination.pages }, (_, index) => index + 1).map(
          (pageNumber) => (
            <button
              type="button"
              key={pageNumber}
              aria-current={pageNumber === page ? "page" : undefined}
              onClick={() => setPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page >= pagination.pages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </nav>
    </main>
  );
}
