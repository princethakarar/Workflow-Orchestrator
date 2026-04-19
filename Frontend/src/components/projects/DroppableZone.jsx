import React from 'react';
import { useDroppable } from '@dnd-kit/core';

const DroppableZone = ({ id, children }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: id,
    });

    const style = {
        backgroundColor: isOver ? 'rgba(99, 102, 241, 0.1)' : undefined,
        transition: 'background-color 0.2s ease'
    };

    return (
        <div ref={setNodeRef} style={style} className="rounded-lg">
            {children}
        </div>
    );
};

export default DroppableZone;
