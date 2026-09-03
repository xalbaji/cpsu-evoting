import { useEffect, useState } from "react";

import { api } from "../../api/axios";

interface Vote {
  _id: string;
  voteReference: string;
  submittedAt: string;
  electionId: {
    title: string;
    status: string;
  };
}

export default function MyVotes() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadVotes() {
      try {
        const response = await api.get(
          "/votes/my-status",
        );
        setVotes(response.data.data);
      } catch {
        setError("Unable to load your voting history.");
      }
    }

    loadVotes();
  }, []);

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <main>
      <h1>My Votes</h1>
      {votes.length === 0 ? (
        <p>No votes recorded.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Election</th>
              <th>Status</th>
              <th>Date</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {votes.map((vote) => (
              <tr key={vote._id}>
                <td>{vote.electionId.title}</td>
                <td>Voted</td>
                <td>{new Date(vote.submittedAt).toLocaleString()}</td>
                <td>{vote.voteReference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
