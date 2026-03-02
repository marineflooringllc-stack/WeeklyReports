import React, { useState, useMemo } from 'react';
import { AuditLogEntry } from './types';
/* Added ShieldCheck to imports */
import { 
  Search, 
  Clock, 
  User, 
  History, 
  Zap,
  ArrowRight,
  Trash2,
  RotateCcw,
  FilePlus,
  LogIn,
  LogOut,
  Ship,
  LayoutGrid,
  CalendarDays,
  ShieldCheck
} from 'lucide-react';

interface Props {
  logs: AuditLogEntry[];
}

const AuditLogView: React.FC<Props> = ({ logs }) => {
  const [search, setSearch] = useState('');

  const filteredLogs = useMemo(() => {
    return (logs || [])
      .filter(l => 
        l.user?.toLowerCase().includes(search.toLowerCase()) ||
        l.action?.toLowerCase().includes(search.toLowerCase()) ||
        l.details?.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, search]);

  const getActionTheme = (action: string) => {
    const act = (action || '').toLowerCase();
    if (act.includes('delete')) return { badge: 'bg-red-50 text-red-600 border-red-100', icon: <Trash2 className="w-3.5 h-3.5" /> };
    if (act.includes('create') || act.includes('add')) return { badge: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <FilePlus className="w-3.5 h-3.5" /> };
    if (act.includes('update') || act.includes('edit')) return { badge: 'bg-blue-50 text-blue-600 border-blue-100', icon: <Zap className="w-3.5 h-3.5" /> };
    if (act.includes('login')) return { badge: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: <LogIn className="w-3.5 h-3.5" /> };
    if (act.includes('logout')) return { badge: 'bg-slate-50 text-slate-500 border-slate-100', icon: <LogOut className="w-3.5 h-3.5" /> };
    if (act.includes('restore')) return { badge: 'bg-amber-50 text-amber-600 border-amber-100', icon: <RotateCcw className="w-3.5 h-3.5" /> };
    return { badge: 'bg-slate-50 text-slate-600 border-slate-100', icon: <History className="w-3.5 h-3.5" /> };
  };

  const timeAgo = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
      return past.toLocaleDateString();
    } catch (e) { return dateStr; }
  };

  return (
    <div className="space-y-6 mx-auto pb-24">
      {/* Header & Search */}
      <div className="bg-white p-4 lg:p-6 rounded-[2rem] border shadow-sm flex flex-col sm:flex-row gap-4 items-center sticky top-4 z-20">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search forensic history..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 px-6 py-3 bg-slate-900 text-white rounded-2xl shrink-0 w-full sm:w-auto justify-center">
          <History className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-black uppercase tracking-widest">{filteredLogs.length} Records</span>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {filteredLogs.map((log, idx) => {
          const { badge, icon } = getActionTheme(log.action);
          const actionLower = (log.action || '').toLowerCase();
          const detailsStr = log.details || '';

          return (
            <div key={`${log.id}-${idx}`} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 lg:p-6 hover:shadow-md transition-shadow animate-in slide-in-from-bottom-2 duration-300">
              {/* Card Header: Action & Time */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${badge}`}>
                  {icon}
                  {log.action}
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{timeAgo(log.timestamp)}</span>
                  <span className="text-[9px] font-bold opacity-60">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* User Identity Row */}
              <div className="flex items-center gap-2 mb-4 p-2 bg-slate-50 rounded-xl w-fit border border-slate-100">
                <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center border text-[10px] font-black text-slate-500">
                  {(log.user || '?').charAt(0)}
                </div>
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">Foreman: {log.user || 'Unknown'}</span>
              </div>

              {/* Detailed Content */}
              <div className="mt-2">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-700 leading-relaxed break-words font-mono">
                    {log.details || 'No additional details recorded.'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        
        {filteredLogs.length === 0 && (
          <div className="py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <History className="w-12 h-12 text-slate-100 mx-auto mb-4" />
            <p className="text-slate-400 font-black italic">No history matches your filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogView;
