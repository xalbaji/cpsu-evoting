import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "../../lib/api";

interface PrivateCandidate {
  candidateId: string;
  candidateNumber: string;
  name: string;
  party?: string;
  course?: string;
  photoUrl?: string;
}

interface PrivatePosition {
  positionId: string;
  positionName: string;
  candidates: PrivateCandidate[];
}

interface PrivateSelectionsData {
  voteId: string;
  electionId: string;
  submittedAt: string;
  election: {
    _id: string;
    title: string;
    status: string;
    startDate?: string;
    endDate?: string;
  } | null;
  positions: PrivatePosition[];
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

function CandidateAvatar({ candidate }: { candidate: PrivateCandidate }) {
  const initials = candidate.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return candidate.photoUrl ? (
    <img className="private-candidate-avatar" src={candidate.photoUrl} alt="" />
  ) : (
    <span className="private-candidate-avatar private-candidate-initials" aria-hidden="true">{initials || "?"}</span>
  );
}

function formatSubmittedAt(value: string) {
  return new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default function MyVoteSelections() {
  const { voteId } = useParams<{ voteId: string }>();
  const [data, setData] = useState<PrivateSelectionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!voteId) {
        setError("This private vote page is missing its vote reference.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/votes/${voteId}/selections`);
        if (mounted) setData(response.data?.data ?? null);
      } catch (requestError: any) {
        if (mounted) {
          setError(requestError?.response?.data?.message ?? "Unable to load your private selections.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [voteId]);

  const selectedCount = useMemo(
    () => data?.positions.reduce((total, position) => total + position.candidates.length, 0) ?? 0,
    [data],
  );

  if (loading) {
    return (
      <main className="private-selections-page" aria-busy="true">
        <div className="private-selections-skeleton private-selections-skeleton-hero" />
        <div className="private-selections-skeleton private-selections-skeleton-card" />
        <div className="private-selections-skeleton private-selections-skeleton-card" />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="private-selections-page">
        <section className="private-selections-error" role="alert">
          <span className="private-selections-error-icon"><ShieldIcon /></span>
          <p>{error || "These selections are not available."}</p>
          <Link to="/voter/my-votes" className="private-selections-back">Back to My Votes</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="private-selections-page">
      <section className="private-selections-hero">
        <Link to="/voter/my-votes" className="private-selections-back">← Back to My Votes</Link>
        <div className="private-selections-eyebrow"><ShieldIcon /> Private ballot view</div>
        <h1>{data.election?.title ?? "Your submitted ballot"}</h1>
        <p>These are the candidates saved on your ballot. This page is available only to your signed-in account.</p>
        <div className="private-selections-meta">
          <span><strong>{selectedCount}</strong> candidate{selectedCount === 1 ? "" : "s"} selected</span>
          <span>Submitted {formatSubmittedAt(data.submittedAt)}</span>
        </div>
      </section>

      <section className="private-selections-section">
        <div className="private-selections-section-heading">
          <div>
            <p className="private-selections-kicker">Your ballot choices</p>
            <h2>Candidates you voted for</h2>
          </div>
          <span className="private-selections-lock"><ShieldIcon /> Private to you</span>
        </div>

        <div className="private-position-list">
          {data.positions.map((position, index) => (
            <article key={position.positionId} className="private-position-card">
              <header className="private-position-heading">
                <span className="private-position-number">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p>Position</p>
                  <h3>{position.positionName}</h3>
                </div>
                <span className="private-position-count">
                  {position.candidates.length} selected
                </span>
              </header>

              {position.candidates.length > 0 ? (
                <div className="private-candidate-grid">
                  {position.candidates.map((candidate) => (
                    <div key={candidate.candidateId} className="private-candidate-card">
                      <CandidateAvatar candidate={candidate} />
                      <div className="private-candidate-content">
                        <div className="private-candidate-name-row">
                          <h4>{candidate.name}</h4>
                          {candidate.candidateNumber && <span>#{candidate.candidateNumber}</span>}
                        </div>
                        <div className="private-candidate-details">
                          {candidate.party && <span>{candidate.party}</span>}
                          {candidate.course && <span>{candidate.course}</span>}
                        </div>
                      </div>
                      <span className="private-candidate-check">✓</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="private-no-selection">No candidate selected for this position.</div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="private-selections-footer">
        <span className="private-selections-footer-icon"><ShieldIcon /></span>
        <div>
          <strong>Your choices remain private</strong>
          <p>Administrators can verify that your ballot was submitted, but this personal view is the only place your selections are shown.</p>
        </div>
        <Link to={`/voter/elections/${data.electionId}/results`} className="private-results-link">
          View results <ArrowIcon />
        </Link>
      </section>
    </main>
  );
}
