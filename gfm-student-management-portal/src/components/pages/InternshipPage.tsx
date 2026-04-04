import React, { useState } from 'react';
import { Briefcase, Building2, User, Calendar, Search, Download, Filter, X, IndianRupee, Info, CheckSquare, Square, Edit3 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { Internship } from '../../types';

export const InternshipPage: React.FC = () => {
  const { appData, selectedContext, updateInternships } = useAppContext();
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

  if (!appData || !selectedContext) return null;

  const filteredInternships = appData.internships.filter(i => {
    const gfmMatch = i.gfmName === selectedContext.gfmName;
    const classMatch = selectedContext.class === 'N/A' || i.class === selectedContext.class;
    const divMatch = selectedContext.division === 'N/A' || i.division === selectedContext.division;
    const hasActiveInternship = i.company && 
                               i.company !== 'N/A' && 
                               i.company !== '-' && 
                               i.company !== 'None' && 
                               i.company.trim() !== '';
    return gfmMatch && classMatch && divMatch && hasActiveInternship;
  });

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
    if (selectedIds.size === filteredInternships.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = filteredInternships.map(i => i.id).filter(Boolean) as string[];
      setSelectedIds(new Set(allIds));
    }
  };

  const handleBulkEditSave = (updates: Partial<Internship>) => {
    updateInternships(Array.from(selectedIds), updates);
    setSelectedIds(new Set());
    setIsBulkEditModalOpen(false);
  };

  const contextStudents = React.useMemo(() => appData.students.filter(s => 
    s.gfmName === selectedContext.gfmName && 
    (selectedContext.class === 'N/A' || s.class === selectedContext.class) &&
    (selectedContext.division === 'N/A' || s.division === selectedContext.division)
  ), [appData.students, selectedContext]);

  const totalContextStudents = contextStudents.length || 1;

  const studentsWithInternships = React.useMemo(() => {
    const uniqueRolls = new Set(filteredInternships.map(i => i.rollNo));
    return uniqueRolls.size;
  }, [filteredInternships]);

  const studentsWithoutInternships = Math.max(0, contextStudents.length - studentsWithInternships);
  
  const internshipPercentage = Math.round((studentsWithInternships / totalContextStudents) * 100);
  const noInternshipPercentage = Math.round((studentsWithoutInternships / totalContextStudents) * 100);

  const allStudentInternships = React.useMemo(() => {
    return contextStudents.flatMap(student => {
      const studentInternships = appData.internships.filter(i => i.rollNo === student.rollNo);
      if (studentInternships.length === 0) {
        return [{
          id: `placeholder-${student.rollNo}`,
          studentName: student.name,
          rollNo: student.rollNo,
          company: 'N/A',
          role: 'Not Placed',
          stipend: '0',
          duration: '-',
          startDate: '-',
          endDate: '-',
          status: 'Not Started',
          semester: '-',
          gfmName: student.gfmName,
          class: student.class,
          division: student.division
        } as Internship];
      }
      return studentInternships;
    });
  }, [contextStudents, appData.internships]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Student Internships</h2>
          <p className="text-slate-500 font-medium">Tracking {filteredInternships.length} industry placements for {selectedContext.gfmName}</p>
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
          <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
            <Download className="w-4 h-4" />
            <span>Export Internship Data</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <Briefcase className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Doing Internship</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">{studentsWithInternships}</span>
                <span className="text-sm font-bold text-slate-500">Students</span>
              </div>
            </div>
          </div>
          <div className="text-right space-y-2">
            <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl font-black text-xl">
              {internshipPercentage}%
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Participation Rate</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-rose-200 transition-all">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-rose-50 rounded-[1.5rem] flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
              <User className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Not Doing Internship</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">{studentsWithoutInternships}</span>
                <span className="text-sm font-bold text-slate-500">Students</span>
              </div>
            </div>
          </div>
          <div className="text-right space-y-2">
            <div className="px-4 py-2 bg-rose-50 text-rose-700 rounded-2xl font-black text-xl">
              {noInternshipPercentage}%
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Placement</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 w-12">
                  <button onClick={toggleAll} className="text-slate-400 hover:text-indigo-600 transition-colors">
                    {selectedIds.size === filteredInternships.length && filteredInternships.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Roll No</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Company</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stipend</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dates</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allStudentInternships.length > 0 ? (
                allStudentInternships.map((internship, idx) => {
                  const isSelected = internship.id && selectedIds.has(internship.id);
                  const isPlaceholder = internship.id?.startsWith('placeholder-');
                  return (
                    <tr key={idx} className={cn(
                      "hover:bg-slate-50/50 transition-colors group",
                      isSelected && "bg-indigo-50/30",
                      isPlaceholder && "opacity-60"
                    )}>
                      <td className="px-6 py-4">
                        {!isPlaceholder && (
                          <button 
                            onClick={() => internship.id && toggleSelection(internship.id)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-indigo-600" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-slate-100 rounded-xl text-sm font-bold text-slate-700">
                          {internship.rollNo || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{internship.studentName}</p>
                      </td>
                      <td className="px-6 py-4">
                        {isPlaceholder ? (
                          <span className="text-slate-300 font-bold italic">No Internship</span>
                        ) : (
                          <button 
                            onClick={() => setSelectedInternship(internship)}
                            className="flex items-center gap-2 hover:text-indigo-600 transition-colors group/btn"
                          >
                            <Building2 className="w-4 h-4 text-slate-400 group-hover/btn:text-indigo-600" />
                            <p className="text-sm font-bold text-slate-700 group-hover/btn:text-indigo-600 decoration-indigo-600/30 underline-offset-4 hover:underline">{internship.company}</p>
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isPlaceholder ? (
                          <span className="text-slate-300">-</span>
                        ) : (
                          <button 
                            onClick={() => setSelectedInternship(internship)}
                            className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors decoration-indigo-600/30 underline-offset-4 hover:underline"
                          >
                            {internship.role}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                          <IndianRupee className="w-3 h-3" />
                          <span>{internship.stipend || '0'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start: {internship.startDate || '-'}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End: {internship.endDate || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-700">{internship.duration}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          isPlaceholder ? "bg-slate-100 text-slate-400" :
                          String(internship.status || '').toLowerCase().includes('complete') ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {internship.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isPlaceholder && (
                          <button 
                            onClick={() => setSelectedInternship(internship)}
                            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all"
                          >
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-slate-100 p-4 rounded-3xl text-slate-400">
                        <Briefcase className="w-8 h-8" />
                      </div>
                      <p className="text-slate-500 font-medium">No internship records found for this context</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedInternship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Internship Details</h3>
                    <p className="text-sm font-medium text-slate-500">Placement Information</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedInternship(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Name</p>
                  <p className="font-bold text-slate-900">{selectedInternship.studentName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Roll No</p>
                  <p className="font-bold text-slate-900">{selectedInternship.rollNo || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Company</p>
                  <div className="flex items-center gap-2 text-indigo-600 font-bold">
                    <Building2 className="w-4 h-4" />
                    <span>{selectedInternship.company}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</p>
                  <p className="font-bold text-slate-900">{selectedInternship.role}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stipend</p>
                  <div className="flex items-center gap-1 text-emerald-600 font-bold">
                    <IndianRupee className="w-4 h-4" />
                    <span>{selectedInternship.stipend || '0'} / month</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                  <span className={cn(
                    "inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    String(selectedInternship.status || '').toLowerCase().includes('complete') ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                  )}>
                    {selectedInternship.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</p>
                  <p className="font-bold text-slate-900">{selectedInternship.startDate || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Date</p>
                  <p className="font-bold text-slate-900">{selectedInternship.endDate || '-'}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  This internship was completed during the {selectedInternship.semester} semester as part of the industrial training program.
                </p>
              </div>

              <button 
                onClick={() => setSelectedInternship(null)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-[0.98]"
              >
                Close Details
              </button>
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

const BulkEditModal: React.FC<{ selectedCount: number; onClose: () => void; onSave: (updates: Partial<Internship>) => void }> = ({ selectedCount, onClose, onSave }) => {
  const [field, setField] = useState<keyof Internship>('status');
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
              <h3 className="text-2xl font-black text-slate-900">Bulk Edit Internships</h3>
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
                  setField(e.target.value as keyof Internship);
                  setValue('');
                }}
              >
                <option value="status">Status</option>
                <option value="company">Company</option>
                <option value="role">Role</option>
                <option value="stipend">Stipend</option>
                <option value="duration">Duration</option>
                <option value="startDate">Start Date</option>
                <option value="endDate">End Date</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Value</label>
              <input 
                type={field.includes('Date') ? 'date' : 'text'}
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
