import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import jsQR from "jsqr";

import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import BrandLogo from "../../components/BrandLogo";
import { ThemeSettings } from "../../components/ThemeSettings";
import { adminRoleLabel, displayAccountName, hasSuperAdminAccess } from "../../lib/access";

interface Election {
  _id: string;
  title: string;
  course?: string;
  courses?: string[];
  status: string;
}

interface ReceiptLookup {
  voteReference: string;
  status: string;
  submittedAt: string;
  electionId?: string;
  electionTitle: string;
}

type NativeBarcodeDetector = new (options?: { formats?: string[] }) => {
  detect: (source: unknown) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeImageSource = HTMLVideoElement | HTMLImageElement | ImageBitmap;

function normalizeReceiptCode(value: string) {
  return value.toUpperCase().match(/EV-\d+-[A-Z0-9]{6}/)?.[0] ?? "";
}

function imageSourceSize(source: BarcodeImageSource) {
  if (source instanceof HTMLVideoElement) {
    return { width: source.videoWidth, height: source.videoHeight };
  }
  if (source instanceof HTMLImageElement) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }
  return { width: source.width, height: source.height };
}

async function detectReceiptFromSource(detector: InstanceType<NativeBarcodeDetector> | null, source: BarcodeImageSource) {
  const readCodes = async (candidate: unknown) => {
    if (!detector) return "";
    try {
      const codes = await detector.detect(candidate);
      return codes.map((code) => normalizeReceiptCode(code.rawValue ?? "")).find(Boolean) ?? "";
    } catch {
      return "";
    }
  };

  const directResult = await readCodes(source);
  if (directResult) return directResult;

  const { width, height } = imageSourceSize(source);
  if (!width || !height) return "";

  const scale = Math.min(1, 900 / Math.max(width, height));
  const scaledWidth = Math.max(1, Math.round(width * scale));
  const scaledHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return "";

  for (const rotation of [0, 90, 180, 270]) {
    for (const mirrored of [false, true]) {
      const quarterTurn = rotation === 90 || rotation === 270;
      canvas.width = quarterTurn ? scaledHeight : scaledWidth;
      canvas.height = quarterTurn ? scaledWidth : scaledHeight;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate((rotation * Math.PI) / 180);
      context.scale(mirrored ? -1 : 1, 1);
      context.drawImage(source, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);

      const result = await readCodes(canvas);
      if (result) return result;

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const qr = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: "attemptBoth" });
      const fallbackResult = normalizeReceiptCode(qr?.data ?? "");
      if (fallbackResult) return fallbackResult;
    }
  }

  return "";
}

const Icons = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  myVotes: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3h14v18l-2.33-1.5L14.33 21 12 19.5 9.67 21l-2.34-1.5L5 21V3Z"/><path d="m8.5 11.5 2.5 2.5 4.5-5"/></svg>,
  elections: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  voters: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  audit: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  results: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
  menu: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  chart: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
  arrowRight: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
};

const NAV_ITEMS = [
  { path: "/admin/dashboard", label: "Dashboard", icon: Icons.dashboard },
  { path: "/admin/elections", label: "Elections", icon: Icons.elections },
  { path: "/admin/voters", label: "Voters", icon: Icons.voters },
  { path: "/voter/my-votes", label: "My Votes", icon: Icons.myVotes },
  { path: "/profile", label: "Profile", icon: Icons.voters },
  { path: "/admin/administrators", label: "Administrators", icon: Icons.voters },
  { path: "/admin/audit-logs", label: "Audit Logs", icon: Icons.audit },
  { path: "/admin/results", label: "Results", icon: Icons.results },
];

function statusMeta(status: string) {
  switch (status.toUpperCase()) {
    case "ACTIVE": return { label: "Active", badge: "bg-amber-50 text-amber-700" };
    case "SCHEDULED": return { label: "Scheduled", badge: "bg-sky-50 text-sky-700" };
    case "CLOSED": return { label: "Closed", badge: "bg-brand-50 text-brand-700" };
    case "RESULTS_PUBLISHED": return { label: "Results published", badge: "bg-brand-50 text-brand-700" };
    case "CANCELLED": return { label: "Cancelled", badge: "bg-danger-50 text-danger-700" };
    default: return { label: status.replaceAll("_", " "), badge: "bg-slate-100 text-slate-600" };
  }
}

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta(status);
  return <span className={`status-badge ${meta.badge}`}>{meta.label}</span>;
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`results-stat results-stat-${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export default function AdminResults() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [elections, setElections] = useState<Election[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [lookupElectionId, setLookupElectionId] = useState("");
  const [receiptInput, setReceiptInput] = useState("");
  const [receiptResult, setReceiptResult] = useState<ReceiptLookup | null>(null);
  const [receiptError, setReceiptError] = useState("");
  const [lookingUpReceipt, setLookingUpReceipt] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [scannerNotice, setScannerNotice] = useState("");
  const [imageScanning, setImageScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const receiptImageInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  useEffect(() => {
    api.get("/elections")
      .then((response) => setElections(response.data.data ?? []))
      .catch(() => setError("Unable to load elections."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!lookupElectionId && elections[0]?._id) {
      setLookupElectionId(elections[0]._id);
    }
  }, [elections, lookupElectionId]);

  const counts = useMemo(() => ({
    total: elections.length,
    active: elections.filter((election) => election.status.toUpperCase() === "ACTIVE").length,
    published: elections.filter((election) => election.status.toUpperCase() === "RESULTS_PUBLISHED").length,
  }), [elections]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const verifyReceipt = useCallback(async (reference: string, detectElection = false) => {
    setReceiptError("");
    setReceiptResult(null);
    if (!detectElection && !lookupElectionId) {
      setReceiptError("Select an election first.");
      return;
    }
    if (!reference.trim()) {
      setReceiptError("Enter the EV receipt code to search.");
      return;
    }

    setLookingUpReceipt(true);
    try {
      const endpoint = detectElection
        ? "/votes/vote-receipt"
        : `/elections/${lookupElectionId}/vote-receipt`;
      const response = await api.get(endpoint, {
        params: { reference: reference.trim() },
      });
      const result = response.data?.data ?? null;
      if (detectElection && result?.electionId) setLookupElectionId(result.electionId);
      setReceiptResult(result);
    } catch (requestError: any) {
      setReceiptError(requestError?.response?.data?.message ?? "Unable to verify this receipt code.");
    } finally {
      setLookingUpReceipt(false);
    }
  }, [lookupElectionId]);

  const lookupReceipt = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await verifyReceipt(receiptInput);
  };

  const scanReceiptImage = useCallback(async (file: File) => {
    const barcodeDetector = (window as unknown as { BarcodeDetector?: NativeBarcodeDetector }).BarcodeDetector;

    setImageScanning(true);
    setScannerError("");
    setScannerNotice(barcodeDetector
      ? "Checking the photo in every rotation and mirror direction…"
      : "Using the built-in QR decoder and checking every rotation and mirror direction…");
    let objectUrl = "";
    try {
      const detector = barcodeDetector ? new barcodeDetector({ formats: ["qr_code"] }) : null;
      const image = new Image();
      objectUrl = URL.createObjectURL(file);
      image.src = objectUrl;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Unable to read image"));
      });
      const normalized = await detectReceiptFromSource(detector, image);

      if (!normalized) {
        setScannerError("No valid EV receipt QR code was found. Try a clearer photo, or enter the code manually.");
        setScannerNotice("");
        return;
      }

      setReceiptInput(normalized);
      setScannerOpen(false);
      setScannerNotice("");
       void verifyReceipt(normalized, true);
    } catch {
      setScannerError("Unable to read that photo. Try another image or enter the EV receipt code manually.");
      setScannerNotice("");
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setImageScanning(false);
    }
  }, [verifyReceipt]);

  const chooseReceiptImage = () => {
    setScannerError("");
    setScannerNotice("");
    setScannerOpen(true);
    receiptImageInputRef.current?.click();
  };

  useEffect(() => {
    if (!scannerOpen) return undefined;

    let active = true;
    const startScanner = async () => {
      const localHostnames = ["localhost", "127.0.0.1", "[::1]", "::1"];
      if (!window.isSecureContext && !localHostnames.includes(window.location.hostname)) {
        setScannerError("Camera access requires HTTPS when this site is online. Localhost is allowed for local development.");
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setScannerError("Camera access is unavailable here. Use HTTPS or localhost, then try again.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();

        const barcodeDetector = (window as unknown as { BarcodeDetector?: NativeBarcodeDetector }).BarcodeDetector;
        const detector = barcodeDetector ? new barcodeDetector({ formats: ["qr_code"] }) : null;
        setScannerNotice(detector
          ? "Camera ready. Hold the QR code inside the frame until it is recognized."
          : "Camera ready. Built-in QR decoding is active; hold the QR code inside the frame until it is recognized.");
        const scan = async () => {
          if (!active || !videoRef.current) return;
          const normalized = await detectReceiptFromSource(detector, videoRef.current);
          if (normalized) {
            setReceiptInput(normalized);
            setScannerOpen(false);
            setScannerError("");
             void verifyReceipt(normalized, true);
            return;
          }
          if (active) scanTimerRef.current = window.setTimeout(() => { void scan(); }, 250);
        };
        void scan();
      } catch (error: any) {
        setScannerError(error?.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access or enter the code manually."
          : "Unable to access the camera. Enter the EV receipt code manually.");
      }
    };

    void startScanner();
    return () => {
      active = false;
      if (scanTimerRef.current !== null) window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [scannerOpen, verifyReceipt]);

  return (
    <div className="admin-page min-h-screen bg-brand-50 pt-16 font-serif text-ink-900">
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between gap-4 bg-brand-900 px-4 font-sans text-white shadow-md lg:px-6">
        <div className="flex items-center gap-3">
          <button className="menu-btn rounded-lg p-2 transition hover:bg-white/10 lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
            {sidebarOpen ? Icons.close : Icons.menu}
          </button>
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1"><BrandLogo /></span>
          <span className="hidden text-[1.05rem] font-semibold tracking-wide sm:block">CPSU E-Voting</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-brand-300">{displayAccountName(user, "Course Moderator")}</span>
          <span className="header-role-badge">{adminRoleLabel(user)}</span>
          <button onClick={handleLogout} className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20 active:scale-95">Log out</button>
        </div>
      </header>

      <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`fixed bottom-0 left-0 top-16 z-40 w-64 border-r border-brand-200 bg-white transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <nav className="sidebar-nav">
          <p className="sidebar-section-label">Administration</p>
          <div className="sidebar-context">
            <span className="sidebar-context-dot" />
            <div>
              <strong>{adminRoleLabel(user)} workspace</strong>
              <span>{hasSuperAdminAccess(user) ? "Manage every course" : "Managing assigned course elections"}</span>
            </div>
          </div>
          {NAV_ITEMS.map((item) => {
            if (item.path === "/admin/administrators" && !hasSuperAdminAccess(user)) return null;
            if (["/profile", "/voter/my-votes"].includes(item.path) && hasSuperAdminAccess(user)) return null;
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={`sidebar-link ${active ? "active" : ""}`}>
                <span className="sidebar-icon">{item.icon}</span>{item.label}
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar-settings"><ThemeSettings /></div>
      </aside>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
          {error ? (
            <div className="mx-auto mt-10 max-w-md rounded-2xl border border-danger-50 bg-danger-50 p-8 text-center ring-1 ring-danger-700/10">
              <p role="alert" className="font-sans font-semibold text-danger-700">{error}</p>
              <button onClick={() => window.location.reload()} className="mt-4 active:scale-95">Try again</button>
            </div>
          ) : (
            <div className="space-y-6">
              <section className="animate-fade-up relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-900 via-brand-800 to-brand-700 p-8 text-white shadow-xl">
                <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-brand-300">Published outcomes and live tallies</p>
                <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Election Results</h1>
                <p className="mt-3 max-w-2xl font-sans text-brand-100/90">
                  Review every election outcome in one place. Open an election to view its live statistics or published results.
                </p>
              </section>

              <section className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Total elections" value={counts.total} tone="brand" />
                <StatCard label="Live elections" value={counts.active} tone="amber" />
                <StatCard label="Results published" value={counts.published} tone="violet" />
              </section>

              <section className="receipt-lookup-panel animate-fade-up rounded-2xl border border-brand-200 bg-white/90 p-6 shadow-sm sm:p-8">
                <div className="receipt-lookup-heading">
                  <div>
                    <p className="receipt-lookup-kicker">Receipt verification</p>
                    <h2>Check a submitted vote</h2>
                    <p>Choose the specific election, then enter the voter’s EV receipt code. This confirms submission only; voter identity and selections stay private.</p>
                  </div>
                  <span className="receipt-lookup-icon">✓</span>
                </div>

                <form onSubmit={lookupReceipt} className="receipt-lookup-form">
                  <label className="receipt-lookup-label">
                    Election
                    <select value={lookupElectionId} onChange={(event) => { setLookupElectionId(event.target.value); setReceiptResult(null); setReceiptError(""); }} disabled={loading || elections.length === 0}>
                      <option value="">Select an election</option>
                      {elections.map((election) => <option key={election._id} value={election._id}>{election.title}</option>)}
                    </select>
                  </label>
                  <div className="receipt-lookup-code-group">
                    <label className="receipt-lookup-label receipt-lookup-code-field">
                      EV receipt code
                      <input value={receiptInput} onChange={(event) => { setReceiptInput(event.target.value.toUpperCase()); setReceiptResult(null); setReceiptError(""); }} placeholder="EV-1788679217653-BZMA56" autoComplete="off" spellCheck={false} />
                    </label>
                    <button type="button" className="receipt-scan-button" onClick={() => { setScannerError(""); setScannerNotice(""); setScannerOpen(true); }} disabled={loading || elections.length === 0}>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M8 8h8v8H8z"/></svg>
                      Scan QR
                    </button>
                    <button type="button" className="receipt-shot-button" onClick={chooseReceiptImage} disabled={loading || elections.length === 0 || imageScanning}>
                      {imageScanning ? "Reading…" : "Take photo"}
                    </button>
                    <input
                      ref={receiptImageInputRef}
                      className="receipt-image-input"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) void scanReceiptImage(file);
                      }}
                      aria-label="Take or choose a receipt QR photo"
                    />
                  </div>
                  <button type="submit" disabled={lookingUpReceipt || loading || !lookupElectionId} className="receipt-lookup-button">
                    {lookingUpReceipt ? "Checking…" : "Verify receipt"}
                  </button>
                </form>

                {scannerOpen && (
                  <div className="receipt-scanner" role="dialog" aria-label="Scan vote receipt QR code">
                    <div className="receipt-scanner-heading">
                      <div>
                        <strong>Scan receipt QR code</strong>
                        <span>Scan live or take a photo. Rotated and mirrored QR codes are checked automatically.</span>
                      </div>
                      <div className="receipt-scanner-actions">
                        <button type="button" onClick={chooseReceiptImage} disabled={imageScanning}>Take photo</button>
                        <button type="button" onClick={() => setScannerOpen(false)}>Close</button>
                      </div>
                    </div>
                    <div className="receipt-scanner-frame">
                      <video ref={videoRef} autoPlay muted playsInline />
                      <span className="receipt-scanner-corner receipt-scanner-corner-tl" />
                      <span className="receipt-scanner-corner receipt-scanner-corner-tr" />
                      <span className="receipt-scanner-corner receipt-scanner-corner-bl" />
                      <span className="receipt-scanner-corner receipt-scanner-corner-br" />
                    </div>
                    {scannerNotice && <p className="receipt-scanner-notice" role="status">{scannerNotice}</p>}
                    {scannerError && <p className="receipt-scanner-error" role="alert">{scannerError}</p>}
                    <button type="button" className="receipt-scanner-stop" onClick={() => setScannerOpen(false)}>Stop scanning</button>
                  </div>
                )}

                {receiptError && <p className="receipt-lookup-message receipt-lookup-error" role="alert">{receiptError}</p>}
                {receiptResult && (
                  <div className="receipt-lookup-success" role="status">
                    <span className="receipt-lookup-success-mark">✓</span>
                    <div>
                      <strong>Vote receipt verified</strong>
                      <p><span>{receiptResult.voteReference}</span> was submitted for <strong>{receiptResult.electionTitle}</strong> on {new Date(receiptResult.submittedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}.</p>
                    </div>
                    <span className="receipt-lookup-status">{receiptResult.status}</span>
                  </div>
                )}
              </section>

              <section className="animate-fade-up rounded-2xl border border-brand-200 bg-white/90 p-6 shadow-sm sm:p-8">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="m-0 text-xl font-bold text-brand-900">Available elections</h2>
                    <p className="mt-1 font-sans text-sm text-ink-500">Select an election to inspect the vote breakdown.</p>
                  </div>
                  <span className="rounded-full bg-brand-100 px-3 py-1 font-sans text-xs font-bold text-brand-700">{counts.total} total</span>
                </div>

                {loading ? (
                  <div className="mt-6 grid gap-5 md:grid-cols-2" aria-busy="true">
                    {[0, 1].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl bg-brand-200/70" />)}
                  </div>
                ) : elections.length === 0 ? (
                  <div className="mt-6 rounded-2xl border-2 border-dashed border-brand-200 bg-white/60 p-12 text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-600">{Icons.chart}</div>
                    <h3 className="mt-4 font-bold text-brand-900">No elections available</h3>
                    <p className="mt-1 font-sans text-sm text-ink-500">Election results will appear here once an election has been created.</p>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    {elections.map((election) => (
                      <article key={election._id} className="result-card">
                        <div className="result-top">
                          <div className="result-icon">{Icons.chart}</div>
                          <StatusBadge status={election.status} />
                        </div>
                        {(election.courses?.length ? election.courses : election.course ? [election.course] : []).map((course) => <span key={course} className="inline-flex w-fit rounded-full bg-brand-50 px-2.5 py-1 font-sans text-[11px] font-bold text-brand-700 ring-1 ring-brand-500/15">{course}</span>)}
                        <h3 className="result-title">{election.title}</h3>
                        <Link to={`/voter/elections/${election._id}/results`} className="result-link">View statistics {Icons.arrowRight}</Link>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <div className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-100/70 p-4 font-sans text-sm text-brand-900">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">✓</span>
                <span>Results are read-only summaries of encrypted ballots. Published outcomes remain available for transparent review.</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
