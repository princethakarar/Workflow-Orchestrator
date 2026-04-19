import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import {
    Calendar,
    Edit,
    ExternalLink,
    Users,
    X,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { projectAPI } from '../../services/projectService';
import { taskAPI } from '../../services/taskService';
import { toast } from 'react-toastify';
import DeveloperCard from '../../components/projects/DeveloperCard';
import DroppableZone from '../../components/projects/DroppableZone';
import EditProjectModal from '../../components/projects/EditProjectModal';
import TaskBoard from '../../components/tasks/TaskBoard';
import WorkflowLoader from '../../components/common/WorkflowLoader';
import useMinLoader from '../../hooks/useMinLoader';
import ComponentLoader from '../../components/common/ComponentLoader';

const ProjectDashboard = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [availableDevelopers, setAvailableDevelopers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [activeDeveloper, setActiveDeveloper] = useState(null);
    
    // Task management state
    const [tasks, setTasks] = useState([]);
    const [taskStats, setTaskStats] = useState({});
    const [canEditTasks, setCanEditTasks] = useState(false);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        fetchProjectDetails();
        fetchAvailableDevelopers();
        fetchTasks();
    }, [id]);

    const fetchProjectDetails = async () => {
        try {
            const response = await projectAPI.getProjectDetails(id);
            setProject(response.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load project details');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableDevelopers = async () => {
        try {
            const response = await projectAPI.getAvailableDevelopers();
            setAvailableDevelopers(response.data);
        } catch (error) {
            console.error('Failed to fetch available developers:', error);
        }
    };

    const fetchTasks = async () => {
        try {
            const response = await taskAPI.getProjectTasks(id);
            setTasks(response.data);
            
            // Extract metadata from response
            const metadata = response.metadata || response;
            setTaskStats(metadata.stats || {});
            setCanEditTasks(metadata.canEdit || false);
            
            // Update project progress if tasks exist
            if (metadata.progress !== undefined) {
                setProject(prev => prev ? { ...prev, progress: metadata.progress } : null);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        }
    };

    const handleDragStart = (event) => {
        const developer = availableDevelopers.find(d => d._id === event.active.id);
        setActiveDeveloper(developer);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveDeveloper(null);

        if (!over || over.id !== 'project-team') {
            return; // Not dropped on team zone
        }

        const developerId = active.id;

        // Optimistic update - move developer immediately
        const developer = availableDevelopers.find(d => d._id === developerId);
        setAvailableDevelopers(prev => prev.filter(d => d._id !== developerId));
        setProject(prev => ({
            ...prev,
            team: [...prev.team, { user: developer, role: 'developer' }]
        }));

        try {
            await projectAPI.assignTeamMember(id, developerId);
            toast.success(`${developer.fullName} added to team`);
        } catch (error) {
            // Rollback on error
            setAvailableDevelopers(prev => [...prev, developer]);
            setProject(prev => ({
                ...prev,
                team: prev.team.filter(m => m.user._id !== developerId)
            }));

            const errorMessage = error.response?.data?.message || 'Failed to assign developer';
            toast.error(errorMessage);
        }
    };

    const handleRemoveMember = async (developerId) => {
        const member = project.team.find(m => m.user._id === developerId);
        const developer = member.user;

        // Optimistic update
        setProject(prev => ({
            ...prev,
            team: prev.team.filter(m => m.user._id !== developerId)
        }));
        setAvailableDevelopers(prev => [...prev, developer]);

        try {
            await projectAPI.removeTeamMember(id, developerId);
            toast.success(`${developer.fullName} removed from team`);
        } catch (error) {
            // Rollback on error
            setProject(prev => ({
                ...prev,
                team: [...prev.team, member]
            }));
            setAvailableDevelopers(prev => prev.filter(d => d._id !== developerId));

            toast.error(error.response?.data?.message || 'Failed to remove team member');
        }
    };

    const handleUpdateProject = async (updatedData) => {
        try {
            const response = await projectAPI.updateProjectDetails(id, updatedData);
            setProject(response.data);
            toast.success('Project updated successfully');
            setEditModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update project');
        }
    };

    const showLoader = useMinLoader(loading);

    if (showLoader) {
        return <WorkflowLoader message="Loading project details…" />;
    }

    const isReady = !!project;

    const { progress = 0 } = project || {};

    const statusColors = {
        'planning': 'bg-gray-100 text-gray-800',
        'active': 'bg-green-100 text-green-800',
        'onHold': 'bg-yellow-100 text-yellow-800',
        'completed': 'bg-blue-100 text-blue-800',
        'cancelled': 'bg-red-100 text-red-800'
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
            {/* Header Section */}
            <div
                style={{
                    background: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-card)',
                }}
            >
                <div className="max-w-7xl mx-auto px-6 py-6">
                    {!isReady ? (
                        <ComponentLoader variant="card" rows={3} message="Loading project header…" />
                    ) : (<>
                        {/* Project Title & Actions */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{project.name}</h1>
                                <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>{project.description || 'No description provided'}</p>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setEditModalOpen(true)}
                                    className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Details
                                </button>
                                <button
                                    onClick={() => navigate(`/workflow/${id}`)}
                                    className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Open Workflow
                                </button>
                            </div>
                        </div>

                        {/* Project Meta Info */}
                        <div className="flex items-center space-x-6 text-sm">
                            <div className="flex items-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[project.status] || 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {project.status?.toUpperCase()}
                                </span>
                            </div>

                            <div className="flex items-center" style={{ color: 'var(--text-secondary)' }}>
                                <Calendar className="w-4 h-4 mr-1" style={{ color: 'var(--text-muted)' }} />
                                Start: {formatDate(project.startDate)}
                            </div>

                            <div className="flex items-center" style={{ color: 'var(--text-secondary)' }}>
                                <Calendar className="w-4 h-4 mr-1" style={{ color: 'var(--text-muted)' }} />
                                End: {formatDate(project.endDate)}
                            </div>

                            <div className="flex items-center" style={{ color: 'var(--text-secondary)' }}>
                                <Users className="w-4 h-4 mr-1" style={{ color: 'var(--text-muted)' }} />
                                {project.team?.length || 0} team member(s)
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Project Progress</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{progress}% Complete</span>
                            </div>
                            <div className="w-full rounded-full h-3" style={{ background: 'var(--border-muted)' }}>
                                <div
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            {progress === 0 && (
                                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Project progress is calculated based on status</p>
                            )}
                        </div>
                    </>)}
                </div>
            </div>

            {/* Team Builder Section */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Team Management</h2>

                {!isReady ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="rounded-lg p-6" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
                            <ComponentLoader variant="table" rows={4} message="Loading talent pool…" />
                        </div>
                        <div className="rounded-lg p-6" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
                            <ComponentLoader variant="table" rows={4} message="Loading project team…" />
                        </div>
                    </div>
                ) : (
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Available Developers */}
                        <div>
                            <div
                                className="rounded-lg p-6"
                                style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}
                            >
                                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                                    Available Talent Pool
                                </h3>
                                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                                    Drag developers to the team to assign them
                                </p>

                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {availableDevelopers.length > 0 ? (
                                        availableDevelopers.map(developer => (
                                            <DeveloperCard
                                                key={developer._id}
                                                developer={developer}
                                                draggable={true}
                                            />
                                        ))
                                    ) : (
                                        <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                                            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" style={{ color: 'var(--text-muted)' }} />
                                            <p>No available developers</p>
                                            <p className="text-xs mt-1">All developers are assigned to projects</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Current Team */}
                        <div>
                            <DroppableZone id="project-team">
                                <div
                                    className="rounded-lg p-6"
                                    style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}
                                >
                                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                                        Project Team
                                    </h3>
                                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                                        Current team members assigned to this project
                                    </p>

                                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                        {project.team && project.team.length > 0 ? (
                                            project.team.map(member => (
                                                <div key={member.user._id} className="relative">
                                                    <DeveloperCard developer={member.user} draggable={false} />
                                                    <button
                                                        onClick={() => handleRemoveMember(member.user._id)}
                                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md"
                                                        title="Remove from team"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div
                                                className="text-center py-8 border-2 border-dashed rounded-lg"
                                                style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
                                            >
                                                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" style={{ color: 'var(--text-muted)' }} />
                                                <p>No team members assigned yet</p>
                                                <p className="text-sm mt-1">Drag developers here to add them</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </DroppableZone>
                        </div>
                    </div>

                    {/* Task Management Board */}
                    <TaskBoard
                        projectId={id}
                        tasks={tasks}
                        teamMembers={project?.team?.map(member => member.user) || []}
                        onTasksUpdate={fetchTasks}
                        canEdit={canEditTasks}
                    />

                    {/* Drag Overlay */}
                    <DragOverlay>
                        {activeDeveloper ? (
                            <DeveloperCard developer={activeDeveloper} draggable={false} />
                        ) : null}
                    </DragOverlay>
                </DndContext>
                )}
            </div>

            {/* Edit Project Modal */}
            <EditProjectModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                project={project}
                onSave={handleUpdateProject}
            />
        </div>
    );
};

export default ProjectDashboard;
