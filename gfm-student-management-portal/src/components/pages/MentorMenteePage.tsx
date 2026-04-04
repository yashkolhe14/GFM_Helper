import React, { useState } from 'react';
import { UserCheck, Users, Mail, Phone, MessageSquare, ChevronRight, ArrowLeft, Plus, Trash2, CheckCircle2, Circle, ListTodo, X, CheckSquare, Square, Edit3 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { Student, MentorMentee, Task } from '../../types';
import { StudentDetailModal } from './StudentsPage';
import { motion, AnimatePresence } from 'motion/react';

export const MentorMenteePage: React.FC = () => {
  const { appData, selectedContext, tasks, addTask, toggleTask, deleteTask, updateMentorMentees, meetingLogs, addMeetingLog, deleteMeetingLog } = useAppContext();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [activeTaskStudent, setActiveTaskStudent] = useState<string | null>(null);
  const [activeLogStudent, setActiveLogStudent] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

  if (!appData || !selectedContext) return null;

  const filteredMentees = appData.mentorMentees.filter(m => {
    const gfmMatch = m.gfmName === selectedContext.gfmName;
    const classMatch = selectedContext.class === 'N/A' || m.class === selectedContext.class;
    const divMatch = selectedContext.division === 'N/A' || m.division === selectedContext.division;
    return gfmMatch && classMatch && divMatch;
  });

  // Group by mentor
  const mentorGroups = filteredMentees.reduce((acc, mentee) => {
    if (!acc[mentee.mentorName]) {
      acc[mentee.mentorName] = [];
    }
    acc[mentee.mentorName].push(mentee);
    return acc;
  }, {} as Record<string, MentorMentee[]>);

  const selectedMentorMentees = selectedMentor ? mentorGroups[selectedMentor] || [] : [];

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

  const handleBulkEditSave = (updates: Partial<MentorMentee>) => {
    updateMentorMentees(Array.from(selectedIds), updates);
    setSelectedIds(new Set());
    setIsBulkEditModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mentor-Mentee Mapping</h2>
          <p className="text-slate-500 font-medium">
            {selectedMentor 
              ? `Showing mentees for ${selectedMentor}` 
              : `Managing ${filteredMentees.length} mentees for ${selectedContext.gfmName}`}
          </p>
        </div>
        {selectedMentor && (
          <button 
            onClick={() => setSelectedMentor(null)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Mentors
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!selectedMentor ? (
          <motion.div 
            key="mentor-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {Object.entries(mentorGroups).length > 0 ? (
              Object.entries(mentorGroups).map(([mentorName, mentees], idx) => {
                const menteeList = mentees as MentorMentee[];
                return (
                <button
                  key={idx}
                  onClick={() => setSelectedMentor(mentorName)}
                  className="group bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all text-left flex flex-col gap-6 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                  
                  <div className="relative z-10">
                    <div className="bg-indigo-600 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 mb-6 group-hover:scale-110 transition-transform">
                      <UserCheck className="w-7 h-7" />
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{mentorName}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Faculty Mentor</p>
                      {menteeList[0]?.mentorContact && (
                        <div className="flex items-center gap-2 mt-2 text-slate-500">
                          <Phone className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">{menteeList[0].mentorContact}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[...Array(Math.min(3, menteeList.length))].map((_, i) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                            {i === 2 && menteeList.length > 3 ? `+${menteeList.length - 2}` : <Users className="w-3 h-3" />}
                          </div>
                        ))}
                      </div>
                      <span className="text-sm font-bold text-slate-600 ml-1">{menteeList.length} Mentees</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </button>
              )})
            ) : (
              <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-slate-100 p-4 rounded-3xl text-slate-400">
                    <UserCheck className="w-8 h-8" />
                  </div>
                  <p className="text-slate-500 font-medium">No mentor-mentee data found for this context</p>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="mentee-list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedMentor}</h3>
                  <div className="flex items-center gap-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Faculty Mentor</p>
                    {selectedMentorMentees[0]?.mentorContact && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <Phone className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">{selectedMentorMentees[0].mentorContact}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
                <div className="flex items-center gap-4">
                  {selectedIds.size > 0 && (
                    <button 
                      onClick={() => setIsBulkEditModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Bulk Edit ({selectedIds.size})</span>
                    </button>
                  )}
                  <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-sm font-bold text-slate-700">{selectedMentorMentees.length} Mentees</span>
                  </div>
                </div>
              </div>
              
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedMentorMentees.map((mentee, mIdx) => {
                  const studentData = appData.students.find(s => s.rollNo === mentee.studentRollNo);
                  const isSelected = mentee.id && selectedIds.has(mentee.id);
                  return (
                    <div 
                      key={mIdx} 
                      className={cn(
                        "flex items-center justify-between p-5 bg-white border rounded-2xl hover:shadow-md transition-all group cursor-pointer",
                        isSelected ? "border-rose-500 bg-rose-50/30" : "border-slate-100"
                      )}
                      onClick={() => studentData && setSelectedStudent(studentData)}
                    >
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={(e) => mentee.id && toggleSelection(mentee.id, e)}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-rose-600" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-sm font-bold text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          {mentee.studentRollNo}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{mentee.studentName}</p>
                          <div className="flex flex-col gap-0.5">
                            <p className="text-xs text-slate-400 font-medium">Mentee: {mentee.contact || 'No contact info'}</p>
                            {mentee.mentorContact && (
                              <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-tight">
                                Mentor Contact: {mentee.mentorContact} • {selectedMentorMentees.length} Mentees
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                      <button 
                        className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveLogStudent(mentee.studentRollNo);
                        }}
                        title="Meeting Logs"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTaskStudent(mentee.studentRollNo);
                        }}
                        title="Manage Tasks"
                      >
                        <ListTodo className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTaskStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Mentee Tasks</h3>
                  <p className="text-slate-500 font-medium">Manage tasks for Roll No: {activeTaskStudent}</p>
                </div>
                <button 
                  onClick={() => setActiveTaskStudent(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Add a new task..." 
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTaskTitle.trim()) {
                      addTask({ studentRollNo: activeTaskStudent, title: newTaskTitle.trim(), completed: false });
                      setNewTaskTitle('');
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    if (newTaskTitle.trim()) {
                      addTask({ studentRollNo: activeTaskStudent, title: newTaskTitle.trim(), completed: false });
                      setNewTaskTitle('');
                    }
                  }}
                  className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {tasks.filter(t => t.studentRollNo === activeTaskStudent).length > 0 ? (
                  tasks.filter(t => t.studentRollNo === activeTaskStudent).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => toggleTask(task.id)}
                          className={cn(
                            "transition-colors",
                            task.completed ? "text-emerald-500" : "text-slate-300 hover:text-indigo-400"
                          )}
                        >
                          {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </button>
                        <span className={cn(
                          "text-sm font-bold transition-all",
                          task.completed ? "text-slate-400 line-through" : "text-slate-700"
                        )}>
                          {task.title}
                        </span>
                      </div>
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-sm text-slate-400 font-bold">No tasks yet</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setActiveTaskStudent(null)}
                  className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeLogStudent && (
        <MeetingLogModal 
          studentRollNo={activeLogStudent}
          onClose={() => setActiveLogStudent(null)}
        />
      )}

      {selectedStudent && (
        <StudentDetailModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
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

const MeetingLogModal: React.FC<{ studentRollNo: string; onClose: () => void }> = ({ studentRollNo, onClose }) => {
  const { meetingLogs, addMeetingLog, deleteMeetingLog, selectedContext } = useAppContext();
  const [newRemark, setNewRemark] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);

  const studentLogs = meetingLogs.filter(l => l.studentRollNo === studentRollNo);

  const handleAddLog = () => {
    if (!newRemark.trim() || !selectedContext) return;
    addMeetingLog({
      studentRollNo,
      date: meetingDate,
      remarks: newRemark.trim(),
      gfmName: selectedContext.gfmName
    });
    setNewRemark('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-foreground">Meeting Logs</h3>
              <p className="text-muted-foreground font-medium">Tracking progress for Roll No: {studentRollNo}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-4 bg-muted/30 p-6 rounded-3xl border border-border/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Meeting Date</label>
                <input 
                  type="date"
                  className="w-full p-3 bg-card border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Remarks / Discussion Points</label>
              <textarea 
                placeholder="Enter meeting remarks..." 
                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] resize-none"
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
              />
            </div>
            <button 
              onClick={handleAddLog}
              disabled={!newRemark.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Add Meeting Log</span>
            </button>
          </div>

          <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {studentLogs.length > 0 ? (
              studentLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                <div key={log.id} className="p-4 bg-card border border-border rounded-2xl group relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">{log.date}</span>
                    <button 
                      onClick={() => deleteMeetingLog(log.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{log.remarks}</p>
                </div>
              ))
            ) : (
              <div className="py-12 text-center bg-muted/20 rounded-3xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground font-bold">No meeting logs recorded yet</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button 
              onClick={onClose}
              className="px-8 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BulkEditModal: React.FC<{ selectedCount: number; onClose: () => void; onSave: (updates: Partial<MentorMentee>) => void }> = ({ selectedCount, onClose, onSave }) => {
  const [field, setField] = useState<keyof MentorMentee>('mentorName');
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
              <h3 className="text-2xl font-black text-slate-900">Bulk Edit Mentees</h3>
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
                  setField(e.target.value as keyof MentorMentee);
                  setValue('');
                }}
              >
                <option value="mentorName">Mentor Name</option>
                <option value="mentorContact">Mentor Contact</option>
                <option value="remarks">Remarks</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Value</label>
              <input 
                type="text"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
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
