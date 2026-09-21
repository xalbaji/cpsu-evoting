import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { encodeReceiptQr } from "../../lib/qr";

interface VoteSuccessState {
  voteReference: string;
  submittedAt: string;
}

function ReceiptQr({ value }: { value: string }) {
  const matrix = useMemo(() => encodeReceiptQr(value), [value]);
  const quietZone = 4;
  const dimension = matrix.length + quietZone * 2;

  return (
    <svg
      className="vote-success-qr"
      viewBox={`0 0 ${dimension} ${dimension}`}
      role="img"
      aria-label={`QR code for receipt ${value}`}
    >
      <rect width={dimension} height={dimension} fill="#ffffff" />
      <g fill="#071521" shapeRendering="crispEdges">
        {matrix.flatMap((row, y) => row.map((dark, x) => dark ? (
          <rect key={`${x}-${y}`} x={x + quietZone} y={y + quietZone} width="1" height="1" />
        ) : null))}
      </g>
    </svg>
  );
}

export default function VoteSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state as VoteSuccessState | null;
  const [copied, setCopied] = useState(false);

  if (!data?.voteReference) {
    return (
      <main className="vote-success-page">
        <section className="vote-success-card vote-success-missing">
          <div className="vote-success-icon">?</div>
          <p className="vote-success-kicker">Receipt unavailable</p>
          <h1>Submission details not found</h1>
          <p>Return to your dashboard to view your elections and saved vote receipts.</p>
          <button type="button" className="vote-success-primary" onClick={() => navigate("/voter/dashboard")}>Return to Dashboard</button>
        </section>
      </main>
    );
  }

  const submittedDate = new Date(data.submittedAt);
  const formattedDate = submittedDate.toLocaleDateString("en-US", { dateStyle: "medium" });
  const formattedTime = submittedDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const copyReceipt = async () => {
    try {
      await navigator.clipboard.writeText(data.voteReference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="vote-success-page">
      <div className="vote-success-orb vote-success-orb-one" />
      <div className="vote-success-orb vote-success-orb-two" />

      <section className="vote-success-card" aria-labelledby="vote-success-title">
        <div className="vote-success-hero">
          <div className="vote-success-icon" aria-hidden="true">✓</div>
          <div>
            <p className="vote-success-kicker">Submission complete</p>
            <h1 id="vote-success-title">Your vote is safely recorded</h1>
            <p className="vote-success-intro">Thank you for participating. Keep the receipt below if you need to verify this submission later.</p>
          </div>
          <span className="vote-success-status">Verified submission</span>
        </div>

        <div className="vote-success-content">
          <article className="vote-success-receipt">
            <div className="vote-success-section-heading">
              <div className="vote-success-receipt-mark">EV</div>
              <div>
                <p className="vote-success-label">Private vote receipt</p>
                <h2>Save this reference code</h2>
              </div>
            </div>
            <p className="vote-success-receipt-note">This code confirms that your ballot was submitted. It does not reveal your candidate selections.</p>

            <div className="vote-success-code-row">
              <code>{data.voteReference}</code>
              <button type="button" className="vote-success-copy" onClick={copyReceipt}>{copied ? "Copied" : "Copy code"}</button>
            </div>

            <dl className="vote-success-details">
              <div><dt>Status</dt><dd><span className="vote-success-dot" /> Submitted successfully</dd></div>
              <div><dt>Date</dt><dd>{formattedDate}</dd></div>
              <div><dt>Time</dt><dd>{formattedTime}</dd></div>
            </dl>
          </article>

          <aside className="vote-success-qr-panel">
            <ReceiptQr value={data.voteReference} />
            <div>
              <p className="vote-success-label">Fast verification</p>
              <h2>Scan this receipt</h2>
              <p>Super Admins and Course Moderators can scan this QR code to confirm the submission.</p>
            </div>
          </aside>
        </div>

        <div className="vote-success-privacy">
          <span aria-hidden="true">✦</span>
          <div><strong>Your selections stay private.</strong><span>Only the receipt status and submission time can be verified.</span></div>
        </div>

        <div className="vote-success-actions">
          <button type="button" className="vote-success-secondary" onClick={() => navigate("/voter/my-votes")}>View My Votes</button>
          <button type="button" className="vote-success-primary" onClick={() => navigate("/voter/dashboard")}>Return to Dashboard <span aria-hidden="true">→</span></button>
        </div>
      </section>
    </main>
  );
}
