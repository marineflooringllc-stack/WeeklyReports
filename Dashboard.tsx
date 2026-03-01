
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
  Cell
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
  ShieldCheck
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
      avgUnitSize: completedComps > 0 ? Math.round(totalSqft / completedComps) : 0,
      phaseData: Object.entries(phaseDistribution).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      vesselData: Object.entries(vesselProduction).map(([name, sqft]) => ({ name, sqft })).sort((a, b) => b.sqft - a.sqft),
      recentActivities: recentActivities.slice(0, 6)
    };
  }, [reports]);

  const trendData = useMemo(() => {
    return [...reports].sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime())
      .slice(-12)
      .map(r => ({
        date: new Date(r.weekStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        sqft: (r.compartments || []).reduce((acc, c) => acc + (Number(c.sqft) || 0), 0),
        entries: (r.compartments || []).length
      }));
  }, [reports]);

  const installerData = useMemo(() => {
    const map: Record<string, number> = {};
    (reports || []).forEach(r => (r.compartments || []).forEach(c => {
      const name = c.installer || 'Unknown';
      map[name] = (map[name] || 0) + (Number(c.sqft) || 0);
    }));
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return Object.entries(map)
      .map(([name, sqft]) => ({ name, sqft, percent: total > 0 ? (sqft / total) * 100 : 0 }))
      .sort((a, b) => b.sqft - a.sqft)
      .slice(0, 6);
  }, [reports]);

  return (
    <div className="space-y-6 lg:space-y-10 pb-20">
      {/* 1. Enhanced Metric Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard 
          icon={<Layers className="w-5 h-5" />} 
          label="Production" 
          value={`${stats.totalSqft.toLocaleString()}`} 
          unit="sqft"
          color="blue"
        />
        <MetricCard 
          icon={<ShieldCheck className="w-5 h-5" />} 
          label="QC Pass" 
          value={`${stats.qcRate}%`} 
          unit="rate"
          color="emerald"
        />
        <MetricCard 
          icon={<Users className="w-5 h-5" />} 
          label="Crew Size" 
          value={stats.installerCount.toString()} 
          unit="leads"
          color="indigo"
        />
        <MetricCard 
          icon={<Zap className="w-5 h-5" />} 
          label="Avg Unit" 
          value={stats.avgUnitSize.toLocaleString()} 
          unit="sqft"
          color="amber"
        />
        <MetricCard 
          icon={<ShipIcon className="w-5 h-5" />} 
          label="Active Ships" 
          value={stats.vesselCount.toString()} 
          unit="fleet"
          color="cyan"
        />
        <MetricCard 
          icon={<CheckSquare className="w-5 h-5" />} 
          label="Units" 
          value={stats.completedComps.toString()} 
          unit="total"
          color="slate"
        />
      </div>

      {/* 2. Primary Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Main Production Chart */}
        <div className="xl:col-span-8 bg-white p-6 lg:p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                Production Velocity
              </h3>
              <p className="text-slate-500 text-sm mt-1">Installed square footage trend over 12 weeks</p>
            </div>
            <div className="hidden sm:flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                 <span className="text-[10px] font-black uppercase text-slate-400">Total Sqft</span>
               </div>
            </div>
          </div>
          
          <div className="h-[300px] lg:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 2 }} />
                <Area 
                  type="monotone" 
                  dataKey="sqft" 
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#velocityGrad)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vessel Distribution Bar Chart */}
        <div className="xl:col-span-4 bg-white p-6 lg:p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
          <h3 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-3">
             <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center">
              <ShipIcon className="w-5 h-5 text-cyan-600" />
            </div>
            Fleet Breakdown
          </h3>
          <p className="text-slate-500 text-sm mb-8">Production per vessel</p>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.vesselData} layout="vertical" margin={{ left: -15, right: 30 }}>
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
                    <Cell key={`cell-${index}`} fill={['#0891b2', '#0e7490', '#155e75', '#164e63'][index % 4]} />
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
        <div className="xl:col-span-7 bg-white p-6 lg:p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                Lead Performance
              </h3>
              <p className="text-slate-500 text-sm mt-1">Individual contribution by square footage</p>
            </div>
            <TrendingUp className="w-6 h-6 text-slate-200" />
          </div>
          
          <div className="space-y-6">
            {installerData.map((d, i) => (
              <div key={`${d.name}-${i}`} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-slate-900">{d.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                      {i === 0 ? 'Top Gun' : 'Foreman'}
                    </span>
                  </div>
                  <span className="text-xs font-black text-slate-400">
                    {d.sqft.toLocaleString()} <span className="text-[10px] tracking-normal font-bold">SQFT</span>
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out rounded-full ${i === 0 ? 'bg-indigo-600' : 'bg-indigo-400'}`}
                    style={{ width: `${d.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase Pipeline */}
        <div className="xl:col-span-5 bg-slate-900 p-6 lg:p-8 rounded-[2.5rem] shadow-xl text-white">
          <h3 className="text-xl font-black flex items-center gap-3 mb-6">
             <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
              <History className="w-5 h-5 text-blue-400" />
            </div>
            Production Pipeline
          </h3>

          <div className="space-y-4">
            {stats.phaseData.slice(0, 5).map((phase, idx) => (
              <div key={`${phase.name}-${idx}`} className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <span className="text-lg font-black text-blue-400">{phase.value}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-0.5 truncate">{phase.name}</p>
                  <div className="w-full h-1 bg-white/5 rounded-full mt-2">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: `${(phase.value / stats.completedComps) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-white/10">
            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">Latest Operations</h4>
            <div className="space-y-4">
              {stats.recentActivities.slice(0, 3).map((act, i) => (
                <div key={`${act.vessel}-${act.comp}-${act.phase}-${i}`} className="flex items-start gap-4">
                  <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${act.phase.includes('Passed') ? 'bg-emerald-400' : 'bg-blue-400 animate-pulse'}`}></div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-white leading-none mb-1 truncate">{act.phase}</p>
                    <p className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">{act.vessel} • {act.comp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const MetricCard = ({ icon, label, value, unit, color }: { icon: React.ReactNode, label: string, value: string, unit: string, color: string }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600 text-white',
    emerald: 'bg-emerald-600 text-white',
    indigo: 'bg-indigo-600 text-white',
    amber: 'bg-amber-500 text-white',
    cyan: 'bg-cyan-600 text-white',
    slate: 'bg-slate-800 text-white'
  };

  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 group transition-all hover:shadow-xl hover:-translate-y-1">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.1em] mb-1">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <h4 className="text-2xl font-black text-slate-900">{value}</h4>
          <span className="text-[9px] font-black text-slate-400 uppercase">{unit}</span>
        </div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-800 text-white animate-in zoom-in-95 duration-200">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{label}</p>
        <div className="flex items-center gap-3">
           <div className="w-1 h-8 bg-blue-500 rounded-full"></div>
           <div>
              <p className="text-xl font-black">{payload[0].value.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Square Feet Installed</p>
           </div>
        </div>
      </div>
    );
  }
  return null;
};

const VesselTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 animate-in fade-in duration-200">
        <p className="text-sm font-black text-slate-900 mb-1">{label}</p>
        <p className="text-xs font-bold text-cyan-600">{payload[0].value.toLocaleString()} sqft production</p>
      </div>
    );
  }
  return null;
};

export default Dashboard;
