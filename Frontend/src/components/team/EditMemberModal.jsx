import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Users, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTheme } from '../../context/ThemeContext';
import { authFormClasses } from '../../utils/authFormStyles';

const EditMemberModal = ({ isOpen, onClose, member, onSuccess }) => {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    role: '',
    specialization: ''
  });
  const [transferTo, setTransferTo] = useState('');
  const [requiresTransfer, setRequiresTransfer] = useState(false);
  const [projectCount, setProjectCount] = useState(0);
  const [availablePMs, setAvailablePMs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    { value: 'projectManager', label: 'Project Manager' },
    { value: 'developer', label: 'Developer' }
  ];
  
  const specializations = [
    'Frontend',
    'Backend',
    'Full Stack',
    'UI/UX',
    'DevOps',
    'Mobile',
    'QA'
  ];

  // Initialize form data when member changes
  useEffect(() => {
    if (member) {
      setFormData({
        role: member.role || '',
        specialization: member.specialization || 'Full Stack'
      });
      setRequiresTransfer(false);
      setTransferTo('');
      setError('');
      setProjectCount(0);
    }
  }, [member]);

  // Fetch available PMs when transfer is required
  useEffect(() => {
    if (requiresTransfer && member) {
      fetchAvailablePMs();
    }
  }, [requiresTransfer, member]);

  const fetchAvailablePMs = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/team`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch team');
      
      const data = await response.json();
      
      // Filter to only get PMs, excluding the current user
      const pms = (data.data?.users || []).filter(
        user => user.role === 'projectManager' && user._id !== member._id
      );
      setAvailablePMs(pms);
    } catch (err) {
      console.error('Error fetching PMs:', err);
      setError('Failed to load available project managers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const updateData = {
        role: formData.role,
        specialization: formData.specialization,
        ...(requiresTransfer && transferTo && { transferProjectsTo: transferTo })
      };

      const response = await fetch(
        `${API_URL}/api/team/${member._id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Check if it's the "requires transfer" error
        if (response.status === 409 && data.data?.requireTransfer) {
          setRequiresTransfer(true);
          setProjectCount(data.data.projectCount);
          setError('');
        } else {
          throw new Error(data.message || 'Failed to update user');
        }
      } else {
        // Success
        toast.success(data.message || 'Team member updated successfully');
        if (onSuccess) onSuccess(data.data.user || data.data);
        handleClose();
      }
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update user');
      toast.error(err.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ role: '', specialization: '' });
    setTransferTo('');
    setRequiresTransfer(false);
    setProjectCount(0);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen || !member) return null;

  const modalContent = (
    <>
      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .modal-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for Firefox */
        .modal-scrollbar {
          scrollbar-width: none;
        }
        /* Hide scrollbar for IE and Edge */
        .modal-scrollbar {
          -ms-overflow-style: none;
        }
      `}</style>
      
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 overflow-y-auto">
        <div className={`rounded-2xl shadow-2xl w-full max-w-lg my-8 max-h-[calc(100vh-4rem)] overflow-y-auto modal-scrollbar ${authFormClasses.card} ${isDark ? authFormClasses.cardSurfaceDark : authFormClasses.cardSurfaceLight}`}>
          {/* Header - Purple Gradient */}
          <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center z-10">
            <h2 className="text-2xl font-bold">Edit Team Member</h2>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-5">
            {/* User Info */}
            <div className={`p-4 rounded-lg border ${isDark ? 'bg-indigo-900/15 border-indigo-500/20' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100'}`}>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Editing:</p>
              <p className={`font-bold text-lg ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{member.fullName || member.name}</p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{member.email}</p>
              <p className={`text-xs mt-1 capitalize ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                Current: {member.role?.replace('projectManager', 'Project Manager')} 
                {member.specialization && ` • ${member.specialization}`}
              </p>
            </div>

            {/* Error Message */}
            {error && !requiresTransfer && (
              <div className={isDark ? authFormClasses.errorBoxDark : authFormClasses.errorBoxLight}>
                <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Warning: Requires Transfer */}
            {requiresTransfer && (
              <div className={`border-l-4 px-4 py-3 rounded ${isDark ? 'bg-amber-900/20 border-amber-500 text-amber-200' : 'bg-yellow-50 border-yellow-400 text-yellow-800'}`}>
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-yellow-600" />
                  <div className="text-sm">
                    <p className="font-bold mb-1">⚠️ Project Reassignment Required</p>
                    <p>
                      This user manages <strong>{projectCount}</strong> active project{projectCount > 1 ? 's' : ''}.
                      You must assign {projectCount > 1 ? 'these projects' : 'this project'} to another Project Manager before proceeding.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Dropdown */}
              <div>
                <label className={`${authFormClasses.label} ${isDark ? authFormClasses.labelDark : authFormClasses.labelLight}`}>
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                  className={`${authFormClasses.input} ${isDark ? authFormClasses.inputDark : authFormClasses.inputLight}`}
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                  🔒 Note: Cannot promote to Admin role
                </p>
              </div>

              {/* Specialization Dropdown */}
              <div>
                <label className={`${authFormClasses.label} ${isDark ? authFormClasses.labelDark : authFormClasses.labelLight}`}>
                  Specialization <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  required
                  className={`${authFormClasses.input} ${isDark ? authFormClasses.inputDark : authFormClasses.inputLight}`}
                >
                  <option value="">Select Specialization</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transfer Projects To (Conditional) */}
              {requiresTransfer && (
                <div className={`border-2 rounded-lg p-4 ${isDark ? 'bg-indigo-900/10 border-indigo-900/40' : 'bg-blue-50 border-blue-200'}`}>
                  <label className={`${authFormClasses.label} ${isDark ? authFormClasses.labelDark : authFormClasses.labelLight}`}>
                    <Users className="w-4 h-4 inline mr-2 text-indigo-600" />
                    Assign Active Projects To <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    required={requiresTransfer}
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
                    <p className="text-xs text-red-600 mt-2 flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      No other Project Managers available. You must create or assign a PM first.
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className={`flex-1 ${authFormClasses.secondaryBtn} ${isDark ? authFormClasses.secondaryDark : authFormClasses.secondaryLight}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || (requiresTransfer && !transferTo)}
                  className={`flex-1 ${authFormClasses.primaryBtn} flex items-center justify-center gap-2`}
                  style={{ background: authFormClasses.primaryBtnBg }}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Saving...
                    </>
                  ) : requiresTransfer ? (
                    <>
                      <Save className="w-5 h-5" />
                      Transfer & Save
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );

  // Render modal using portal to bypass z-index stacking context
  return createPortal(modalContent, document.body);
};

export default EditMemberModal;
