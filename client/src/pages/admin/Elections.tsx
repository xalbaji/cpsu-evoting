import {
  useEffect,
  useState,
} from "react";
import type { FormEvent } from "react";

import { api } from "../../api/axios";

interface Election {
  _id: string;
  title: string;
  description: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  status: string;
  resultsPublished: boolean;
}

interface ElectionForm {
  title: string;
  description: string;
  academicYear: string;
  startDate: string;
  endDate: string;
}

const emptyForm: ElectionForm = {
  title: "",
  description: "",
  academicYear: "",
  startDate: "",
  endDate: "",
};

export default function Elections() {
  const [elections, setElections] =
    useState<Election[]>([]);
  const [form, setForm] =
    useState<ElectionForm>(emptyForm);
  const [loading, setLoading] =
    useState(true);
  const [submitting, setSubmitting] =
    useState(false);
  const [actionId, setActionId] =
    useState<string | null>(null);
  const [error, setError] =
    useState("");

  async function loadElections() {
    setError("");

    try {
      const response = await api.get(
        "/elections",
      );
      setElections(response.data.data);
    } catch {
      setError("Unable to load elections.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadElections();
  }, []);

  async function createElection(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await api.post(
        "/elections",
        form,
      );
      setForm(emptyForm);
      await loadElections();
    } catch {
      setError("Unable to create election.");
    } finally {
      setSubmitting(false);
    }
  }

  async function openElection(
    electionId: string,
  ) {
    await runAction(
      electionId,
      async () => {
        await api.post(
          `/elections/${electionId}/open`,
        );
        await loadElections();
      },
      "Unable to open election.",
    );
  }

  async function closeElection(
    electionId: string,
  ) {
    await runAction(
      electionId,
      async () => {
        await api.post(
          `/elections/${electionId}/close`,
        );
        await loadElections();
      },
      "Unable to close election.",
    );
  }

  async function publishResults(
    electionId: string,
  ) {
    await runAction(
      electionId,
      async () => {
        await api.post(
          `/elections/${electionId}/publish-results`,
        );
        await loadElections();
      },
      "Unable to publish results.",
    );
  }

  async function runAction(
    electionId: string,
    action: () => Promise<void>,
    message: string,
  ) {
    setActionId(electionId);
    setError("");

    try {
      await action();
    } catch {
      setError(message);
    } finally {
      setActionId(null);
    }
  }

  return (
    <main>
      <h1>Elections</h1>

      <section>
        <h2>Create Election</h2>

        <form onSubmit={createElection}>
          <label>
            Title
            <input
              required
              value={form.title}
              onChange={(event) =>
                setForm({
                  ...form,
                  title: event.target.value,
                })
              }
            />
          </label>

          <label>
            Description
            <textarea
              required
              value={form.description}
              onChange={(event) =>
                setForm({
                  ...form,
                  description: event.target.value,
                })
              }
            />
          </label>

          <label>
            Academic year
            <input
              required
              value={form.academicYear}
              onChange={(event) =>
                setForm({
                  ...form,
                  academicYear: event.target.value,
                })
              }
            />
          </label>

          <label>
            Start date
            <input
              required
              type="datetime-local"
              value={form.startDate}
              onChange={(event) =>
                setForm({
                  ...form,
                  startDate: event.target.value,
                })
              }
            />
          </label>

          <label>
            End date
            <input
              required
              type="datetime-local"
              value={form.endDate}
              onChange={(event) =>
                setForm({
                  ...form,
                  endDate: event.target.value,
                })
              }
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Creating..."
              : "Create election"}
          </button>
        </form>
      </section>

      <section>
        <h2>All Elections</h2>

        {error && <p role="alert">{error}</p>}

        {loading ? (
          <p>Loading elections...</p>
        ) : elections.length === 0 ? (
          <p>No elections found.</p>
        ) : (
          elections.map((election) => {
            const busy =
              actionId === election._id;

            return (
              <article key={election._id}>
                <h3>{election.title}</h3>
                <p>{election.description}</p>
                <p>
                  {election.academicYear} | {election.status}
                </p>
                <p>
                  {new Date(election.startDate).toLocaleString()}
                  {" - "}
                  {new Date(election.endDate).toLocaleString()}
                </p>

                {election.status === "DRAFT" ||
                election.status === "SCHEDULED" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      openElection(election._id)
                    }
                  >
                    {busy ? "Updating..." : "Open election"}
                  </button>
                ) : null}

                {election.status === "ACTIVE" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      closeElection(election._id)
                    }
                  >
                    {busy ? "Updating..." : "Close election"}
                  </button>
                ) : null}

                {election.status === "CLOSED" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      publishResults(election._id)
                    }
                  >
                    {busy
                      ? "Publishing..."
                      : "Publish results"}
                  </button>
                ) : null}
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}
