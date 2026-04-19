import React, { useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Briefcase } from 'lucide-react'

/**
 * Custom Project Node Component
 * Represents the project in the workflow
 */
const ProjectNode = ({ data }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div 
            className="relative rounded-xl shadow-2xl p-6 min-w-[280px] border-4 transition-all duration-300"
            style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)',
                borderColor: isHovered ? '#818cf8' : '#60a5fa',
                transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                boxShadow: isHovered ? '0 0 25px rgba(99,102,241,0.5)' : '0 10px 25px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header with Icon */}
            <div className="flex items-center gap-3 mb-3">
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                    <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-white truncate">
                        {data.label}
                    </h3>
                    <span className="text-xs text-blue-100 font-medium">
                        Project Node
                    </span>
                </div>
            </div>

            {/* Description */}
            {data.description && (
                <p className="text-sm text-blue-50 mb-3 line-clamp-2">
                    {data.description}
                </p>
            )}

            {/* Status Badge */}
            <div className="flex gap-2">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white font-medium">
                    Main Project
                </span>
            </div>

            {/* Source Handle (right side) - for outgoing connections */}
            <Handle
                type="source"
                position={Position.Right}
                id="project-source"
                className="!w-4 !h-4 !bg-blue-400 !border-2 !border-white"
                style={{ right: -8 }}
            />
        </div>
    )
}

export default ProjectNode
