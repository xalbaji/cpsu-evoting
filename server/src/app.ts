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
import auditRoutes from "./routes/audit.routes.js";

const app = express();
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(
  (origin): origin is string => Boolean(origin),
);

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "CPSU E-Voting API is running",
  });
});

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
app.use("/api/audit-logs", auditRoutes);
app.use(errorHandler);

export default app;