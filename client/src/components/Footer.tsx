export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer" role="contentinfo">
      <span>© {year} <strong>Central Philippine State University</strong></span>
      <span aria-hidden="true"> · </span>
      <span>CPSU E-Voting System</span>
    </footer>
  );
}
