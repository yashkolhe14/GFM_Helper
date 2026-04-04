import React from 'react';
import { 
  Users, 
  BookOpen, 
  UserCheck, 
  CreditCard, 
  Award, 
  Globe, 
  Briefcase, 
  Code, 
  Github, 
  Linkedin, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
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
  Legend
} from 'recharts';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../lib/utils';

export const Dashboard: React.FC = () => {
  const { appData, selectedContext, setActivePage } = useAppContext();

  if (!appData || !selectedContext) return null;

  // Filter data based on selected context
  const filteredStudents = appData.students.filter(s => 
    s.gfmName === selectedContext.gfmName && 
    s.class === selectedContext.class && 
    s.division === selectedContext.division
  );

  const filteredSubjects = appData.subjects.filter(s => 
    s.gfmName === selectedContext.gfmName && 
    s.class === selectedContext.class && 
    s.division === selectedContext.division
  );

  const filteredMentees = appData.mentorMentees.filter(m => 
    m.gfmName === selectedContext.gfmName &&
    m.class === selectedContext.class &&
    m.division === selectedContext.division
  );
  const uniqueMentors = new Set(filteredMentees.map(m => m.mentorName)).size;
  const filteredFees = appData.feeRecords.filter(f => f.gfmName === selectedContext.gfmName);
  const filteredVAC = appData.vacRecords.filter(v => v.gfmName === selectedContext.gfmName);
  const filteredMOOC = appData.moocRecords.filter(m => m.gfmName === selectedContext.gfmName);
  const filteredInternships = appData.internships.filter(i => i.gfmName === selectedContext.gfmName);
  const filteredHackathons = appData.hackathons.filter(h => h.gfmName === selectedContext.gfmName);

  const totalStudents = filteredStudents.length;
  const boys = filteredStudents.filter(s => s.gender === 'Male').length;
  const girls = filteredStudents.filter(s => s.gender === 'Female').length;
  const paidFees = filteredFees.filter(f => String(f.status || '').toLowerCase() === 'paid').length;
  const pendingFees = filteredFees.filter(f => String(f.status || '').toLowerCase() === 'pending').length;
  const partialFees = filteredFees.filter(f => String(f.status || '').toLowerCase() === 'partial').length;

  const stats = [
    { label: 'Total Students', value: totalStudents, icon: Users, color: 'bg-blue-500', trend: '+2%', page: 'students' },
    { label: 'Boys', value: boys, icon: Users, color: 'bg-indigo-500', trend: '52%', page: 'students' },
    { label: 'Girls', value: girls, icon: Users, color: 'bg-pink-500', trend: '48%', page: 'students' },
    { label: 'Subjects', value: filteredSubjects.length, icon: BookOpen, color: 'bg-emerald-500', trend: 'Active', page: 'subjects' },
    { label: 'Mentors', value: uniqueMentors, icon: UserCheck, color: 'bg-amber-500', trend: 'Assigned', page: 'mentor-mentee' },
    { label: 'Fee Paid', value: paidFees, icon: CreditCard, color: 'bg-green-500', trend: `${Math.round((paidFees/totalStudents)*100 || 0)}%`, page: 'fees' },
    { label: 'VAC Count', value: filteredVAC.length, icon: Award, color: 'bg-purple-500', trend: 'Cert.', page: 'vac' },
    { label: 'MOOC Count', value: filteredMOOC.length, icon: Globe, color: 'bg-cyan-500', trend: 'Online', page: 'mooc' },
    { label: 'Internships', value: filteredInternships.length, icon: Briefcase, color: 'bg-orange-500', trend: 'Placed', page: 'internship' },
    { label: 'Hackathons', value: filteredHackathons.length, icon: Code, color: 'bg-rose-500', trend: 'Part.', page: 'hackathon' },
  ];

  const genderData = [
    { name: 'Boys', value: boys },
    { name: 'Girls', value: girls },
  ];

  const feeData = [
    { name: 'Paid', value: paidFees },
    { name: 'Partial', value: partialFees },
    { name: 'Pending', value: pendingFees },
  ];

  const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

  const alerts = [
    { 
      label: 'Fees Due', 
      count: pendingFees + partialFees, 
      description: 'students have pending or partial fees',
      icon: CreditCard,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      page: 'fees'
    },
    { 
      label: 'Missing LinkedIn', 
      count: filteredStudents.filter(s => !s.linkedin).length, 
      description: 'students haven\'t updated LinkedIn profile',
      icon: Linkedin,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      page: 'linkedin'
    },
    { 
      label: 'Missing GitHub', 
      count: filteredStudents.filter(s => !s.github).length, 
      description: 'students haven\'t updated GitHub profile',
      icon: Github,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50 dark:bg-slate-800/50',
      page: 'github'
    },
    { 
      label: 'VAC Pending', 
      count: filteredVAC.filter(v => String(v.status || '').toLowerCase() === 'pending').length, 
      description: 'students have pending VAC certifications',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      page: 'vac'
    }
  ].filter(a => a.count > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Academic Overview</h2>
          <p className="text-muted-foreground font-medium">Real-time insights for {selectedContext.gfmName}</p>
        </div>
        <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-xl border border-border shadow-sm w-fit">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="text-sm font-bold text-foreground">Live Reporting</span>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-6 bg-primary rounded-full"></div>
            <h3 className="text-xl font-bold text-foreground">Action Center</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {alerts.map((alert, idx) => (
              <button 
                key={idx} 
                onClick={() => setActivePage(alert.page)}
                className={cn("p-4 rounded-2xl border border-transparent transition-all hover:shadow-md flex flex-col gap-3 text-left w-full", alert.bgColor)}
              >
                <div className="flex items-center justify-between">
                  <div className={cn("p-2 rounded-xl bg-card shadow-sm", alert.color)}>
                    <alert.icon className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-black text-foreground">{alert.count}</span>
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">{alert.label}</p>
                  <p className="text-xs text-muted-foreground leading-tight mt-1">{alert.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        {stats.map((stat, idx) => (
          <button 
            key={idx} 
            onClick={() => setActivePage(stat.page)}
            className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-left w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-2xl text-white shadow-lg", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                stat.trend.includes('+') || stat.trend.includes('%') ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
              )}>
                {stat.trend.includes('+') && <ArrowUpRight className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-foreground">{stat.value}</h3>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card p-8 rounded-3xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-foreground">Student Distribution</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span className="text-xs font-bold text-muted-foreground">Boys</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                <span className="text-xs font-bold text-muted-foreground">Girls</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: 'Gender Ratio', Boys: boys, Girls: girls }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '16px', border: '1px solid hsl(var(--border))', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="Boys" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={60} />
                <Bar dataKey="Girls" fill="#ec4899" radius={[8, 8, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
          <h3 className="text-xl font-bold text-foreground mb-8">Fee Status</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={feeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {feeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '16px', border: '1px solid hsl(var(--border))', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="bg-gradient-to-br from-primary to-indigo-800 p-8 rounded-3xl text-primary-foreground shadow-xl shadow-primary/20">
          <h4 className="text-lg font-bold mb-2">Quick Action</h4>
          <p className="text-primary-foreground/80 text-sm mb-6">Generate a comprehensive report for the current GFM context.</p>
          <button className="w-full py-3 bg-white text-primary rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all active:scale-95">
            Download PDF Report
          </button>
        </div>
        
        <div className="lg:col-span-3 bg-card p-8 rounded-3xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-foreground">Recent Activity</h3>
            <button className="text-primary text-sm font-bold hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Internship Added', student: 'Rahul Sharma', time: '2h ago', icon: Briefcase, color: 'text-orange-500', page: 'internship' },
              { label: 'Fee Status Updated', student: 'Priya Patel', time: '4h ago', icon: CreditCard, color: 'text-green-500', page: 'fees' },
              { label: 'MOOC Completed', student: 'Amit Kumar', time: '1d ago', icon: Globe, color: 'text-cyan-500', page: 'mooc' },
            ].map((item, idx) => (
              <button 
                key={idx} 
                onClick={() => setActivePage(item.page)}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50 hover:bg-muted/50 transition-all w-full text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("p-2 rounded-xl bg-card shadow-sm", item.color)}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.student}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-muted-foreground">{item.time}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
