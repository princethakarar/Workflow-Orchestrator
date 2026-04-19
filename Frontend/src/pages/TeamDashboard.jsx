import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Users } from 'lucide-react';
import { useTeam } from '../hooks/useTeam';
import { useAuth } from '../context/AuthContext';
import TeamTable from '../components/team/TeamTable';
import TeamFilters from '../components/team/TeamFilters';
import InviteMemberModal from '../components/team/InviteMemberModal';
import UserDetailModal from '../components/team/UserDetailModal';
import WorkflowLoader from '../components/common/WorkflowLoader';
import useMinLoader from '../hooks/useMinLoader';

// Match Projects page font stack
const F = "'Inter', 'Plus Jakarta Sans', sans-serif";

const TeamDashboard = () => {
  const { team, loading, pagination, fetchTeam, inviteMember, resendInvite } = useTeam();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState({ isOpen: false, member: null });
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    page: 1
  });

  // Fetch team on mount and when filters change
  useEffect(() => {
    fetchTeam(filters);
  }, [fetchTeam, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({ search: '', role: '', status: '', page: 1 });
  };

  const handleInvite = async (data) => {
    await inviteMember(data);
  };

  const handleResendInvite = async (id) => {
    await resendInvite(id);
  };

  // Open the unified detail/edit popup
  const handleRowClick = (member) => {
    setDetailModal({ isOpen: true, member });
  };

  // Called after a successful edit or delete inside UserDetailModal
  const handleDetailSuccess = () => {
    fetchTeam(filters);
  };

  const handleDetailClose = () => {
    setDetailModal({ isOpen: false, member: null });
  };

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  const showLoader = useMinLoader(loading);

  // Show full-page loader only on initial mount
  if (showLoader) {
    return <WorkflowLoader message="Loading team members…" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pb-8" style={{ fontFamily: F }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}
      >
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
          Team Management
        </h1>
        {isAdmin && (
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
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
              transition: 'transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.02)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </motion.button>
        )}
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6" style={{ marginBottom: '20px' }}>
        {[
          {
            title: 'Total Members',
            value: (pagination.totalCount || team.length),
            accent: '#6366f1',
            icon: <Users className="w-5 h-5" />,
          },
          {
            title: 'Available',
            value: team.filter(m => m.computedStatus === 'available').length,
            accent: '#22c55e',
            icon: <span style={{ fontSize: 18, lineHeight: 1 }}>🟢</span>,
          },
          {
            title: 'Occupied',
            value: team.filter(m => m.computedStatus === 'occupied').length,
            accent: '#ef4444',
            icon: <span style={{ fontSize: 18, lineHeight: 1 }}>🔴</span>,
          },
          {
            title: 'Pending Invites',
            value: team.filter(m => m.computedStatus === 'inactive' && !m.isEmailVerified).length,
            accent: '#f59e0b',
            icon: <span style={{ fontSize: 18, lineHeight: 1 }}>🟡</span>,
          },
        ].map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut', delay: 0.05 + idx * 0.04 }}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
              borderRadius: '16px',
              padding: '18px 18px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              minHeight: '84px',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                {card.title}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {card.value}
              </p>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `${card.accent}22`,
                border: `1px solid ${card.accent}33`,
                color: card.accent,
                flexShrink: 0,
              }}
            >
              {card.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut', delay: 0.18 }}
      >
        <TeamFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      </motion.div>

      {/* Team Table — rows are clickable */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut', delay: 0.22 }}
      >
        <TeamTable
          team={team}
          loading={loading}
          onRowClick={handleRowClick}
        />
      </motion.div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.28, ease: 'easeOut', delay: 0.26 }}
          className="mt-6 flex items-center justify-center gap-2"
        >
          <button
            onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={filters.page === 1}
            className="px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}
          >
            Previous
          </button>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
            disabled={filters.page === pagination.totalPages}
            className="px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}
          >
            Next
          </button>
        </motion.div>
      )}

      {/* Invite Modal */}
      <InviteMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onInvite={handleInvite}
      />

      {/* Unified User Detail Modal (view + edit + delete trigger) */}
      <UserDetailModal
        isOpen={detailModal.isOpen}
        onClose={handleDetailClose}
        member={detailModal.member}
        onSuccess={handleDetailSuccess}
        isAdmin={isAdmin}
        onResendInvite={handleResendInvite}
      />

    </div>
  );
};

export default TeamDashboard;
