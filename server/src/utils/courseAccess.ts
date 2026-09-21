import { User } from "../models/User.js";
import { normalizeCourse } from "../constants/courses.js";

type AccessUser = {
  role: string;
  email?: string;
  studentId?: string;
  firstName?: string;
  lastName?: string;
  course?: string;
  managedCourses?: string[];
  isSuperAdmin?: boolean;
};

export async function getAccessUser(userId: string): Promise<AccessUser | null> {
  return User.findById(userId).select("role email studentId firstName lastName course managedCourses isSuperAdmin");
}

export function managedCourseCodes(user: AccessUser): string[] {
  return Array.from(new Set(
    (user.managedCourses ?? []).map(normalizeCourse).filter(Boolean),
  ));
}

export function isCpsuAdministrator(user: AccessUser): boolean {
  return user.email?.trim().toLowerCase() === "admin@cpsu.edu"
    || user.studentId === "ADMIN-0001"
    || (user.firstName?.trim().toLowerCase() === "cpsu" && user.lastName?.trim().toLowerCase() === "administrator");
}

export function isSuperAdmin(user: AccessUser): boolean {
  return user.role === "ADMIN" && (
    user.isSuperAdmin === true ||
    isCpsuAdministrator(user)
  );
}

export function canManageCourse(user: AccessUser, course: unknown): boolean {
  if (user.role !== "ADMIN") return false;
  if (isSuperAdmin(user)) return true;
  const requestedCourses = Array.isArray(course)
    ? course.map(normalizeCourse)
    : [normalizeCourse(course)];
  return requestedCourses.some((requestedCourse) => managedCourseCodes(user).includes(requestedCourse));
}

export function courseMatches(userCourse: unknown, electionCourse: unknown): boolean {
  const voterCourse = normalizeCourse(userCourse);
  const targetCourses = Array.isArray(electionCourse)
    ? electionCourse.map(normalizeCourse)
    : [normalizeCourse(electionCourse)];
  return Boolean(voterCourse && targetCourses.includes(voterCourse));
}

export function electionCourseCodes(election: { course?: unknown; courses?: unknown }): string[] {
  const selected = Array.isArray(election.courses) && election.courses.length > 0
    ? election.courses
    : election.course ? [election.course] : [];
  return Array.from(new Set(selected.map(normalizeCourse).filter(Boolean)));
}

export function adminElectionFilter(user: AccessUser): Record<string, unknown> {
  if (isSuperAdmin(user)) return {};
  const courses = managedCourseCodes(user);
  return {
    $or: [
      { course: { $in: courses } },
      { courses: { $in: courses } },
    ],
  };
}

export function isElectionVisibleToVoters(status: unknown): boolean {
  return ["SCHEDULED", "ACTIVE", "CLOSED", "RESULTS_PUBLISHED"].includes(String(status).toUpperCase());
}
