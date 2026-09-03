import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api } from "../../api/axios";

interface CandidateResult {
  candidate: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  votes: number;
  percentage: number;
}

interface PositionResult {
  position: { _id: string; name: string };
  candidates: CandidateResult[];
  winner: CandidateResult | null;
}

interface ResultsData {
  election: { title: string; status: string };
  totalVotes: number;
  results: PositionResult[];
}

export default function Results() {
  const { id } = useParams();
  const [data, setData] = useState<ResultsData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadResults() {
      try {
        const response = await api.get(
          `/elections/${id}/results`,
        );
        setData(response.data.data);
      } catch (requestError: any) {
        setError(
          requestError?.response?.data?.message ??
            "Unable to load results.",
        );
      }
    }

    if (id) {
      loadResults();
    }
  }, [id]);

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (!data) {
    return <p>Loading results...</p>;
  }

  return (
    <main>
      <h1>{data.election.title}</h1>
      <p>Total votes: {data.totalVotes}</p>

      {data.results.map((result) => {
        const chartData = result.candidates.map((item) => ({
          name: `${item.candidate.firstName} ${item.candidate.lastName}`,
          votes: item.votes,
        }));

        return (
          <section key={result.position._id}>
            <h2>{result.position.name}</h2>

            {result.candidates.map((item) => (
              <article key={item.candidate._id}>
                <h3>
                  {item.candidate.firstName} {item.candidate.lastName}
                </h3>
                <p>Votes: {item.votes}</p>
                <p>Percentage: {item.percentage.toFixed(0)}%</p>
              </article>
            ))}

            {result.winner && (
              <p>
                <strong>Winner</strong>{" "}
                {result.winner.candidate.firstName}{" "}
                {result.winner.candidate.lastName}
              </p>
            )}

            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="votes" fill="#0f766e" />
              </BarChart>
            </ResponsiveContainer>
          </section>
        );
      })}
    </main>
  );
}
