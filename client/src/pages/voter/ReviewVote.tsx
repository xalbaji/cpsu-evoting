import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import { api } from "../../api/axios";

export default function ReviewVote() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const { id } =
    useParams();

  const {
    selections,
    positions,
  } = location.state ?? {};

  if (!selections) {
    return (
      <div>
        <p>
          Ballot information
          is missing.
        </p>

        <button
          onClick={() =>
            navigate(
              `/voter/elections/${id}/vote`,
            )
          }
        >
          Return to Ballot
        </button>
      </div>
    );
  }

  async function submitVote() {
    const formatted =
      Object.entries(
        selections,
      ).map(
        ([
          positionId,
          candidateIds,
        ]) => ({
          positionId,
          candidateIds,
        }),
      );

    const response =
      await api.post(
        `/elections/${id}/vote`,
        {
          selections:
            formatted,
        },
      );

    navigate(
      `/voter/elections/${id}/success`,
      {
        state: response.data.data,
      },
    );
  }

  return (
    <main>
      <h1>
        Review Your Ballot
      </h1>

      {positions.map(
        (position: any) => {
          const selected =
            selections[
              position.id
            ] ?? [];

          return (
            <section
              key={
                position.id
              }
            >
              <h2>
                {
                  position.name
                }
              </h2>

              {selected.length ===
              0 ? (
                <p>
                  No selection
                </p>
              ) : (
                selected.map(
                  (
                    candidateId: string,
                  ) => {
                    const candidate =
                      position.candidates.find(
                        (
                          item: any,
                        ) =>
                          item._id ===
                          candidateId,
                      );

                    return (
                      <p
                        key={
                          candidateId
                        }
                      >
                        {
                          candidate
                            ?.firstName
                        }{" "}
                        {
                          candidate
                            ?.lastName
                        }
                      </p>
                    );
                  },
                )
              )}
            </section>
          );
        },
      )}

      <div>
        <button
          onClick={() =>
            navigate(
              `/voter/elections/${id}/vote`,
            )
          }
        >
          Change Vote
        </button>

        <button
          onClick={
            submitVote
          }
        >
          Confirm & Submit
        </button>
      </div>

      <p>
        Once submitted,
        your vote cannot be
        changed.
      </p>
    </main>
  );
}