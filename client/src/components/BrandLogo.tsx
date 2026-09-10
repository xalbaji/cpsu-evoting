import { useState } from "react";

export default function BrandLogo() {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <span className="brand-logo">
      {imageFailed ? (
        <span className="brand-mark">C</span>
      ) : (
        <img
          src="/logo.png"
          alt="CPSU E-Voting logo"
          onError={() => setImageFailed(true)}
        />
      )}
    </span>
  );
}
