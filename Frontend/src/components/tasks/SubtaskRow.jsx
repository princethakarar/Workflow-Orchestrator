import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { CheckCircle2, Circle, X, Trash2 } from 'lucide-react';
import { getAvatarColor, getInitials } from '../../utils/avatarUtils';

const SubtaskRow = ({
    subtask,
    taskId,
    onToggle,
    onUnassignDeveloper,
    onDelete,
    canEdit
}) => {
    const { isOver, setNodeRef } = useDroppable({
        id: `subtask-${subtask._id}`,
        data: {
            taskId,
            subtaskId: subtask._id,
            type: 'subtask'
        },
        disabled: !canEdit
    });

    return (
        <div
            ref={setNodeRef}
            className={`p-4 flex items-center justify-between transition-colors ${isOver ? 'border-l-4 border-blue-400' : ''}`}
            style={{
                background: isOver ? 'rgba(59,130,246,0.10)' : undefined,
            }}
        >
            <div className="flex items-center flex-1">
                {/* Checkbox */}
                <button
                    onClick={onToggle}
                    className="mr-3"
                >
                    {subtask.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                        <Circle className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    )}
                </button>

                {/* Title */}
                <span
                    className="flex-1"
                    style={{
                        color: subtask.isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: subtask.isCompleted ? 'line-through' : 'none',
                    }}
                >
                    {subtask.title}
                </span>

                {/* Assigned Developers */}
                {subtask.assignedTo && subtask.assignedTo.length > 0 && (
                    <div className="ml-4 flex items-center space-x-2">
                        {subtask.assignedTo.map((developer) => (
                            <div key={developer._id} className="relative group">
                                <div
                                    className={`w-8 h-8 ${getAvatarColor(developer._id || developer.id)} rounded-full flex items-center justify-center text-white text-xs font-semibold`}
                                    title={developer.fullName || developer.name}
                                >
                                    {getInitials(developer.fullName || developer.name)}
                                </div>
                                {canEdit && (
                                    <button
                                        onClick={() => onUnassignDeveloper(developer._id)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove from subtask"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Drop Zone Hint */}
                {isOver && (
                    <span className="ml-4 text-sm text-blue-600 font-medium">
                        Drop to assign
                    </span>
                )}
            </div>

            {/* Delete Button (Only for Admin/PM) */}
            {canEdit && (
                <button
                    onClick={onDelete}
                    className="p-1 hover:text-red-600 ml-2"
                    style={{ color: 'var(--text-muted)' }}
                    title="Delete Subtask"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

export default SubtaskRow;
