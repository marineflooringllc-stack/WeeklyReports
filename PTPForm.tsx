
import React, { useState } from 'react';
import { PreTaskPlan, PTPStep } from './types';
import { Save, X, Plus, Trash2, ShieldAlert, ClipboardCheck, Info, HardHat, PenTool, Loader2 } from 'lucide-react';

interface Props {
  initialData?: PreTaskPlan;
  onSubmit: (ptp: PreTaskPlan) => void;
  onCancel: () => void;
}

const HAZARD_OPTIONS = [
  "Pinch Points", "Thermal Burns", "Particles in Eyes", "Elevated Work", "Poor Housekeeping", 
  "Electrical Shock", "Chemical Burns", "Fire/Explosion", "Inadequate Access", "High Noise levels", 
  "Falling Objects", "Manual Lifting", "Chemical Spill", "Plant Operations", "Scaffolding", 
  "Mobile Equipment", "Hazardous Chemicals", "Heat Exhaustion/Stress", "Sharp Objects or Tools", 
  "Radiation", "Excavations", "Lockout/Tagout", "Ladders", "Rigging", "Falls from Elevations", 
  "Confined Spaces", "Line Breaking", "Inhalation Hazard", "Critical Lift", "Other"
];

const PPE_OPTIONS = [
  "Hard Hat", "Eye Protection", "Ear Protection", "Gloves", "Respirators", "Safety Approved Boots", "Knee Pads"
];

const PTPForm: React.FC<Props> = ({ initialData, onSubmit, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PreTaskPlan>(initialData || {
    id: Date.now().toString(),
    date: new Date().toISOString().split('T')[0],
    description: '',
    supervisor: 'Wayne Richardson',
    location: '',
    company: 'Marine Flooring LLC',
    evaluation: {
      walkedArea: true,
      liveSystems: null,
      specialTraining: false,
      msdsReview: false,
      airMonitoring: false,
      workPermits: true,
      evacuationRoutes: true,
      emergencyEquipment: true, // Defaulting to true (Yes) as requested
      congestedArea: null,
      ppeNeeded: true,
      toolsProvided: true,
      toolsInspected: true,
      confinedSpace: null,
      safetyDeptInvolved: false,
      safetyIssueNotAddressed: false
    },
    hazards: [],
    ppe: [...PPE_OPTIONS],
    steps: [{ description: '', hazards: '', actions: '' }],
    author: '',
    createdAt: ''
  });

  const toggleHazard = (hazard: string) => {
    setFormData(prev => ({
      ...prev,
      hazards: prev.hazards.includes(hazard) 
        ? prev.hazards.filter(h => h !== hazard) 
        : [...prev.hazards, hazard]
    }));
  };

  const togglePPE = (ppe: string) => {
    setFormData(prev => ({
      ...prev,
      ppe: prev.ppe.includes(ppe) 
        ? prev.ppe.filter(p => p !== ppe) 
        : [...prev.ppe, ppe]
    }));
  };

  const setEval = (key: keyof PreTaskPlan['evaluation'], val: boolean) => {
    setFormData(prev => ({
      ...prev,
      evaluation: { ...prev.evaluation, [key]: val }
    }));
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { description: '', hazards: '', actions: '' }]
    }));
  };

  const updateStep = (index: number, updates: Partial<PTPStep>) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((s, i) => i === index ? { ...s, ...updates } : s)
    }));
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onSubmit(formData);
  };

  return (
    <div className="space-y-6 lg:space-y-8 pb-32">
      {/* General Info */}
      <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2"><Info className="w-5 h-5 text-blue-500" /> General Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div><label className="text-[10px] font-black uppercase text-slate-400">Date</label><input type="date" className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
          <div><label className="text-[10px] font-black uppercase text-slate-400">Location of Task</label><input className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. CVN-74 Deck 2" /></div>
          <div><label className="text-[10px] font-black uppercase text-slate-400">Supervisor</label><input className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.supervisor} onChange={e => setFormData({...formData, supervisor: e.target.value})} placeholder="Lead Foreman" /></div>
          <div><label className="text-[10px] font-black uppercase text-slate-400">Company</label><input className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} /></div>
        </div>
        <div className="mt-4">
          <label className="text-[10px] font-black uppercase text-slate-400">Description of Activity</label>
          <textarea className="w-full p-3 bg-slate-50 border rounded-xl h-20 outline-none focus:ring-2 focus:ring-blue-500" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Work scope overview..." />
        </div>
      </section>

      {/* Evaluation Checklist */}
      <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-emerald-500" /> Evaluation Checklist</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {[
            { label: "Have you walked your area?", key: "walkedArea" },
            { label: "Working around live systems?", key: "liveSystems" },
            { label: "Special training required?", key: "specialTraining" },
            { label: "MSDS review necessary?", key: "msdsReview" },
            { label: "Air monitoring required?", key: "airMonitoring" },
            { label: "Are work permits required for this task?", key: "workPermits" },
            { label: "Are you familiar with evaluation routes?", key: "evacuationRoutes" },
            { label: "Has emergency equipment such as fire extinguishers, eyewash stations, safety showers, and phones been located?", key: "emergencyEquipment" },
            { label: "If the work area is congested, has the work plan been coordinated with other crafts?", key: "congestedArea" },
            { label: "Do you have the PPE needed for this task?", key: "ppeNeeded" },
            { label: "Are the required materials and tools provided?", key: "toolsProvided" },
            { label: "Have all tools/equipment been inspected before use?", key: "toolsInspected" },
            { label: "Confined space involved?", key: "confinedSpace" },
            { label: "Safety Dept. involved in planning?", key: "safetyDeptInvolved" },
            { label: "Any unaddressed safety issues?", key: "safetyIssueNotAddressed" },
          ].map((q) => (
            <div key={q.key} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-slate-50 gap-2">
              <span className="text-sm font-bold text-slate-700 leading-tight">{q.label}</span>
              <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                <button type="button" onClick={() => setEval(q.key as any, true)} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${formData.evaluation[q.key as keyof PreTaskPlan['evaluation']] === true ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>YES</button>
                <button type="button" onClick={() => setEval(q.key as any, false)} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${formData.evaluation[q.key as keyof PreTaskPlan['evaluation']] === false ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>NO</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hazards & PPE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
          <h3 className="text-xl font-black mb-6 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-red-500" /> Potential Hazards</h3>
          <div className="grid grid-cols-2 gap-2">
            {HAZARD_OPTIONS.map((hazard, idx) => (
              <button key={`${hazard}-${idx}`} type="button" onClick={() => toggleHazard(hazard)} className={`text-left px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${formData.hazards.includes(hazard) ? 'bg-red-600 border-red-500' : 'bg-white/5 border-white/10 text-white/40'}`}>
                {hazard}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-black mb-6 flex items-center gap-2"><HardHat className="w-5 h-5 text-indigo-500" /> PPE Required</h3>
          <div className="grid grid-cols-2 gap-4">
            {PPE_OPTIONS.map((ppe, idx) => (
              <button key={`${ppe}-${idx}`} type="button" onClick={() => togglePPE(ppe)} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-xs font-bold ${formData.ppe.includes(ppe) ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                <div className={`w-4 h-4 rounded flex items-center justify-center border ${formData.ppe.includes(ppe) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200'}`}>
                  {formData.ppe.includes(ppe) && <PenTool className="w-2.5 h-2.5" />}
                </div>
                {ppe}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Step Plan */}
      <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black">Step-by-Step Plan</h3>
          <button type="button" onClick={addStep} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Add Step</button>
        </div>
        <div className="space-y-4">
          {formData.steps.map((step, idx) => (
            <div key={`step-${idx}`} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
              <button type="button" onClick={() => setFormData({...formData, steps: formData.steps.filter((_, i) => i !== idx)})} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div><label className="text-[10px] font-black uppercase text-slate-400">Work Performed</label><textarea className="w-full p-2 bg-white border rounded-xl text-sm h-24 outline-none focus:ring-2 focus:ring-blue-500" value={step.description} onChange={e => updateStep(idx, { description: e.target.value })} /></div>
                <div><label className="text-[10px] font-black uppercase text-slate-400">Associated Hazards</label><textarea className="w-full p-2 bg-white border rounded-xl text-sm h-24 outline-none focus:ring-2 focus:ring-blue-500" value={step.hazards} onChange={e => updateStep(idx, { hazards: e.target.value })} /></div>
                <div><label className="text-[10px] font-black uppercase text-slate-400">Required Mitigation</label><textarea className="w-full p-2 bg-white border rounded-xl text-sm h-24 outline-none focus:ring-2 focus:ring-blue-500" value={step.actions} onChange={e => updateStep(idx, { actions: e.target.value })} /></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="fixed bottom-0 left-0 lg:left-72 right-0 bg-white/90 backdrop-blur-md p-4 border-t flex gap-3 z-30">
        <button type="button" onClick={onCancel} className="flex-1 py-3 border rounded-2xl font-bold hover:bg-slate-50 transition-colors">Cancel</button>
        <button type="button" disabled={isSubmitting} onClick={handleSubmit} className="flex-[2] py-3 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-blue-200 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Pre-Task Plan
        </button>
      </div>
    </div>
  );
};

export default PTPForm;
