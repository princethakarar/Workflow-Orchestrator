import React from 'react';

/**
 * ComponentLoader — Shimmer skeleton loader for individual cards, tables, and containers.
 *
 * Matches the app's indigo/violet palette and renders animated placeholder
 * bars that indicate content is loading within a specific component.
 *
 * @param {string}  message  – Optional loading message (e.g. "Loading chart…")
 * @param {number}  rows     – Number of shimmer rows to render (default: 3)
 * @param {string}  height   – Optional fixed height for the container
 * @param {string}  variant  – 'card' | 'table' | 'stat' | 'chart' (adjusts shimmer layout)
 */
const ComponentLoader = ({ message, rows = 3, height, variant = 'card' }) => {
    const shimmerRows = [];

    if (variant === 'stat') {
        // Compact: icon placeholder + two text lines
        shimmerRows.push(
            <div key="stat" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="cl-shimmer" style={{ width: 42, height: 42, borderRadius: '10px', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="cl-shimmer" style={{ width: '55%', height: 10, borderRadius: 6 }} />
                    <div className="cl-shimmer" style={{ width: '35%', height: 18, borderRadius: 6 }} />
                </div>
            </div>
        );
    } else if (variant === 'chart') {
        // Chart placeholder: header bar + fake chart area
        shimmerRows.push(
            <div key="chart-head" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="cl-shimmer" style={{ width: 140, height: 12, borderRadius: 6 }} />
                    <div className="cl-shimmer" style={{ width: 100, height: 8, borderRadius: 4 }} />
                </div>
                <div className="cl-shimmer" style={{ width: 60, height: 28, borderRadius: 8 }} />
            </div>,
            <div key="chart-bars" style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
                {[65, 40, 80, 55, 90, 30, 70].map((h, i) => (
                    <div key={i} className="cl-shimmer" style={{ flex: 1, height: `${h}%`, borderRadius: '6px 6px 0 0' }} />
                ))}
            </div>
        );
    } else if (variant === 'table') {
        // Table placeholder: header row + data rows
        shimmerRows.push(
            <div key="thead" style={{ display: 'flex', gap: 16, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                {[90, 70, 60, 50, 70].map((w, i) => (
                    <div key={i} className="cl-shimmer" style={{ width: w, height: 8, borderRadius: 4 }} />
                ))}
            </div>
        );
        for (let i = 0; i < rows; i++) {
            shimmerRows.push(
                <div key={`row-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0' }}>
                    <div className="cl-shimmer" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
                    <div className="cl-shimmer" style={{ width: `${60 + (i % 3) * 10}%`, height: 10, borderRadius: 6 }} />
                    <div className="cl-shimmer" style={{ width: 50, height: 10, borderRadius: 6, marginLeft: 'auto' }} />
                </div>
            );
        }
    } else {
        // Default card: text-like shimmer rows
        for (let i = 0; i < rows; i++) {
            shimmerRows.push(
                <div key={i} className="cl-shimmer" style={{
                    width: `${85 - i * 15}%`,
                    height: i === 0 ? 14 : 10,
                    borderRadius: 6,
                }} />
            );
        }
    }

    return (
        <div
            className="component-loader"
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: variant === 'stat' ? '0' : '12px',
                padding: variant === 'stat' ? '0' : '20px 24px',
                minHeight: height || 'auto',
                justifyContent: variant === 'chart' ? 'flex-start' : 'center',
            }}
        >
            {shimmerRows}

            {message && (
                <p style={{
                    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                    margin: '8px 0 0 0',
                    textAlign: 'center',
                    letterSpacing: '0.01em',
                }}>
                    {message}
                </p>
            )}
        </div>
    );
};

export default ComponentLoader;
