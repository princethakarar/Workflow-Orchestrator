import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Trash2, AlertCircle, Users } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { authFormClasses } from '../../utils/authFormStyles';

const DeleteMemberModal = ({ isOpen, onClose, member, onConfirm, loading }) => {
  const { isDark } = useTheme();
  const [error, setError] = useState(null);
  const [requiresTransfer, setRequiresTransfer] = useState(false);
  const [availablePMs, setAvailablePMs] = useState([]);
  const [selectedPM, setSelectedPM] = useState('');
  const [projectCount, setProjectCount] = useState(0);

  // Clear state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setRequiresTransfer(false);
      setAvailablePMs([]);
      setSelectedPM('');
      setProjectCount(0);
    }
  }, [isOpen]);

  if (!isOpen || !member) return null;

  const handleConfirm = async () => {
    setError(null);

    // If PM selection is required but not selected
    if (requiresTransfer && !selectedPM) {
      setError('Please select a Project Manager to transfer projects to');
      return;
    }

    try {
      await onConfirm(member._id, requiresTransfer ? selectedPM : null);
    } catch (err) {
      // Check if this is a transfer requirement error
      if (err.response?.data?.data?.requiresTransfer) {
        setRequiresTransfer(true);
        setAvailablePMs(err.response.data.data.availablePMs || []);
        setProjectCount(err.response.data.data.activeProjects || 0);
        setError(err.response?.data?.message || 'Project transfer required');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to delete member');
      }
    }
  };

  const modalContent = (
    <>
      <style>{`
        .modal-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .modal-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>

      <div 
        className="fixed inset-0 flex items-center justify-center z-[99999] p-4"
        style={{ background: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
      >
        <div 
          className="rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto modal-scrollbar"
          style={{ background: isDark ? '#161B2E' : '#ffffff', border: isDark ? '1px solid rgba(99,102,241,0.15)' : 'none' }}
        >
          {/* Header - Matching indigo-purple gradient */}
          <div 
            className="sticky top-0 text-white p-6 rounded-t-2xl flex items-center justify-between z-10"
            style={{ background: isDark ? 'linear-gradient(135deg,#3730A3 0%,#5B21B6 100%)' : 'linear-gradient(135deg,#6366f1 0%,#a855f7 100%)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold">Delete Team Member?</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Error Display */}
            {error && (
              <div className={`border rounded-lg p-4 flex items-start gap-3 ${isDark ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
                <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                <div className="flex-1">
                  <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-red-300' : 'text-red-800'}`}>Error</p>
                  <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-700'}`}>{error}</p>
                </div>
              </div>
            )}

            {/* Question */}
            <div>
              <p className={isDark ? 'text-slate-300' : 'text-gray-700'}>
                Are you sure you want to delete{' '}
                <strong className={isDark ? 'text-slate-100' : 'text-gray-900'}>{member.fullName}</strong>?
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                {member.email} • {member.role === 'projectManager' ? 'Project Manager' : 'Developer'}
              </p>
            </div>

            {/* Warning Box */}
            <div className={`border-l-4 rounded-lg p-4 ${isDark ? 'bg-amber-900/20 border-amber-500' : 'bg-amber-50 border-amber-500'}`}>
              <p className={`text-sm font-bold mb-2 ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
                ⚠️ This action cannot be undone
              </p>
              <ul className={`text-sm space-y-1 ${isDark ? 'text-amber-200/80' : 'text-amber-700'}`}>
                <li>• User account will be permanently deleted</li>
                <li>• User will lose access to the system</li>
                {requiresTransfer && (
                  <li>• {projectCount} active project{projectCount !== 1 ? 's' : ''} must be transferred</li>
                )}
              </ul>
            </div>

            {/* Project Transfer UI - Only if required */}
            {requiresTransfer && (
              <div className={`rounded-lg p-4 border ${isDark ? 'bg-indigo-900/10 border-indigo-900/40' : 'bg-indigo-50 border-indigo-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Users className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <p className={`text-sm font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-900'}`}>
                    Project Transfer Required
                  </p>
                </div>
                <p className={`text-sm mb-3 ${isDark ? 'text-indigo-200/80' : 'text-indigo-800'}`}>
                  This PM manages <strong>{projectCount}</strong> active project{projectCount !== 1 ? 's' : ''}. 
                  Select another PM to transfer ownership:
                </p>
                
                {availablePMs.length === 0 ? (
                  <div className={`border rounded-lg p-3 ${isDark ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
                    <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                      ⚠️ No available Project Managers found. Cannot delete this member.
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedPM}
                    onChange={(e) => {
                      setSelectedPM(e.target.value);
                      setError(null);
                    }}
                    className={`${authFormClasses.input} ${isDark ? authFormClasses.inputDark : authFormClasses.inputLight}`}
                    disabled={loading}
                  >
                    <option value="">Select Project Manager</option>
                    {availablePMs.map((pm) => (
                      <option key={pm._id} value={pm._id}>
                        {pm.fullName} {pm.specialization ? `(${pm.specialization})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Actions - Matching CreateProjectModal button style */}
          <div 
            className="flex flex-col sm:flex-row gap-3 p-6 border-t rounded-b-2xl"
            style={{ 
              background: isDark ? 'rgba(10,13,22,0.6)' : '#f8fafc',
              borderColor: isDark ? 'rgba(99,102,241,0.1)' : '#f1f5f9'
            }}
          >
            <button
              onClick={onClose}
              className={`w-full sm:flex-1 ${authFormClasses.secondaryBtn} ${isDark ? authFormClasses.secondaryDark : authFormClasses.secondaryLight}`}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={`w-full sm:flex-1 ${authFormClasses.primaryBtn} flex items-center justify-center gap-2`}
              style={{ background: 'linear-gradient(135deg,#ef4444 0%, #e11d48 100%)' }}
              disabled={loading || (requiresTransfer && availablePMs.length === 0)}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
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

export default DeleteMemberModal;
