import { useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { User, Trash2, Mail, Briefcase } from 'lucide-react'
import Avatar from '../../common/Avatar'

/**
 * Custom Developer Node Component
 * Represents a developer assigned to the project
 */
const DeveloperNode = ({ data, id }) => {
    const [isHovered, setIsHovered] = useState(false)

    // Handle delete (will be passed from parent)
    const handleDelete = () => {
        if (data.onDelete) {
            data.onDelete(id)
        }
    }

    return (
        <div
            className={`
                relative rounded-lg border-2 min-w-[220px] transition-all duration-200
            `}
            style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: isHovered ? 'var(--primary)' : 'var(--border)',
                transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                boxShadow: isHovered ? '0 0 20px rgba(99,102,241,0.25)' : '0 4px 15px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Delete Button (shown on hover) */}
            {isHovered && data.onDelete && (
                <button
                    onClick={handleDelete}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-all duration-200 z-10"
                    title="Remove developer"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}

            {/* Target Handle (left side) - for incoming connections */}
            <Handle
                type="target"
                position={Position.Left}
                id={`${id}-target`}
                className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white"
                style={{ left: -6 }}
            />

            {/* Content */}
            <div className="p-4">
                {/* Avatar and Name */}
                <div className="flex items-center gap-3 mb-3">
                    {/* Avatar */}
                    <div className="relative">
                        <Avatar
                            name={data.label || data.username || data.email}
                            imageUrl={data.avatar}
                            seed={data.userId || data.email || data.username || data.label}
                            size={48}
                            className="border-2 border-indigo-200"
                        />
                        {/* Online Status Indicator */}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                    </div>

                    {/* Name and Role */}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate text-sm" style={{ color: 'var(--text-primary)' }}>
                            {data.label}
                        </h4>
                        <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                            {data.role || 'Developer'}
                        </p>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-1.5">
                    {/* Username */}
                    {data.username && (
                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <User className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
                            <span className="truncate">@{data.username}</span>
                        </div>
                    )}

                    {/* Email */}
                    {data.email && (
                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <Mail className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
                            <span className="truncate">{data.email}</span>
                        </div>
                    )}
                </div>

                {/* Role Badge */}
                <div className="mt-3">
                    <span 
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: 'var(--bg-blue-subtle)', color: '#3b82f6' }}
                    >
                        <Briefcase className="w-3 h-3" />
                        {data.role || 'Developer'}
                    </span>
                </div>
            </div>

            {/* Source Handle (right side) - for outgoing connections if needed */}
            <Handle
                type="source"
                position={Position.Right}
                id={`${id}-source`}
                className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white"
                style={{ right: -6 }}
            />
        </div>
    )
}

export default DeveloperNode
