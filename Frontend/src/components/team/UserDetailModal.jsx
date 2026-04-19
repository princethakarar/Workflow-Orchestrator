import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Pencil, Check, XCircle, Trash2, Save, Mail, Calendar,
  Briefcase, ShieldCheck, AlertTriangle, Users, RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import DeleteMemberModal from './DeleteMemberModal';
import Avatar from '../common/Avatar';
import { useTheme } from '../../context/ThemeContext';
import { authFormClasses } from '../../utils/authFormStyles';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const ROLE_LABELS = {
  admin: 'Admin',
  projectManager: 'Project Manager',
  developer: 'Developer'
};

const ROLES = [
  { value: 'projectManager', label: 'Project Manager' },
  { value: 'developer', label: 'Developer' }
];

const SPECIALIZATIONS = [
  'Frontend', 'Backend', 'Full Stack', 'UI/UX', 'DevOps', 'Mobile', 'QA'
];

const getRoleColor = (role, isDark) => {
  if (isDark) {
    switch (role) {
      case 'admin': return 'bg-amber-900/30 text-amber-300 border-amber-500/50';
      case 'projectManager': return 'bg-indigo-900/40 text-indigo-300 border-indigo-500/50';
      case 'developer': return 'bg-emerald-900/30 text-emerald-300 border-emerald-500/50';
      default: return 'bg-gray-800 text-gray-300 border-gray-600';
    }
  }
  switch (role) {
    case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'projectManager': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'developer': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getSpecializationColor = (spec, isDark) => {
  if (isDark) {
    const colors = {
      'Frontend': 'bg-cyan-900/30 text-cyan-300 border-cyan-500/50',
      'Backend': 'bg-green-900/30 text-green-300 border-green-500/50',
      'Full Stack': 'bg-purple-900/30 text-purple-300 border-purple-500/50',
      'UI/UX': 'bg-pink-900/30 text-pink-300 border-pink-500/50',
      'DevOps': 'bg-orange-900/30 text-orange-300 border-orange-500/50',
      'Mobile': 'bg-indigo-900/30 text-indigo-300 border-indigo-500/50',
      'QA': 'bg-yellow-900/30 text-yellow-300 border-yellow-500/50',
    };
    return colors[spec] || 'bg-gray-800 text-gray-300 border-gray-600';
  }
  const colors = {
    'Frontend': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'Backend': 'bg-green-100 text-green-700 border-green-200',
    'Full Stack': 'bg-purple-100 text-purple-700 border-purple-200',
    'UI/UX': 'bg-pink-100 text-pink-700 border-pink-200',
    'DevOps': 'bg-orange-100 text-orange-700 border-orange-200',
    'Mobile': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'QA': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  };
  return colors[spec] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const UserDetailModal = ({ isOpen, onClose, member: initialMember, onSuccess, isAdmin, onResendInvite }) => {
  const { isDark } = useTheme();

  /* ---------- local state ---------- */
  const [member, setMember] = useState(initialMember);

  // editing state per field: { role: bool, specialization: bool }
  const [editing, setEditing] = useState({ role: false, specialization: false });
  const [fieldValues, setFieldValues] = useState({ role: '', specialization: '' });

  // project-transfer flow (mirrors EditMemberModal)
  const [requiresTransfer, setRequiresTransfer] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [projectCount, setProjectCount] = useState(0);
  const [availablePMs, setAvailablePMs] = useState([]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // delete sub-modal
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, loading: false });

  /* ---------- sync when member prop changes ---------- */
  useEffect(() => {
    if (initialMember) {
      setMember(initialMember);
      setFieldValues({
        role: initialMember.role || '',
        specialization: initialMember.specialization || 'Full Stack'
      });
      resetEditState();
    }
  }, [initialMember]);

  const resetEditState = () => {
    setEditing({ role: false, specialization: false });
    setRequiresTransfer(false);
    setTransferTo('');
    setProjectCount(0);
    setAvailablePMs([]);
    setSaveError('');
    setSaving(false);
  };

  /* ---------- fetch available PMs when transfer required ---------- */
  useEffect(() => {
    if (requiresTransfer && member) {
      fetchAvailablePMs();
    }
  }, [requiresTransfer]);

  const fetchAvailablePMs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/team`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch team');
      const data = await res.json();
      const pms = (data.data?.users || []).filter(
        u => u.role === 'projectManager' && u._id !== member._id
      );
      setAvailablePMs(pms);
    } catch {
      setSaveError('Failed to load available project managers');
    }
  };

  /* ---------- toggle field edit mode ---------- */
  const startEdit = (field) => {
    setEditing(prev => ({ ...prev, [field]: true }));
    setSaveError('');
  };

  const cancelEdit = (field) => {
    setEditing(prev => ({ ...prev, [field]: false }));
    setFieldValues(prev => ({ ...prev, [field]: member[field] || '' }));
    // if we cancel role edit while transfer was showing, reset transfer state
    if (field === 'role') {
      setRequiresTransfer(false);
      setTransferTo('');
    }
    setSaveError('');
  };

  /* ---------- save ---------- */
  const handleSave = async () => {
    setSaving(true);
    setSaveError('');

    try {
      const updateData = {
        role: fieldValues.role,
        specialization: fieldValues.specialization,
        ...(requiresTransfer && transferTo && { transferProjectsTo: transferTo })
      };

      const res = await fetch(`${API_URL}/api/team/${member._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.data?.requireTransfer) {
          setRequiresTransfer(true);
          setProjectCount(data.data.projectCount);
        } else {
          throw new Error(data.message || 'Failed to update user');
        }
      } else {
        toast.success(data.message || 'Team member updated successfully');
        const updated = data.data?.user || data.data || member;
        setMember(updated);
        setFieldValues({ role: updated.role, specialization: updated.specialization });
        resetEditState();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setSaveError(err.message || 'Failed to update user');
      toast.error(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = (
    fieldValues.role !== member?.role ||
    fieldValues.specialization !== member?.specialization
  );

  /* ---------- delete flow ---------- */
  const handleDeleteClick = () => setDeleteModal({ isOpen: true, loading: false });

  const handleDeleteConfirm = async (memberId, transferProjectsTo) => {
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`${API_URL}/api/team/${memberId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(transferProjectsTo ? { transferProjectsTo } : {})
      });
      const data = await res.json();
      if (!res.ok) throw Object.assign(new Error(data.message), { response: { data } });

      toast.success(data.message || 'Team member deleted successfully');
      setDeleteModal({ isOpen: false, loading: false });
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setDeleteModal(prev => ({ ...prev, loading: false }));
      throw err;
    }
  };

  const handleDeleteCancel = () => setDeleteModal({ isOpen: false, loading: false });

  /* ---------- resend invite ---------- */
  const handleResend = async () => {
    if (onResendInvite) {
      await onResendInvite(member._id);
    }
  };

  /* ---------- guard ---------- */
  if (!isOpen || !member) return null;

  const isAdminMember = member.role === 'admin';
  const canEdit = isAdmin && !isAdminMember;
  const isPending = member.status === 'inactive' && !member.isEmailVerified;

  const modalContent = (
    <>
      <style>{`
        .ud-modal-scrollbar::-webkit-scrollbar { display: none; }
        .ud-modal-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .edit-field-active {
          border-color: #6366f1 !important;
          background: ${isDark ? 'rgba(99,102,241,0.1)' : '#eef2ff'};
          box-shadow: 0 0 0 2px ${isDark ? 'rgba(99,102,241,0.3)' : '#c7d2fe'};
        }
      `}</style>

      <div
        className="fixed inset-0 flex items-center justify-center z-[99998] p-4 overflow-y-auto"
        style={{ background: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div 
          className="rounded-2xl shadow-2xl w-full max-w-lg my-8 max-h-[calc(100vh-4rem)] overflow-y-auto ud-modal-scrollbar"
          style={{ background: isDark ? '#161B2E' : '#ffffff', border: isDark ? '1px solid rgba(99,102,241,0.15)' : 'none' }}
        >

          {/* ── Header ── */}
          <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-violet-600 text-white p-6 rounded-t-2xl z-10" style={{ background: isDark ? 'linear-gradient(135deg,#3730A3 0%,#5B21B6 100%)' : undefined }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-white/15 flex items-center justify-center">
                  <Avatar
                    name={member.fullName || member.username || member.email}
                    imageUrl={member.avatar}
                    seed={member._id || member.id || member.email}
                    size={56}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{member.fullName || member.username}</h2>
                  <p className="text-white/80 text-sm flex items-center gap-1">
                    <Mail size={13} />
                    {member.email}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="p-6 space-y-5">

            {/* Pending badge */}
            {isPending && (
              <div className={`flex items-center justify-between border rounded-lg px-4 py-3 ${isDark ? 'bg-orange-900/20 border-orange-500/30' : 'bg-orange-50 border-orange-200'}`}>
                <p className={`text-sm font-medium ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>📧 Invitation pending — not yet accepted</p>
                {isAdmin && (
                  <button
                    onClick={handleResend}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${isDark ? 'text-green-400 hover:text-green-300 hover:bg-green-900/40' : 'text-green-700 hover:text-green-900 hover:bg-green-50'}`}
                  >
                    <RefreshCw size={13} /> Resend
                  </button>
                )}
              </div>
            )}

            {/* Save error */}
            {saveError && (
              <div className={`border-l-4 px-4 py-3 rounded flex items-start gap-2 ${isDark ? 'bg-red-900/20 border-red-500 text-red-300' : 'bg-red-50 border-red-500 text-red-700'}`}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{saveError}</span>
              </div>
            )}

            {/* Transfer warning */}
            {requiresTransfer && (
              <div className={`border-l-4 rounded-lg px-4 py-3 ${isDark ? 'bg-amber-900/20 border-amber-500' : 'bg-yellow-50 border-yellow-400'}`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-amber-500' : 'text-yellow-600'}`} />
                  <div className="text-sm">
                    <p className={`font-bold mb-1 ${isDark ? 'text-amber-400' : 'text-yellow-800'}`}>⚠️ Project Reassignment Required</p>
                    <p className={isDark ? 'text-amber-200/80' : 'text-yellow-700'}>
                      This user manages <strong>{projectCount}</strong> active project{projectCount > 1 ? 's' : ''}.
                      Assign {projectCount > 1 ? 'them' : 'it'} to another Project Manager before saving.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Transfer PM selector */}
            {requiresTransfer && (
              <div className={`border-2 rounded-lg p-4 ${isDark ? 'bg-indigo-900/10 border-indigo-900/40' : 'bg-blue-50 border-blue-200'}`}>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  <Users className="w-4 h-4 inline mr-1 text-indigo-500" />
                  Assign Active Projects To <span className="text-red-500">*</span>
                </label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className={`${authFormClasses.input} ${isDark ? authFormClasses.inputDark : authFormClasses.inputLight}`}
                >
                  <option value="">Select Project Manager</option>
                  {availablePMs.map(pm => (
                    <option key={pm._id} value={pm._id}>
                      {pm.fullName || pm.name} ({pm.email})
                    </option>
                  ))}
                </select>
                {availablePMs.length === 0 && (
                  <p className="text-xs text-red-600 mt-2">
                    No other Project Managers available. Create one first.
                  </p>
                )}
              </div>
            )}

            {/* ── Fields ── */}
            <div className="space-y-4">

              {/* Role */}
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isDark ? 'bg-indigo-900/40' : 'bg-indigo-50'}`}>
                  <ShieldCheck size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Role</p>
                  {editing.role ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={fieldValues.role}
                        onChange={(e) => setFieldValues(prev => ({ ...prev, role: e.target.value }))}
                        className={`flex-1 edit-field-active ${authFormClasses.input} ${isDark ? authFormClasses.inputDark : authFormClasses.inputLight}`}
                        autoFocus
                      >
                        {ROLES.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => cancelEdit('role')}
                        className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/30' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                        title="Cancel"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleColor(member.role, isDark)}`}>
                        {ROLE_LABELS[member.role] || member.role}
                      </span>
                      {canEdit && (
                        <button
                          onClick={() => startEdit('role')}
                          className={`p-1 rounded-md transition-colors ${isDark ? 'text-slate-500 hover:text-indigo-400 hover:bg-indigo-900/40' : 'text-gray-300 hover:text-indigo-600 hover:bg-indigo-50'}`}
                          title="Edit role"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                    </div>
                  )}
                  {canEdit && !editing.role && (
                    <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>🔒 Cannot promote to Admin</p>
                  )}
                </div>
              </div>

              {/* Specialization */}
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isDark ? 'bg-indigo-900/40' : 'bg-indigo-50'}`}>
                  <Briefcase size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Specialization</p>
                  {editing.specialization ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={fieldValues.specialization}
                        onChange={(e) => setFieldValues(prev => ({ ...prev, specialization: e.target.value }))}
                        className={`flex-1 edit-field-active ${authFormClasses.input} ${isDark ? authFormClasses.inputDark : authFormClasses.inputLight}`}
                        autoFocus
                      >
                        {SPECIALIZATIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => cancelEdit('specialization')}
                        className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/30' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                        title="Cancel"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getSpecializationColor(member.specialization, isDark)}`}>
                        {member.specialization || 'Full Stack'}
                      </span>
                      {canEdit && (
                        <button
                          onClick={() => startEdit('specialization')}
                          className={`p-1 rounded-md transition-colors ${isDark ? 'text-slate-500 hover:text-indigo-400 hover:bg-indigo-900/40' : 'text-gray-300 hover:text-indigo-600 hover:bg-indigo-50'}`}
                          title="Edit specialization"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isDark ? 'bg-indigo-900/40' : 'bg-indigo-50'}`}>
                  <span className="text-sm">
                    {(member.computedStatus || member.status) === 'available' ? '🟢' : (member.computedStatus || member.status) === 'occupied' ? '🔴' : '🟡'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Status</p>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: (member.computedStatus || member.status) === 'occupied'
                        ? (isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)')
                        : (member.computedStatus || member.status) === 'available'
                          ? (isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)')
                          : (isDark ? 'rgba(234,179,8,0.15)' : 'rgba(234,179,8,0.1)'),
                      color: (member.computedStatus || member.status) === 'occupied'
                        ? (isDark ? '#f87171' : '#b91c1c')
                        : (member.computedStatus || member.status) === 'available'
                          ? (isDark ? '#4ade80' : '#15803d')
                          : (isDark ? '#fde047' : '#a16207'),
                      border: (member.computedStatus || member.status) === 'occupied'
                        ? `1px solid ${isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.25)'}`
                        : (member.computedStatus || member.status) === 'available'
                          ? `1px solid ${isDark ? 'rgba(34,197,94,0.3)' : 'rgba(34,197,94,0.25)'}`
                          : `1px solid ${isDark ? 'rgba(234,179,8,0.3)' : 'rgba(234,179,8,0.25)'}`,
                    }}
                  >
                    {(member.computedStatus || member.status) === 'occupied' ? '🔴' : (member.computedStatus || member.status) === 'available' ? '🟢' : '🟡'}
                    {' '}
                    {(member.computedStatus || member.status) === 'occupied' ? 'Occupied' : (member.computedStatus || member.status) === 'available' ? 'Available' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Joined */}
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isDark ? 'bg-indigo-900/40' : 'bg-indigo-50'}`}>
                  <Calendar size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Joined</p>
                  <span className={`text-sm ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                    {member.createdAt
                      ? new Date(member.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Projects */}
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isDark ? 'bg-indigo-900/40' : 'bg-indigo-50'}`}>
                  <Briefcase size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Active Projects</p>
                  {member.currentProjects && member.currentProjects.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {member.currentProjects.map(p => (
                        <span key={p._id} className={`inline-flex px-2.5 py-1 rounded-full text-xs border ${isDark ? 'bg-gray-800 text-slate-300 border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                          {p.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>No active projects</span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className={`pt-2 border-t space-y-3 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>

              {/* Save button — only visible when there are changes */}
              {canEdit && hasChanges && (
                <button
                  onClick={handleSave}
                  disabled={saving || (requiresTransfer && !transferTo)}
                  className={`w-full flex items-center justify-center gap-2 ${authFormClasses.primaryBtn}`}
                  style={{ background: authFormClasses.primaryBtnBg }}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : requiresTransfer ? (
                    <><Save size={16} /> Transfer &amp; Save</>
                  ) : (
                    <><Save size={16} /> Save Changes</>
                  )}
                </button>
              )}

              {/* Delete User button */}
              {canEdit && (
                <button
                  onClick={handleDeleteClick}
                  className={`w-full flex items-center justify-center gap-2 flex-1 ${authFormClasses.secondaryBtn} ${isDark ? authFormClasses.secondaryDark : authFormClasses.secondaryLight}`}
                >
                  <Trash2 size={16} />
                  Delete User
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal — nested via portal */}
      {deleteModal.isOpen && (
        <DeleteMemberModal
          isOpen={deleteModal.isOpen}
          onClose={handleDeleteCancel}
          member={member}
          onConfirm={handleDeleteConfirm}
          loading={deleteModal.loading}
        />
      )}
    </>
  );

  return createPortal(modalContent, document.body);
};

export default UserDetailModal;
