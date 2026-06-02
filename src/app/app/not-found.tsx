import Link from "next/link";

export default function AppNotFound() {
  return (
    <div className="app-error-page">
      <div className="app-error-content">
        <div className="app-error-icon">🔍</div>
        <h2 className="app-error-title">Page Not Found</h2>
        <p className="app-error-desc">
          This page doesn&apos;t exist or has been moved.
        </p>
        <div className="app-error-actions">
          <Link href="/app/dashboard" className="app-error-retry-btn">
            ← Back to Dashboard
          </Link>
          <Link href="/app/markets" className="app-error-home-btn">
            Browse Markets
          </Link>
        </div>
      </div>
    </div>
  );
}
