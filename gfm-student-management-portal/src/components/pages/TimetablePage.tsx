import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User, BookOpen, Filter, X, CheckSquare, Square, Edit3 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { TimetableEntry } from '../../types';

export const TimetablePage: React.FC = () => {
  const { appData, selectedContext, updateTimetable } = useAppContext();
  const [selectedTime, setSelectedTime] = useState<string>('All');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedRoom, setSelectedRoom] = useState<string>('All');
  const [selectedDay, setSelectedDay] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [selectedEntryForDetail, setSelectedEntryForDetail] = useState<TimetableEntry | null>(null);
  
  // Notes state (persisted in localStorage)
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('timetable_notes');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [editingNote, setEditingNote] = useState<{ day: string, time: string, subject: string } | null>(null);
  const [noteText, setNoteText] = useState('');

  if (!appData || !selectedContext) return null;

  const saveNote = () => {
    if (editingNote) {
      const key = `${editingNote.day}-${editingNote.time}-${editingNote.subject}`;
      const newNotes = { ...notes, [key]: noteText };
      setNotes(newNotes);
      localStorage.setItem('timetable_notes', JSON.stringify(newNotes));
      setEditingNote(null);
      setNoteText('');
    }
  };

  // Get all unique faculty names for the filter
  const allFacultyNames = Array.from(new Set(appData.faculty.map(f => f.facultyName))).sort();
  const allSubjects = Array.from(new Set(appData.timetable.map(t => t.subject))).sort();
  const allRooms = Array.from(new Set(appData.timetable.map(t => t.room))).filter(Boolean).sort();

  const filteredTimetable = appData.timetable.filter(t => {
    const gfmMatch = t.gfmName === selectedContext.gfmName;
    const classMatch = selectedContext.class === 'N/A' || t.class === selectedContext.class;
    const divMatch = selectedContext.division === 'N/A' || t.division === selectedContext.division;
    
    // Subject filter
    const subjectMatch = selectedSubject === 'All' || t.subject === selectedSubject;
    
    // Room filter
    const roomMatch = selectedRoom === 'All' || t.room === selectedRoom;

    // Search filter
    const searchMatch = !searchTerm || 
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.faculty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.room && t.room.toLowerCase().includes(searchTerm.toLowerCase()));

    // Faculty filter logic
    let facultyMatch = true;
    if (selectedFaculty !== 'All') {
      const normalizedSelectedFaculty = selectedFaculty.toLowerCase().trim();
      
      // Check if the timetable entry explicitly mentions the faculty
      const entryFacultyMatch = t.faculty.toLowerCase().includes(normalizedSelectedFaculty);
      
      // Or check if the faculty is assigned to this subject in the faculty mapping
      const normalizedEntrySubject = t.subject.toLowerCase().trim();
      const normalizedEntryFaculty = t.faculty.toLowerCase().trim();
      
      const mappedFaculty = appData.faculty.filter(f => 
        (f.subjectName.toLowerCase().trim() === normalizedEntrySubject || 
         f.subjectCode.toLowerCase().trim() === normalizedEntrySubject ||
         (normalizedEntryFaculty && f.subjectCode.toLowerCase().trim() === normalizedEntryFaculty)) && 
        f.class === t.class && 
        f.division === t.division
      );
      const isMapped = mappedFaculty.some(f => f.facultyName.toLowerCase().trim() === normalizedSelectedFaculty);
      
      facultyMatch = entryFacultyMatch || isMapped;
    }

    return gfmMatch && classMatch && divMatch && facultyMatch && subjectMatch && roomMatch && searchMatch;
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const filteredDays = selectedDay === 'All' ? days : [selectedDay];
  
  const allTimeSlots = Array.from(new Set(filteredTimetable.map(t => t.time))).sort();
  
  const displayTimeSlots = selectedTime === 'All' 
    ? allTimeSlots 
    : allTimeSlots.filter(t => t === selectedTime);

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const handleBulkEditSave = (updates: Partial<TimetableEntry>) => {
    updateTimetable(Array.from(selectedIds), updates);
    setSelectedIds(new Set());
    setIsBulkEditModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Class Timetable</h2>
          <p className="text-slate-500 font-medium">Weekly schedule for {selectedContext.class} {selectedContext.division}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm min-w-[200px]">
            <Filter className="w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search subject, faculty, room..."
              className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {selectedIds.size > 0 && (
            <button 
              onClick={() => setIsBulkEditModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              <span>Bulk Edit ({selectedIds.size})</span>
            </button>
          )}
          {/* Day Filter */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select 
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
            >
              <option value="All">All Days</option>
              {days.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
            {selectedDay !== 'All' && (
              <button 
                onClick={() => setSelectedDay('All')}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Time Filter */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <Clock className="w-4 h-4 text-slate-400" />
            <select 
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            >
              <option value="All">All Time Slots</option>
              {allTimeSlots.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
            {selectedTime !== 'All' && (
              <button 
                onClick={() => setSelectedTime('All')}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Faculty Filter */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <User className="w-4 h-4 text-slate-400" />
            <select 
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none max-w-[150px]"
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
            >
              <option value="All">All Faculty</option>
              {allFacultyNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            {selectedFaculty !== 'All' && (
              <button 
                onClick={() => setSelectedFaculty('All')}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <select 
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none max-w-[150px]"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="All">All Subjects</option>
              {allSubjects.map(name => (
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

          {/* Room Filter */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <MapPin className="w-4 h-4 text-slate-400" />
            <select 
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none max-w-[150px]"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
            >
              <option value="All">All Rooms</option>
              {allRooms.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            {selectedRoom !== 'All' && (
              <button 
                onClick={() => setSelectedRoom('All')}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {(selectedDay !== 'All' || selectedTime !== 'All' || selectedFaculty !== 'All' || selectedSubject !== 'All' || selectedRoom !== 'All' || searchTerm) && (
            <button 
              onClick={() => {
                setSelectedDay('All');
                setSelectedTime('All');
                setSelectedFaculty('All');
                setSelectedSubject('All');
                setSelectedRoom('All');
                setSearchTerm('');
              }}
              className="px-4 py-2 text-rose-600 font-bold text-sm hover:bg-rose-50 rounded-xl transition-all"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-6 py-6 text-left border-r border-slate-800 min-w-[150px]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-widest">Time Slot</span>
                  </div>
                </th>
                {filteredDays.map(day => (
                  <th key={day} className="px-6 py-6 text-center border-r border-slate-800 min-w-[200px]">
                    <span className="text-xs font-bold uppercase tracking-widest">{day}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayTimeSlots.length > 0 ? (
                displayTimeSlots.map(time => (
                  <tr key={time} className="group">
                    <td className="px-6 py-8 bg-slate-50 border-r border-slate-100 group-hover:bg-indigo-50 transition-colors">
                      <p className="text-sm font-black text-slate-900">{time}</p>
                    </td>
                    {filteredDays.map(day => {
                      const entry = filteredTimetable.find(t => t.day === day && t.time === time);
                      
                      // Lookup subject type and instructors
                      let subjectType = '';
                      let instructors: string[] = [];

                      if (entry) {
                        const normalizedEntrySubject = entry.subject.toLowerCase().trim();
                        const normalizedEntryFaculty = entry.faculty.toLowerCase().trim();
                        
                        // Find subject by name or code
                        const subject = appData.subjects.find(s => 
                          s.name.toLowerCase().trim() === normalizedEntrySubject ||
                          s.code.toLowerCase().trim() === normalizedEntrySubject ||
                          (normalizedEntryFaculty && s.code.toLowerCase().trim() === normalizedEntryFaculty)
                        );
                        subjectType = subject?.type || '';

                        // Find instructors assigned to this subject in this class/division
                        const facultyMappings = appData.faculty.filter(f => 
                          (f.subjectName.toLowerCase().trim() === normalizedEntrySubject || 
                           f.subjectCode.toLowerCase().trim() === normalizedEntrySubject ||
                           (normalizedEntryFaculty && f.subjectCode.toLowerCase().trim() === normalizedEntryFaculty)) &&
                          f.class === entry.class &&
                          f.division === entry.division
                        );
                        instructors = Array.from(new Set(facultyMappings.map(f => f.facultyName)));
                        
                        // If no instructors found in mapping, use the one from entry
                        if (instructors.length === 0 && entry.faculty) {
                          // Check if entry.faculty is actually a subject code
                          const isSubjectCode = appData.subjects.some(s => s.code.toLowerCase().trim() === normalizedEntryFaculty) ||
                                                appData.faculty.some(f => f.subjectCode.toLowerCase().trim() === normalizedEntryFaculty);
                          if (!isSubjectCode) {
                            instructors = entry.faculty.split('/').map(f => f.trim()).filter(Boolean);
                          }
                        }
                      }

                      const noteKey = entry ? `${day}-${time}-${entry.subject}` : '';
                      const hasNote = entry && notes[noteKey];
                      const isSelected = entry?.id && selectedIds.has(entry.id);

                      return (
                        <td key={`${day}-${time}`} className="px-4 py-4 border-r border-slate-100 group-hover:bg-slate-50/50 transition-colors">
                          {entry ? (
                            <div 
                              className={cn(
                                "p-4 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all group/card cursor-pointer relative",
                                isSelected ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-slate-100 hover:border-indigo-200"
                              )}
                            >
                              <div className="absolute top-2 right-2 z-10">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (entry.id) toggleSelection(entry.id);
                                  }}
                                  className="text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                                  ) : (
                                    <Square className="w-5 h-5" />
                                  )}
                                </button>
                              </div>
                              <div 
                                onClick={() => {
                                  setSelectedEntryForDetail(entry);
                                }}
                                className="space-y-2 mb-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 group-hover/card:bg-indigo-600 group-hover/card:text-white transition-colors">
                                      <BookOpen className="w-3 h-3" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-900 leading-tight">{entry.subject}</p>
                                      {subjectType && (
                                        <span className={cn(
                                          "inline-block mt-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter",
                                          subjectType.includes('&') ? "bg-purple-50 text-purple-600" :
                                          subjectType.toLowerCase().includes('lab') ? "bg-emerald-50 text-emerald-600" :
                                          "bg-blue-50 text-blue-600"
                                        )}>
                                          {subjectType}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex flex-col gap-1.5">
                                  {instructors.length > 0 ? (
                                    instructors.map((name, i) => (
                                      <div key={i} className="flex items-center gap-2 text-slate-500">
                                        <User className="w-3 h-3 text-indigo-400" />
                                        <p className="text-[10px] font-bold truncate">{name}</p>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="flex items-center gap-2 text-slate-400">
                                      <User className="w-3 h-3" />
                                      <p className="text-[10px] font-bold italic">No instructor assigned</p>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-50">
                                  <div className="flex items-center gap-2 text-slate-400">
                                    <MapPin className="w-3 h-3" />
                                    <p className="text-[10px] font-bold truncate">Room: {entry.room || 'N/A'}</p>
                                  </div>
                                  {hasNote && (
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" title="Has remarks" />
                                  )}
                                </div>
                                {hasNote && (
                                  <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded-lg">
                                    <p className="text-[9px] text-amber-700 font-medium italic line-clamp-2">"{notes[noteKey]}"</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-200">
                              <span className="text-[10px] font-bold uppercase tracking-widest">Free Slot</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={filteredDays.length + 1} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-slate-100 p-4 rounded-3xl text-slate-400">
                        <Calendar className="w-8 h-8" />
                      </div>
                      <p className="text-slate-500 font-medium">No timetable data found for this context</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Entry Detail Modal */}
      {selectedEntryForDetail && (
        <EntryDetailModal 
          entry={selectedEntryForDetail}
          note={notes[`${selectedEntryForDetail.day}-${selectedEntryForDetail.time}-${selectedEntryForDetail.subject}`] || ''}
          appData={appData}
          onClose={() => setSelectedEntryForDetail(null)}
          onSaveNote={(text) => {
            const key = `${selectedEntryForDetail.day}-${selectedEntryForDetail.time}-${selectedEntryForDetail.subject}`;
            const newNotes = { ...notes, [key]: text };
            setNotes(newNotes);
            localStorage.setItem('timetable_notes', JSON.stringify(newNotes));
            setSelectedEntryForDetail(null);
          }}
        />
      )}

      {isBulkEditModalOpen && (
        <BulkEditModal 
          selectedCount={selectedIds.size}
          onClose={() => setIsBulkEditModalOpen(false)}
          onSave={handleBulkEditSave}
          subjects={Array.from(new Set(appData.subjects.map(s => s.name)))}
          faculties={Array.from(new Set(appData.faculty.map(f => f.facultyName)))}
          timeSlots={Array.from(new Set(appData.timetable.map(t => t.time))).sort()}
        />
      )}
    </div>
  );
};

const BulkEditModal: React.FC<{ 
  selectedCount: number; 
  onClose: () => void; 
  onSave: (updates: Partial<TimetableEntry>) => void;
  subjects: string[];
  faculties: string[];
  timeSlots: string[];
}> = ({ selectedCount, onClose, onSave, subjects, faculties, timeSlots }) => {
  const [updates, setUpdates] = useState<Partial<TimetableEntry>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(updates).length === 0) return;
    onSave(updates);
  };

  const updateField = (field: keyof TimetableEntry, value: string) => {
    setUpdates(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-slate-900">Bulk Edit Timetable</h3>
              <p className="text-slate-500 font-medium">Updating {selectedCount} slots</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Subject</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={updates.subject || ''}
                  onChange={(e) => updateField('subject', e.target.value)}
                >
                  <option value="">No Change</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Faculty</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={updates.faculty || ''}
                  onChange={(e) => updateField('faculty', e.target.value)}
                >
                  <option value="">No Change</option>
                  {faculties.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Room</label>
                <input 
                  type="text"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter new room..."
                  value={updates.room || ''}
                  onChange={(e) => updateField('room', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Day</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={updates.day || ''}
                  onChange={(e) => updateField('day', e.target.value)}
                >
                  <option value="">No Change</option>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Time Slot</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={updates.time || ''}
                  onChange={(e) => updateField('time', e.target.value)}
                >
                  <option value="">No Change</option>
                  {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
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
                disabled={Object.keys(updates).length === 0}
                className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-2xl font-bold text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
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

const EntryDetailModal: React.FC<{
  entry: TimetableEntry;
  note: string;
  appData: any;
  onClose: () => void;
  onSaveNote: (text: string) => void;
}> = ({ entry, note, appData, onClose, onSaveNote }) => {
  const [noteText, setNoteText] = useState(note);

  // Lookup subject type and instructors (same logic as in table)
  const normalizedEntrySubject = entry.subject.toLowerCase().trim();
  const normalizedEntryFaculty = entry.faculty.toLowerCase().trim();
  
  const subject = appData.subjects.find((s: any) => 
    s.name.toLowerCase().trim() === normalizedEntrySubject ||
    s.code.toLowerCase().trim() === normalizedEntrySubject ||
    (normalizedEntryFaculty && s.code.toLowerCase().trim() === normalizedEntryFaculty)
  );
  const subjectType = subject?.type || '';

  const facultyMappings = appData.faculty.filter((f: any) => 
    (f.subjectName.toLowerCase().trim() === normalizedEntrySubject || 
     f.subjectCode.toLowerCase().trim() === normalizedEntrySubject ||
     (normalizedEntryFaculty && f.subjectCode.toLowerCase().trim() === normalizedEntryFaculty)) &&
    f.class === entry.class &&
    f.division === entry.division
  );
  let instructors = Array.from(new Set(facultyMappings.map((f: any) => f.facultyName)));
  
  if (instructors.length === 0 && entry.faculty) {
    const isSubjectCode = appData.subjects.some((s: any) => s.code.toLowerCase().trim() === normalizedEntryFaculty) ||
                          appData.faculty.some((f: any) => f.subjectCode.toLowerCase().trim() === normalizedEntryFaculty);
    if (!isSubjectCode) {
      instructors = entry.faculty.split('/').map((f: any) => f.trim()).filter(Boolean);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-slate-900">Entry Details</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                {entry.day} • {entry.time}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex items-start gap-4">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 leading-tight">{entry.subject}</h4>
                {subjectType && (
                  <span className={cn(
                    "inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    subjectType.includes('&') ? "bg-purple-100 text-purple-700" :
                    subjectType.toLowerCase().includes('lab') ? "bg-emerald-100 text-emerald-700" :
                    "bg-blue-100 text-blue-700"
                  )}>
                    {subjectType}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <User className="w-4 h-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Instructors</p>
                </div>
                <div className="space-y-1">
                  {instructors.length > 0 ? (
                    instructors.map((name, i) => (
                      <p key={i} className="text-sm font-bold text-slate-900">{name}</p>
                    ))
                  ) : (
                    <p className="text-sm font-bold text-slate-400 italic">None assigned</p>
                  )}
                </div>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-4 h-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Location</p>
                </div>
                <p className="text-sm font-bold text-slate-900">Room: {entry.room || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Remarks / Notes</label>
              <textarea
                className="w-full h-32 p-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                placeholder="Add any remarks for this slot..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
            >
              Close
            </button>
            <button 
              onClick={() => onSaveNote(noteText)}
              className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
            >
              Save Remarks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
