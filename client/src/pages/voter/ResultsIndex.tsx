import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../api/axios";

interface Election {
  _id: string;
  title: string;
  academicYear: string;
  status: string;
}

export default function ResultsIndex() {
  const [elections, setElections] = useState<Election[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/elections")
      .then((response) => {
        setElections(
          response.data.data.filter(
            (election: Election) =>
              election.status === "RESULTS_PUBLISHED",
          ),
        );
      })
      .catch(() => {
        setError("Unable to load published results.");
      });
  }, []);

  return (
    <main>
      <h1>Published Results</h1>
      {error && <p role="alert">{error}</p>}
      {!error && elections.length === 0 && (
        <p>No published results are available.</p>
      )}
      {elections.map((election) => (
        <article key={election._id}>
          <h2>{election.title}</h2>
          <p>Academic year: {election.academicYear}</p>
          <Link to={`/voter/elections/${election._id}/results`}>
            View results
          </Link>
        </article>
      ))}
    </main>
  );
}
