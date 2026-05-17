import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, ListTodo, CheckCircle2, TrendingUp, Clock, AlertCircle, RefreshCw, GitCommit, GitPullRequest, Rocket, PartyPopper } from 'lucide-react';
import {
    AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts';
import { toast } from 'react-toastify';
import { analyticsAPI } from '../services/analyticsService';
import Avatar from '../components/common/Avatar';
import WorkflowLoader from '../components/common/WorkflowLoader';
import useMinLoader from '../hooks/useMinLoader';
import ComponentLoader from '../components/common/ComponentLoader';

// ─── Constants ──────────────────────────────────────────────────────────────────
const F = "'Inter', 'Plus Jakarta Sans', sans-serif";
const AUTO_REFRESH_MS = 30_000;

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

// ─── Stat Card ───────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, title, value, iconColor, iconBg, sparkData }) => (
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
            position: 'relative'
        }}
    >
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'14px' }}>
            <div style={{ width:42, height:42, borderRadius:'12px', background:iconBg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={19} style={{ color:iconColor }}/>
            </div>
            {sparkData && <Spark data={sparkData} color={iconColor}/>}
        </div>
        <p style={{ fontFamily:F, fontSize:'30px', fontWeight:800, color:'var(--text-primary)', margin:0, letterSpacing:'-0.02em', lineHeight:1 }}>{value}</p>
        <p style={{ fontFamily:F, fontSize:'13px', fontWeight:600, color:'var(--text-secondary)', margin:'5px 0 0 0' }}>{title}</p>
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

// ─── Status Badges ──────────────────────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
    const isHigh = priority === 'high';
    const isMed = priority === 'medium';
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap',
            fontFamily: F, fontSize: '11.5px', fontWeight: 600,
            background: isHigh ? 'var(--bg-red-subtle)' : isMed ? 'var(--bg-amber-subtle)' : 'var(--bg-emerald-subtle)',
            color: isHigh ? 'var(--text-red)' : isMed ? 'var(--text-amber)' : 'var(--text-emerald)',
            textTransform: 'capitalize'
        }}>
            {priority || '—'}
        </span>
    );
};



// ─── Activity Tooltip ─────────────────────────────────────────────────────────────
const ActivityTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const entry = payload[0]?.payload;
    return (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'10px', padding:'9px 13px', boxShadow:'0 8px 24px rgba(0,0,0,0.25)' }}>
            <p style={{ fontFamily:F, color:'var(--text-muted)', fontSize:'11px', margin:'0 0 3px 0' }}>
                {entry?.day || entry?.label || entry?.name || ''}
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'#6366f1' }}/>
                <span style={{ fontFamily:F, color:'var(--text-primary)', fontSize:'13.5px', fontWeight:700 }}>
                    {payload[0].value} <span style={{ color:'var(--text-muted)', fontWeight:500, fontSize:'12px' }}>Completed</span>
                </span>
            </div>
        </div>
    );
};

const formatTimeAgo = (date) => {
    if (!date) return '—';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
};

// ═══════════════════════════════════════════════════════
//  DEVELOPER DASHBOARD
// ═══════════════════════════════════════════════════════
const DeveloperDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [chartMode, setChartMode] = useState('monthly');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await analyticsAPI.getDeveloperAnalytics();
            setData(res.data.data);
        } catch (err) {
            console.error(err);
            if (!silent) toast.error('Failed to load dashboard data');
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), AUTO_REFRESH_MS);
        return () => clearInterval(interval);
    }, [fetchData]);

    const showLoader = useMinLoader(loading);

    if (showLoader) return <WorkflowLoader message="Loading your dashboard…" />;

    const isReady = !!data;
    const { stats = {}, projects = [], weeklyProgress = [], completionActivity = [], developerActivity = [], recentTasks = [] } = data || {};

    // ── Metric Math ──────────────────────────────────────────────────────────
    const activeProjects = stats.activeProjects || 0;
    const totalAssigned  = stats.totalAssigned || 0;
    const completedTasks = stats.totalCompleted || 0;
    const completionRate = stats.completionRate || 0;

    // ── Chart Data ────────────────────────────────────────────────────────────
    const safeActivity = Array.isArray(completionActivity) ? completionActivity.slice() : [];
    const chartData = chartMode === 'monthly' ? safeActivity : (Array.isArray(weeklyProgress) ? weeklyProgress.slice() : []);

    // ── Donut ─────────────────────────────────────────────────────────────────
    const donutData = [
        { name:'Completed', value: completionRate, color:'#6366f1' },
        { name:'Pending',   value: 100 - completionRate, color:'var(--bg-muted)' },
    ].filter(d => d.value > 0);
    if (!donutData.length) donutData.push({ name:'No Data', value:1, color:'var(--bg-muted)' });

    // ── Mocks / Formatting ────────────────────────────────────────────────────
    const formatEndDate = (iso) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
    };

    const getActivityIcon = (action) => {
        if (action === 'Completed') return { icon: CheckCircle2, color: '#10b981', bg: 'rgba(16,185,129,0.1)' }
        return { icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' }
    }

    return (
        <div style={{ paddingBottom:'40px' }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'32px' }}>
                <div>
                    <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-header)', margin:0, fontFamily:F }}>
                        Welcome, {user.fullName || 'Developer'}
                    </h1>
                </div>
            </div>

            {/* Metric Cards - 4 col grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(210px,1fr))', gap:'20px', marginBottom:'24px' }}>
                {!isReady ? (
                    [0,1,2,3].map(i => (
                        <div key={i} style={{ background:'var(--bg-card)', borderRadius:'16px', padding:'22px', border:'1px solid var(--border)', boxShadow:'var(--shadow-card)' }}>
                            <ComponentLoader variant="stat" />
                        </div>
                    ))
                ) : (<>
                    <StatCard 
                        icon={Briefcase} title="Active Projects" value={activeProjects} 
                        iconColor="#6366f1" iconBg="rgba(99,102,241,0.1)" 
                    />
                    <StatCard 
                        icon={ListTodo} title="Assigned Tasks" value={totalAssigned} 
                        iconColor="#3b82f6" iconBg="rgba(59,130,246,0.1)" 
                    />
                    <StatCard 
                        icon={CheckCircle2} title="Completed Tasks" value={completedTasks} 
                        iconColor="#10b981" iconBg="rgba(16,185,129,0.1)" 
                    />
                    <StatCard 
                        icon={TrendingUp} title="Completion Rate" value={`${completionRate}%`} 
                        iconColor="#8b5cf6" iconBg="rgba(139,92,246,0.1)" 
                    />
                </>)}
            </div>

            {/* Charts Row */}
            <div className="charts-grid" style={{ marginBottom:'24px' }}>
                <Card>
                    {!isReady ? (
                        <ComponentLoader variant="chart" height="360px" />
                    ) : (<>
                        <CardHead
                            title="Task Completion Activity"
                            subtitle={`Performance over the last ${chartMode === 'weekly' ? '7' : '30'} days`}
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
                        <div style={{ padding:'24px 24px 20px', height:'300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top:5, right:0, bottom:0, left:-20 }}>
                                    <defs>
                                        <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--chart-grid)"/>
                                    <XAxis dataKey={chartMode === 'weekly' ? 'day' : 'date'} tickLine={false} axisLine={false} tick={{ fill:'var(--chart-text)', fontSize:11, fontFamily:F }} tickFormatter={(val)=> chartMode === 'weekly' ? val : (val ? val.slice(8,10) : '')} interval={chartMode === 'monthly' ? 4 : 0}/>
                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill:'var(--chart-text)', fontSize:11, fontFamily:F }}/>
                                    <Tooltip content={<ActivityTooltip/>} cursor={{ stroke:'var(--border)', strokeWidth:1, strokeDasharray:'4 4' }}/>
                                    <Area type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={3} fill="url(#colorArea)" activeDot={{ r:6, fill:'#6366f1', stroke:'var(--bg-card)', strokeWidth:3 }}/>
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </>)}
                </Card>

                <Card>
                    {!isReady ? (
                        <ComponentLoader variant="chart" height="360px" />
                    ) : (<>
                        <CardHead title="Work Progress" subtitle="Total percentage of tasks completed"/>
                        <div style={{ padding:'24px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'300px' }}>
                            <div style={{ position:'relative', width:'180px', height:'180px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={donutData.length>1?3:0} dataKey="value" strokeWidth={0} startAngle={90} endAngle={-270}>
                                            {donutData.map((e,i) => <Cell key={i} fill={i===0?'#6366f1':'var(--bg-muted)'}/>)}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center' }}>
                                    <p style={{ fontFamily:F, fontSize:'26px', fontWeight:800, color:'var(--text-primary)', margin:0, lineHeight:1 }}>{completionRate}%</p>
                                    <p style={{ fontFamily:F, fontSize:'9.5px', fontWeight:600, color:'var(--text-muted)', margin:'4px 0 0 0', letterSpacing:'0.06em', textTransform:'uppercase' }}>Completed</p>
                                </div>
                            </div>
                            <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:'8px', marginTop:'12px' }}>
                                {[{ label:'Completed Subtasks', color:'#6366f1', pct:completionRate },
                                  { label:'Pending Subtasks', color:'var(--bg-muted)', pct:`${100-completionRate}` },
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

            {/* Bottom Row */}
            <div className="bottom-grid">
                {/* Recent Tasks */}
                <Card style={{ flex: 1, minWidth:0 }}>
                    {!isReady ? (
                        <ComponentLoader variant="card" rows={4} message="Loading recent tasks…" />
                    ) : (<>
                        <CardHead title="Recent Tasks" />
                        <div style={{ padding:'20px 24px' }}>
                            {recentTasks.length === 0 ? (
                                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'30px 0' }}>
                                    <PartyPopper size={36} color="var(--text-muted)" style={{ marginBottom:'12px' }}/>
                                    <p style={{ fontFamily:F, color:'var(--text-secondary)', fontWeight:600, fontSize:'14px' }}>All caught up!</p>
                                </div>
                            ) : (
                                <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                                    {recentTasks.map(task => (
                                        <div key={task._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg-page)', padding:'14px 16px', borderRadius:'12px', border:'1px solid var(--border)' }}>
                                            <div style={{ display:'flex', flexDirection:'column' }}>
                                                <p style={{ fontFamily:F, color:'var(--text-primary)', fontWeight:700, fontSize:'14px', margin:'0 0 4px 0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'220px' }} title={task.title}>
                                                    {task.title}
                                                </p>
                                                <p style={{ fontFamily:F, color:'var(--text-muted)', fontSize:'12.5px', margin:0, display:'flex', alignItems:'center', gap:'6px' }}>
                                                    <Briefcase size={12}/> {task.projectName}
                                                </p>
                                            </div>
                                            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'6px' }}>
                                                <PriorityBadge priority={task.priority} />
                                                <span style={{ fontFamily:F, fontSize:'11px', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'4px' }}>
                                                    <Clock size={11} /> {formatTimeAgo(task.updatedAt)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>)}
                </Card>

                {/* Developer Activity Feed */}
                <Card style={{ flex: 1, minWidth:0 }}>
                    {!isReady ? (
                        <ComponentLoader variant="table" rows={4} message="Loading activity…" />
                    ) : (<>
                        <CardHead title="Recent Activity" subtitle="Your recent activity updates" />
                        <div style={{ padding:'0 24px' }}>
                            {developerActivity.length === 0 ? (
                                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'30px 0' }}>
                                    <Clock size={32} color="var(--text-muted)" style={{ marginBottom:'12px' }}/>
                                    <p style={{ fontFamily:F, color:'var(--text-secondary)', fontWeight:600, fontSize:'14px' }}>No recent activity</p>
                                </div>
                            ) : (
                                <div style={{ display:'flex', flexDirection:'column' }}>
                                    {developerActivity.map((act, index) => {
                                        return (
                                            <div key={act._id} style={{ display:'flex', alignItems:'flex-start', gap:'16px', padding:'20px 0', borderBottom: index < developerActivity.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                                <div style={{ width:40, height:40, borderRadius:'50%', overflow:'hidden', flexShrink:0, border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                    <Avatar 
                                                        name={user?.fullName || user?.name || 'Developer'} 
                                                        imageUrl={user?.avatar} 
                                                        seed={user?._id || user?.email || user?.username} 
                                                        size={40} 
                                                    />
                                                </div>
                                                <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', minHeight:'40px' }}>
                                                    <p style={{ fontFamily:F, color:'var(--text-primary)', fontWeight:500, fontSize:'14px', margin:'0 0 4px 0', lineHeight:1.4 }}>
                                                        <span style={{ fontWeight:700 }}>{user?.fullName || user?.name || 'You'}</span> {act.action === 'Completed' ? 'completed' : 'were assigned to'} <span style={{ color:'#6366f1', fontWeight:600 }}>"{act.text}"</span>
                                                    </p>
                                                    <p style={{ fontFamily:F, color:'var(--text-muted)', fontSize:'12.5px', margin:0, fontWeight:500 }}>
                                                        {act.project} <span style={{ padding:'0 4px' }}>•</span> {formatTimeAgo(act.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </>)}
                </Card>
            </div>

            {/* Running Projects Container */}
            {projects.length > 0 && (
                <div style={{ marginTop:'24px' }}>
                    <h2 style={{ fontFamily:F, fontWeight:800, fontSize:'18px', color:'var(--text-primary)', marginBottom:'16px' }}>Running Projects</h2>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'20px' }}>
                        {projects.map(p => (
                            <motion.div
                                key={p._id}
                                whileHover={{ y: -4, boxShadow: 'var(--shadow-card)' }}
                                transition={{ type: 'spring', stiffness: 300 }}
                                style={{
                                    background: 'var(--bg-card)',
                                    borderRadius: '16px',
                                    border: '1px solid var(--border)',
                                    padding: '24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px'
                                }}
                            >
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                                    <div>
                                        <h3 style={{ fontFamily:F, fontWeight:700, fontSize:'16px', color:'var(--text-primary)', margin:'0 0 4px 0' }}>{p.name}</h3>
                                        <p style={{ fontFamily:F, fontSize:'12.5px', color:'var(--text-muted)', margin:0 }}>Manager: <span style={{ fontWeight:600, color:'var(--text-secondary)' }}>{p.manager?.fullName || p.manager?.email || '—'}</span></p>
                                    </div>
                                    <PriorityBadge priority={p.priority} />
                                </div>

                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:'var(--bg-page)', borderRadius:'12px', border:'1px solid var(--border)' }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                        <ListTodo size={16} color="var(--text-muted)" />
                                        <span style={{ fontFamily:F, fontSize:'13px', fontWeight:600, color:'var(--text-secondary)' }}>Pending Tasks</span>
                                    </div>
                                    <span style={{ fontFamily:F, fontSize:'15px', fontWeight:800, color:'var(--text-primary)' }}>{p.taskCount}</span>
                                </div>

                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'4px' }}>
                                    <span style={{ padding:'4px 10px', borderRadius:'8px', fontSize:'11px', fontWeight:700, fontFamily:F, textTransform:'uppercase', letterSpacing:'0.02em', background: p.status === 'completed' ? 'rgba(16,185,129,0.1)' : p.status === 'active' ? 'rgba(59,130,246,0.1)' : 'var(--bg-muted)', color: p.status === 'completed' ? '#10b981' : p.status === 'active' ? '#3b82f6' : 'var(--text-secondary)' }}>
                                        {p.status}
                                    </span>
                                    <span style={{ display:'flex', alignItems:'center', gap:'6px', fontFamily:F, fontSize:'12px', fontWeight:600, color:'var(--text-muted)' }}>
                                        <Clock size={12} /> {formatEndDate(p.endDate)}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeveloperDashboard;
