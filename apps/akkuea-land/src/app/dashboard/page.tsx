import { GameShell } from "@/components/layout/GameShell";

export const metadata = {
  title: "Dashboard | Akkuea Land",
};

export default function DashboardPage() {
  return (
    <GameShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold text-land-fg">Player Dashboard</h1>
        <p className="text-land-fg-muted">
          Your portfolio, LAND balance, and income stats will appear here.
        </p>
      </div>
    </GameShell>
  );
}
