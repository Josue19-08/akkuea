import Link from "next/link";

export const metadata = {
  title: "Akkuea Land | City Builder on Stellar",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-land-bg flex flex-col items-center justify-center p-8 text-center gap-8">
      {/* Logo mark */}
      <div className="flex flex-col items-center gap-3">
        <span className="text-6xl text-land-accent">◈</span>
        <h1 className="text-4xl font-bold text-land-fg tracking-tight">
          Akkuea Land
        </h1>
        <p className="text-land-fg-muted max-w-md text-sm leading-relaxed">
          Build, own, and trade virtual land parcels backed by real-world assets
          on the Stellar blockchain.
        </p>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/map"
          className="px-6 py-3 rounded-xl bg-land-accent text-land-bg font-bold text-sm hover:opacity-90 transition-opacity"
        >
          Open City Map
        </Link>
        <Link
          href="/marketplace"
          className="px-6 py-3 rounded-xl bg-land-surface border border-land-border text-land-fg font-medium text-sm hover:border-land-border-hover transition-colors"
        >
          Browse Marketplace
        </Link>
      </div>

      {/* Quick stats row */}
      <div className="flex gap-8 text-center mt-4">
        {[
          { label: "Total Tiles", value: "10,000" },
          { label: "Network", value: "Stellar" },
          { label: "Token", value: "LAND" },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-1">
            <span className="text-lg font-bold text-land-fg font-mono">
              {value}
            </span>
            <span className="text-xs text-land-fg-subtle uppercase tracking-wider">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
