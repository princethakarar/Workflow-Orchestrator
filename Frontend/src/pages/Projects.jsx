import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../services/projectService';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CreateProjectModal from '../components/CreateProjectModal';
import DeleteProjectModal from '../components/DeleteProjectModal';
import Avatar from '../components/common/Avatar';
import {
  Plus,
  Folder,
  Calendar,
  Users,
  Loader2,
  Search,
  Trash2,
} from 'lucide-react';
import WorkflowLoader from '../components/common/WorkflowLoader';
import useMinLoader from '../hooks/useMinLoader';
import ComponentLoader from '../components/common/ComponentLoader';

// Match dashboard font stack
const F = "'Inter', 'Plus Jakarta Sans', sans-serif";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Projects listing and management page
 */
const Projects = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        project: null,
        loading: false,
    });

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const response = await projectAPI.getAllProjects();
            setProjects(response.data || []);
        } catch (error) {
            console.error('Error loading projects:', error);
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    // Handle project card click - route based on user role
    const handleProjectClick = (projectId) => {
        if (user?.role === 'developer') {
            navigate(`/developer/projects/${projectId}`);
        } else if (user?.role === 'projectManager') {
            navigate(`/manager/projects/${projectId}/dashboard`);
        } else {
            // admin (and any other privileged role)
            navigate(`/admin/projects/${projectId}/dashboard`);
        }
    };

    const handleProjectCreated = (newProject) => {
        setProjects(prev => [newProject, ...prev]);
    };

    const handleDeleteClick = (e, project) => {
        e.stopPropagation(); // Prevent card click navigation
        setDeleteModal({
            isOpen: true,
            project: project,
            loading: false,
        });
    };

    const handleDeleteConfirm = async () => {
        setDeleteModal(prev => ({ ...prev, loading: true }));

        try {
            // Call API to delete project
            const response = await projectAPI.deleteProject(deleteModal.project._id);

            // Optimistic UI update - remove from list
            setProjects(prev => prev.filter(p => p._id !== deleteModal.project._id));

            // Show success toast
            toast.success(response.message || 'Project deleted successfully');

            // Close modal
            setDeleteModal({ isOpen: false, project: null, loading: false });

        } catch (error) {
            // Re-throw error for modal to catch and display inline
            setDeleteModal(prev => ({ ...prev, loading: false }));
            throw error;
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, project: null, loading: false });
    };

    const filteredProjects = projects.filter(project =>
        project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const buildManagerAvatarUrl = (manager) => {
        if (!manager?.avatar) return null;
        const av = manager.avatar;
        const url = av?.url || (typeof av === 'string' && av ? av : null);
        if (!url || !url.trim()) return null;
        // Reject placeholder / dummy URLs
        const lower = url.toLowerCase();
        if (lower.includes('placehold') || lower.includes('placeholder') || /\b\d+x\d+\b/.test(lower)) return null;
        const base = API_BASE_URL.replace(/\/$/, '');
        return url.startsWith('http') ? url : `${base}${url}`;
    };

    const getPriorityStyle = (priority) => {
        switch (priority) {
            case 'critical': return { background: 'var(--bg-red-subtle)',     color: 'var(--text-red)',     borderColor: 'var(--border-red)' };
            case 'high':     return { background: 'var(--bg-amber-subtle)',   color: 'var(--text-amber)',   borderColor: 'var(--border-amber)' };
            case 'medium':   return { background: 'var(--bg-blue-subtle)',    color: 'var(--text-blue)',    borderColor: 'var(--border-blue)' };
            case 'low':      return { background: 'var(--bg-muted)',          color: 'var(--text-secondary)', borderColor: 'var(--border)' };
            default:         return { background: 'var(--bg-muted)',          color: 'var(--text-secondary)', borderColor: 'var(--border)' };
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'active':    return { background: 'var(--bg-emerald-subtle)', color: 'var(--text-emerald)' };
            case 'completed': return { background: 'var(--bg-blue-subtle)',    color: 'var(--text-blue)' };
            case 'onHold':    return { background: 'var(--bg-amber-subtle)',   color: 'var(--text-amber)' };
            case 'cancelled': return { background: 'var(--bg-red-subtle)',     color: 'var(--text-red)' };
            default:          return { background: 'var(--bg-muted)',          color: 'var(--text-secondary)' };
        }
    };

    // Check if user is admin
    const isAdmin = user?.role === 'admin';

    const showLoader = useMinLoader(loading);

    if (showLoader) {
        return <WorkflowLoader message="Loading projects…" />;
    }

    const isReady = !loading;

    return (
        <div className="max-w-7xl mx-auto px-6 pb-8" style={{ fontFamily: F }}>
            {/* Header */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <h1
                    style={{
                        fontFamily: F,
                        fontSize: '24px',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        margin: 0,
                        letterSpacing: '-0.02em',
                    }}
                >
                    Projects
                </h1>
                {isAdmin && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 18px',
                            borderRadius: '999px',
                            border: 'none',
                            cursor: 'pointer',
                            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                            color: '#fff',
                            fontFamily: F,
                            fontSize: '13px',
                            fontWeight: 600,
                            boxShadow: '0 6px 18px rgba(99,102,241,0.35)',
                        }}
                    >
                        <Plus className="w-4 h-4" />
                        New Project
                    </button>
                )}
            </div>

            {/* Search */}
            <div style={{ marginBottom: '20px', maxWidth: '360px' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: '999px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-input)',
                    }}
                >
                    <Search size={16} style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontFamily: F,
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                        }}
                    />
                </div>
            </div>

            {/* Projects Grid */}
            {!isReady ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[0,1,2,3,4,5].map(i => (
                        <div key={i} style={{
                            background: 'var(--bg-card)',
                            borderRadius: '16px',
                            border: '1px solid var(--border)',
                            boxShadow: 'var(--shadow-card)',
                            padding: '18px 18px 16px',
                        }}>
                            <ComponentLoader variant="card" rows={3} />
                        </div>
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                <div style={{ textAlign: 'center', paddingTop: '64px', paddingBottom: '64px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            background: isDark ? 'rgba(99,102,241,0.1)' : '#f1f5f9',
                            borderRadius: '50%', padding: '24px',
                            border: `1px solid ${isDark ? 'rgba(99,102,241,0.2)' : '#e2e8f0'}`,
                        }}>
                            <Folder style={{ width: '48px', height: '48px', color: isDark ? '#818cf8' : '#94a3b8' }} />
                        </div>
                        <div>
                            <h3 style={{ fontFamily: F, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                                {searchTerm ? 'No projects found' : 'No projects yet'}
                            </h3>
                            <p style={{ fontFamily: F, fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                {searchTerm
                                    ? 'Try adjusting your search criteria'
                                    : 'Get started by creating your first project'}
                            </p>
                            {!searchTerm && isAdmin && (
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 22px',
                                        borderRadius: '999px',
                                        border: 'none', cursor: 'pointer',
                                        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                        color: '#fff',
                                        fontFamily: F, fontSize: '13.5px', fontWeight: 600,
                                        boxShadow: '0 6px 18px rgba(99,102,241,0.35)',
                                    }}
                                >
                                    <Plus style={{ width: '16px', height: '16px' }} />
                                    Create Project
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <div
                            key={project._id}
                            className="cursor-pointer group"
                            style={{
                                background: 'var(--bg-card)',
                                borderRadius: '16px',
                                border: '1px solid var(--border)',
                                boxShadow: 'var(--shadow-card)',
                                padding: '18px 18px 16px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = isDark
                                    ? '0 14px 30px rgba(0,0,0,0.45), 0 0 0 1px rgba(99,102,241,0.35)'
                                    : '0 14px 30px rgba(15,23,42,0.12)';
                                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                                e.currentTarget.style.borderColor = 'var(--border)';
                            }}
                            onClick={() => handleProjectClick(project._id)}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3
                                        className="line-clamp-1 group-hover:text-indigo-400"
                                        style={{
                                            fontFamily: F,
                                            fontSize: '15px',
                                            fontWeight: 700,
                                            color: 'var(--text-primary)',
                                            margin: 0,
                                        }}
                                    >
                                        {project.name}
                                    </h3>
                                    {project.description && (
                                        <p
                                            className="mt-1 line-clamp-2"
                                            style={{
                                                fontFamily: F,
                                                fontSize: '12.5px',
                                                color: 'var(--text-secondary)',
                                            }}
                                        >
                                            {project.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                        <span
                                            style={{
                                                fontFamily: F,
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: 'var(--text-muted)',
                                            }}
                                        >
                                            PM:
                                        </span>
                                        {project.manager ? (
                                            <div className="flex items-center gap-1.5">
                                                <Avatar
                                                    name={project.manager.fullName || project.manager.username || project.manager.email}
                                                    imageUrl={buildManagerAvatarUrl(project.manager)}
                                                    seed={project.manager._id || project.manager.id || project.manager.email}
                                                    size={20}
                                                />
                                                <span
                                                    style={{
                                                        fontFamily: F,
                                                        fontSize: '11.5px',
                                                        color: 'var(--text-secondary)',
                                                    }}
                                                >
                                                    {project.manager.fullName || project.manager.email}
                                                </span>
                                            </div>
                                        ) : (
                                            <span
                                                className="italic"
                                                style={{
                                                    fontFamily: F,
                                                    fontSize: '11px',
                                                    color: 'var(--text-muted)',
                                                }}
                                            >
                                                Unassigned
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {/* Delete Button - Admin Only */}
                                {isAdmin && (
                                    <button
                                        onClick={(e) => handleDeleteClick(e, project)}
                                        title="Delete Project"
                                        style={{
                                            background: 'transparent',
                                            border: 'none', cursor: 'pointer',
                                            padding: '7px', borderRadius: '8px',
                                            color: 'var(--text-muted)',
                                            transition: 'all 0.18s ease',
                                            display: 'flex', alignItems: 'center',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.12)' : '#fee2e2';
                                            e.currentTarget.style.color = '#ef4444';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = 'var(--text-muted)';
                                        }}
                                    >
                                        <Trash2 style={{ width: '15px', height: '15px' }} />
                                    </button>
                                )}
                            </div>

                            {/* Status & Priority */}
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                                <span style={{
                                    ...getStatusStyle(project.status),
                                    padding: '3px 10px', borderRadius: '999px',
                                    fontFamily: F, fontSize: '11px', fontWeight: 600,
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                }}>
                                    {project.status === 'completed' && '✅ '}
                                    {project.status || 'planning'}
                                </span>
                                <span style={{
                                    ...getPriorityStyle(project.priority),
                                    padding: '3px 10px', borderRadius: '999px',
                                    fontFamily: F, fontSize: '11px', fontWeight: 600,
                                    border: `1px solid ${getPriorityStyle(project.priority).borderColor}`,
                                }}>
                                    {project.priority || 'medium'}
                                </span>
                            </div>

                            {/* Meta Info */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {project.completedAt && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '13px', flexShrink: 0 }}>✅</span>
                                        <span style={{ fontFamily: F, fontSize: '12px', color: isDark ? '#4ade80' : '#15803d', fontWeight: 600 }}>
                                            Completed on {new Date(project.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                )}
                                {project.startDate && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Calendar style={{ width: '13px', height: '13px', color: 'var(--text-muted)', flexShrink: 0 }} />
                                        <span style={{ fontFamily: F, fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            {new Date(project.startDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Users style={{ width: '13px', height: '13px', color: 'var(--text-muted)', flexShrink: 0 }} />
                                    <span style={{ fontFamily: F, fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        {project.team?.length || 0} team members
                                    </span>
                                </div>
                            </div>

                            {/* Tags */}
                            {project.tags && project.tags.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
                                    {project.tags.slice(0, 3).map((tag, index) => (
                                        <span
                                            key={index}
                                            style={{
                                                padding: '3px 9px',
                                                borderRadius: '6px',
                                                fontFamily: F,
                                                fontSize: '11px',
                                                fontWeight: 500,
                                                background: isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff',
                                                color: isDark ? '#a5b4fc' : '#4338ca',
                                                border: `1px solid ${isDark ? 'rgba(99,102,241,0.25)' : '#c7d2fe'}`,
                                            }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                    {project.tags.length > 3 && (
                                        <span style={{
                                            padding: '3px 9px',
                                            borderRadius: '6px',
                                            fontFamily: F,
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            background: 'var(--bg-muted)',
                                            color: 'var(--text-muted)',
                                            border: '1px solid var(--border)',
                                        }}>
                                            +{project.tags.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}

                        </div>
                    ))}
                </div>
            )}

            {/* Create Project Modal */}
            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onProjectCreated={handleProjectCreated}
            />

            {/* Delete Project Modal */}
            <DeleteProjectModal
                isOpen={deleteModal.isOpen}
                project={deleteModal.project}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                loading={deleteModal.loading}
            />
        </div>
    );
};

export default Projects;
