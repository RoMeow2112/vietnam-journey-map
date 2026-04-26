import { useState } from "react";
import { motion } from "framer-motion";
import { PROVINCES, type Province } from "@/constants/mapData";

interface VietnamMapProps {
  onSelectProvince: (province: Province) => void;
}

/**
 * Modular Vietnam map component.
 * Renders a stylized SVG with one <path> per province from constants/mapData.
 * Swap the SVG markup for Goong Map API later by replacing the <svg> below
 * while keeping the same `onSelectProvince` interface.
 */
export const VietnamMap = ({ onSelectProvince }: VietnamMapProps) => {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <svg
        viewBox="0 0 400 820"
        className="w-full h-auto drop-shadow-soft"
        role="img"
        aria-label="Interactive map of Vietnam"
      >
        {/* Soft sea backdrop */}
        <defs>
          <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary-soft))" />
            <stop offset="100%" stopColor="hsl(var(--background))" />
          </linearGradient>
        </defs>
        <rect width="400" height="820" fill="url(#sea)" rx="24" />

        {/* Country outline silhouette for context */}
        <path
          d="M 175 50 Q 260 50 270 110 Q 290 160 250 220 Q 320 220 330 270 Q 320 340 280 380 Q 310 430 295 500 Q 280 580 250 640 Q 250 720 180 740 Q 90 760 60 800 L 40 770 Q 100 700 160 680 Q 200 600 200 520 Q 180 440 200 360 Q 180 280 175 220 Q 150 150 175 50 Z"
          fill="hsl(var(--map-province))"
          stroke="hsl(var(--map-province-stroke))"
          strokeWidth="1.5"
          opacity="0.4"
        />

        {PROVINCES.map((p, i) => {
          const isHovered = hovered === p.id;
          return (
            <motion.g
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectProvince(p)}
              className="cursor-pointer"
            >
              <path
                d={p.path}
                fill={isHovered ? "hsl(var(--map-province-hover))" : "hsl(var(--map-province))"}
                stroke="hsl(var(--map-province-stroke))"
                strokeWidth="1.5"
                style={{ transition: "fill 0.25s ease" }}
              />
              <circle
                cx={p.labelPos[0]}
                cy={p.labelPos[1]}
                r={isHovered ? 5 : 3.5}
                fill="hsl(var(--primary))"
                style={{ transition: "r 0.2s ease" }}
              />
              <text
                x={p.labelPos[0] + 10}
                y={p.labelPos[1] + 4}
                fontSize="12"
                fontWeight={isHovered ? 700 : 500}
                fill={isHovered ? "hsl(var(--primary))" : "hsl(var(--foreground))"}
                className="select-none pointer-events-none"
              >
                {p.name}
              </text>
            </motion.g>
          );
        })}
      </svg>

      {hovered && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card text-card-foreground px-4 py-2 rounded-full shadow-soft text-sm font-medium border border-border animate-fade-in">
          Click <span className="text-primary font-semibold">{PROVINCES.find(p => p.id === hovered)?.name}</span> to explore
        </div>
      )}
    </div>
  );
};
