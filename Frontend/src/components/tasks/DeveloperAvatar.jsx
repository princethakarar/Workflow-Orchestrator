import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { getAvatarColor, getInitials } from '../../utils/avatarUtils';
import Avatar from '../common/Avatar';

const DeveloperAvatar = ({ developer, draggable = false, size = 'md' }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: developer._id,
        data: { developer },
        disabled: !draggable
    });

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base'
    };

    const userId = developer._id || developer.id;
    const fullName = developer.fullName || developer.name || developer.username;
    const initials = getInitials(fullName);

    return (
        <div
            ref={draggable ? setNodeRef : null}
            {...(draggable ? listeners : {})}
            {...(draggable ? attributes : {})}
            className={`
                inline-flex items-center gap-2 px-3 py-1.5 border
                rounded-full shadow-sm hover:shadow-md transition-all
                ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}
                ${isDragging ? 'opacity-50 scale-95' : ''}
            `}
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            title={fullName}
        >
            <Avatar
                name={fullName}
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
                seed={userId || developer.email || developer.username || fullName}
                size={size === 'sm' ? 32 : size === 'lg' ? 48 : 40}
            />
            {size !== 'sm' && (
                <div className="text-sm">
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {fullName}
                    </div>
                    {developer.specialization && (
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {developer.specialization}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DeveloperAvatar;
