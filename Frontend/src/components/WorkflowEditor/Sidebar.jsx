import { useState } from 'react'
import { Search, RefreshCw, GitBranch, RotateCcw, ChevronLeft } from 'lucide-react'
import Avatar from '../common/Avatar'

const getStatusColor = (status) => {
    switch (status) {
        case 'done': return { bg: 'var(--bg-emerald-subtle)', border: '#34d399', hover: '#10b981' }
        case 'in-progress': return { bg: 'var(--bg-blue-subtle)', border: '#93c5fd', hover: '#3b82f6' }
        default: return { bg: 'var(--bg-card)', border: 'var(--border)', hover: 'var(--primary)' }
    }
}

const getStatusDot = (status) => {
    switch (status) {
        case 'done': return '#10b981'
        case 'in-progress': return '#3b82f6'
        default: return '#9ca3af'
    }
}

/**
 * SubtaskSidebar — draggable subtask cards for Admin/PM
 * Props:
 *   - subtasks: array of available (not-yet-on-canvas) subtasks
 *   - onDragStart: (event, subtask) => void
 *   - onRefresh: () => void
 *   - onReset: () => void   — resets canvas to last saved state
 *   - onClose: () => void   — collapses the sidebar
 */
const SubtaskSidebar = ({ subtasks = [], onDragStart, onRefresh, onReset, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('')

    // Group by parent task title
    const grouped = subtasks.reduce((acc, st) => {
        const key = st.taskTitle || 'Unnamed Task'
        if (!acc[key]) acc[key] = []
        acc[key].push(st)
        return acc
    }, {})

    // Filter by search
    const filteredGroups = Object.entries(grouped).reduce((acc, [taskTitle, subs]) => {
        const filtered = subs.filter(st =>
            st.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            taskTitle.toLowerCase().includes(searchTerm.toLowerCase())
        )
        if (filtered.length > 0) acc[taskTitle] = filtered
        return acc
    }, {})

    const totalCount = subtasks.length

    return (
        <div 
            className="flex flex-col h-full shadow-lg transition-colors border-r"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', width: 288 }}
        >
            {/* Header */}
            <div className="p-4 border-b transition-colors" style={{ borderColor: 'var(--border)', background: 'var(--bg-header-gradient, var(--bg-card))' }}>
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                        <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Subtasks</h2>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onRefresh}
                            className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Refresh"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                title="Collapse Sidebar"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Drag subtasks onto canvas to add them
                </p>
            </div>

            {/* Search */}
            <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search subtasks..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg focus:outline-none transition-colors border"
                        style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                    />
                </div>
            </div>

            {/* Subtask List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {Object.keys(filteredGroups).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                        <GitBranch className="w-10 h-10 mb-3 opacity-30" />
                        <p className="text-sm font-medium">
                            {totalCount === 0
                                ? 'All subtasks are on the canvas'
                                : 'No matching subtasks'}
                        </p>
                        {totalCount === 0 && (
                            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                Create subtasks in the Task Board first
                            </p>
                        )}
                    </div>
                ) : (
                    Object.entries(filteredGroups).map(([taskTitle, subs]) => (
                        <div key={taskTitle}>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1" style={{ color: 'var(--text-secondary)' }}>
                                {taskTitle}
                            </h3>
                            <div className="space-y-2">
                                {subs.map(subtask => {
                                    const stColor = getStatusColor(subtask.status);
                                    return (
                                        <div
                                            key={subtask._id}
                                            draggable
                                            onDragStart={e => onDragStart(e, subtask)}
                                            className="p-3 rounded-xl border-2 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-lg select-none"
                                            style={{ 
                                                backgroundColor: stColor.bg, 
                                                borderColor: stColor.border,
                                            }}
                                            onMouseOver={e => e.currentTarget.style.borderColor=stColor.hover}
                                            onMouseOut={e => e.currentTarget.style.borderColor=stColor.border}
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: getStatusDot(subtask.status) }} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                                                        {subtask.title}
                                                    </p>
                                                    {subtask.assignedTo ? (
                                                        <div className="flex items-center gap-1.5 mt-1.5">
                                                            <Avatar
                                                                name={subtask.assignedTo.fullName || subtask.assignedTo.name || subtask.assignedTo.email}
                                                                imageUrl={subtask.assignedTo.avatar}
                                                                seed={subtask.assignedTo._id || subtask.assignedTo.id || subtask.assignedTo.email}
                                                                size={18}
                                                            />
                                                            <span className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                                                                {subtask.assignedTo.fullName || subtask.assignedTo.name}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[10px] mt-0.5 italic" style={{ color: 'var(--text-secondary)' }}>Unassigned</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Reset Canvas button */}
            {onReset && (
                <div className="px-3 pt-2 pb-2 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                        onClick={onReset}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold border rounded-lg transition-colors shadow-sm"
                        style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)', backgroundColor: 'var(--bg-page)' }}
                        onMouseOver={e => {e.currentTarget.style.color='var(--color-danger)'; e.currentTarget.style.borderColor='var(--color-danger)';}}
                        onMouseOut={e => {e.currentTarget.style.color='var(--text-secondary)'; e.currentTarget.style.borderColor='var(--border)';}}
                        title="Discard unsaved changes and reset to last saved state"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset Canvas
                    </button>
                </div>
            )}

            {/* Footer */}
            <div className="px-3 py-3 border-t text-center" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-page)' }}>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    {totalCount} subtask{totalCount !== 1 ? 's' : ''} available
                </p>
            </div>
        </div>
    )
}

export default SubtaskSidebar
