import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { authFormClasses } from '../../utils/authFormStyles';

const CreateTaskModal = ({ isOpen, onClose, projectId, onSuccess }) => {
    const { isDark } = useTheme();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        deadline: '',
        githubSyncEnabled: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title.trim()) {
            setError('Task title is required');
            return;
        }

        setLoading(true);

        try {
            const { taskAPI } = await import('../../services/taskService');
            await taskAPI.createTask(projectId, formData);
            
            // Reset form
            setFormData({
                title: '',
                description: '',
                priority: 'medium',
                deadline: '',
                githubSyncEnabled: true
            });
            
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create task');
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
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 overflow-y-auto">
                <div
                    className={`rounded-2xl shadow-2xl w-full max-w-2xl my-8 max-h-[calc(100vh-4rem)] overflow-y-auto modal-scrollbar ${authFormClasses.card} ${isDark ? authFormClasses.cardSurfaceDark : authFormClasses.cardSurfaceLight}`}
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 sm:p-6 rounded-t-2xl flex justify-between items-center z-10">
                        <h2 className="text-xl sm:text-2xl font-bold">Create New Task</h2>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                            disabled={loading}
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
                                Task Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className={`${authFormClasses.input} ${isDark ? authFormClasses.inputDark : authFormClasses.inputLight}`}
                                placeholder="Enter task title"
                                required
                            />
                        </div>

                        <div>
                            <label className={`${authFormClasses.label} ${isDark ? authFormClasses.labelDark : authFormClasses.labelLight}`}>
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                                className={`${authFormClasses.input} ${isDark ? authFormClasses.inputDark : authFormClasses.inputLight} resize-none`}
                                placeholder="Describe your task..."
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={`${authFormClasses.label} ${isDark ? authFormClasses.labelDark : authFormClasses.labelLight}`}>
                                    Priority
                                </label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    className={`${authFormClasses.input} ${isDark ? authFormClasses.inputDark : authFormClasses.inputLight}`}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            <div>
                                <label className={`${authFormClasses.label} ${isDark ? authFormClasses.labelDark : authFormClasses.labelLight}`}>
                                    Deadline
                                </label>
                                <input
                                    type="date"
                                    name="deadline"
                                    value={formData.deadline}
                                    onChange={handleChange}
                                    className={`${authFormClasses.input} ${isDark ? authFormClasses.inputDark : authFormClasses.inputLight}`}
                                />
                            </div>
                        </div>

                        {/* GitHub Sync Toggle */}
                        <div className="flex items-center gap-2.5 py-3 px-4 rounded-lg" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                            <input
                                type="checkbox"
                                id="githubSync"
                                checked={formData.githubSyncEnabled}
                                onChange={(e) => setFormData(prev => ({ ...prev, githubSyncEnabled: e.target.checked }))}
                                className="w-4 h-4 rounded accent-indigo-500"
                            />
                            <label htmlFor="githubSync" className="text-sm font-medium flex items-center gap-1.5 cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-muted)' }}>
                                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                                </svg>
                                Sync with GitHub Issues
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
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
                                        Creating...
                                    </>
                                ) : (
                                    'Create Task'
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

export default CreateTaskModal;
