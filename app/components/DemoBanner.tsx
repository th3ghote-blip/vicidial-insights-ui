const BOOKING_URL = "https://cal.com/th3-ghote-6rxzwh/vicidial-demo";
const SITE_URL = "https://vicidialintelligence.com";

export default function DemoBanner() {
  return (
    <div className="bg-emerald-600 text-white text-xs sm:text-sm">
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-center gap-2 sm:gap-4 flex-wrap text-center">
        <span className="opacity-90">
          Live demo with sample data — this could be running on{" "}
          <span className="font-semibold">your</span> Vicidial in 48 hours.
        </span>
        <span className="flex items-center gap-3 shrink-0">
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            Book a free demo →
          </a>
          <a
            href={SITE_URL}
            className="hidden sm:inline opacity-75 hover:opacity-100 underline underline-offset-2 transition-opacity"
          >
            Learn more
          </a>
        </span>
      </div>
    </div>
  );
}
