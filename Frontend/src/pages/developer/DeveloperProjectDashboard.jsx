import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { developerAPI } from '../../services/developerService';
import { getAvatarColor, getInitials } from '../../utils/avatarUtils';
import { toast } from 'react-toastify';
import Avatar from '../../components/common/Avatar';
import WorkflowLoader from '../../components/common/WorkflowLoader';
import useMinLoader from '../../hooks/useMinLoader';
import ComponentLoader from '../../components/common/ComponentLoader';

const DeveloperProjectDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [filter, setFilter] = useState('all'); // 'all' or 'my-tasks'

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const response = await developerAPI.getDeveloperProjectView(id);
      
      console.log('Developer Project Data:', response.data);
      console.log('Tasks:', response.data.tasks);
      console.log('Current User ID:', response.data.currentUser.id);
      
      // Debug each task's assignment
      response.data.tasks.forEach((task, index) => {
        console.log(`Task ${index}: "${task.title}"`);
        console.log(`  - assignedTo:`, task.assignedTo);
        console.log(`  - subtasks count:`, task.subtasks?.length || 0);
        task.subtasks?.forEach((st, stIndex) => {
          console.log(`    Subtask ${stIndex}: "${st.title}" - assignedTo:`, st.assignedTo);
        });
      });
      
      setProject(response.data.project);
      setTasks(response.data.tasks);
      setStats(response.data.stats);
      setCurrentUserId(response.data.currentUser.id);
      
    } catch (error) {
      console.error('Failed to fetch project:', error);
      
      if (error.response?.status === 403) {
        toast.error('Access denied. You are not part of this project.');
        navigate('/developer/dashboard');
      } else {
        toast.error('Failed to load project details');
      }
    } finally {
      setLoading(false);
    }
  };

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

  const handleToggleSubtask = async (taskId, subtaskId) => {
    try {
      await developerAPI.toggleSubtaskForDeveloper(taskId, subtaskId);
      toast.success('Subtask updated');
      fetchProjectData(); // Refresh data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update subtask';
      toast.error(errorMessage);
    }
  };

  // Check if developer can toggle a specific subtask
  const canToggleSubtask = (task, subtask) => {
    // Handle assignedTo as both array and object
    const assignedToUser = Array.isArray(subtask.assignedTo) 
      ? subtask.assignedTo[0] 
      : subtask.assignedTo;
    
    // Check if assigned to subtask specifically
    if (assignedToUser && assignedToUser._id === currentUserId) {
      return true;
    }
    
    // Check if assigned to parent task (inherited)
    const isAssignedToTask = task.assignedTo.some(
      dev => dev._id === currentUserId
    );
    
    return isAssignedToTask;
  };

  // Filter tasks based on selected filter
  const filteredTasks = filter === 'my-tasks'
    ? tasks.filter(task => {
        // Show task if assigned to task OR any subtask assigned to developer
        const isAssignedToTask = task.assignedTo.some(dev => dev._id === currentUserId);
        const hasMySubtask = task.subtasks.some(st => {
          const assignedToUser = Array.isArray(st.assignedTo) 
            ? st.assignedTo[0] 
            : st.assignedTo;
          return assignedToUser && assignedToUser._id === currentUserId;
        });
        return isAssignedToTask || hasMySubtask;
      })
    : tasks;

  const showLoader = useMinLoader(loading);

  if (showLoader) {
    return <WorkflowLoader message="Loading project details…" />;
  }

  const isReady = !!project;

  const statusColors = {
    'planning': 'bg-purple-100 text-purple-800',
    'active': 'bg-green-100 text-green-800',
    'onHold': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-blue-100 text-blue-800',
    'cancelled': 'bg-red-100 text-red-800'
  };

  const priorityColors = {
    'low': 'bg-green-50 text-green-700 border-green-200',
    'medium': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'high': 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      {/* Header */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          {!isReady ? (
            <ComponentLoader variant="card" rows={3} message="Loading project details…" />
          ) : (<>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{project.name}</h1>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[project.status]}`}>
                    {project.status.toUpperCase()}
                  </span>
                </div>
                <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>{project.description}</p>
                
                <div className="flex items-center space-x-6 mt-4 text-sm">
                  <div className="flex items-center" style={{ color: 'var(--text-secondary)' }}>
                    <Calendar className="w-4 h-4 mr-2" style={{ color: 'var(--text-muted)' }} />
                    {project.startDate && new Date(project.startDate).toLocaleDateString()} - 
                    {project.endDate && ` ${new Date(project.endDate).toLocaleDateString()}`}
                  </div>
                  <div className="flex items-center" style={{ color: 'var(--text-secondary)' }}>
                    <Users className="w-4 h-4 mr-2" style={{ color: 'var(--text-muted)' }} />
                    PM: {project.manager.fullName}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Overall Progress</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{project.progress}%</span>
                  </div>
                  <div className="w-full rounded-full h-3" style={{ background: 'var(--border-muted)' }}>
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/workflow/${id}`)}
                className="ml-6 flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Workflow
              </button>
            </div>
          </>)}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {!isReady ? (
            [0,1,2,3].map(i => (
              <div key={i} className="rounded-lg p-6" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
                <ComponentLoader variant="stat" />
              </div>
            ))
          ) : (<>
            <div className="rounded-lg p-6" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Tasks</p>
              <p className="text-3xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>{stats.totalTasks}</p>
            </div>
            
            <div className="rounded-lg p-6" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>My Tasks</p>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.myTasks}</p>
            </div>
            
            <div className="rounded-lg p-6" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>My Pending</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.myPendingSubtasks}</p>
            </div>
            
            <div className="rounded-lg p-6" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Completed</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.completedSubtasks}/{stats.totalSubtasks}
              </p>
            </div>
          </>)}
        </div>

        {/* Team Members */}
        <div className="rounded-lg p-6 mb-8" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
          {!isReady ? (
            <ComponentLoader variant="table" rows={3} message="Loading team members…" />
          ) : (<>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Team Members</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.team.map(member => {
                const memberUser = member.user || member;
                const userId = memberUser._id || memberUser.id;
                const displayName = memberUser.fullName || memberUser.username || memberUser.email || memberUser.name;
                
                return (
                  <div 
                    key={userId}
                    className="flex items-center p-3 rounded-lg border"
                    style={{
                      borderColor: userId === currentUserId ? 'rgba(99,102,241,0.35)' : 'var(--border)',
                      background: userId === currentUserId ? 'rgba(99,102,241,0.10)' : 'var(--bg-hover)',
                    }}
                  >
                    <div className="mr-3">
                      <Avatar
                        name={displayName}
                        imageUrl={memberUser.avatar}
                        seed={userId || memberUser.email || memberUser.username || displayName}
                        size={40}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {memberUser.fullName || memberUser.name}
                        {userId === currentUserId && (
                          <span className="ml-2 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded">You</span>
                        )}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{memberUser.specialization || 'Developer'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>)}
        </div>

        {/* Tasks Section */}
        <div className="rounded-lg p-6" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
          {!isReady ? (
            <ComponentLoader variant="table" rows={5} message="Loading tasks & subtasks…" />
          ) : (<>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Tasks & Subtasks</h2>
            
            {/* Filter Toggle */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                    : ''
                }`}
                style={filter === 'all' ? undefined : { background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                All Tasks
              </button>
              <button
                onClick={() => setFilter('my-tasks')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'my-tasks'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                    : ''
                }`}
                style={filter === 'my-tasks' ? undefined : { background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                My Tasks Only
              </button>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                <p>
                  {filter === 'my-tasks' 
                    ? 'No tasks assigned to you yet.'
                    : 'No tasks in this project yet.'}
                </p>
              </div>
            ) : (
              filteredTasks.map(task => {
                const isExpanded = expandedTasks.has(task._id);
                const completionPercentage = task.subtasks.length > 0
                  ? Math.round((task.subtasks.filter(st => st.isCompleted).length / task.subtasks.length) * 100)
                  : 0;

                return (
                  <div key={task._id} className="border rounded-lg" style={{ borderColor: 'var(--border)', background: 'transparent' }}>
                    {/* Task Header */}
                    <div className="p-4">
                      <div className="flex items-start">
                        <button
                          onClick={() => toggleTask(task._id)}
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
                          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{task.title}</h3>
                          {task.description && (
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{task.description}</p>
                          )}

                          <div className="flex items-center space-x-3 mt-3 flex-wrap gap-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded border ${
                              priorityColors[task.priority]
                            }`}>
                              {task.priority.toUpperCase()}
                            </span>
                            
                            {task.deadline && (
                              <span className="text-xs flex items-center" style={{ color: 'var(--text-secondary)' }}>
                                <Calendar className="w-3 h-3 mr-1" style={{ color: 'var(--text-muted)' }} />
                                Due: {new Date(task.deadline).toLocaleDateString()}
                              </span>
                            )}
                            
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {task.subtasks.length} subtask{task.subtasks.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {/* Task Assignees */}
                          {task.assignedTo && task.assignedTo.length > 0 && (
                            <div className="mt-3 flex items-center flex-wrap gap-2">
                              <span className="text-xs mr-2" style={{ color: 'var(--text-secondary)' }}>Assigned to:</span>
                              {task.assignedTo.map(dev => {
                                const devId = dev._id || dev.id;
                                
                                return (
                                  <div key={devId} className="flex items-center">
                                    <Avatar
                                      name={dev.fullName || dev.name}
                                      imageUrl={dev.avatar}
                                      seed={devId}
                                      size={28}
                                    />
                                    <span className="text-sm ml-2" style={{ color: 'var(--text-secondary)' }}>
                                      {dev.fullName || dev.name}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Progress Bar */}
                          {task.subtasks.length > 0 && (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                                <span>Progress</span>
                                <span>{completionPercentage}%</span>
                              </div>
                              <div className="w-full rounded-full h-2" style={{ background: 'var(--border-muted)' }}>
                                <div
                                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all"
                                  style={{ width: `${completionPercentage}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Subtasks (Expanded) */}
                    {isExpanded && (
                      <div className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-hover)' }}>
                        {task.subtasks.length === 0 ? (
                          <div className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                            No subtasks yet.
                          </div>
                        ) : (
                          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                            {task.subtasks.map(subtask => {
                              const canToggle = canToggleSubtask(task, subtask);
                              const isMySubtask = canToggle;

                              return (
                                <div 
                                  key={subtask._id}
                                  className={`p-4 flex items-center justify-between ${
                                    isMySubtask ? 'bg-indigo-50' : ''
                                  }`}
                                  style={isMySubtask ? { background: 'rgba(99,102,241,0.10)' } : undefined}
                                >
                                  <div className="flex items-center flex-1">
                                    {/* Checkbox */}
                                    <button
                                      onClick={canToggle ? () => handleToggleSubtask(task._id, subtask._id) : undefined}
                                      className={`mr-3 ${canToggle ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                                      disabled={!canToggle}
                                    >
                                      {subtask.isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                      ) : (
                                        <Circle
                                          className="w-5 h-5"
                                          style={{ color: canToggle ? 'var(--text-muted)' : 'var(--border)' }}
                                        />
                                      )}
                                    </button>

                                    {/* Subtask Title */}
                                    <span
                                      className="flex-1"
                                      style={{
                                        color: subtask.isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                                        textDecoration: subtask.isCompleted ? 'line-through' : 'none',
                                      }}
                                    >
                                      {subtask.title}
                                    </span>

                                    {/* Assigned To */}
                                    {(() => {
                                      const assignedToUser = Array.isArray(subtask.assignedTo) 
                                        ? subtask.assignedTo[0] 
                                        : subtask.assignedTo;
                                      
                                      return assignedToUser && (
                                        <div className="ml-4 flex items-center">
                                          <Avatar
                                            name={assignedToUser.fullName || assignedToUser.name}
                                            imageUrl={assignedToUser.avatar}
                                            seed={assignedToUser._id}
                                            size={24}
                                          />
                                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {assignedToUser.fullName || assignedToUser.name}
                                            {assignedToUser._id === currentUserId && (
                                              <span className="ml-2 text-xs text-indigo-600 font-semibold">(You)</span>
                                            )}
                                          </span>
                                        </div>
                                      );
                                    })()}

                                    {/* Inherited from task */}
                                    {(() => {
                                      const assignedToUser = Array.isArray(subtask.assignedTo) 
                                        ? subtask.assignedTo[0] 
                                        : subtask.assignedTo;
                                      const hasNoAssignment = !assignedToUser;
                                      
                                      return hasNoAssignment && task.assignedTo.length > 0 && (
                                        <span className="ml-4 text-xs italic" style={{ color: 'var(--text-muted)' }}>
                                          Inherited from task
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          </>)}
        </div>
      </div>
    </div>
  );
};

export default DeveloperProjectDashboard;
