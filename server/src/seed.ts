import dotenv from "dotenv";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { connectDatabase } from "./config/database.js";
import { User } from "./models/User.js";
import { Election } from "./models/Election.js";
import { Position } from "./models/Position.js";
import { Candidate } from "./models/Candidate.js";
import { Vote } from "./models/Vote.js";
import { VoteSelection } from "./models/VoteSelection.js";
import { AuditLog } from "./models/AuditLog.js";

dotenv.config();

const demoPassword =
  process.env.SEED_PASSWORD ?? "Admin12345!";
const electionStart = new Date("2026-09-01T08:00:00.000Z");
const electionEnd = new Date("2026-09-30T17:00:00.000Z");

async function seed() {
  await connectDatabase();

  await Promise.all([
    User.deleteMany({}),
    Election.deleteMany({}),
    Position.deleteMany({}),
    Candidate.deleteMany({}),
    Vote.deleteMany({}),
    VoteSelection.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
  console.log("Database cleared");

  const passwordHash = await bcrypt.hash(demoPassword, 12);
  const [admin] = await User.create([
    {
      studentId: "ADMIN-0001",
      firstName: "CPSU",
      lastName: "Administrator",
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@cpsu.edu",
      passwordHash,
      role: "ADMIN",
      isActive: true,
      isVerified: true,
    },
  ]);
  console.log("Admin created");

  await User.insertMany(
    Array.from({ length: 10 }, (_, index) => ({
      studentId: `2026-${String(index + 1).padStart(4, "0")}`,
      firstName: [
        "Juan",
        "Maria",
        "Liam",
        "Sofia",
        "Noah",
        "Mia",
        "Ethan",
        "Ava",
        "Lucas",
        "Zoe",
      ][index],
      lastName: "CPSU",
      email: `voter${index + 1}@cpsu.edu`,
      passwordHash,
      role: "VOTER",
      course: "BSIT",
      yearLevel: String((index % 4) + 1),
      isActive: true,
      isVerified: true,
    })),
  );
  console.log("Demo voters created");

  const election = await Election.create({
    title: "CPSU Student Council Election 2026",
    description: "Student Council elections for academic year 2026.",
    academicYear: "2026",
    startDate: electionStart,
    endDate: electionEnd,
    status: "ACTIVE",
    createdBy: admin._id,
    resultsPublished: false,
  });
  console.log("Election created");

  const positionNames = [
    "President",
    "Vice President",
    "Secretary",
    "Treasurer",
    "Auditor",
    "PIO",
  ];
  const positions = await Position.insertMany(
    positionNames.map((name, index) => ({
      electionId: election._id,
      name,
      order: index + 1,
      votingType: "SINGLE",
      maxSelections: 1,
    })),
  );
  console.log("Positions created");

  await Candidate.insertMany(
    positions.flatMap((position, positionIndex) =>
      ["Santos", "Reyes", "Dela Cruz"].map(
        (lastName, candidateIndex) => ({
          electionId: election._id,
          positionId: position._id,
          candidateNumber: String(candidateIndex + 1),
          firstName: ["Alex", "Bea", "Carlo"][candidateIndex],
          lastName,
          course: "BSIT",
          yearLevel: String((positionIndex % 4) + 1),
          party: "CPSU Forward",
          isActive: true,
        }),
      ),
    ),
  );
  console.log("Candidates created");
  console.log("Seed complete");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
