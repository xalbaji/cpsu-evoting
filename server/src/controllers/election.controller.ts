import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { Election } from "../models/Election.js";
import { createAuditLog } from "../utils/audit.js";

export async function getElections(
  _req: AuthRequest,
  res: Response,
) {
  const elections = await Election.find()
    .sort({ startDate: -1 });

  return res.json({
    success: true,
    data: elections,
  });
}

export async function getElection(
  req: AuthRequest,
  res: Response,
) {
  const election = await Election.findById(
    req.params.id,
  );

  if (!election) {
    return res.status(404).json({
      success: false,
      message: "Election not found",
    });
  }

  return res.json({
    success: true,
    data: election,
  });
}

export async function createElection(
  req: AuthRequest,
  res: Response,
) {
  const {
    title,
    description,
    academicYear,
    startDate,
    endDate,
  } = req.body;

  if (
    new Date(endDate) <= new Date(startDate)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "End date must be after start date",
    });
  }

  const election = await Election.create({
    title,
    description,
    academicYear,
    startDate,
    endDate,
    createdBy: req.user!.userId,
    status: "DRAFT",
    resultsPublished: false,
  });

  await createAuditLog({
    userId: req.user?.userId,
    action: "ELECTION_CREATED",
    resource: "Election",
    resourceId: election._id.toString(),
    description:
      `Created election "${election.title}"`,
    ipAddress: req.ip,
  });

  return res.status(201).json({
    success: true,
    data: election,
  });
}

export async function openElection(
  req: AuthRequest,
  res: Response,
) {
  const election = await Election.findById(
    req.params.id,
  );

  if (!election) {
    return res.status(404).json({
      success: false,
      message: "Election not found",
    });
  }

  if (
    election.status !== "DRAFT" &&
    election.status !== "SCHEDULED"
  ) {
    return res.status(400).json({
      success: false,
      message: "Election cannot be opened",
    });
  }

  election.status = "ACTIVE";

  await election.save();

  return res.json({
    success: true,
    message: "Election is now active",
    data: election,
  });
}

export async function closeElection(
  req: AuthRequest,
  res: Response,
) {
  const election = await Election.findById(
    req.params.id,
  );

  if (!election) {
    return res.status(404).json({
      success: false,
      message: "Election not found",
    });
  }

  if (election.status !== "ACTIVE") {
    return res.status(400).json({
      success: false,
      message:
        "Only active elections can be closed",
    });
  }

  election.status = "CLOSED";

  await election.save();

  return res.json({
    success: true,
    message: "Election closed",
    data: election,
  });
}

export async function publishResults(
  req: AuthRequest,
  res: Response,
) {
  const election =
    await Election.findById(
      req.params.id,
    );

  if (!election) {
    return res.status(404).json({
      success: false,
      message: "Election not found",
    });
  }

  if (
    election.status !==
    "CLOSED"
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Election must be closed before publishing results",
    });
  }

  election.status =
    "RESULTS_PUBLISHED";

  election.resultsPublished =
    true;

  await election.save();

  return res.json({
    success: true,
    message:
      "Results published",
    data: election,
  });
}

export async function updateElection(
  req: AuthRequest,
  res: Response,
) {
  const election = await Election.findById(req.params.id);

  if (!election) {
    return res.status(404).json({ success: false, message: "Election not found" });
  }

  if (!["DRAFT", "SCHEDULED"].includes(election.status)) {
    return res.status(400).json({ success: false, message: "Only draft or scheduled elections can be edited" });
  }

  const { title, description, academicYear, startDate, endDate } = req.body;
  if (new Date(endDate) <= new Date(startDate)) {
    return res.status(400).json({ success: false, message: "End date must be after start date" });
  }

  election.title = title;
  election.description = description;
  election.academicYear = academicYear;
  election.startDate = startDate;
  election.endDate = endDate;
  await election.save();

  await createAuditLog({
    userId: req.user?.userId,
    action: "ELECTION_UPDATED",
    resource: "Election",
    resourceId: election._id.toString(),
    description: `Updated election "${election.title}"`,
    ipAddress: req.ip,
  });

  return res.json({ success: true, data: election });
}

export async function scheduleElection(
  req: AuthRequest,
  res: Response,
) {
  const election = await Election.findById(req.params.id);
  if (!election) return res.status(404).json({ success: false, message: "Election not found" });
  if (election.status !== "DRAFT") return res.status(400).json({ success: false, message: "Only draft elections can be scheduled" });
  election.status = "SCHEDULED";
  await election.save();
  return res.json({ success: true, message: "Election scheduled", data: election });
}

export async function cancelElection(
  req: AuthRequest,
  res: Response,
) {
  const election = await Election.findById(req.params.id);
  if (!election) return res.status(404).json({ success: false, message: "Election not found" });
  if (!["DRAFT", "SCHEDULED", "CLOSED"].includes(election.status)) return res.status(400).json({ success: false, message: "Election cannot be cancelled in its current state" });
  election.status = "CANCELLED";
  await election.save();
  return res.json({ success: true, message: "Election cancelled", data: election });
}

export async function deleteElection(
  req: AuthRequest,
  res: Response,
) {
  const election = await Election.findById(req.params.id);
  if (!election) return res.status(404).json({ success: false, message: "Election not found" });
  if (election.status !== "DRAFT") return res.status(400).json({ success: false, message: "Only draft elections can be deleted" });
  await election.deleteOne();
  return res.json({ success: true, message: "Election deleted" });
}