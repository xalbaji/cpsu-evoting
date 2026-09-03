import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/BrandLogo";

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink className="brand" to={isAdmin ? "/admin/dashboard" : "/voter/dashboard"}>
          <BrandLogo />
        </NavLink>

        <div className="header-account">
          <span>{user?.firstName} {user?.lastName}</span>
          <button type="button" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <div className="shell-body">
        <aside className="sidebar">
          <p className="sidebar-label">{isAdmin ? "Administration" : "Voter portal"}</p>
          <nav className="sidebar-nav">
            {isAdmin ? (
              <>
                <NavLink to="/admin/dashboard">Dashboard</NavLink>
                <NavLink to="/admin/elections">Elections</NavLink>
                <NavLink to="/admin/voters">Voters</NavLink>
                <NavLink to="/admin/audit-logs">Audit logs</NavLink>
                <NavLink to="/admin/results">Results</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/voter/dashboard">Dashboard</NavLink>
                <NavLink to="/voter/my-votes">My votes</NavLink>
                <NavLink to="/voter/results">Results</NavLink>
                <NavLink to="/profile">Profile</NavLink>
              </>
            )}
          </nav>
        </aside>

        <div className="shell-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
