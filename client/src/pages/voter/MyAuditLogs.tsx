import { useCallback, useEffect, useState } from "react";

import { api } from "../../lib/api";

interface VoterAuditLog {
  _id: string;
  action: string;
  resource?: string;
  description?: string;
  createdAt: string;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatAction(action: string) {
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 3h14v18l-2.33-1.5L14.33 21 12 19.5 9.67 21 7.33 19.5 5 21V3Z" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default function MyAuditLogs() {
  const [logs, setLogs] = useState<VoterAuditLog[] | null>(null);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (search = query) => {
    setError("");
    try {
      const response = await api.get("/audit-logs/mine", {
        params: search.trim() ? { search: search.trim() } : {},
      });
      setLogs(response.data?.data ?? []);
    } catch {
      setError("Unable to load your activity log.");
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery(searchInput);
    load(searchInput);
  };

  const clearSearch = () => {
    setSearchInput("");
    setQuery("");
    load("");
  };

  const latest = logs?.[0]?.createdAt;

  return (
    <div className="voter-audit-page space-y-6">
      <section className="voter-audit-hero animate-fade-up rounded-3xl p-7 text-white shadow-xl sm:p-9">
        <div className="voter-audit-hero-icon"><ActivityIcon /></div>
        <p className="voter-audit-eyebrow">Private activity history</p>
        <h1>My Audit Log</h1>
        <p>Review your recorded voting activity and submission times. This page is private to your account.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="voter-audit-stat"><strong>{logs?.length ?? 0}</strong><span>Recorded activities</span></div>
        <div className="voter-audit-stat"><strong>{logs?.filter((log) => log.action === "VOTE_SUBMITTED").length ?? 0}</strong><span>Ballots submitted</span></div>
        <div className="voter-audit-stat"><strong>{latest ? new Date(latest).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</strong><span>Latest activity</span></div>
      </section>

      <section className="voter-audit-card rounded-2xl border border-brand-200 bg-white/90 p-5 shadow-sm sm:p-7">
        <form onSubmit={submitSearch} className="flex flex-wrap gap-3">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search your activity"
            aria-label="Search your activity"
            className="min-w-0 flex-1"
          />
          <button type="submit" className="voter-audit-search-button">Search</button>
          {query && <button type="button" onClick={clearSearch} className="voter-audit-clear-button">Clear</button>}
        </form>

        <div className="mt-6 flex items-center justify-between gap-3">
          <div>
            <h2>My activity</h2>
            <p>{query ? `Showing results for “${query}”` : "Only your own voter activity is shown here."}</p>
          </div>
          <span className="voter-audit-count">{logs?.length ?? 0}</span>
        </div>

        {error ? (
          <div className="voter-audit-empty mt-5"><strong>{error}</strong><button type="button" onClick={() => load()}>Try again</button></div>
        ) : !logs ? (
          <div className="voter-audit-empty mt-5">Loading your activity…</div>
        ) : logs.length === 0 ? (
          <div className="voter-audit-empty mt-5">
            <ShieldIcon />
            <strong>No voter activity yet</strong>
            <span>Your ballot submissions will appear here after you vote.</span>
          </div>
        ) : (
          <ol className="voter-audit-list mt-6">
            {logs.map((log) => (
              <li key={log._id} className="voter-audit-entry">
                <span className="voter-audit-entry-icon"><ActivityIcon /></span>
                <div>
                  <div className="voter-audit-entry-heading">
                    <strong>{formatAction(log.action)}</strong>
                    <time dateTime={log.createdAt}>{formatDate(log.createdAt)}</time>
                  </div>
                  <p>{log.description || "Voter activity recorded."}</p>
                  <span className="voter-audit-entry-resource">{log.resource || "Voter activity"}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
