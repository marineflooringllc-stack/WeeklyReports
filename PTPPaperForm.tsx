import React from 'react';
import { PreTaskPlan } from './types';

interface Props {
  ptp: PreTaskPlan;
}

const HAZARD_LIST = [
  "Pinch Points", "Thermal Burns", "Particles in Eyes", "Elevated Work", "Poor Housekeeping",
  "Electrical Shock", "Chemical Burns", "Fire/Explosion", "Inadequate Access", "High Noise levels",
  "Falling Objects", "Manual Lifting", "Chemical Spill", "Plant Operations", "Scaffolding",
  "Mobile Equipment", "Hazardous Chemicals", "Heat Exhaustion/Stress", "Sharp Objects or Tools",
  "Radiation", "Excavations", "Lockout/Tagout", "Ladders", "Rigging", "Falls from Elevations",
  "Confined Spaces", "Line Breaking", "Inhalation Hazard", "Critical Lift", "Other"
];

const EVAL_QUESTIONS_LEFT = [
  { label: "Have you walked your area?", key: "walkedArea" },
  { label: "Are you working around live systems?", key: "liveSystems" },
  { label: "Does this task require special training?", key: "specialTraining" },
  { label: "Is an MSDS review necessary for this task?", key: "msdsReview" },
  { label: "Is air monitoring required?", key: "airMonitoring" },
  { label: "Are work permits required for this task?", key: "workPermits" },
  { label: "Are you familiar with evaluation routes?", key: "evacuationRoutes" },
  { label: "Has emergency equipment (extinguishers, eyewash, phones) been located?", key: "emergencyEquipment" },
];

const EVAL_QUESTIONS_RIGHT = [
  { label: "If area is congested, has work plan been coordinated with others?", key: "congestedArea" },
  { label: "Do you have the PPE needed for this task?", key: "ppeNeeded" },
  { label: "Are the required materials and tools provided?", key: "toolsProvided" },
  { label: "Have all tools/equipment been inspected before use?", key: "toolsInspected" },
  { label: "Does this task involve a confined space?", key: "confinedSpace" },
  { label: "Should Safety Dept. be involved in this planning?", key: "safetyDeptInvolved" },
  { label: "Is there a safety issue that has not been addressed?", key: "safetyIssueNotAddressed" },
];

const PTPPaperForm: React.FC<Props> = ({ ptp }) => {
  const renderSteps = () => {
    const rows = [...ptp.steps];
    while (rows.length < 6) {
      rows.push({ description: '', hazards: '', actions: '' });
    }

    return rows.map((s, i) => (
      <tr key={i} className="border-b border-black">
        <td className="w-1/3 h-7 text-[8.5px] p-1 align-top border-r border-black leading-tight">{s.description}</td>
        <td className="w-1/3 h-7 text-[8.5px] p-1 align-top border-r border-black leading-tight">{s.hazards}</td>
        <td className="w-1/3 h-7 text-[8.5px] p-1 align-top leading-tight">{s.actions}</td>
      </tr>
    ));
  };

  const EvaluationRow = ({ q }: { q: { label: string, key: string }, key?: React.Key }) => {
    const val = (ptp.evaluation as any)[q.key];
    return (
      <div className="flex justify-between items-center text-[8px] leading-tight mb-1 px-1">
        <span className="font-medium pr-2">{q.label}</span>
        <div className="flex gap-2 shrink-0 pr-1">
          <div className="relative flex items-center justify-center w-6 h-3.5">
            <span className={`z-10 ${val === true ? 'font-black' : 'text-slate-400'}`}>Yes</span>
            {val === true && (
              <div className="absolute inset-x-0 inset-y-[-1px] border border-black rounded-full"></div>
            )}
          </div>
          <div className="relative flex items-center justify-center w-6 h-3.5">
            <span className={`z-10 ${val === false ? 'font-black' : 'text-slate-400'}`}>No</span>
            {val === false && (
              <div className="absolute inset-x-0 inset-y-[-1px] border border-black rounded-full"></div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border-2 border-black p-3 text-black font-sans print:p-1 mb-4 break-after-page last:mb-0 max-h-[1050px] overflow-hidden">
      <div className="flex justify-between items-start gap-4 mb-1">
        <div className="flex-1 space-y-0.5">
            <div className="flex gap-2">
                <span className="text-[9px] font-black uppercase shrink-0">Date:</span>
                <span className="border-b border-black flex-1 text-xs font-normal px-1">{new Date(ptp.date).toLocaleDateString()}</span>
            </div>
            <div className="flex gap-2">
                <span className="text-[9px] font-black uppercase shrink-0">Activity:</span>
                <span className="border-b border-black flex-1 text-xs font-normal px-1">{ptp.description}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-2">
                    <span className="text-[9px] font-black uppercase shrink-0">Supervisor:</span>
                    <span className="border-b border-black flex-1 text-xs font-normal px-1 uppercase">{ptp.supervisor}</span>
                </div>
                <div className="flex gap-2">
                    <span className="text-[9px] font-black uppercase shrink-0">Location:</span>
                    <span className="border-b border-black flex-1 text-xs font-normal px-1">{ptp.location}</span>
                </div>
            </div>
            <div className="flex gap-2">
                <span className="text-[9px] font-black uppercase shrink-0">Company:</span>
                <span className="border-b border-black flex-1 text-xs font-normal px-1">Marine Flooring LLC</span>
            </div>
        </div>

        <div className="flex flex-col items-end gap-0.5">
          <div className="bg-black text-white px-6 py-1.5 font-black text-2xl border-2 border-black leading-none print:bg-black print:text-white">
            PTP
          </div>
          <p className="text-[8px] font-black uppercase tracking-widest">Pre-Task Plan</p>
        </div>
      </div>

      <div className="bg-slate-800 text-white p-0.5 text-center text-[9px] font-black uppercase mb-1 print:bg-slate-800 print:text-white">
        EVALUATING YOUR WORK AREA (Circle Yes or No)
      </div>

      <div className="flex gap-4 mb-1 border-b border-black pb-1">
        <div className="flex-1">
          {EVAL_QUESTIONS_LEFT.map((q, i) => <EvaluationRow key={`eval-left-${q.key}-${i}`} q={q} />)}
        </div>
        <div className="flex-1 border-l border-slate-200 pl-4">
          {EVAL_QUESTIONS_RIGHT.map((q, i) => <EvaluationRow key={`eval-right-${q.key}-${i}`} q={q} />)}
        </div>
      </div>

      <div className="bg-slate-800 text-white p-0.5 text-center text-[9px] font-black uppercase mb-1 print:bg-slate-800 print:text-white">
        Potential Hazard Checklist (Place a Checkmark if applicable)
      </div>

      <div className="flex gap-4 mb-2 border-b border-black pb-2">
        <div className="flex-[3]">
          <div className="grid grid-cols-3 gap-x-2 gap-y-0">
            {HAZARD_LIST.map((h, i) => (
              <div key={`hazard-${i}`} className="flex items-center text-[7.5px] leading-tight">
                <div className="w-5 border-b border-black mr-1 flex items-center justify-center font-black h-2.5">
                  {ptp.hazards.includes(h) ? '✓' : ''}
                </div>
                <span className="truncate">{h}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 border-l border-black pl-2">
            <p className="text-[8px] font-black uppercase border-b border-black mb-0.5">PPE Required:</p>
            <div className="space-y-0.5">
                {ptp.ppe.map((p, i) => (
                    <div key={`ppe-${i}`} className="text-[8px] font-normal border-b border-slate-100 leading-tight">{p}</div>
                ))}
            </div>
        </div>
      </div>

      <div className="border border-black overflow-hidden mb-2">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-black">
              <th className="w-1/3 text-[8px] font-black p-1 border-r border-black uppercase text-center leading-tight">Work Description</th>
              <th className="w-1/3 text-[8px] font-black p-1 border-r border-black uppercase text-center leading-tight">Associated Hazards</th>
              <th className="w-1/3 text-[8px] font-black p-1 uppercase text-center leading-tight">Required Actions</th>
            </tr>
          </thead>
          <tbody>
            {renderSteps()}
          </tbody>
        </table>
      </div>

      <div className="border border-black flex flex-col">
        <div className="bg-slate-50 text-black p-1 text-center text-[10px] font-black border-b border-black">
          Work Crew Sign-off: (Signature)
        </div>
        <div className="flex">
          <div className="flex-1 border-r border-black flex flex-col">
            {[1, 2, 3, 4, 5].map(num => (
              <div key={`sign-left-${num}`} className="h-8 border-b border-black last:border-0 flex items-end p-1">
                <span className="text-[7px] font-black text-slate-300 mr-2 mb-0.5">{num}.</span>
                <div className="flex-1 h-px border-b border-slate-100 mb-0.5"></div>
              </div>
            ))}
          </div>
          <div className="flex-1 flex flex-col">
            {[6, 7, 8, 9, 10].map(num => (
              <div key={`sign-right-${num}`} className="h-8 border-b border-black last:border-0 flex items-end p-1">
                <span className="text-[7px] font-black text-slate-300 mr-2 mb-0.5">{num}.</span>
                <div className="flex-1 h-px border-b border-slate-100 mb-0.5"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <p className="text-[8px] mt-2 font-sans font-normal text-slate-500">Pre-Task Plan</p>
    </div>
  );
};

export default PTPPaperForm;