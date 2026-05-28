import { GameShell } from "@/components/layout/GameShell";

export const metadata = {
  title: "City Map | Akkuea Land",
};

export default function MapPage() {
  return (
    <GameShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold text-land-fg">City Map</h1>
        <p className="text-land-fg-muted">
          The interactive tile grid will render here.
        </p>
      </div>
    </GameShell>
  );
}
