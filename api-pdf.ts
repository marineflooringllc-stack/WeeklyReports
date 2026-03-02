import { WeeklyReport } from './types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportReportsToPdf = (reports: WeeklyReport[]) => {
  const doc = new jsPDF();
  const title = reports.length === 1 ? `Weekly Report - ${reports[0].vessel}` : 'Marine Flooring - Weekly Reports Export';
  
  doc.setFontSize(20);
  doc.text(title, 14, 22);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 30);

  let currentY = 40;

  reports.forEach((report, index) => {
    if (index > 0) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(report.vessel, 14, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setTextColor(80);
    const authorName = report.author || 'Marine Flooring Foreman';
    doc.text(`Author: ${authorName} | Period: ${report.weekStart} to ${report.weekEnd}`, 14, currentY);
    currentY += 10;

    const tableData = (report.compartments || []).map(comp => [
      comp.name,
      comp.sqft,
      comp.installer,
      comp.qcPassed ? 'YES' : 'NO',
      (comp.phases || []).map(p => `${p.date}: ${p.description}`).join('\n')
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Compartment', 'SqFt', 'Lead', 'QC Passed', 'Work Phases']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        4: { cellWidth: 80 }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    if (report.editLog && report.editLog.length > 0) {
      doc.setFontSize(10);
      doc.text('Revision History:', 14, currentY);
      currentY += 6;
      report.editLog.forEach(log => {
        doc.setFontSize(8);
        doc.text(`- ${log.timestamp}: ${log.action} by ${log.user}`, 14, currentY);
        currentY += 5;
      });
    }
  });

  doc.save(reports.length === 1 ? `Report_${reports[0].vessel}_${reports[0].id}.pdf` : `Marine_Flooring_Reports_${Date.now()}.pdf`);
};
