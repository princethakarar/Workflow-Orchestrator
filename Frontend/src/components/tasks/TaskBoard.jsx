import React, { useState } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { taskAPI } from '../../services/taskService';
import { toast } from 'react-toastify';
import TaskCard from './TaskCard';
import DeveloperAvatar from './DeveloperAvatar';
import CreateTaskModal from './CreateTaskModal';
import CreateSubtaskModal from './CreateSubtaskModal';

const TaskBoard = ({ projectId, tasks, teamMembers, onTasksUpdate, canEdit }) => {
    const [expandedTasks, setExpandedTasks] = useState(new Set());
    const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
    const [createSubtaskModal,setCreateSubtaskModal] = useState({
        isOpen: false,
        taskId: null
    });
    const [activeDeveloper, setActiveDeveloper] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const toggleTask = (taskId) => {
        setExpandedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };

    const handleDragStart = (event) => {
        const developer = teamMembers.find(m => m._id === event.active.id);
        setActiveDeveloper(developer);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveDeveloper(null);

        if (!over) return;

        const developerId = active.id;
        const dropData = over.data?.current;

        if (!dropData) return;

        try {
            if (dropData.type === 'task') {
                // Assign to task (task-level assignment - only if no subtasks)
                await taskAPI.assignDevelopersToTask(dropData.taskId, [developerId]);
                const developer = teamMembers.find(m => m._id === developerId);
                toast.success(`${developer.fullName || developer.name} assigned to task`);
            } else if (dropData.type === 'subtask') {
                // Assign to subtask (subtask-level assignment)
                await taskAPI.assignDevelopersToSubtask(dropData.taskId, dropData.subtaskId, [developerId]);
                const developer = teamMembers.find(m => m._id === developerId);
                toast.success(`${developer.fullName || developer.name} assigned to subtask`);
            }

            onTasksUpdate();
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to assign developer';
            toast.error(errorMessage);
        }
    };

    const handleToggleSubtask = async (taskId, subtaskId) => {
        try {
            await taskAPI.toggleSubtaskCompletion(taskId, subtaskId);
            toast.success('Subtask updated');
            onTasksUpdate();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update subtask');
        }
    };

    const handleUnassignDeveloperFromSubtask = async (taskId, subtaskId, developerId) => {
        try {
            await taskAPI.removeDeveloperFromSubtask(taskId, subtaskId, developerId);
            toast.success('Developer unassigned from subtask');
            onTasksUpdate();
        } catch (error) {
            toast.error('Failed to unassign developer');
        }
    };

    const handleUnassignDeveloperFromTask = async (taskId, developerId) => {
        try {
            await taskAPI.removeDeveloperFromTask(taskId, developerId);
            toast.success('Developer unassigned from task');
            onTasksUpdate();
        } catch (error) {
            toast.error('Failed to unassign developer');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task? All subtasks will be removed.')) {
            return;
        }

        try {
            await taskAPI.deleteTask(taskId);
            toast.success('Task deleted');
            onTasksUpdate();
        } catch (error) {
            toast.error('Failed to delete task');
        }
    };

    const handleDeleteSubtask = async (taskId, subtaskId) => {
        try {
            await taskAPI.deleteSubtask(taskId, subtaskId);
            toast.success('Subtask deleted');
            onTasksUpdate();
        } catch (error) {
            toast.error('Failed to delete subtask');
        }
    };

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Task Management</h2>
                {canEdit && (
                    <button
                        onClick={() => setCreateTaskModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                    >
                        <Plus className="w-5 h-5" />
                        New Task
                    </button>
                )}
            </div>

            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {/* Draggable Team Members (Only show if user can edit) */}
                {canEdit && teamMembers.length > 0 && (
                    <div
                        className="rounded-lg p-4 mb-6"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
                    >
                        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                            Team Members (Drag to assign to tasks or subtasks)
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {teamMembers.map(member => (
                                <DeveloperAvatar
                                    key={member._id}
                                    developer={member}
                                    draggable={true}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Tasks List */}
                <div className="space-y-4">
                    {tasks.length === 0 ? (
                        <div
                            className="rounded-lg p-12 text-center"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
                        >
                            <p style={{ color: 'var(--text-muted)' }}>
                                {canEdit
                                    ? 'No tasks yet. Create your first task to get started.'
                                    : 'No tasks have been created for this project yet.'}
                            </p>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <TaskCard
                                key={task._id}
                                task={task}
                                isExpanded={expandedTasks.has(task._id)}
                                onToggle={() => toggleTask(task._id)}
                                onAddSubtask={() => setCreateSubtaskModal({ isOpen: true, taskId: task._id })}
                                onToggleSubtask={handleToggleSubtask}
                                onUnassignDeveloperFromSubtask={handleUnassignDeveloperFromSubtask}
                                onUnassignDeveloperFromTask={handleUnassignDeveloperFromTask}
                                onDeleteTask={handleDeleteTask}
                                onDeleteSubtask={handleDeleteSubtask}
                                canEdit={canEdit}
                            />
                        ))
                    )}
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeDeveloper ? (
                        <div
                            className="rounded-lg shadow-lg p-2"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        >
                            <DeveloperAvatar developer={activeDeveloper} draggable={false} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Modals (Only render for users who can edit) */}
            {canEdit && (
                <>
                    <CreateTaskModal
                        isOpen={createTaskModalOpen}
                        onClose={() => setCreateTaskModalOpen(false)}
                        projectId={projectId}
                        onSuccess={() => {
                            setCreateTaskModalOpen(false);
                            onTasksUpdate();
                        }}
                    />

                    <CreateSubtaskModal
                        isOpen={createSubtaskModal.isOpen}
                        onClose={() => setCreateSubtaskModal({ isOpen: false, taskId: null })}
                        taskId={createSubtaskModal.taskId}
                        onSuccess={() => {
                            setCreateSubtaskModal({ isOpen: false, taskId: null });
                            onTasksUpdate();
                        }}
                    />
                </>
            )}
        </div>
    );
};

export default TaskBoard;
