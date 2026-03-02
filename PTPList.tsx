
import React, { useState, useMemo } from 'react';
import { PreTaskPlan } from './types';
import { 
  ShieldAlert, 
  Calendar, 
  Eye, 
  Edit, 
  Trash2, 
  X, 
  Printer, 
  CheckSquare, 
  Square, 
  Search, 
  MapPin, 
  ListChecks, 
  AlertTriangle, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Plus
} from 'lucide-react';

interface Props {
  ptps: PreTaskPlan[];
  isTrashView?: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onRestore?: (id: string) => void;
  onBulkPrint: (ids: string[]) => void;
}

type SortKey = 'location' | 'date' | 'description';
type SortOrder = 'asc' | 'desc';

const PTPList: React.FC<Props> = ({ ptps, isTrashView = false, onView, onEdit, onDelete, onAdd, onRestore, onBulkPrint }) => {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const isPtpComplete = (ptp: PreTaskPlan) => {
    const questions = Object.values(ptp.evaluation);
    return questions.length > 0 && questions.every(v => v !== null);
  };

  const filteredAndSortedPtps = useMemo(() => {
    let result = [...(ptps || [])];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.description?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.supervisor?.toLowerCase().includes(q) ||
        p.author?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';
      if (sortKey === 'date') {
        valA = new Date(a.date).getTime();
        valB = new Date(b.date).getTime();
      } else {
        const key = sortKey as keyof PreTaskPlan;
        valA = (String(a[key] || '')).toLowerCase();
        valB = (String(b[key] || '')).toLowerCase();
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [ptps, searchQuery, sortKey, sortOrder]);

  const stats = useMemo(() => {
    return filteredAndSortedPtps.reduce((acc, p) => ({
      hazards: acc.hazards + p.hazards.length,
      ppe: acc.ppe + p.ppe.length,
      steps: acc.steps + p.steps.length,
      incomplete: acc.incomplete + (isPtpComplete(p) ? 0 : 1)
    }), { hazards: 0, ppe: 0, steps: 0, incomplete: 0 });
  }, [filteredAndSortedPtps]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const toggleSelection = (id: string) => {
    const sId = String(id);
    setSelectedIds(prev => 
      prev.includes(sId) ? prev.filter(i => i !== sId) : [...prev, sId]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredAndSortedPtps.length && filteredAndSortedPtps.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedPtps.map(p => String(p.id)));
    }
  };

  if ((ptps || []).length === 0 && !searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 px-6 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-slate-200" />
        </div>
        <h3 className="text-xl font-black text-slate-900">
          {isTrashView ? 'Trash is Empty' : 'No Pre-Task Plans Found'}
        </h3>
        <p className="text-slate-400 mt-2 text-sm max-w-xs font-medium">
          {isTrashView ? 'Deleted safety plans will appear here.' : 'Generate your first safety plan to populate the database.'}
        </p>
        {!isTrashView && (
          <button onClick={onAdd} className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 flex items-center gap-2 transition-all">
            <Plus className="w-5 h-5" /> Start New Plan
          </button>
        )}
      </div>
    );
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" /> : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Search and Action Bar */}
      <div className="bg-white p-4 lg:p-6 rounded-3xl lg:rounded-[2rem] shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between sticky top-4 z-20">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search location, task..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {!isTrashView && (
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={onAdd}
              className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 shadow-xl transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Plan
            </button>
            {selectedIds.length > 0 && (
              <button 
                type="button"
                onClick={() => onBulkPrint(selectedIds)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 whitespace-nowrap"
              >
                <Printer className="w-4 h-4" /> Print ({selectedIds.length})
              </button>
            )}
            <button 
              type="button"
              onClick={selectAll}
              className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 transition-colors"
              title="Select All"
            >
              {selectedIds.length === filteredAndSortedPtps.length && filteredAndSortedPtps.length > 0 ? (
                <CheckSquare className="w-5 h-5 text-blue-600" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Summary Insights Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        <SummaryItem label="Plans" value={filteredAndSortedPtps.length} icon={<ListChecks className="text-blue-500" />} />
        <SummaryItem label="Hazards" value={stats.hazards} icon={<AlertTriangle className="text-red-500" />} />
        <SummaryItem 
          label="Drafts" 
          value={stats.incomplete} 
          icon={<AlertCircle className={stats.incomplete > 0 ? "text-amber-500" : "text-emerald-500"} />} 
          highlight={stats.incomplete > 0}
        />
      </div>

      {/* Desktop Table View */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-100">
              <th className="p-5 w-14 text-center">
                {!isTrashView && (
                  <button 
                    type="button"
                    onClick={selectAll}
                    className="w-5 h-5 inline-flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    {selectedIds.length === filteredAndSortedPtps.length && filteredAndSortedPtps.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                )}
              </th>
              <th 
                className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-blue-600 transition-colors select-none"
                onClick={() => toggleSort('location')}
              >
                <div className="flex items-center">Location <SortIcon k="location" /></div>
              </th>
              <th 
                className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-blue-600 transition-colors select-none"
                onClick={() => toggleSort('date')}
              >
                <div className="flex items-center">Date & Plan <SortIcon k="date" /></div>
              </th>
              <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Security Status</th>
              <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Safety Loadout</th>
              <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredAndSortedPtps.map((ptp, idx) => {
              const sId = String(ptp.id);
              const isSelected = selectedIds.includes(sId);
              const isDeleting = confirmDelete === sId;
              const complete = isPtpComplete(ptp);

              return (
                <tr 
                  key={`${sId}-${idx}`}
                  className={`group transition-all hover:bg-slate-50/50 ${isSelected ? 'bg-blue-50/40' : ''}`}
                >
                  <td className="p-5 text-center">
                    {!isTrashView && (
                      <button 
                        type="button"
                        onClick={() => toggleSelection(sId)}
                        className="w-5 h-5 inline-flex items-center justify-center transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-200 group-hover:text-slate-300" />
                        )}
                      </button>
                    )}
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <span className="text-sm font-bold text-slate-900 leading-tight">{ptp.location}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-blue-600 text-white scale-110' : 'bg-slate-900 text-white'}`}>
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate max-w-[250px]">{ptp.description}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-black uppercase tracking-wider mt-0.5">
                          <Calendar className="w-3 h-3 text-blue-400" />
                          {new Date(ptp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex justify-center">
                      {complete ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-widest">
                          <CheckCircle2 className="w-3 h-3" />
                          Validated
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[9px] font-black uppercase tracking-widest">
                          <Info className="w-3 h-3" />
                          Draft
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center justify-center gap-2.5">
                      <StatBadge icon={<AlertTriangle className="w-3 h-3" />} count={ptp.hazards.length} color="red" />
                      <StatBadge icon={<ListChecks className="w-3 h-3" />} count={ptp.steps.length} color="blue" />
                    </div>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isTrashView ? (
                        <button 
                          onClick={() => onRestore?.(sId)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </button>
                      ) : (
                        isDeleting ? (
                          <div className="flex items-center gap-1 animate-in slide-in-from-right-2">
                            <button 
                              onClick={() => setConfirmDelete(null)}
                              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                onDelete(sId);
                                setConfirmDelete(null);
                              }}
                              className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-100"
                            >
                              Confirm Delete
                            </button>
                          </div>
                        ) : (
                          <>
                            <ActionBtn onClick={() => onView(sId)} icon={<Eye className="w-4 h-4" />} color="blue" tooltip="View Plan" />
                            <ActionBtn onClick={() => onEdit(sId)} icon={<Edit className="w-4 h-4" />} color="indigo" tooltip="Edit Plan" />
                            <ActionBtn onClick={() => setConfirmDelete(sId)} icon={<Trash2 className="w-4 h-4" />} color="red" tooltip="Delete Plan" />
                          </>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SummaryItem = ({ label, value, icon, highlight }: { label: string, value: number, icon: React.ReactNode, highlight?: boolean }) => (
  <div className={`bg-white p-3 lg:p-5 rounded-2xl lg:rounded-3xl border transition-all ${highlight ? 'border-amber-200 ring-4 ring-amber-50 shadow-md' : 'border-slate-100 shadow-sm'}`}>
    <div className="flex items-center justify-between mb-1 lg:mb-2">
      <div className="p-1.5 lg:p-2 bg-slate-50 rounded-lg lg:rounded-xl">{icon}</div>
      <span className={`text-sm lg:text-xl font-black ${highlight ? 'text-amber-600' : 'text-slate-900'}`}>{value}</span>
    </div>
    <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
  </div>
);

const StatBadge = ({ icon, count, color }: { icon: React.ReactNode, count: number, color: 'red' | 'indigo' | 'blue' }) => {
  const colors = {
    red: 'bg-red-50 text-red-600 border-red-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100'
  };
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${colors[color]} font-black text-[10px] shadow-sm`}>
      {icon}
      {count}
    </div>
  );
};

const ActionBtn = ({ onClick, icon, color, tooltip }: { onClick: () => void, icon: React.ReactNode, color: 'blue' | 'red' | 'indigo', tooltip: string }) => {
  const colors = {
    blue: 'hover:text-blue-600 hover:bg-blue-50 active:bg-blue-100 text-slate-300',
    red: 'hover:text-red-600 hover:bg-red-50 active:bg-red-100 text-slate-300',
    indigo: 'hover:text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 text-slate-300'
  };
  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`p-2 lg:p-2.5 transition-all rounded-xl ${colors[color]}`}
      title={tooltip}
    >
      {icon}
    </button>
  );
};

export default PTPList;
