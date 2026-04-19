import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
    Mail, Folder, Lock, LogOut, Calendar,
    Camera, Eye, EyeOff, X, Loader2,
    AlertCircle, CheckCircle2, KeyRound, User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';
import { uploadAvatar, changePassword, fetchMyProjects } from '../services/profileService';
import Avatar from '../components/common/Avatar';
import WorkflowLoader from '../components/common/WorkflowLoader';
import useMinLoader from '../hooks/useMinLoader';
import ComponentLoader from '../components/common/ComponentLoader';

// ─── Font & helpers ─────────────────────────────────────────────────────────────
const F = "'Inter','Plus Jakarta Sans',sans-serif";
const BACKEND = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const fmtRole = (r) =>
    ({ admin: 'Admin', projectManager: 'Project Manager', developer: 'Developer' }[r] || 'User');

const initials = (name) =>
    name ? name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?';

const getAvatarSrc = (avatar) => {
    if (!avatar) return null;
    // Avatar stored as object { url: "..." }
    const url = avatar?.url || (typeof avatar === 'string' ? avatar : null);
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BACKEND}${url}`;
};


const fmtDate = (dateStr) => {
    if (!dateStr) return 'October 14, 2023';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

// ─── Role badge map ─────────────────────────────────────────────────────────────
const ROLE_BADGE = {
    developer:      { label: 'DEVELOPER',       bg: '#F0FDF4', border: '#86EFAC', color: '#16A34A' },
    admin:          { label: 'ADMIN',            bg: '#FEF3C7', border: '#FCD34D', color: '#B45309' },
    projectManager: { label: 'PROJECT MANAGER',  bg: '#EEF2FF', border: '#A5B4FC', color: '#4338CA' },
};

const ROLE_BADGE_DARK = {
    developer:      { label: 'DEVELOPER',       bg: 'rgba(22,163,74,0.15)',  border: '#16A34A', color: '#4ade80' },
    admin:          { label: 'ADMIN',            bg: 'rgba(180,83,9,0.15)',   border: '#F59E0B', color: '#FCD34D' },
    projectManager: { label: 'PROJECT MANAGER',  bg: 'rgba(99,102,241,0.18)', border: '#6366f1', color: '#818cf8' },
};

// ─── Project badge colours ─────────────────────────────────────────────────────
const PROJ_COLORS = [
    { bg: '#EEF2FF', border: '#C7D2FE', text: '#4F46E5', icon: '#' },
    { bg: '#F5F3FF', border: '#DDD6FE', text: '#7C3AED', icon: '✳' },
    { bg: '#F0FDF4', border: '#86EFAC', text: '#16A34A', icon: '◆' },
    { bg: '#FFF7ED', border: '#FED7AA', text: '#EA580C', icon: '●' },
];
const PROJ_COLORS_DARK = [
    { bg: 'rgba(99,102,241,0.13)',  border: '#6366f1', text: '#818cf8', icon: '#' },
    { bg: 'rgba(124,58,237,0.13)', border: '#7C3AED', text: '#A78BFA', icon: '✳' },
    { bg: 'rgba(22,163,74,0.12)',  border: '#16A34A', text: '#4ade80', icon: '◆' },
    { bg: 'rgba(234,88,12,0.12)',  border: '#EA580C', text: '#FB923C', icon: '●' },
];

// ─── Design tokens ─────────────────────────────────────────────────────────────
const tok = (dark) => ({
    bg:           dark ? '#0B0F19'  : '#F1F4F8',
    cardBg:       dark ? '#1E293B'  : '#FFFFFF',
    cardBorder:   dark ? '#2D3748'  : '#E8ECF0',
    cardShadow:   dark ? '0 1px 6px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.05)',
    r:            '14px',
    textPrimary:  dark ? '#F1F5F9'  : '#0F172A',
    textSec:      dark ? '#94A3B8'  : '#64748B',
    textLabel:    dark ? '#64748B'  : '#94A3B8',
    accent:       dark ? '#6366f1'  : '#4F46E5',
    inputBg:      dark ? '#0F172A'  : '#F8FAFC',
    inputBorder:  dark ? '#334155'  : '#E2E8F0',
    border:       dark ? '#2D3748'  : '#E2E8F0',
    divider:      dark ? '#1f2937'  : '#F1F5F9',
    footerBg:     dark ? '#0B0F19'  : '#F1F4F8',
    footerText:   dark ? '#334155'  : '#94A3B8',
    footerBorder: dark ? '#1f2937'  : '#E8ECF0',
    avatarRing:   dark ? '#6366f1'  : '#C7D2FE',
    projColors:   dark ? PROJ_COLORS_DARK : PROJ_COLORS,
    roleMap:      dark ? ROLE_BADGE_DARK  : ROLE_BADGE,
});

// ══════════════════════════════════════════════════════
//  CHANGE PASSWORD MODAL
// ══════════════════════════════════════════════════════
const ChangePasswordModal = ({ onClose, t }) => {
    const [step, setStep]       = useState('confirm');
    const [oldPwd, setOldPwd]   = useState('');
    const [newPwd, setNewPwd]   = useState('');
    const [confPwd, setConfPwd] = useState('');
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConf, setShowConf] = useState(false);
    const [loading, setLoading] = useState(false);
    const [err, setErr]         = useState('');

    // ESC key closes modal
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const inp = {
        width: '100%', height: '48px', boxSizing: 'border-box',
        borderRadius: '8px', padding: '0 44px 0 14px',
        fontFamily: F, fontSize: '14px',
        background: '#F8FAFC', border: '1px solid #E2E8F0',
        color: '#0F172A', outline: 'none',
    };
    const lbl = {
        fontFamily: F, fontSize: '11px', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        color: '#94A3B8', display: 'block', marginBottom: '6px',
    };
    const eyeBtn = {
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8',
        display: 'flex', alignItems: 'center',
    };

    const handleSave = async () => {
        if (!oldPwd)            return setErr('Current password is required');
        if (!newPwd)            return setErr('New password is required');
        if (newPwd !== confPwd) return setErr('Passwords do not match');
        setLoading(true); setErr('');
        try {
            await changePassword(oldPwd, newPwd);
            setStep('done');
        } catch (e) {
            setErr(e?.response?.data?.message || 'Incorrect current password. Please try again.');
        } finally { setLoading(false); }
    };

    const modalContent = (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
            }}
            onClick={e => e.target === e.currentTarget && onClose()}>

            <motion.div
                initial={{ scale: 0.94, y: 18, opacity: 0 }}
                animate={{ scale: 1,    y: 0,  opacity: 1 }}
                exit={{    scale: 0.94, y: 18, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                style={{
                    background: '#FFFFFF', borderRadius: '16px', padding: '36px',
                    width: '100%', maxWidth: '520px', boxSizing: 'border-box',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
                    position: 'relative',
                }}>

                {/* Close */}
                <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}>
                    <X size={18}/>
                </button>

                {/* ── Step: confirm ── */}
                {step === 'confirm' && <>
                    <h3 style={{ fontFamily: F, fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '0 0 10px' }}>Change Password</h3>
                    <p style={{ fontFamily: F, fontSize: '14px', color: '#64748B', margin: '0 0 28px' }}>
                        Are you sure you want to change your password? You'll need your current password to proceed.
                    </p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <ModalBtn label="Cancel"   variant="outline" onClick={onClose}/>
                        <ModalBtn label="Continue" variant="filled"  onClick={() => setStep('form')}/>
                    </div>
                </>}

                {/* ── Step: form ── */}
                {step === 'form' && <>
                    <h3 style={{ fontFamily: F, fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '0 0 24px' }}>Enter New Password</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>

                        {/* Current Password */}
                        <div>
                            <label style={lbl}>Current Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showOld ? 'text' : 'password'}
                                    style={inp}
                                    value={oldPwd}
                                    placeholder="Your current password"
                                    autoComplete="current-password"
                                    onChange={e => setOldPwd(e.target.value)}
                                />
                                <button type="button" style={eyeBtn} onClick={() => setShowOld(v => !v)}>
                                    {showOld ? <EyeOff size={15}/> : <Eye size={15}/>}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label style={lbl}>New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    style={inp}
                                    value={newPwd}
                                    placeholder="New password"
                                    autoComplete="new-password"
                                    onChange={e => setNewPwd(e.target.value)}
                                />
                                <button type="button" style={eyeBtn} onClick={() => setShowNew(v => !v)}>
                                    {showNew ? <EyeOff size={15}/> : <Eye size={15}/>}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label style={lbl}>Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConf ? 'text' : 'password'}
                                    style={inp}
                                    value={confPwd}
                                    placeholder="Re-enter new password"
                                    autoComplete="new-password"
                                    onChange={e => setConfPwd(e.target.value)}
                                />
                                <button type="button" style={eyeBtn} onClick={() => setShowConf(v => !v)}>
                                    {showConf ? <EyeOff size={15}/> : <Eye size={15}/>}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    {err && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 14 }}>
                            <AlertCircle size={13} color="#ef4444"/>
                            <span style={{ fontFamily: F, fontSize: 13, color: '#ef4444' }}>{err}</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <ModalBtn label="Back" variant="outline" onClick={() => { setStep('confirm'); setErr(''); }}/>
                        <ModalBtn
                            label={loading ? 'Saving…' : 'Save Password'}
                            variant="filled"
                            onClick={handleSave}
                            disabled={loading}
                            icon={loading ? <Loader2 size={14} style={{ animation: 'spin .7s linear infinite' }}/> : null}
                        />
                    </div>
                </>}

                {/* ── Step: done ── */}
                {step === 'done' && (
                    <div style={{ textAlign: 'center', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                        {/* Success check */}
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                            <CheckCircle2 size={24} color="#22c55e"/>
                        </div>
                        <h3 style={{ fontFamily: F, fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>Password Updated</h3>
                        <p style={{ fontFamily: F, fontSize: '14px', color: '#64748B', margin: '0 0 24px' }}>Your password has been changed successfully.</p>
                        <ModalBtn label="Done" variant="filled" onClick={onClose}/>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};


// ── Reusable button (theme-aware, used on profile page) ───────────────────────
const Btn = ({ label, variant, t, onClick, disabled, icon }) => (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onClick} disabled={disabled}
        style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 40, padding: '0 18px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
            fontFamily: F, fontSize: 14, fontWeight: variant === 'filled' ? 600 : 500,
            opacity: disabled ? 0.65 : 1,
            background: variant === 'filled' ? t.accent : 'transparent',
            border:     variant === 'filled' ? 'none' : `1px solid ${t.inputBorder}`,
            color:      variant === 'filled' ? '#fff' : t.textSec,
        }}>
        {icon}{label}
    </motion.button>
);

// ── Modal button (fixed light colours — modal bg is always white) ──────────────
const ModalBtn = ({ label, variant, onClick, disabled, icon }) => (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onClick} disabled={disabled}
        style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 40, padding: '0 18px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
            fontFamily: F, fontSize: 14, fontWeight: variant === 'filled' ? 600 : 500,
            opacity: disabled ? 0.65 : 1,
            background: variant === 'filled' ? '#4F46E5' : '#FFFFFF',
            border:     variant === 'filled' ? 'none' : '1px solid #E2E8F0',
            color:      variant === 'filled' ? '#fff' : '#374151',
        }}>
        {icon}{label}
    </motion.button>
);

// ══════════════════════════════════════════════════════
//  MAIN PROFILE PAGE
// ══════════════════════════════════════════════════════
export default function ProfilePage() {
    const { user, login: refreshUser, logout } = useAuth();
    const { isDark } = useTheme();
    const t = tok(isDark);
    const navigate = useNavigate();

    const [avatarSrc, setAvatarSrc]       = useState(getAvatarSrc(user?.avatar));
    const [avatarHover, setAvatarHover]   = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [projects, setProjects]         = useState([]);
    const [projectsLoading, setProjectsLoading] = useState(true);
    const [showPwd, setShowPwd]           = useState(false);
    const fileRef = useRef(null);

    const isAdmin = user?.role === 'admin';
    const showProjects = user?.role === 'developer' || user?.role === 'projectManager';
    const badge = t.roleMap[user?.role] || t.roleMap.developer;

    useEffect(() => {
        if (!showProjects || !user?._id) {
            setProjectsLoading(false);
            return;
        }
        setProjectsLoading(true);
        fetchMyProjects()
            .then(d => {
                console.log('[ProfilePage] projects fetched:', d);
                setProjects(Array.isArray(d) ? d : []);
            })
            .catch(err => {
                console.error('[ProfilePage] fetchMyProjects error:', err);
                setProjects([]);
            })
            .finally(() => setProjectsLoading(false));
    }, [showProjects, user?._id]);




    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setAvatarSrc(preview);
        setAvatarLoading(true);
        try {
            const data = await uploadAvatar(file);
            const final = getAvatarSrc(data.user?.avatar) || preview;
            setAvatarSrc(final);
            if (data.user) {
                const next = { ...user, avatar: data.user.avatar };
                localStorage.setItem('user', JSON.stringify(next));
                refreshUser(next);
            }
            toast.success('Avatar updated!');
        } catch { setAvatarSrc(getAvatarSrc(user?.avatar)); toast.error('Upload failed'); }
        finally { setAvatarLoading(false); }
    };

    const handleSignOut = async () => {
        await logout();
        navigate('/');
    };

    // ── Card wrapper ─────────────────────────────────
    const card = (extra = {}) => ({
        background: t.cardBg, borderRadius: t.r,
        border: `1px solid ${t.cardBorder}`,
        boxShadow: t.cardShadow,
        overflow: 'hidden', ...extra,
    });

    const labelSt = {
        fontFamily: F, fontSize: 11, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        color: t.textLabel, display: 'block', marginBottom: 6,
    };

    const readOnlyInput = (value) => (
        <div style={{
            height: 44, display: 'flex', alignItems: 'center',
            padding: '0 14px', borderRadius: 8, boxSizing: 'border-box',
            background: t.inputBg, border: `1px solid ${t.inputBorder}`,
            fontFamily: F, fontSize: 14, color: t.textSec,
        }}>{value || '—'}</div>
    );

    const showLoader = useMinLoader(projectsLoading);

    if (showLoader) {
        return <WorkflowLoader message="Loading your profile…" />;
    }

    const isReady = !projectsLoading;

    return (
        /* ── Fixed full-screen overlay — covers sidebar ───────────────── */
        <div style={{
            position: 'fixed', top: 64, left: 0, right: 0, bottom: 0,
            zIndex: 1000, overflowY: 'auto',
            background: t.bg, fontFamily: F,
        }}>
        {/* Inner layout — mirrors the padding the main content area uses */}
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 56px)' }}>


            {/* ── Content area ────────────────────────────────────────────── */}
            <div style={{ flex: 1 }}>
                <div style={{ display: 'grid', gap: 20, padding: '28px 0', alignItems: 'start' }}
                    className="profile-layout">

                    {/* ════ LEFT COLUMN ════ */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Profile Overview Card */}
                        <div className="profile-card" style={{ ...card(), padding: '28px 24px' }}>

                            {/* Avatar */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.2, ease: 'easeOut', delay: 0.1 }}
                                    whileHover={{ scale: 1.03 }}
                                    style={{ position: 'relative', marginBottom: 14, cursor: 'pointer' }}
                                    onMouseEnter={() => setAvatarHover(true)}
                                    onMouseLeave={() => setAvatarHover(false)}
                                    onClick={() => fileRef.current?.click()}
                                >
                                    {/* Lavender ring avatar */}
                                    <div style={{
                                        width: 96, height: 96, borderRadius: '50%', overflow: 'hidden',
                                        boxShadow: `0 0 0 3px ${t.cardBg}, 0 0 0 6px ${t.avatarRing}`,
                                    }}>
                                        <Avatar
                                            name={user?.fullName || user?.username || user?.email || user?.name}
                                            imageUrl={avatarSrc || user?.avatar}
                                            seed={user?._id || user?.id || user?.email || user?.username}
                                            size={96}
                                        />
                                    </div>
                                    {/* Upload hover overlay */}
                                    <AnimatePresence>
                                        {(avatarHover || avatarLoading) && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.48)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                                                {avatarLoading ? <Loader2 size={18} color="#fff" style={{ animation: 'spin .7s linear infinite' }}/> : <><Camera size={18} color="#fff"/><span style={{ fontSize: 9, color: '#fff', fontFamily: F, letterSpacing: '0.05em' }}>UPLOAD</span></>}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload}/>
                                </motion.div>

                                {/* Name */}
                                <p style={{ fontFamily: F, fontSize: 20, fontWeight: 700, color: t.textPrimary, margin: 0, textAlign: 'center' }}>
                                    {user?.fullName || user?.username || 'User'}
                                </p>
                            </div>

                            {/* Role + Specialty rows */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                                {/* ROLE row */}
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '10px 14px', borderRadius: 8,
                                    background: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB',
                                    border: `1px solid ${isDark ? '#2D3748' : '#F1F5F9'}`,
                                }}>
                                    <span style={{ fontFamily: F, fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: t.textLabel }}>Role</span>
                                    <span style={{
                                        padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                                        letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: F,
                                        background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color,
                                    }}>{badge.label}</span>
                                </div>
                                {/* SPECIALTY row */}
                                {!isAdmin && (
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '10px 14px', borderRadius: 8,
                                        background: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB',
                                        border: `1px solid ${isDark ? '#2D3748' : '#F1F5F9'}`,
                                    }}>
                                        <span style={{ fontFamily: F, fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: t.textLabel }}>Specialty</span>
                                        <span style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: t.textPrimary }}>
                                            {user?.specialization || '—'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div style={{ height: 1, background: isDark ? '#2D3748' : '#E8ECF0', margin: '0 0 16px' }}/>

                            {/* Email */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 4px' }}>
                                <Mail size={14} color={t.textLabel}/>
                                <span style={{ fontFamily: F, fontSize: 13, color: t.textSec, wordBreak: 'break-all' }}>
                                    {user?.email || '—'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ════ RIGHT COLUMN ════ */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* ── Card 1: Personal Information ── */}
                        <div className="profile-card profile-card-2" style={{ ...card(), padding: '28px' }}>
                            <p style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: t.textPrimary, margin: '0 0 22px' }}>
                                Personal Information
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }} className="info-grid">
                                {/* Username */}
                                <div>
                                    <label style={labelSt}>Username</label>
                                    {readOnlyInput(user?.username)}
                                </div>
                                {/* Email */}
                                <div>
                                    <label style={labelSt}>Email Address</label>
                                    {readOnlyInput(user?.email)}
                                </div>
                                {/* Specialization */}
                                <div>
                                    <label style={labelSt}>Specialization</label>
                                    {readOnlyInput(isAdmin ? 'System Admin' : (user?.specialization || '—'))}
                                </div>
                                {/* System Role */}
                                <div>
                                    <label style={labelSt}>System Role</label>
                                    {readOnlyInput(fmtRole(user?.role))}
                                </div>
                            </div>
                        </div>

                        {/* ── Card 2: Assigned Projects (PM + Dev only) ── */}
                        {showProjects && (
                            <div className="profile-card profile-card-3" style={{ ...card(), padding: '24px 28px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                    <Folder size={20} color={isDark ? '#6366f1' : '#4F46E5'}/>
                                    <p style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: t.textPrimary, margin: 0 }}>
                                        Assigned Projects
                                    </p>
                                </div>

                                {!isReady ? (
                                    <ComponentLoader variant="card" rows={3} message="Loading projects…" />
                                ) : projects.length === 0 ? (
                                    /* Empty state */
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 0', gap: 10 }}>
                                        <Folder size={32} color={t.textLabel}/>
                                        <span style={{ fontFamily: F, fontSize: 14, color: t.textLabel }}>No projects assigned yet</span>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                        {projects.map((p, i) => {
                                            const c = t.projColors[i % t.projColors.length];
                                            return (
                                                <motion.span key={p._id || i} whileHover={{ y: -2 }}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 7,
                                                        padding: '8px 16px', borderRadius: 100, fontFamily: F,
                                                        fontSize: 13, fontWeight: 500,
                                                        background: c.bg, border: `1px solid ${c.border}`, color: c.text,
                                                    }}>
                                                    <span style={{ fontSize: 12 }}>{c.icon}</span>
                                                    {p.name}
                                                </motion.span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Card 3: Account Information (grows to fill remaining space) ── */}
                        <div className="profile-card profile-card-4" style={{ ...card({ flex: 1 }), padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, minHeight: isAdmin ? 90 : 80 }}>

                            {/* Left: Account Created */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 8, background: isDark ? '#1f2937' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Calendar size={18} color={t.textSec}/>
                                </div>
                                <div>
                                    <span style={{ fontFamily: F, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.textLabel, display: 'block', marginBottom: 2 }}>
                                        Account Created
                                    </span>
                                    <span style={{ fontFamily: F, fontSize: 18, fontWeight: 600, color: t.textPrimary }}>
                                        {fmtDate(user?.createdAt)}
                                    </span>
                                </div>
                            </div>

                            {/* Right: Action buttons */}
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                {/* Change Password */}
                                <motion.button whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => setShowPwd(true)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 7,
                                        height: 40, padding: '0 18px', borderRadius: 8, cursor: 'pointer',
                                        background: isDark ? '#0F172A' : '#FFFFFF',
                                        border: `1px solid ${isDark ? '#334155' : '#CBD5E1'}`,
                                        color: isDark ? '#94A3B8' : '#374151',
                                        fontFamily: F, fontSize: 13, fontWeight: 500,
                                    }}>
                                    <Lock size={14}/>Change Password
                                </motion.button>
                                {/* Sign Out */}
                                <motion.button whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
                                    onClick={handleSignOut}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 7,
                                        height: 40, padding: '0 18px', borderRadius: 8, cursor: 'pointer',
                                        background: isDark ? '#6366f1' : '#0F172A',
                                        border: 'none', color: '#FFFFFF',
                                        fontFamily: F, fontSize: 13, fontWeight: 600,
                                    }}>
                                    <LogOut size={14}/>Sign Out
                                </motion.button>
                            </div>
                        </div>

                    </div>{/* end right column */}
                </div>{/* end grid */}
            </div>{/* end flex:1 */}

            {/* Change Password Modal */}
            <AnimatePresence>
                {showPwd && <ChangePasswordModal onClose={() => setShowPwd(false)} t={t}/>}
            </AnimatePresence>

            {/* Responsive + keyframe styles */}
            <style>{`
                .profile-layout {
                    grid-template-columns: 320px 1fr;
                    padding-left: 0;
                    padding-right: 0;
                }
                @media (min-width: 1024px) and (max-width: 1279px) {
                    .profile-layout { grid-template-columns: 280px 1fr; }
                }
                @media (max-width: 1023px) {
                    .profile-layout { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 600px) {
                    .info-grid { grid-template-columns: 1fr !important; }
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* ── Card stagger entrance ── */
                @keyframes cardFadeUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .profile-card {
                    animation: cardFadeUp 0.32s ease-out both;
                    animation-delay: 0.06s;
                }
                .profile-card-2 { animation-delay: 0.12s; }
                .profile-card-3 { animation-delay: 0.18s; }
                .profile-card-4 { animation-delay: 0.24s; }
            `}</style>
        </motion.div>
        </div>
    );
}
