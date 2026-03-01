import React, { useState, useMemo } from 'react';
import { WeeklyReport } from './types';
import { Plus, Search, Trash2, Edit, Eye, RotateCcw, Download, FileText, CheckCircle2, Clock } from 'lucide-react';
import { exportReportsToPdf } from './services/pdfService';

interface Props {
  reports: WeeklyReport[];
  isTrashView?: boolean;
  canManage: boolean;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
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
  if (!dateStr) return '';
  const s = String(dateStr);
  const parts = s.split(/[-/T ]/);
  if (parts.length >= 3) {
    let y, m, d;
    if (parts[0].length === 4) {
      [y, m, d] = parts;
    } else if (parts[2].length === 4) {
      [m, d, y] = parts;
    } else {
      return s;
    }
    return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`;
  }
  return s;
};

const ReportCard: React.FC<{
  report: WeeklyReport;
  isTrashView?: boolean;
  canManage: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  selectedIds: Set<string>;
  toggleSelect: (id: string, e: React.MouseEvent) => void;
}> = ({ report, isTrashView, canManage, onView, onEdit, onDelete, onRestore, selectedIds, toggleSelect }) => {
  const [isConfirming, setIsConfirming] = React.useState(false);

  // Reset confirmation state after 3 seconds
  React.useEffect(() => {
    if (isConfirming) {
      const timer = setTimeout(() => setIsConfirming(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConfirming]);

  const handleTrashClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isConfirming) {
      onDelete(String(report.id));
      setIsConfirming(false);
    } else {
      setIsConfirming(true);
    }
  };

  return (
    <div 
      className="bg-white p-4 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group relative overflow-hidden"
    >
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        <div className="flex items-center justify-between md:justify-start gap-4">
          {!isTrashView && (
            <div 
              onClick={(e) => toggleSelect(String(report.id), e)}
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${selectedIds.has(String(report.id)) ? 'bg-blue-600 border-blue-600' : 'border-slate-200'}`}
            >
              {selectedIds.has(String(report.id)) && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
          )}
          
          <div className="flex items-center gap-3 md:hidden">
            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)] ${report.compartments.every(c => isQCPassed(c.phases)) ? 'bg-emerald-500' : 'bg-blue-600'}`} />
            <span className="font-black uppercase text-slate-600 tracking-wider text-[10px]">{report.vessel}</span>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="hidden md:flex items-center gap-3 mb-2 cursor-pointer" onClick={() => onView(String(report.id))}>
            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)] ${report.compartments.every(c => isQCPassed(c.phases)) ? 'bg-emerald-500' : 'bg-blue-600'}`} />
            <span className="font-black uppercase text-slate-600 tracking-wider text-[11px]">{report.vessel}</span>
            <span className="text-slate-300 font-light">•</span>
            <span className="font-bold text-slate-900 text-sm">
              {formatDate(report.weekStart)} — {formatDate(report.weekEnd)}
            </span>
          </div>

          <div className="md:hidden mb-2 cursor-pointer" onClick={() => onView(String(report.id))}>
             <span className="font-bold text-slate-900 text-sm">
              {formatDate(report.weekStart)} — {formatDate(report.weekEnd)}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-x-3 gap-y-1 cursor-pointer" onClick={() => onView(String(report.id))}>
            {(report.compartments || []).slice(0, 3).map((comp, cIdx) => (
              <span key={cIdx} className={`text-[10px] md:text-[11px] font-medium ${isQCPassed(comp.phases) ? 'text-emerald-500' : 'text-slate-400'}`}>
                {comp.name}
              </span>
            ))}
            {report.compartments.length > 3 && (
              <span className="text-[10px] md:text-[11px] font-medium text-slate-300">+{report.compartments.length - 3} more</span>
            )}
          </div>
        </div>

        {/* Action Buttons - Integrated into the card flow for better reliability */}
        <div className="flex gap-2 no-print mt-4 md:mt-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onView(String(report.id)); }}
            className="p-3 bg-slate-100 text-slate-600 rounded-xl cursor-pointer hover:bg-slate-200 flex items-center justify-center transition-colors"
            title="View Details"
          >
            <Eye size={18} />
          </button>
          
          {!isTrashView && canManage && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(String(report.id)); }}
                className="p-3 bg-blue-50 text-blue-600 rounded-xl cursor-pointer hover:bg-blue-100 flex items-center justify-center transition-colors"
                title="Edit Report"
              >
                <Edit size={18} />
              </button>
              
              <button 
                onClick={handleTrashClick}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl transition-all duration-300 ${isConfirming ? 'bg-red-600 text-white w-32' : 'bg-red-50 text-red-600 w-12'}`}
                title={isConfirming ? "Click again to confirm" : "Move to Trash"}
              >
                <Trash2 size={18} />
                {isConfirming && <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">Confirm?</span>}
              </button>
            </>
          )}

          {isTrashView && onRestore && (
            <button 
              onClick={(e) => { e.stopPropagation(); onRestore(String(report.id)); }}
              className="p-3 bg-emerald-50 text-emerald-600 rounded-xl cursor-pointer hover:bg-emerald-100 flex items-center justify-center transition-colors"
              title="Restore Report"
            >
              <RotateCcw size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ReportList: React.FC<Props> = ({ reports, isTrashView, canManage, onAdd, onDelete, onRestore, onEdit, onView }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const processedReports = useMemo(() => {
    // 1. Universal Search
    let filtered = (reports || []).filter(r => {
      const searchStr = searchTerm.toLowerCase();
      const inVessel = r.vessel.toLowerCase().includes(searchStr);
      const inAuthor = (r.author || '').toLowerCase().includes(searchStr);
      const inCompartments = (r.compartments || []).some(c => 
        c.name.toLowerCase().includes(searchStr) || 
        c.installer.toLowerCase().includes(searchStr)
      );
      return inVessel || inAuthor || inCompartments;
    });

    // 2. Sort newest first (by updatedAt or createdAt)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [reports, searchTerm]);

  // 3. Grouping by QC Status
  const doneReports = processedReports.filter(r => (r.compartments || []).length > 0 && (r.compartments || []).every(c => isQCPassed(c.phases)));
  const activeReports = processedReports.filter(r => !doneReports.includes(r));

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleBulkExport = () => {
    const selectedReports = reports.filter(r => selectedIds.has(String(r.id)));
    exportReportsToPdf(selectedReports.length > 0 ? selectedReports : processedReports);
  };

  const formatYear = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).getFullYear();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900">{isTrashView ? 'Deleted Archive' : 'Weekly Reports'}</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            {isTrashView ? 'Recover deleted documents' : 'Manage vessel progress reports'}
          </p>
        </div>
        
        <div className="flex gap-3">
          {!isTrashView && (
            <button 
              onClick={handleBulkExport} 
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <Download className="w-4 h-4" /> {selectedIds.size > 0 ? `Export (${selectedIds.size})` : 'Export All'}
            </button>
          )}
          {!isTrashView && canManage && (
            <button 
              onClick={onAdd} 
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" /> New Report
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search vessel, author, or compartment..." 
          className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[2rem] shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-600"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-12">
        {/* Active Section */}
        {activeReports.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">In Progress ({activeReports.length})</h3>
            </div>
            <div className="space-y-4">
              {activeReports.map((report, idx) => (
                <ReportCard 
                  key={`${report.id}-${idx}`}
                  report={report}
                  isTrashView={isTrashView}
                  canManage={canManage}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onRestore={onRestore}
                  selectedIds={selectedIds}
                  toggleSelect={toggleSelect}
                />
              ))}
            </div>
          </section>
        )}

        {/* Done Section */}
        {doneReports.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">QC Passed ({doneReports.length})</h3>
            </div>
            <div className="space-y-4">
              {doneReports.map((report, idx) => (
                <ReportCard 
                  key={`${report.id}-${idx}`}
                  report={report}
                  isTrashView={isTrashView}
                  canManage={canManage}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onRestore={onRestore}
                  selectedIds={selectedIds}
                  toggleSelect={toggleSelect}
                />
              ))}
            </div>
          </section>
        )}
        
        {processedReports.length === 0 && (
          <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-bold italic">No reports found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportList;
