export interface CourseOption {
  code: string;
  name: string;
  college: string;
}

// Keep this catalog aligned with server/src/constants/courses.ts.
export const CPSU_MAIN_COURSES: CourseOption[] = [
  { code: "BEED", name: "Bachelor in Elementary Education", college: "College of Teacher Education" },
  { code: "BSED", name: "Bachelor in Secondary Education", college: "College of Teacher Education" },
  { code: "BSED-ENGLISH", name: "Bachelor of Secondary Education major in English", college: "College of Teacher Education" },
  { code: "BSED-FILIPINO", name: "Bachelor of Secondary Education major in Filipino", college: "College of Teacher Education" },
  { code: "BSED-MATH", name: "Bachelor of Secondary Education major in Mathematics", college: "College of Teacher Education" },
  { code: "BSED-SCIENCE", name: "Bachelor of Secondary Education major in Science", college: "College of Teacher Education" },
  { code: "BPED", name: "Bachelor in Physical Education", college: "College of Teacher Education" },
  { code: "BECED", name: "Bachelor in Early Childhood Education", college: "College of Teacher Education" },
  { code: "BSAG", name: "Bachelor of Science in Agriculture", college: "College of Agriculture and Forestry" },
  { code: "BSAS", name: "Bachelor in Animal Science", college: "College of Agriculture and Forestry" },
  { code: "BSAB", name: "Bachelor of Science in Agribusiness", college: "College of Agriculture and Forestry" },
  { code: "BSF", name: "Bachelor of Science in Forestry", college: "College of Agriculture and Forestry" },
  { code: "BST", name: "Bachelor in Sugar Technology", college: "College of Agriculture and Forestry" },
  { code: "AB-ENGLISH", name: "Bachelor of Arts in English", college: "College of Arts and Sciences" },
  { code: "AB-SOCIAL-SCIENCE", name: "Bachelor of Arts in Social Science", college: "College of Arts and Sciences" },
  { code: "BSSTAT", name: "Bachelor of Science in Statistics", college: "College of Arts and Sciences" },
  { code: "BSHRM", name: "Bachelor of Science in Hotel and Restaurant Management", college: "College of Business and Hospitality Management" },
  { code: "BSIT", name: "Bachelor of Science in Information Technology", college: "College of Information and Computing Studies" },
  { code: "BSCRIM", name: "Bachelor of Science in Criminology", college: "College of Criminal Justice Education" },
  { code: "BSABE", name: "Bachelor of Science in Agricultural and Biosystems Engineering", college: "College of Engineering" },
  { code: "BSME", name: "Bachelor of Science in Mechanical Engineering", college: "College of Engineering" },
  { code: "BSEE", name: "Bachelor of Science in Electrical Engineering", college: "College of Engineering" },
];

export const COURSE_CODES = CPSU_MAIN_COURSES.map((course) => course.code);
