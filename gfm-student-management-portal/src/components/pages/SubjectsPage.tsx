import React, { useState } from 'react';
import { BookOpen, User, Clock, Hash, GraduationCap, Layers, List, X, CheckSquare, Square, Edit3, Filter } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { Subject } from '../../types';

export const SubjectsPage: React.FC = () => {
  const { appData, selectedContext, updateSubjects } = useAppContext();
  const [activeTab, setActiveTab] = useState<'all' | 'compulsory' | 'electives'>('all');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

  if (!appData || !selectedContext) return null;

  const isElectiveSubject = (subject: Subject) => {
    const name = subject.name.toLowerCase();
    const type = (subject.type || '').toLowerCase();
    
    // Patterns for elective subjects
    const electivePatterns = [
      /\belective\b/i,
      /\bpec\b/i,
      /\boec\b/i,
      /\bopen\s+elective\b/i,
      /\bprofessional\s+elective\b/i,
      /\bhonours\b/i,
      /\bminor\b/i,
      /\bvac\b/i, // Value Added Courses are often elective
    ];

    return electivePatterns.some(pattern => pattern.test(name) || pattern.test(type));
  };

  const filteredSubjects = appData.subjects.filter(s => {
    const gfmMatch = s.gfmName === selectedContext.gfmName;
    const classMatch = selectedContext.class === 'N/A' || s.class === selectedContext.class;
    const divMatch = selectedContext.division === 'N/A' || s.division === selectedContext.division;
    const typeMatch = selectedType === 'All' || (s.type || '').toLowerCase().includes(selectedType.toLowerCase());
    return gfmMatch && classMatch && divMatch && typeMatch;
  });

  const compulsorySubjects = filteredSubjects.filter(s => !isElectiveSubject(s));
  const electiveSubjects = filteredSubjects.filter(s => isElectiveSubject(s));

  const displayedSubjects = activeTab === 'all' ? filteredSubjects : activeTab === 'compulsory' ? compulsorySubjects : electiveSubjects;

  // Get students enrolled in a subject (based on VAC records or other mapping if available)
  const getEnrolledStudents = (subject: Subject) => {
    if (subject.type === 'VAC') {
      return appData.vacRecords.filter(v => v.subjectName === subject.name);
    }
    // For other subjects, you might need a more complex mapping based on your data structure
    return [];
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const handleBulkEditSave = (updates: Partial<Subject>) => {
    updateSubjects(Array.from(selectedIds), updates);
    setSelectedIds(new Set());
    setIsBulkEditModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Academic Subjects</h2>
          <p className="text-slate-500 font-medium">Course mapping for {selectedContext.class} {selectedContext.division}</p>
        </div>
        
        <div className="flex items-center gap-4">
          {selectedIds.size > 0 && (
            <button 
              onClick={() => setIsBulkEditModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              <span>Bulk Edit ({selectedIds.size})</span>
            </button>
          )}
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-100/80 backdrop-blur-sm rounded-2xl border border-slate-200/60">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              className="bg-transparent text-sm font-bold text-slate-600 focus:outline-none cursor-pointer"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Theory">Theory</option>
              <option value="Lab">Lab</option>
              <option value="VAC">VAC</option>
            </select>
          </div>
          <div className="flex p-1 bg-slate-100/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2",
              activeTab === 'all' 
                ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50" 
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            )}
          >
            <List className="w-4 h-4" />
            All Subjects
            <span className={cn(
              "ml-1.5 px-2 py-0.5 rounded-full text-[10px]",
              activeTab === 'all' ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-500"
            )}>
              {filteredSubjects.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('compulsory')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2",
              activeTab === 'compulsory' 
                ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50" 
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            )}
          >
            <BookOpen className="w-4 h-4" />
            Compulsory Subjects
            <span className={cn(
              "ml-1.5 px-2 py-0.5 rounded-full text-[10px]",
              activeTab === 'compulsory' ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-500"
            )}>
              {compulsorySubjects.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('electives')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2",
              activeTab === 'electives' 
                ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50" 
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            )}
          >
            <Layers className="w-4 h-4" />
            Electives
            <span className={cn(
              "ml-1.5 px-2 py-0.5 rounded-full text-[10px]",
              activeTab === 'electives' ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-500"
            )}>
              {electiveSubjects.length}
            </span>
          </button>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayedSubjects.length > 0 ? (
          displayedSubjects.map((subject, idx) => {
            const isElective = isElectiveSubject(subject);
            return (
              <div 
                key={idx} 
                onClick={() => setSelectedSubject(subject)}
                className={cn(
                  "bg-white p-8 rounded-3xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative",
                  subject.id && selectedIds.has(subject.id) ? "border-rose-500 bg-rose-50/30" : "border-slate-200"
                )}
              >
                <div className="absolute top-4 left-4 z-10">
                  <button 
                    onClick={(e) => subject.id && toggleSelection(subject.id, e)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    {subject.id && selectedIds.has(subject.id) ? (
                      <CheckSquare className="w-6 h-6 text-rose-600" />
                    ) : (
                      <Square className="w-6 h-6" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between mb-6 pl-8">
                  <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {subject.type && (
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        subject.type.includes('&') 
                          ? "bg-purple-50 text-purple-600" 
                          : subject.type.toLowerCase().includes('lab') 
                            ? "bg-emerald-50 text-emerald-600" 
                            : "bg-blue-50 text-blue-600"
                      )}>
                        {subject.type}
                      </span>
                    )}
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      isElective ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-600"
                    )}>
                      {isElective ? 'Elective Subject' : 'Compulsory Subject'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1 mb-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Subject Code: {subject.code}</p>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{subject.name}</h3>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Faculty</p>
                      <p className="text-sm font-bold text-slate-700">
                        {(() => {
                          const subjectFaculty = appData.faculty.filter(f => 
                            f.gfmName === subject.gfmName && 
                            f.class === subject.class && 
                            f.division === subject.division &&
                            (
                              (f.subjectCode && subject.code && f.subjectCode.trim() === subject.code.trim()) ||
                              (f.subjectName && subject.name && f.subjectName.trim().toLowerCase() === subject.name.trim().toLowerCase())
                            )
                          );
                          
                          if (subjectFaculty.length > 0) {
                            return [...new Set(subjectFaculty.map(f => f.facultyName))].join(', ');
                          }
                          
                          return subject.faculty || 'Not Assigned';
                        })()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Weekly Hours</p>
                      <p className="text-sm font-bold text-slate-700">{subject.weeklyHours} Hours</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="bg-slate-100 p-4 rounded-3xl text-slate-400">
                <BookOpen className="w-8 h-8" />
              </div>
              <p className="text-slate-500 font-medium">No subjects found for this context</p>
            </div>
          </div>
        )}
      </div>

      {/* Subject Details Modal */}
      {selectedSubject && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-900">{selectedSubject.name}</h2>
              <button 
                onClick={() => setSelectedSubject(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase">Subject Code</p>
                  <p className="font-bold text-slate-900">{selectedSubject.code}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase">Faculty</p>
                  <p className="font-bold text-slate-900">
                    {(() => {
                      const subjectFaculty = appData.faculty.filter(f => 
                        f.gfmName === selectedSubject.gfmName && 
                        f.class === selectedSubject.class && 
                        f.division === selectedSubject.division &&
                        (
                          (f.subjectCode && selectedSubject.code && f.subjectCode.trim() === selectedSubject.code.trim()) ||
                          (f.subjectName && selectedSubject.name && f.subjectName.trim().toLowerCase() === selectedSubject.name.trim().toLowerCase())
                        )
                      );
                      
                      if (subjectFaculty.length > 0) {
                        return subjectFaculty.map(f => `${f.facultyName} (${f.role})`).join(', ');
                      }
                      
                      return selectedSubject.faculty || 'Not Assigned';
                    })()}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900 mb-4">Enrolled Students</h4>
                {getEnrolledStudents(selectedSubject).length > 0 ? (
                  <ul className="space-y-2">
                    {getEnrolledStudents(selectedSubject).map((student, idx) => (
                      <li key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="font-medium text-slate-700">{student.studentName}</span>
                        <span className="text-xs font-bold text-slate-400">Roll: {student.rollNo}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 italic">No specific enrollment data available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

const BulkEditModal: React.FC<{ selectedCount: number; onClose: () => void; onSave: (updates: Partial<Subject>) => void }> = ({ selectedCount, onClose, onSave }) => {
  const [field, setField] = useState<keyof Subject>('faculty');
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ [field]: field === 'weeklyHours' ? Number(value) : value });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-slate-900">Bulk Edit Subjects</h3>
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
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                value={field}
                onChange={(e) => {
                  setField(e.target.value as keyof Subject);
                  setValue('');
                }}
              >
                <option value="faculty">Faculty Name</option>
                <option value="type">Subject Type</option>
                <option value="weeklyHours">Weekly Hours</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Value</label>
              {field === 'type' ? (
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Theory">Theory</option>
                  <option value="Lab">Lab</option>
                  <option value="Theory & Lab">Theory & Lab</option>
                  <option value="VAC">VAC</option>
                </select>
              ) : (
                <input 
                  type={field === 'weeklyHours' ? 'number' : 'text'}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
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
