import React, { useState, useMemo } from 'react';
import { Award, CheckCircle2, Search, Download, Filter, Clock, BookOpen, Users, CheckSquare, Square, Edit3, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { VACRecord } from '../../types';

export const VACPage: React.FC = () => {
  const { appData, selectedContext, updateVACRecords } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCertification, setSelectedCertification] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  if (!appData || !selectedContext) return null;

  const contextStudents = useMemo(() => appData.students.filter(s => 
    s.gfmName === selectedContext.gfmName && 
    (selectedContext.class === 'N/A' || s.class === selectedContext.class) &&
    (selectedContext.division === 'N/A' || s.division === selectedContext.division)
  ), [appData.students, selectedContext]);

  const allStudentVACs = useMemo(() => {
    return contextStudents.flatMap(student => {
      const studentVACs = appData.vacRecords.filter(v => {
        const vRoll = String(v.rollNo || '').trim();
        const sRoll = String(student.rollNo || '').trim();
        const vName = String(v.studentName || '').toLowerCase().trim();
        const sName = String(student.name || '').toLowerCase().trim();
        
        return (vRoll && vRoll === sRoll) || (vName && vName === sName);
      });
      if (studentVACs.length === 0) {
        return [{
          id: `placeholder-${student.rollNo}`,
          studentName: student.name,
          rollNo: student.rollNo,
          subjectName: 'N/A',
          status: 'Not Enrolled',
          gfmName: student.gfmName,
          class: student.class,
          division: student.division
        } as VACRecord];
      }
      return studentVACs;
    });
  }, [contextStudents, appData.vacRecords]);

  const uniqueStatuses = useMemo(() => {
    return ['All', ...new Set(allStudentVACs.map(v => v.status).filter(Boolean))].sort();
  }, [allStudentVACs]);

  const uniqueCertifications = useMemo(() => {
    return ['All', ...new Set(allStudentVACs.map(v => v.certification).filter(Boolean))].sort();
  }, [allStudentVACs]);

  const filteredVAC = allStudentVACs.filter(v => {
    const searchMatch = searchQuery === '' || 
      String(v.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(v.subjectName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = selectedStatus === 'All' || v.status === selectedStatus;
    const certMatch = selectedCertification === 'All' || v.certification === selectedCertification;
    const subjectMatch = !selectedSubject || String(v.subjectName || '').toLowerCase() === selectedSubject.toLowerCase();
    return searchMatch && statusMatch && certMatch && subjectMatch;
  });

  const activeVACsForStats = allStudentVACs.filter(v => v.subjectName !== 'N/A');

  // Extract unique VAC subjects and their enrollment counts
  const vacSubjects = useMemo(() => {
    const subjectsMap = new Map<string, { count: number; originalName: string }>();
    activeVACsForStats.forEach(v => {
      const subjectName = String(v.subjectName || 'Unknown').trim();
      if (subjectName && subjectName !== 'N/A') {
        const key = subjectName.toLowerCase();
        const existing = subjectsMap.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          subjectsMap.set(key, { count: 1, originalName: subjectName });
        }
      }
    });
    return Array.from(subjectsMap.values()).map(item => ({ 
      name: item.originalName, 
      count: item.count,
      percentage: contextStudents.length > 0 ? Math.round((item.count / contextStudents.length) * 100) : 0
    }));
  }, [activeVACsForStats, contextStudents.length]);

  const activeVACsFiltered = filteredVAC.filter(v => v.subjectName !== 'N/A');

  const completionRate = activeVACsFiltered.length > 0 
    ? Math.round((activeVACsFiltered.filter(v => String(v.status || '').toLowerCase().includes('complete') || String(v.status || '').toLowerCase().includes('paid')).length / activeVACsFiltered.length) * 100)
    : 0;

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredVAC.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = filteredVAC.map(v => v.id).filter(Boolean) as string[];
      setSelectedIds(new Set(allIds));
    }
  };

  const handleBulkEditSave = (updates: Partial<VACRecord>) => {
    updateVACRecords(Array.from(selectedIds), updates);
    setSelectedIds(new Set());
    setIsBulkEditModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Value Added Courses (VAC)</h2>
          <p className="text-slate-500 font-medium">Specialized certification and skill enhancement programs</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-indigo-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
          <Download className="w-4 h-4" />
          <span>Export List</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Award className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Enrolled</p>
            <p className="text-3xl font-black text-slate-900">{activeVACsFiltered.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completion Rate</p>
            <p className="text-3xl font-black text-slate-900">{completionRate}%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Hours</p>
            <p className="text-3xl font-black text-slate-900">40h</p>
          </div>
        </div>
      </div>

      {/* VAC Subjects Cards */}
      {vacSubjects.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Available Courses
            </h3>
            {selectedSubject && (
              <button 
                onClick={() => setSelectedSubject(null)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
              >
                Clear Subject Filter
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {vacSubjects.map((subject, idx) => {
              const isSelected = selectedSubject?.toLowerCase() === subject.name.toLowerCase();
              return (
                <button 
                  key={idx} 
                  onClick={() => setSelectedSubject(isSelected ? null : subject.name)}
                  className={cn(
                    "bg-white p-5 rounded-3xl border transition-all group flex flex-col justify-between h-full text-left",
                    isSelected ? "border-indigo-600 ring-2 ring-indigo-600/10 shadow-md" : "border-slate-200 shadow-sm hover:border-indigo-300"
                  )}
                >
                  <div className="space-y-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                      isSelected ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
                    )}>
                      <Award className="w-4 h-4" />
                    </div>
                    <h4 className={cn(
                      "font-bold leading-tight transition-colors line-clamp-2",
                      isSelected ? "text-indigo-600" : "text-slate-700 group-hover:text-indigo-600"
                    )}>
                      {subject.name}
                    </h4>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between w-full">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3 h-3" />
                        Enrollment
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">
                          {subject.count}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {subject.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-full border-2 border-slate-100 flex items-center justify-center relative">
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="text-slate-100"
                        />
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeDasharray={88}
                          strokeDashoffset={88 - (88 * subject.percentage) / 100}
                          className="text-indigo-600 transition-all duration-1000"
                        />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Certification Roster</h3>
              <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">
                {filteredVAC.length} Records
              </span>
            </div>
            {selectedIds.size > 0 && (
              <button 
                onClick={() => setIsBulkEditModalOpen(true)}
                className="flex items-center gap-2 px-4 py-1.5 bg-rose-600 text-white rounded-lg font-bold text-xs hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Bulk Edit ({selectedIds.size})</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select 
                className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>
                {uniqueStatuses.filter(s => s !== 'All').map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <Award className="w-3.5 h-3.5 text-slate-400" />
              <select 
                className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none"
                value={selectedCertification}
                onChange={(e) => setSelectedCertification(e.target.value)}
              >
                <option value="All">All Certifications</option>
                {uniqueCertifications.filter(c => c !== 'All').map(cert => (
                  <option key={cert} value={cert}>{cert}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search records..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 text-slate-700"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 w-12">
                  <button onClick={toggleAll} className="text-slate-400 hover:text-indigo-600 transition-colors">
                    {selectedIds.size === filteredVAC.length && filteredVAC.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Roll No</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">VAC Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Certification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVAC.length > 0 ? (
                filteredVAC.map((record, idx) => {
                  const isSelected = record.id && selectedIds.has(record.id);
                  return (
                    <tr key={idx} className={cn("group hover:bg-slate-50/50 transition-colors", isSelected && "bg-indigo-50/30")}>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => record.id && toggleSelection(record.id)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{record.rollNo || '-'}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors uppercase text-sm">
                          {record.studentName}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-600">{record.subjectName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                          String(record.status || '').toLowerCase().includes('complete') || String(record.status || '').toLowerCase().includes('paid') ? "bg-emerald-100 text-emerald-700" :
                          String(record.status || '').toLowerCase().includes('progress') ? "bg-amber-100 text-amber-700" :
                          "bg-slate-100 text-slate-500"
                        )}>
                          {record.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Award className={cn(
                            "w-4 h-4",
                            String(record.certification || '').toLowerCase() === 'yes' ? "text-indigo-600" : "text-slate-300"
                          )} />
                          <span className="text-xs font-bold text-slate-500">
                            {record.certification || 'No'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-slate-100 p-4 rounded-3xl text-slate-400">
                        <Award className="w-8 h-8" />
                      </div>
                      <p className="text-slate-500 font-medium">No VAC records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isBulkEditModalOpen && (
        <BulkEditModal 
          selectedCount={selectedIds.size}
          onClose={() => setIsBulkEditModalOpen(false)}
          onSave={handleBulkEditSave}
        />
      )}
    </div>
  );
};

const BulkEditModal: React.FC<{ selectedCount: number; onClose: () => void; onSave: (updates: Partial<VACRecord>) => void }> = ({ selectedCount, onClose, onSave }) => {
  const [field, setField] = useState<keyof VACRecord>('subjectName');
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ [field]: value });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-slate-900">Bulk Edit VAC</h3>
              <p className="text-slate-500 font-medium">Updating {selectedCount} records</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Field to Update</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={field}
                onChange={(e) => {
                  setField(e.target.value as keyof VACRecord);
                  setValue('');
                }}
              >
                <option value="subjectName">VAC Name</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Value</label>
              <input 
                type="text"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={`Enter new ${field}...`}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-2xl font-bold text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
