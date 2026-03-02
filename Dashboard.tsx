
import React, { useMemo } from 'react';
import { WeeklyReport } from './types';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  CheckSquare, 
  Layers, 
  Activity,
  History,
  Zap,
  Ship as ShipIcon,
  ShieldCheck,
  Crown,
  Award,
  FileText
} from 'lucide-react';

interface Props {
  reports: WeeklyReport[];
  isAuthorized?: boolean;
  onLoginRequest?: () => void;
}

const Dashboard: React.FC<Props> = ({ reports }) => {
  const stats = useMemo(() => {
    let totalSqft = 0;
    let completedComps = 0;
    let qcPassedCount = 0;
    const installers = new Set();
    const vessels = new Set();
    const phaseDistribution: Record<string, number> = {};
    const vesselProduction: Record<string, number> = {};
    const recentActivities: { vessel: string, comp: string, phase: string, date: string }[] = [];
    
    (reports || []).forEach(r => {
      (r.compartments || []).forEach(c => {
        totalSqft += (Number(c.sqft) || 0);
        completedComps++;
        if (c.qcPassed) qcPassedCount++;
        if (c.installer) installers.add(c.installer);
        
        const vName = c.vessel || r.vessel || 'CVN74';
        vessels.add(vName);
        vesselProduction[vName] = (vesselProduction[vName] || 0) + (Number(c.sqft) || 0);

        if (c.phases && c.phases.length > 0) {
          const latestPhase = c.phases[c.phases.length - 1];
          phaseDistribution[latestPhase.description] = (phaseDistribution[latestPhase.description] || 0) + 1;
          
          (c.phases || []).forEach(p => {
            recentActivities.push({
              vessel: vName,
              comp: c.name,
              phase: p.description,
              date: p.date
            });
          });
        }
      });
    });

    recentActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      totalSqft,
      completedComps,
      qcPassedCount,
      installerCount: installers.size,
      vesselCount: vessels.size,
      qcRate: completedComps > 0 ? Math.round((qcPassedCount / completedComps) * 100) : 0,
      efficiency: installers.size > 0 ? Math.round(totalSqft / installers.size) : 0,
      phaseData: Object.entries(phaseDistribution).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      vesselData: Object.entries(vesselProduction).map(([name, sqft]) => ({ name, sqft })).sort((a, b) => b.sqft - a.sqft),
      recentActivities: recentActivities.slice(0, 6)
    };
  }, [reports]);

  const trendData = useMemo(() => {
    const aggregated: Record<string, { sqft: number, entries: number }> = {};
    
    reports.forEach(r => {
      if (!r.weekStart) return;
      const dateKey = r.weekStart;
      if (!aggregated[dateKey]) {
        aggregated[dateKey] = { sqft: 0, entries: 0 };
      }
      aggregated[dateKey].sqft += (r.compartments || []).reduce((acc, c) => acc + (Number(c.sqft) || 0), 0);
      aggregated[dateKey].entries += (r.compartments || []).length;
    });

    return Object.entries(aggregated)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        sqft: data.sqft,
        entries: data.entries
      }));
  }, [reports]);

  const avgSqft = useMemo(() => {
    if (trendData.length === 0) return 0;
    const total = trendData.reduce((acc, curr) => acc + curr.sqft, 0);
    return Math.round(total / trendData.length);
  }, [trendData]);

  const peakSqft = useMemo(() => {
    if (trendData.length === 0) return 0;
    return Math.max(...trendData.map(d => d.sqft));
  }, [trendData]);

  const installerData = useMemo(() => {
    const map: Record<string, { sqft: number, units: number, qcPassed: number }> = {};
    (reports || []).forEach(r => (r.compartments || []).forEach(c => {
      const name = c.installer || 'Unknown';
      if (!map[name]) map[name] = { sqft: 0, units: 0, qcPassed: 0 };
      map[name].sqft += (Number(c.sqft) || 0);
      map[name].units += 1;
      if (c.qcPassed) map[name].qcPassed += 1;
    }));
    const totalSqft = Object.values(map).reduce((a, b) => a + b.sqft, 0);
    return Object.entries(map)
      .map(([name, data]) => ({ 
        name, 
        sqft: data.sqft, 
        qcRate: data.units > 0 ? Math.round((data.qcPassed / data.units) * 100) : 0,
        percent: totalSqft > 0 ? (data.sqft / totalSqft) * 100 : 0 
      }))
      .sort((a, b) => b.sqft - a.sqft)
      .slice(0, 6);
  }, [reports]);

  const dateRange = useMemo(() => {
    if (!reports || !reports.length) return 'No data available';
    const dates = reports.map(r => new Date(r.weekStart).getTime()).filter(t => !isNaN(t));
    if (!dates.length) return 'No data available';
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    return `${min.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} - ${max.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }, [reports]);

  if (!reports || reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <Activity className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">No Data Available</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          There are currently no weekly reports to display. Once reports are submitted, your analytics dashboard will automatically populate.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics Overview</h1>
          <p className="text-slate-500 font-medium mt-1">Showing data for <span className="text-slate-700 font-bold">{dateRange}</span></p>
        </div>
      </div>

      {/* 1. Enhanced Metric Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <MetricCard 
          icon={<Layers className="w-5 h-5" />} 
          label="Production" 
          value={stats.totalSqft} 
          unit="sqft"
          color="blue"
        />
        <MetricCard 
          icon={<ShieldCheck className="w-5 h-5" />} 
          label="QC Pass" 
          value={stats.qcRate} 
          suffix="%"
          unit="rate"
          color="emerald"
        />
        <MetricCard 
          icon={<Activity className="w-5 h-5" />} 
          label="Avg Weekly" 
          value={avgSqft} 
          unit="sqft/wk"
          color="indigo"
        />
        <MetricCard 
          icon={<Award className="w-5 h-5" />} 
          label="Peak Week" 
          value={peakSqft} 
          unit="sqft"
          color="amber"
        />
        <MetricCard 
          icon={<FileText className="w-5 h-5" />} 
          label="Total Reports" 
          value={reports.length} 
          unit="reports"
          color="cyan"
        />
        <MetricCard 
          icon={<CheckSquare className="w-5 h-5" />} 
          label="Units" 
          value={stats.completedComps} 
          unit="total"
          color="slate"
        />
      </div>

      {/* 2. Primary Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Main Production Chart */}
        <div className="xl:col-span-8 bg-white p-4 sm:p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 lg:mb-8 gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                Production Velocity
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">Installed square footage trend over time</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                 <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400">Total Sqft</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                 <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400">Units</span>
               </div>
            </div>
          </div>
          
          <div className="h-[250px] sm:h-[300px] lg:h-[350px] w-full mt-2 sm:mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.4"/>
                  </filter>
                  <filter id="areaGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="-2" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.2"/>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                  dy={15}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false} 
                  tickLine={false} 
                  hide
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                {avgSqft > 0 && (
                  <ReferenceLine yAxisId="left" y={avgSqft} stroke="#cbd5e1" strokeDasharray="4 4" label={{ position: 'insideBottomLeft', value: 'AVG SQFT', fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} />
                )}
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="sqft" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#velocityGrad)" 
                  filter="url(#areaGlow)"
                  animationDuration={1500}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="entries" 
                  stroke="#f59e0b" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b', filter: 'url(#lineGlow)' }} 
                  filter="url(#lineGlow)"
                  animationDuration={1500} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vessel Distribution Bar Chart */}
        <div className="xl:col-span-4 bg-white p-4 sm:p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] shadow-sm border border-slate-200">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-1 flex items-center gap-3">
             <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-50 rounded-xl flex items-center justify-center shrink-0">
              <ShipIcon className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600" />
            </div>
            Fleet Breakdown
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm mb-6 lg:mb-8">Production per vessel</p>
          
          <div className="h-[240px] sm:h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.vesselData} layout="vertical" margin={{ left: -15, right: 30 }}>
                <defs>
                  <linearGradient id="barGrad1" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#0891b2" />
                  </linearGradient>
                  <linearGradient id="barGrad2" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  <linearGradient id="barGrad3" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                  <linearGradient id="barGrad4" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 800 }}
                  width={80}
                />
                <Tooltip cursor={{ fill: '#f8fafc' }} content={<VesselTooltip />} />
                <Bar dataKey="sqft" radius={[0, 8, 8, 0]} barSize={24}>
                  {stats.vesselData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#barGrad${(index % 4) + 1})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 space-y-3">
            {stats.vesselData.slice(0, 3).map((v, idx) => (
               <div key={`${v.name}-${idx}`} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                 <span className="text-xs font-black text-slate-700">{v.name}</span>
                 <span className="text-xs font-bold text-cyan-600">{v.sqft.toLocaleString()} <span className="text-[10px] text-slate-400">sqft</span></span>
               </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Crew Performance & Real-time logs */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Crew Leaderboard */}
        <div className="xl:col-span-7 bg-white p-4 sm:p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                </div>
                Lead Performance
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">Individual contribution by square footage</p>
            </div>
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-slate-200 hidden sm:block" />
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            {installerData.map((d, i) => (
              <div key={`${d.name}-${i}`} className={`relative group ${i === 0 ? 'p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 shadow-sm' : ''}`}>
                {i === 0 && (
                  <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg transform rotate-12 ring-4 ring-white">
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                )}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${i === 0 ? 'mb-3' : 'mb-2'}`}>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className={`text-sm font-black ${i === 0 ? 'text-amber-900' : 'text-slate-900'}`}>{d.name}</span>
                    <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${i === 0 ? 'bg-amber-200/50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                      {i === 0 ? 'Top Gun' : 'Foreman'}
                    </span>
                    <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${d.qcRate >= 90 ? 'bg-emerald-100 text-emerald-600' : d.qcRate >= 70 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                      {d.qcRate}% QC
                    </span>
                  </div>
                  <span className={`text-xs font-black ${i === 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                    {d.sqft.toLocaleString()} <span className="text-[9px] sm:text-[10px] tracking-normal font-bold">SQFT</span>
                  </span>
                </div>
                <div className={`w-full h-2.5 rounded-full overflow-hidden ${i === 0 ? 'bg-amber-200/50' : 'bg-slate-100'}`}>
                  <div 
                    className={`h-full transition-all duration-1000 ease-out rounded-full ${i === 0 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-indigo-400'}`}
                    style={{ width: `${d.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase Pipeline */}
        <div className="xl:col-span-5 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4 sm:p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl text-white border border-slate-700/50">
          {/* Decorative background elements */}
          <div className="absolute -top-24 -right-24 w-48 h-48 sm:w-64 sm:h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-indigo-500/10 to-transparent pointer-events-none"></div>
          
          <div className="relative z-10">
            <h3 className="text-lg sm:text-xl font-black flex items-center gap-3 mb-6">
               <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-md shadow-inner shrink-0">
                <History className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
              </div>
              Production Pipeline
            </h3>

            <div className="space-y-4">
              {stats.phaseData.slice(0, 5).map((phase, idx) => (
                <div key={`${phase.name}-${idx}`} className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                    <span className="text-lg font-black text-blue-400 drop-shadow-md">{phase.value}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-0.5 truncate">{phase.name}</p>
                    <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shadow-[0_0_12px_rgba(56,189,248,0.6)] relative" 
                        style={{ width: `${(phase.value / stats.completedComps) * 100}%` }}
                      >
                        <div className="absolute top-0 right-0 bottom-0 w-4 bg-gradient-to-r from-transparent to-white/40 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Live Operations</h4>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-red-400">Live</span>
                </div>
              </div>
              <div className="space-y-4">
                {stats.recentActivities.slice(0, 3).map((act, i) => (
                  <div key={`${act.vessel}-${act.comp}-${act.phase}-${i}`} className="flex items-start gap-4 group cursor-default">
                    <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 transition-transform group-hover:scale-150 ${act.phase.includes('Passed') ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]'}`}></div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-white leading-none mb-1 truncate group-hover:text-blue-200 transition-colors">{act.phase}</p>
                      <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">{act.vessel} • {act.comp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const AnimatedNumber = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  
  React.useEffect(() => {
    let startTimestamp: number;
    const duration = 1500;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeProgress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };
    window.requestAnimationFrame(step);
  }, [value]);
  
  return <>{displayValue.toLocaleString()}</>;
};

const MetricCard = ({ icon, label, value, suffix = '', unit, color }: { icon: React.ReactNode, label: string, value: number, suffix?: string, unit: string, color: string }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600 text-white shadow-blue-200',
    emerald: 'bg-emerald-600 text-white shadow-emerald-200',
    indigo: 'bg-indigo-600 text-white shadow-indigo-200',
    amber: 'bg-amber-500 text-white shadow-amber-200',
    cyan: 'bg-cyan-600 text-white shadow-cyan-200',
    slate: 'bg-slate-800 text-white shadow-slate-200'
  };

  return (
    <div className="relative overflow-hidden bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className={`absolute -right-6 -top-6 w-20 h-20 sm:w-24 sm:h-24 rounded-full opacity-5 transition-transform duration-500 group-hover:scale-150 ${colorMap[color].split(' ')[0]}`}></div>
      
      <div className={`relative z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transition-transform duration-300 group-hover:scale-110 shadow-lg ${colorMap[color]}`}>
        {icon}
      </div>
      <div className="relative z-10">
        <p className="text-slate-400 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.1em] mb-0.5 sm:mb-1">{label}</p>
        <div className="flex items-baseline gap-1 sm:gap-1.5">
          <h4 className="text-xl sm:text-2xl font-black text-slate-900">
            <AnimatedNumber value={value} />{suffix}
          </h4>
          <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase">{unit}</span>
        </div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-slate-700/50 text-white animate-in zoom-in-95 duration-200">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</p>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
            <div>
              <p className="text-xl font-black leading-none">{payload[0].value.toLocaleString()}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Sqft Installed</p>
            </div>
          </div>
          {payload[1] && (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
              <div>
                <p className="text-xl font-black leading-none">{payload[1].value}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Units Completed</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const VesselTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200/50 animate-in fade-in duration-200">
        <p className="text-sm font-black text-slate-900 mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
          <p className="text-xs font-bold text-cyan-700">{payload[0].value.toLocaleString()} sqft</p>
        </div>
      </div>
    );
  }
  return null;
};

export default Dashboard;
