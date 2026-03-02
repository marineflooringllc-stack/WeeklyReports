import { WeeklyReport } from './types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split(/[-/T ]/);
  if (parts.length >= 3) {
    let y, m, d;
    if (parts[0].length === 4) {
      [y, m, d] = parts;
    } else if (parts[2].length === 4) {
      [m, d, y] = parts;
    } else {
      return dateStr;
    }
    return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`;
  }
  return dateStr;
};

export const exportReportsToPdf = (reports: WeeklyReport[]) => {
  const doc = new jsPDF();
  const width = doc.internal.pageSize.width;
  const height = doc.internal.pageSize.height;
  
  const addWatermark = (doc: jsPDF) => {
    doc.setTextColor(248, 250, 252); // Very light slate
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(50);
    doc.text('MARINE FLOORING', width / 2, height / 2 + 20, { angle: 45, align: 'center' });
  };

  const addHeader = (doc: jsPDF, title: string, subtitle: string) => {
    // Main header background (Navy)
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, width, 35, 'F');
    
    // Accent line (Blue)
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 35, width, 2, 'F');
    
    // Logo Box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 8, 18, 18, 2, 2, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('MF', 23, 20, { align: 'center' });
    
    // Company Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('MARINE FLOORING', 38, 18);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Vessel Progress & Quality Control', 38, 24);
    
    // Right side info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(title, width - 14, 18, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(subtitle, width - 14, 24, { align: 'right' });
  };

  const addFooter = (doc: jsPDF, pageNumber: number, totalPages: number) => {
    // Footer line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, height - 15, width - 14, height - 15);
    
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, height - 8);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Page ${pageNumber} of ${totalPages}`, width - 14, height - 8, { align: 'right' });
  };

  reports.forEach((report, index) => {
    if (index > 0) {
      doc.addPage();
    }
    
    addWatermark(doc);

    const formattedStart = formatDate(report.weekStart);
    const formattedEnd = formatDate(report.weekEnd);
    const periodStr = `${formattedStart} - ${formattedEnd}`;
    
    addHeader(doc, report.vessel, `Period: ${periodStr}`);

    let currentY = 45;

    // Calculate totals
    const totalSqft = (report.compartments || []).reduce((sum, c) => sum + (c.sqft || 0), 0);
    const totalComps = (report.compartments || []).length;
    const authorName = report.author || 'Marine Flooring Foreman';

    // Card 1: Details
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, 90, 22, 3, 3, 'FD');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('FOREMAN / AUTHOR', 18, currentY + 7);
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(authorName.toUpperCase(), 18, currentY + 12);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('PERIOD:', 18, currentY + 18);
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(periodStr, 32, currentY + 18);

    // Card 2: SqFt
    doc.setFillColor(240, 249, 255); // light blue
    doc.setDrawColor(186, 230, 253);
    doc.roundedRect(108, currentY, 42, 22, 3, 3, 'FD');
    
    doc.setFontSize(8);
    doc.setTextColor(2, 132, 199);
    doc.text('TOTAL SQFT', 112, currentY + 7);
    doc.setFontSize(16);
    doc.setTextColor(3, 105, 161);
    doc.text(totalSqft.toLocaleString(), 112, currentY + 16);

    // Card 3: Units
    doc.setFillColor(255, 251, 235); // light amber
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(154, currentY, 42, 22, 3, 3, 'FD');
    
    doc.setFontSize(8);
    doc.setTextColor(217, 119, 6);
    doc.text('COMPARTMENTS', 158, currentY + 7);
    doc.setFontSize(16);
    doc.setTextColor(180, 83, 9);
    doc.text(totalComps.toString(), 158, currentY + 16);

    currentY += 32;

    // Compartments Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('COMPARTMENT DETAILS', 14, currentY);
    currentY += 6;

    const tableData = (report.compartments || []).map(comp => {
      const isQCPassed = (comp.phases || []).some(p => p.description.toLowerCase().includes('qc') && p.description.toLowerCase().includes('pass'));
      return [
        comp.name,
        comp.sqft ? comp.sqft.toLocaleString() : '-',
        comp.installer || '-',
        isQCPassed ? 'PASSED' : 'PENDING',
        (comp.phases || []).map(p => `[${formatDate(p.date)}] ${p.description}`).join('\n')
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['COMPARTMENT', 'SQFT', 'LEAD INSTALLER', 'QC STATUS', 'WORK PHASES']],
      body: tableData,
      theme: 'plain',
      headStyles: { 
        fillColor: [241, 245, 249], // slate-100
        textColor: [71, 85, 105], // slate-600
        fontStyle: 'bold',
        halign: 'left',
        fontSize: 8,
        lineWidth: { bottom: 0.5 },
        lineColor: [203, 213, 225]
      },
      bodyStyles: {
        textColor: [15, 23, 42], // slate-900
      },
      alternateRowStyles: {
        fillColor: [250, 252, 253] // very light blue/slate
      },
      styles: { 
        font: 'helvetica',
        fontSize: 9, 
        cellPadding: 5,
        lineColor: [226, 232, 240], // slate-200
        lineWidth: { bottom: 0.1 }
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 35 },
        1: { halign: 'right', cellWidth: 20 },
        2: { cellWidth: 35 },
        3: { 
          halign: 'center', 
          cellWidth: 25,
          fontStyle: 'bold',
        },
        4: { cellWidth: 'auto' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 3) {
          if (data.cell.raw === 'PASSED') {
            data.cell.styles.textColor = [5, 150, 105]; // emerald-600
          } else {
            data.cell.styles.textColor = [217, 119, 6]; // amber-600
          }
        }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    if (report.editLog && report.editLog.length > 0) {
      if (currentY > height - 40) {
        doc.addPage();
        addWatermark(doc);
        addHeader(doc, report.vessel, `Period: ${periodStr}`);
        currentY = 45;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('REVISION HISTORY', 14, currentY);
      currentY += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139); // slate-500
      report.editLog.forEach(log => {
        doc.setFontSize(8);
        const logDate = new Date(log.timestamp).toLocaleString();
        doc.text(`• ${logDate} — ${log.action} by ${log.user}`, 14, currentY);
        currentY += 5;
      });
    }
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount);
  }

  doc.save(reports.length === 1 ? `Report_${reports[0].vessel}_${reports[0].id}.pdf` : `Marine_Flooring_Reports_${Date.now()}.pdf`);
};
