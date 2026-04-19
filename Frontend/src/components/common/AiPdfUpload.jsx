import React, { useState, useEffect } from 'react';
import {
  UploadCloud, FileText, Loader2, CheckCircle2, AlertCircle,
  ChevronDown, ChevronRight, Layers, Cpu, Users, GitMerge, Tag, Zap
} from 'lucide-react';
import api from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';

// ── Priority badge ────────────────────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  const p = (priority || '').toLowerCase();
  const cfg = {
    high: { cls: 'bg-red-100 text-red-700 border-red-200', label: '🔴 High' },
    medium: { cls: 'bg-amber-100 text-amber-700 border-amber-200', label: '🟡 Medium' },
    low: { cls: 'bg-green-100 text-green-700 border-green-200', label: '🟢 Low' },
  };
  const { cls, label } = cfg[p] || { cls: 'bg-gray-100 text-gray-600 border-gray-200', label: priority || '—' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  );
};

// ── Complexity badge ──────────────────────────────────────────────────────────
const ComplexityBadge = ({ complexity }) => {
  const c = (complexity || '').toLowerCase();
  const cfg = {
    high: 'bg-purple-100 text-purple-700',
    medium: 'bg-blue-100 text-blue-700',
    low: 'bg-teal-100 text-teal-700',
  };
  return complexity ? (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg[c] || 'bg-gray-100 text-gray-500'}`}>
      <Zap className="w-3 h-3" />{complexity}
    </span>
  ) : null;
};

// ── Role badge ────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const cfg = {
    Frontend: 'bg-indigo-100 text-indigo-700',
    Backend: 'bg-orange-100 text-orange-700',
    Fullstack: 'bg-cyan-100 text-cyan-700',
    DevOps: 'bg-slate-100 text-slate-700',
  };
  return role ? (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg[role] || 'bg-gray-100 text-gray-500'}`}>
      <Users className="w-3 h-3" />{role}
    </span>
  ) : null;
};

// ── Single Task Card ──────────────────────────────────────────────────────────
const TaskRow = ({ task, index, teamContext }) => {
  const [open, setOpen] = useState(index < 2); // first 2 open by default

  const assignedUser = task.assignedTo && teamContext
    ? teamContext.find(u => u.id === task.assignedTo)
    : null;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 p-4 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <span className="mt-0.5 text-gray-400 flex-shrink-0">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-gray-800 text-sm">{task.task}</span>
            <PriorityBadge priority={task.priority} />
            <ComplexityBadge complexity={task.estimated_complexity} />
            <RoleBadge role={task.suggested_role} />
          </div>
          {task.description && (
            <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>
          )}
        </div>
      </button>

      {/* Expanded body */}
      {open && (
        <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100 space-y-3">
          {/* Subtasks */}
          {Array.isArray(task.subtasks) && task.subtasks.length > 0 && (
            <div className="pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Cpu className="w-3 h-3" /> Subtasks ({task.subtasks.length})
              </p>
              <ul className="space-y-1.5">
                {task.subtasks.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1 w-4 h-4 rounded-full border-2 border-indigo-300 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dependencies */}
          {Array.isArray(task.dependencies) && task.dependencies.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <GitMerge className="w-3 h-3" /> Depends on
              </p>
              <div className="flex flex-wrap gap-1.5">
                {task.dependencies.map((dep, i) => (
                  <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs">
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Assigned user */}
          {assignedUser && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Users className="w-3 h-3 text-gray-400" />
              <span>Assigned to <strong>{assignedUser.name}</strong> ({assignedUser.specialization})</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Module Panel ──────────────────────────────────────────────────────────────
const ModulePanel = ({ mod, teamContext }) => {
  const [open, setOpen] = useState(true);
  const taskCount = mod.tasks?.length || 0;

  return (
    <div className="border border-indigo-200 rounded-xl overflow-hidden shadow-sm">
      {/* Module header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-indigo-50 to-white hover:from-indigo-100 transition-colors text-left"
      >
        <Layers className="w-5 h-5 text-indigo-500 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-bold text-indigo-800 text-base">{mod.name}</span>
            <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-medium">
              {taskCount} task{taskCount !== 1 ? 's' : ''}
            </span>
          </div>
          {mod.module_description && (
            <p className="text-xs text-indigo-500 mt-0.5">{mod.module_description}</p>
          )}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-indigo-400" /> : <ChevronRight className="w-4 h-4 text-indigo-400" />}
      </button>

      {/* Tasks */}
      {open && (
        <div className="p-4 space-y-3 bg-white">
          {Array.isArray(mod.tasks) && mod.tasks.length > 0
            ? mod.tasks.map((task, i) => (
              <TaskRow key={task.task || i} task={task} index={i} teamContext={teamContext} />
            ))
            : <p className="text-sm text-gray-400 italic">No tasks in this module.</p>
          }
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const AiPdfUpload = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [parsedData, setParsedData] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/api/projects');
        setProjects(res.data.data || res.data || []);
      } catch (err) {
        console.error('Failed to fetch projects', err);
      }
    };
    fetchProjects();
  }, []);

  // ── Parse response whenever result changes ─────────────────────────────────
  useEffect(() => {
    if (!result?.ollamaResponse) { setParsedData(null); return; }
    try {
      let text = result.ollamaResponse;
      if (text.includes('```json')) text = text.split('```json')[1].split('```')[0];
      else if (text.includes('```')) text = text.split('```')[1].split('```')[0];
      setParsedData(JSON.parse(text.trim()));
    } catch { setParsedData(null); }
  }, [result]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f && f.type === 'application/pdf') {
      setFile(f); setError(null);
    } else {
      setFile(null); setError('Please select a valid PDF file.');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a PDF file to upload.'); return; }

    setIsLoading(true); setError(null); setResult(null); setSaveSuccess(false);

    const formData = new FormData();
    formData.append('file', file);
    if (prompt) formData.append('prompt', prompt);
    if (selectedProjectId) formData.append('projectId', selectedProjectId);

    try {
      const response = await api.post('/api/ai/process-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Flatten modules → tasks for the bulk save endpoint ────────────────────
  const flattenModulesToTasks = (data) => {
    if (!data?.modules) return [];
    const flat = [];
    let globalIndex = 1;

    for (const mod of data.modules) {
      for (const t of (mod.tasks || [])) {
        flat.push({
          id: globalIndex++,
          title: t.task,
          description: [
            t.description || '',
            mod.name ? `Module: ${mod.name}` : '',
            t.suggested_role ? `Suggested role: ${t.suggested_role}` : '',
            t.estimated_complexity ? `Complexity: ${t.estimated_complexity}` : '',
          ].filter(Boolean).join('\n'),
          priority: (t.priority || 'medium').toLowerCase(),
          assignedTo: t.assignedTo && t.assignedTo !== 'unspecified' ? t.assignedTo : undefined,
          // subtasks: map string steps → { title } objects the schema understands
          subtasks: Array.isArray(t.subtasks)
            ? t.subtasks.map(s => ({ title: s }))
            : [],
          // dependencies resolved by name → numeric id in bulkCreateTasks on backend
          dependencies: Array.isArray(t.dependencies) ? t.dependencies : [],
        });
      }
    }
    return flat;
  };

  const handleSaveAll = async () => {
    if (!selectedProjectId) {
      setError("Please select a project from the dropdown before saving.");
      return;
    }

    setIsSaving(true); setError(null); setSaveSuccess(false);

    try {
      const data = parsedData;
      if (!data) throw new Error('Could not parse the AI response. Please try again.');

      let targetProjectId = selectedProjectId;

      // Create new project if requested
      if (selectedProjectId === 'create_new') {
        let userId = user?.id || user?._id;
        if (!userId && user?.user) userId = user.user.id || user.user._id;
        if (!userId) {
          const stored = localStorage.getItem('user');
          if (stored) { const p = JSON.parse(stored); userId = p._id || p.id; }
        }
        if (!userId) throw new Error('Could not resolve your user ID. Please log out and back in.');

        const newProjectRes = await api.post('/api/projects', {
          name: data.project_name || 'AI Generated Project',
          description: data.project_summary || 'Generated from PDF documentation',
          managerId: userId,
        });
        const newProject = newProjectRes.data.data || newProjectRes.data;
        targetProjectId = newProject._id || newProject.id;
        setProjects(prev => [newProject, ...prev]);
        setSelectedProjectId(targetProjectId);
      }

      const tasks = flattenModulesToTasks(data);
      if (tasks.length === 0) throw new Error('No tasks found in the AI response.');

      await api.post(`/api/projects/${targetProjectId}/tasks/bulk`, { tasks });

      setSaveSuccess(true);
      setResult(null);
      setParsedData(null);
      setFile(null);
      setPrompt('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save tasks.');
    } finally {
      setIsSaving(false);
    }
  };

  // Count total tasks across modules
  const totalTaskCount = parsedData?.modules?.reduce((acc, m) => acc + (m.tasks?.length || 0), 0) || 0;
  const moduleCount = parsedData?.modules?.length || 0;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Analyze PDF with AI</h2>
        <p className="text-gray-500 mt-2">Upload a document — the AI will plan modules, tasks, subtasks & dependencies.</p>
      </div>

      <form onSubmit={handleUpload} className="space-y-6">
        {/* File Upload */}
        <div className="border-2 border-dashed border-indigo-200 rounded-lg p-8 bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 relative">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
            {file ? (
              <>
                <FileText className="w-12 h-12 text-indigo-600" />
                <span className="text-indigo-900 font-medium">{file.name}</span>
                <span className="text-xs text-indigo-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-12 h-12 text-indigo-400" />
                <span className="text-indigo-600 font-medium">Click to upload or drag and drop</span>
                <span className="text-xs text-indigo-400">PDF up to 10MB</span>
              </>
            )}
          </div>
        </div>

        {/* Project Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Project Context (For Team Assignment)</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
          >
            <option value="">-- No specific team context --</option>
            <option value="create_new" className="font-semibold text-green-600">✨ Create New Project from Document</option>
            {projects.map((proj) => (
              <option key={proj._id || proj.id} value={proj._id || proj.id}>{proj.name}</option>
            ))}
          </select>
        </div>

        {/* Custom Prompt */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Focus Prompt (Optional)</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Focus on backend API tasks, ignore UI details..."
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none min-h-[80px] resize-y"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !file}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex justify-center items-center space-x-2 disabled:bg-indigo-300 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing Document…</span>
            </>
          ) : (
            <span>Generate Execution Plan</span>
          )}
        </button>
      </form>

      {/* Save success */}
      {saveSuccess && (
        <div className="mt-6 flex items-center space-x-3 bg-green-50 text-green-700 border border-green-200 rounded-lg p-4">
          <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
          <div>
            <p className="font-semibold">Tasks saved successfully!</p>
            <p className="text-sm text-green-600">All modules and tasks have been added to the project.</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && parsedData && (
        <div className="mt-8 pt-6 border-t border-gray-100 space-y-6">
          {/* Summary bar */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-bold text-gray-800">Execution Plan Ready</h3>
              </div>
              {parsedData.project_name && (
                <h4 className="text-base font-semibold text-indigo-700 mt-1">{parsedData.project_name}</h4>
              )}
              {parsedData.project_summary && (
                <p className="text-sm text-gray-500 mt-1 max-w-xl">{parsedData.project_summary}</p>
              )}
            </div>
            <div className="flex gap-3">
              <div className="text-center px-4 py-2 bg-indigo-50 rounded-lg">
                <p className="text-2xl font-bold text-indigo-700">{moduleCount}</p>
                <p className="text-xs text-indigo-500">Modules</p>
              </div>
              <div className="text-center px-4 py-2 bg-indigo-50 rounded-lg">
                <p className="text-2xl font-bold text-indigo-700">{totalTaskCount}</p>
                <p className="text-xs text-indigo-500">Tasks</p>
              </div>
            </div>
          </div>

          {/* RAG meta */}
          {result.ragMeta && (
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">
              <Tag className="w-3 h-3" />
              RAG: retrieved {result.ragMeta.retrievedChunks} of {result.ragMeta.totalChunks} chunks
              {result.ragMeta.query && <> · query: <em>"{result.ragMeta.query.slice(0, 60)}"</em></>}
            </div>
          )}

          {/* Modules */}
          {Array.isArray(parsedData.modules) && parsedData.modules.length > 0 ? (
            <div className="space-y-4">
              {parsedData.modules.map((mod, i) => (
                <ModulePanel key={mod.name || i} mod={mod} teamContext={result.teamContext} />
              ))}
            </div>
          ) : (
            /* Fallback: raw text */
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 max-h-[400px] overflow-y-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">{result.ollamaResponse}</pre>
            </div>
          )}

          {/* Save button */}
          <div className="flex justify-between items-center border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-400">
              {totalTaskCount} tasks across {moduleCount} modules will be saved
            </p>
            <button
              onClick={handleSaveAll}
              disabled={isSaving || !selectedProjectId}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors flex items-center space-x-2 disabled:bg-green-300 disabled:cursor-not-allowed"
              title={!selectedProjectId ? 'Select a project first' : ''}
            >
              {isSaving ? (
                <><Loader2 className="w-5 h-5 animate-spin" /><span>Saving…</span></>
              ) : (
                <><CheckCircle2 className="w-5 h-5" /><span>Save to Project</span></>
              )}
            </button>
          </div>

          {/* Text snippet */}
          <details className="text-sm text-gray-400 cursor-pointer">
            <summary className="hover:text-gray-600 transition-colors">View extracted text snippet</summary>
            <div className="mt-2 p-4 bg-gray-100 rounded border border-gray-200 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
              {result.extractedTextSnippet}
            </div>
          </details>
        </div>
      )}

      {/* Fallback when response exists but couldn't be parsed as modules */}
      {result && !parsedData && result.ollamaResponse && (
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <p className="text-sm font-medium text-gray-700">Received raw response (could not parse as modules)</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 max-h-[400px] overflow-y-auto">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">{result.ollamaResponse}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiPdfUpload;
