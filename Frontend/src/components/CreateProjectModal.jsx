import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { projectAPI } from '../services/projectService'
import { toast } from 'react-toastify'
import { X } from 'lucide-react'
import { useProjectManagers } from '../hooks/useProjectManagers'
import { useTheme } from '../context/ThemeContext'

const F = "'Inter', 'Plus Jakarta Sans', sans-serif"

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
    const { isDark } = useTheme()
    const [loading, setLoading] = useState(false)
    const [dateError, setDateError] = useState('')
    const { managers, loading: managersLoading } = useProjectManagers()
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        priority: 'medium',
        tags: '',
        managerId: ''
    })

    useEffect(() => {
        if (!formData.startDate || !formData.endDate) {
            setDateError('')
            return
        }
        if (formData.endDate < formData.startDate) {
            setDateError('End date cannot be earlier than start date')
        } else {
            setDateError('')
        }
    }, [formData.startDate, formData.endDate])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            toast.error('Project name is required')
            return
        }

        if (!formData.managerId) {
            toast.error('Project Manager is required')
            return
        }

        if (dateError) {
            toast.error(dateError)
            return
        }

        setLoading(true)
        try {
            const tags = formData.tags
                ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
                : []

            const projectData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                startDate: formData.startDate || undefined,
                endDate: formData.endDate || undefined,
                priority: formData.priority,
                tags,
                managerId: formData.managerId
            }

            const response = await projectAPI.createProject(projectData)
            toast.success('Project created successfully!')

            setFormData({
                name: '',
                description: '',
                startDate: '',
                endDate: '',
                priority: 'medium',
                tags: '',
                managerId: ''
            })

            if (onProjectCreated) {
                onProjectCreated(response.data)
            }

            onClose()
        } catch (error) {
            console.error('Error creating project:', error)
            toast.error(error.response?.data?.message || 'Failed to create project')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    // ── Design tokens ──────────────────────────────────────────────────────────
    const surface = {
        overlay:    isDark ? 'rgba(0,0,0,0.72)'               : 'rgba(15,23,42,0.55)',
        modal:      isDark ? '#161B2E'                          : '#ffffff',
        header:     isDark ? 'linear-gradient(135deg,#3730A3 0%,#5B21B6 100%)' : 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)',
        section:    isDark ? 'rgba(255,255,255,0.03)'          : '#f8fafc',
        sectionBdr: isDark ? 'rgba(99,102,241,0.12)'          : '#f1f5f9',
        inputBg:    isDark ? '#0D1117'                          : '#ffffff',
        inputBdr:   isDark ? '#2D3748'                          : '#e2e8f0',
        inputBdrFocus: isDark ? '#6366f1'                      : '#6366f1',
        inputFocusGlow: isDark
            ? '0 0 0 3px rgba(99,102,241,0.25), 0 2px 8px rgba(0,0,0,0.3)'
            : '0 0 0 3px rgba(99,102,241,0.12), 0 2px 8px rgba(99,102,241,0.06)',
        cancelBg:   isDark ? 'transparent'                     : 'transparent',
        cancelBdr:  isDark ? '#374151'                         : '#e2e8f0',
        cancelText: isDark ? '#94a3b8'                         : '#475569',
        cancelHoverBg:  isDark ? 'rgba(99,102,241,0.08)'      : '#f1f5f9',
        cancelHoverBdr: isDark ? '#6366f1'                     : '#cbd5e1',
        footerBg:   isDark ? 'rgba(10,13,22,0.6)'            : '#f8fafc',
        footerBdr:  isDark ? 'rgba(99,102,241,0.1)'           : '#f1f5f9',
        shadow:     isDark
            ? '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.15)'
            : '0 24px 64px rgba(15,23,42,0.15), 0 0 0 1px rgba(226,232,240,0.8)',
    }

    const text = {
        primary:   isDark ? '#f1f5f9'  : '#0f172a',
        secondary: isDark ? '#94a3b8'  : '#475569',
        muted:     isDark ? '#64748b'  : '#94a3b8',
        label:     isDark ? '#cbd5e1'  : '#374151',
        required:  isDark ? '#f87171'  : '#ef4444',
    }

    const errorTextStyle = {
        fontFamily: F,
        fontSize: '11.5px',
        color: text.required,
        marginTop: '6px',
        fontWeight: 600,
    }

    const priorityOptions = [
        { value: 'low',      label: 'Low',      color: isDark ? '#6b7280' : '#6b7280' },
        { value: 'medium',   label: 'Medium',   color: isDark ? '#60a5fa' : '#3b82f6' },
        { value: 'high',     label: 'High',     color: isDark ? '#f97316' : '#ea580c' },
        { value: 'critical', label: 'Critical', color: isDark ? '#f87171' : '#ef4444' },
    ]

    const inputStyle = {
        width: '100%',
        padding: '10px 14px',
        borderRadius: '10px',
        border: `1.5px solid ${surface.inputBdr}`,
        background: surface.inputBg,
        fontFamily: F,
        fontSize: '13.5px',
        color: text.primary,
        outline: 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        boxSizing: 'border-box',
    }

    const labelStyle = {
        display: 'block',
        fontFamily: F,
        fontSize: '12px',
        fontWeight: 600,
        color: text.label,
        marginBottom: '7px',
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
    }

    const handleFocus = (e) => {
        e.target.style.borderColor = surface.inputBdrFocus
        e.target.style.boxShadow  = surface.inputFocusGlow
    }
    const handleBlur  = (e) => {
        e.target.style.borderColor = surface.inputBdr
        e.target.style.boxShadow  = 'none'
    }

    const modalContent = (
        <>
            <style>{`
                .cpm-scrollbar::-webkit-scrollbar { width: 5px; }
                .cpm-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .cpm-scrollbar::-webkit-scrollbar-thumb {
                    background: ${isDark ? 'rgba(99,102,241,0.3)' : '#e2e8f0'};
                    border-radius: 6px;
                }
                .cpm-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: ${isDark ? 'rgba(99,102,241,0.5)' : '#cbd5e1'};
                }
                .cpm-input::placeholder { color: ${text.muted}; }
                .cpm-textarea::placeholder { color: ${text.muted}; }
                /* Date input color fix for dark mode */
                .cpm-date::-webkit-calendar-picker-indicator {
                    filter: ${isDark ? 'invert(1) opacity(0.4)' : 'opacity(0.4)'};
                    cursor: pointer;
                }
                .cpm-select option {
                    background: ${isDark ? '#1E293B' : '#ffffff'};
                    color: ${text.primary};
                }
                /* Cancel button hover */
                .cpm-cancel:hover {
                    background: ${surface.cancelHoverBg} !important;
                    border-color: ${surface.cancelHoverBdr} !important;
                    color: ${isDark ? '#c7d2fe' : '#4338ca'} !important;
                }
                /* Submit button hover */
                .cpm-submit:hover:not(:disabled) {
                    box-shadow: ${isDark
                        ? '0 8px 28px rgba(99,102,241,0.5), 0 0 0 1px rgba(99,102,241,0.35)'
                        : '0 8px 28px rgba(99,102,241,0.4)'} !important;
                    transform: translateY(-1px);
                }
                .cpm-submit:active:not(:disabled) { transform: translateY(0); }
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
                    overflowY: 'auto',
                }}
                onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose() }}
            >
                {/* Modal card */}
                <div
                    style={{
                        background: surface.modal,
                        borderRadius: '20px',
                        boxShadow: surface.shadow,
                        width: '100%', maxWidth: '600px',
                        maxHeight: 'calc(100vh - 48px)',
                        display: 'flex', flexDirection: 'column',
                        overflow: 'hidden',
                        animation: 'cpmSlideIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                >
                    <style>{`
                        @keyframes cpmSlideIn {
                            from { opacity: 0; transform: scale(0.94) translateY(12px); }
                            to   { opacity: 1; transform: scale(1) translateY(0); }
                        }
                    `}</style>

                    {/* ── Header ─────────────────────────────────────────── */}
                    <div
                        style={{
                            background: surface.header,
                            padding: '22px 24px 20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            flexShrink: 0,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div>
                                <h2 style={{
                                    fontFamily: F, fontSize: '18px', fontWeight: 800,
                                    color: '#ffffff', margin: 0, letterSpacing: '-0.02em',
                                }}>
                                    Create New Project
                                </h2>
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
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.25)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* ── Form body (scrollable) ──────────────────────────── */}
                    <form
                        onSubmit={handleSubmit}
                        className="cpm-scrollbar"
                        style={{ flex: 1, overflowY: 'auto', padding: '24px' }}
                    >
                        {/* ─ Project Name ─ */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>
                                Project Name
                                <span style={{ color: text.required, fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter project name…"
                                required
                                className="cpm-input"
                                style={inputStyle}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                            />
                        </div>

                        {/* ─ Description ─ */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe your project goals and scope…"
                                rows={3}
                                className="cpm-textarea"
                                style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                            />
                        </div>

                        {/* ─ Project Manager ─ */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>
                                Project Manager
                                <span style={{ color: text.required, fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>*</span>
                            </label>
                            <div>
                                <select
                                    name="managerId"
                                    value={formData.managerId}
                                    onChange={handleChange}
                                    required
                                    disabled={managersLoading}
                                    className="cpm-select"
                                    style={{
                                        ...inputStyle,
                                        appearance: 'none',
                                        WebkitAppearance: 'none',
                                        paddingRight: '14px',
                                        cursor: managersLoading ? 'not-allowed' : 'pointer',
                                        opacity: managersLoading ? 0.6 : 1,
                                    }}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                >
                                    <option value="">{managersLoading ? 'Loading managers…' : 'Select Project Manager'}</option>
                                    {managers.map(manager => (
                                        <option key={manager._id} value={manager._id}>
                                            {manager.fullName}{manager.specialization ? ` (${manager.specialization})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {managers.length === 0 && !managersLoading && (
                                <p style={{
                                    fontFamily: F, fontSize: '11.5px',
                                    color: isDark ? '#fbbf24' : '#b45309',
                                    marginTop: '6px',
                                }}>
                                    No project managers found. Please invite one first.
                                </p>
                            )}
                        </div>

                        {/* ─ Dates ─ */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div>
                                <label style={labelStyle}>
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="cpm-date"
                                    style={{ ...inputStyle, colorScheme: isDark ? 'dark' : 'light' }}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    min={formData.startDate || undefined}
                                    className="cpm-date"
                                    style={{ ...inputStyle, colorScheme: isDark ? 'dark' : 'light' }}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                />
                                {dateError && (
                                    <p style={errorTextStyle}>{dateError}</p>
                                )}
                            </div>
                        </div>

                        {/* ─ Priority ─ */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>
                                Priority
                            </label>
                            {/* Visual priority selector */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                                {priorityOptions.map(opt => {
                                    const selected = formData.priority === opt.value
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, priority: opt.value }))}
                                            style={{
                                                padding: '9px 4px',
                                                borderRadius: '10px',
                                                fontFamily: F,
                                                fontSize: '12px',
                                                fontWeight: selected ? 700 : 500,
                                                cursor: 'pointer',
                                                transition: 'all 0.18s ease',
                                                border: selected
                                                    ? `2px solid ${opt.color}`
                                                    : `1.5px solid ${surface.inputBdr}`,
                                                background: selected
                                                    ? `${opt.color}22`
                                                    : surface.inputBg,
                                                color: selected ? opt.color : text.secondary,
                                                boxShadow: selected
                                                    ? `0 0 0 3px ${opt.color}18, 0 2px 8px rgba(0,0,0,0.1)`
                                                    : 'none',
                                            }}
                                        >
                                            {opt.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* ─ Tags ─ */}
                        <div style={{ marginBottom: '8px' }}>
                            <label style={labelStyle}>
                                Tags
                            </label>
                            <input
                                type="text"
                                name="tags"
                                value={formData.tags}
                                onChange={handleChange}
                                placeholder="e.g. frontend, backend, mobile"
                                className="cpm-input"
                                style={inputStyle}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                            />
                            <p style={{
                                fontFamily: F, fontSize: '11.5px',
                                color: text.muted, marginTop: '5px',
                            }}>
                                Separate tags with commas
                            </p>
                        </div>
                    </form>

                    {/* ── Footer / Actions ────────────────────────────────── */}
                    <div
                        style={{
                            display: 'flex', gap: '12px',
                            padding: '16px 24px 20px',
                            borderTop: `1px solid ${surface.footerBdr}`,
                            background: surface.footerBg,
                            flexShrink: 0,
                        }}
                    >
                        {/* Cancel */}
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="cpm-cancel"
                            style={{
                                flex: 1,
                                padding: '11px 20px',
                                borderRadius: '10px',
                                border: `1.5px solid ${surface.cancelBdr}`,
                                background: surface.cancelBg,
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

                        {/* Submit */}
                        <button
                            type="submit"
                            form="cpm-form"
                            disabled={loading || !!dateError}
                            className="cpm-submit"
                            onClick={handleSubmit}
                            style={{
                                flex: 2,
                                padding: '11px 20px',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)',
                                color: '#ffffff',
                                fontFamily: F,
                                fontSize: '13.5px',
                                fontWeight: 700,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                                transition: 'all 0.2s ease',
                                opacity: loading ? 0.75 : 1,
                            }}
                        >
                            {loading ? 'Creating…' : 'Create Project'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )

    return createPortal(modalContent, document.body)
}

export default CreateProjectModal
