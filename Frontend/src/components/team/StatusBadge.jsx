import React from 'react';

const STATUS_CONFIG = {
  available: {
    label: 'Available',
    icon: '🟢',
    light: {
      background: 'rgba(34, 197, 94, 0.1)',
      color: '#15803d',
      border: '1px solid rgba(34, 197, 94, 0.25)',
    },
    dark: {
      background: 'rgba(34, 197, 94, 0.15)',
      color: '#4ade80',
      border: '1px solid rgba(34, 197, 94, 0.3)',
    },
  },
  occupied: {
    label: 'Occupied',
    icon: '🔴',
    light: {
      background: 'rgba(239, 68, 68, 0.1)',
      color: '#b91c1c',
      border: '1px solid rgba(239, 68, 68, 0.25)',
    },
    dark: {
      background: 'rgba(239, 68, 68, 0.15)',
      color: '#f87171',
      border: '1px solid rgba(239, 68, 68, 0.3)',
    },
  },
  inactive: {
    label: 'Inactive',
    icon: '🟡',
    light: {
      background: 'rgba(234, 179, 8, 0.1)',
      color: '#a16207',
      border: '1px solid rgba(234, 179, 8, 0.25)',
    },
    dark: {
      background: 'rgba(234, 179, 8, 0.15)',
      color: '#fde047',
      border: '1px solid rgba(234, 179, 8, 0.3)',
    },
  },
};

/**
 * Status badge component for team members
 * Supports dynamic status: available, occupied, inactive
 * Fully compatible with dark mode via inline styles
 *
 * @param {string} status - User status (available, occupied, inactive)
 * @param {boolean} [isDark] - Optional dark mode flag. Auto-detects from <html> class if omitted.
 */
const StatusBadge = ({ status, isDark: isDarkProp }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.inactive;

  // Auto-detect dark mode from the html element if isDark prop is not provided
  const isDark = isDarkProp !== undefined
    ? isDarkProp
    : document.documentElement.classList.contains('dark');

  const themeStyles = isDark ? config.dark : config.light;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        background: themeStyles.background,
        color: themeStyles.color,
        border: themeStyles.border,
        transition: 'background 0.2s, color 0.2s, border 0.2s',
      }}
    >
      <span style={{ fontSize: '10px', lineHeight: 1 }}>{config.icon}</span>
      {config.label}
    </span>
  );
};

export default StatusBadge;
