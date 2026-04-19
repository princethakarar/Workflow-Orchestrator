import React from 'react';
import StatusBadge from './StatusBadge';
import { Mail } from 'lucide-react';
import Avatar from '../common/Avatar';
import ComponentLoader from '../common/ComponentLoader';

const ROLE_LABELS = {
  admin: 'Admin',
  projectManager: 'Project Manager',
  developer: 'Developer'
};

/**
 * Desktop table view for team members.
 * Clicking a row opens the unified UserDetailModal.
 */
const TeamTable = ({ team, onRowClick, loading }) => {
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'projectManager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'developer':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSpecializationColor = (specialization) => {
    const colors = {
      'Frontend': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      'Backend': 'bg-green-100 text-green-700 border-green-200',
      'Full Stack': 'bg-purple-100 text-purple-700 border-purple-200',
      'UI/UX': 'bg-pink-100 text-pink-700 border-pink-200',
      'DevOps': 'bg-orange-100 text-orange-700 border-orange-200',
      'Mobile': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'QA': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Project Manager': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[specialization] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div
        className="rounded-lg overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <ComponentLoader variant="table" rows={5} message="Loading team members..." />
      </div>
    );
  }

  if (!team || team.length === 0) {
    return (
      <div
        className="rounded-lg p-12 text-center"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="text-gray-400 text-6xl mb-4">👥</div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No team members yet</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Invite your first team member to get started</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full" style={{ borderTop: `1px solid var(--border)` }}>
          <thead style={{ background: 'var(--bg-muted)' }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Specialization
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Projects
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Joined
              </th>
            </tr>
          </thead>
          <tbody style={{ background: 'var(--bg-card)' }}>
            {team.map((member) => (
              <tr
                key={member._id}
                onClick={() => onRowClick && onRowClick(member)}
                className={`transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                style={{ borderTop: `1px solid var(--border)` }}
                onMouseEnter={(e) => { e.currentTarget.style.background = onRowClick ? 'rgba(99,102,241,0.10)' : 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                title={onRowClick ? 'Click to view details' : undefined}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Avatar
                      name={member.fullName || member.username || member.email}
                      imageUrl={member.avatar}
                      seed={member._id || member.id || member.email}
                      size={40}
                    />
                    <div className="ml-4">
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {member.fullName || member.username}
                      </div>
                      <div className="text-sm flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                        {member.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getSpecializationColor(member.specialization)}`}>
                    {member.specialization || 'Full Stack'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleColor(member.role)}`}>
                    {ROLE_LABELS[member.role] || member.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={member.computedStatus || member.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {member.currentProjects && member.currentProjects.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {member.currentProjects.map((project) => (
                          <span
                            key={project._id}
                            className="inline-flex px-2 py-0.5 rounded text-xs"
                            style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                          >
                            {project.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No projects</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-muted)' }}>
                  {new Date(member.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamTable;
