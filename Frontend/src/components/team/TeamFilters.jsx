import React from 'react';
import { Search, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { authFormClasses } from '../../utils/authFormStyles';

/**
 * Team filters component for search and role/status filtering
 */
const TeamFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const { isDark } = useTheme();
  const hasActiveFilters = filters.search || filters.role || filters.status;
  const inputClass = `${authFormClasses.inputWithIcon} ${isDark ? authFormClasses.inputDark : authFormClasses.inputLight}`;
  const selectClass = `${authFormClasses.input} ${isDark ? authFormClasses.inputDark : authFormClasses.inputLight}`;
  const cardClass = `${authFormClasses.card} ${isDark ? authFormClasses.cardSurfaceDark : authFormClasses.cardSurfaceLight}`;

  return (
    <div className={`${cardClass} p-4 mb-6`}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="md:col-span-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
              <Search size={18} />
            </div>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              placeholder="Search by name or email..."
              className={inputClass}
            />
          </div>
        </div>

        {/* Role Filter */}
        <div>
          <select
            value={filters.role || ''}
            onChange={(e) => onFilterChange({ role: e.target.value })}
            className={selectClass}
          >
            <option value="">All Roles</option>
            <option value="projectManager">Project Manager</option>
            <option value="developer">Developer</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className={selectClass}
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClearFilters}
            className={`${authFormClasses.secondaryBtn} ${isDark ? authFormClasses.secondaryDark : authFormClasses.secondaryLight} inline-flex items-center gap-2 px-3 py-1.5`}
          >
            <X size={16} />
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default TeamFilters;
