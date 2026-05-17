/**
 * Generate unique node ID
 */
export const generateNodeId = (type, userId = null) => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    return userId ? `${type}-${userId}-${timestamp}-${random}` : `${type}-${timestamp}-${random}`
}

/**
 * Create a project node structure
 */
export const createProjectNode = (projectData, position = { x: 250, y: 100 }) => {
    return {
        id: 'project-node-1',
        type: 'project',
        position,
        data: {
            label: projectData.name || 'Project',
            description: projectData.description || '',
            ...projectData
        },
        draggable: false
    }
}

/**
 * Create a developer node structure
 */
export const createDeveloperNode = (developerData, position) => {
    return {
        id: generateNodeId('dev', developerData._id || developerData.userId),
        type: 'developer',
        position,
        data: {
            userId: developerData._id || developerData.userId,
            label: developerData.fullName || developerData.username || 'Developer',
            role: developerData.role || 'developer',
            avatar: developerData.avatar?.url || developerData.avatar || null,
            username: developerData.username,
            email: developerData.email
        }
    }
}

/**
 * Validate edge connection (only allow project -> developer)
 */
export const validateEdge = (sourceNode, targetNode) => {
    if (!sourceNode || !targetNode) {
        return {
            isValid: false,
            message: 'Source or target node not found'
        }
    }

    // Only allow project -> developer connections
    if (sourceNode.type === 'project' && targetNode.type === 'developer') {
        return { isValid: true }
    }

    return {
        isValid: false,
        message: 'Invalid connection. Only project → developer connections are allowed.'
    }
}

/**
 * Find node by ID in nodes array
 */
export const findNodeById = (nodes, nodeId) => {
    return nodes.find(node => node.id === nodeId)
}

/**
 * Check if edge already exists
 */
export const edgeExists = (edges, source, target) => {
    return edges.some(edge =>
        (edge.source === source && edge.target === target) ||
        (edge.source === target && edge.target === source)
    )
}

/**
 * Create edge connection
 */
export const createEdge = (source, target, type = 'smoothstep') => {
    return {
        id: `edge-${source}-${target}`,
        source,
        target,
        type,
        animated: true,
        style: { stroke: '#818cf8', strokeWidth: 2 }
    }
}

/**
 * Get initial flow position (for dropped nodes)
 */
export const getDropPosition = (event, reactFlowInstance) => {
    if (!reactFlowInstance) {
        return { x: 100, y: 100 }
    }

    const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
    })

    return position
}

/**
 * Validate workflow data
 */
export const validateWorkflow = (nodes, edges) => {
    const errors = []

    // Check for exactly one project node
    const projectNodes = nodes.filter(n => n.type === 'project')
    if (projectNodes.length === 0) {
        errors.push('Workflow must have at least one project node')
    } else if (projectNodes.length > 1) {
        errors.push('Workflow can only have one project node')
    }

    // Check developer nodes have required data
    const developerNodes = nodes.filter(n => n.type === 'developer')
    developerNodes.forEach(node => {
        if (!node.data?.userId) {
            errors.push(`Developer node ${node.id} is missing user ID`)
        }
    })

    return {
        isValid: errors.length === 0,
        errors
    }
}
