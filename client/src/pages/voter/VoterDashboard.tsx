import {
  useEffect,
  useState,
} from "react";
import { Link } from "react-router-dom";

import { api } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

interface Election {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
}

export default function VoterDashboard() {
  const { user } =
    useAuth();

  const [elections, setElections] =
    useState<Election[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  useEffect(() => {
    api.get("/elections")
      .then((response) => {
        setElections(
          response.data.data,
        );
      })
      .catch(() => {
        setError("Unable to load elections.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const active =
    elections.filter(
      (election) =>
        election.status ===
        "ACTIVE",
    );

  return (
    <div>
      <main>
        <h2>
          Welcome,{" "}
          {user?.firstName}
        </h2>

        <section>
          <div>
            <h3>
              Active Elections
            </h3>

            <strong>
              {active.length}
            </strong>
          </div>

          <div>
            <h3>
              Elections
            </h3>

            <strong>
              {elections.length}
            </strong>
          </div>
        </section>

        <section>
          <h2>
            Active Elections
          </h2>

          {error ? (
            <p role="alert">{error}</p>
          ) : loading ? (
            <p>Loading elections...</p>
          ) : active.length ===
          0 ? (
            <p>
              No active elections.
            </p>
          ) : (
            active.map(
              (election) => (
                <article
                  key={
                    election._id
                  }
                >
                  <h3>
                    {
                      election.title
                    }
                  </h3>

                  <p>
                    {
                      election.description
                    }
                  </p>

                  <Link
                    to={`/voter/elections/${election._id}/vote`}
                  >
                    Vote Now
                  </Link>
                </article>
              ),
            )
          )}
        </section>
      </main>
    </div>
  );
}