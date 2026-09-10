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
    if (id && data?.election?.status !== "RESULTS_PUBLISHED") {
      if (!data) loadResults();
      const interval = setInterval(() => {
        loadResults();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [id, data?.election?.status]);

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: '-apple-system, sans-serif' }}>
        <p role="alert" style={{ color: '#ef4444', fontWeight: 600 }}>{error}</p>
      <button onClick={() => navigate(-1)} style={{ marginTop: '16px', padding: '8px 16px', background: '#0e4643', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Go Back</button>
      </div>
    );
  }

  if (!data && loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#617875', fontFamily: 'Arial, sans-serif' }}>
        <p>Loading election tally statistics...</p>
      </div>
    );
  }

  return (
    <div className="results-content-container">
      <style>{`
        .results-content-container { 
          padding: 4px 0 40px; 
          font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; 
          color: #153b3a;
          width: 100%;
          box-sizing: border-box;
        }

        .back-link { 
          display: inline-flex; 
          align-items: center; 
          gap: 6px; 
          color: #0e4643; 
          font-weight: 700; 
          font-size: 0.9rem; 
          text-decoration: none; 
          margin-bottom: 22px; 
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
          margin-bottom: 26px;
          background: #ffffff;
          padding: 24px 26px;
          border-radius: 18px;
          border: 1px solid #deece9;
          box-shadow: 0 10px 26px rgba(21,59,58,0.06);
        }
        .dashboard-heading-block h1 {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 1.8rem;
          font-weight: 800;
          color: #0e4643;
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }
        .dashboard-heading-block p {
          font-size: 0.9rem;
          color: #617875;
          margin: 0;
        }

        .live-status-pill { 
          display: inline-flex; 
          align-items: center; 
          gap: 6px; 
          background: #edf8f5; 
          color: #117f76; 
          border: 1px solid #bfe4dc; 
          padding: 6px 11px; 
          border-radius: 20px; 
          font-size: 0.7rem; 
          font-weight: 700; 
        }
        .pulse-dot { 
          width: 6px; 
          height: 6px; 
          background: #117f76; 
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
          border: 1px solid #deece9; 
          border-radius: 16px; 
          padding: 24px; 
          box-shadow: 0 10px 26px rgba(21,59,58,0.06); 
        }
        .metric-label { 
          font-size: 0.7rem; 
          font-weight: 700; 
          color: #71817e; 
          text-transform: uppercase; 
          letter-spacing: 0.05em; 
          margin-bottom: 6px; 
        }
        .metric-number { 
          font-size: 1.6rem; 
          font-weight: 800; 
          color: #0e4643; 
        }
        .metric-subtext { 
          font-size: 0.75rem; 
          color: #617875; 
          margin-top: 4px; 
        }

        .positions-layout-stack { 
          display: flex; 
          flex-direction: column; 
          gap: 20px; 
        }
        .position-box-card { 
          background: #ffffff; 
          border: 1px solid #deece9; 
          border-radius: 16px; 
          overflow: hidden; 
          box-shadow: 0 10px 26px rgba(21,59,58,0.06); 
        }
        .position-card-topbar { 
          background: #f8fbfa; 
          padding: 14px 20px; 
          border-bottom: 1px solid #deece9; 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
        }
        .position-card-topbar h2 { 
          font-size: 1rem; 
          font-weight: 700; 
          color: #153b3a; 
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
          color: #153b3a; 
          display: flex; 
          align-items: center; 
          gap: 8px; 
        }
        .badge-pill { 
          background: #fff6d8; 
          color: #c66a00; 
          border: 1px solid #f8d57a; 
          font-size: 0.65rem; 
          padding: 2px 6px; 
          border-radius: 4px; 
          font-weight: 700; 
        }
        
        .progress-bar-track { 
          width: 100%; 
          background: #edf4f2; 
          height: 8px; 
          border-radius: 4px; 
          overflow: hidden; 
        }
        .progress-bar-fill { 
          height: 100%; 
          background: #117f76; 
          border-radius: 4px; 
          transition: width 0.4s ease; 
        }
        .progress-bar-fill.leading { 
          background: #0e4643; 
        }

        .refresh-action-btn { 
          background: #0e4643; 
          color: white; 
          border: none; 
          padding: 7px 14px; 
          border-radius: 8px; 
          font-weight: 600; 
          font-size: 0.8rem; 
          cursor: pointer; 
          transition: background 0.2s; 
        }
        .refresh-action-btn:hover { background: #0b625c; }
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
            <span className="pulse-dot"></span> {data?.election?.status === "RESULTS_PUBLISHED" ? "FINAL RESULTS" : "LIVE TALLY ACTIVE"}
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
          <div className="metric-subtext" style={{ color: '#117f76', fontWeight: 600 }}>Secure encrypted ballots</div>
        </div>
        <div className="metric-box">
          <div className="metric-label">Election Status</div>
          <div className="metric-number" style={{ fontSize: '1.1rem', marginTop: '4px', color: '#0f766e', textTransform: 'uppercase' }}>
            ● {data?.election?.status === "RESULTS_PUBLISHED" ? "CLOSED · RESULTS PUBLISHED" : (data?.election?.status || 'ACTIVE')}
          </div>
          <div className="metric-subtext">Live database monitoring state</div>
        </div>
      </div>

      <div className="positions-layout-stack">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0e4643', margin: '0 0 -4px 0' }}>
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
                          <span style={{ fontWeight: '800', color: '#153b3a' }}>{item.votes}</span> votes 
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
                      <XAxis dataKey="name" tick={{ fill: '#617875', fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fill: '#617875', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#deece9', borderRadius: '10px', fontSize: '12px' }} />
                      <Bar dataKey="votes" fill="#0e4643" radius={[4, 4, 0, 0]} />
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
