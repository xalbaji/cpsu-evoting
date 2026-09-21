import type { User } from "./auth.types";

// Keep the client-side navigation rule aligned with the server's legacy
// super-admin fallback for the seeded CPSU Administrator account.
export function hasSuperAdminAccess(user?: User | null): boolean {
  if (!user || user.role !== "ADMIN") return false;
  return user.isSuperAdmin === true
    || user.email.trim().toLowerCase() === "admin@cpsu.edu"
    || user.studentId === "ADMIN-0001"
    || (user.firstName.trim().toLowerCase() === "cpsu" && user.lastName.trim().toLowerCase() === "administrator");
}

export function displayAccountName(user?: User | null, fallback = "Account"): string {
  const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  return name || fallback;
}

export function adminRoleLabel(user?: User | null): string {
  return hasSuperAdminAccess(user) ? "Super Admin" : "Course Moderator";
}
