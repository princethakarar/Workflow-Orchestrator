import { useState, useCallback, useRef, useEffect } from 'react'
import {
    ReactFlow,
    Background,
    Controls as FlowControls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    applyEdgeChanges,
    MarkerType,
    Panel
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import SubtaskNode from './CustomNodes/SubtaskNode'
import SubtaskSidebar from './Sidebar'

import { toast } from 'react-toastify'
import { Loader2, Eye, GitBranch, CheckCircle2, Clock, RotateCcw } from 'lucide-react'
import { workflowAPI } from '../../services/workflowService'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const nodeTypes = { subtaskNode: SubtaskNode }

const getEdgeColor = (status) => {
    switch (status) {
        case 'done': return '#10b981'
        case 'in-progress': return '#3b82f6'
        default: return '#9ca3af'
    }
}

const applyEdgeStyles = (edges, nodes) =>
    edges.map(edge => {
        const src = nodes.find(n => n.id === edge.source)
        const status = src?.data?.status ?? 'todo'
        const color = getEdgeColor(status)
        return {
            ...edge,
            animated: status === 'in-progress',
            selectable: true,
            interactionWidth: 20,   // wide invisible hit-area so edges are easy to click
            style: { stroke: color, strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color }
        }
    })

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * WorkflowEditor — Full subtask dependency graph with RBAC
 * Props:
 *   - projectId       : string
 *   - initialNodes    : ReactFlow node array (with type:'subtaskNode')
 *   - initialEdges    : ReactFlow edge array
 *   - initialSubtasks : available subtasks not on canvas
 *   - canEdit         : boolean
 *   - onSaved         : optional callback after successful save
 */
const WorkflowEditor = ({
    projectId,
    initialNodes = [],
    initialEdges = [],
    initialSubtasks = [],
    canEdit = false,
    onSaved
}) => {
    const reactFlowWrapper = useRef(null)
    const [rfInstance, setRfInstance] = useState(null)
    const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 })

    // Stamp canEdit into every node's data so SubtaskNode remove button knows
    const stampCanEdit = useCallback((nds) =>
        nds.map(n => ({ ...n, data: { ...n.data, canEdit } }))
    , [canEdit])

    const [nodes, setNodes, onNodesChange] = useNodesState(stampCanEdit(initialNodes))
    const [edges, setEdges] = useEdgesState(
        applyEdgeStyles(initialEdges, initialNodes)
    )

    // RBAC-guarded edge change handler — shows toast on edge removal
    const onEdgesChange = useCallback((changes) => {
        if (!canEdit) return
        const removals = changes.filter(c => c.type === 'remove')
        if (removals.length > 0) {
            toast.info(
                removals.length === 1
                    ? 'Dependency removed'
                    : `${removals.length} dependencies removed`
            )
        }
        setEdges(eds => applyEdgeChanges(changes, eds))
    }, [canEdit, setEdges])
    const [availableSubtasks, setAvailableSubtasks] = useState(initialSubtasks)
    const [saving, setSaving] = useState(false)

    // ── Auto-save state ─────────────────────────────────────────────────────
    // 'idle' | 'unsaved' | 'saving' | 'saved' | 'error'
    const [autoSaveStatus, setAutoSaveStatus] = useState('idle')
    const debounceTimer = useRef(null)
    const isMounted = useRef(false)   // skip the very first render

    // ── Auto-save effect ─────────────────────────────────────────────────────

    useEffect(() => {
        // Skip first mount — we don't want to auto-save the initial loaded state
        if (!isMounted.current) {
            isMounted.current = true
            return
        }

        if (!canEdit) return

        setAutoSaveStatus('unsaved')

        // Clear previous timer
        if (debounceTimer.current) clearTimeout(debounceTimer.current)

        debounceTimer.current = setTimeout(async () => {
            setAutoSaveStatus('saving')
            try {
                await workflowAPI.updateWorkflow(projectId, { nodes, edges })
                setAutoSaveStatus('saved')
                onSaved?.()
                // Reset to 'idle' after showing 'saved' for 2.5 s
                setTimeout(() => setAutoSaveStatus('idle'), 2500)
            } catch {
                setAutoSaveStatus('error')
                setTimeout(() => setAutoSaveStatus('unsaved'), 3000)
            }
        }, 2000) // 2-second debounce

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodes, edges])

    // ── Edge handling ───────────────────────────────────────────────────────

    const onConnect = useCallback((params) => {
        if (!canEdit) return
        // Use setNodes functional form to read current nodes without stale closure
        setNodes(currentNodes => {
            setEdges(eds => {
                const newEdge = {
                    ...params,
                    id: `e-${params.source}-${params.target}-${Date.now()}`,
                    type: 'smoothstep'
                }
                const updated = addEdge(newEdge, eds)
                return applyEdgeStyles(updated, currentNodes)
            })
            return currentNodes
        })
    }, [canEdit, setEdges, setNodes])

    // ── Drag-from-sidebar ───────────────────────────────────────────────────

    const onDragOver = useCallback((event) => {
        if (!canEdit) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
    }, [canEdit])

    const onDrop = useCallback((event) => {
        if (!canEdit) return
        event.preventDefault()

        const raw = event.dataTransfer.getData('application/reactflow-subtask')
        if (!raw) return

        let subtask
        try { subtask = JSON.parse(raw) } catch { return }

        if (!rfInstance) return

        const rfBounds = reactFlowWrapper.current.getBoundingClientRect()
        const position = rfInstance.screenToFlowPosition({
            x: event.clientX - rfBounds.left,
            y: event.clientY - rfBounds.top
        })

        const newNode = {
            id: subtask._id,
            type: 'subtaskNode',
            position,
            data: { ...subtask, canEdit }  // inject canEdit so remove button shows
        }

        setNodes(nds => [...nds, newNode])
        setAvailableSubtasks(prev => prev.filter(st => st._id !== subtask._id))
        toast.success(`"${subtask.title}" added to canvas`)
    }, [canEdit, rfInstance, setNodes])

    // ── Node deletion (restores to sidebar) ────────────────────────────────

    const onNodesDelete = useCallback((deleted) => {
        if (!canEdit) return
        const restored = deleted.map(n => n.data)
        setAvailableSubtasks(prev => [...prev, ...restored])
        toast.info(`${deleted.length} subtask${deleted.length > 1 ? 's' : ''} removed from canvas`)
    }, [canEdit])

    // ── Save ────────────────────────────────────────────────────────────────

    const handleSave = async () => {
        if (!canEdit) return
        setSaving(true)
        try {
            await workflowAPI.updateWorkflow(projectId, { nodes, edges })
            toast.success('Workflow saved!')
            onSaved?.()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save workflow')
        } finally {
            setSaving(false)
        }
    }

    // ── Reset (clear entire canvas) ──────────────────────────────────────────

    const handleReset = useCallback(() => {
        if (!canEdit) return

        // Collect subtasks currently on canvas so we can restore them to sidebar
        setNodes(currentNodes => {
            const onCanvasSubtasks = currentNodes.map(n => n.data)
            // Merge with any that were already in sidebar (avoid duplicates by _id)
            setAvailableSubtasks(prev => {
                const existingIds = new Set(prev.map(st => st._id))
                const restored = onCanvasSubtasks.filter(st => !existingIds.has(st._id))
                return [...prev, ...restored]
            })
            return []   // clear all nodes
        })

        setEdges([])    // clear all edges
        toast.info('Canvas cleared')
    }, [canEdit, setNodes, setEdges])

    // ── Mouse Tracking ──────────────────────────────────────────────────────

    const handleMouseMove = useCallback((e) => {
        if (!reactFlowWrapper.current) return
        const rect = reactFlowWrapper.current.getBoundingClientRect()
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        })
    }, [])

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="flex h-full" style={{ backgroundColor: 'var(--bg-page)' }}>
            {/* Sidebar — Admin/PM only */}
            {canEdit && (
                <SubtaskSidebar
                    subtasks={availableSubtasks}
                    onDragStart={(e, st) => {
                        e.dataTransfer.setData('application/reactflow-subtask', JSON.stringify(st))
                        e.dataTransfer.effectAllowed = 'move'
                    }}
                    onRefresh={() => window.location.reload()}
                    onReset={handleReset}
                />
            )}

            {/* Canvas */}
            <div className="flex-1 relative overflow-hidden" ref={reactFlowWrapper} onMouseMove={handleMouseMove}>
                
                {/* Dynamic Cursor Glow */}
                <div 
                    className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
                    style={{
                        background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99,102,241,0.08), transparent 40%)`
                    }}
                />

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setRfInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onNodesDelete={onNodesDelete}
                    nodeTypes={nodeTypes}
                    nodesDraggable={canEdit}
                    nodesConnectable={canEdit}
                    elementsSelectable={canEdit}
                    nodesFocusable={canEdit}
                    edgesFocusable={canEdit}
                    deleteKeyCode={canEdit ? 'Delete' : null}
                    fitView
                    className="z-10 transition-colors"
                >
                    <Background color="var(--primary)" gap={24} size={1} variant="dots" className="opacity-20" />

                    <FlowControls
                        position="bottom-left"
                        className="!m-4 !shadow-md !rounded-xl overflow-hidden !border-0"
                        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        showInteractive={false}
                    />

                    <MiniMap
                        position="bottom-right"
                        className="!m-4 !mb-20 !rounded-xl !shadow-lg !border-0"
                        style={{ width: 160, height: 100, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
                        nodeColor={node => {
                            switch (node.data?.status) {
                                case 'done': return '#10b981'
                                case 'in-progress': return '#3b82f6'
                                default: return '#9ca3af'
                            }
                        }}
                        maskColor="var(--bg-muted)"
                    />

                    {/* Action Panel — Auto-save status only */}
                    {canEdit && (
                        <Panel position="top-right" className="flex items-center gap-2 m-4">
                            {autoSaveStatus === 'unsaved' && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                                    <Clock className="w-3 h-3" />
                                    Unsaved changes
                                </span>
                            )}
                            {autoSaveStatus === 'saving' && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Auto-saving…
                                </span>
                            )}
                            {autoSaveStatus === 'saved' && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Saved
                                </span>
                            )}
                            {autoSaveStatus === 'error' && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-full">
                                    Auto-save failed — retrying…
                                </span>
                            )}
                        </Panel>
                    )}
                </ReactFlow>

                {/* Read-Only Banner */}
                {!canEdit && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-4 py-2 rounded-full shadow-md pointer-events-none">
                        <Eye className="w-3.5 h-3.5" />
                        Read-Only View
                    </div>
                )}

                {/* Empty State */}
                {nodes.length === 0 && canEdit && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center text-gray-400 space-y-2">
                            <GitBranch className="w-12 h-12 mx-auto opacity-20" />
                            <p className="text-base font-semibold">Canvas is empty</p>
                            <p className="text-sm">Drag subtasks from the sidebar to build the dependency graph</p>
                        </div>
                    </div>
                )}

                {nodes.length === 0 && !canEdit && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-12">
                        <div className="text-center text-gray-400 space-y-2">
                            <GitBranch className="w-12 h-12 mx-auto opacity-20" />
                            <p className="text-sm font-medium">No workflow has been created yet</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default WorkflowEditor
