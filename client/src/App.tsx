import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import VoterDashboard from "./pages/voter/VoterDashboard";
import VotingPage from "./pages/voter/VotingPage";
import ReviewVote from "./pages/voter/ReviewVote";
import VoteSuccess from "./pages/voter/VoteSuccess";
import AdminDashboard from "./pages/voter/admin/AdminDashboard";
import Elections from "./pages/admin/Elections";
import MyVotes from "./pages/voter/MyVotes";
import Results from "./pages/voter/Results";
import ResultsIndex from "./pages/voter/ResultsIndex";
import Voters from "./pages/admin/Voters";

import { ProtectedRoute } from "./routes/ProtectedRoute";
import { AdminRoute } from "./routes/AdminRoute";

function Unauthorized() {
  return (
    <h1>
      Unauthorized
    </h1>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={
              <Register />
            }
          />

          <Route
            path="/unauthorized"
            element={
              <Unauthorized />
            }
          />

          <Route element={
            <ProtectedRoute />
          }>
            <Route
              path="/voter/dashboard"
              element={
                <VoterDashboard />
              }
            />

            <Route
              path="/voter/elections/:id/vote"
              element={
                <VotingPage />
              }
            />

            <Route
              path="/voter/elections/:id/review"
              element={
                <ReviewVote />
              }
            />

            <Route
              path="/voter/elections/:id/success"
              element={
                <VoteSuccess />
              }
            />

            <Route
              path="/voter/elections/:id/results"
              element={
                <Results />
              }
            />

            <Route
              path="/voter/my-votes"
              element={
                <MyVotes />
              }
            />

            <Route
              path="/voter/results"
              element={
                <ResultsIndex />
              }
            />

            <Route element={
              <AdminRoute />
            }>
              <Route
                path="/admin/dashboard"
                element={
                  <AdminDashboard />
                }
              />

              <Route
                path="/admin/elections"
                element={
                  <Elections />
                }
              />

              <Route
                path="/admin/voters"
                element={
                  <Voters />
                }
              />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}