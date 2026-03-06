"use client";

/**
 * Neon arcade conveyor-belt animation — colorful gradient boxes
 * rolling across glowing rollers. Pure CSS animation.
 */
export function ConveyorBelt() {
  const boxes = [
    { color: "linear-gradient(135deg, #6366f1, #4338ca)", label: "BUG" },
    { color: "linear-gradient(135deg, #f59e0b, #d97706)", label: "TASK" },
    { color: "linear-gradient(135deg, #10b981, #059669)", label: "FEAT" },
    { color: "linear-gradient(135deg, #ef4444, #dc2626)", label: "BUG" },
    { color: "linear-gradient(135deg, #8b5cf6, #7c3aed)", label: "TASK" },
    { color: "linear-gradient(135deg, #3b82f6, #2563eb)", label: "FEAT" },
    { color: "linear-gradient(135deg, #f97316, #ea580c)", label: "BUG" },
    { color: "linear-gradient(135deg, #14b8a6, #0d9488)", label: "TASK" },
  ];

  // Duplicate for seamless loop
  const allBoxes = [...boxes, ...boxes];

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-neon-cyan/20 py-6"
      style={{
        background: "linear-gradient(135deg, oklch(0.12 0.04 290), oklch(0.18 0.06 290))",
        boxShadow: "0 0 30px oklch(0.82 0.16 195 / 0.06)",
      }}
    >
      {/* Factory title */}
      <div className="absolute top-2 left-4 font-[Orbitron] text-[8px] font-bold tracking-[3px] text-neon-cyan/40">
        ⚡ PRODUCTION LINE
      </div>

      {/* Conveyor track */}
      <div className="relative mx-8 mt-4">
        {/* Moving boxes */}
        <div className="flex animate-conveyor gap-5">
          {allBoxes.map((box, i) => (
            <div
              key={i}
              className="relative flex h-[52px] w-[72px] shrink-0 items-center justify-center rounded-lg shadow-lg"
              style={{
                background: box.color,
                animation: `floatBox ${2 + (i % 3) * 0.3}s ease-in-out infinite alternate`,
                boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
              }}
            >
              <span className="font-[Orbitron] text-[9px] font-bold text-white/90 select-none">
                {box.label}
              </span>
              {/* Shine overlay */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/15 to-transparent" />
            </div>
          ))}
        </div>

        {/* Roller drums */}
        <div className="mt-2 flex items-center justify-around">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="h-3 w-3 rounded-full border-2 border-neon-cyan/20 bg-neon-cyan/5"
              style={{ animation: "spin 0.8s linear infinite" }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes floatBox {
          0% { transform: translateY(0); }
          100% { transform: translateY(-5px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
