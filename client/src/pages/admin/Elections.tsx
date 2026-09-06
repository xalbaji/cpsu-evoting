import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "../../components/BrandLogo";

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

/* ─── Icons (shared with AdminDashboard) ─── */
const Icons = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  elections: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  voters: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  audit: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  results: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
  menu: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
  edit: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  user: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

const NAV_ITEMS = [
  { path: "/admin/dashboard", label: "Dashboard", icon: Icons.dashboard },
  { path: "/admin/elections", label: "Elections", icon: Icons.elections },
  { path: "/admin/voters", label: "Voters", icon: Icons.voters },
    { path: "/admin/audit-logs", label: "Audit Logs", icon: Icons.audit },
  { path: "/admin/results", label: "Results", icon: Icons.results },
];

/* ─── Status badge helper ─── */
function statusStyle(status: string) {
  switch (status) {
    case "ACTIVE":
      return { color: "#d97706", bg: "#fef3c7" };
    case "SCHEDULED":
      return { color: "#2563eb", bg: "#dbeafe" };
    case "CLOSED":
      return { color: "#0f766e", bg: "#f0fdfa" };
    case "CANCELLED":
      return { color: "#dc2626", bg: "#fee2e2" };
    default:
      return { color: "#64748b", bg: "#f1f5f9" }; // DRAFT
  }
}

function StatusBadge({ status }: { status: string }) {
  const s = statusStyle(status);
  return (
    <span className="status-badge" style={{ color: s.color, background: s.bg }}>
      {status}
    </span>
  );
}

export default function Elections() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [elections, setElections] = useState<Election[]>([]);
  const [form, setForm] = useState<ElectionForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positionForm, setPositionForm] = useState({
    name: "",
    description: "",
    votingType: "SINGLE",
    maxSelections: 1,
  });
  const [candidateForm, setCandidateForm] = useState({
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
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [editingElectionId, setEditingElectionId] = useState<string | null>(null);
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  async function loadElections() {
    setError("");
    try {
      const response = await api.get("/elections");
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

  async function createElection(event: FormEvent<HTMLFormElement>) {
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

  async function openElection(electionId: string) {
    await runAction(electionId, async () => {
      await api.post(`/elections/${electionId}/open`);
      await loadElections();
    }, "Unable to open election.");
  }

  async function closeElection(electionId: string) {
    await runAction(electionId, async () => {
      await api.post(`/elections/${electionId}/close`);
      await loadElections();
    }, "Unable to close election.");
  }

  async function publishResults(electionId: string) {
    await runAction(electionId, async () => {
      await api.post(`/elections/${electionId}/publish-results`);
      await loadElections();
    }, "Unable to publish results.");
  }

  async function loadPositions(electionId: string) {
    setSelectedElectionId(electionId);
    setError("");
    try {
      const response = await api.get(`/elections/${electionId}/positions`);
      setPositions(response.data.data);
      const candidatesResponse = await api.get(`/elections/${electionId}/candidates`);
      setCandidates(candidatesResponse.data.data);
    } catch {
      setError("Unable to load ballot positions.");
    }
  }

  async function createPosition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedElectionId) return;
    try {
      if (editingPositionId) {
        await api.patch(`/positions/${editingPositionId}`, positionForm);
      } else {
        await api.post(`/elections/${selectedElectionId}/positions`, positionForm);
      }
      setEditingPositionId(null);
      setPositionForm({ name: "", description: "", votingType: "SINGLE", maxSelections: 1 });
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

  async function createCandidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedElectionId) return;
    try {
      if (editingCandidateId) {
        await api.patch(`/candidates/${editingCandidateId}`, candidateForm);
      } else {
        await api.post("/candidates", { ...candidateForm, electionId: selectedElectionId });
      }
      await loadPositions(selectedElectionId);
      setEditingCandidateId(null);
      setCandidateForm({
        positionId: "", candidateNumber: "", firstName: "", lastName: "",
        party: "", photoUrl: "", course: "", yearLevel: "", biography: "",
      });
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message ?? "Unable to create candidate.");
    }
  }

  function selectCandidatePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCandidateForm((current) => ({ ...current, photoUrl: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  }

  async function updateCandidate(candidate: Candidate, isActive: boolean) {
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

  async function updateElectionStatus(electionId: string, action: "schedule" | "cancel" | "delete") {
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

  async function runAction(electionId: string, action: () => Promise<void>, message: string) {
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
    <>
      <style>{`
        .admin-page { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; min-height: 100vh; color: #1e293b; }

        /* Navbar */
        .admin-navbar { background: #0f3d3e; height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; position: sticky; top: 0; z-index: 50; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .admin-logo-wrap { display: flex; align-items: center; gap: 12px; }
        .admin-logo-box { width: 40px; height: 40px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 5px; box-sizing: border-box; flex-shrink: 0; }
        .admin-logo-box img { width: 100%; height: 100%; object-fit: contain; display: block; }
        .admin-brand { color: white; font-weight: 600; font-size: 1.05rem; letter-spacing: 0.02em; }
        .admin-user { display: flex; align-items: center; gap: 16px; }
        .admin-user-name { color: #a7f3d0; font-size: 0.9rem; font-weight: 500; }
        .admin-logout { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 8px 18px; border-radius: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .admin-logout:hover { background: rgba(255,255,255,0.2); }
        .menu-btn { display: none; background: none; border: none; color: white; cursor: pointer; padding: 4px; margin-right: 8px; }

        /* Layout */
        .admin-layout { display: flex; }
        .admin-sidebar { width: 250px; min-height: calc(100vh - 64px); background: #ffffff; border-right: 1px solid #e2e8f0; padding: 20px 0; position: fixed; top: 64px; left: 0; z-index: 40; transition: transform 0.3s ease; }
        .sidebar-label { padding: 0 20px 14px; font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; }
        .sidebar-link { display: flex; align-items: center; gap: 12px; padding: 11px 18px; margin: 0 10px; border-radius: 10px; color: #64748b; text-decoration: none; font-weight: 500; font-size: 0.88rem; transition: all 0.2s; }
        .sidebar-link:hover { background: #f8fafc; color: #0f766e; }
        .sidebar-link.active { background: #f0fdfa; color: #0f766e; font-weight: 600; }
        .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 35; opacity: 0; pointer-events: none; transition: opacity 0.3s; }

        .admin-main { margin-left: 250px; padding: 28px 32px; width: calc(100% - 250px); box-sizing: border-box; min-height: calc(100vh - 64px); }
        .page-header { margin-bottom: 24px; }
        .page-header h1 { font-size: 1.6rem; font-weight: 700; color: #0f3d3e; margin: 0 0 4px 0; letter-spacing: -0.01em; }
        .page-header p { color: #64748b; font-size: 0.9rem; margin: 0; }

        /* Panels / cards */
        .panel { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); margin-bottom: 22px; }
        .panel-title { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0 0 18px 0; }
        .panel-subtitle { font-size: 0.85rem; font-weight: 600; color: #0f172a; margin: 22px 0 12px; padding-top: 16px; border-top: 1px solid #e2e8f0; }

        /* Forms */
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .field.full { grid-column: 1 / -1; }
        .field label { font-size: 0.8rem; font-weight: 600; color: #334155; }
        .field input, .field textarea, .field select {
          border: 1px solid #cbd5e1; border-radius: 9px; padding: 9px 12px; font-size: 0.88rem;
          font-family: inherit; color: #0f172a; background: #fff; box-sizing: border-box; transition: border-color 0.15s;
        }
        .field input:focus, .field textarea:focus, .field select:focus { outline: none; border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.12); }
        .field textarea { resize: vertical; min-height: 70px; }
        .form-actions { display: flex; gap: 10px; margin-top: 6px; grid-column: 1 / -1; }

        /* Buttons */
        .btn { border: none; border-radius: 9px; padding: 10px 18px; font-size: 0.85rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .btn-primary { background: #0d9488; color: white; }
        .btn-primary:hover:not(:disabled) { background: #0f766e; }
        .btn-outline { background: #fff; color: #334155; border: 1px solid #cbd5e1; }
        .btn-outline:hover:not(:disabled) { background: #f8fafc; border-color: #94a3b8; }
        .btn-danger { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .btn-danger:hover:not(:disabled) { background: #fee2e2; }
        .btn-sm { padding: 6px 12px; font-size: 0.78rem; border-radius: 7px; }
        .btn-icon { display: inline-flex; align-items: center; gap: 6px; }

        /* Status badge */
        .status-badge { font-size: 0.68rem; font-weight: 700; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.03em; }

        /* Election cards */
        .election-card { border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px 22px; margin-bottom: 16px; background: #fff; transition: box-shadow 0.2s; }
        .election-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .election-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .election-title { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; }
        .election-desc { color: #64748b; font-size: 0.86rem; margin: 0 0 8px 0; }
        .election-meta { color: #94a3b8; font-size: 0.78rem; display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 4px; }
        .election-dates { color: #64748b; font-size: 0.8rem; margin-bottom: 14px; }
        .election-actions { display: flex; gap: 8px; flex-wrap: wrap; }

        /* Ballot editor */
        .ballot-editor { margin-top: 18px; padding: 18px 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; }
        .position-item { display: flex; align-items: center; justify-content: space-between; background: #fff; border: 1px solid #e2e8f0; border-radius: 9px; padding: 10px 14px; margin-bottom: 8px; font-size: 0.85rem; }
        .position-item span { color: #0f172a; font-weight: 500; }
        .position-actions { display: flex; gap: 6px; }

        .candidate-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin-bottom: 8px; }
        .candidate-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: left; }
        .candidate-photo { width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 10px; background: #f1f5f9; }
        .candidate-name { font-weight: 700; font-size: 0.88rem; color: #0f172a; }
        .candidate-party { color: #64748b; font-size: 0.78rem; margin: 2px 0 10px; }
        .candidate-actions { display: flex; gap: 6px; flex-wrap: wrap; }

        .empty-state, .loading-state { text-align: center; color: #94a3b8; font-size: 0.9rem; padding: 30px 0; }
        .error-banner { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 9px; padding: 10px 14px; font-size: 0.85rem; margin-bottom: 16px; }

        @media (max-width: 768px) {
          .menu-btn { display: flex; }
          .admin-brand { display: none; }
          .admin-sidebar { transform: translateX(-100%); box-shadow: 4px 0 24px rgba(0,0,0,0.15); }
          .admin-sidebar.open { transform: translateX(0); }
          .sidebar-overlay.open { display: block; opacity: 1; pointer-events: auto; }
          .admin-main { margin-left: 0; width: 100%; padding: 20px; }
          .form-grid { grid-template-columns: 1fr; }
          .page-header h1 { font-size: 1.3rem; }
        }
      `}</style>

      <div className="admin-page">
        <nav className="admin-navbar">
          <div className="admin-logo-wrap">
            <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
              {sidebarOpen ? Icons.close : Icons.menu}
            </button>
            <div className="admin-logo-box"><BrandLogo /></div>
            <span className="admin-brand">CPSU E-Voting</span>
          </div>
          <div className="admin-user">
            <span className="admin-user-name">CPSU Administrator</span>
            <button className="admin-logout" onClick={handleLogout}>Log out</button>
          </div>
        </nav>

        <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

        <div className="admin-layout">
          <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
            <div className="sidebar-label">Administration</div>
            {NAV_ITEMS.map((item) => (
              <Link key={item.path} to={item.path} className={`sidebar-link ${location.pathname === item.path ? "active" : ""}`} onClick={() => setSidebarOpen(false)}>
                {item.icon}{item.label}
              </Link>
            ))}
          </aside>

          <main className="admin-main">
            <div className="page-header">
              <h1>Elections</h1>
              <p>Create, schedule, and manage your election ballots</p>
            </div>

            {error && <div className="error-banner" role="alert">{error}</div>}

            {/* Create / Edit Election */}
            <div className="panel">
              <h2 className="panel-title">{editingElectionId ? "Edit Election" : "Create Election"}</h2>
              <form onSubmit={createElection} className="form-grid">
                <div className="field full">
                  <label>Title</label>
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>

                <div className="field full">
                  <label>Description</label>
                  <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>

                <div className="field">
                  <label>Academic year</label>
                  <input required value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} />
                </div>

                <div />

                <div className="field">
                  <label>Start date</label>
                  <input required type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>

                <div className="field">
                  <label>End date</label>
                  <input required type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? "Saving..." : editingElectionId ? "Save election" : "Create election"}
                  </button>
                  {editingElectionId && (
                    <button type="button" className="btn btn-outline" onClick={() => { setEditingElectionId(null); setForm(emptyForm); }}>
                      Cancel edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* All Elections */}
            <div className="panel">
              <h2 className="panel-title">All Elections</h2>

              {loading ? (
                <p className="loading-state">Loading elections...</p>
              ) : elections.length === 0 ? (
                <p className="empty-state">No elections found.</p>
              ) : (
                elections.map((election) => {
                  const busy = actionId === election._id;

                  return (
                    <div key={election._id} className="election-card">
                      <div className="election-top">
                        <div>
                          <h3 className="election-title">{election.title}</h3>
                          <p className="election-desc">{election.description}</p>
                        </div>
                        <StatusBadge status={election.status} />
                      </div>

                      <div className="election-meta">
                        <span>{election.academicYear}</span>
                      </div>
                      <div className="election-dates">
                        {new Date(election.startDate).toLocaleString()} — {new Date(election.endDate).toLocaleString()}
                      </div>

                      <div className="election-actions">
                        {(election.status === "DRAFT" || election.status === "SCHEDULED") && (
                          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => openElection(election._id)}>
                            {busy ? "Updating..." : "Open election"}
                          </button>
                        )}

                        {election.status === "DRAFT" && (
                          <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => updateElectionStatus(election._id, "schedule")}>
                            Schedule
                          </button>
                        )}

                        {(election.status === "DRAFT" || election.status === "SCHEDULED") && (
                          <button className="btn btn-outline btn-sm btn-icon" onClick={() => editElection(election)}>
                            {Icons.edit} Edit
                          </button>
                        )}

                        {(election.status === "DRAFT" || election.status === "SCHEDULED") && (
                          <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => updateElectionStatus(election._id, "cancel")}>
                            Cancel
                          </button>
                        )}

                        {election.status === "DRAFT" && (
                          <button className="btn btn-danger btn-sm btn-icon" disabled={busy} onClick={() => updateElectionStatus(election._id, "delete")}>
                            {Icons.trash} Delete
                          </button>
                        )}

                        {election.status === "ACTIVE" && (
                          <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => closeElection(election._id)}>
                            {busy ? "Updating..." : "Close election"}
                          </button>
                        )}

                        {election.status === "CLOSED" && (
                          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => publishResults(election._id)}>
                            {busy ? "Publishing..." : "Publish results"}
                          </button>
                        )}

                        {(election.status === "DRAFT" || election.status === "SCHEDULED") && (
                          <button className="btn btn-outline btn-sm" onClick={() => loadPositions(election._id)}>
                            {selectedElectionId === election._id ? "Editing ballot" : "Manage ballot"}
                          </button>
                        )}
                      </div>

                      {selectedElectionId === election._id && (
                        <div className="ballot-editor">
                          <h4 className="panel-subtitle" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>Positions</h4>
                          {positions.length === 0 && <p className="empty-state" style={{ padding: "10px 0" }}>No positions yet.</p>}
                          {positions.map((position) => (
                            <div key={position._id} className="position-item">
                              <span>{position.name} — {position.votingType.toLowerCase()}, max {position.maxSelections}</span>
                              <div className="position-actions">
                                <button className="btn btn-outline btn-sm" onClick={() => editPosition(position)}>Edit</button>
                                <button className="btn btn-danger btn-sm" onClick={() => deletePosition(position._id)}>Remove</button>
                              </div>
                            </div>
                          ))}

                          <h4 className="panel-subtitle">Candidates</h4>
                          {candidates.length === 0 && <p className="empty-state" style={{ padding: "10px 0" }}>No candidates yet.</p>}
                          <div className="candidate-grid">
                            {candidates.map((candidate) => (
                              <div key={candidate._id} className="candidate-card">
                                {candidate.photoUrl && (
                                  <img src={candidate.photoUrl} alt={`${candidate.firstName} ${candidate.lastName}`} className="candidate-photo" />
                                )}
                                <div className="candidate-name">#{candidate.candidateNumber} {candidate.firstName} {candidate.lastName}</div>
                                <div className="candidate-party">{candidate.party || "Independent"}</div>
                                <div className="candidate-actions">
                                  <button className="btn btn-outline btn-sm" onClick={() => editCandidate(candidate)}>Edit</button>
                                  <button className="btn btn-outline btn-sm" onClick={() => updateCandidate(candidate, !candidate.isActive)}>
                                    {candidate.isActive ? "Deactivate" : "Activate"}
                                  </button>
                                  <button className="btn btn-danger btn-sm" onClick={() => deleteCandidate(candidate._id)}>Remove</button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <h4 className="panel-subtitle">{editingPositionId ? "Edit Position" : "Add Position"}</h4>
                          <form onSubmit={createPosition} className="form-grid">
                            <div className="field">
                              <label>Position name</label>
                              <input required value={positionForm.name} onChange={(e) => setPositionForm({ ...positionForm, name: e.target.value })} />
                            </div>
                            <div className="field">
                              <label>Description</label>
                              <input value={positionForm.description} onChange={(e) => setPositionForm({ ...positionForm, description: e.target.value })} />
                            </div>
                            <div className="field">
                              <label>Voting type</label>
                              <select value={positionForm.votingType} onChange={(e) => setPositionForm({ ...positionForm, votingType: e.target.value })}>
                                <option value="SINGLE">Single choice</option>
                                <option value="MULTIPLE">Multiple choice</option>
                              </select>
                            </div>
                            <div className="field">
                              <label>Max selections</label>
                              <input required min="1" type="number" value={positionForm.maxSelections} onChange={(e) => setPositionForm({ ...positionForm, maxSelections: Number(e.target.value) })} />
                            </div>
                            <div className="form-actions">
                              <button type="submit" className="btn btn-primary btn-icon">
                                {Icons.plus} {editingPositionId ? "Update position" : "Add position"}
                              </button>
                              {editingPositionId && (
                                <button type="button" className="btn btn-outline" onClick={() => setEditingPositionId(null)}>Cancel edit</button>
                              )}
                            </div>
                          </form>

                          <h4 className="panel-subtitle">{editingCandidateId ? "Edit Candidate" : "Add Candidate"}</h4>
                          <form onSubmit={createCandidate} className="form-grid">
                            <div className="field">
                              <label>Position</label>
                              <select required value={candidateForm.positionId} onChange={(e) => setCandidateForm({ ...candidateForm, positionId: e.target.value })}>
                                <option value="">Select position</option>
                                {positions.map((position) => (
                                  <option key={position._id} value={position._id}>{position.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="field">
                              <label>Candidate number</label>
                              <input required value={candidateForm.candidateNumber} onChange={(e) => setCandidateForm({ ...candidateForm, candidateNumber: e.target.value })} />
                            </div>
                            <div className="field">
                              <label>First name</label>
                              <input required value={candidateForm.firstName} onChange={(e) => setCandidateForm({ ...candidateForm, firstName: e.target.value })} />
                            </div>
                            <div className="field">
                              <label>Last name</label>
                              <input required value={candidateForm.lastName} onChange={(e) => setCandidateForm({ ...candidateForm, lastName: e.target.value })} />
                            </div>
                            <div className="field">
                              <label>Party</label>
                              <input value={candidateForm.party} onChange={(e) => setCandidateForm({ ...candidateForm, party: e.target.value })} />
                            </div>
                            <div className="field">
                              <label>Candidate photo</label>
                              <input type="file" accept="image/*" onChange={selectCandidatePhoto} />
                            </div>
                            <div className="field">
                              <label>Course</label>
                              <input value={candidateForm.course} onChange={(e) => setCandidateForm({ ...candidateForm, course: e.target.value })} />
                            </div>
                            <div className="field">
                              <label>Year level</label>
                              <input value={candidateForm.yearLevel} onChange={(e) => setCandidateForm({ ...candidateForm, yearLevel: e.target.value })} />
                            </div>
                            <div className="field full">
                              <label>Biography</label>
                              <textarea value={candidateForm.biography} onChange={(e) => setCandidateForm({ ...candidateForm, biography: e.target.value })} />
                            </div>
                            <div className="form-actions">
                              <button type="submit" className="btn btn-primary btn-icon">
                                {Icons.plus} {editingCandidateId ? "Update candidate" : "Add candidate"}
                              </button>
                              {editingCandidateId && (
                                <button type="button" className="btn btn-outline" onClick={() => setEditingCandidateId(null)}>Cancel edit</button>
                              )}
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}