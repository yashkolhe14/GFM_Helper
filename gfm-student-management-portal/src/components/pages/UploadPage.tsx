import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, GraduationCap, Trash2, FileSpreadsheet, X } from 'lucide-react';
import { parseWorkbook } from '../../lib/parser';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../lib/utils';

export const UploadPage: React.FC = () => {
  const { uploadedFiles, addUploadedFile, removeUploadedFile } = useAppContext();
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<{ name: string; data: any } | null>(null);
  const [validationReport, setValidationReport] = useState<any>(null);

  const performHealthCheck = (data: any) => {
    const report = {
      totalStudents: data.students.length,
      contexts: data.gfmContexts.length,
      missingRollNo: data.students.filter((s: any) => !s.rollNo).length,
      missingName: data.students.filter((s: any) => !s.name).length,
      duplicateRollNo: 0,
      invalidEmails: data.students.filter((s: any) => s.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)).length,
      sheetsFound: [] as string[]
    };

    const rollNos = data.students.map((s: any) => s.rollNo).filter(Boolean);
    report.duplicateRollNo = rollNos.length - new Set(rollNos).size;

    if (data.students.length > 0) report.sheetsFound.push('Students');
    if (data.subjects.length > 0) report.sheetsFound.push('Subjects');
    if (data.feeRecords.length > 0) report.sheetsFound.push('Fees');
    if (data.mentorMentees.length > 0) report.sheetsFound.push('Mentorship');
    if (data.vacRecords.length > 0) report.sheetsFound.push('VAC');
    if (data.moocRecords.length > 0) report.sheetsFound.push('MOOC');
    if (data.internships.length > 0) report.sheetsFound.push('Internships');
    if (data.hackathons.length > 0) report.sheetsFound.push('Hackathons');

    return report;
  };

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv')) {
      setError('Please upload an Excel (.xlsx) or CSV (.csv) file.');
      return;
    }

    setIsParsing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const data = await parseWorkbook(file);
      const report = performHealthCheck(data);
      setPendingData({ name: file.name, data });
      setValidationReport(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse the workbook. Please check the file format.');
    } finally {
      setIsParsing(false);
    }
  }, []);

  const confirmUpload = () => {
    if (!pendingData) return;
    addUploadedFile({
      name: pendingData.name,
      data: pendingData.data,
    });
    setSuccessMessage(`${pendingData.name} loaded successfully`);
    setPendingData(null);
    setValidationReport(null);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be selected again if needed
    e.target.value = '';
  };

  const isFullScreen = uploadedFiles.length === 0;

  const uploadSection = (
    <div className={cn(
      "w-full",
      isFullScreen ? "max-w-xl" : "max-w-3xl mx-auto"
    )}>
      {isFullScreen && (
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center bg-indigo-600 p-4 rounded-3xl shadow-2xl shadow-indigo-600/30 mb-6">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">GFM Management Portal</h1>
          <p className="text-slate-500 text-lg">Upload your academic workbook to get started</p>
        </div>
      )}

      {!isFullScreen && (
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Data Sources</h2>
          <p className="text-slate-500 font-medium mt-1">Manage your uploaded academic workbooks</p>
        </div>
      )}

      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative bg-white border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 group",
          isDragging ? "border-indigo-500 bg-indigo-50/50 scale-[1.02]" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50",
          isParsing && "pointer-events-none opacity-60"
        )}
      >
        <input 
          type="file" 
          id="file-upload" 
          className="hidden" 
          accept=".xlsx,.csv" 
          onChange={onFileChange}
        />
        
        <div className="flex flex-col items-center gap-6">
          <div className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300",
            isDragging ? "bg-indigo-600 text-white rotate-12" : "bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600"
          )}>
            {isParsing ? (
              <Loader2 className="w-10 h-10 animate-spin" />
            ) : (
              <Upload className="w-10 h-10" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">
              {isParsing ? 'Processing Workbook...' : 'Drop your workbook here'}
            </h3>
            <p className="text-slate-500">
              Supports Excel (.xlsx) and CSV (.csv) files
            </p>
          </div>

          <label 
            htmlFor="file-upload"
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer active:scale-95"
          >
            Select File
          </label>
        </div>

        {successMessage && !error && !isParsing && (
          <div className="mt-8 flex items-center justify-center gap-2 text-green-600 font-semibold bg-green-50 py-3 px-6 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="mt-8 flex items-center justify-center gap-2 text-red-600 font-semibold bg-red-50 py-3 px-6 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {!isFullScreen && uploadedFiles.length > 0 && (
        <div className="mt-12 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            Uploaded Files
          </h3>
          <div className="grid gap-4">
            {uploadedFiles.map(file => (
              <div key={file.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{file.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Uploaded on {new Date(file.uploadDate).toLocaleDateString()} at {new Date(file.uploadDate).toLocaleTimeString()}
                    </p>
                    <p className="text-xs font-medium text-indigo-600 mt-1">
                      {file.data.gfmContexts.length} GFM Context(s) • {file.data.students.length} Students
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeUploadedFile(file.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="Remove File"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isFullScreen && (
        <div className="mt-12 grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900">Required Sheets</h4>
            </div>
            <ul className="text-sm text-slate-500 space-y-2">
              <li>• Rollcall / Students</li>
              <li>• Timetable</li>
              <li>• Fee Details</li>
              <li>• Mentor-Mentee</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900">Key Features</h4>
            </div>
            <ul className="text-sm text-slate-500 space-y-2">
              <li>• GFM-Centric Filtering</li>
              <li>• Real-time Analytics</li>
              <li>• Automated Reporting</li>
              <li>• Persistent Storage</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  if (isFullScreen) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        {uploadSection}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      {uploadSection}
      {pendingData && validationReport && (
        <ValidationModal 
          report={validationReport}
          fileName={pendingData.name}
          onConfirm={confirmUpload}
          onCancel={() => {
            setPendingData(null);
            setValidationReport(null);
          }}
        />
      )}
    </div>
  );
};

const ValidationModal: React.FC<{ 
  report: any; 
  fileName: string; 
  onConfirm: () => void; 
  onCancel: () => void 
}> = ({ report, fileName, onConfirm, onCancel }) => {
  const hasCriticalErrors = report.missingRollNo > 0 || report.missingName > 0;
  const hasWarnings = report.duplicateRollNo > 0 || report.invalidEmails > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-foreground">Import Health Check</h3>
              <p className="text-muted-foreground font-medium">Validating {fileName}</p>
            </div>
            <button 
              onClick={onCancel}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/30 rounded-2xl border border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Data Summary</p>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">{report.totalStudents} Students Found</p>
                <p className="text-sm font-bold text-foreground">{report.contexts} GFM Contexts</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {report.sheetsFound.map((sheet: string) => (
                    <span key={sheet} className="text-[9px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">{sheet}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className={cn(
              "p-4 rounded-2xl border",
              hasCriticalErrors ? "bg-destructive/10 border-destructive/20" : 
              hasWarnings ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20"
            )}>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Status Report</p>
              <div className="flex items-center gap-2">
                {hasCriticalErrors ? (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                ) : hasWarnings ? (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                )}
                <span className={cn(
                  "text-sm font-bold",
                  hasCriticalErrors ? "text-destructive" : hasWarnings ? "text-amber-600" : "text-emerald-600"
                )}>
                  {hasCriticalErrors ? 'Critical Issues Found' : hasWarnings ? 'Warnings Detected' : 'All Checks Passed'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Validation Details</h4>
            <div className="space-y-2">
              <ValidationItem 
                label="Roll Numbers Present" 
                status={report.missingRollNo === 0 ? 'success' : 'error'} 
                desc={report.missingRollNo > 0 ? `${report.missingRollNo} students missing roll numbers` : 'All students have roll numbers'}
              />
              <ValidationItem 
                label="Student Names Present" 
                status={report.missingName === 0 ? 'success' : 'error'} 
                desc={report.missingName > 0 ? `${report.missingName} students missing names` : 'All students have names'}
              />
              <ValidationItem 
                label="Unique Roll Numbers" 
                status={report.duplicateRollNo === 0 ? 'success' : 'warning'} 
                desc={report.duplicateRollNo > 0 ? `${report.duplicateRollNo} duplicate roll numbers found` : 'No duplicates detected'}
              />
              <ValidationItem 
                label="Email Format Validation" 
                status={report.invalidEmails === 0 ? 'success' : 'warning'} 
                desc={report.invalidEmails > 0 ? `${report.invalidEmails} invalid email formats` : 'All emails follow valid format'}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-muted text-muted-foreground rounded-2xl font-bold text-sm hover:bg-muted/80 transition-all"
            >
              Cancel Import
            </button>
            <button 
              onClick={onConfirm}
              disabled={hasCriticalErrors}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {hasCriticalErrors ? 'Cannot Import' : 'Confirm & Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ValidationItem: React.FC<{ label: string; status: 'success' | 'warning' | 'error'; desc: string }> = ({ label, status, desc }) => {
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-500" />,
    error: <AlertCircle className="w-4 h-4 text-destructive" />
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-xl border border-border/50">
      <div className="mt-0.5">{icons[status]}</div>
      <div>
        <p className="text-xs font-bold text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground font-medium">{desc}</p>
      </div>
    </div>
  );
};
