import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import Avatar from '../common/Avatar';

const DeveloperCard = ({ developer, draggable = false }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: developer._id,
        disabled: !draggable
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    const specializationColors = {
        'Frontend': 'bg-blue-100 text-blue-800',
        'Backend': 'bg-green-100 text-green-800',
        'Full Stack': 'bg-purple-100 text-purple-800',
        'DevOps': 'bg-orange-100 text-orange-800',
        'QA': 'bg-pink-100 text-pink-800',
        'UI/UX': 'bg-indigo-100 text-indigo-800'
    };

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                background: 'var(--bg-hover)',
                borderColor: 'var(--border)',
            }}
            {...(draggable ? listeners : {})}
            {...(draggable ? attributes : {})}
            className={`border rounded-lg p-4 flex items-center space-x-3 ${draggable ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : ''
                } transition-all`}
        >
            <Avatar
                name={developer.fullName || developer.username || developer.email || developer.name}
                imageUrl={
                    developer.avatar ||
                    developer.profilePicture ||
                    developer.profileImage ||
                    developer.photo ||
                    developer.imageUrl ||
                    developer.user?.avatar ||
                    developer.user?.profilePicture ||
                    developer.user?.profileImage ||
                    developer.user?.photo ||
                    developer.user?.imageUrl
                }
                seed={developer._id || developer.id || developer.email || developer.username}
                size={40}
            />
            <div className="flex-1">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{developer.fullName}</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{developer.email}</p>
            </div>
            <span className={`px-2 py-1 text-xs font-semibold rounded ${specializationColors[developer.specialization] || 'bg-gray-100 text-gray-800'
                }`}>
                {developer.specialization}
            </span>
        </div>
    );
};

export default DeveloperCard;
