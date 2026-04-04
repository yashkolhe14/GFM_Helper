import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Bell, User, LogOut, Settings, Filter, Download, X, CheckCircle2, Menu, Moon, Sun } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import { FeeRecord, Student } from '../types';

interface TopbarProps {
  setActivePage: (page: string) => void;
  toggleSidebar: () => void;
}

const EXPORT_COLUMNS = [
  { id: 'rollNo', label: 'Roll No' },
  { id: 'prn', label: 'PRN' },
  { id: 'name', label: 'Name' },
  { id: 'gender', label: 'Gender' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'feeStatus', label: 'Fee Status' },
  { id: 'amountPaid', label: 'Amount Paid' },
  { id: 'amountPending', label: 'Amount Pending' },
  { id: 'totalAmount', label: 'Total Amount' },
  { id: 'mentor', label: 'Mentor' },
  { id: 'moocStatus', label: 'MOOC Status' },
  { id: 'vacSubjects', label: 'VAC Subjects' },
  { id: 'internshipStatus', label: 'Internship Status' },
  { id: 'hackathonStatus', label: 'Hackathon Status' },
  { id: 'class', label: 'Class' },
  { id: 'division', label: 'Division' },
  { id: 'semester', label: 'Semester' },
  { id: 'academicYear', label: 'Academic Year' },
];

export const Topbar: React.FC<TopbarProps> = ({ setActivePage, toggleSidebar }) => {
  const { appData, selectedContext, setSelectedContext, theme, toggleTheme } = useAppContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(EXPORT_COLUMNS.map(c => c.id));
  const [searchTerm, setSearchTerm] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const toggleColumn = (id: string) => {
    setSelectedColumns(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    if (!appData || !selectedContext || selectedColumns.length === 0) return;

    const filteredStudents = appData.students.filter(s => 
      s.gfmName === selectedContext.gfmName &&
      (selectedContext.class === 'N/A' || s.class === selectedContext.class) &&
      (selectedContext.division === 'N/A' || s.division === selectedContext.division)
    );

    const feeMap = new Map<string, FeeRecord>(appData.feeRecords.map(f => [f.rollNo, f]));

    const activeHeaders = EXPORT_COLUMNS.filter(c => selectedColumns.includes(c.id));
    const headers = activeHeaders.map(c => c.label);

    const rows = filteredStudents.map(s => {
      const fee = feeMap.get(s.rollNo);
      const data: Record<string, any> = {
        rollNo: s.rollNo,
        prn: s.prn,
        name: s.name,
        gender: s.gender,
        email: s.email,
        phone: s.phone,
        feeStatus: s.feeStatus || fee?.status || 'Pending',
        amountPaid: fee?.amountPaid || 0,
        amountPending: fee?.amountPending || 0,
        totalAmount: fee?.totalAmount || 0,
        mentor: s.mentorName || '',
        moocStatus: s.moocStatus || '',
        vacSubjects: s.vacSubjects || '',
        internshipStatus: s.internshipStatus || '',
        hackathonStatus: s.hackathonStatus || '',
        class: s.class,
        division: s.division,
        semester: s.semester,
        academicYear: s.academicYear
      };

      return activeHeaders.map(h => data[h.id]);
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Student_Data_${selectedContext.class}_${selectedContext.division}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const globalSearchResults = useMemo(() => {
    if (!globalSearchTerm || globalSearchTerm.length < 2 || !appData) return [];
    return appData.students.filter(s => 
      s.name.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(globalSearchTerm.toLowerCase())
    ).slice(0, 5);
  }, [globalSearchTerm, appData]);

  const filteredContexts = appData?.gfmContexts.filter(ctx => 
    String(ctx.gfmName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(ctx.class || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(ctx.division || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <header className="h-20 bg-card border-b border-border px-4 lg:px-8 flex items-center justify-between sticky top-0 z-50 transition-colors duration-300">
      <div className="flex items-center gap-4 lg:gap-6 flex-1 max-w-2xl">
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-muted rounded-xl lg:hidden text-foreground"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="relative w-full max-w-md hidden md:block" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search students..." 
              className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              value={globalSearchTerm}
              onChange={(e) => {
                setGlobalSearchTerm(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
            />
          </div>

          {isSearchOpen && globalSearchResults.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {globalSearchResults.map((student) => (
                <button
                  key={student.rollNo}
                  onClick={() => {
                    // This could open a student profile modal or navigate to students page with filter
                    setActivePage('students');
                    setIsSearchOpen(false);
                    setGlobalSearchTerm('');
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-0 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.rollNo} • {student.class}-{student.division}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-4 py-2 bg-muted/50 border border-border rounded-xl hover:border-primary/50 transition-all duration-200 group h-10"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="bg-primary/10 p-1 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <User className="w-3.5 h-3.5" />
                </div>
                <p className="text-sm font-black text-foreground truncate max-w-[150px]">
                  {selectedContext?.gfmName || 'Select GFM'}
                </p>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", isDropdownOpen && "rotate-180")} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 w-64 mt-2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 border-b border-border bg-muted/30">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Search GFM..." 
                      className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredContexts.length > 0 ? (
                    filteredContexts.map((ctx, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedContext(ctx);
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2.5 text-left hover:bg-muted transition-colors border-b border-border/50 last:border-0 flex items-center justify-between group/item",
                          selectedContext?.gfmName === ctx.gfmName && selectedContext?.class === ctx.class && selectedContext?.division === ctx.division && "bg-primary/5 border-l-4 border-l-primary"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-bold truncate",
                            selectedContext?.gfmName === ctx.gfmName && selectedContext?.class === ctx.class && selectedContext?.division === ctx.division ? "text-primary" : "text-foreground"
                          )}>{ctx.gfmName}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {ctx.class} • {ctx.division} • Sem {ctx.semester}
                          </p>
                        </div>
                        {selectedContext?.gfmName === ctx.gfmName && selectedContext?.class === ctx.class && selectedContext?.division === ctx.division && (
                          <CheckCircle2 className="w-3 h-3 text-primary shrink-0 ml-2" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-xs text-muted-foreground">No GFMs found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedContext && (
            <div className="hidden md:flex items-center gap-2">
              {selectedContext.semester !== 'N/A' && (
                <div className="flex items-center px-3 h-10 bg-primary/5 border border-primary/20 rounded-xl whitespace-nowrap">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider mr-2">SEM</p>
                  <p className="text-xs font-black text-foreground">{selectedContext.semester}</p>
                </div>
              )}
              {selectedContext.division !== 'N/A' && (
                <div className="flex items-center px-3 h-10 bg-muted/30 border border-border rounded-xl whitespace-nowrap">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-2">DIV</p>
                  <p className="text-xs font-black text-foreground">{selectedContext.division}</p>
                </div>
              )}
              {selectedContext.academicYear !== 'N/A' && (
                <div className="flex items-center px-3 h-10 bg-muted/30 border border-border rounded-xl whitespace-nowrap">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-2">A.Y.</p>
                  <p className="text-xs font-black text-foreground">{selectedContext.academicYear}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <button 
          onClick={toggleTheme}
          className="p-2.5 text-muted-foreground hover:bg-muted rounded-xl transition-colors"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
        
        <button 
          onClick={() => setIsExportModalOpen(true)}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-foreground rounded-xl font-bold text-sm hover:bg-muted transition-all shadow-sm active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span className="hidden lg:inline">Export</span>
        </button>

        <button className="p-2.5 text-muted-foreground hover:bg-muted rounded-xl transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
        </button>

        <button 
          onClick={() => setActivePage('upload')}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Switch Data</span>
        </button>
      </div>
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Export Options</h3>
                  <p className="text-slate-500 font-medium">Select columns to include in your CSV</p>
                </div>
                <button 
                  onClick={() => setIsExportModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {EXPORT_COLUMNS.map(col => (
                  <button
                    key={col.id}
                    onClick={() => toggleColumn(col.id)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border transition-all text-left",
                      selectedColumns.includes(col.id) 
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" 
                        : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                      selectedColumns.includes(col.id) ? "bg-indigo-600 border-indigo-600" : "border-slate-300"
                    )}>
                      {selectedColumns.includes(col.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-xs font-bold truncate">{col.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setSelectedColumns(EXPORT_COLUMNS.map(c => c.id))}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Select All
                  </button>
                  <button 
                    onClick={() => setSelectedColumns([])}
                    className="text-xs font-bold text-slate-400 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsExportModalOpen(false)}
                    className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleExport}
                    disabled={selectedColumns.length === 0}
                    className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
