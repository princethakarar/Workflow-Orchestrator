import React, { useState } from 'react';
import {
    ChevronDown,
    ChevronRight,
    Plus,
    Trash2,
    AlertTriangle,
    Calendar,
    X,
    ExternalLink
} from 'lucide-react';
import SubtaskRow from './SubtaskRow';
import { useDroppable } from '@dnd-kit/core';
import { getAvatarColor, getInitials } from '../../utils/avatarUtils';

const TaskCard = ({
    task,
    isExpanded,
    onToggle,
    onAddSubtask,
    onToggleSubtask,
    onUnassignDeveloperFromSubtask,
    onUnassignDeveloperFromTask,
    onDeleteTask,
    onDeleteSubtask,
    canEdit
}) => {
    // Only enable drop zone when NO subtasks exist
    const { isOver, setNodeRef } = useDroppable({
        id: `task-${task._id}`,
        data: {
            taskId: task._id,
            type: 'task'
        },
        disabled: !canEdit || task.subtasks.length > 0
    });

    const statusColors = {
        'todo': 'bg-gray-100 text-gray-800',
        'in-progress': 'bg-blue-100 text-blue-800',
        'done': 'bg-green-100 text-green-800'
    };

    const priorityColors = {
        'low': 'bg-green-50 text-green-700 border-green-200',
        'medium': 'bg-yellow-50 text-yellow-700 border-yellow-200',
        'high': 'bg-red-50 text-red-700 border-red-200'
    };


    const completionPercentage = task.subtasks.length > 0
        ? Math.round((task.subtasks.filter(st => st.isCompleted).length / task.subtasks.length) * 100)
        : 0;

    const hasSubtasks = task.subtasks.length > 0;
    const hasTaskAssignees = task.assignedTo && task.assignedTo.length > 0;

    return (
        <div
            className="rounded-lg"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
            {/* Task Header */}
            <div
                ref={setNodeRef}
                className={`p-4 transition-colors ${isOver ? 'bg-blue-50 border-2 border-blue-400' : ''
                    }`}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                        <button
                            onClick={onToggle}
                            className="mr-3 mt-1"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-5 h-5" />
                            ) : (
                                <ChevronRight className="w-5 h-5" />
                            )}
                        </button>

                        <div className="flex-1">
                            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {task.title}
                            </h3>
                            {task.description && (
                                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{task.description}</p>
                            )}

                            {/* GitHub Issue Badge */}
                            {task.githubIssueNumber && (
                                <a
                                    href={task.githubIssueUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:scale-105"
                                    style={{
                                        background: 'var(--bg-input)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-secondary)'
                                    }}
                                    title="View on GitHub"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                                    </svg>
                                    Issue #{task.githubIssueNumber}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}

                            {/* Warning when subtasks exist */}
                            {hasSubtasks && (
                                <div className="mt-3 flex items-center text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    <span className="text-xs font-medium">Assignment must be done at subtask level</span>
                                </div>
                            )}

                            {/* Task-level Assigned Developers (only shown when NO subtasks) */}
                            {!hasSubtasks && hasTaskAssignees && (
                                <div className="mt-3 flex items-center flex-wrap gap-2">
                                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Assigned:</span>
                                    {task.assignedTo.map((developer) => (
                                        <div key={developer._id} className="relative group flex items-center">
                                            <div
                                                className={`w-7 h-7 ${getAvatarColor(developer._id || developer.id)} rounded-full flex items-center justify-center text-white text-xs font-semibold`}
                                                title={developer.fullName || developer.name}
                                            >
                                                {getInitials(developer.fullName || developer.name)}
                                            </div>
                                            <span className="ml-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                {developer.fullName || developer.name}
                                            </span>
                                            {canEdit && (
                                                <button
                                                    onClick={() => onUnassignDeveloperFromTask(task._id, developer._id)}
                                                    className="ml-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Remove from task"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Drop hint */}
                            {!hasSubtasks && isOver && (
                                <div className="mt-2 text-sm text-blue-600 font-medium">
                                    Drop to assign developer to task
                                </div>
                            )}

                            {/* Task Meta */}
                            <div className="flex items-center space-x-3 mt-3 flex-wrap gap-2">
                                <span className={`px-2 py-1 text-xs font-semibold rounded ${statusColors[task.status]}`}>
                                    {task.status.toUpperCase().replace('-', ' ')}
                                </span>
                                <span className={`px-2 py-1 text-xs font-semibold rounded border ${priorityColors[task.priority]}`}>
                                    {task.priority.toUpperCase()}
                                </span>
                                {task.deadline && (
                                    <div className="flex items-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        <Calendar className="w-3 h-3 mr-1" style={{ color: 'var(--text-muted)' }} />
                                        {new Date(task.deadline).toLocaleDateString()}
                                    </div>
                                )}
                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    {task.subtasks.length} subtask{task.subtasks.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Progress Bar */}
                            {task.subtasks.length > 0 && (
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                                        <span>Progress</span>
                                        <span>{completionPercentage}%</span>
                                    </div>
                                    <div className="w-full rounded-full h-2" style={{ background: 'var(--border-muted)' }}>
                                        <div
                                            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all"
                                            style={{ width: `${completionPercentage}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions (Only for Admin/PM) */}
                    {canEdit && (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={onAddSubtask}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                title="Add Subtask"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onDeleteTask(task._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                title="Delete Task"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Subtasks (Expanded) */}
            {isExpanded && (
                <div className="border-t" style={{ borderColor: 'var(--border)' }}>
                    {task.subtasks.length === 0 ? (
                        <div className="p-6 text-center" style={{ color: 'var(--text-muted)' }}>
                            <p className="text-sm">No subtasks yet. Add one to get started.</p>
                        </div>
                    ) : (
                        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                            {task.subtasks.map((subtask) => (
                                <SubtaskRow
                                    key={subtask._id}
                                    subtask={subtask}
                                    taskId={task._id}
                                    onToggle={() => onToggleSubtask(task._id, subtask._id)}
                                    onUnassignDeveloper={(developerId) =>
                                        onUnassignDeveloperFromSubtask(task._id, subtask._id, developerId)
                                    }
                                    onDelete={() => onDeleteSubtask(task._id, subtask._id)}
                                    canEdit={canEdit}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TaskCard;
