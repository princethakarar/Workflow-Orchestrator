import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle, GitBranch, Sun, Moon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkflow } from '../hooks/useWorkflow'
import WorkflowEditor from '../components/WorkflowEditor'
import { toast } from 'react-toastify'
import { useEffect, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import WorkflowLoader from '../components/common/WorkflowLoader'
import useMinLoader from '../hooks/useMinLoader'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../hooks/useSocket'

/**
 * WorkflowEditorPage
 * Full-screen page wrapper that loads workflow data and renders the editor.
 * Handles loading, error, and 403 states.
 */
const WorkflowEditorPage = () => {
    const { projectId } = useParams()
    const navigate = useNavigate()
    const { isDark, toggle } = useTheme()
    const { user } = useAuth()
    const { on, off, isConnected, socket } = useSocket(projectId)

    const {
        project,
        nodes,
        edges,
        availableSubtasks,
        canEdit,
        loading,
        error,
        refetch,
        silentRefetch
    } = useWorkflow(projectId)

    // Handle real-time updates — only attach when socket is actually connected
    useEffect(() => {
        if (!isConnected) return

        const handleWorkflowUpdate = () => {
            // The backend already excludes the sender's socket via except(),
            // so any event we receive here is definitely from another tab/user.
            console.log('[WorkflowSync] Received workflow-updated — syncing');
            silentRefetch();
        };

        on('workflow-updated', handleWorkflowUpdate);

        return () => {
            off('workflow-updated', handleWorkflowUpdate);
        };
    }, [isConnected, on, off, silentRefetch]);

    // Handle auth errors
    useEffect(() => {
        if (error) {
            const is403 = error.toLowerCase().includes('access') || error.toLowerCase().includes('denied')
            toast.error(error)
            if (is403) navigate(-1)
        }
    }, [error, navigate])

    // ── Loading State ─────────────────────────────────────────────────────────
    const showLoader = useMinLoader(loading)

    if (showLoader) {
        return (
            <div className="h-screen flex flex-col items-center justify-center transition-colors" style={{ backgroundColor: 'var(--bg-page)' }}>
                <WorkflowLoader message="Loading workflow…" />
            </div>
        )
    }

    // ── Error / Not Found ─────────────────────────────────────────────────────
    if (!project && !loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center transition-colors" style={{ backgroundColor: 'var(--bg-page)' }}>
                <AlertCircle className="w-14 h-14 mb-4" style={{ color: 'var(--text-muted)' }} />
                <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Project not found</h2>
                <button
                    onClick={() => navigate(-1)}
                    className="text-sm hover:underline"
                    style={{ color: 'var(--primary)' }}
                >
                    Go back
                </button>
            </div>
        )
    }

    // ── Main Layout ───────────────────────────────────────────────────────────
    return (
        <div className="h-screen flex flex-col transition-colors" style={{ backgroundColor: 'var(--bg-page)' }}>
            {/* Top Bar */}
            <header className="border-b shadow-sm flex-shrink-0 transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="px-4 py-3 flex items-center justify-between">
                    {/* Left */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                            onMouseOver={e => {e.currentTarget.style.color='var(--text-primary)'; e.currentTarget.style.backgroundColor='var(--bg-hover)'}}
                            onMouseOut={e => {e.currentTarget.style.color='var(--text-secondary)'; e.currentTarget.style.backgroundColor='transparent'}}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>

                        <div className="h-5 w-px transition-colors" style={{ backgroundColor: 'var(--border)' }} />

                        <div className="flex items-center gap-2">
                            <GitBranch className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                            <div>
                                <h1 className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                                    {project?.name || 'Workflow Editor'}
                                </h1>
                                <p className="text-[11px] leading-none" style={{ color: 'var(--text-secondary)' }}>
                                    {canEdit ? 'Edit Mode – Admin / PM' : 'Read-Only View'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right — stats */}
                    <div className="flex items-center gap-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        {/* ── Theme Toggle ── */}
                        <motion.button
                            onClick={toggle}
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.05 }}
                            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            style={{
                                width: 32, height: 32, borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
                                border: '1px solid var(--border)',
                                color: '#6366f1',
                                cursor: 'pointer',
                                flexShrink: 0,
                            }}
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                {isDark ? (
                                    <motion.span key="sun" initial={{ opacity:0, rotate:-90 }} animate={{ opacity:1, rotate:0 }} exit={{ opacity:0, rotate:90 }} transition={{ duration:0.2 }}>
                                        <Sun size={15} />
                                    </motion.span>
                                ) : (
                                    <motion.span key="moon" initial={{ opacity:0, rotate:90 }} animate={{ opacity:1, rotate:0 }} exit={{ opacity:0, rotate:-90 }} transition={{ duration:0.2 }}>
                                        <Moon size={15} />
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </div>
                </div>
            </header>

            {/* Editor */}
            <div className="flex-1 overflow-hidden">
                <WorkflowEditor
                    projectId={projectId}
                    initialNodes={nodes}
                    initialEdges={edges}
                    initialSubtasks={availableSubtasks}
                    canEdit={canEdit}
                    socketId={socket?.id}
                />
            </div>
        </div>
    )
}

export default WorkflowEditorPage
