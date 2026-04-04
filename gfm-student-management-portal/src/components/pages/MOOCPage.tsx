import React, { useState, useMemo } from 'react';
import { Globe, CheckCircle2, Search, Download, Filter, ExternalLink, CheckSquare, Square, Edit3, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { MOOCRecord } from '../../types';

export const MOOCPage: React.FC = () => {
  const { appData, selectedContext, updateMOOCRecords } = useAppContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

  if (!appData || !selectedContext) return null;

  const filteredMOOC = appData.moocRecords.filter(m => {
    const gfmMatch = m.gfmName === selectedContext.gfmName;
    const classMatch = selectedContext.class === 'N/A' || m.class === selectedContext.class;
    const divMatch = selectedContext.division === 'N/A' || m.division === selectedContext.division;
    
    const matchesSearch = 
      m.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.rollNo.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesPlatform = platformFilter === 'All' || m.platform === platformFilter;
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    
    return gfmMatch && classMatch && divMatch && matchesSearch && matchesPlatform && matchesStatus;
  });

  const groupedMOOC = useMemo(() => {
    const groups: Map<string, typeof appData.moocRecords> = new Map();
    filteredMOOC.forEach(m => {
      const key = `${m.rollNo || ''}-${m.studentName}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(m);
    });
    return Array.from(groups.values());
  }, [filteredMOOC]);

  const maxCourses = useMemo(() => {
    let max = 0;
    groupedMOOC.forEach(records => {
      if (records.length > max) max = records.length;
    });
    return Math.max(max, 1);
  }, [groupedMOOC]);

  const toggleSelection = (ids: string[]) => {
    const newSelection = new Set(selectedIds);
    const allSelected = ids.every(id => newSelection.has(id));
    
    if (allSelected) {
      ids.forEach(id => newSelection.delete(id));
    } else {
      ids.forEach(id => newSelection.add(id));
    }
    setSelectedIds(newSelection);
  };

  const toggleAll = () => {
    const allRecordIds = filteredMOOC.map(m => m.id).filter(Boolean) as string[];
    if (selectedIds.size === allRecordIds.length && allRecordIds.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allRecordIds));
    }
  };

  const handleBulkEditSave = (updates: Partial<MOOCRecord>, courseIndex: number | 'All') => {
    let idsToUpdate: string[] = [];
    
    if (courseIndex === 'All') {
      idsToUpdate = Array.from(selectedIds);
    } else {
      // For each student group, if any of their records are in the selection,
      // target only the record at the specified course index.
      groupedMOOC.forEach(records => {
        const hasSelectedRecord = records.some(r => r.id && selectedIds.has(r.id));
        if (hasSelectedRecord) {
          const targetRecord = records[courseIndex - 1];
          if (targetRecord && targetRecord.id) {
            idsToUpdate.push(targetRecord.id);
          }
        }
      });
    }

    updateMOOCRecords(idsToUpdate, updates);
    setSelectedIds(new Set());
    setIsBulkEditModalOpen(false);
  };

  const platforms = Array.from(new Set(appData.moocRecords.map(m => m.platform))).filter(Boolean);
  const completed = filteredMOOC.filter(m => m.status.toLowerCase().includes('complete')).length;
  const uniqueStudents = new Set(filteredMOOC.map(m => m.rollNo)).size;

  const contextStudents = useMemo(() => appData.students.filter(s => 
    s.gfmName === selectedContext.gfmName && 
    (selectedContext.class === 'N/A' || s.class === selectedContext.class) &&
    (selectedContext.division === 'N/A' || s.division === selectedContext.division)
  ), [appData.students, selectedContext]);

  const totalContextStudents = contextStudents.length || 1;

  const courseEnrollmentStats = useMemo(() => {
    const stats: Record<string, { enrolled: number; total: number }> = {};
    filteredMOOC.forEach(m => {
      if (m.courseName === '-' || !m.courseName) return;
      if (!stats[m.courseName]) {
        stats[m.courseName] = { enrolled: 0, total: 0 };
      }
      // Count unique students per course for enrollment
      if (m.status === 'Enrolled' || m.status === 'In Progress' || m.status === 'Completed') {
        stats[m.courseName].enrolled++;
      }
      stats[m.courseName].total++;
    });
    return Object.entries(stats)
      .map(([name, data]) => ({
        name,
        ...data,
        percentage: Math.round((data.enrolled / totalContextStudents) * 100)
      }))
      .sort((a, b) => b.enrolled - a.enrolled);
  }, [filteredMOOC, totalContextStudents]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">MOOC Certifications</h2>
          <p className="text-slate-500 font-medium">Tracking {filteredMOOC.length} online course records for {selectedContext.gfmName}</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
          <Download className="w-4 h-4" />
          <span>Export MOOC Data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Courses</p>
            <p className="text-2xl font-black text-slate-900">{filteredMOOC.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-2xl text-green-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</p>
            <p className="text-2xl font-black text-slate-900">{completed}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-amber-50 p-3 rounded-2xl text-amber-600">
            <ExternalLink className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unique Students</p>
            <p className="text-2xl font-black text-slate-900">{uniqueStudents}</p>
          </div>
        </div>
      </div>

      {/* Enrollment Statistics Card */}
      {courseEnrollmentStats.length > 0 && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Course Enrollment Stats</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Learning Progress</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {courseEnrollmentStats.map((stat, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-black text-slate-900 line-clamp-1">{stat.name}</p>
                  <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-indigo-600">
                    {stat.percentage}%
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Enrolled: {stat.enrolled}</span>
                    <span>Context Total: {totalContextStudents}</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 w-full max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by student, platform or course..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full"
              />
            </div>
            {selectedIds.size > 0 && (
              <button 
                onClick={() => setIsBulkEditModalOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95 whitespace-nowrap"
              >
                <Edit3 className="w-4 h-4" />
                <span>Bulk Edit ({selectedIds.size})</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-auto"
            >
              <option value="All">All Platforms</option>
              {platforms.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-auto"
            >
              <option value="All">All Statuses</option>
              <option value="Enrolled">Enrolled</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Not Enrolled">Not Enrolled</option>
            </select>
            <button className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 w-12">
                  <button onClick={toggleAll} className="text-slate-400 hover:text-indigo-600 transition-colors">
                    {selectedIds.size > 0 && selectedIds.size === filteredMOOC.map(m => m.id).filter(Boolean).length ? (
                      <CheckSquare className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Roll No</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Name</th>
                {Array.from({ length: maxCourses }).map((_, i) => (
                  <th key={i} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Course {i + 1}
                  </th>
                ))}
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dates</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Certification</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {groupedMOOC.length > 0 ? (
                groupedMOOC.map((records, idx) => {
                  const first = records[0];
                  const recordIds = records.map(r => r.id).filter(Boolean) as string[];
                  const isAnySelected = recordIds.some(id => selectedIds.has(id));
                  const areAllSelected = recordIds.every(id => selectedIds.has(id));
                  
                  return (
                    <tr key={idx} className={cn(
                      "hover:bg-slate-50/50 transition-colors group",
                      isAnySelected && "bg-indigo-50/30"
                    )}>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => toggleSelection(recordIds)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {areAllSelected ? (
                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-slate-100 rounded-xl text-sm font-bold text-slate-700">
                          {first.rollNo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{first.studentName}</p>
                      </td>
                      {Array.from({ length: maxCourses }).map((_, i) => {
                        const record = records[i];
                        return (
                          <td key={i} className="px-6 py-4">
                            {record ? (
                              <div className="space-y-1">
                                <p className={cn(
                                  "text-sm font-bold",
                                  record.courseName === '-' ? "text-slate-300" : "text-slate-700"
                                )}>
                                  {record.courseName}
                                </p>
                                {record.platform !== '-' && (
                                  <p className="text-[10px] font-medium text-indigo-500 uppercase tracking-wider">
                                    {record.platform}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm font-bold text-slate-300">-</p>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {records.map((record, i) => (
                            <span key={i} className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider block w-fit",
                              record.status === 'Completed' ? "bg-green-50 text-green-600" : 
                              record.status === 'Enrolled' ? "bg-blue-50 text-blue-600" :
                              "bg-slate-50 text-slate-400"
                            )}>
                              {record.status}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {records.map((record, i) => (
                            <p key={i} className="text-xs font-medium text-slate-500 h-4">{record.duration || '-'}</p>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {records.map((record, i) => (
                            <div key={i} className="text-[9px] font-bold text-slate-400 h-4 flex items-center">
                              {record.startDate || record.endDate ? `${record.startDate || '?'} - ${record.endDate || '?'}` : '-'}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {records.map((record, i) => (
                            <div key={i} className="flex items-center gap-2 h-4">
                              {record.certification.toLowerCase().includes('yes') ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <Globe className="w-4 h-4 text-slate-300" />
                              )}
                              <p className="text-xs font-medium text-slate-500">{record.certification}</p>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-slate-100 p-4 rounded-3xl text-slate-400">
                        <Globe className="w-8 h-8" />
                      </div>
                      <p className="text-slate-500 font-medium">No MOOC records found for this context</p>
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
          maxCourses={maxCourses}
          onClose={() => setIsBulkEditModalOpen(false)}
          onSave={handleBulkEditSave}
        />
      )}
    </div>
  );
};

const BulkEditModal: React.FC<{ 
  selectedCount: number; 
  maxCourses: number;
  onClose: () => void; 
  onSave: (updates: Partial<MOOCRecord>, courseIndex: number | 'All') => void 
}> = ({ selectedCount, maxCourses, onClose, onSave }) => {
  const [field, setField] = useState<keyof MOOCRecord>('status');
  const [value, setValue] = useState('');
  const [courseIndex, setCourseIndex] = useState<number | 'All'>('All');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ [field]: value }, courseIndex);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-slate-900">Bulk Edit MOOC</h3>
              <p className="text-slate-500 font-medium">
                {courseIndex === 'All' 
                  ? `Updating all records for selected students` 
                  : `Updating Course ${courseIndex} for selected students`}
              </p>
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
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Course</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={courseIndex}
                onChange={(e) => setCourseIndex(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
              >
                <option value="All">All Courses</option>
                {Array.from({ length: maxCourses }).map((_, i) => (
                  <option key={i} value={i + 1}>Course {i + 1}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Field to Update</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={field}
                onChange={(e) => {
                  setField(e.target.value as keyof MOOCRecord);
                  setValue('');
                }}
              >
                <option value="status">Status</option>
                <option value="platform">Platform</option>
                <option value="duration">Duration</option>
                <option value="startDate">Start Date</option>
                <option value="endDate">End Date</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Value</label>
              {field === 'status' ? (
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Completed">Completed</option>
                  <option value="Enrolled">Enrolled</option>
                  <option value="In Progress">In Progress</option>
                </select>
              ) : (
                <input 
                  type={field.includes('Date') ? 'date' : 'text'}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={`Enter new ${field}...`}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                />
              )}
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
