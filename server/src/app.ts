import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import electionRoutes from "./routes/election.routes.js";
import positionRoutes from "./routes/position.routes.js";
import candidateRoutes from "./routes/candidate.routes.js";
import voteRoutes from "./routes/vote.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/api", (_req, res) => {
  res.json({
    success: true,
    message: "CPSU E-Voting API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use(
  "/api/elections",
  electionRoutes,
);
app.use("/api", positionRoutes);
app.use("/api", candidateRoutes);
app.use("/api", voteRoutes);
app.use(
  "/api/admin",
  adminRoutes,
);
app.use(errorHandler);

export default app;