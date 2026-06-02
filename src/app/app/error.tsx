"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="app-error-page">
      <div className="app-error-content">
        <div className="app-error-icon">⚠️</div>
        <h2 className="app-error-title">Something went wrong</h2>
        <p className="app-error-desc">
          {error.message || "An unexpected error occurred. Our team has been notified."}
        </p>
        {error.digest && (
          <p className="app-error-digest">Error ID: {error.digest}</p>
        )}
        <div className="app-error-actions">
          <button onClick={reset} className="app-error-retry-btn">
            Try Again
          </button>
          <a href="/app/dashboard" className="app-error-home-btn">
            ← Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
