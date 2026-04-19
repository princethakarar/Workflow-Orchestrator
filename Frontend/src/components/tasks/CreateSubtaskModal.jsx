import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { authFormClasses } from '../../utils/authFormStyles';

const CreateSubtaskModal = ({ isOpen, onClose, taskId, onSuccess }) => {
    const { isDark } = useTheme();
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) {
            setError('Subtask title is required');
            return;
        }

        setLoading(true);

        try {
            const { taskAPI } = await import('../../services/taskService');
            await taskAPI.createSubtask(taskId, { title });
            
            setTitle('');
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create subtask');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

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
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
                <div
                    className={`rounded-2xl shadow-2xl w-full max-w-md my-8 ${authFormClasses.card} ${isDark ? authFormClasses.cardSurfaceDark : authFormClasses.cardSurfaceLight}`}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 sm:p-6 rounded-t-2xl flex justify-between items-center">
                        <h2 className="text-xl sm:text-2xl font-bold">Add Subtask</h2>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                        >
                            <X className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
                        {error && (
                            <div className={isDark ? authFormClasses.errorBoxDark : authFormClasses.errorBoxLight}>
                                {error}
                            </div>
                        )}

                        <div>
                            <label className={`${authFormClasses.label} ${isDark ? authFormClasses.labelDark : authFormClasses.labelLight}`}>
                                Subtask Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className={`${authFormClasses.input} ${isDark ? authFormClasses.inputDark : authFormClasses.inputLight}`}
                                placeholder="Enter subtask title"
                                required
                                autoFocus
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className={`w-full sm:flex-1 ${authFormClasses.secondaryBtn} ${isDark ? authFormClasses.secondaryDark : authFormClasses.secondaryLight}`}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full sm:flex-1 ${authFormClasses.primaryBtn} flex items-center justify-center gap-2`}
                                style={{ background: authFormClasses.primaryBtnBg }}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    'Add Subtask'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );

    // Render modal using portal to bypass z-index stacking context
    return createPortal(modalContent, document.body);
};

export default CreateSubtaskModal;
