import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Users, Calendar, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
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
const getInitials = (name) => {
    if (!name) return '?';
    const p = name.trim().split(' ');
    return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
};
const PALETTE = ['#6366f1','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#14b8a6','#f97316','#84cc16'];
const hue = (s) => { let h = 0; for (let i = 0; i < (s||'').length; i++) h = (s.charCodeAt(i)+((h<<5)-h)); return PALETTE[Math.abs(h)%PALETTE.length]; };

const ordinal = (n) => {
    const s = ['th','st','nd','rd'], v = n % 100;
    return n + (s[(v-20)%10] || s[v] || s[0]);
};
const monthLabel = (isoDate) => {
    const d = new Date(isoDate + 'T00:00:00');
    return `${ordinal(d.getDate())} ${d.toLocaleDateString('en-US', { month:'long' })}`;
};

const fmtDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    const today = new Date(); today.setHours(0,0,0,0);
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return <span style={{ color:'#ef4444', fontWeight:600 }}>Overdue</span>;
    if (diffDays === 0) return <span style={{ color:'#f59e0b', fontWeight:600 }}>Today</span>;
    if (diffDays <= 3) return <span style={{ color:'#f59e0b', fontWeight:600 }}>In {diffDays}d</span>;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

// ─── Stat Card ───────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, title, value, secondary, iconColor, iconBg, sparkData, badge }) => (
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
        {badge && (
            <div style={{ position:'absolute', top:'22px', right:'22px', background:badge.bg, color:badge.fg, padding:'3px 8px', borderRadius:'12px', fontSize:'11px', fontWeight:700, fontFamily:F }}>
                {badge.text}
            </div>
        )}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'14px' }}>
            <div style={{ width:42, height:42, borderRadius:'12px', background:iconBg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={19} style={{ color:iconColor }}/>
            </div>
            {!badge && <Spark data={sparkData} color={iconColor}/>}
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
                {entry?.label || entry?.name || ''}
            </p>
            <p style={{ fontFamily:F, color:'var(--text-primary)', fontSize:'13px', fontWeight:600, margin:0 }}>
                Completed Tasks: {payload[0]?.value}
            </p>
        </div>
    );
};

const DEV_BARS  = ['linear-gradient(90deg,#6366f1,#8b5cf6)', 'linear-gradient(90deg,#10b981,#34d399)', 'linear-gradient(90deg,#f59e0b,#fbbf24)', 'linear-gradient(90deg,#06b6d4,#67e8f9)', 'linear-gradient(90deg,#ec4899,#f9a8d4)'];

// ══════════════════════════════════════════════════════════════
//  MANAGER DASHBOARD
// ══════════════════════════════════════════════════════════════
const ManagerDashboard = () => {
    const [data, setData]           = useState(null);
    const [loading, setLoading]     = useState(true);
    const [chartMode, setChartMode] = useState('weekly');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await analyticsAPI.getManagerAnalytics();
            setData(res.data.data);
        } catch (err) {
            console.error(err);
            if (!silent) toast.error('Failed to load manager analytics');
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

    if (showLoader) return <WorkflowLoader message="Loading your dashboard…" />;

    const isReady = !!data;
    const {
        stats              = {},
        teamPerformance     = [],
        upcomingDeadlines   = [],
        completionActivity  = [],
    } = data || {};

    // ── Metric Math ──────────────────────────────────────────────────────────
    const totalProjects       = stats.totalProjects || 0;
    const developmentProjects = stats.developmentProjects || 0;
    const totalTeam           = stats.totalTeamMembers || 0;
    const tasksThisWeek    = stats.tasksThisWeek || 0;
    const totalSubtasks    = stats.totalSubtasks || 0;
    const completedSub     = stats.completedSubtasks || 0;
    const completionRate   = stats.completionRate || 0;

    // ── Chart data ────────────────────────────────────────────────────────────
    const weeklyChartData  = completionActivity.slice(-7).map(d => ({ name:d.day, label:d.day, fullDate:d.fullDate, Tasks:d.completed }));
    const monthlyChartData = completionActivity.map(d => ({ name:String(d.dayNum), label:monthLabel(d.date), fullDate:d.fullDate, Tasks:d.completed }));
    const chartData = chartMode === 'weekly' ? weeklyChartData : monthlyChartData;

    // ── Donut ─────────────────────────────────────────────────────────────────
    const donutData = [
        { name:'Completed',   value: completedSub, color:'#6366f1' },
        { name:'In Progress', value: (totalSubtasks - completedSub), color:'var(--bg-muted)' },
    ].filter(d => d.value > 0);
    if (!donutData.length) donutData.push({ name:'No Data', value:1, color:'var(--bg-muted)' });
    
    // Spark data mockups if data is sparse
    const mockTrend1 = [2,4,3,6,8,5,10];
    const mockTrend2 = [10,8,6,7,5,9,12];

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:'24px', paddingBottom:'32px', fontFamily:F }}>
            
            {/* Header */}
            <div>
                <h1 style={{ fontFamily:F, fontSize:'24px', fontWeight:800, color:'var(--text-primary)', margin:0, letterSpacing:'-0.02em' }}>
                    Welcome, {user.fullName || 'Meet'}
                </h1>
            </div>

            {/* Metric Cards - 4 col grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(210px,1fr))', gap:'20px' }}>
                {!isReady ? (
                    [0,1,2,3].map(i => (
                        <div key={i} style={{ background:'var(--bg-card)', borderRadius:'16px', padding:'22px', border:'1px solid var(--border)', boxShadow:'var(--shadow-card)' }}>
                            <ComponentLoader variant="stat" />
                        </div>
                    ))
                ) : (<>
                    <StatCard 
                        icon={Briefcase} title="Active Projects" value={developmentProjects} 
                        iconColor="#6366f1" iconBg="rgba(99,102,241,0.1)" 
                    />
                    <StatCard 
                        icon={CheckCircle2} title="Tasks Completed" value={completedSub} 
                        iconColor="#10b981" iconBg="rgba(16,185,129,0.1)" 
                    />
                    <StatCard 
                        icon={Clock} title="Due This Week" value={tasksThisWeek} 
                        iconColor="#f59e0b" iconBg="rgba(245,158,11,0.1)" 
                    />
                    <StatCard 
                        icon={TrendingUp} title="Completion Rate" value={`${completionRate}%`} 
                        iconColor="#8b5cf6" iconBg="rgba(139,92,246,0.1)" 
                    />
                </>)}
            </div>

            {/* Graphs & Data Visualization */}
            <div className="charts-grid">
                
                {/* Task Completion Activity */}
                <Card>
                    {!isReady ? (
                        <ComponentLoader variant="chart" height="300px" />
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

                {/* Overall Project Progress */}
                <Card>
                    {!isReady ? (
                        <ComponentLoader variant="chart" height="300px" />
                    ) : (<>
                        <CardHead title="Overall Project Progress" subtitle="Aggregated milestone status"/>
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
                                    <p style={{ fontFamily:F, fontSize:'26px', fontWeight:800, color:'var(--text-primary)', margin:0, lineHeight:1 }}>{completionRate}%</p>
                                    <p style={{ fontFamily:F, fontSize:'9.5px', fontWeight:600, color:'var(--text-muted)', margin:'4px 0 0 0', letterSpacing:'0.06em', textTransform:'uppercase' }}>Complete</p>
                                </div>
                            </div>
                            <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:'8px', marginTop:'12px' }}>
                                {[{ label:'Completed Subtasks', color:'#6366f1', pct:completionRate },
                                  { label:'Pending Subtasks', color:'var(--bg-muted)', pct:100-completionRate },
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

            {/* Bottom Section - 2 columns */}
            <div className="bottom-grid">
                
                {/* Team Performance */}
                <Card>
                    {!isReady ? (
                        <ComponentLoader variant="table" rows={4} message="Loading team performance…" />
                    ) : (<>
                        <CardHead title="Team Performance" subtitle="Developer completion rates"/>
                        <div style={{ padding:'16px 24px 20px', display:'flex', flexDirection:'column', gap:'16px' }}>
                            {teamPerformance.length === 0 ? (
                                <p style={{ color:'var(--text-muted)', textAlign:'center', padding:'24px 0', fontFamily:F, fontSize:'13px' }}>No team members assigned</p>
                            ) : (
                                teamPerformance.slice(0, 5).map((dev, i) => {
                                    const pct = dev.completionRate;
                                    return (
                                        <div key={dev._id} style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                                            <AvatarComponent
                                                name={dev.name}
                                                imageUrl={dev.avatar}
                                                seed={dev._id || dev.email || dev.name}
                                                size={36}
                                            />
                                            <div style={{ flex:1, minWidth:0 }}>
                                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'5px' }}>
                                                    <span style={{ fontFamily:F, fontSize:'13px', fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{dev.name}</span>
                                                    <span style={{ fontFamily:F, fontSize:'12px', fontWeight:700, color:'#6366f1', marginLeft:'8px', flexShrink:0 }}>
                                                        {dev.completionRate}%
                                                    </span>
                                                </div>
                                                <div style={{ height:'5px', background:'var(--bg-muted)', borderRadius:'6px', overflow:'hidden' }}>
                                                    <motion.div
                                                        initial={{ width:0 }}
                                                        animate={{ width:`${pct}%` }}
                                                        transition={{ duration:0.8, delay:i*0.09, ease:'easeOut' }}
                                                        style={{ height:'100%', borderRadius:'6px', background:DEV_BARS[i%DEV_BARS.length] }}
                                                    />
                                                </div>
                                                <p style={{ fontFamily:F, fontSize:'11px', color:'var(--text-muted)', margin:'4px 0 0 0' }}>
                                                    {dev.completedSubtasks} of {dev.assignedSubtasks} tasks
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>)}
                </Card>

                {/* Upcoming Deadlines */}
                <Card>
                    {!isReady ? (
                        <ComponentLoader variant="card" rows={4} message="Loading upcoming tasks…" />
                    ) : (<>
                        <CardHead title="Upcoming Tasks" subtitle="Tasks due in the next 14 days"/>
                        <div style={{ padding:'16px 24px 20px', display:'flex', flexDirection:'column', gap:'12px' }}>
                            {upcomingDeadlines.length === 0 ? (
                                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', py:10, color:'var(--text-muted)' }}>
                                    <CheckCircle2 size={40} style={{ color:'#10b981', marginBottom:'12px', opacity:0.8 }} />
                                    <p style={{ fontFamily:F, fontWeight:600, margin:0, color:'var(--text-primary)' }}>All clear!</p>
                                    <p style={{ fontFamily:F, fontSize:'13px', marginTop:'4px' }}>No tasks due in the next 14 days</p>
                                </div>
                            ) : (
                                upcomingDeadlines.map((task, i) => (
                                    <div key={task._id} style={{ display:'flex', alignItems:'flex-start', gap:'12px', background:'var(--bg-hover)', padding:'12px 16px', borderRadius:'12px', border:'1px solid var(--border-muted)' }}>
                                        <div style={{ width:'4px', height:'36px', borderRadius:'4px', flexShrink:0, background: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#10b981' }} />
                                        <div style={{ flex:1, minWidth:0 }}>
                                            <p style={{ fontFamily:F, fontSize:'13.5px', fontWeight:600, color:'var(--text-primary)', margin:'0 0 2px 0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{task.title}</p>
                                            <p style={{ fontFamily:F, fontSize:'11.5px', color:'var(--text-muted)', margin:0 }}>
                                                {fmtDate(task.deadline)} • {task.projectName || 'Internal'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>)}
                </Card>

            </div>
            
        </div>
    );
};

export default ManagerDashboard;
