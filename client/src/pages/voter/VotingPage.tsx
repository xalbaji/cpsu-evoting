import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { api } from "../../api/axios";

interface Candidate {
  _id: string;
  firstName: string;
  lastName: string;
  candidateNumber: string;
  photoUrl?: string;
  party?: string;
  course?: string;
  yearLevel?: string;
  biography?: string;
}

interface Position {
  id: string;
  name: string;
  votingType: "SINGLE" | "MULTIPLE";
  maxSelections: number;
  candidates: Candidate[];
}

export default function VotingPage() {
  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const [positions, setPositions] =
    useState<Position[]>([]);

  const [selections, setSelections] =
    useState<
      Record<string, string[]>
    >({});

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    api.get(
      `/elections/${id}/ballot`,
    )
      .then((response) => {
        setPositions(
          response.data.data
            .positions,
        );
      })
      .finally(() =>
        setLoading(false),
      );
  }, [id]);

  function toggleCandidate(
    position: Position,
    candidateId: string,
  ) {
    setSelections(
      (current) => {
        const existing =
          current[position.id] ??
          [];

        if (
          position.votingType ===
          "SINGLE"
        ) {
          return {
            ...current,
            [position.id]: [
              candidateId,
            ],
          };
        }

        if (
          existing.includes(
            candidateId,
          )
        ) {
          return {
            ...current,
            [position.id]:
              existing.filter(
                (id) =>
                  id !==
                  candidateId,
              ),
          };
        }

        if (
          existing.length >=
          position.maxSelections
        ) {
          return current;
        }

        return {
          ...current,
          [position.id]: [
            ...existing,
            candidateId,
          ],
        };
      },
    );
  }

  function reviewVote() {
    navigate(
      `/voter/elections/${id}/review`,
      {
        state: {
          selections,
          positions,
        },
      },
    );
  }

  if (loading) {
    return <p>Loading ballot...</p>;
  }

  return (
    <main>
      <h1>
        Election Ballot
      </h1>

      {positions.map(
        (position) => (
          <section
            key={
              position.id
            }
          >
            <h2>
              {position.name}
            </h2>

            <p>
              Choose up to{" "}
              {
                position.maxSelections
              }
            </p>

            {position.candidates.map(
              (candidate) => {
                const selected =
                  (
                    selections[
                      position.id
                    ] ?? []
                  ).includes(
                    candidate._id,
                  );

                return (
                  <button
                    type="button"
                    key={
                      candidate._id
                    }
                    onClick={() =>
                      toggleCandidate(
                        position,
                        candidate._id,
                      )
                    }
                    className={`candidate-card${
                      selected
                        ? " selected"
                        : ""
                    }`}
                  >
                    <strong>
                      {
                        candidate.firstName
                      }{" "}
                      {
                        candidate.lastName
                      }
                    </strong>

                    <span>
                      #
                      {
                        candidate.candidateNumber
                      }
                    </span>

                    <small>
                      {
                        candidate.party
                      }
                    </small>
                  </button>
                );
              },
            )}
          </section>
        ),
      )}

      <button
        onClick={
          reviewVote
        }
      >
        Review Ballot
      </button>
    </main>
  );
}