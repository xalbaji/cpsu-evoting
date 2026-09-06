import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<ResultsData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  async function loadResults() {
    try {
      setLoading(true);
      const response = await api.get(`/elections/${id}/results`);
      setData(response.data.data || response.data);
      setError("");
      setLastUpdated(new Date());
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ?? "Unable to load results."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadResults();
      const interval = setInterval(loadResults, 10000);
      return () => clearInterval(interval);
    }
  }, [id]);

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: '-apple-system, sans-serif' }}>
        <p role="alert" style={{ color: '#ef4444', fontWeight: 600 }}>{error}</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: '16px', padding: '8px 16px', background: '#0b3c36', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Go Back</button>
      </div>
    );
  }

  if (!data && loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontFamily: '-apple-system, sans-serif' }}>
        <p>Loading election tally statistics...</p>
      </div>
    );
  }

  return (
    <div className="results-content-container">
      <style>{`
        .results-content-container { 
          padding: 32px 40px; 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
          color: #1e293b;
          width: 100%;
          box-sizing: border-box;
        }

        .back-link { 
          display: inline-flex; 
          align-items: center; 
          gap: 6px; 
          color: #0b3c36; 
          font-weight: 600; 
          font-size: 0.85rem; 
          text-decoration: none; 
          margin-bottom: 20px; 
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .back-link:hover { text-decoration: underline; }

        .dashboard-heading-block {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          background: #ffffff;
          padding: 20px 24px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .dashboard-heading-block h1 {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }
        .dashboard-heading-block p {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0;
        }

        .live-status-pill { 
          display: inline-flex; 
          align-items: center; 
          gap: 6px; 
          background: #f0fdfa; 
          color: #0f766e; 
          border: 1px solid #ccfbf1; 
          padding: 4px 10px; 
          border-radius: 20px; 
          font-size: 0.7rem; 
          font-weight: 700; 
        }
        .pulse-dot { 
          width: 6px; 
          height: 6px; 
          background: #0d9488; 
          border-radius: 50%; 
          animation: pulse 1.5s infinite; 
        }
        @keyframes pulse { 
          0% { transform: scale(0.95); opacity: 0.8; } 
          50% { transform: scale(1.3); opacity: 1; } 
          100% { transform: scale(0.95); opacity: 0.8; } 
        }

        .metrics-cards-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); 
          gap: 20px; 
          margin-bottom: 24px; 
        }
        .metric-box { 
          background: #ffffff; 
          border: 1px solid #e2e8f0; 
          border-radius: 12px; 
          padding: 20px; 
          box-shadow: 0 1px 2px rgba(0,0,0,0.02); 
        }
        .metric-label { 
          font-size: 0.7rem; 
          font-weight: 700; 
          color: #94a3b8; 
          text-transform: uppercase; 
          letter-spacing: 0.05em; 
          margin-bottom: 6px; 
        }
        .metric-number { 
          font-size: 1.6rem; 
          font-weight: 800; 
          color: #0f172a; 
        }
        .metric-subtext { 
          font-size: 0.75rem; 
          color: #64748b; 
          margin-top: 4px; 
        }

        .positions-layout-stack { 
          display: flex; 
          flex-direction: column; 
          gap: 20px; 
        }
        .position-box-card { 
          background: #ffffff; 
          border: 1px solid #e2e8f0; 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: 0 1px 2px rgba(0,0,0,0.02); 
        }
        .position-card-topbar { 
          background: #f8fafc; 
          padding: 14px 20px; 
          border-bottom: 1px solid #e2e8f0; 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
        }
        .position-card-topbar h2 { 
          font-size: 1rem; 
          font-weight: 700; 
          color: #0f172a; 
          margin: 0; 
        }
        
        .candidates-inner-stack { 
          padding: 20px; 
          display: flex; 
          flex-direction: column; 
          gap: 16px; 
        }
        .candidate-item-row { 
          display: flex; 
          flex-direction: column; 
          gap: 6px; 
        }
        .candidate-info-line { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          font-size: 0.85rem; 
        }
        .candidate-name-text { 
          font-weight: 600; 
          color: #1e293b; 
          display: flex; 
          align-items: center; 
          gap: 8px; 
        }
        .badge-pill { 
          background: #fef3c7; 
          color: #d97706; 
          border: 1px solid #fde68a; 
          font-size: 0.65rem; 
          padding: 2px 6px; 
          border-radius: 4px; 
          font-weight: 700; 
        }
        
        .progress-bar-track { 
          width: 100%; 
          background: #f1f5f9; 
          height: 8px; 
          border-radius: 4px; 
          overflow: hidden; 
        }
        .progress-bar-fill { 
          height: 100%; 
          background: #0d9488; 
          border-radius: 4px; 
          transition: width 0.4s ease; 
        }
        .progress-bar-fill.leading { 
          background: #0b3c36; 
        }

        .refresh-action-btn { 
          background: #0b3c36; 
          color: white; 
          border: none; 
          padding: 7px 14px; 
          border-radius: 8px; 
          font-weight: 600; 
          font-size: 0.8rem; 
          cursor: pointer; 
          transition: background 0.2s; 
        }
        .refresh-action-btn:hover { background: #072a26; }
      `}</style>

      <button onClick={() => navigate(-1)} className="back-link">
        ← Back to Elections
      </button>

      <div className="dashboard-heading-block">
        <div>
          <h1>{data?.election?.title}</h1>
          <p>Live database monitoring and position vote share</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <span className="live-status-pill">
            <span className="pulse-dot"></span> LIVE TALLY ACTIVE
          </span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Last sync: {lastUpdated.toLocaleTimeString()}</span>
          <button onClick={loadResults} className="refresh-action-btn" style={{ marginTop: '2px' }}>
            {loading ? 'Refreshing...' : 'Refresh Tally'}
          </button>
        </div>
      </div>

      <div className="metrics-cards-grid">
        <div className="metric-box">
          <div className="metric-label">Total Votes Cast</div>
          <div className="metric-number">{data?.totalVotes || 0}</div>
          <div className="metric-subtext" style={{ color: '#0d9488', fontWeight: 500 }}>Secure encrypted ballots</div>
        </div>
        <div className="metric-box">
          <div className="metric-label">Election Status</div>
          <div className="metric-number" style={{ fontSize: '1.1rem', marginTop: '4px', color: '#0f766e', textTransform: 'uppercase' }}>
            ● {data?.election?.status || 'ACTIVE'}
          </div>
          <div className="metric-subtext">Live database monitoring state</div>
        </div>
      </div>

      <div className="positions-layout-stack">
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 -4px 0' }}>
          Position Breakdowns & Vote Share
        </h2>

        {data?.results && data.results.map((result) => {
          const chartData = result.candidates.map((item) => ({
            name: `${item.candidate.firstName} ${item.candidate.lastName}`,
            votes: item.votes,
          }));

          const maxVotes = Math.max(...result.candidates.map((c) => c.votes), 0);

          return (
            <section key={result.position._id} className="position-box-card">
              <div className="position-card-topbar">
                <h2>{result.position.name}</h2>
                {result.winner && (
                  <span className="badge-pill">
                    ★ Winner: {result.winner.candidate.firstName} {result.winner.candidate.lastName}
                  </span>
                )}
              </div>

              <div className="candidates-inner-stack">
                {result.candidates.map((item) => {
                  const isLeading = maxVotes > 0 && item.votes === maxVotes;
                  const pct = item.percentage ?? (data.totalVotes > 0 ? (item.votes / data.totalVotes) * 100 : 0);

                  return (
                    <article key={item.candidate._id} className="candidate-item-row">
                      <div className="candidate-info-line">
                        <div className="candidate-name-text">
                          <span>{item.candidate.firstName} {item.candidate.lastName}</span>
                          {isLeading && data.totalVotes > 0 && (
                            <span className="badge-pill">Leading</span>
                          )}
                        </div>
                        <div style={{ fontWeight: 600, color: '#334155' }}>
                          <span style={{ fontWeight: '800', color: '#0f172a' }}>{item.votes}</span> votes 
                          <span style={{ color: '#94a3b8', marginLeft: '6px' }}>({pct.toFixed(0)}%)</span>
                        </div>
                      </div>

                      <div className="progress-bar-track">
                        <div 
                          className={`progress-bar-fill ${isLeading && data.totalVotes > 0 ? 'leading' : ''}`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </article>
                  );
                })}

                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="votes" fill="#0b3c36" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}