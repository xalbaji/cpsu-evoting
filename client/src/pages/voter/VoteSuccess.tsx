import {
  useLocation,
  useNavigate,
} from "react-router-dom";

export default function VoteSuccess() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const data =
    location.state;

  if (!data) {
    return (
      <main>
        <h1>Submission not found</h1>
        <p>Return to the dashboard to view active elections.</p>
        <button onClick={() => navigate("/voter/dashboard")}>
          Return to Dashboard
        </button>
      </main>
    );
  }

  return (
    <main>
      <h1>
        Vote Successfully
        Submitted
      </h1>

      <p>
        Your vote has been
        recorded.
      </p>

      <p>
        Reference:
      </p>

      <strong>
        {data?.voteReference}
      </strong>

      <p>
        Submitted:
      </p>

      <p>
        {new Date(data.submittedAt).toLocaleString()}
      </p>

      <button
        onClick={() =>
          navigate(
            "/voter/dashboard",
          )
        }
      >
        Return to Dashboard
      </button>
    </main>
  );
}