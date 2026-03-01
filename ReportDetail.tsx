import React from 'react';
import { WeeklyReport } from './types';
import { ArrowLeft, Edit, RotateCcw } from 'lucide-react';

interface Props {
  report: WeeklyReport;
  isDeleted?: boolean;
  canManage: boolean;
  onBack: () => void;
  onEdit: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}

const isQCPassed = (phases: any[]) => {
  const synonyms = [
    'qc pass', 'qc passed', 'qc inspected', 'qc check', 'qc checked'
  ];
  return (phases || []).some(p => 
    synonyms.some(s => (p.description || '').toLowerCase().includes(s))
  );
};

const formatDate = (dateStr: any) => {
  if (!dateStr) return 'N/A';
  const s = String(dateStr);
  // Robust parsing for YYYY-MM-DD or MM/DD/YYYY or ISO strings
  const parts = s.split(/[-/T ]/);
  if (parts.length >= 3) {
    let y, m, d;
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      [y, m, d] = parts;
    } else if (parts[2].length === 4) {
      // MM/DD/YYYY
      [m, d, y] = parts;
    } else {
      return s;
    }
    return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`;
  }
  return s;
};

const ReportDetail: React.FC<Props> = ({ report, isDeleted, canManage, onBack, onEdit, onRestore, onDelete }) => {
  // Check multiple possible property names for author and dates
  const getAuthor = () => {
    const r = report as any;
    
    // 1. Primary: Use the mapped author field from SheetService (Column G)
    const authorVal = report.author || r.Author || r.author || r.Foreman || r.foreman;
    
    if (authorVal && authorVal !== 'Unknown' && String(authorVal).trim() !== '') {
      return String(authorVal);
    }

    // 2. Secondary: Try to find from edit log history
    if (report.editLog && Array.isArray(report.editLog) && report.editLog.length > 0) {
      const createdEntry = report.editLog.find(e => e.action === 'created');
      if (createdEntry && createdEntry.user && createdEntry.user !== 'Unknown') return createdEntry.user;
    }
    
    return 'Unknown';
  };

  const authorDisplay = getAuthor();
  const weekStart = report.weekStart || (report as any).WeekStart;
  const weekEnd = report.weekEnd || (report as any).WeekEnd;

  const qcPassedCount = (report.compartments || []).filter(c => isQCPassed(c.phases)).length;
  const totalCompartments = (report.compartments || []).length;
  const isFullyPassed = totalCompartments > 0 && qcPassedCount === totalCompartments;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold">
          <ArrowLeft size={20} /> Back to List
        </button>
        <div className="flex gap-3 relative z-[100]">
          {!isDeleted && canManage && (
            <>
              <button onClick={() => onEdit(String(report.id))} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all cursor-pointer">
                <Edit size={20} /> Edit
              </button>
            </>
          )}
          {isDeleted && canManage && (
            <button onClick={() => onRestore(String(report.id))} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-all">
              <RotateCcw size={20} /> Restore
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl border">
        <div className="border-b pb-6 mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black text-slate-900">{report.vessel}</h2>
            <p className="text-slate-500 mt-1">
              Author: <span className="font-bold text-slate-700">{authorDisplay}</span> 
              <span className="mx-2">•</span> 
              Period: <span className="font-bold text-slate-700">{formatDate(weekStart)} — {formatDate(weekEnd)}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Updated</p>
            <p className="font-bold text-slate-600">{new Date(report.updatedAt || report.createdAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-8">
          {(report.compartments || []).map((comp, idx) => (
            <div key={`${comp.id}-${idx}`} className="border border-slate-100 rounded-[2rem] p-8 bg-slate-50/30">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{comp.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{comp.type || 'General Compartment'}</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isQCPassed(comp.phases) ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                  {isQCPassed(comp.phases) ? 'QC Passed' : 'In Progress'}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                <div>
                  <span className="text-slate-400 uppercase font-black text-[10px] tracking-widest block mb-1">SqFt</span>
                  <p className="font-bold text-slate-900">{comp.sqft || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-black text-[10px] tracking-widest block mb-1">Lead Installer</span>
                  <p className="font-bold text-slate-900">{comp.installer || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-black text-[10px] tracking-widest block mb-1">Start Date</span>
                  <p className="font-bold text-slate-900">{formatDate(comp.startDate || weekStart)}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-black text-[10px] tracking-widest block mb-1">End Date</span>
                  <p className="font-bold text-slate-900">{formatDate(comp.endDate || weekEnd)}</p>
                </div>
              </div>

              {comp.phases && comp.phases.length > 0 && (
                <div className="space-y-3">
                  <span className="text-slate-400 uppercase font-black text-[10px] tracking-widest block">Work Phases</span>
                  <div className="space-y-2">
                    {comp.phases.map((phase, pIdx) => (
                      <div key={pIdx} className="flex gap-4 items-start bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg whitespace-nowrap">{formatDate(phase.date)}</span>
                        <p className="text-sm font-medium text-slate-600">{phase.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;
