import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { api } from "../../lib/api";

interface Candidate {
  _id: string;
  firstName: string;
  lastName: string;
  candidateNumber?: string;
  photoUrl?: string;
  party?: string;
  course?: string;
  yearLevel?: string;
}

interface Position {
  id: string;
  name: string;
  description?: string;
  votingType: "SINGLE" | "MULTIPLE";
  maxSelections: number;
  candidates: Candidate[];
}

interface ElectionInfo {
  title?: string;
  academicYear?: string;
}

interface ReviewState {
  selections?: Record<string, string[]>;
  positions?: Position[];
  election?: ElectionInfo;
}

const fullName = (candidate?: Candidate) =>
  candidate ? `${candidate.firstName ?? ""} ${candidate.lastName ?? ""}`.trim() || "Unnamed candidate" : "Candidate unavailable";

const initialsOf = (candidate?: Candidate) =>
  candidate ? `${candidate.firstName?.[0] ?? ""}${candidate.lastName?.[0] ?? ""}`.toUpperCase() || "?" : "?";

function CheckIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
}

function ArrowLeftIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m7 7-7-7 7-7" /></svg>;
}

function ShieldIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 6v5c0 5.2-3.4 8.3-8 10-4.6-1.7-8-4.8-8-10V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></svg>;
}

function EmptySelectionIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5" /></svg>;
}

export default function ReviewVote() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const state = (location.state as ReviewState | null) ?? null;
  const selections = state?.selections;
  const positions = state?.positions ?? [];
  const election = state?.election;
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const answeredPositions = useMemo(
    () => positions.filter((position) => (selections?.[position.id]?.length ?? 0) > 0).length,
    [positions, selections],
  );
  const totalSelections = useMemo(
    () => Object.values(selections ?? {}).reduce((total, selected) => total + selected.length, 0),
    [selections],
  );
  const progress = positions.length > 0 ? (answeredPositions / positions.length) * 100 : 0;

  if (!selections) {
    return (
      <main className="review-page review-page-empty">
        <div className="review-empty-card">
          <div className="review-empty-icon"><ShieldIcon /></div>
          <span className="review-eyebrow">Ballot session expired</span>
          <h1>Your ballot is not available</h1>
          <p>Return to the ballot and make your selections again before reviewing your vote.</p>
          <button type="button" onClick={() => navigate(`/voter/elections/${id}/vote`)} className="review-primary-button">Return to ballot</button>
        </div>
      </main>
    );
  }

  async function submitVote() {
    const formatted = Object.entries(selections ?? {}).map(([positionId, candidateIds]) => ({ positionId, candidateIds }));
    setSubmitting(true);
    setError("");

    try {
      const response = await api.post(`/elections/${id}/vote`, { selections: formatted });
      navigate(`/voter/elections/${id}/success`, { state: response.data.data });
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message ?? "Unable to submit your vote.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="review-page">
      <style>{`
        .review-page {
          position: relative;
          min-height: calc(100vh - 8rem);
          overflow: hidden;
          color: #153b3a;
          padding: 1rem 0 3rem;
        }
        .review-page::before,
        .review-page::after {
          position: absolute;
          z-index: 0;
          width: 18rem;
          height: 18rem;
          border-radius: 999px;
          content: "";
          filter: blur(55px);
          pointer-events: none;
        }
        .review-page::before { top: -7rem; right: -5rem; background: rgba(22, 127, 145, .18); }
        .review-page::after { bottom: 2rem; left: -8rem; background: rgba(63, 180, 189, .12); }
        .review-shell { position: relative; z-index: 1; max-width: 980px; margin: 0 auto; }
        .review-back-link {
          display: inline-flex;
          align-items: center;
          gap: .45rem;
          border: 0;
          background: transparent;
          color: #167f91;
          cursor: pointer;
          font: 700 .85rem/1.2 Arial, sans-serif;
          padding: .35rem 0;
        }
        .review-back-link svg { width: 1rem; height: 1rem; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .review-hero {
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1.5rem;
          overflow: hidden;
          margin-top: 1.25rem;
          border: 1px solid #28536a;
          border-radius: 1.5rem;
          background: linear-gradient(135deg, #0d3c4b, #105663 62%, #167f91);
          box-shadow: 0 18px 42px rgba(8, 48, 64, .2);
          color: white;
          padding: 2rem;
        }
        .review-hero::after { position: absolute; right: -3rem; bottom: -5rem; width: 14rem; height: 14rem; border: 1px solid rgba(255,255,255,.18); border-radius: 999px; content: ""; box-shadow: 0 0 0 1.2rem rgba(255,255,255,.04), 0 0 0 2.4rem rgba(255,255,255,.03); }
        .review-hero-copy { position: relative; z-index: 1; min-width: 0; }
        .review-eyebrow { display: block; color: #a9edf0; font: 800 .7rem/1.2 Arial, sans-serif; letter-spacing: .16em; text-transform: uppercase; }
        .review-hero h1 { margin: .45rem 0 .5rem; color: #fff; font: 900 clamp(2rem, 5vw, 3.25rem)/1 Georgia, serif; letter-spacing: -.04em; }
        .review-hero p { max-width: 42rem; margin: 0; color: #d5f1f0; font: .95rem/1.55 Arial, sans-serif; }
        .review-hero-mark { position: relative; z-index: 1; display: grid; flex: 0 0 auto; place-items: center; width: 4.5rem; height: 4.5rem; border: 1px solid rgba(255,255,255,.35); border-radius: 1.25rem; background: rgba(255,255,255,.12); box-shadow: 0 10px 25px rgba(2, 40, 54, .18); }
        .review-hero-mark svg { width: 2.2rem; height: 2.2rem; fill: none; stroke: #d9ffff; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
        .review-stat-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .85rem; margin: 1rem 0 1.5rem; }
        .review-stat { border: 1px solid #d4e6e4; border-radius: 1rem; background: rgba(255,255,255,.92); padding: 1rem 1.1rem; box-shadow: 0 8px 22px rgba(21,59,58,.06); }
        .review-stat-label { display: block; color: #4d6b67; font: 800 .68rem/1.2 Arial, sans-serif; letter-spacing: .07em; text-transform: uppercase; }
        .review-stat-value { display: block; margin-top: .35rem; color: #052e2c; font: 900 1.7rem/1 Arial, sans-serif; }
        .review-stat-value small { color: #55726e; font-size: .85rem; font-weight: 800; }
        .review-progress { height: .5rem; overflow: hidden; border-radius: 999px; background: #dbeceb; }
        .review-progress-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #167f91, #35c4b9); transition: width .4s ease; }
        .review-section-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin: 0 0 .8rem; }
        .review-section-heading h2 { margin: 0; color: #0e4643; font: 900 1.25rem/1.2 Arial, sans-serif; }
        .review-section-heading p { margin: 0; color: #55726e; font: .78rem/1.4 Arial, sans-serif; }
        .review-position-list { display: grid; gap: 1rem; }
        .review-position-card { overflow: hidden; border: 1px solid #d4e6e4; border-radius: 1.25rem; background: rgba(255,255,255,.95); box-shadow: 0 10px 26px rgba(21,59,58,.07); }
        .review-position-header { display: flex; align-items: center; gap: .8rem; border-bottom: 1px solid #e3efed; background: linear-gradient(90deg, #f4fbfa, #fff); padding: 1rem 1.2rem; }
        .review-position-number { display: grid; flex: 0 0 auto; place-items: center; width: 2.25rem; height: 2.25rem; border-radius: .75rem; background: #0e4643; color: #fff; font: 900 .9rem/1 Arial, sans-serif; }
        .review-position-title { min-width: 0; }
        .review-position-title h3 { margin: 0; color: #0e4643; font: 900 1.05rem/1.2 Arial, sans-serif; text-transform: capitalize; }
        .review-position-title p { margin: .25rem 0 0; color: #5b7773; font: .78rem/1.35 Arial, sans-serif; }
        .review-position-count { margin-left: auto; flex: 0 0 auto; border-radius: 999px; background: #e8f7f5; color: #0b716e; padding: .38rem .65rem; font: 800 .7rem/1 Arial, sans-serif; }
        .review-position-body { padding: 1rem 1.2rem 1.2rem; }
        .review-candidate-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: .75rem; }
        .review-candidate-card { display: flex; align-items: center; gap: .8rem; border: 1px solid #c9e2df; border-radius: 1rem; background: #f7fcfb; padding: .8rem; }
        .review-candidate-avatar { display: grid; flex: 0 0 auto; place-items: center; width: 3rem; height: 3rem; overflow: hidden; border-radius: .9rem; background: linear-gradient(135deg, #167f91, #0e4643); color: #fff; font: 900 .95rem/1 Arial, sans-serif; }
        .review-candidate-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .review-candidate-copy { min-width: 0; }
        .review-candidate-copy strong { display: block; overflow: hidden; color: #0b3837; font: 900 .95rem/1.25 Arial, sans-serif; text-overflow: ellipsis; white-space: nowrap; }
        .review-candidate-copy span { display: block; overflow: hidden; margin-top: .2rem; color: #5b7773; font: .72rem/1.3 Arial, sans-serif; text-overflow: ellipsis; white-space: nowrap; }
        .review-selected-mark { display: grid; flex: 0 0 auto; place-items: center; width: 1.55rem; height: 1.55rem; margin-left: auto; border-radius: 999px; background: #0e8b7d; color: #fff; }
        .review-selected-mark svg { width: .9rem; height: .9rem; fill: none; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
        .review-empty-selection { display: flex; align-items: center; gap: .75rem; border: 1px dashed #e3c36b; border-radius: 1rem; background: #fffaf0; color: #805b12; padding: .85rem 1rem; }
        .review-empty-selection svg { width: 1.3rem; height: 1.3rem; flex: 0 0 auto; fill: none; stroke: currentColor; stroke-width: 1.8; }
        .review-empty-selection strong { display: block; font: 900 .82rem/1.2 Arial, sans-serif; }
        .review-empty-selection span { display: block; margin-top: .15rem; font: .74rem/1.3 Arial, sans-serif; }
        .review-actions { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1.5rem; border: 1px solid #c9e2df; border-radius: 1.25rem; background: linear-gradient(135deg, #f3fbfa, #fff); padding: 1rem 1.2rem; box-shadow: 0 10px 26px rgba(21,59,58,.07); }
        .review-safety-note { display: flex; align-items: center; gap: .6rem; color: #52706b; font: .75rem/1.35 Arial, sans-serif; }
        .review-safety-note svg { width: 1.25rem; height: 1.25rem; flex: 0 0 auto; fill: none; stroke: #167f91; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
        .review-action-buttons { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .6rem; }
        .review-secondary-button, .review-primary-button { display: inline-flex; align-items: center; justify-content: center; gap: .45rem; min-height: 2.8rem; border-radius: .8rem; cursor: pointer; font: 800 .82rem/1 Arial, sans-serif; padding: .75rem 1rem; transition: transform .15s ease, box-shadow .15s ease, background .15s ease; }
        .review-secondary-button { border: 1px solid #a8cfca; background: #fff; color: #0e625b; }
        .review-primary-button { border: 1px solid #0e625b; background: linear-gradient(135deg, #117f76, #0e4643); color: #fff; box-shadow: 0 7px 16px rgba(14,70,67,.2); }
        .review-secondary-button:hover, .review-primary-button:hover { transform: translateY(-1px); }
        .review-primary-button:disabled { cursor: wait; opacity: .65; transform: none; }
        .review-action-buttons svg { width: 1rem; height: 1rem; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .review-error { margin-top: 1rem; border: 1px solid #f1b7bd; border-radius: .85rem; background: #fff1f2; color: #a12d3a; padding: .8rem 1rem; font: 800 .8rem/1.4 Arial, sans-serif; }
        .review-empty-card { max-width: 34rem; margin: 5rem auto; border: 1px solid #c9e2df; border-radius: 1.5rem; background: rgba(255,255,255,.95); padding: 2.5rem; text-align: center; box-shadow: 0 16px 40px rgba(21,59,58,.1); }
        .review-empty-icon { display: grid; place-items: center; width: 4rem; height: 4rem; margin: 0 auto 1rem; border-radius: 1.25rem; background: #e8f7f5; color: #117f76; }
        .review-empty-icon svg { width: 2rem; height: 2rem; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
        .review-empty-card h1 { margin: .5rem 0; color: #0e4643; font: 900 1.6rem/1.15 Georgia, serif; }
        .review-empty-card p { margin: 0 0 1.25rem; color: #55726e; font: .9rem/1.5 Arial, sans-serif; }
        .review-empty-card .review-eyebrow { color: #117f76; }
        @media (max-width: 700px) {
          .review-page { padding-top: .25rem; }
          .review-hero { align-items: flex-start; padding: 1.35rem; }
          .review-hero-mark { display: none; }
          .review-stat-grid { grid-template-columns: 1fr; }
          .review-actions { align-items: stretch; flex-direction: column; }
          .review-action-buttons { justify-content: stretch; }
          .review-action-buttons button { flex: 1; }
        }
        :root[data-theme="dark"] .review-page { color: #e4eff4; }
        :root[data-theme="dark"] .review-back-link { color: #83dadd; }
        :root[data-theme="dark"] .review-stat,
        :root[data-theme="dark"] .review-position-card,
        :root[data-theme="dark"] .review-actions,
        :root[data-theme="dark"] .review-empty-card { border-color: #274454; background: #102434; box-shadow: 0 14px 32px rgba(0,0,0,.18); }
        :root[data-theme="dark"] .review-stat-label,
        :root[data-theme="dark"] .review-stat-value small,
        :root[data-theme="dark"] .review-section-heading p,
        :root[data-theme="dark"] .review-safety-note,
        :root[data-theme="dark"] .review-position-title p { color: #9bb1be; }
        :root[data-theme="dark"] .review-stat-value,
        :root[data-theme="dark"] .review-section-heading h2,
        :root[data-theme="dark"] .review-position-title h3,
        :root[data-theme="dark"] .review-candidate-copy strong,
        :root[data-theme="dark"] .review-empty-card h1 { color: #e4eff4; }
        :root[data-theme="dark"] .review-position-header { border-color: #274454; background: #0e2030; }
        :root[data-theme="dark"] .review-position-body { background: #102434; }
        :root[data-theme="dark"] .review-candidate-card { border-color: #386174; background: #132d3d; }
        :root[data-theme="dark"] .review-candidate-copy span { color: #9bb1be; }
        :root[data-theme="dark"] .review-position-count { background: #173847; color: #9be0e2; }
        :root[data-theme="dark"] .review-empty-selection { border-color: #80672d; background: #3a2e18; color: #f2c674; }
        :root[data-theme="dark"] .review-secondary-button { border-color: #386174; background: #173847; color: #bfe9eb; }
        :root[data-theme="dark"] .review-empty-icon { background: #173847; color: #9be0e2; }
        :root[data-theme="dark"] .review-empty-card p { color: #9bb1be; }
        :root[data-theme="dark"] .review-error { border-color: #75434b; background: #3a2027; color: #ffb3b8; }
      `}</style>

      <div className="review-shell">
        <button type="button" onClick={() => navigate(`/voter/elections/${id}/vote`)} className="review-back-link">
          <ArrowLeftIcon /> Back to ballot
        </button>

        <section className="review-hero">
          <div className="review-hero-copy">
            <span className="review-eyebrow">Final ballot check</span>
            <h1>Review your choices</h1>
            <p>{election?.title ?? "Election ballot"}{election?.academicYear ? ` · Academic Year ${election.academicYear}` : ""}. Take one last look before your vote is securely recorded.</p>
          </div>
          <div className="review-hero-mark"><ShieldIcon /></div>
        </section>

        <section className="review-stat-grid" aria-label="Ballot summary">
          <div className="review-stat"><span className="review-stat-label">Positions answered</span><strong className="review-stat-value">{answeredPositions} <small>/ {positions.length}</small></strong></div>
          <div className="review-stat"><span className="review-stat-label">Choices selected</span><strong className="review-stat-value">{totalSelections}</strong></div>
          <div className="review-stat"><span className="review-stat-label">Ballot progress</span><strong className="review-stat-value">{progress.toFixed(0)}%</strong></div>
        </section>

        <div className="review-progress" aria-label={`${progress.toFixed(0)} percent of positions answered`}><div className="review-progress-fill" style={{ width: `${progress}%` }} /></div>

        <div className="review-section-heading" style={{ marginTop: "1.5rem" }}>
          <div><h2>Your selections</h2><p>Skipped positions remain abstentions and will be submitted that way.</p></div>
        </div>

        <div className="review-position-list">
          {positions.map((position, index) => {
            const selectedIds = selections[position.id] ?? [];
            const selectedCandidates = selectedIds.map((candidateId) => position.candidates.find((candidate) => candidate._id === candidateId));

            return (
              <section key={position.id} className="review-position-card">
                <header className="review-position-header">
                  <span className="review-position-number">{String(index + 1).padStart(2, "0")}</span>
                  <div className="review-position-title">
                    <h3>{position.name}</h3>
                    <p>{position.description || (position.votingType === "MULTIPLE" ? `Choose up to ${position.maxSelections}` : "Choose one candidate")}</p>
                  </div>
                  <span className="review-position-count">{selectedIds.length ? `${selectedIds.length} selected` : "Skipped"}</span>
                </header>
                <div className="review-position-body">
                  {selectedIds.length === 0 ? (
                    <div className="review-empty-selection"><EmptySelectionIcon /><div><strong>No selection for this position</strong><span>You may continue with this position as an abstention.</span></div></div>
                  ) : (
                    <div className="review-candidate-list">
                      {selectedCandidates.map((candidate, candidateIndex) => (
                        <div key={selectedIds[candidateIndex]} className="review-candidate-card">
                          <div className="review-candidate-avatar">{candidate?.photoUrl ? <img src={candidate.photoUrl} alt={fullName(candidate)} /> : initialsOf(candidate)}</div>
                          <div className="review-candidate-copy"><strong>{fullName(candidate)}</strong><span>{[candidate?.candidateNumber && `Candidate #${candidate.candidateNumber}`, candidate?.party, candidate?.course, candidate?.yearLevel && `Year ${candidate.yearLevel}`].filter(Boolean).join(" · ") || "Selected candidate"}</span></div>
                          <span className="review-selected-mark"><CheckIcon /></span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {error && <p role="alert" className="review-error">{error}</p>}

        <section className="review-actions">
          <div className="review-safety-note"><ShieldIcon /><span>Your ballot is protected. Once submitted, your choices cannot be changed.</span></div>
          <div className="review-action-buttons">
            <button type="button" onClick={() => navigate(`/voter/elections/${id}/vote`)} className="review-secondary-button"><ArrowLeftIcon /> Change choices</button>
            <button type="button" disabled={submitting} onClick={submitVote} className="review-primary-button"><CheckIcon /> {submitting ? "Submitting securely…" : "Confirm & submit"}</button>
          </div>
        </section>
      </div>
    </main>
  );
}
