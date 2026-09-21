import { useState } from "react";

export default function BrandLogo() {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          fontWeight: 900,
          fontSize: "1.1rem",
          color: "white",
          letterSpacing: "-0.02em",
          fontFamily: "Inter, sans-serif",
        }}
      >
        C
      </span>
    );
  }

  return (
    <img
      src="/logo.png"
      alt="CPSU E-Voting logo"
      onError={() => setImageFailed(true)}
      style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
    />
  );
}
