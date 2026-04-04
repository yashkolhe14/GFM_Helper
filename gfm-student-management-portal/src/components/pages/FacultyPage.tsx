import React, { useState } from 'react';
import { UserCog, BookOpen, Hash, GraduationCap, Search, Download, Filter, X, Plus, UserPlus, Shield, UserCheck, CheckSquare, Square, Edit3 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { FacultyMapping } from '../../types';

interface InstructorInfo {
  id: string;
  name: string;
  role: string;
}

interface GroupedFaculty {
  subjectCode: string;
  subjectName: string;
  class: string;
  division: string;
  type: string;
  instructors: InstructorInfo[];
}

export const FacultyPage: React.FC = () => {
  const { appData, selectedContext, addFacultyMapping, updateFaculty } = useAppContext();
  const [selectedInstructor, setSelectedInstructor] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedDivision, setSelectedDivision] = useState<string>('All');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [selectedInstructors, setSelectedInstructors] = useState<Set<string>>(new Set());
  
  const [newAssignment, setNewAssignment] = useState<Partial<FacultyMapping>>({
    facultyName: '',
    subjectName: '',
    subjectCode: '',
    role: 'Primary Instructor',
    type: 'Theory',
  });

  const [bulkAssignment, setBulkAssignment] = useState({
    facultyName: '',
    role: 'Primary Instructor',
  });

  const [bulkEditRole, setBulkEditRole] = useState('Primary Instructor');

  if (!appData || !selectedContext) return null;

  // Get all unique classes and divisions for the filters
  const allClasses = ['All', ...new Set(appData.faculty.map(f => f.class))].sort();
  const allDivisions = ['All', ...new Set(appData.faculty.map(f => f.division))].sort();

  const filteredFaculty = appData.faculty.filter(f => {
    const gfmMatch = f.gfmName === selectedContext.gfmName;
    const classMatch = selectedClass === 'All' ? (selectedContext.class === 'N/A' || f.class === selectedContext.class) : f.class === selectedClass;
    const divMatch = selectedDivision === 'All' ? (selectedContext.division === 'N/A' || f.division === selectedContext.division) : f.division === selectedDivision;
    return gfmMatch && classMatch && divMatch;
  });

  const contextSubjects = appData.subjects.filter(s => {
    const gfmMatch = s.gfmName === selectedContext.gfmName;
    const classMatch = selectedClass === 'All' ? (selectedContext.class === 'N/A' || s.class === selectedContext.class) : s.class === selectedClass;
    const divMatch = selectedDivision === 'All' ? (selectedContext.division === 'N/A' || s.division === selectedContext.division) : s.division === selectedDivision;
    return gfmMatch && classMatch && divMatch;
  });

  // Group all faculty by subject AND class/division to avoid merging different class contexts
  const groupedFaculty = contextSubjects.reduce((acc, curr) => {
    const key = `${curr.code}-${curr.name}-${curr.class}-${curr.division}`;
    if (!acc[key]) {
      acc[key] = {
        subjectCode: curr.code,
        subjectName: curr.name,
        class: curr.class,
        division: curr.division,
        type: curr.type || 'Theory',
        instructors: []
      };
    }
    return acc;
  }, {} as Record<string, GroupedFaculty>);

  filteredFaculty.forEach(curr => {
    const key = `${curr.subjectCode}-${curr.subjectName}-${curr.class}-${curr.division}`;
    if (groupedFaculty[key]) {
      if (!groupedFaculty[key].instructors.find(i => i.name === curr.facultyName && i.role === curr.role)) {
        groupedFaculty[key].instructors.push({ id: curr.id || '', name: curr.facultyName, role: curr.role || 'Instructor' });
      }
    } else {
      groupedFaculty[key] = {
        subjectCode: curr.subjectCode,
        subjectName: curr.subjectName,
        class: curr.class,
        division: curr.division,
        type: curr.type || 'Theory',
        instructors: [{ id: curr.id || '', name: curr.facultyName, role: curr.role || 'Instructor' }]
      };
    }
  });

  const uniqueInstructors = ['All', ...new Set((Object.values(groupedFaculty) as GroupedFaculty[]).flatMap(f => f.instructors.map(i => i.name)))].sort();
  const uniqueSubjects = ['All', ...new Set((Object.values(groupedFaculty) as GroupedFaculty[]).map(f => f.subjectName))].sort();
  const uniqueRoles = ['All', ...new Set((Object.values(groupedFaculty) as GroupedFaculty[]).flatMap(f => f.instructors.map(i => i.role)))].sort();

  // Filter the grouped list based on dropdowns
  const facultyList = (Object.values(groupedFaculty) as GroupedFaculty[]).filter(f => {
    const subjectMatch = selectedSubject === 'All' || f.subjectName === selectedSubject;
    
    let instructorRoleMatch = true;
    if (selectedInstructor !== 'All' && selectedRole !== 'All') {
      instructorRoleMatch = f.instructors.some(i => i.name === selectedInstructor && i.role === selectedRole);
    } else if (selectedInstructor !== 'All') {
      instructorRoleMatch = f.instructors.some(i => i.name === selectedInstructor);
    } else if (selectedRole !== 'All') {
      instructorRoleMatch = f.instructors.some(i => i.role === selectedRole);
    }

    return subjectMatch && instructorRoleMatch;
  });

  const toggleSubjectSelection = (key: string) => {
    const newSelection = new Set(selectedSubjects);
    if (newSelection.has(key)) {
      newSelection.delete(key);
    } else {
      newSelection.add(key);
    }
    setSelectedSubjects(newSelection);
  };

  const toggleInstructorSelection = (id: string) => {
    const newSelection = new Set(selectedInstructors);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedInstructors(newSelection);
  };

  const handleRoleChange = (id: string, newRole: string) => {
    updateFaculty([id], { role: newRole });
  };

  const handleBulkEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateFaculty(Array.from(selectedInstructors), { role: bulkEditRole });
    setSelectedInstructors(new Set());
    setIsBulkEditModalOpen(false);
  };

  const handleBulkAssignSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkAssignment.facultyName) {
      Array.from(selectedSubjects).forEach(key => {
        const subjectGroup = groupedFaculty[key];
        if (subjectGroup) {
          addFacultyMapping({
            facultyName: bulkAssignment.facultyName,
            subjectName: subjectGroup.subjectName,
            subjectCode: subjectGroup.subjectCode,
            role: bulkAssignment.role,
            type: subjectGroup.type,
            class: subjectGroup.class,
            division: subjectGroup.division,
            semester: selectedContext.semester,
            gfmName: selectedContext.gfmName,
          });
        }
      });
      setSelectedSubjects(new Set());
      setIsBulkAssignModalOpen(false);
      setBulkAssignment({ facultyName: '', role: 'Primary Instructor' });
    }
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAssignment.facultyName && newAssignment.subjectName && newAssignment.subjectCode) {
      addFacultyMapping({
        ...newAssignment as FacultyMapping,
        class: selectedContext.class,
        division: selectedContext.division,
        semester: selectedContext.semester,
        gfmName: selectedContext.gfmName,
      });
      setIsAssignModalOpen(false);
      setNewAssignment({
        facultyName: '',
        subjectName: '',
        subjectCode: '',
        role: 'Primary Instructor',
        type: 'Theory',
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Faculty & Instructors</h2>
          <p className="text-slate-500 font-medium">Subject mapping for {selectedContext.class} {selectedContext.division}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {selectedSubjects.size > 0 && (
            <button 
              onClick={() => setIsBulkAssignModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Bulk Assign ({selectedSubjects.size})</span>
            </button>
          )}
          
          {selectedInstructors.size > 0 && (
            <button 
              onClick={() => setIsBulkEditModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              <span>Bulk Edit Roles ({selectedInstructors.size})</span>
            </button>
          )}

          {/* Filters */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <UserCog className="w-4 h-4 text-slate-400" />
            <select 
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none max-w-[150px]"
              value={selectedInstructor}
              onChange={(e) => setSelectedInstructor(e.target.value)}
            >
              <option value="All">All Instructors</option>
              {uniqueInstructors.filter(name => name !== 'All').map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            {selectedInstructor !== 'All' && (
              <button 
                onClick={() => setSelectedInstructor('All')}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <select 
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none max-w-[150px]"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="All">All Subjects</option>
              {uniqueSubjects.filter(name => name !== 'All').map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            {selectedSubject !== 'All' && (
              <button 
                onClick={() => setSelectedSubject('All')}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <Shield className="w-4 h-4 text-slate-400" />
            <select 
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none max-w-[150px]"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="All">All Roles</option>
              {uniqueRoles.filter(name => name !== 'All').map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            {selectedRole !== 'All' && (
              <button 
                onClick={() => setSelectedRole('All')}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <GraduationCap className="w-4 h-4 text-slate-400" />
            <select 
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {allClasses.map(cls => (
                <option key={cls} value={cls}>{cls === 'All' ? 'All Classes' : cls}</option>
              ))}
            </select>
          </div>

          {/* Division Filter */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none"
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
            >
              {allDivisions.map(div => (
                <option key={div} value={div}>{div === 'All' ? 'All Divisions' : div}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={() => setIsAssignModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Faculty</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {facultyList.length > 0 ? (
          facultyList.map((subjectGroup, idx) => {
            const subjectKey = `${subjectGroup.subjectCode}-${subjectGroup.subjectName}-${subjectGroup.class}-${subjectGroup.division}`;
            const isSubjectSelected = selectedSubjects.has(subjectKey);
            
            return (
              <div key={idx} className={cn(
                "bg-white p-8 rounded-3xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative",
                isSubjectSelected ? "border-indigo-500 bg-indigo-50/30" : "border-slate-200"
              )}>
                <div className="absolute top-4 left-4 z-10">
                  <button 
                    onClick={() => toggleSubjectSelection(subjectKey)}
                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {isSubjectSelected ? (
                      <CheckSquare className="w-6 h-6 text-indigo-600" />
                    ) : (
                      <Square className="w-6 h-6" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between mb-6 pl-8">
                  <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {subjectGroup.type || 'Theory'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Subject</p>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{subjectGroup.subjectName}</h3>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Instructors & Roles</p>
                    <div className="space-y-2">
                      {subjectGroup.instructors.length > 0 ? subjectGroup.instructors.map((instructor, iIdx) => {
                        const isInstructorSelected = selectedInstructors.has(instructor.id);
                        return (
                          <div 
                            key={iIdx}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-2xl border transition-all",
                              isInstructorSelected 
                                ? "bg-rose-50 border-rose-200" 
                                : "bg-slate-50 text-slate-700 border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => toggleInstructorSelection(instructor.id)}
                                className="text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                {isInstructorSelected ? (
                                  <CheckSquare className="w-4 h-4 text-rose-600" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                              <div className="w-2 h-2 rounded-full bg-indigo-400" />
                              <span className="text-sm font-bold">{instructor.name}</span>
                            </div>
                            <select 
                              className="text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider bg-white text-slate-600 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              value={instructor.role}
                              onChange={(e) => handleRoleChange(instructor.id, e.target.value)}
                            >
                              <option value="Primary Instructor">Primary Instructor</option>
                              <option value="Lab Assistant">Lab Assistant</option>
                              <option value="Co-Instructor">Co-Instructor</option>
                              <option value="Visiting Faculty">Visiting Faculty</option>
                            </select>
                          </div>
                        );
                      }) : (
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                          <span className="text-sm font-medium text-slate-400">No faculty assigned</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              <div className="space-y-4 pt-6 border-t border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Subject Code</p>
                    <p className="text-sm font-bold text-slate-700">{subjectGroup.subjectCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Class Context</p>
                    <p className="text-sm font-bold text-slate-700">{subjectGroup.class} • {subjectGroup.division}</p>
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
                <UserCog className="w-8 h-8" />
              </div>
              <p className="text-slate-500 font-medium">No faculty data found for this context</p>
            </div>
          </div>
        )}
      </div>

      {/* Assign Faculty Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Assign Faculty</h3>
              </div>
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAssign} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Faculty Name</label>
                  <div className="relative">
                    <UserCog className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      placeholder="Enter faculty name"
                      value={newAssignment.facultyName}
                      onChange={(e) => setNewAssignment({...newAssignment, facultyName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Subject Name</label>
                    <div className="relative">
                      <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        placeholder="Subject"
                        value={newAssignment.subjectName}
                        onChange={(e) => setNewAssignment({...newAssignment, subjectName: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Code</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        placeholder="Code"
                        value={newAssignment.subjectCode}
                        onChange={(e) => setNewAssignment({...newAssignment, subjectCode: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Role</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                      value={newAssignment.role}
                      onChange={(e) => setNewAssignment({...newAssignment, role: e.target.value})}
                    >
                      <option value="Primary Instructor">Primary Instructor</option>
                      <option value="Lab Assistant">Lab Assistant</option>
                      <option value="Co-Instructor">Co-Instructor</option>
                      <option value="Visiting Faculty">Visiting Faculty</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Type</label>
                  <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                      value={newAssignment.type}
                      onChange={(e) => setNewAssignment({...newAssignment, type: e.target.value})}
                    >
                      <option value="Theory">Theory</option>
                      <option value="Practical">Practical</option>
                      <option value="Tutorial">Tutorial</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Bulk Assign Modal */}
      {isBulkAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Bulk Assign Faculty</h3>
                  <p className="text-indigo-200 text-xs font-medium">To {selectedSubjects.size} selected subjects</p>
                </div>
              </div>
              <button 
                onClick={() => setIsBulkAssignModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleBulkAssignSave} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Faculty Name</label>
                  <div className="relative">
                    <UserCog className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      placeholder="Enter faculty name"
                      value={bulkAssignment.facultyName}
                      onChange={(e) => setBulkAssignment({...bulkAssignment, facultyName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Role</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                      value={bulkAssignment.role}
                      onChange={(e) => setBulkAssignment({...bulkAssignment, role: e.target.value})}
                    >
                      <option value="Primary Instructor">Primary Instructor</option>
                      <option value="Lab Assistant">Lab Assistant</option>
                      <option value="Co-Instructor">Co-Instructor</option>
                      <option value="Visiting Faculty">Visiting Faculty</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsBulkAssignModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  Assign to All
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Edit Roles Modal */}
      {isBulkEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-rose-600 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Bulk Edit Roles</h3>
                  <p className="text-rose-200 text-xs font-medium">For {selectedInstructors.size} selected instructors</p>
                </div>
              </div>
              <button 
                onClick={() => setIsBulkEditModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleBulkEditSave} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">New Role</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all appearance-none"
                      value={bulkEditRole}
                      onChange={(e) => setBulkEditRole(e.target.value)}
                    >
                      <option value="Primary Instructor">Primary Instructor</option>
                      <option value="Lab Assistant">Lab Assistant</option>
                      <option value="Co-Instructor">Co-Instructor</option>
                      <option value="Visiting Faculty">Visiting Faculty</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsBulkEditModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-2xl font-bold text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95"
                >
                  Update Roles
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
