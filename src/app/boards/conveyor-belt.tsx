"use client";

/**
 * A playful conveyor-belt animation showing colorful ticket boxes
 * rolling across rollers. Pure CSS animation — no JS timers.
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
    <div className="relative w-full overflow-hidden rounded-xl border bg-gradient-to-b from-muted/30 to-muted/60 py-6">
      {/* Factory title */}
      <div className="absolute top-2 left-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
        FlowLine™ Production Line
      </div>

      {/* Conveyor track */}
      <div className="relative mx-8 mt-4">
        {/* Moving boxes */}
        <div className="flex animate-conveyor gap-6">
          {allBoxes.map((box, i) => (
            <div
              key={i}
              className="relative flex h-14 w-20 shrink-0 items-center justify-center rounded-md shadow-md transition-transform"
              style={{
                backgroundColor: box.color,
                animation: `bob ${1.2 + (i % 3) * 0.2}s ease-in-out infinite`,
              }}
            >
              <span className="text-[10px] font-bold text-white/90 select-none">
                {box.label}
              </span>
              {/* Shine effect */}
              <div className="absolute inset-0 rounded-md bg-gradient-to-br from-white/20 to-transparent" />
            </div>
          ))}
        </div>

        {/* Belt / track line */}
        <div className="mt-1 flex items-center gap-0">
          {/* Roller drums */}
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center" style={{ flex: 1 }}>
              <div className="h-0.5 w-full bg-muted-foreground/20" />
              <div
                className="mt-0.5 h-3 w-3 rounded-full border-2 border-muted-foreground/30 bg-muted"
                style={{
                  animation: `spin ${0.8}s linear infinite`,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Animated arrows showing direction */}
      <div className="mt-2 flex justify-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="text-xs text-muted-foreground/40"
            style={{
              animation: `fadeArrow 1.5s ease-in-out ${i * 0.3}s infinite`,
            }}
          >
            →
          </span>
        ))}
      </div>

      <style jsx>{`
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes fadeArrow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
