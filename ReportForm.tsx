import React, { useState } from 'react';
import { WeeklyReport, Compartment, WorkPhase } from './types';
import { Save, X, Plus, Trash2, CheckCircle2, Circle, Calendar } from 'lucide-react';

interface Props {
  initialData?: WeeklyReport;
  onSubmit: (report: WeeklyReport) => void;
  onCancel: () => void;
  currentUser?: string;
}

const toLocalISO = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  return toLocalISO(monday);
};

const getSunday = (d: Date) => {
  const mondayStr = getMonday(d);
  const monday = new Date(mondayStr + 'T00:00:00');
  const sunday = new Date(monday.setDate(monday.getDate() + 6));
  return toLocalISO(sunday);
};

const toYYYYMMDD = (dateStr: any) => {
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
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return s;
};

const ReportForm: React.FC<Props> = ({ initialData, onSubmit, onCancel, currentUser }) => {
  const [vessel, setVessel] = useState(initialData?.vessel || '');
  const [weekStart, setWeekStart] = useState(toYYYYMMDD(initialData?.weekStart) || getMonday(new Date()));
  const [weekEnd, setWeekEnd] = useState(toYYYYMMDD(initialData?.weekEnd) || getSunday(new Date()));
  const [author, setAuthor] = useState(() => {
    if (initialData?.author && initialData.author !== 'Unknown') return initialData.author;
    return currentUser || '';
  });
  const [compartments, setCompartments] = useState<Compartment[]>(initialData?.compartments || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addCompartment = () => {
    const lastVessel = compartments.length > 0 ? compartments[compartments.length - 1].vessel : vessel;
    const newComp: Compartment = {
      id: Math.random().toString(36).substr(2, 9),
      vessel: lastVessel,
      name: '',
      type: 'General',
      startDate: weekStart,
      endDate: weekEnd,
      sqft: undefined as any,
      installer: '',
      phases: [],
      qcPassed: false
    };
    setCompartments([...compartments, newComp]);
  };

  const removeCompartment = (id: string) => {
    setCompartments(compartments.filter(c => c.id !== id));
  };

  const updateCompartment = (id: string, updates: Partial<Compartment>) => {
    setCompartments(compartments.map(c => {
      if (c.id === id) {
        if (updates.vessel !== undefined) setVessel(updates.vessel);
        return { ...c, ...updates };
      }
      return c;
    }));
  };

  const addPhase = (compId: string) => {
    const newPhase: WorkPhase = {
      date: new Date().toISOString().split('T')[0],
      description: ''
    };
    setCompartments(compartments.map(c => 
      c.id === compId ? { ...c, phases: [...(c.phases || []), newPhase] } : c
    ));
  };

  const updatePhase = (compId: string, phaseIdx: number, updates: Partial<WorkPhase>) => {
    setCompartments(compartments.map(c => {
      if (c.id === compId) {
        const newPhases = [...(c.phases || [])];
        newPhases[phaseIdx] = { ...newPhases[phaseIdx], ...updates };
        return { ...c, phases: newPhases };
      }
      return c;
    }));
  };

  const removePhase = (compId: string, phaseIdx: number) => {
    setCompartments(compartments.map(c => {
      if (c.id === compId) {
        return { ...c, phases: (c.phases || []).filter((_, i) => i !== phaseIdx) };
      }
      return c;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        id: initialData?.id || Date.now().toString(),
        vessel: compartments[0]?.vessel || vessel || '',
        weekStart,
        weekEnd,
        compartments,
        author,
        updatedAt: new Date().toISOString(),
        createdAt: initialData?.createdAt || new Date().toISOString(),
        editLog: initialData?.editLog || []
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white p-8 rounded-[2.5rem] shadow-2xl space-y-8 border border-slate-100">
      <div className="flex justify-between items-center border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900">{initialData ? 'Edit Weekly Report' : 'Create New Report'}</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Vessel Progress & Quality Control</p>
        </div>
        <button type="button" onClick={onCancel} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400"><X size={24} /></button>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Author / Foreman</label>
          <input 
            type="text" 
            value={author} 
            readOnly
            className="w-full p-4 bg-slate-100 border border-slate-100 rounded-2xl outline-none font-bold text-slate-400 cursor-not-allowed"
            required 
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Week Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="date" 
                value={weekStart} 
                onChange={e => setWeekStart(e.target.value)} 
                className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-slate-700"
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Week End Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="date" 
                value={weekEnd} 
                onChange={e => setWeekEnd(e.target.value)} 
                className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-slate-700"
                required 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-900">Compartments</h3>
          <button 
            type="button" 
            onClick={addCompartment}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all"
          >
            <Plus size={18} /> Add Compartment
          </button>
        </div>

        <div className="space-y-6">
          {compartments.map((comp, idx) => (
            <div key={comp.id} className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl space-y-4 relative group">
              <button 
                type="button" 
                onClick={() => removeCompartment(comp.id)}
                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vessel Name</label>
                  <input 
                    type="text" 
                    value={comp.vessel} 
                    onChange={e => updateCompartment(comp.id, { vessel: e.target.value })}
                    placeholder="e.g. USS NIMITZ"
                    className="w-full p-3 bg-white border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Name</label>
                  <input 
                    type="text" 
                    value={comp.name} 
                    onChange={e => updateCompartment(comp.id, { name: e.target.value })}
                    placeholder="e.g. C-201-L"
                    className="w-full p-3 bg-white border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">SqFt</label>
                  <input 
                    type="number" 
                    value={comp.sqft || ''} 
                    onChange={e => updateCompartment(comp.id, { sqft: e.target.value === '' ? undefined : Number(e.target.value) })}
                    placeholder="Enter SqFt"
                    className="w-full p-3 bg-white border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Lead Installer</label>
                  <input 
                    type="text" 
                    value={comp.installer} 
                    onChange={e => updateCompartment(comp.id, { installer: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700"
                  />
                </div>
              </div>

              {/* QC Passed is now derived from phases, so we remove the manual toggle */}

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Work Phases</p>
                  <button 
                    type="button" 
                    onClick={() => addPhase(comp.id)}
                    className="text-xs font-bold text-blue-500 hover:underline"
                  >
                    + Add Phase
                  </button>
                </div>
                <div className="space-y-2">
                  {(comp.phases || []).map((phase, pIdx) => (
                    <div key={pIdx} className="flex gap-2 items-start">
                      <input 
                        type="date" 
                        value={phase.date} 
                        onChange={e => updatePhase(comp.id, pIdx, { date: e.target.value })}
                        className="p-2 bg-white border border-slate-100 rounded-lg text-xs font-bold outline-none"
                      />
                      <input 
                        type="text" 
                        value={phase.description} 
                        onChange={e => updatePhase(comp.id, pIdx, { description: e.target.value })}
                        placeholder="Type phase here"
                        className="flex-1 p-2 bg-white border border-slate-100 rounded-lg text-xs font-medium outline-none"
                      />
                      <button 
                        type="button" 
                        onClick={() => removePhase(comp.id, pIdx)}
                        className="p-2 text-slate-300 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {compartments.length === 0 && (
            <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
              <p className="text-slate-400 font-bold italic">No compartments added yet.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-8 border-t border-slate-100">
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-8 py-4 font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest text-xs"
        >
          Discard Changes
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`px-10 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center gap-2 uppercase tracking-widest text-xs ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
        >
          <Save size={18} /> {isSubmitting ? 'Saving...' : (initialData ? 'Update Report' : 'Save Report')}
        </button>
      </div>
    </form>
  );
};

export default ReportForm;
