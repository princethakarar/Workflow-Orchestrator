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

    const getSpecializationStyle = (spec) => {
        switch (spec) {
            case 'Frontend':   return { background: 'var(--bg-blue-subtle)',    color: 'var(--text-blue)' };
            case 'Backend':    return { background: 'var(--bg-emerald-subtle)', color: 'var(--text-emerald)' };
            case 'Full Stack': return { background: 'var(--badge-dev-bg)',      color: 'var(--badge-dev-fg)' };
            case 'DevOps':     return { background: 'var(--bg-amber-subtle)',   color: 'var(--text-amber)' };
            case 'QA':         return { background: 'var(--bg-red-subtle)',     color: 'var(--text-red)' };
            case 'UI/UX':      return { background: 'var(--bg-blue-subtle)',    color: 'var(--text-indigo)' };
            default:           return { background: 'var(--bg-muted)',          color: 'var(--text-secondary)' };
        }
    };

    const specStyle = getSpecializationStyle(developer.specialization);

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                background: 'var(--bg-card)',
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
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{developer.fullName}</p>
                <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{developer.email}</p>
            </div>
            <span 
                className="px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider whitespace-nowrap"
                style={{ background: specStyle.background, color: specStyle.color }}
            >
                {developer.specialization}
            </span>
        </div>
    );
};

export default DeveloperCard;
