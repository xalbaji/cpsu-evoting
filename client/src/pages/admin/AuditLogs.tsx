import { useEffect, useState } from "react";

import { api } from "../../api/axios";

interface AuditLog {
  _id: string;
  action: string;
  resource?: string;
  description: string;
  ipAddress?: string;
  createdAt: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  async function loadLogs() {
    try {
      const response = await api.get("/audit-logs", {
        params: { search },
      });
      setLogs(response.data.data);
    } catch {
      setError("Unable to load audit logs.");
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <main>
      <h1>Audit Logs</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          loadLogs();
        }}
      >
        <label>
          Search logs
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Action, resource, or description"
          />
        </label>
        <button type="submit">Search</button>
      </form>
      {error && <p role="alert">{error}</p>}
      <section>
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Resource</th>
              <th>Description</th>
              <th>IP address</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id}>
                <td>{log.action}</td>
                <td>{log.resource ?? "-"}</td>
                <td>{log.description}</td>
                <td>{log.ipAddress ?? "-"}</td>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
