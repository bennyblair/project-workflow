"use client";

/**
 * 16-Bit RPG mine-cart railway — colorful bouncing boxes
 * rolling along wooden rails. Pure CSS animation.
 */
export function ConveyorBelt() {
  const boxes = [
    { color: "#6366f1", label: "BUG" },
    { color: "#f59e0b", label: "TASK" },
    { color: "#10b981", label: "FEAT" },
    { color: "#ef4444", label: "BUG" },
    { color: "#8b5cf6", label: "TASK" },
    { color: "#3b82f6", label: "FEAT" },
    { color: "#f97316", label: "BUG" },
    { color: "#14b8a6", label: "TASK" },
  ];

  // Duplicate for seamless loop
  const allBoxes = [...boxes, ...boxes];

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border-4 border-rpg-wood py-4"
      style={{
        background: "linear-gradient(180deg, #fef9c3, #fde68a)",
        boxShadow: "4px 4px 0 rgba(146,64,14,0.3)",
      }}
    >
      {/* Railway label */}
      <div className="absolute top-1 left-3 font-['Press_Start_2P'] text-[7px] text-rpg-wood/60">
        🛤️ TICKET RAILWAY
      </div>

      {/* Track with moving boxes */}
      <div className="relative mx-6 mt-4">
        <div className="flex animate-conveyor gap-4">
          {allBoxes.map((box, i) => (
            <div
              key={i}
              className="flex h-12 w-[60px] shrink-0 items-center justify-center rounded border-[3px] border-black/20 shadow-[2px_2px_0_rgba(0,0,0,0.15)]"
              style={{
                background: box.color,
                animation: `bounce 0.8s ease-in-out infinite alternate ${i % 2 ? "0.3s" : "0s"}`,
              }}
            >
              <span className="font-['Press_Start_2P'] text-[7px] text-white select-none">
                {box.label}
              </span>
            </div>
          ))}
        </div>

        {/* Wooden railroad ties */}
        <div className="mt-2 flex justify-around px-2">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 w-6 rounded-sm bg-rpg-wood"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
