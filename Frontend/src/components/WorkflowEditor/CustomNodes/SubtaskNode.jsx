import React, { memo, useState } from 'react'
import { Handle, Position, useReactFlow } from '@xyflow/react'
import { CheckCircle2, Circle, Clock, X } from 'lucide-react'

const SubtaskNode = ({ id, data }) => {
    const { title, status, assignedTo, taskTitle, isCompleted, allAssignees, taskPriority, canEdit } = data
    const { deleteElements } = useReactFlow()
    const [isHovered, setIsHovered] = useState(false)

    const handleRemove = (e) => {
        e.stopPropagation()
        deleteElements({ nodes: [{ id }] })
    }

    const getNodeStyle = () => {
        const base = {
            transition: 'all 0.2s ease',
            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        }
        switch (status) {
            case 'done':
                return {
                    ...base,
                    background: 'var(--bg-emerald-subtle)',
                    borderColor: 'var(--text-emerald)',
                    boxShadow: isHovered ? '0 0 20px rgba(16,185,129,0.4)' : '0 4px 12px rgba(16,185,129,0.15)'
                }
            case 'in-progress':
                return {
                    ...base,
                    background: 'var(--bg-blue-subtle)',
                    borderColor: 'var(--text-blue)',
                    boxShadow: isHovered ? '0 0 20px rgba(59,130,246,0.4)' : '0 4px 12px rgba(59,130,246,0.15)'
                }
            default:
                return {
                    ...base,
                    background: 'var(--bg-card)',
                    borderColor: isHovered ? 'var(--primary-500)' : 'var(--border)',
                    boxShadow: isHovered ? '0 0 20px rgba(99,102,241,0.25)' : '0 4px 12px rgba(0,0,0,0.1)'
                }
        }
    }

    const getStatusIcon = () => {
        switch (status) {
            case 'done':
                return <CheckCircle2 className="w-4 h-4 shrink-0 transition-colors" style={{ color: 'var(--text-emerald)' }} />
            case 'in-progress':
                return <Clock className="w-4 h-4 shrink-0 animate-pulse transition-colors" style={{ color: 'var(--text-blue)' }} />
            default:
                return <Circle className="w-4 h-4 shrink-0 transition-colors" style={{ color: 'var(--text-muted)' }} />
        }
    }

    const getBadgeStyle = () => {
        switch (status) {
            case 'done':
                return { bg: 'var(--bg-emerald-subtle)', text: 'var(--text-emerald)', label: 'DONE' }
            case 'in-progress':
                return { bg: 'var(--bg-blue-subtle)', text: 'var(--text-blue)', label: 'IN PROGRESS' }
            default:
                return { bg: 'var(--bg-muted)', text: 'var(--text-secondary)', label: 'TO DO' }
        }
    }

    const getPriorityColor = () => {
        switch (taskPriority) {
            case 'high': return 'text-red-500'
            case 'medium': return 'text-amber-500'
            default: return 'text-slate-400'
        }
    }

    const badge = getBadgeStyle()
    const nodeStyle = getNodeStyle()

    const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?')

    return (
        <div
            className="rounded-xl border-2 min-w-[240px] max-w-[280px] overflow-hidden"
            style={nodeStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Handles */}
            <Handle
                type="target"
                position={Position.Left}
                style={{ width: 10, height: 10, background: '#94a3b8', border: '2px solid white' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                style={{ width: 10, height: 10, background: '#94a3b8', border: '2px solid white' }}
            />

            {/* Parent Task Label */}
            <div className="px-3 pt-2.5 pb-1 border-b flex items-center justify-between gap-2" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-1 min-w-0">
                    <span
                        className={`text-[10px] font-semibold uppercase tracking-wider shrink-0 ${getPriorityColor()}`}
                    >
                        ↗ Task:&nbsp;
                    </span>
                    <span className="text-[10px] font-medium truncate" style={{ color: 'var(--text-muted)' }}>
                        {taskTitle}
                    </span>
                </div>

                {/* Remove from canvas button — only for editors */}
                {canEdit && (
                    <button
                        onClick={handleRemove}
                        className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Remove from canvas"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Body */}
            <div className="px-3 py-2.5 space-y-2.5">
                {/* Title + Status Icon */}
                <div className="flex items-start gap-2">
                    {getStatusIcon()}
                    <p
                        className={`text-sm font-semibold leading-tight flex-1`}
                        style={{ color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: isCompleted ? 'line-through' : 'none' }}
                    >
                        {title}
                    </p>
                </div>

                {/* Assignees Row */}
                {allAssignees && allAssignees.length > 0 ? (
                    <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1.5">
                            {allAssignees.slice(0, 3).map((dev, i) => (
                                <div
                                    key={dev._id || i}
                                    title={dev.fullName || dev.name}
                                    className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold border-2 border-white"
                                >
                                    {getInitial(dev.fullName || dev.name)}
                                </div>
                            ))}
                            {allAssignees.length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-[9px] font-bold border-2 border-white">
                                    +{allAssignees.length - 3}
                                </div>
                            )}
                        </div>
                        <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                            {allAssignees[0].fullName || allAssignees[0].name}
                            {allAssignees.length > 1 && ` +${allAssignees.length - 1}`}
                        </span>
                    </div>
                ) : (
                    <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Unassigned</p>
                )}

                {/* Status Badge */}
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide`} style={{ backgroundColor: badge.bg, color: badge.text }}>
                    {badge.label}
                </span>
            </div>
        </div>
    )
}

export default memo(SubtaskNode)
