import React from 'react';
import { PreTaskPlan } from './types';
import { ArrowLeft, Printer } from 'lucide-react';
import PTPPaperForm from './PTPPaperForm';

interface Props {
  ptp: PreTaskPlan;
  onBack: () => void;
}

const PTPDetail: React.FC<Props> = ({ ptp, onBack }) => {
  
  const handlePrint = () => {
    const printContent = document.getElementById('ptp-print-area');
    if (!printContent) {
      console.error("Print area not found");
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      alert('Please allow popups to print this safety document.');
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
          <title>Marine Flooring Safety - PTP ${ptp.id}</title>
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
            }
            body { 
              padding: 2rem; 
              background-color: #f8fafc;
              font-family: 'Inter', sans-serif;
            }
            .print-wrapper {
              max-width: 1000px;
              margin: 0 auto;
              background: white;
            }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
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

        <button 
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 cursor-pointer"
        >
          <Printer className="w-4 h-4" /> 
          Print Safety Document
        </button>
      </div>

      <div id="ptp-print-area" className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-200">
        <PTPPaperForm ptp={ptp} />
      </div>

      <div className="mt-8 text-center no-print">
        <button 
          type="button"
          onClick={onBack}
          className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl active:scale-95 cursor-pointer"
        >
          Close Document
        </button>
      </div>
    </div>
  );
};

export default PTPDetail;