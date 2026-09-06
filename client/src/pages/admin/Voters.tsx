import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "../../components/BrandLogo";

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

/* ─── Icons (shared across admin pages) ─── */
const Icons = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  elections: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  voters: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  audit: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  results: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
  menu: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  upload: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
  chevronLeft: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  chevronRight: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
};

const NAV_ITEMS = [
  { path: "/admin/dashboard", label: "Dashboard", icon: Icons.dashboard },
  { path: "/admin/elections", label: "Elections", icon: Icons.elections },
  { path: "/admin/voters", label: "Voters", icon: Icons.voters },
    { path: "/admin/audit-logs", label: "Audit Logs", icon: Icons.audit },
  { path: "/admin/results", label: "Results", icon: Icons.results },
];

/* ─── Badges ─── */
function StatusPill({ active }: { active: boolean }) {
  return (
    <span className="pill" style={{ color: active ? "#0d9488" : "#94a3b8", background: active ? "#f0fdfa" : "#f1f5f9" }}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function VerifiedPill({ verified }: { verified: boolean }) {
  return (
    <span className="pill" style={{ color: verified ? "#2563eb" : "#d97706", background: verified ? "#dbeafe" : "#fef3c7" }}>
      {verified ? "Yes" : "No"}
    </span>
  );
}

function VotedPill({ voted }: { voted: boolean }) {
  return (
    <span className="pill" style={{ color: voted ? "#0d9488" : "#64748b", background: voted ? "#f0fdfa" : "#f1f5f9" }}>
      {voted ? "Voted" : "Not voted"}
    </span>
  );
}

export default function Voters() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [voters, setVoters] = useState<Voter[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  async function loadVoters() {
    setLoading(true);
    try {
      const response = await api.get("/users", { params: { search, page, limit: 10 } });
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

  async function updateVoter(voter: Voter, field: "isActive" | "isVerified") {
    setUpdating(voter._id);
    setMessage("");
    try {
      await api.patch(`/users/${voter._id}`, { [field]: !voter[field] });
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

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/users/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(`Imported ${response.data.data.imported} voters; rejected ${response.data.data.rejected}.`);
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

        .panel { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); margin-bottom: 22px; }
        .panel-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; }

        /* Search + import row */
        .toolbar { display: flex; gap: 14px; align-items: flex-end; flex-wrap: wrap; }
        .toolbar-field { flex: 1; min-width: 220px; display: flex; flex-direction: column; gap: 6px; }
        .toolbar-field label { font-size: 0.78rem; font-weight: 600; color: #334155; }
        .search-row { display: flex; gap: 10px; }
        .search-row input { flex: 1; border: 1px solid #cbd5e1; border-radius: 9px; padding: 10px 14px; font-size: 0.88rem; font-family: inherit; box-sizing: border-box; }
        .search-row input:focus { outline: none; border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.12); }
        .import-field { display: flex; flex-direction: column; gap: 6px; }
        .import-field label { font-size: 0.78rem; font-weight: 600; color: #334155; }
        .file-input-wrap { position: relative; }
        .file-input-wrap input[type="file"] { border: 1px solid #cbd5e1; border-radius: 9px; padding: 8px 12px; font-size: 0.82rem; font-family: inherit; background: #fff; cursor: pointer; }

        /* Buttons */
        .btn { border: none; border-radius: 9px; padding: 10px 20px; font-size: 0.85rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; display: inline-flex; align-items: center; gap: 7px; }
        .btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .btn-primary { background: #0d9488; color: white; }
        .btn-primary:hover:not(:disabled) { background: #0f766e; }
        .btn-outline { background: #fff; color: #334155; border: 1px solid #cbd5e1; }
        .btn-outline:hover:not(:disabled) { background: #f8fafc; border-color: #94a3b8; }
        .btn-danger { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .btn-danger:hover:not(:disabled) { background: #fee2e2; }
        .btn-sm { padding: 6px 12px; font-size: 0.76rem; border-radius: 7px; }

        .message-banner { background: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; border-radius: 9px; padding: 10px 14px; font-size: 0.85rem; margin-bottom: 16px; }

        /* Table */
        .table-wrap { overflow-x: auto; }
        table.voters-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .voters-table thead th { text-align: left; color: #94a3b8; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 14px; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
        .voters-table tbody td { padding: 14px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; white-space: nowrap; }
        .voters-table tbody tr:hover { background: #f8fafc; }
        .voter-name { font-weight: 600; color: #0f172a; }
        .pill { font-size: 0.7rem; font-weight: 700; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
        .row-actions { display: flex; gap: 6px; flex-wrap: wrap; }

        .empty-state, .loading-state { text-align: center; color: #94a3b8; font-size: 0.9rem; padding: 30px 0; }

        /* Pagination */
        .pagination { display: flex; align-items: center; gap: 6px; margin-top: 18px; flex-wrap: wrap; }
        .page-btn { border: 1px solid #cbd5e1; background: #fff; color: #334155; border-radius: 8px; padding: 7px 13px; font-size: 0.82rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .page-btn:hover:not(:disabled) { background: #f8fafc; border-color: #94a3b8; }
        .page-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .page-btn.active { background: #0d9488; border-color: #0d9488; color: #fff; }

        @media (max-width: 768px) {
          .menu-btn { display: flex; }
          .admin-brand { display: none; }
          .admin-sidebar { transform: translateX(-100%); box-shadow: 4px 0 24px rgba(0,0,0,0.15); }
          .admin-sidebar.open { transform: translateX(0); }
          .sidebar-overlay.open { display: block; opacity: 1; pointer-events: auto; }
          .admin-main { margin-left: 0; width: 100%; padding: 20px; }
          .page-header h1 { font-size: 1.3rem; }
          .toolbar { flex-direction: column; align-items: stretch; }
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
              <h1>Voter Management</h1>
              <p>Search, verify, and manage registered voter accounts</p>
            </div>

            {message && <div className="message-banner" role="status">{message}</div>}

            {/* Search + Import */}
            <div className="panel">
              <div className="toolbar">
                <form onSubmit={searchVoters} className="toolbar-field" style={{ flex: 2 }}>
                  <label>Search</label>
                  <div className="search-row">
                    <input value={search} placeholder="Student ID, name, or email" onChange={(e) => setSearch(e.target.value)} />
                    <button type="submit" className="btn btn-primary btn-icon">{Icons.search} Search</button>
                  </div>
                </form>

                <div className="import-field">
                  <label>Import CSV</label>
                  <div className="file-input-wrap">
                    <input type="file" accept=".csv,text/csv" disabled={uploading} onChange={importCsv} />
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="panel">
              <h2 className="panel-title">All Voters {pagination.total > 0 && `(${pagination.total})`}</h2>

              {loading ? (
                <p className="loading-state">Loading voters...</p>
              ) : voters.length === 0 ? (
                <p className="empty-state">No voters found.</p>
              ) : (
                <div className="table-wrap">
                  <table className="voters-table">
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
                          <td className="voter-name">{voter.firstName} {voter.lastName}</td>
                          <td>{voter.email}</td>
                          <td>{voter.course ?? "-"}</td>
                          <td>{voter.yearLevel ?? "-"}</td>
                          <td><StatusPill active={voter.isActive} /></td>
                          <td><VerifiedPill verified={voter.isVerified} /></td>
                          <td><VotedPill voted={voter.hasVoted} /></td>
                          <td>
                            <div className="row-actions">
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                disabled={updating === voter._id}
                                onClick={() => updateVoter(voter, "isActive")}
                              >
                                {voter.isActive ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                disabled={updating === voter._id}
                                onClick={() => updateVoter(voter, "isVerified")}
                              >
                                {voter.isVerified ? "Unverify" : "Verify"}
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                disabled={updating === voter._id}
                                onClick={() => deleteVoter(voter._id)}
                              >
                                {Icons.trash}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              <nav aria-label="Voter pages" className="pagination">
                <button type="button" className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  {Icons.chevronLeft}
                </button>
                {Array.from({ length: pagination.pages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    type="button"
                    key={pageNumber}
                    className={`page-btn ${pageNumber === page ? "active" : ""}`}
                    aria-current={pageNumber === page ? "page" : undefined}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button type="button" className="page-btn" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>
                  {Icons.chevronRight}
                </button>
              </nav>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}