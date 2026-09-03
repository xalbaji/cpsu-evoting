import {
  useEffect,
  useState,
} from "react";

import { api } from "../../../api/axios";

interface Stats {
  totalVoters: number;
  activeElections: number;
  completedElections: number;
  totalVotes: number;
  voterTurnout: number;
}

export default function AdminDashboard() {
  const [stats, setStats] =
    useState<Stats | null>(
      null,
    );
  const [error, setError] =
    useState("");

  useEffect(() => {
    api.get(
      "/admin/dashboard",
    )
      .then((response: any) => {
        setStats(
          response.data.data,
        );
      })
      .catch(() => {
        setError("Unable to load dashboard statistics.");
      });
  }, []);

  if (error) {
    return <main><p role="alert">{error}</p></main>;
  }

  if (!stats) {
    return <p>Loading...</p>;
  }

  return (
    <main>
      <h1>
        Admin Dashboard
      </h1>

      <div>
        <article>
          <h3>
            Total Voters
          </h3>
          <strong>
            {
              stats.totalVoters
            }
          </strong>
        </article>

        <article>
          <h3>
            Active Elections
          </h3>
          <strong>
            {
              stats.activeElections
            }
          </strong>
        </article>

        <article>
          <h3>
            Completed
          </h3>
          <strong>
            {
              stats.completedElections
            }
          </strong>
        </article>

        <article>
          <h3>
            Votes Cast
          </h3>
          <strong>
            {
              stats.totalVotes
            }
          </strong>
        </article>

        <article>
          <h3>
            Voter Turnout
          </h3>
          <strong>
            {stats.voterTurnout.toFixed(
              2,
            )}
            %
          </strong>
        </article>
      </div>
    </main>
  );
}