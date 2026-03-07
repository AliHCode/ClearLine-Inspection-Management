import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatDateDisplay } from './rfiLogic';

/**
 * Format RFI data for export
 */
function prepareDataForExport(rfis) {
    return rfis.map((rfi) => ({
        'Serial No': rfi.serialNo,
        'Description': rfi.description,
        'Location': rfi.location,
        'Type': rfi.inspectionType,
        'Filed Date': formatDateDisplay(rfi.originalFiledDate || rfi.filedDate),
        'Status': rfi.status.toUpperCase(),
        'Remarks': rfi.remarks || 'None',
        'Review Date': rfi.reviewedAt ? formatDateDisplay(rfi.reviewedAt.split('T')[0]) : 'Pending'
    }));
}

/**
 * Export RFIs to Excel Spreadsheet (.xlsx)
 */
export function exportToExcel(rfis, filename = 'RFI_Report') {
    if (!rfis || rfis.length === 0) {
        alert("No data available to export.");
        return;
    }

    const data = prepareDataForExport(rfis);
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    // Auto-size columns roughly
    const cols = Object.keys(data[0]).map(key => ({
        wch: Math.max(
            key.length,
            ...data.map(row => (row[key] ? row[key].toString().length : 0))
        ) + 2
    }));
    worksheet['!cols'] = cols;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'RFIs');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Export RFIs to PDF Document (.pdf)
 */
export function exportToPDF(rfis, title = 'ClearLine Inspections - RFI Report') {
    if (!rfis || rfis.length === 0) {
        alert("No data available to export.");
        return;
    }

    const doc = new jsPDF('landscape'); // Landscape for better table fit

    // Header
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const data = prepareDataForExport(rfis);
    const headers = Object.keys(data[0]);
    const body = data.map(obj => Object.values(obj));

    doc.autoTable({
        head: [headers],
        body: body,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 5) {
                const status = data.cell.raw;
                if (status === 'APPROVED') data.cell.styles.textColor = [16, 185, 129];
                if (status === 'REJECTED') data.cell.styles.textColor = [239, 68, 68];
                if (status === 'PENDING') data.cell.styles.textColor = [245, 158, 11];
            }
        }
    });

    doc.save(`${title.replace(/ /g, '_')}.pdf`);
}
