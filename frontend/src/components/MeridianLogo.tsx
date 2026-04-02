import React from 'react';
import { Box, Typography } from '@mui/material';

interface Props {
  size?: number;
  /** Show the wordmark next to the icon */
  showText?: boolean;
  /** Light variant — white text on dark background */
  light?: boolean;
}

/**
 * Meridian brand logo.
 *
 * Icon concept: A globe seen slightly from above, with golden meridian arcs
 * (longitude lines) and a bright gold star at the north pole — representing
 * a guiding reference point for every student's journey.
 */
const MeridianLogo: React.FC<Props> = ({ size = 36, showText = false, light = false }) => {
  const textColor = light ? '#ffffff' : '#0f3460';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: showText ? 1.25 : 0 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          {/* Globe background: deep navy → teal */}
          <radialGradient id="globe-fill" cx="40%" cy="30%" r="70%">
            <stop offset="0%"   stopColor="#1a6b8a" />
            <stop offset="100%" stopColor="#0d3b56" />
          </radialGradient>

          {/* Pole star glow */}
          <radialGradient id="star-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#fde68a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>

          {/* Outer ring highlight */}
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#5eead4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* ── Globe body ── */}
        <circle cx="24" cy="24" r="22" fill="url(#globe-fill)" />

        {/* ── Outer glow ring ── */}
        <circle cx="24" cy="24" r="22" stroke="url(#ring-grad)" strokeWidth="1.5" fill="none" />

        {/* ── Latitude line (equator) ── */}
        <ellipse cx="24" cy="30" rx="20" ry="5"
          stroke="rgba(255,255,255,0.18)" strokeWidth="1" fill="none" />

        {/* ── Meridian arcs (longitude lines) — left and right curves ── */}
        {/* Central meridian */}
        <path d="M24 3 C32 14 32 34 24 45" stroke="rgba(255,255,255,0.30)" strokeWidth="1.2" fill="none" />
        <path d="M24 3 C16 14 16 34 24 45" stroke="rgba(255,255,255,0.30)" strokeWidth="1.2" fill="none" />

        {/* Golden highlighted meridian arc (slightly offset for drama) */}
        <path d="M24 3 C36 16 36 36 24 45"
          stroke="#f59e0b" strokeWidth="1.8" fill="none" strokeOpacity="0.85"
          strokeLinecap="round" />

        {/* ── North Pole star ── */}
        {/* Glow halo */}
        <circle cx="24" cy="6" r="5.5" fill="rgba(253,230,138,0.25)" />
        {/* 4-pointed sparkle */}
        <path
          d="M24 2 L25.3 5.3 L29 6 L25.3 6.7 L24 10 L22.7 6.7 L19 6 L22.7 5.3 Z"
          fill="url(#star-glow)"
        />

        {/* ── Subtle continent-like highlights for depth ── */}
        <ellipse cx="16" cy="20" rx="4" ry="3" fill="rgba(255,255,255,0.06)" transform="rotate(-20,16,20)" />
        <ellipse cx="32" cy="26" rx="3" ry="2" fill="rgba(255,255,255,0.06)" transform="rotate(10,32,26)" />
      </svg>

      {showText && (
        <Box>
          <Typography
            variant="h6"
            component="span"
            sx={{
              fontWeight: 900,
              fontSize: size * 0.47,
              color: textColor,
              letterSpacing: '0.04em',
              lineHeight: 1,
              fontFamily: '"Inter", "Roboto", sans-serif',
            }}
          >
            MERIDIAN
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MeridianLogo;
