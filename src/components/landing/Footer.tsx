import Link from "next/link";

export default function Footer() {
  return (
    <footer id="community" className="footer">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 sm:flex-row">
        {/* Left */}
        <p className="text-sm font-medium text-black/70">
          © PredictIQ 2026. All rights reserved.
        </p>

        {/* Social */}
        <div className="flex items-center gap-5">
          <a
            href="https://x.com/predictiq"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
            className="text-black/70 hover:text-black transition-colors"
          >
            {/* X/Twitter icon */}
            <svg width="18" height="18" viewBox="0 0 512 512" fill="currentColor">
              <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z" />
            </svg>
          </a>
          <a
            href="https://t.me/predictiq"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
            className="text-black/70 hover:text-black transition-colors"
          >
            {/* Telegram icon */}
            <svg width="18" height="18" viewBox="0 0 496 512" fill="currentColor">
              <path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm121.8 169.9l-40.7 191.8c-3 13.6-11.1 16.9-22.4 10.5l-62-45.7-29.9 28.8c-3.3 3.3-6.1 6.1-12.5 6.1l4.4-63.1 114.9-103.8c5-4.4-1.1-6.9-7.7-2.5l-142 89.4-61.2-19.1c-13.3-4.2-13.6-13.3 2.8-19.7l239.1-92.2c11.1-4 20.8 2.7 17.2 19.5z" />
            </svg>
          </a>
          <a
            href="https://discord.gg/predictiq"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Discord"
            className="text-black/70 hover:text-black transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 640 512" fill="currentColor">
              <path d="M524.531 69.836a1.5 1.5 0 00-.764-.7A485.065 485.065 0 00404.081 32.03a1.816 1.816 0 00-1.923.91 337.461 337.461 0 00-14.9 30.6 447.848 447.848 0 00-134.426 0 309.541 309.541 0 00-15.135-30.6 1.89 1.89 0 00-1.924-.91 483.689 483.689 0 00-119.688 37.107 1.712 1.712 0 00-.788.676C39.068 183.651 18.186 294.69 28.43 404.354a2.016 2.016 0 00.765 1.375 487.666 487.666 0 00146.825 74.189 1.9 1.9 0 002.063-.676A348.2 348.2 0 00208.12 430.4a1.86 1.86 0 00-1.019-2.588 321.173 321.173 0 01-45.868-21.853 1.885 1.885 0 01-.185-3.126 251.047 251.047 0 009.109-7.137 1.819 1.819 0 011.9-.256c96.229 43.917 200.41 43.917 295.5 0a1.812 1.812 0 011.924.233 234.533 234.533 0 009.132 7.16 1.884 1.884 0 01-.162 3.126 301.407 301.407 0 01-45.89 21.83 1.875 1.875 0 00-1 2.611 391.055 391.055 0 0030.014 48.815 1.864 1.864 0 002.063.7A486.048 486.048 0 00610.7 405.729a1.882 1.882 0 00.765-1.352c12.264-126.783-20.532-236.912-86.934-334.541zM222.491 337.58c-28.972 0-52.844-26.587-52.844-59.239s23.409-59.241 52.844-59.241c29.665 0 53.306 26.82 52.843 59.239 0 32.654-23.41 59.241-52.843 59.241zm195.38 0c-28.971 0-52.843-26.587-52.843-59.239s23.409-59.241 52.843-59.241c29.667 0 53.307 26.82 52.844 59.239 0 32.654-23.176 59.241-52.844 59.241z" />
            </svg>
          </a>
        </div>

        {/* Right links */}
        <div className="flex items-center gap-5 text-sm">
          <Link href="/terms" className="text-black/70 hover:text-black underline transition-colors">
            Terms
          </Link>
          <span className="text-black/30">|</span>
          <Link href="/privacy" className="text-black/70 hover:text-black underline transition-colors">
            Privacy
          </Link>
          <span className="text-black/30">|</span>
          <Link href="https://docs.predictiq.app" className="text-black/70 hover:text-black underline transition-colors">
            Docs
          </Link>
        </div>
      </div>
    </footer>
  );
}
