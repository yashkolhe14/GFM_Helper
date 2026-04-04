import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

export const ExportPage: React.FC = () => {
  const { appData, selectedContext } = useAppContext();
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [selectedCategory, setSelectedCategory] = useState<string>('students');

  if (!appData || !selectedContext) return null;

  // Filter data based on selected context
  const filterByContext = (data: any[]) => {
    return data.filter(item => 
      item.gfmName === selectedContext.gfmName &&
      (selectedContext.class === 'N/A' || item.class === selectedContext.class) &&
      (selectedContext.division === 'N/A' || item.division === selectedContext.division)
    );
  };

  const getFilteredData = () => {
    return {
      students: filterByContext(appData.students),
      subjects: filterByContext(appData.subjects),
      faculty: filterByContext(appData.faculty),
      timetable: filterByContext(appData.timetable),
      mentorMentees: filterByContext(appData.mentorMentees),
      feeRecords: filterByContext(appData.feeRecords),
      vacRecords: filterByContext(appData.vacRecords),
      moocRecords: filterByContext(appData.moocRecords),
      internships: filterByContext(appData.internships),
      hackathons: filterByContext(appData.hackathons),
    };
  };

  const categories = [
    { id: 'students', label: 'Students' },
    { id: 'subjects', label: 'Subjects' },
    { id: 'faculty', label: 'Faculty' },
    { id: 'timetable', label: 'Timetable' },
    { id: 'mentorMentees', label: 'Mentor-Mentee' },
    { id: 'feeRecords', label: 'Fee Details' },
    { id: 'vacRecords', label: 'VAC Records' },
    { id: 'moocRecords', label: 'MOOC Records' },
    { id: 'internships', label: 'Internships' },
    { id: 'hackathons', label: 'Hackathons' },
  ];

  const formatHeader = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .toUpperCase();
  };

  const handleExportExcel = async () => {
    try {
      const filteredData = getFilteredData();
      const workbook = new ExcelJS.Workbook();

      const addStandardSheet = (data: any[], name: string) => {
        if (data.length === 0) return;

        const worksheet = workbook.addWorksheet(name);

        // Remove unwanted columns
        const cleanedData = data.map(item => {
          const { id, gfmName, class: cls, semester, academicYear, division, ...rest } = item;
          return rest;
        });

        const rawHeaders = Object.keys(cleanedData[0]);
        const headers = rawHeaders.map(formatHeader);

        // Add Header Metadata
        worksheet.addRow(['BHARATI VIDYAPEETH (DEEMED TO BE UNIVERSITY)']);
        worksheet.addRow(['COLLEGE OF ENGINEERING, PUNE - 43']);
        worksheet.addRow(['Department of Computer Science & Engineering']);
        worksheet.addRow([]);
        
        const sheetTitle = name === 'Students' ? `Class ${selectedContext.class} Roll Call List AY 2025-2026` : `${name} AY 2025-2026`;
        worksheet.addRow([sheetTitle]);
        
        worksheet.addRow([
          `DIV-${selectedContext.division}`,
          `GFM: ${selectedContext.gfmName}`,
          `Class: ${selectedContext.class}`,
          `Semester: ${selectedContext.semester}`
        ]);
        worksheet.addRow([]);

        // Style header rows
        for (let i = 1; i <= 3; i++) {
          const row = worksheet.getRow(i);
          row.font = { bold: true, size: 12 };
          row.alignment = { horizontal: 'center' };
          worksheet.mergeCells(i, 1, i, headers.length);
        }
        worksheet.getRow(5).font = { bold: true, size: 11 };
        worksheet.getRow(5).alignment = { horizontal: 'center' };
        worksheet.mergeCells(5, 1, 5, headers.length);

        // Add Table Headers
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell((cell) => {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // Add Data Rows
        cleanedData.forEach((item) => {
          const rowValues = rawHeaders.map(h => item[h]);
          const row = worksheet.addRow(rowValues);
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          });
        });

        // Add Footer
        const footerStartRow = worksheet.lastRow!.number + 5;
        const footerRow1 = worksheet.getRow(footerStartRow);
        footerRow1.getCell(1).value = 'GFM Signature';
        footerRow1.getCell(headers.length).value = 'HOD Signature';
        footerRow1.font = { bold: true };

        const footerRow2 = worksheet.getRow(footerStartRow + 1);
        footerRow2.getCell(1).value = selectedContext.gfmName;
        footerRow2.getCell(headers.length).value = 'Dr. Bindu Garg';

        worksheet.columns.forEach(column => {
          let maxLength = 0;
          column.eachCell?.({ includeEmpty: true }, (cell, rowNumber) => {
            // Skip the header metadata rows (1-7)
            if (rowNumber <= 7) return;
            
            let columnLength = 0;
            if (cell.value !== null && cell.value !== undefined) {
              const value = cell.value;
              if (typeof value === 'object') {
                if (value instanceof Date) {
                  columnLength = value.toLocaleDateString().length;
                } else if ('richText' in (value as any)) {
                  columnLength = (value as any).richText.reduce((acc: number, rt: any) => acc + (rt.text ? rt.text.length : 0), 0);
                } else if ('result' in (value as any)) {
                  columnLength = String((value as any).result).length;
                } else if ('text' in (value as any)) {
                  columnLength = String((value as any).text).length;
                } else {
                  columnLength = String(value).length;
                }
              } else {
                columnLength = String(value).length;
              }
            }
            
            // Add extra space for bold headers
            if (rowNumber === 8) columnLength += 3;

            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
          column.width = Math.min(Math.max(maxLength + 2, 12), 60);
        });
      };

      const addMOOCSheet = (data: any[]) => {
        if (data.length === 0) return;

        const worksheet = workbook.addWorksheet('MOOC');

        // Group by student
        const groups: Map<string, any[]> = new Map();
        data.forEach(m => {
          const key = `${m.rollNo || ''}-${m.studentName}`;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(m);
        });

        const groupedData = Array.from(groups.values());
        let maxCourses = 0;
        groupedData.forEach(records => {
          if (records.length > maxCourses) maxCourses = records.length;
        });

        // Define Headers
        const baseHeaders = ['ROLL NO', 'STUDENT NAME'];
        const courseHeaders: string[] = [];
        for (let i = 1; i <= maxCourses; i++) {
          courseHeaders.push(`COURSE ${i}`, `PLATFORM ${i}`, `STATUS ${i}`, `CERTIFICATION ${i}`);
        }
        const allHeaders = [...baseHeaders, ...courseHeaders];

        // Add Header Metadata
        worksheet.addRow(['BHARATI VIDYAPEETH (DEEMED TO BE UNIVERSITY)']);
        worksheet.addRow(['COLLEGE OF ENGINEERING, PUNE - 43']);
        worksheet.addRow(['Department of Computer Science & Engineering']);
        worksheet.addRow([]);
        worksheet.addRow([`MOOC Records AY 2025-2026`]);
        worksheet.addRow([
          `DIV-${selectedContext.division}`,
          `GFM: ${selectedContext.gfmName}`,
          `Class: ${selectedContext.class}`,
          `Semester: ${selectedContext.semester}`
        ]);
        worksheet.addRow([]);

        // Style header rows
        for (let i = 1; i <= 3; i++) {
          const row = worksheet.getRow(i);
          row.font = { bold: true, size: 12 };
          row.alignment = { horizontal: 'center' };
          worksheet.mergeCells(i, 1, i, allHeaders.length);
        }
        worksheet.getRow(5).font = { bold: true, size: 11 };
        worksheet.getRow(5).alignment = { horizontal: 'center' };
        worksheet.mergeCells(5, 1, 5, allHeaders.length);

        // Add Table Headers
        const headerRow = worksheet.addRow(allHeaders);
        headerRow.eachCell((cell) => {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // Add Data Rows
        groupedData.forEach((records) => {
          const first = records[0];
          const rowValues = [first.rollNo, first.studentName];
          
          for (let i = 0; i < maxCourses; i++) {
            const r = records[i];
            if (r) {
              rowValues.push(r.courseName, r.platform, r.status, r.certification);
            } else {
              rowValues.push('-', '-', '-', '-');
            }
          }

          const row = worksheet.addRow(rowValues);
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          });
        });

        // Add Footer
        const footerStartRow = worksheet.lastRow!.number + 5;
        const footerRow1 = worksheet.getRow(footerStartRow);
        footerRow1.getCell(1).value = 'GFM Signature';
        footerRow1.getCell(allHeaders.length).value = 'HOD Signature';
        footerRow1.font = { bold: true };

        const footerRow2 = worksheet.getRow(footerStartRow + 1);
        footerRow2.getCell(1).value = selectedContext.gfmName;
        footerRow2.getCell(allHeaders.length).value = 'Dr. Bindu Garg';

        worksheet.columns.forEach(column => {
          let maxLength = 0;
          column.eachCell?.({ includeEmpty: true }, (cell, rowNumber) => {
            // Skip the header metadata rows (1-7)
            if (rowNumber <= 7) return;

            let columnLength = 0;
            if (cell.value !== null && cell.value !== undefined) {
              const value = cell.value;
              if (typeof value === 'object') {
                if (value instanceof Date) {
                  columnLength = value.toLocaleDateString().length;
                } else if ('text' in (value as any)) {
                  columnLength = String((value as any).text).length;
                } else {
                  columnLength = String(value).length;
                }
              } else {
                columnLength = String(value).length;
              }
            }

            // Add extra space for bold headers
            if (rowNumber === 8) columnLength += 3;

            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
          column.width = Math.min(Math.max(maxLength + 2, 12), 60);
        });
      };

      const addTimetableSheet = (data: any[]) => {
        const worksheet = workbook.addWorksheet('Timetable');

        // Header Metadata
        worksheet.addRow(['BHARATI VIDYAPEETH (DEEMED TO BE UNIVERSITY)']);
        worksheet.addRow(['COLLEGE OF ENGINEERING, PUNE - 43']);
        worksheet.addRow(['Department of Computer Science & Engineering']);
        worksheet.addRow([`Class Time Table A.Y. 2025-26 TERM -II w.e.f 05/01/2026`]);
        
        const row5 = worksheet.addRow([`Class: ${selectedContext.class} Div-${selectedContext.division}`, '', '', '', '', '', '', `Class Room No: MECH 309/Online`]);
        worksheet.mergeCells(5, 1, 5, 7);
        worksheet.mergeCells(5, 8, 5, 8);

        worksheet.addRow([`Semester: ${selectedContext.semester}`]);
        worksheet.addRow([`GFM: - ${selectedContext.gfmName}`]);

        // Style header rows
        for (let i = 1; i <= 4; i++) {
          const row = worksheet.getRow(i);
          row.font = { bold: true, size: 12 };
          row.alignment = { horizontal: 'center' };
          worksheet.mergeCells(i, 1, i, 8);
        }

        // Table Headers
        const headers = ['TIME', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'REMARKS'];
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell((cell) => {
          cell.font = { bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        const timeSlots = [
          '10.00-11.00',
          '11.00-12.00',
          '12.00-1.00',
          '1.00-2.00',
          '2.00-3.00',
          '3.00-3.15',
          '3.15-4.15',
          '4.15-5.15'
        ];

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        timeSlots.forEach((slot) => {
          if (slot === '12.00-1.00' || slot === '3.00-3.15') {
            const label = slot === '12.00-1.00' ? 'LUNCH BREAK' : 'SHORT BREAK';
            const row = worksheet.addRow([slot, label, label, label, label, label, label, '']);
            worksheet.mergeCells(worksheet.lastRow!.number, 2, worksheet.lastRow!.number, 7);
            row.eachCell((cell) => {
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
              cell.font = { italic: true, bold: true };
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
            });
          } else {
            const rowData = [slot];
            days.forEach((day) => {
              const entry = data.find(e => e.day === day && e.time === slot);
              rowData.push(entry ? `${entry.subject}\n(${entry.faculty})\n[${entry.room}]` : '');
            });
            rowData.push(''); // Remarks column
            const row = worksheet.addRow(rowData);
            row.height = 60;
            row.eachCell((cell) => {
              cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
            });
          }
        });

        worksheet.columns.forEach((column) => {
          let maxLength = 0;
          column.eachCell?.({ includeEmpty: true }, (cell, rowNumber) => {
            // Skip the header metadata rows (1-6)
            if (rowNumber <= 6) return;

            let columnLength = 0;
            if (cell.value !== null && cell.value !== undefined) {
              const value = cell.value;
              if (typeof value === 'object') {
                if (value instanceof Date) {
                  columnLength = value.toLocaleDateString().length;
                } else if ('text' in (value as any)) {
                  columnLength = String((value as any).text).length;
                } else {
                  columnLength = String(value).length;
                }
              } else {
                columnLength = String(value).length;
              }
            }

            // Add extra space for bold headers
            if (rowNumber === 7) columnLength += 3;

            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
          column.width = Math.max(maxLength + 2, 15);
        });

        // Add Footer
        const footerStartRow = worksheet.lastRow!.number + 5;
        const footerRow1 = worksheet.getRow(footerStartRow);
        footerRow1.getCell(1).value = 'GFM Signature';
        footerRow1.getCell(8).value = 'HOD Signature';
        footerRow1.font = { bold: true };

        const footerRow2 = worksheet.getRow(footerStartRow + 1);
        footerRow2.getCell(1).value = selectedContext.gfmName;
        footerRow2.getCell(8).value = 'Dr. Bindu Garg';
      };

      addStandardSheet(filteredData.students, 'Students');
      addStandardSheet(filteredData.subjects, 'Subjects');
      addStandardSheet(filteredData.faculty, 'Faculty');
      addTimetableSheet(filteredData.timetable);
      addStandardSheet(filteredData.mentorMentees, 'Mentor-Mentee');
      addStandardSheet(filteredData.feeRecords, 'Fee Details');
      addStandardSheet(filteredData.vacRecords, 'VAC');
      addMOOCSheet(filteredData.moocRecords);
      addStandardSheet(filteredData.internships, 'Internships');
      addStandardSheet(filteredData.hackathons, 'Hackathons');

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `GFM_Data_${selectedContext.class}_${selectedContext.division}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
      
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  };

  const handleExportCSV = () => {
    try {
      const filteredData = getFilteredData();
      const dataToExport = filteredData[selectedCategory as keyof typeof filteredData];
      
      if (!dataToExport || dataToExport.length === 0) {
        alert('No data available for the selected category in the current context.');
        return;
      }

      // Clean data for CSV as well
      const cleanedData = dataToExport.map(item => {
        const { id, gfmName, class: cls, semester, academicYear, division, ...rest } = item;
        return rest;
      });

      // For CSV, we'll also include the header and footer as requested
      const metadata = [
        ['Bharati Vidyapeeth (Deemed to be University),College of Engineering, Pune'],
        ['Bharati Vidyapeeth College of Engineering, Pune'],
        ['Department of Computer Science and Engineering'],
        [],
        [`${selectedCategory.toUpperCase()} AY 2025-2026`],
        [
          selectedContext.division.startsWith('DIV') ? selectedContext.division : `DIV-${selectedContext.division}`,
          `GFM: ${selectedContext.gfmName}`,
          `Class: ${selectedContext.class}`,
          `Semester: ${selectedContext.semester}`
        ],
        [],
      ];

      const formattedData = cleanedData.map(item => {
        const formattedItem: any = {};
        Object.keys(item).forEach(key => {
          formattedItem[formatHeader(key)] = item[key];
        });
        return formattedItem;
      });

      const ws = XLSX.utils.aoa_to_sheet(metadata);
      XLSX.utils.sheet_add_json(ws, formattedData, { origin: 'A8' });

      // Add footer
      const footerRowIndex = 8 + formattedData.length + 5;
      const headersCount = Object.keys(formattedData[0] || {}).length;
      const footer = [
        ["GFM Signature", ...Array(headersCount - 2).fill(""), "HOD Signature"],
        [selectedContext.gfmName, ...Array(headersCount - 2).fill(""), "Dr. Bindu Garg"]
      ];
      XLSX.utils.sheet_add_aoa(ws, footer, { origin: `A${footerRowIndex}` });

      const csv = XLSX.utils.sheet_to_csv(ws);
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${selectedCategory}_${selectedContext.class}_${selectedContext.division}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="space-y-1">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Export Data</h2>
        <p className="text-slate-500 font-medium">Download your GFM data in Excel or CSV format</p>
      </div>

      {exportStatus === 'success' && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700">
          <CheckCircle2 className="w-5 h-5" />
          <p className="font-medium">Export completed successfully!</p>
        </div>
      )}

      {exportStatus === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">An error occurred during export. Please try again.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Excel Export Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl flex flex-col items-center text-center space-y-6 hover:border-indigo-300 transition-colors">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
            <FileSpreadsheet className="w-10 h-10 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">Export All to Excel</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Download a neatly formatted Excel workbook containing all data categories separated into different sheets.
            </p>
          </div>
          <button
            onClick={handleExportExcel}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
          >
            <Download className="w-5 h-5" />
            Download Excel (.xlsx)
          </button>
        </div>

        {/* CSV Export Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl flex flex-col items-center text-center space-y-6 hover:border-indigo-300 transition-colors">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
            <FileText className="w-10 h-10 text-blue-600" />
          </div>
          <div className="space-y-2 w-full">
            <h3 className="text-xl font-bold text-slate-900">Export Category to CSV</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto mb-4">
              Select a specific data category to download as a comma-separated values file.
            </p>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExportCSV}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
          >
            <Download className="w-5 h-5" />
            Download CSV (.csv)
          </button>
        </div>
      </div>
    </div>
  );
};
