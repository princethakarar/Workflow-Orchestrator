import React from 'react';

const F = "'Inter', 'Plus Jakarta Sans', sans-serif";

/**
 * WorkflowLoader — Full-page fixed overlay with pipeline animation.
 *
 * Renders above ALL layout elements (sidebar, header, content).
 * @param {string}  message – Context-specific loading label
 */
const WorkflowLoader = ({ message = 'Loading…' }) => {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 99999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '32px',
                background: 'var(--bg-page)',
            }}
        >
            {/* Pipeline animation */}
            <div className="workflow-loader-pipeline">
                {/* Node 1 */}
                <div className="wl-node wl-node-1">
                    <div className="wl-node-inner" />
                    <div className="wl-node-ring" />
                </div>

                {/* Connector 1→2 */}
                <div className="wl-connector">
                    <div className="wl-connector-line" />
                    <div className="wl-connector-dot" />
                </div>

                {/* Node 2 */}
                <div className="wl-node wl-node-2">
                    <div className="wl-node-inner" />
                    <div className="wl-node-ring" />
                </div>

                {/* Connector 2→3 */}
                <div className="wl-connector">
                    <div className="wl-connector-line" />
                    <div className="wl-connector-dot wl-connector-dot-delayed" />
                </div>

                {/* Node 3 */}
                <div className="wl-node wl-node-3">
                    <div className="wl-node-inner" />
                    <div className="wl-node-ring" />
                </div>
            </div>

            {/* Label */}
            <p
                className="wl-label"
                style={{
                    fontFamily: F,
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    margin: 0,
                    letterSpacing: '0.01em',
                }}
            >
                {message}
            </p>
        </div>
    );
};

export default WorkflowLoader;
