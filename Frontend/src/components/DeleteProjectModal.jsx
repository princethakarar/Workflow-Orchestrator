import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Trash2, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const F = "'Inter', 'Plus Jakarta Sans', sans-serif";

const DeleteProjectModal = ({ isOpen, onClose, project, onConfirm, loading }) => {
  const { isDark } = useTheme();
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) setError(null);
  }, [isOpen]);

  if (!isOpen || !project) return null;

  const teamSize = (project.team?.length || 0) + (project.manager ? 1 : 0);

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete project');
    }
  };

  // ── Design tokens ──────────────────────────────────────────────────────────
  const surface = {
    overlay:     isDark ? 'rgba(0,0,0,0.72)'               : 'rgba(15,23,42,0.55)',
    modal:       isDark ? '#161B2E'                          : '#ffffff',
    header:      'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)',
    body:        isDark ? '#161B2E'                          : '#ffffff',
    footerBg:    isDark ? 'rgba(10,13,22,0.6)'             : '#f8fafc',
    footerBdr:   isDark ? 'rgba(99,102,241,0.1)'           : '#f1f5f9',
    warnBg:      isDark ? 'rgba(217,119,6,0.12)'           : '#fffbeb',
    warnBdr:     isDark ? '#92400e'                         : '#f59e0b',
    warnText:    isDark ? '#fbbf24'                         : '#92400e',
    warnTextSub: isDark ? '#d97706'                         : '#b45309',
    teamBg:      isDark ? 'rgba(99,102,241,0.08)'          : '#eef2ff',
    teamBdr:     isDark ? 'rgba(99,102,241,0.2)'           : '#c7d2fe',
    errorBg:     isDark ? 'rgba(239,68,68,0.1)'            : '#fef2f2',
    errorBdr:    isDark ? 'rgba(239,68,68,0.25)'           : '#fecaca',
    cancelBdr:   isDark ? '#374151'                         : '#e2e8f0',
    cancelText:  isDark ? '#94a3b8'                         : '#475569',
    shadow:      isDark
        ? '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.15)'
        : '0 24px 64px rgba(15,23,42,0.15), 0 0 0 1px rgba(226,232,240,0.8)',
  };

  const text = {
    primary:   isDark ? '#f1f5f9' : '#0f172a',
    secondary: isDark ? '#94a3b8' : '#475569',
    muted:     isDark ? '#64748b' : '#94a3b8',
    label:     isDark ? '#cbd5e1' : '#374151',
  };

  const modalContent = (
    <>
      <style>{`
        @keyframes dpmSlideIn {
          from { opacity: 0; transform: scale(0.94) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .dpm-cancel:hover:not(:disabled) {
          background: ${isDark ? 'rgba(99,102,241,0.08)' : '#f1f5f9'} !important;
          border-color: ${isDark ? '#6366f1' : '#cbd5e1'} !important;
          color: ${isDark ? '#c7d2fe' : '#4338ca'} !important;
        }
        .dpm-confirm:hover:not(:disabled) {
          box-shadow: ${isDark
            ? '0 8px 28px rgba(239,68,68,0.4)'
            : '0 8px 28px rgba(239,68,68,0.35)'} !important;
          transform: translateY(-1px);
        }
        .dpm-confirm:active:not(:disabled) { transform: translateY(0); }
      `}</style>

      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0,
          background: surface.overlay,
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: '16px',
        }}
        onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
      >
        {/* Modal card */}
        <div
          style={{
            background: surface.modal,
            borderRadius: '20px',
            boxShadow: surface.shadow,
            width: '100%', maxWidth: '460px',
            overflow: 'hidden',
            animation: 'dpmSlideIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          {/* ── Header ─────────────────────────────────────────── */}
          <div
            style={{
              background: surface.header,
              padding: '20px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertTriangle size={20} color="#fff" />
              </div>
              <div>
                <h2 style={{
                  fontFamily: F, fontSize: '17px', fontWeight: 800,
                  color: '#fff', margin: 0, letterSpacing: '-0.02em',
                }}>
                  Delete Project?
                </h2>
                <p style={{
                  fontFamily: F, fontSize: '12px',
                  color: 'rgba(255,255,255,0.6)',
                  margin: 0, marginTop: '2px',
                }}>
                  This action is permanent and cannot be undone
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px', padding: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                color: '#fff', display: 'flex', alignItems: 'center',
                transition: 'background 0.2s ease',
                opacity: loading ? 0.5 : 1,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Body ───────────────────────────────────────────── */}
          <div style={{ padding: '22px 24px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '12px 14px',
                borderRadius: '10px',
                background: surface.errorBg,
                border: `1px solid ${surface.errorBdr}`,
              }}>
                <AlertCircle size={17} style={{ color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <p style={{ fontFamily: F, fontSize: '12.5px', fontWeight: 700, color: '#ef4444', margin: 0 }}>
                    Error
                  </p>
                  <p style={{ fontFamily: F, fontSize: '12.5px', color: isDark ? '#fca5a5' : '#b91c1c', margin: '2px 0 0' }}>
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Confirmation question */}
            <p style={{
              fontFamily: F, fontSize: '14px',
              color: text.secondary, margin: 0, lineHeight: 1.6,
            }}>
              Are you sure you want to delete{' '}
              <strong style={{ color: text.primary, fontWeight: 700 }}>"{project.name}"</strong>?
            </p>

            {/* Warning box */}
            <div style={{
              padding: '14px',
              borderRadius: '10px',
              background: surface.warnBg,
              borderLeft: `4px solid ${surface.warnBdr}`,
            }}>
              <p style={{
                fontFamily: F, fontSize: '12.5px', fontWeight: 700,
                color: surface.warnText, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                ⚠️ This action cannot be undone
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  'All project data will be permanently deleted',
                  teamSize > 0 && `${teamSize} team member${teamSize !== 1 ? 's' : ''} will be released`,
                  'Project workflows will be removed',
                ].filter(Boolean).map((item, i) => (
                  <li key={i} style={{
                    fontFamily: F, fontSize: '12px',
                    color: surface.warnTextSub,
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: surface.warnBdr, flexShrink: 0, display: 'inline-block' }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Team members info */}
            {teamSize > 0 && (
              <div style={{
                padding: '14px',
                borderRadius: '10px',
                background: surface.teamBg,
                border: `1px solid ${surface.teamBdr}`,
              }}>
                <p style={{
                  fontFamily: F, fontSize: '11.5px', fontWeight: 700,
                  color: isDark ? '#a5b4fc' : '#4338ca',
                  margin: '0 0 10px',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  Team members to be released
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {project.manager && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>
                          {(project.manager.fullName || project.manager.email || 'M').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span style={{ fontFamily: F, fontSize: '12.5px', color: text.primary, fontWeight: 500 }}>
                        {project.manager.fullName || project.manager.email}
                      </span>
                      <span style={{
                        marginLeft: 'auto',
                        fontFamily: F, fontSize: '10.5px', fontWeight: 600,
                        color: isDark ? '#818cf8' : '#4f46e5',
                        background: isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff',
                        padding: '2px 8px', borderRadius: '999px',
                      }}>
                        Manager
                      </span>
                    </div>
                  )}
                  {project.team?.slice(0, 3).map((member, index) => (
                    <div key={member.user?._id || index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: 'linear-gradient(135deg,#8b5cf6,#a78bfa)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>
                          {(member.user?.fullName || member.user?.email || 'D').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span style={{ fontFamily: F, fontSize: '12.5px', color: text.secondary }}>
                        {member.user?.fullName || member.user?.email || 'Team Member'}
                      </span>
                    </div>
                  ))}
                  {project.team?.length > 3 && (
                    <p style={{ fontFamily: F, fontSize: '11.5px', color: text.muted, margin: '2px 0 0 32px' }}>
                      + {project.team.length - 3} more developer{project.team.length - 3 !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Footer / Actions ────────────────────────────────── */}
          <div
            style={{
              display: 'flex', gap: '12px',
              padding: '14px 24px 20px',
              borderTop: `1px solid ${surface.footerBdr}`,
              background: surface.footerBg,
            }}
          >
            {/* Cancel */}
            <button
              onClick={onClose}
              disabled={loading}
              className="dpm-cancel"
              style={{
                flex: 1,
                padding: '11px 20px',
                borderRadius: '10px',
                border: `1.5px solid ${surface.cancelBdr}`,
                background: 'transparent',
                color: surface.cancelText,
                fontFamily: F,
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.5 : 1,
              }}
            >
              Cancel
            </button>

            {/* Delete */}
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="dpm-confirm"
              style={{
                flex: 2,
                padding: '11px 20px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)',
                color: '#ffffff',
                fontFamily: F,
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 14px rgba(239,68,68,0.35)',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    border: '2.5px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff',
                    animation: 'spin 0.8s linear infinite',
                    flexShrink: 0,
                  }} />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 size={15} />
                  Confirm Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default DeleteProjectModal;
