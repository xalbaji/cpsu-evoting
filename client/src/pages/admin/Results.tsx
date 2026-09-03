import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../api/axios";

interface Election {
  _id: string;
  title: string;
  status: string;
}

export default function AdminResults() {
  const [elections, setElections] = useState<Election[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/elections")
      .then((response) => setElections(response.data.data))
      .catch(() => setError("Unable to load elections."));
  }, []);

  return (
    <main>
      <h1>Election Results</h1>
      {error && <p role="alert">{error}</p>}
      {elections.length === 0 && !error && <p>No elections available.</p>}
      {elections.map((election) => (
        <article key={election._id}>
          <h2>{election.title}</h2>
          <p>Status: {election.status}</p>
          <Link to={`/voter/elections/${election._id}/results`}>
            View statistics
          </Link>
        </article>
      ))}
    </main>
  );
}
