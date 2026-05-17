// WelcomePage.jsx
// Drop into your React + Vite + Tailwind CSS 4 + Framer Motion project.
// Requires: react-router-dom, framer-motion, lucide-react

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import {
  Workflow,
  CheckSquare,
  Users,
  Github,
  BarChart2,
  ShieldCheck,
  ArrowRight,
  GitBranch,
  UserPlus,
  Layers,
  CheckCircle2,
  Zap,
} from "lucide-react";

// ─── Floating Workflow SVG Illustration ──────────────────────────────────────
const WorkflowIllustration = ({ opacity = 0.28, isDark }) => {
  const nodes = [
    { cx: 70, cy: 80, label: "Start" },
    { cx: 200, cy: 145, label: "Design" },
    { cx: 330, cy: 75, label: "Dev" },
    { cx: 325, cy: 215, label: "Test" },
    { cx: 430, cy: 145, label: "Deploy" },
  ];

  const edges = [
    { x1: 70, y1: 80, x2: 200, y2: 145 },
    { x1: 200, y1: 145, x2: 330, y2: 75 },
    { x1: 200, y1: 145, x2: 325, y2: 215 },
    { x1: 330, y1: 75, x2: 430, y2: 145 },
    { x1: 325, y1: 215, x2: 430, y2: 145 },
  ];

  return (
    <svg
      viewBox="0 0 500 300"
      className="w-full h-full"
      style={{ opacity }}
    >
      {edges.map((e, i) => (
        <motion.line
          key={i}
          x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
          stroke={isDark ? "#6366f1" : "#4f46e5"}
          strokeWidth="1.5"
          strokeDasharray="6,4"
          animate={{ strokeDashoffset: [0, -20] }}
          transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: "linear" }}
        />
      ))}
      {nodes.map((n, i) => (
        <motion.g
          key={i}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.5 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.25 }}
        >
          <circle cx={n.cx} cy={n.cy} r="24" fill={isDark ? "rgba(99,102,241,0.12)" : "rgba(79,70,229,0.08)"} stroke={isDark ? "#6366f1" : "#4f46e5"} strokeWidth="1.5" />
          <circle cx={n.cx} cy={n.cy} r="9" fill={isDark ? "#6366f1" : "#4f46e5"} opacity="0.85" />
          <text
            x={n.cx} y={n.cy + 38}
            textAnchor="middle"
            fill={isDark ? "#a5b4fc" : "#4338ca"}
            fontSize="11"
            fontFamily="'Syne', sans-serif"
            fontWeight="600"
          >
            {n.label}
          </text>
        </motion.g>
      ))}
    </svg>
  );
};

// ─── Feature Data ─────────────────────────────────────────────────────────────
const features = [
  {
    icon: Workflow,
    title: "Visual Workflow Canvas",
    desc: "Drag-and-drop task dependency graph editor powered by React Flow. Design complex pipelines visually.",
    gradient: "from-indigo-500/[0.12] to-violet-500/[0.08]",
    border: "border-indigo-500/25",
    iconBg: "bg-indigo-500/15 border-indigo-500/25",
    iconColor: "text-indigo-400",
    lightIconColor: "text-indigo-600",
  },
  {
    icon: CheckSquare,
    title: "Smart Task Management",
    desc: "Hierarchical tasks & subtasks with auto-computed status and real-time progress tracking.",
    gradient: "from-violet-500/[0.12] to-purple-500/[0.08]",
    border: "border-violet-500/25",
    iconBg: "bg-violet-500/15 border-violet-500/25",
    iconColor: "text-violet-400",
    lightIconColor: "text-violet-600",
  },
  {
    icon: Users,
    title: "Team Orchestration",
    desc: "Email-based invitations with role assignment — Admin, Project Manager, and Developer.",
    gradient: "from-purple-500/[0.12] to-fuchsia-500/[0.08]",
    border: "border-purple-500/25",
    iconBg: "bg-purple-500/15 border-purple-500/25",
    iconColor: "text-purple-400",
    lightIconColor: "text-purple-600",
  },
  {
    icon: Github,
    title: "GitHub Sync",
    desc: "Tasks auto-sync with GitHub Issues. Close an issue via PR and the task auto-completes.",
    gradient: "from-slate-600/[0.18] to-indigo-500/[0.08]",
    border: "border-slate-500/25",
    iconBg: "bg-slate-600/25 border-slate-400/20",
    iconColor: "text-slate-300",
    lightIconColor: "text-slate-600",
  },
  {
    icon: BarChart2,
    title: "Role-Based Analytics",
    desc: "Personalized dashboards with charts tailored for Admin, PM, and Developer roles.",
    gradient: "from-cyan-500/[0.10] to-indigo-500/[0.08]",
    border: "border-cyan-500/25",
    iconBg: "bg-cyan-500/15 border-cyan-500/25",
    iconColor: "text-cyan-400",
    lightIconColor: "text-cyan-600",
  },
  {
    icon: ShieldCheck,
    title: "Secure Authentication",
    desc: "JWT access/refresh tokens, OTP email verification, and granular role-based access control.",
    gradient: "from-emerald-500/[0.10] to-indigo-500/[0.08]",
    border: "border-emerald-500/25",
    iconBg: "bg-emerald-500/15 border-emerald-500/25",
    iconColor: "text-emerald-400",
    lightIconColor: "text-emerald-600",
  },
];

// ─── Steps Data ───────────────────────────────────────────────────────────────
const steps = [
  {
    icon: UserPlus,
    num: "01",
    title: "Create & Invite",
    desc: "Admin creates a project and invites team members via email with role assignments.",
  },
  {
    icon: Layers,
    num: "02",
    title: "Design Workflow",
    desc: "PM designs the workflow canvas and creates tasks with dependencies in the visual editor.",
  },
  {
    icon: GitBranch,
    num: "03",
    title: "Build & Sync",
    desc: "Developers work on subtasks; progress auto-syncs with GitHub Issues via PR events.",
  },
  {
    icon: CheckCircle2,
    num: "04",
    title: "Auto-Complete",
    desc: "Project auto-completes when all tasks are done. Analytics update in real-time.",
  },
];

// ─── Root Component ───────────────────────────────────────────────────────────
export default function WelcomePage() {
  const { isDark } = useTheme();

  return (
    <>
      {/* Google Fonts + global overrides */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=Outfit:wght@300;400;500&display=swap');

        .wo-page, .wo-page * {
          font-family: 'Outfit', sans-serif;
          box-sizing: border-box;
        }
        .wo-display {
          font-family: 'Syne', sans-serif !important;
        }

        @keyframes wo-bgShift {
          0%   { background-position: 0%   50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
        }
        .wo-hero-bg {
          background: ${isDark 
            ? "linear-gradient(-45deg, #080a14, #12104a, #0b1540, #1a0a3d, #0b1540)" 
            : "linear-gradient(-45deg, #f8fafc, #eef2ff, #f1f5f9, #e0e7ff, #f8fafc)"};
          background-size: 400% 400%;
          animation: wo-bgShift 14s ease infinite;
        }

        @keyframes wo-glow {
          0%, 100% { box-shadow: 0 0 22px rgba(99,102,241,0.4); }
          50%       { box-shadow: 0 0 50px rgba(99,102,241,0.7), 0 0 90px rgba(139,92,246,0.25); }
        }
        .wo-glow-btn {
          animation: wo-glow 3s ease-in-out infinite;
        }
      `}</style>

      <div className={`wo-page min-h-screen transition-colors duration-500 ${isDark ? 'bg-[#0a0c18] text-white' : 'bg-slate-50 text-slate-900'} overflow-x-hidden`}>
        <HeroSection isDark={isDark} />
        <FeaturesSection isDark={isDark} />
        <HowItWorksSection isDark={isDark} />
        <FooterSection isDark={isDark} />
      </div>
    </>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection({ isDark }) {
  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 44 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] },
  });

  return (
    <section className="wo-hero-bg relative min-h-screen flex items-center justify-center overflow-hidden px-5 pb-10">

      {/* Dot-grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: isDark
            ? "radial-gradient(rgba(99,102,241,0.18) 1px, transparent 1px)"
            : "radial-gradient(rgba(99,102,241,0.1) 1px, transparent 1px)",
          backgroundSize: "38px 38px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      {/* Central radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(99,102,241,0.10) 0%, rgba(124,58,237,0.06) 40%, transparent 70%)"
            : "radial-gradient(circle, rgba(99,102,241,0.05) 0%, rgba(124,58,237,0.03) 40%, transparent 70%)",
        }}
      />

      {/* Right floating illustration */}
      <motion.div
        className="absolute right-[-60px] top-1/2 -translate-y-1/2 w-[560px] h-[320px] hidden xl:block"
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <WorkflowIllustration opacity={isDark ? 0.3 : 0.4} isDark={isDark} />
      </motion.div>

      {/* Left floating illustration */}
      <motion.div
        className="absolute left-[-80px] top-1/2 -translate-y-1/2 w-[380px] h-[240px] hidden xl:block"
        animate={{ y: [10, -10, 10] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <WorkflowIllustration opacity={isDark ? 0.14 : 0.2} isDark={isDark} />
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-3xl mx-auto">

        {/* Heading */}
        <motion.h1
          className="wo-display text-[clamp(2.8rem,8vw,6rem)] font-extrabold leading-[1.02] tracking-tight mb-6"
          {...fadeUp(0.12)}
        >
          <span className={isDark ? 'text-white' : 'text-slate-900'}>Workflow</span>
          <br />
          <span
            style={{
              background: isDark
                ? "linear-gradient(130deg, #818cf8 0%, #a78bfa 45%, #d946ef 100%)"
                : "linear-gradient(130deg, #4f46e5 0%, #7c3aed 45%, #db2777 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Orchestrator
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-lg sm:text-xl mb-10 max-w-md mx-auto leading-relaxed`}
          {...fadeUp(0.24)}
        >
          Manage projects.&nbsp; Design workflows.&nbsp; Ship faster.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          className="flex justify-center"
          {...fadeUp(0.36)}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/login"
              className="wo-glow-btn inline-flex items-center gap-2 px-10 py-3.5 rounded-xl text-white text-base font-semibold tracking-wide"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
              }}
            >
              Login
              <ArrowRight size={17} />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient fade-out */}
      <div
        className="absolute bottom-0 left-0 right-0 h-36 pointer-events-none"
        style={{
          background: isDark 
            ? "linear-gradient(to bottom, transparent, #0a0c18)"
            : "linear-gradient(to bottom, transparent, #f8fafc)",
        }}
      />

      {/* Scroll hint */}
      <motion.div
        className={`absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 ${isDark ? 'text-slate-700' : 'text-slate-400'} text-[11px] tracking-widest uppercase`}
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span>scroll</span>
        <div className={`w-px h-5 bg-linear-to-b ${isDark ? 'from-slate-600' : 'from-slate-300'} to-transparent`} />
      </motion.div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
function FeaturesSection({ isDark }) {
  return (
    <section className={`py-28 px-5 transition-colors duration-500 ${isDark ? 'bg-[#0a0c18]' : 'bg-white'}`}>
      <div className="max-w-6xl mx-auto">

        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className={`text-indigo-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3 block`}>
            Features
          </span>
          <h2 className={`wo-display text-4xl sm:text-5xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-4 leading-tight`}>
            Everything you need{" "}
            <span
              style={{
                background: isDark 
                  ? "linear-gradient(130deg, #818cf8, #c084fc)"
                  : "linear-gradient(130deg, #4f46e5, #9333ea)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              to ship
            </span>
          </h2>
          <p className={`${isDark ? 'text-slate-500' : 'text-slate-500'} max-w-lg mx-auto text-base sm:text-lg`}>
            A complete platform to orchestrate your team, projects, and workflows
            from idea to deployment.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} total={features.length} isDark={isDark} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index, total, isDark }) {
  const { icon: Icon, title, desc, gradient, border, iconBg, iconColor, lightIconColor } = feature;
  const isLastOdd = index === total - 1 && total % 3 !== 0;

  return (
    <motion.div
      className={`relative group rounded-2xl border transition-all duration-300 ${
          isDark ? border + ' bg-linear-to-br ' + gradient : 'border-slate-200 bg-white shadow-sm hover:shadow-md'
        } backdrop-blur-xl p-6 overflow-hidden cursor-default
        ${isLastOdd ? "sm:col-span-2 lg:col-span-1" : ""}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.6,
        delay: (index % 3) * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
    >
      {/* Hover inner glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(circle at 50% -10%, rgba(99,102,241,0.10), transparent 65%)"
            : "radial-gradient(circle at 50% -10%, rgba(99,102,241,0.05), transparent 65%)",
        }}
      />

      {/* Icon */}
      <div
        className={`inline-flex p-2.5 rounded-xl border transition-colors duration-300 ${
          isDark ? iconBg + ' ' + iconColor : 'bg-indigo-50 border-indigo-100 ' + lightIconColor
        } mb-4`}
      >
        <Icon size={20} />
      </div>

      <h3 className={`wo-display text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>{title}</h3>
      <p className={`${isDark ? 'text-slate-500' : 'text-slate-500'} text-sm leading-relaxed`}>{desc}</p>
    </motion.div>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorksSection({ isDark }) {
  return (
    <section
      className="relative py-28 px-5 overflow-hidden transition-colors duration-500"
      style={{
        background: isDark 
          ? "linear-gradient(180deg, #0a0c18 0%, #0e0d2a 50%, #0a0c18 100%)"
          : "linear-gradient(180deg, #ffffff 0%, #f1f5f9 50%, #ffffff 100%)",
      }}
    >
      {/* Background glow blob */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 70%)"
            : "radial-gradient(ellipse, rgba(99,102,241,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-5xl mx-auto relative z-10">

        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="text-purple-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3 block">
            How It Works
          </span>
          <h2 className={`wo-display text-4xl sm:text-5xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-4 leading-tight`}>
            From zero to{" "}
            <span
              style={{
                background: isDark 
                  ? "linear-gradient(130deg, #a78bfa, #818cf8)"
                  : "linear-gradient(130deg, #7c3aed, #4f46e5)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              shipped
            </span>
          </h2>
          <p className={`${isDark ? 'text-slate-500' : 'text-slate-500'} max-w-md mx-auto text-base sm:text-lg`}>
            Four steps to running your whole team on Workflow Orchestrator.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <StepCard key={s.num} step={s} index={i} isLast={i === steps.length - 1} isDark={isDark} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step, index, isLast, isDark }) {
  const { icon: Icon, num, title, desc } = step;

  return (
    <motion.div
      className="relative flex flex-col items-center text-center"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.65, delay: index * 0.14, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Connector line (desktop only) */}
      {!isLast && (
        <div
          className="hidden lg:block absolute top-[52px] left-[55%] w-[90%] h-px pointer-events-none"
          style={{
            background: isDark
              ? "linear-gradient(90deg, rgba(99,102,241,0.35) 0%, transparent 100%)"
              : "linear-gradient(90deg, rgba(99,102,241,0.15) 0%, transparent 100%)",
          }}
        />
      )}

      {/* Ghost step number */}
      <div
        className="wo-display text-[72px] font-extrabold leading-none select-none mb-[-22px]"
        style={{ 
          color: isDark ? "rgba(99,102,241,0.07)" : "rgba(99,102,241,0.05)", 
          letterSpacing: "-0.04em" 
        }}
      >
        {num}
      </div>

      {/* Icon circle */}
      <motion.div
        className={`relative z-10 mb-4 inline-flex p-3.5 rounded-2xl border transition-colors duration-300 ${
          isDark 
            ? 'border-indigo-500/25 bg-indigo-500/10 text-indigo-400' 
            : 'border-indigo-100 bg-indigo-50 text-indigo-600'
        }`}
        whileHover={{ rotate: [0, -6, 6, 0], transition: { duration: 0.4 } }}
      >
        <Icon size={22} />
      </motion.div>

      <h3 className={`wo-display text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>{title}</h3>
      <p className={`${isDark ? 'text-slate-600' : 'text-slate-500'} text-sm leading-relaxed`}>{desc}</p>
    </motion.div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function FooterSection({ isDark }) {
  return (
    <footer className={`py-9 px-5 border-t transition-colors duration-500 ${isDark ? 'border-white/6' : 'border-slate-200 bg-slate-50'}`}>
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-600 text-sm">

        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <img
            src="/workflow-orchestrator-icon.svg"
            alt="Workflow Orchestrator"
            className="w-7 h-7 shrink-0"
          />
          <span className={`wo-display ${isDark ? 'text-slate-400' : 'text-slate-600'} font-semibold text-sm tracking-wide`}>
            Workflow Orchestrator
          </span>
        </div>

        {/* Credit */}
        <p className={`${isDark ? 'text-slate-600' : 'text-slate-500'} text-sm`}>
          Built by{" "}
          <span className="text-indigo-400 font-medium">Prince Thakarar</span>
        </p>

        {/* GitHub link */}
        {/* <motion.a
          href="https://github.com/princethakarar/Workflow-Orchestrator"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-300 transition-colors duration-200"
          whileHover={{ y: -1 }}
        >
          <Github size={15} />
          <span>GitHub</span>
        </motion.a> */}
      </div>
    </footer>
  );
}
