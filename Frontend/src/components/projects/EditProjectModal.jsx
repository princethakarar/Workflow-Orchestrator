import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { authFormClasses } from '../../utils/authFormStyles';

const EditProjectModal = ({ isOpen, onClose, project, onSave }) => {
    const { isDark } = useTheme();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'active',
        startDate: '',
        endDate: ''
    });
    const [loading, setLoading] = useState(false);
    const [dateError, setDateError] = useState('');

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name || '',
                description: project.description || '',
                status: project.status || 'active',
                startDate: project.startDate ? project.startDate.split('T')[0] : '',
                endDate: project.endDate ? project.endDate.split('T')[0] : ''
            });
        }
    }, [project]);

    useEffect(() => {
        if (!formData.startDate || !formData.endDate) {
            setDateError('');
            return;
        }
        if (formData.endDate < formData.startDate) {
            setDateError('End date cannot be earlier than start date');
        } else {
            setDateError('');
        }
    }, [formData.startDate, formData.endDate]);

    useEffect(() => {
        if (!isOpen) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (dateError) return;
        setLoading(true);
        try {
            await onSave(formData);
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
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
                style={{ zIndex: 100000 }}
            >
                <div
                    className={`rounded-2xl shadow-2xl w-full max-w-2xl my-8 max-h-[calc(100vh-4rem)] overflow-y-auto modal-scrollbar ${authFormClasses.card} ${isDark ? authFormClasses.cardSurfaceDark : authFormClasses.cardSurfaceLight}`}
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 sm:p-6 rounded-t-2xl flex justify-between items-center z-10">
                        <h2 className="text-xl sm:text-2xl font-bold">Edit Project Details</h2>
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
                        <div>
                            <label className={`${authFormClasses.label} ${isDark ? authFormClasses.labelDark : authFormClasses.labelLight}`}>
                                Project Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={`${authFormClasses.input} ${isDark ? authFormClasses.inputDark : authFormClasses.inputLight}`}
                                required
                            />
                        </div>

                        <div>
                            <label className={`${authFormClasses.label} ${isDark ? authFormClasses.labelDark : authFormClasses.labelLight}`}>
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className={`${authFormClasses.input} ${isDark ? authFormClasses.inputDark : authFormClasses.inputLight}`}
                                rows="3"
                            />
                        </div>

                        <div>
                            <label className={`${authFormClasses.label} ${isDark ? authFormClasses.labelDark : authFormClasses.labelLight}`}>
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className={`${authFormClasses.input} ${isDark ? authFormClasses.inputDark : authFormClasses.inputLight}`}
                            >
                                <option value="planning">Planning</option>
                                <option value="active">Active</option>
                                <option value="onHold">On Hold</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`${authFormClasses.label} ${isDark ? authFormClasses.labelDark : authFormClasses.labelLight}`}>
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className={`${authFormClasses.input} ${isDark ? authFormClasses.inputDark : authFormClasses.inputLight}`}
                                />
                            </div>
                            <div>
                                <label className={`${authFormClasses.label} ${isDark ? authFormClasses.labelDark : authFormClasses.labelLight}`}>
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    min={formData.startDate || undefined}
                                    className={`${authFormClasses.input} ${isDark ? authFormClasses.inputDark : authFormClasses.inputLight}`}
                                />
                                {dateError && (
                                    <p className="mt-2 text-sm" style={{ color: '#ef4444', fontWeight: 600 }}>
                                        {dateError}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                className={`${authFormClasses.secondaryBtn} ${isDark ? authFormClasses.secondaryDark : authFormClasses.secondaryLight}`}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={`${authFormClasses.primaryBtn}`}
                                style={{ background: authFormClasses.primaryBtnBg }}
                                disabled={loading || !!dateError}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );

    // Render via portal to avoid parent stacking contexts / header overlap issues
    return createPortal(modalContent, document.body);
};

export default EditProjectModal;
