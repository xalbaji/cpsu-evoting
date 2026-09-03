import {
  useEffect,
  useState,
} from "react";

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
  const { user, logout } =
    useAuth();

  const [elections, setElections] =
    useState<Election[]>([]);

  useEffect(() => {
    api.get("/elections")
      .then((response) => {
        setElections(
          response.data.data,
        );
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
      <header>
        <h1>
          CPSU E-Voting
        </h1>

        <div>
          <span>
            {user?.firstName}{" "}
            {user?.lastName}
          </span>

          <button
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

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

          {active.length ===
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

                  <a
                    href={`/voter/elections/${election._id}/vote`}
                  >
                    Vote Now
                  </a>
                </article>
              ),
            )
          )}
        </section>
      </main>
    </div>
  );
}