import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAuth } from "../lib/auth-context";

export function AdminRoute() {
  const { user } =
    useAuth();

  if (user?.role !== "ADMIN") {
    return (
      <Navigate
        to="/unauthorized"
        replace
      />
    );
  }

  return <Outlet />;
}
