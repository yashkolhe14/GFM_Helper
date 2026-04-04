import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  Briefcase, 
  Code, 
  Globe,
  Github, 
  Linkedin,
  Download,
  Users,
  BookOpen,
  LayoutDashboard,
  Presentation,
  Filter,
  ChevronRight,
  Target,
  Award,
  Zap
} from 'lucide-react';

export const AnalysisPage: React.FC = () => {
  const { appData, selectedContext } = useAppContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'academic' | 'professional'>('overview');
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [selectedFeeStatus, setSelectedFeeStatus] = useState<string | null>(null);

  if (!appData || !selectedContext) return null;

  // Filter data based on selected context
  const filteredStudents = useMemo(() => appData.students.filter(s => 
    s.gfmName === selectedContext.gfmName && 
    (selectedContext.class === 'N/A' || s.class === selectedContext.class) &&
    (selectedContext.division === 'N/A' || s.division === selectedContext.division)
  ), [appData.students, selectedContext]);

  const filteredFees = useMemo(() => appData.feeRecords.filter(f => f.gfmName === selectedContext.gfmName), [appData.feeRecords, selectedContext.gfmName]);
  const filteredInternships = useMemo(() => appData.internships.filter(i => i.gfmName === selectedContext.gfmName), [appData.internships, selectedContext.gfmName]);
  const filteredHackathons = useMemo(() => appData.hackathons.filter(h => h.gfmName === selectedContext.gfmName), [appData.hackathons, selectedContext.gfmName]);
  const filteredVAC = useMemo(() => appData.vacRecords.filter(v => v.gfmName === selectedContext.gfmName), [appData.vacRecords, selectedContext.gfmName]);
  const filteredMOOC = useMemo(() => appData.moocRecords.filter(m => m.gfmName === selectedContext.gfmName), [appData.moocRecords, selectedContext.gfmName]);

  const totalStudents = filteredStudents.length;
  const boys = filteredStudents.filter(s => s.gender === 'Male').length;
  const girls = filteredStudents.filter(s => s.gender === 'Female').length;
  
  const paidFees = filteredFees.filter(f => f.status === 'Paid').length;
  const pendingFees = filteredFees.filter(f => f.status === 'Pending').length;
  const partialFees = filteredFees.filter(f => f.status === 'Partial').length;

  const githubCount = filteredStudents.filter(s => s.github).length;
  const linkedinCount = filteredStudents.filter(s => s.linkedin).length;

  const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

  const genderData = [
    { name: 'Boys', value: boys },
    { name: 'Girls', value: girls },
  ];

  const participationData = [
    { name: 'Internships', count: filteredInternships.length },
    { name: 'Hackathons', count: filteredHackathons.length },
    { name: 'VAC', count: filteredVAC.length },
    { name: 'MOOC', count: filteredMOOC.length },
  ];

  const platformDistribution = filteredMOOC.reduce((acc: any, curr) => {
    const platform = curr.platform || 'Other';
    acc[platform] = (acc[platform] || 0) + 1;
    return acc;
  }, {});

  const platformData = Object.entries(platformDistribution).map(([name, value]) => ({ name, value }));

  const feeData = [
    { name: 'Paid', value: paidFees },
    { name: 'Partial', value: partialFees },
    { name: 'Pending', value: pendingFees },
  ];

  const isElectiveSubject = (subject: any) => {
    const name = subject.name.toLowerCase();
    const type = (subject.type || '').toLowerCase();
    const electivePatterns = [
      /\belective\b/i,
      /\bpec\b/i,
      /\boec\b/i,
      /\bopen\s+elective\b/i,
      /\bprofessional\s+elective\b/i,
      /\bhonours\b/i,
      /\bminor\b/i,
      /\bvac\b/i,
    ];
    return electivePatterns.some(pattern => pattern.test(name) || pattern.test(type));
  };

  const filteredSubjects = appData.subjects.filter(s => 
    s.gfmName === selectedContext.gfmName && 
    (selectedContext.class === 'N/A' || s.class === selectedContext.class) &&
    (selectedContext.division === 'N/A' || s.division === selectedContext.division)
  );

  const compulsorySubjects = filteredSubjects.filter(s => !isElectiveSubject(s));
  const electiveSubjects = filteredSubjects.filter(s => isElectiveSubject(s));

  const coverageData = [
    { name: 'GitHub', value: githubCount },
    { name: 'LinkedIn', value: linkedinCount },
  ];

  const subjectTypeData = [
    { name: 'Compulsory', value: compulsorySubjects.length },
    { name: 'Electives', value: electiveSubjects.length },
  ];

  const vacEnrollment = filteredVAC.reduce((acc: any, curr) => {
    const subject = curr.subjectName || 'Unknown';
    acc[subject] = (acc[subject] || 0) + 1;
    return acc;
  }, {});
  const vacData = Object.entries(vacEnrollment).map(([name, value]) => ({ name, value }));

  const hackathonParticipation = filteredHackathons.reduce((acc: any, curr) => {
    const name = curr.name || 'Unknown';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const hackathonData = Object.entries(hackathonParticipation).map(([name, value]) => ({ name, value }));

  const studentHackathonParticipation = filteredStudents.reduce((acc: any, curr) => {
    if (curr.hackathonStatus && curr.hackathonStatus !== 'None') {
      const entries = curr.hackathonStatus.split(/[;,]/);
      entries.forEach(entry => {
        const match = entry.match(/(.*)\((.*)\)/);
        if (match) {
          const hackathonName = match[1].trim();
          acc[hackathonName] = (acc[hackathonName] || 0) + 1;
        } else {
          const hackathonName = entry.trim();
          if (hackathonName) {
            acc[hackathonName] = (acc[hackathonName] || 0) + 1;
          }
        }
      });
    }
    return acc;
  }, {});
  const studentHackathonData = Object.entries(studentHackathonParticipation).map(([name, value]) => ({ name, value }));

  // Radar chart data for skills/performance
  const performanceRadarData = [
    { subject: 'Academic', A: filteredSubjects.length * 10, fullMark: 100 },
    { subject: 'Professional', A: (filteredInternships.length + filteredHackathons.length) * 5, fullMark: 100 },
    { subject: 'Technical', A: (githubCount + linkedinCount) * 15, fullMark: 100 },
    { subject: 'MOOC', A: filteredMOOC.length * 20, fullMark: 100 },
    { subject: 'VAC', A: filteredVAC.length * 20, fullMark: 100 },
  ];

  const facultyData = useMemo(() => {
    const dist = filteredStudents.reduce((acc: any, curr) => {
      const mentor = curr.mentorName || 'Unassigned';
      acc[mentor] = (acc[mentor] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(dist)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value as number) - (a.value as number));
  }, [filteredStudents]);

  const CustomTooltip = ({ active, payload, label, coordinate }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = payload[0].chartType === 'PieChart' 
        ? payload[0].payload.chartTotal || payload.reduce((acc: number, p: any) => acc + p.value, 0)
        : null;
      
      const percentage = total ? ((payload[0].value / total) * 100).toFixed(1) : null;

      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-slate-200/50 min-w-[180px] z-50"
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color || payload[0].fill }} />
            <p className="font-black text-slate-900 text-sm">{label || data.name}</p>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Count</span>
              <span className="text-slate-900 font-black text-base">{payload[0].value}</span>
            </div>
            
            {percentage && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Share</span>
                <span className="text-indigo-600 font-black text-base">{percentage}%</span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Live Insight</p>
            <div className="flex gap-0.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-1 h-1 bg-indigo-200 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Pie
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="none"
        />
        <Pie
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 4}
          outerRadius={innerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          fillOpacity={0.3}
          stroke="none"
        />
      </g>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  const keyHighlights = [
    { 
      title: "Participation Peak", 
      desc: `Hackathon participation is at an all-time high with ${filteredHackathons.length} active records.`,
      icon: Zap,
      color: "text-amber-500"
    },
    { 
      title: "Gender Balance", 
      desc: `Healthy diversity with ${Math.round((girls/totalStudents)*100)}% female representation in the current batch.`,
      icon: Users,
      color: "text-rose-500"
    },
    { 
      title: "Skill Coverage", 
      desc: `${Math.round((githubCount/totalStudents)*100)}% of students have active GitHub profiles, showing strong technical intent.`,
      icon: Github,
      color: "text-slate-900"
    }
  ];

  const studentsByFeeStatus = useMemo(() => {
    if (!selectedFeeStatus) return [];
    const studentRolls = filteredFees
      .filter(f => f.status === selectedFeeStatus)
      .map(f => f.rollNo);
    return filteredStudents.filter(s => studentRolls.includes(s.rollNo));
  }, [selectedFeeStatus, filteredFees, filteredStudents]);

  return (
    <div className={cn(
      "space-y-8 pb-12 transition-all duration-700",
      isPresentationMode ? "fixed inset-0 z-[100] bg-background overflow-y-auto p-12" : ""
    )}>
      {/* Presentation Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden transition-all duration-500",
          isPresentationMode ? "mb-12" : ""
        )}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl -ml-24 -mb-24" />
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300">
              Live Analytics
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              System Online
            </span>
          </div>
          <h2 className="text-4xl font-black tracking-tight leading-none">
            {selectedContext.gfmName} <span className="text-indigo-400">Insights</span>
          </h2>
          <p className="text-slate-400 font-medium max-w-md">
            Visualizing performance, participation, and growth metrics for {totalStudents} students.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsPresentationMode(!isPresentationMode)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95",
              isPresentationMode ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-md"
            )}
          >
            <Presentation className="w-4 h-4" />
            <span>{isPresentationMode ? "Exit Presentation" : "Presentation Mode"}</span>
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all shadow-lg active:scale-95">
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </motion.div>

      {/* Key Highlights Narrative */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {keyHighlights.map((highlight, idx) => (
          <motion.div 
            key={idx}
            variants={itemVariants}
            className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-3xl flex gap-4 items-start"
          >
            <div className={cn("p-2 rounded-xl bg-white shadow-sm", highlight.color)}>
              <highlight.icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-sm mb-1">{highlight.title}</h4>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">{highlight.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'academic', label: 'Academic', icon: BookOpen },
          { id: 'professional', label: 'Professional', icon: Briefcase },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
              activeTab === tab.id 
                ? "bg-white text-slate-900 shadow-md" 
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, y: -20 }}
          className="space-y-8"
        >
          {activeTab === 'overview' && (
            <>
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Students', value: totalStudents, icon: Users, color: 'indigo', trend: '+12%' },
                  { label: 'Avg. Participation', value: '84%', icon: Target, color: 'emerald', trend: '+5%' },
                  { label: 'Active Projects', value: filteredHackathons.length, icon: Code, color: 'rose', trend: '+8%' },
                  { label: 'Certifications', value: filteredMOOC.length, icon: Award, color: 'orange', trend: '+15%' },
                ].map((stat, idx) => (
                  <motion.div 
                    key={idx}
                    variants={itemVariants}
                    whileHover={{ y: -5 }}
                    className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group"
                  >
                    <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl -mr-12 -mt-12 opacity-20 transition-opacity group-hover:opacity-40", `bg-${stat.color}-500`)} />
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn("p-3 rounded-2xl", `bg-${stat.color}-50 text-${stat.color}-600`)}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                        {stat.trend}
                      </span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                    <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
                  </motion.div>
                ))}
              </div>

              {/* Main Bento Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Performance Radar - Large Card */}
                <motion.div 
                  variants={itemVariants}
                  className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-indigo-600" />
                      <span>Performance DNA</span>
                    </h3>
                  </div>
                  <div className="flex-1 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceRadarData}>
                        <PolarGrid stroke="#f1f5f9" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                        <Radar
                          name="Performance"
                          dataKey="A"
                          stroke="#6366f1"
                          fill="#6366f1"
                          fillOpacity={0.6}
                        />
                        <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Participation Trends - Extra Large Card */}
                <motion.div 
                  variants={itemVariants}
                  className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                      <span>Participation Trends</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-indigo-500 rounded-full" />
                      <span className="text-xs font-bold text-slate-500">Active Records</span>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={participationData}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                <motion.div 
                  variants={itemVariants}
                  className="lg:col-span-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm"
                >
                  <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <span>Gender Diversity</span>
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={genderData.map(d => ({ ...d, chartTotal: totalStudents }))} 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={70} 
                          outerRadius={90} 
                          paddingAngle={8} 
                          dataKey="value"
                          stroke="none"
                          activeIndex={activeIndex}
                          activeShape={renderActiveShape}
                          onMouseEnter={onPieEnter}
                          onMouseLeave={onPieLeave}
                        >
                          {genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                <motion.div 
                  variants={itemVariants}
                  className="lg:col-span-6 bg-card p-8 rounded-[2.5rem] border border-border shadow-sm"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                      <PieIcon className="w-5 h-5 text-primary" />
                      <span>Financial Health</span>
                    </h3>
                    {selectedFeeStatus && (
                      <button 
                        onClick={() => setSelectedFeeStatus(null)}
                        className="text-[10px] font-bold text-primary hover:underline"
                      >
                        Clear Filter
                      </button>
                    )}
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={feeData.map(d => ({ ...d, chartTotal: filteredFees.length }))} 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={70} 
                          outerRadius={90} 
                          paddingAngle={8} 
                          dataKey="value"
                          stroke="none"
                          activeIndex={activeIndex}
                          activeShape={renderActiveShape}
                          onMouseEnter={onPieEnter}
                          onMouseLeave={onPieLeave}
                          onClick={(data) => setSelectedFeeStatus(data.name)}
                          cursor="pointer"
                        >
                          {feeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <AnimatePresence>
                    {selectedFeeStatus && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-8 pt-8 border-t border-border overflow-hidden"
                      >
                        <h4 className="text-sm font-black text-foreground mb-4 flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          <span>Students with {selectedFeeStatus} Fees</span>
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                          {studentsByFeeStatus.length > 0 ? (
                            studentsByFeeStatus.map(student => (
                              <div key={student.rollNo} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/50">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-card rounded-lg flex items-center justify-center text-[10px] font-bold text-muted-foreground border border-border">
                                    {student.rollNo}
                                  </div>
                                  <span className="text-xs font-bold text-foreground">{student.name}</span>
                                </div>
                                <span className="text-[10px] font-bold text-muted-foreground">{student.division}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground font-medium text-center py-4">No students found</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* New Faculty Distribution Chart */}
                <motion.div 
                  variants={itemVariants}
                  className="lg:col-span-12 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <Presentation className="w-5 h-5 text-indigo-600" />
                      <span>Faculty Mentorship Distribution</span>
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Students per Mentor</p>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={facultyData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                          angle={-45}
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                        <Tooltip 
                          content={<CustomTooltip />} 
                          cursor={{ fill: '#f8fafc', radius: 12 }}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="#6366f1" 
                          radius={[12, 12, 0, 0]} 
                          barSize={40}
                          animationDuration={1500}
                        >
                          {facultyData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                              fillOpacity={0.8}
                              className="hover:fill-opacity-100 transition-all duration-300"
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>
            </>
          )}

          {activeTab === 'academic' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <span>Subject Distribution</span>
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectTypeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" axisLine={false} tickLine={false} hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} width={100} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 12, 12, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <span>VAC Enrollment Breakdown</span>
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={vacData} cx="50%" cy="50%" innerRadius={80} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                        {vacData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'professional' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <motion.div variants={itemVariants} className="lg:col-span-7 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2">
                  <Code className="w-5 h-5 text-indigo-600" />
                  <span>Hackathon Participation (Student Records)</span>
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={studentHackathonData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#6366f1" radius={[12, 12, 0, 0]} barSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="lg:col-span-5 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  <span>MOOC Platforms</span>
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={platformData} cx="50%" cy="50%" innerRadius={80} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                        {platformData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="lg:col-span-12 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2">
                  <Github className="w-5 h-5 text-indigo-600" />
                  <span>Profile Coverage Analysis</span>
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={coverageData} barGap={20}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 14, fontWeight: 700, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={100}>
                        {coverageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#1e293b' : '#0284c7'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
