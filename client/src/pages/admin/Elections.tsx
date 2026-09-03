import {
  useEffect,
  useState,
} from "react";
import type { ChangeEvent, FormEvent } from "react";

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

interface Position {
  _id: string;
  name: string;
  votingType: "SINGLE" | "MULTIPLE";
  maxSelections: number;
}

interface Candidate {
  _id: string;
  positionId: string;
  candidateNumber: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  course?: string;
  yearLevel?: string;
  party?: string;
  biography?: string;
  isActive: boolean;
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
  const [selectedElectionId, setSelectedElectionId] =
    useState<string | null>(null);
  const [positions, setPositions] =
    useState<Position[]>([]);
  const [candidates, setCandidates] =
    useState<Candidate[]>([]);
  const [positionForm, setPositionForm] =
    useState({
      name: "",
      description: "",
      votingType: "SINGLE",
      maxSelections: 1,
    });
  const [candidateForm, setCandidateForm] =
    useState({
      positionId: "",
      candidateNumber: "",
      firstName: "",
      lastName: "",
      party: "",
      photoUrl: "",
      course: "",
      yearLevel: "",
      biography: "",
    });
  const [editingCandidateId, setEditingCandidateId] =
    useState<string | null>(null);
  const [editingElectionId, setEditingElectionId] =
    useState<string | null>(null);
  const [editingPositionId, setEditingPositionId] =
    useState<string | null>(null);

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
      if (editingElectionId) {
        await api.patch(`/elections/${editingElectionId}`, form);
      } else {
        await api.post("/elections", form);
      }
      setForm(emptyForm);
      setEditingElectionId(null);
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

  async function loadPositions(electionId: string) {
    setSelectedElectionId(electionId);
    setError("");

    try {
      const response = await api.get(
        `/elections/${electionId}/positions`,
      );
      setPositions(response.data.data);
      const candidatesResponse = await api.get(
        `/elections/${electionId}/candidates`,
      );
      setCandidates(candidatesResponse.data.data);
    } catch {
      setError("Unable to load ballot positions.");
    }
  }

  async function createPosition(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (!selectedElectionId) return;

    try {
      if (editingPositionId) {
        await api.patch(`/positions/${editingPositionId}`, positionForm);
      } else {
        await api.post(
          `/elections/${selectedElectionId}/positions`,
          positionForm,
        );
      }
      setEditingPositionId(null);
      setPositionForm({
        name: "",
        description: "",
        votingType: "SINGLE",
        maxSelections: 1,
      });
      await loadPositions(selectedElectionId);
    } catch {
      setError("Unable to create position.");
    }
  }

  function editElection(election: Election) {
    setEditingElectionId(election._id);
    setForm({
      title: election.title,
      description: election.description,
      academicYear: election.academicYear,
      startDate: new Date(election.startDate).toISOString().slice(0, 16),
      endDate: new Date(election.endDate).toISOString().slice(0, 16),
    });
  }

  function editPosition(position: Position) {
    setEditingPositionId(position._id);
    setPositionForm({
      name: position.name,
      description: "",
      votingType: position.votingType,
      maxSelections: position.maxSelections,
    });
  }

  async function deletePosition(positionId: string) {
    if (!window.confirm("Remove this position?")) return;
    try {
      await api.delete(`/positions/${positionId}`);
      if (selectedElectionId) await loadPositions(selectedElectionId);
    } catch {
      setError("Unable to remove position.");
    }
  }

  async function createCandidate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (!selectedElectionId) return;

    try {
      if (editingCandidateId) {
        await api.patch(`/candidates/${editingCandidateId}`, candidateForm);
      } else {
        await api.post("/candidates", {
          ...candidateForm,
          electionId: selectedElectionId,
        });
      }
      await loadPositions(selectedElectionId);
      setEditingCandidateId(null);
      setCandidateForm({
        positionId: "",
        candidateNumber: "",
        firstName: "",
        lastName: "",
        party: "",
        photoUrl: "",
        course: "",
        yearLevel: "",
        biography: "",
      });
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ??
          "Unable to create candidate.",
      );
    }
  }

  function selectCandidatePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCandidateForm((current) => ({
        ...current,
        photoUrl: String(reader.result),
      }));
    };
    reader.readAsDataURL(file);
  }

  async function updateCandidate(
    candidate: Candidate,
    isActive: boolean,
  ) {
    try {
      await api.patch(`/candidates/${candidate._id}`, { isActive });
      if (selectedElectionId) await loadPositions(selectedElectionId);
    } catch {
      setError("Unable to update candidate.");
    }
  }

  function editCandidate(candidate: Candidate) {
    setEditingCandidateId(candidate._id);
    setCandidateForm({
      positionId: candidate.positionId,
      candidateNumber: candidate.candidateNumber,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      party: candidate.party ?? "",
      photoUrl: candidate.photoUrl ?? "",
      course: candidate.course ?? "",
      yearLevel: candidate.yearLevel ?? "",
      biography: candidate.biography ?? "",
    });
  }

  async function deleteCandidate(candidateId: string) {
    if (!window.confirm("Remove this candidate?")) return;
    try {
      await api.delete(`/candidates/${candidateId}`);
      if (selectedElectionId) await loadPositions(selectedElectionId);
    } catch {
      setError("Unable to remove candidate.");
    }
  }

  async function updateElectionStatus(
    electionId: string,
    action: "schedule" | "cancel" | "delete",
  ) {
    if (action === "delete" && !window.confirm("Delete this draft election?")) return;
    try {
      if (action === "delete") {
        await api.delete(`/elections/${electionId}`);
      } else {
        await api.post(`/elections/${electionId}/${action}`);
      }
      await loadElections();
    } catch {
      setError(`Unable to ${action} election.`);
    }
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
        <h2>{editingElectionId ? "Edit Election" : "Create Election"}</h2>

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
              ? "Saving..."
              : editingElectionId
                ? "Save election"
                : "Create election"}
          </button>
          {editingElectionId && (
            <button
              type="button"
              onClick={() => {
                setEditingElectionId(null);
                setForm(emptyForm);
              }}
            >
              Cancel edit
            </button>
          )}
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

                {election.status === "DRAFT" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => updateElectionStatus(election._id, "schedule")}
                  >
                    Schedule
                  </button>
                ) : null}

                {election.status === "DRAFT" || election.status === "SCHEDULED" ? (
                  <button
                    type="button"
                    onClick={() => editElection(election)}
                  >
                    Edit election
                  </button>
                ) : null}

                {election.status === "DRAFT" || election.status === "SCHEDULED" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => updateElectionStatus(election._id, "cancel")}
                  >
                    Cancel
                  </button>
                ) : null}

                {election.status === "DRAFT" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => updateElectionStatus(election._id, "delete")}
                  >
                    Delete
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

                {election.status === "DRAFT" ||
                election.status === "SCHEDULED" ? (
                  <button
                    type="button"
                    onClick={() => loadPositions(election._id)}
                  >
                    {selectedElectionId === election._id
                      ? "Editing ballot"
                      : "Manage ballot"}
                  </button>
                ) : null}

                {selectedElectionId === election._id && (
                  <div className="ballot-editor">
                    <h4>Positions</h4>
                    {positions.map((position) => (
                      <div key={position._id}>
                        <p>
                          {position.name} ({position.votingType}, max {position.maxSelections})
                        </p>
                        <button type="button" onClick={() => editPosition(position)}>
                          Edit position
                        </button>
                        <button type="button" onClick={() => deletePosition(position._id)}>
                          Remove position
                        </button>
                      </div>
                    ))}

                    <h4>Candidates</h4>
                    {candidates.map((candidate) => (
                      <article key={candidate._id}>
                        {candidate.photoUrl && (
                          <img
                            src={candidate.photoUrl}
                            alt={`${candidate.firstName} ${candidate.lastName}`}
                            className="candidate-photo"
                          />
                        )}
                        <strong>
                          #{candidate.candidateNumber} {candidate.firstName} {candidate.lastName}
                        </strong>
                        <p>{candidate.party ?? "Independent"}</p>
                        <button
                          type="button"
                          onClick={() => editCandidate(candidate)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCandidate(candidate, !candidate.isActive)}
                        >
                          {candidate.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCandidate(candidate._id)}
                        >
                          Remove
                        </button>
                      </article>
                    ))}

                    <form onSubmit={createPosition}>
                      <input
                        required
                        placeholder="Position name"
                        value={positionForm.name}
                        onChange={(event) =>
                          setPositionForm({
                            ...positionForm,
                            name: event.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Description"
                        value={positionForm.description}
                        onChange={(event) =>
                          setPositionForm({
                            ...positionForm,
                            description: event.target.value,
                          })
                        }
                      />
                      <select
                        value={positionForm.votingType}
                        onChange={(event) =>
                          setPositionForm({
                            ...positionForm,
                            votingType: event.target.value,
                          })
                        }
                      >
                        <option value="SINGLE">Single choice</option>
                        <option value="MULTIPLE">Multiple choice</option>
                      </select>
                      <input
                        required
                        min="1"
                        type="number"
                        value={positionForm.maxSelections}
                        onChange={(event) =>
                          setPositionForm({
                            ...positionForm,
                            maxSelections: Number(event.target.value),
                          })
                        }
                      />
                      <button type="submit">
                        {editingPositionId ? "Update position" : "Add position"}
                      </button>
                      {editingPositionId && (
                        <button
                          type="button"
                          onClick={() => setEditingPositionId(null)}
                        >
                          Cancel edit
                        </button>
                      )}
                    </form>

                    <h4>{editingCandidateId ? "Edit Candidate" : "Add Candidate"}</h4>
                    <form onSubmit={createCandidate}>
                      <select
                        required
                        value={candidateForm.positionId}
                        onChange={(event) =>
                          setCandidateForm({
                            ...candidateForm,
                            positionId: event.target.value,
                          })
                        }
                      >
                        <option value="">Select position</option>
                        {positions.map((position) => (
                          <option key={position._id} value={position._id}>
                            {position.name}
                          </option>
                        ))}
                      </select>
                      <input
                        required
                        placeholder="Candidate number"
                        value={candidateForm.candidateNumber}
                        onChange={(event) =>
                          setCandidateForm({
                            ...candidateForm,
                            candidateNumber: event.target.value,
                          })
                        }
                      />
                      <input
                        required
                        placeholder="First name"
                        value={candidateForm.firstName}
                        onChange={(event) =>
                          setCandidateForm({
                            ...candidateForm,
                            firstName: event.target.value,
                          })
                        }
                      />
                      <input
                        required
                        placeholder="Last name"
                        value={candidateForm.lastName}
                        onChange={(event) =>
                          setCandidateForm({
                            ...candidateForm,
                            lastName: event.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Party"
                        value={candidateForm.party}
                        onChange={(event) =>
                          setCandidateForm({
                            ...candidateForm,
                            party: event.target.value,
                          })
                        }
                      />
                      <label>
                        Candidate photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={selectCandidatePhoto}
                        />
                      </label>
                      <input
                        placeholder="Course"
                        value={candidateForm.course}
                        onChange={(event) =>
                          setCandidateForm({
                            ...candidateForm,
                            course: event.target.value,
                          })
                        }
                      />
                      <input
                        placeholder="Year level"
                        value={candidateForm.yearLevel}
                        onChange={(event) =>
                          setCandidateForm({
                            ...candidateForm,
                            yearLevel: event.target.value,
                          })
                        }
                      />
                      <textarea
                        placeholder="Biography"
                        value={candidateForm.biography}
                        onChange={(event) =>
                          setCandidateForm({
                            ...candidateForm,
                            biography: event.target.value,
                          })
                        }
                      />
                      <button type="submit">
                        {editingCandidateId ? "Update candidate" : "Add candidate"}
                      </button>
                      {editingCandidateId && (
                        <button
                          type="button"
                          onClick={() => setEditingCandidateId(null)}
                        >
                          Cancel edit
                        </button>
                      )}
                    </form>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}
