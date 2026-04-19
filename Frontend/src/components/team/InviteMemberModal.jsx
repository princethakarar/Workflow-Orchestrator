import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Loader2, AlertCircle,Mail, User, Shield, Code2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTheme } from '../../context/ThemeContext';
import { authFormClasses } from '../../utils/authFormStyles';

/**
 * Modal for inviting new team members
 * @param {boolean} isOpen - Modal visibility state
 * @param {function} onClose - Close handler
 * @param {function} onInvite - Invite handler (receives form data)
 */
const InviteMemberModal = ({ isOpen, onClose, onInvite }) => {
  const { isDark } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await onInvite(data);
      reset();
      onClose();
    } catch {
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`w-full max-w-md transform overflow-hidden p-6 shadow-xl transition-all ${authFormClasses.card} ${isDark ? authFormClasses.cardSurfaceDark : authFormClasses.cardSurfaceLight}`}
              >
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Invite Team Member
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label className={`${authFormClasses.label} ${isDark ? authFormClasses.labelDark : authFormClasses.labelLight}`}>
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                        <User size={18} />
                      </div>
                      <input
                        type="text"
                        {...register('name', {
                          required: 'Name is required',
                          minLength: { value: 3, message: 'Name must be at least 3 characters' },
                          maxLength: { value: 50, message: 'Name must not exceed 50 characters' }
                        })}
                        className={`block w-full rounded-xl pl-11 pr-4 py-3 text-sm placeholder-opacity-60 focus:outline-none focus:ring-2 transition-all ${
                          errors.name
                            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                            : `${isDark ? authFormClasses.inputDark : authFormClasses.inputLight}`
                        }`}
                        style={{
                          border: `1px solid ${errors.name ? 'rgba(239,68,68,0.45)' : 'var(--border)'}`,
                          background: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                        }}
                        placeholder="John Doe"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className={`${authFormClasses.label} ${isDark ? authFormClasses.labelDark : authFormClasses.labelLight}`}>
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: 'Invalid email format'
                          }
                        })}
                        className={`block w-full rounded-xl pl-11 pr-4 py-3 text-sm placeholder-opacity-60 focus:outline-none focus:ring-2 transition-all ${
                          errors.email
                            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                            : `${isDark ? authFormClasses.inputDark : authFormClasses.inputLight}`
                        }`}
                        style={{
                          border: `1px solid ${errors.email ? 'rgba(239,68,68,0.45)' : 'var(--border)'}`,
                          background: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                        }}
                        placeholder="john@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className={`${authFormClasses.label} ${isDark ? authFormClasses.labelDark : authFormClasses.labelLight}`}>
                      Role
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                        <Shield size={18} />
                      </div>
                      <select
                        {...register('role', { required: 'Role is required' })}
                        className={`block w-full rounded-xl pl-11 pr-4 py-3 text-sm placeholder-opacity-60 focus:outline-none focus:ring-2 transition-all appearance-none ${
                          errors.role
                            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                            : `${isDark ? authFormClasses.inputDark : authFormClasses.inputLight}`
                        }`}
                        style={{
                          border: `1px solid ${errors.role ? 'rgba(239,68,68,0.45)' : 'var(--border)'}`,
                          background: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <option value="">Select a role</option>
                        <option value="developer">Developer</option>
                        <option value="projectManager">Project Manager</option>
                      </select>
                    </div>
                    {errors.role && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.role.message}
                      </p>
                    )}
                  </div>

                  {/* Specialization */}
                  <div>
                    <label className={`${authFormClasses.label} ${isDark ? authFormClasses.labelDark : authFormClasses.labelLight}`}>
                      Specialization
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                        <Code2 size={18} />
                      </div>
                      <select
                        {...register('specialization', { required: 'Specialization is required' })}
                        defaultValue="Full Stack"
                        className={`block w-full rounded-xl pl-11 pr-4 py-3 text-sm placeholder-opacity-60 focus:outline-none focus:ring-2 transition-all appearance-none ${
                          errors.specialization
                            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                            : `${isDark ? authFormClasses.inputDark : authFormClasses.inputLight}`
                        }`}
                        style={{
                          border: `1px solid ${errors.specialization ? 'rgba(239,68,68,0.45)' : 'var(--border)'}`,
                          background: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <option value="Full Stack">Full Stack</option>
                        <option value="Frontend">Frontend</option>
                        <option value="Backend">Backend</option>
                        <option value="UI/UX">UI/UX Designer</option>
                        <option value="DevOps">DevOps Engineer</option>
                        <option value="Mobile">Mobile Developer</option>
                        <option value="QA">QA Engineer</option>
                        <option value="Project Manager">Project Manager</option>
                      </select>
                    </div>
                    {errors.specialization && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.specialization.message}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className={`flex-1 ${authFormClasses.secondaryBtn} ${isDark ? authFormClasses.secondaryDark : authFormClasses.secondaryLight}`}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`flex-1 ${authFormClasses.primaryBtn} flex items-center justify-center gap-2`}
                      style={{ background: authFormClasses.primaryBtnBg }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Invitation'
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default InviteMemberModal;
