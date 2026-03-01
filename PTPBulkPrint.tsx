import React from 'react';
import { PreTaskPlan } from './types';
import { ArrowLeft, Printer } from 'lucide-react';
import PTPPaperForm from './PTPPaperForm';

interface Props {
  ptps: PreTaskPlan[];
  onBack: () => void;
}

const PTPBulkPrint: React.FC<Props> = ({ ptps, onBack }) => {

  const handlePrint = () => {
    const printContent = document.getElementById('bulk-print-content');
    if (!printContent) {
      console.error("Bulk print area not found");
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      alert('Please allow popups to print these safety documents.');
      return;
    }

    const styleElements = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Marine Flooring - Bulk Safety Export (${ptps.length} documents)</title>
          ${styleElements}
          <style>
            @media print {
              @page { 
                size: portrait; 
                margin: 0.5cm; 
              }
              body { 
                background: white !important; 
                margin: 0 !important; 
                padding: 0 !important; 
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print { display: none !important; }
              .ptp-page-break {
                page-break-after: always !important;
                break-after: page !important;
              }
              .ptp-page-break:last-child {
                page-break-after: auto !important;
                break-after: auto !important;
              }
            }
            body { 
              padding: 2rem; 
              background-color: #f1f5f9;
              font-family: 'Inter', sans-serif;
            }
            .bulk-print-wrapper {
              max-width: 1000px;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          <div class="bulk-print-wrapper">
            ${printContent.innerHTML}
          </div>
          <script>
            window.addEventListener('load', () => {
              setTimeout(() => {
                window.focus();
                window.print();
                window.onafterprint = () => {
                  window.close();
                };
              }, 500);
            });
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 print-container">
      <div className="flex justify-between items-center no-print py-4 px-4 lg:px-0 sticky top-0 bg-slate-100/90 backdrop-blur-md z-30 mb-6 border-b border-slate-200">
        <button 
          type="button"
          onClick={onBack} 
          className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
          Back to Safety Hub
        </button>
        <div className="flex items-center gap-4">
          <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{ptps.length} Plans Selected</span>
          <button 
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> 
            Print All Plans
          </button>
        </div>
      </div>

      <div id="bulk-print-content" className="space-y-12">
        {ptps.map((ptp, idx) => (
          <div key={`${ptp.id}-${idx}`} className="ptp-page-break bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden mb-8">
            <PTPPaperForm ptp={ptp} />
          </div>
        ))}
        {ptps.length === 0 && (
          <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold italic">No plans selected for bulk printing.</p>
            <button 
              type="button"
              onClick={onBack}
              className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold"
            >
              Return to Safety Hub
            </button>
          </div>
        )}
      </div>

      <div className="mt-12 text-center no-print">
        <button 
          type="button"
          onClick={onBack}
          className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl active:scale-95 cursor-pointer"
        >
          Close Print Review
        </button>
      </div>
    </div>
  );
};

export default PTPBulkPrint;