import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Folder, Users, CheckSquare, TrendingUp, BarChart2 } from 'lucide-react';
import {
    AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { toast } from 'react-toastify';
import { analyticsAPI } from '../services/analyticsService';
import AvatarComponent from '../components/common/Avatar';
import WorkflowLoader from '../components/common/WorkflowLoader';
import useMinLoader from '../hooks/useMinLoader';
import ComponentLoader from '../components/common/ComponentLoader';

// ─── Constants ──────────────────────────────────────────────────────────────────
const F = "'Inter', 'Plus Jakarta Sans', sans-serif";
const AUTO_REFRESH_MS = 30_000;

// ─── Helpers ────────────────────────────────────────────────────────────────────
const timeAgo = (d) => {
    if (!d) return '—';
    const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    if (h < 1) return 'Just now';
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    return days === 1 ? '1 day ago' : `${days} days ago`;
};
const getInitials = (name) => {
    if (!name) return '?';
    const p = name.trim().split(' ');
    return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
};
const PALETTE = ['#6366f1','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#14b8a6','#f97316','#84cc16'];
const hue = (s) => { let h = 0; for (let i = 0; i < (s||'').length; i++) h = (s.charCodeAt(i)+((h<<5)-h)); return PALETTE[Math.abs(h)%PALETTE.length]; };

// Ordinal suffix: 1→"1st", 13→"13th"
const ordinal = (n) => {
    const s = ['th','st','nd','rd'], v = n % 100;
    return n + (s[(v-20)%10] || s[v] || s[0]);
};
// Format ISO date string → "13th March"
const monthLabel = (isoDate) => {
    const d = new Date(isoDate + 'T00:00:00');
    return `${ordinal(d.getDate())} ${d.toLocaleDateString('en-US', { month:'long' })}`;
};

// ─── Sparkline SVG ───────────────────────────────────────────────────────────────
const Spark = ({ data = [], color }) => {
    if (data.length < 2) return null;
    const W=80, H=30, max=Math.max(...data,1);
    const pts = data.map((v,i) => [(i/(data.length-1))*W, H-(v/max)*(H-6)-3]);
    const d = pts.map((p,i) => `${i===0?'M':'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const id = `spk${color.replace('#','')}`;
    return (
        <svg width={W} height={H} style={{ overflow:'visible', display:'block' }}>
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.28"/>
                    <stop offset="100%" stopColor={color} stopOpacity="0"/>
                </linearGradient>
            </defs>
            <path d={`${d} L${W},${H} L0,${H}Z`} fill={`url(#${id})`}/>
            <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
};

// ─── Stat Card ── uses CSS custom properties ─────────────────────────────────────
const StatCard = ({ icon: Icon, title, value, secondary, iconColor, iconBg, sparkData }) => (
    <motion.div
        whileHover={{ y:-4 }}
        transition={{ type:'spring', stiffness:300, damping:20 }}
        style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '22px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
            cursor: 'default',
            display: 'flex',
            flexDirection: 'column',
        }}
    >
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'14px' }}>
            <div style={{ width:42, height:42, borderRadius:'12px', background:iconBg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={19} style={{ color:iconColor }}/>
            </div>
            <Spark data={sparkData} color={iconColor}/>
        </div>
        <p style={{ fontFamily:F, fontSize:'30px', fontWeight:800, color:'var(--text-primary)', margin:0, letterSpacing:'-0.02em', lineHeight:1 }}>{value}</p>
        <p style={{ fontFamily:F, fontSize:'13px', fontWeight:600, color:'var(--text-secondary)', margin:'5px 0 0 0' }}>{title}</p>
        {secondary && <p style={{ fontFamily:F, fontSize:'11.5px', color:'var(--text-muted)', margin:'10px 0 0 0' }}>{secondary}</p>}
    </motion.div>
);

// ─── Card / CardHead ─────────────────────────────────────────────────────────────
const Card = ({ children, style={} }) => (
    <div style={{ background:'var(--bg-card)', borderRadius:'16px', border:'1px solid var(--border)', boxShadow:'var(--shadow-card)', overflow:'hidden', ...style }}>
        {children}
    </div>
);
const CardHead = ({ title, subtitle, action }) => (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'20px 24px 0' }}>
        <div>
            <h3 style={{ fontFamily:F, fontWeight:700, fontSize:'15px', color:'var(--text-primary)', margin:0 }}>{title}</h3>
            {subtitle && <p style={{ fontFamily:F, fontSize:'12px', color:'var(--text-muted)', margin:'4px 0 0 0' }}>{subtitle}</p>}
        </div>
        {action}
    </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const isDone = status === 'completed';
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap',
            fontFamily: F, fontSize: '11.5px', fontWeight: 600,
            background: isDone ? 'var(--badge-done-bg)' : 'var(--badge-dev-bg)',
            color: isDone ? 'var(--badge-done-fg)' : 'var(--badge-dev-fg)',
        }}>
            <span style={{ width:6, height:6, borderRadius:'50%', flexShrink:0,
                background: isDone ? 'var(--badge-done-dot)' : 'var(--badge-dev-dot)' }}/>
            {isDone ? 'Completed' : (status || 'Development')}
        </span>
    );
};

// ─── Avatar ──────────────────────────────────────────────────────────────────────
const Avatar = ({ name, avatar, size=28, xStyle={} }) => (
    <AvatarComponent
        name={name}
        imageUrl={avatar}
        seed={name}
        size={size}
        style={{ border:'2px solid var(--bg-card)', flexShrink:0, ...xStyle }}
    />
);

const TeamAvatars = ({ members=[], size=26 }) => {
    const show = members.slice(0,3), extra = members.length-3;
    return (
        <div style={{ display:'flex', alignItems:'center' }}>
            {show.map((m,i) => (
                <div key={m._id||i} style={{ marginLeft:i===0?0:-(size*0.28), zIndex:3-i, flexShrink:0 }}>
                    <AvatarComponent
                        name={m.fullName}
                        imageUrl={m.avatar}
                        seed={m._id?.toString() || m.fullName}
                        size={size}
                        style={{ border:'2px solid var(--bg-card)' }}
                    />
                </div>
            ))}
            {extra>0 && (
                <div style={{ width:size, height:size, borderRadius:'50%', background:'var(--bg-muted)', border:'2px solid var(--bg-card)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.36, fontWeight:700, color:'var(--text-secondary)', fontFamily:F, marginLeft:-(size*0.28) }}>
                    +{extra}
                </div>
            )}
        </div>
    );
};



// ─── Activity Tooltip ─────────────────────────────────────────────────────────────
const ActivityTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const entry = payload[0]?.payload;
    return (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'10px', padding:'9px 13px', boxShadow:'0 8px 24px rgba(0,0,0,0.25)' }}>
            <p style={{ fontFamily:F, color:'var(--text-muted)', fontSize:'11px', margin:'0 0 3px 0' }}>
                {entry?.label || entry?.name || ''}
            </p>
            <p style={{ fontFamily:F, color:'var(--text-primary)', fontSize:'13px', fontWeight:600, margin:0 }}>
                Completed Tasks: {payload[0]?.value}
            </p>
        </div>
    );
};

const PerformerList = ({ performers = [], barColors }) => {
    const medals = ['🥇','🥈','🥉'];
    if (!performers.length) return (
        <p style={{ color:'var(--text-muted)', textAlign:'center', padding:'24px 0', fontFamily:F, fontSize:'13px' }}>No data yet</p>
    );
    const maxVal = performers[0]?.completedSubtasks || 1;
    return (
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            {performers.slice(0,5).map((p, i) => {
                const pct = Math.round((p.completedSubtasks/maxVal)*100);
                return (
                    <div key={p._id} style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                        {i < 3 ? (
                            <div style={{ width:36, height:36, borderRadius:'50%', background:hue(p.name+i), display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:700, color:'#fff', fontFamily:F, flexShrink:0, border:'2px solid var(--border)' }}>
                                {medals[i]}
                            </div>
                        ) : (
                            <AvatarComponent
                                name={p.name}
                                imageUrl={p.avatar}
                                seed={p._id?.toString() || p.name}
                                size={36}
                            />
                        )}
                        <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'5px' }}>
                                <span style={{ fontFamily:F, fontSize:'13px', fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</span>
                                <span style={{ fontFamily:F, fontSize:'12px', fontWeight:700, color:'#6366f1', marginLeft:'8px', flexShrink:0 }}>
                                    {p.completedSubtasks} {p.completedSubtasks===1?'task':'tasks'}
                                </span>
                            </div>
                            <div style={{ height:'5px', background:'var(--bg-muted)', borderRadius:'6px', overflow:'hidden' }}>
                                <motion.div
                                    initial={{ width:0 }}
                                    animate={{ width:`${pct}%` }}
                                    transition={{ duration:0.8, delay:i*0.09, ease:'easeOut' }}
                                    style={{ height:'100%', borderRadius:'6px', background:barColors[i]||barColors[0] }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const DEV_BARS  = ['linear-gradient(90deg,#6366f1,#8b5cf6)','linear-gradient(90deg,#10b981,#34d399)','linear-gradient(90deg,#f59e0b,#fbbf24)','linear-gradient(90deg,#06b6d4,#67e8f9)','linear-gradient(90deg,#ec4899,#f9a8d4)'];
const MGR_BARS  = ['linear-gradient(90deg,#f59e0b,#fbbf24)','linear-gradient(90deg,#6366f1,#8b5cf6)','linear-gradient(90deg,#10b981,#34d399)','linear-gradient(90deg,#ec4899,#f9a8d4)','linear-gradient(90deg,#06b6d4,#67e8f9)'];

// ══════════════════════════════════════════════════════════════
//  ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════
const AdminDashboard = () => {
    const [data, setData]           = useState(null);
    const [loading, setLoading]     = useState(true);
    const [chartMode, setChartMode] = useState('weekly');

    const fetchData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await analyticsAPI.getAdminAnalytics();
            setData(res.data.data);
        } catch (err) {
            console.error(err);
            if (!silent) toast.error('Failed to load admin analytics');
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(false);
        const timer = setInterval(() => fetchData(true), AUTO_REFRESH_MS);
        return () => clearInterval(timer);
    }, [fetchData]);

    const showLoader = useMinLoader(loading);

    if (showLoader) return <WorkflowLoader message="Loading system overview…" />;

    const isReady = !!data;
    const {
        stats               = {},
        projects            = [],
        developerPerformance = [],
        managerPerformance   = [],
        recentActivity       = [],
        completionActivity   = [],
    } = data || {};

    // ── Subtask-based counts ──────────────────────────────────────────────────
    const totalSubtasks     = stats.totalSubtasks || 0;
    const completedSubtasks = stats.completedSubtasks || 0;
    const activeSubtasks    = totalSubtasks - completedSubtasks;
    const completionRate    = totalSubtasks > 0 ? Math.round((completedSubtasks/totalSubtasks)*100) : 0;

    const devProjects  = stats.developmentProjects ?? 0;
    const doneProjects = stats.completedProjectsComputed ?? 0;
    const totalP       = stats.totalProjects || 0;
    const donutPct     = totalP > 0 ? Math.round((doneProjects/totalP)*100) : 0;
    const totalMembers = (stats.totalDevelopers || 0) + (stats.totalManagers || 0);

    // ── Sparklines ────────────────────────────────────────────────────────────
    const last7completed = completionActivity.slice(-7).map(d => d.completed);
    const activeTrend    = last7completed.map((v, i) => Math.max(0, activeSubtasks + v*(6-i)*0.1));
    const baseCompleted  = completedSubtasks - last7completed.reduce((s,x)=>s+x,0);
    const rateTrend      = last7completed.map((_, i) => totalSubtasks > 0 ? Math.round(((baseCompleted + last7completed.slice(0,i+1).reduce((s,x)=>s+x,0))/totalSubtasks)*100) : 0);
    const projectTrend   = last7completed;
    const teamTrend      = Array(7).fill(totalMembers);

    // ── Chart data ────────────────────────────────────────────────────────────
    const weeklyChartData  = completionActivity.slice(-7).map(d => ({ name:d.day, label:d.day, fullDate:d.fullDate, Tasks:d.completed }));
    const monthlyChartData = completionActivity.map(d => ({ name:String(d.dayNum), label:monthLabel(d.date), fullDate:d.fullDate, Tasks:d.completed }));
    const chartData = chartMode === 'weekly' ? weeklyChartData : monthlyChartData;

    // ── Donut ─────────────────────────────────────────────────────────────────
    const donutData = [
        { name:'Completed',   value: doneProjects || 0, color:'#6366f1' },
        { name:'Development', value: (totalP-doneProjects) || 0, color:'var(--bg-muted)' },
    ].filter(d => d.value > 0);
    if (!donutData.length) donutData.push({ name:'No Data', value:1, color:'var(--bg-muted)' });

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:'24px', paddingBottom:'32px', fontFamily:F }}>

            {/* Header */}
            <div>
                <h1 style={{ fontFamily:F, fontSize:'24px', fontWeight:800, color:'var(--text-primary)', margin:0, letterSpacing:'-0.02em' }}>
                    System Overview
                </h1>
            </div>

            {/* Metric Cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(210px,1fr))', gap:'20px' }}>
                {!isReady ? (
                    [0,1,2,3].map(i => (
                        <div key={i} style={{ background:'var(--bg-card)', borderRadius:'16px', padding:'22px', border:'1px solid var(--border)', boxShadow:'var(--shadow-card)' }}>
                            <ComponentLoader variant="stat" />
                        </div>
                    ))
                ) : (<>
                    <StatCard icon={Folder}     title="Active Projects"   value={devProjects}          secondary={`Total Projects: ${totalP}`}                             iconColor="#6366f1" iconBg="rgba(99,102,241,0.1)"  sparkData={projectTrend}/>
                    <StatCard icon={Users}      title="Team Members"      value={totalMembers}         secondary={`${stats.totalDevelopers} developers · ${stats.totalManagers} managers`} iconColor="#10b981" iconBg="rgba(16,185,129,0.1)"  sparkData={teamTrend}/>
                    <StatCard icon={CheckSquare} title="Active Tasks"     value={activeSubtasks}       secondary={`Total Tasks: ${totalSubtasks}`}                         iconColor="#8b5cf6" iconBg="rgba(139,92,246,0.1)" sparkData={activeTrend}/>
                    <StatCard icon={TrendingUp}  title="Completion Rate"  value={`${completionRate}%`} secondary={`Completed Tasks: ${completedSubtasks} / ${totalSubtasks}`} iconColor="#f59e0b" iconBg="rgba(245,158,11,0.1)" sparkData={rateTrend}/>
                </>)}
            </div>

            {/* Charts */}
            <div className="charts-grid">

                {/* Task Completion Activity */}
                <Card>
                    {!isReady ? (
                        <ComponentLoader variant="chart" height="300px" />
                    ) : (<>
                        <CardHead
                            title="Task Completion Activity"
                            subtitle="Subtasks completed per day"
                            action={
                                <div style={{ display:'flex', gap:'4px' }}>
                                    {['weekly','monthly'].map(m => (
                                        <button key={m} onClick={()=>setChartMode(m)} style={{
                                            padding:'4px 12px', borderRadius:'8px', border:'none', cursor:'pointer',
                                            fontFamily:F, fontSize:'12px', fontWeight:600,
                                            background: chartMode===m ? '#6366f1' : 'var(--bg-muted)',
                                            color: chartMode===m ? '#fff' : 'var(--text-secondary)',
                                            transition:'all 0.15s ease',
                                        }}>
                                            {m.charAt(0).toUpperCase()+m.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            }
                        />
                        <div style={{ padding:'8px 24px 20px' }}>
                            {chartData.every(d=>d.Tasks===0) ? (
                                <div style={{ height:240, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontFamily:F, fontSize:'13px' }}>
                                    No completed tasks in this period
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <AreaChart data={chartData} margin={{ top:8, right:8, bottom:0, left:-20 }}>
                                        <defs>
                                            <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false}/>
                                        <XAxis dataKey="name" tick={{ fontSize:chartMode==='monthly'?10:11, fill:'var(--chart-text)', fontFamily:F }} axisLine={false} tickLine={false} interval={chartMode==='monthly'?4:0}/>
                                        <YAxis tick={{ fontSize:11, fill:'var(--chart-text)', fontFamily:F }} axisLine={false} tickLine={false} allowDecimals={false}/>
                                        <Tooltip content={<ActivityTooltip/>}/>
                                        <Area type="monotone" dataKey="Tasks" stroke="#6366f1" strokeWidth={2.5} fill="url(#actGrad)" dot={false} activeDot={{ r:5, fill:'#6366f1', stroke:'var(--bg-card)', strokeWidth:2 }}/>
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </>)}
                </Card>

                {/* Project Completion Donut */}
                <Card>
                    {!isReady ? (
                        <ComponentLoader variant="chart" height="300px" />
                    ) : (<>
                        <CardHead title="Project Completion" subtitle="Completed vs Development"/>
                        <div style={{ padding:'16px 24px 20px', display:'flex', flexDirection:'column', alignItems:'center' }}>
                            <div style={{ position:'relative', width:'190px', height:'190px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={donutData.length>1?3:0} dataKey="value" strokeWidth={0} startAngle={90} endAngle={-270}>
                                            {donutData.map((e,i) => <Cell key={i} fill={i===0?'#6366f1':'var(--bg-muted)'}/>)}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center' }}>
                                    <p style={{ fontFamily:F, fontSize:'26px', fontWeight:800, color:'var(--text-primary)', margin:0, lineHeight:1 }}>{donutPct}%</p>
                                    <p style={{ fontFamily:F, fontSize:'9.5px', fontWeight:600, color:'var(--text-muted)', margin:'4px 0 0 0', letterSpacing:'0.06em', textTransform:'uppercase' }}>Project Completion</p>
                                </div>
                            </div>
                            <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:'8px', marginTop:'12px' }}>
                                {[{ label:'Completed Projects', color:'#6366f1', pct:donutPct },
                                  { label:'Development Projects', color:'var(--bg-muted)', pct:100-donutPct },
                                ].map(({ label, color, pct }) => (
                                    <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                            <div style={{ width:10, height:10, borderRadius:'50%', background:color, border: color==='var(--bg-muted)' ? '1px solid var(--border)' : 'none' }}/>
                                            <span style={{ fontFamily:F, fontSize:'12.5px', color:'var(--text-label)' }}>{label}</span>
                                        </div>
                                        <span style={{ fontFamily:F, fontSize:'13px', fontWeight:700, color:'var(--text-primary)' }}>{pct}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>)}
                </Card>
            </div>

            {/* All Projects Table */}
            <Card>
                {!isReady ? (
                    <ComponentLoader variant="table" rows={4} message="Loading projects…" />
                ) : (<>
                    <CardHead title="All Projects" subtitle="Subtask-based status and progress"/>
                    <div style={{ overflowX:'auto', paddingTop:'16px' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:F }}>
                            <thead>
                                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                                    {['Project','Manager','Status','Progress','Team'].map(h => (
                                        <th key={h} style={{ padding:'10px 24px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                        </table>
                        <div style={{ maxHeight:'224px', overflowY:'auto' }}>
                            <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:F }}>
                                <tbody>
                                    {projects.length === 0 && (
                                        <tr><td colSpan={5} style={{ padding:'32px 24px', textAlign:'center', color:'var(--text-muted)', fontFamily:F }}>No projects yet</td></tr>
                                    )}
                                    {projects.map((p, idx) => (
                                        <tr key={p._id}
                                            style={{ borderBottom:idx<projects.length-1?`1px solid var(--border-muted)`:'none', transition:'background 0.15s' }}
                                            onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
                                            onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                                        >
                                            <td style={{ padding:'13px 24px' }}>
                                                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                                                    <div style={{ width:30, height:30, borderRadius:'8px', background:'rgba(99,102,241,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                                        <Folder size={14} style={{ color:'#6366f1' }}/>
                                                    </div>
                                                    <span style={{ fontFamily:F, fontWeight:600, fontSize:'13.5px', color:'var(--text-primary)' }}>{p.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding:'13px 24px', fontSize:'13px', color:'var(--text-secondary)', fontFamily:F }}>
                                                {p.manager?.fullName || p.manager?.email || '—'}
                                            </td>
                                            <td style={{ padding:'13px 24px' }}><StatusBadge status={p.status}/></td>
                                            <td style={{ padding:'13px 24px', minWidth:'160px' }}>
                                                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                                                    <div style={{ flex:1, height:'5px', borderRadius:'6px', background:'var(--bg-muted)', overflow:'hidden' }}>
                                                        <div style={{ height:'100%', width:`${p.progress||0}%`, borderRadius:'6px', transition:'width 0.5s ease',
                                                            background: p.progress>=80 ? 'linear-gradient(90deg,#10b981,#34d399)'
                                                                : p.progress>=40 ? 'linear-gradient(90deg,#6366f1,#8b5cf6)'
                                                                : 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                                                        }}/>
                                                    </div>
                                                    <span style={{ fontSize:'11.5px', fontWeight:600, color:'var(--text-secondary)', fontFamily:F, minWidth:'46px', whiteSpace:'nowrap' }}>
                                                        {p.completedSubtasks}/{p.totalSubtasks}
                                                    </span>
                                                </div>
                                                <p style={{ fontFamily:F, fontSize:'10.5px', color:'var(--text-muted)', margin:'3px 0 0 0' }}>{p.progress||0}% complete</p>
                                            </td>
                                            <td style={{ padding:'13px 24px' }}>
                                                {p.team?.length>0 ? <TeamAvatars members={p.team}/> : <span style={{ fontFamily:F, fontSize:'12px', color:'var(--text-muted)' }}>—</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>)}
            </Card>

            {/* Top Performers: PM + Developer side by side */}
            <div className="bottom-grid">

                <Card>
                    {!isReady ? (
                        <ComponentLoader variant="table" rows={4} message="Loading performers…" />
                    ) : (<>
                        <CardHead title="Top Performer – Project Manager" subtitle="Ranked by completed subtasks in managed projects" action={<BarChart2 size={16} style={{ color:'var(--text-muted)', marginTop:'2px' }}/>}/>
                        <div style={{ padding:'16px 24px 20px' }}>
                            <PerformerList performers={managerPerformance} barColors={MGR_BARS}/>
                        </div>
                    </>)}
                </Card>

                <Card>
                    {!isReady ? (
                        <ComponentLoader variant="table" rows={4} message="Loading performers…" />
                    ) : (<>
                        <CardHead title="Top Performer – Developer" subtitle="Ranked by completed subtasks (assigned developer)" action={<BarChart2 size={16} style={{ color:'var(--text-muted)', marginTop:'2px' }}/>}/>
                        <div style={{ padding:'16px 24px 20px' }}>
                            <PerformerList performers={developerPerformance} barColors={DEV_BARS}/>
                        </div>
                    </>)}
                </Card>

            </div>

            {/* Recent Activity */}
            <Card>
                {!isReady ? (
                    <ComponentLoader variant="table" rows={5} message="Loading recent activity…" />
                ) : (<>
                    <CardHead title="Recent Activity" subtitle="Attributed to the assigned developer"/>
                    <div style={{ padding:'16px 24px 20px' }}>
                        {recentActivity.length === 0 ? (
                            <p style={{ color:'var(--text-muted)', textAlign:'center', padding:'24px 0', fontFamily:F, fontSize:'13px' }}>No completed tasks recorded yet</p>
                        ) : (
                            <div>
                                {recentActivity.map((item, i) => {
                                    const name = item.user?.fullName || item.user?.email || 'Unknown Developer';
                                    return (
                                        <div key={i}>
                                            <div style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'11px 0' }}>
                                                <AvatarComponent
                                                    name={name}
                                                    imageUrl={item.user?.avatar}
                                                    seed={item.user?._id?.toString() || item.user?.email || name}
                                                    size={34}
                                                    style={{ border:'2px solid var(--border)', flexShrink:0 }}
                                                />
                                                <div style={{ flex:1, minWidth:0 }}>
                                                    <p style={{ fontFamily:F, fontSize:'13.5px', color:'var(--text-header)', margin:0, lineHeight:1.45 }}>
                                                        <span style={{ fontWeight:700 }}>{name}</span>
                                                        {' '}completed{' '}
                                                        <span style={{ fontWeight:600, color:'#6366f1' }}>"{item.subtaskTitle}"</span>
                                                    </p>
                                                    <p style={{ fontFamily:F, fontSize:'11.5px', color:'var(--text-muted)', margin:'4px 0 0 0' }}>
                                                        {item.projectName && <span style={{ color:'var(--text-secondary)', fontWeight:500 }}>{item.projectName}</span>}
                                                        {item.projectName && ' · '}
                                                        {timeAgo(item.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                            {i < recentActivity.length-1 && <div style={{ height:'1px', background:'var(--border-muted)' }}/>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>)}
            </Card>

        </div>
    );
};

export default AdminDashboard;
