import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Filter, Download, MoreVertical, Mail, Phone, ExternalLink, X, User, BookOpen, Award, Briefcase, Globe, Github, Linkedin, CheckCircle2, Circle, Plus, Trash2, ListTodo, ChevronUp, ChevronDown, Eye, ChevronLeft, ChevronRight, Columns, Edit3, CheckSquare, Square, Calendar, MessageSquare } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { Student, GFMContext, Task, MeetingLog } from '../../types';

const AVAILABLE_COLUMNS = [
  { id: 'rollNo', label: 'Roll No' },
  { id: 'prn', label: 'PRN' },
  { id: 'name', label: 'Student Name' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'github', label: 'GitHub Profile' },
  { id: 'linkedin', label: 'LinkedIn Profile' },
  { id: 'feeStatus', label: 'Fees Status' },
  { id: 'hackathonStatus', label: 'Hackathon' },
  { id: 'moocStatus', label: 'MOOC' },
  { id: 'vacSubjects', label: 'VAC' },
];

export const StudentsPage: React.FC = () => {
  const { appData, selectedContext, addStudent, updateStudents } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const columnDropdownRef = useRef<HTMLDivElement>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(AVAILABLE_COLUMNS.map(c => c.id));
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    gender: 'All',
    feeStatus: 'All',
    hackathonStatus: 'All',
    moocStatus: 'All',
    vacSubject: 'All',
    hackathonName: 'All'
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof Student; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
    setSelectedStudentIds(new Set());
  }, [searchTerm, filters, selectedContext]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target as Node)) {
        setShowColumnDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!appData || !selectedContext) return null;

  // Get unique values for filters based on current context
  const contextStudents = appData.students.filter(s => 
    s.gfmName === selectedContext.gfmName &&
    (selectedContext.class === 'N/A' || s.class === selectedContext.class) &&
    (selectedContext.division === 'N/A' || s.division === selectedContext.division)
  );

  const uniqueGenders = ['All', ...new Set(contextStudents.map(s => s.gender))];
  const uniqueFeeStatuses = ['All', ...new Set(contextStudents.map(s => s.feeStatus || 'Pending'))];
  const uniqueHackathonStatuses = ['All', ...new Set(contextStudents.flatMap(s => {
    if (!s.hackathonStatus || s.hackathonStatus === 'None') return ['None'];
    return s.hackathonStatus.split(/[;,]/).map(h => {
      const match = h.match(/\((.*?)\)/);
      return match ? match[1].trim() : 'Participated';
    });
  }))].sort();
  
  const uniqueVACSubjects = ['All', ...new Set(contextStudents.flatMap(s => 
    (s.vacSubjects || '').split(',').map(v => v.trim()).filter(Boolean)
  ))].sort();

  const uniqueHackathonNames = ['All', ...new Set(contextStudents.flatMap(s => 
    (s.hackathonStatus || '').split(/[;,]/).map(h => h.split('(')[0].trim()).filter(Boolean)
  ))].sort();

  const filteredStudents = contextStudents.filter(s => {
    const searchLower = searchTerm.toLowerCase();
    const searchMatch = !searchTerm || [
      s.name,
      s.rollNo,
      s.prn,
      s.email,
      s.phone,
      s.github,
      s.linkedin,
      s.mentorName,
      s.vacSubjects
    ].some(field => String(field || '').toLowerCase().includes(searchLower));

    const genderMatch = filters.gender === 'All' || s.gender === filters.gender;
    const feeMatch = filters.feeStatus === 'All' || (s.feeStatus || 'Pending') === filters.feeStatus;
    
    const hackathonMatch = filters.hackathonStatus === 'All' || 
      (filters.hackathonStatus === 'None' 
        ? (!s.hackathonStatus || s.hackathonStatus === 'None') 
        : (s.hackathonStatus || '').includes(`(${filters.hackathonStatus})`) || 
          ((filters.hackathonStatus === 'Participated') && (s.hackathonStatus || '').split(/[;,]/).some(h => !h.includes('('))));

    const moocMatch = filters.moocStatus === 'All' || 
      (filters.moocStatus === 'Completed' ? (s.moocStatus || '').toLowerCase().includes('completed') :
       filters.moocStatus === 'In Progress' ? (s.moocStatus || '').toLowerCase().includes('progress') :
       filters.moocStatus === 'None' ? !s.moocStatus || s.moocStatus === 'None' : true);

    const vacMatch = filters.vacSubject === 'All' || (s.vacSubjects || '').split(',').map(v => v.trim()).includes(filters.vacSubject);
    const hackathonNameMatch = filters.hackathonName === 'All' || (s.hackathonStatus || '').split(/[;,]/).map(h => h.split('(')[0].trim()).includes(filters.hackathonName);

    return searchMatch && genderMatch && feeMatch && hackathonMatch && moocMatch && vacMatch && hackathonNameMatch;
  });

  const sortedStudents = useMemo(() => {
    const sortableItems = [...filteredStudents];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = String(a[sortConfig.key] || '').toLowerCase();
        const bValue = String(b[sortConfig.key] || '').toLowerCase();
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredStudents, sortConfig]);

  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedStudents, currentPage, itemsPerPage]);

  const requestSort = (key: keyof Student) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }: { column: keyof Student }) => {
    if (!sortConfig || sortConfig.key !== column) {
      return <div className="w-3 h-3 opacity-0 group-hover/th:opacity-30 transition-opacity ml-1" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="w-3 h-3 ml-1 text-indigo-600" /> : 
      <ChevronDown className="w-3 h-3 ml-1 text-indigo-600" />;
  };

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleStudentSelection = (rollNo: string) => {
    const newSelection = new Set(selectedStudentIds);
    if (newSelection.has(rollNo)) {
      newSelection.delete(rollNo);
    } else {
      newSelection.add(rollNo);
    }
    setSelectedStudentIds(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedStudentIds.size === paginatedStudents.length && paginatedStudents.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(paginatedStudents.map(s => s.rollNo)));
    }
  };

  const handleBulkEditSave = (updates: Partial<Student>) => {
    updateStudents(Array.from(selectedStudentIds), updates);
    setSelectedStudentIds(new Set());
    setIsBulkEditModalOpen(false);
  };

  const handleAddStudent = (newStudent: Student) => {
    addStudent(newStudent);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Student Directory</h2>
          <p className="text-slate-500 font-medium">Managing {filteredStudents.length} students in {selectedContext.class} {selectedContext.division}</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {selectedStudentIds.size > 0 && (
            <button 
              onClick={() => setIsBulkEditModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-100 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-200 transition-all shadow-sm"
            >
              <Edit3 className="w-4 h-4" />
              <span>Bulk Edit ({selectedStudentIds.size})</span>
            </button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search students..." 
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full md:w-64 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-2.5 border rounded-xl transition-all shadow-sm flex items-center gap-2",
              showFilters ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            )}
          >
            <Filter className="w-5 h-5" />
            <span className="text-sm font-bold hidden md:inline">Filters</span>
          </button>
          
          <div className="relative" ref={columnDropdownRef}>
            <button 
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className={cn(
                "p-2.5 border rounded-xl transition-all shadow-sm flex items-center gap-2",
                showColumnDropdown ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              )}
            >
              <Columns className="w-5 h-5" />
              <span className="text-sm font-bold hidden md:inline">Columns</span>
            </button>
            {showColumnDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-2">
                  Visible Columns
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                  {AVAILABLE_COLUMNS.map(col => (
                    <label key={col.id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                        visibleColumns.includes(col.id) ? "bg-indigo-600 border-indigo-600" : "border-slate-300"
                      )}>
                        {visibleColumns.includes(col.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{col.label}</span>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={visibleColumns.includes(col.id)}
                        onChange={() => toggleColumn(col.id)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>

          <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[150px] space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Gender</label>
              <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filters.gender}
                onChange={(e) => setFilters({...filters, gender: e.target.value})}
              >
                {uniqueGenders.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[150px] space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fee Status</label>
              <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filters.feeStatus}
                onChange={(e) => setFilters({...filters, feeStatus: e.target.value})}
              >
                {uniqueFeeStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[150px] space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hackathon Status</label>
              <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filters.hackathonStatus}
                onChange={(e) => setFilters({...filters, hackathonStatus: e.target.value})}
              >
                {uniqueHackathonStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[150px] space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">MOOC Status</label>
              <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filters.moocStatus}
                onChange={(e) => setFilters({...filters, moocStatus: e.target.value})}
              >
                <option value="All">All</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="None">None</option>
              </select>
            </div>
            <div className="flex-1 min-w-[150px] space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">VAC Subject</label>
              <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filters.vacSubject}
                onChange={(e) => setFilters({...filters, vacSubject: e.target.value})}
              >
                {uniqueVACSubjects.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[150px] space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hackathon Name</label>
              <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filters.hackathonName}
                onChange={(e) => setFilters({...filters, hackathonName: e.target.value})}
              >
                {uniqueHackathonNames.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <button 
              onClick={() => {
                setFilters({
                  gender: 'All',
                  feeStatus: 'All',
                  hackathonStatus: 'All',
                  moocStatus: 'All',
                  vacSubject: 'All',
                  hackathonName: 'All'
                });
                setSearchTerm('');
              }}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Reset Filters"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 w-12">
                  <button 
                    onClick={toggleAllSelection}
                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {paginatedStudents.length > 0 && selectedStudentIds.size === paginatedStudents.length ? (
                      <CheckSquare className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                {visibleColumns.includes('rollNo') && (
                  <th 
                    className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100/50 transition-colors group/th"
                    onClick={() => requestSort('rollNo')}
                  >
                    <div className="flex items-center">
                      Roll No <SortIcon column="rollNo" />
                    </div>
                  </th>
                )}
                {visibleColumns.includes('prn') && (
                  <th 
                    className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100/50 transition-colors group/th"
                    onClick={() => requestSort('prn')}
                  >
                    <div className="flex items-center">
                      PRN <SortIcon column="prn" />
                    </div>
                  </th>
                )}
                {visibleColumns.includes('name') && (
                  <th 
                    className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100/50 transition-colors group/th"
                    onClick={() => requestSort('name')}
                  >
                    <div className="flex items-center">
                      Student Name <SortIcon column="name" />
                    </div>
                  </th>
                )}
                {visibleColumns.includes('email') && (
                  <th 
                    className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100/50 transition-colors group/th"
                    onClick={() => requestSort('email')}
                  >
                    <div className="flex items-center">
                      Email <SortIcon column="email" />
                    </div>
                  </th>
                )}
                {visibleColumns.includes('phone') && (
                  <th 
                    className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100/50 transition-colors group/th"
                    onClick={() => requestSort('phone')}
                  >
                    <div className="flex items-center">
                      Phone <SortIcon column="phone" />
                    </div>
                  </th>
                )}
                {visibleColumns.includes('github') && (
                  <th 
                    className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100/50 transition-colors group/th"
                    onClick={() => requestSort('github')}
                  >
                    <div className="flex items-center">
                      GitHub Profile <SortIcon column="github" />
                    </div>
                  </th>
                )}
                {visibleColumns.includes('linkedin') && (
                  <th 
                    className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100/50 transition-colors group/th"
                    onClick={() => requestSort('linkedin')}
                  >
                    <div className="flex items-center">
                      LinkedIn Profile <SortIcon column="linkedin" />
                    </div>
                  </th>
                )}
                {visibleColumns.includes('feeStatus') && (
                  <th 
                    className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100/50 transition-colors group/th"
                    onClick={() => requestSort('feeStatus')}
                  >
                    <div className="flex items-center">
                      Fees Status <SortIcon column="feeStatus" />
                    </div>
                  </th>
                )}
                {visibleColumns.includes('hackathonStatus') && (
                  <th 
                    className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100/50 transition-colors group/th"
                    onClick={() => requestSort('hackathonStatus')}
                  >
                    <div className="flex items-center">
                      Hackathon <SortIcon column="hackathonStatus" />
                    </div>
                  </th>
                )}
                {visibleColumns.includes('moocStatus') && (
                  <th 
                    className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100/50 transition-colors group/th"
                    onClick={() => requestSort('moocStatus')}
                  >
                    <div className="flex items-center">
                      MOOC <SortIcon column="moocStatus" />
                    </div>
                  </th>
                )}
                {visibleColumns.includes('vacSubjects') && (
                  <th 
                    className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100/50 transition-colors group/th"
                    onClick={() => requestSort('vacSubjects')}
                  >
                    <div className="flex items-center">
                      VAC <SortIcon column="vacSubjects" />
                    </div>
                  </th>
                )}
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((student, idx) => (
                  <tr 
                    key={idx} 
                    className={cn(
                      "hover:bg-slate-50/50 transition-colors group cursor-pointer",
                      selectedStudentIds.has(student.rollNo) && "bg-indigo-50/30"
                    )}
                    onClick={() => setSelectedStudent(student)}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => toggleStudentSelection(student.rollNo)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {selectedStudentIds.has(student.rollNo) ? (
                          <CheckSquare className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    {visibleColumns.includes('rollNo') && (
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-slate-100 rounded-xl text-sm font-bold text-slate-700">
                          {student.rollNo}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes('prn') && (
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-600">{student.prn || '-'}</p>
                      </td>
                    )}
                    {visibleColumns.includes('name') && (
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{student.name}</p>
                      </td>
                    )}
                    {visibleColumns.includes('email') && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-medium">{student.email || '-'}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.includes('phone') && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-medium">{student.phone || '-'}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.includes('github') && (
                      <td className="px-6 py-4">
                        {student.github ? (
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                              <Github className="w-3.5 h-3.5" />
                            </div>
                            <a 
                              href={student.github.startsWith('http') ? student.github : `https://github.com/${student.github}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-all truncate max-w-[120px] block"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {student.github}
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes('linkedin') && (
                      <td className="px-6 py-4">
                        {student.linkedin ? (
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                              <Linkedin className="w-3.5 h-3.5" />
                            </div>
                            <a 
                              href={student.linkedin.startsWith('http') ? student.linkedin : `https://linkedin.com/in/${student.linkedin}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition-all truncate max-w-[120px] block"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {student.linkedin}
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes('feeStatus') && (
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          student.feeStatus === 'Paid' ? "bg-emerald-100 text-emerald-700" :
                          student.feeStatus === 'Partial' ? "bg-indigo-100 text-indigo-700" :
                          "bg-amber-100 text-amber-700"
                        )}>
                          {student.feeStatus || 'Pending'}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes('hackathonStatus') && (
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          student.hackathonStatus === 'Winner' ? "bg-amber-100 text-amber-700" :
                          student.hackathonStatus === 'Participated' ? "bg-indigo-100 text-indigo-700" :
                          "bg-slate-100 text-slate-500"
                        )}>
                          {student.hackathonStatus || 'None'}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes('moocStatus') && (
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          (student.moocStatus || '').toLowerCase().includes('completed') ? "bg-emerald-100 text-emerald-700" :
                          (student.moocStatus || '').toLowerCase().includes('progress') ? "bg-blue-100 text-blue-700" :
                          "bg-slate-100 text-slate-500"
                        )}>
                          {student.moocStatus || 'None'}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes('vacSubjects') && (
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-slate-600 truncate max-w-[120px]">
                          {student.vacSubjects || '-'}
                        </p>
                      </td>
                    )}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(student);
                          }}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle more actions
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={visibleColumns.length + 2} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-slate-100 p-4 rounded-3xl text-slate-400">
                        <Search className="w-8 h-8" />
                      </div>
                      <p className="text-slate-500 font-medium">No students found matching your search</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">
              Showing <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * itemsPerPage, sortedStudents.length)}</span> of <span className="text-slate-900">{sortedStudents.length}</span> students
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  // Show current page, first, last, and pages around current
                  if (
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "w-8 h-8 rounded-xl text-xs font-bold transition-all",
                          currentPage === page 
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
                            : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm"
                        )}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    (page === 2 && currentPage > 3) || 
                    (page === totalPages - 1 && currentPage < totalPages - 2)
                  ) {
                    return <span key={page} className="text-slate-400 px-1">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedStudent && (
        <StudentDetailModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}

      {isBulkEditModalOpen && (
        <BulkEditModal 
          selectedCount={selectedStudentIds.size}
          onClose={() => setIsBulkEditModalOpen(false)}
          onSave={handleBulkEditSave}
        />
      )}

      {isAddModalOpen && (
        <AddStudentModal 
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddStudent}
          context={selectedContext}
        />
      )}
    </div>
  );
};

const BulkEditModal: React.FC<{ 
selectedCount: number; onClose: () => void; onSave: (updates: Partial<Student>) => void }> = ({ selectedCount, onClose, onSave }) => {
  const [field, setField] = useState<keyof Student>('feeStatus');
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
              <h3 className="text-2xl font-black text-slate-900">Bulk Edit</h3>
              <p className="text-slate-500 font-medium">Updating {selectedCount} selected students</p>
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
                  setField(e.target.value as keyof Student);
                  setValue('');
                }}
              >
                <option value="feeStatus">Fees Status</option>
                <option value="hackathonStatus">Hackathon Status</option>
                <option value="moocStatus">MOOC Status</option>
                <option value="vacSubjects">VAC Subjects</option>
                <option value="internshipStatus">Internship Status</option>
                <option value="mentorName">Mentor Name</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Value</label>
              {field === 'feeStatus' ? (
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Pending">Pending</option>
                </select>
              ) : field === 'hackathonStatus' ? (
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Winner">Winner</option>
                  <option value="Runner Up">Runner Up</option>
                  <option value="Participated">Participated</option>
                  <option value="None">None</option>
                </select>
              ) : field === 'moocStatus' ? (
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="None">None</option>
                </select>
              ) : (
                <input 
                  type="text" 
                  placeholder="Enter new value..." 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={!value}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
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

const AddStudentModal: React.FC<{ onClose: () => void; onSave: (student: Student) => void; context: GFMContext }> = ({ onClose, onSave, context }) => {
  const [formData, setFormData] = useState<Partial<Student>>({
    rollNo: '',
    prn: '',
    name: '',
    email: '',
    phone: '',
    gender: 'Male',
    class: context.class,
    division: context.division,
    semester: context.semester,
    gfmName: context.gfmName,
    academicYear: '2025-2026',
    feeStatus: 'Pending',
    hackathonStatus: 'None',
    moocStatus: 'None',
    vacSubjects: '',
    internshipStatus: 'None',
    mentorName: '',
  });
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; phone?: string } = {};
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (formData.phone && !/^\d{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be 10-15 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData as Student);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Add New Student</h3>
            <p className="text-slate-500 font-medium">Adding to {context.class} {context.division}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Roll No</label>
              <input 
                type="text" 
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.rollNo}
                onChange={(e) => setFormData({...formData, rollNo: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">PRN</label>
              <input 
                type="text" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.prn}
                onChange={(e) => setFormData({...formData, prn: e.target.value})}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Student Name</label>
              <input 
                type="text" 
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email</label>
              <input 
                type="email" 
                className={cn(
                  "w-full p-3 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500",
                  errors.email ? "border-red-500" : "border-slate-200"
                )}
                value={formData.email}
                onChange={(e) => {
                  setFormData({...formData, email: e.target.value});
                  if (errors.email) setErrors({...errors, email: undefined});
                }}
              />
              {errors.email && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Phone</label>
              <input 
                type="tel" 
                className={cn(
                  "w-full p-3 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500",
                  errors.phone ? "border-red-500" : "border-slate-200"
                )}
                value={formData.phone}
                onChange={(e) => {
                  setFormData({...formData, phone: e.target.value});
                  if (errors.phone) setErrors({...errors, phone: undefined});
                }}
              />
              {errors.phone && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gender</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fee Status</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.feeStatus}
                onChange={(e) => setFormData({...formData, feeStatus: e.target.value})}
              >
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 shrink-0">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
            >
              Add Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const StudentDetailModal: React.FC<{ student: Student; onClose: () => void }> = ({ student, onClose }) => {
  const { tasks, addTask, toggleTask, deleteTask, updateStudents, meetingLogs, addMeetingLog, deleteMeetingLog, selectedContext } = useAppContext();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newMeetingDate, setNewMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [newMeetingRemarks, setNewMeetingRemarks] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState<Partial<Student>>({ ...student });
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});

  const studentTasks = tasks.filter(t => t.studentRollNo === student.rollNo);
  const studentMeetingLogs = meetingLogs.filter(l => l.studentRollNo === student.rollNo);

  const validate = () => {
    const newErrors: { email?: string; phone?: string } = {};
    
    if (editedStudent.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedStudent.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (editedStudent.phone && !/^\d{10,15}$/.test(editedStudent.phone)) {
      newErrors.phone = 'Phone must be 10-15 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask({
      studentRollNo: student.rollNo,
      title: newTaskTitle.trim(),
      completed: false,
    });
    setNewTaskTitle('');
  };

  const handleAddMeetingLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingRemarks.trim() || !newMeetingDate) return;
    addMeetingLog({
      studentRollNo: student.rollNo,
      date: newMeetingDate,
      remarks: newMeetingRemarks.trim(),
      gfmName: selectedContext?.gfmName || '',
    });
    setNewMeetingRemarks('');
  };

  const handleSave = () => {
    if (validate()) {
      updateStudents([student.rollNo], editedStudent);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedStudent({ ...student });
    setErrors({});
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-violet-600 shrink-0">
          <div className="absolute top-6 right-6 flex gap-2">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors backdrop-blur-md flex items-center gap-2 px-4"
              >
                <Edit3 className="w-4 h-4" />
                <span className="text-xs font-bold">Edit Profile</span>
              </button>
            ) : (
              <>
                <button 
                  onClick={handleSave}
                  className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-colors backdrop-blur-md flex items-center gap-2 px-4"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-bold">Save</span>
                </button>
                <button 
                  onClick={handleCancel}
                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors backdrop-blur-md flex items-center gap-2 px-4"
                >
                  <X className="w-4 h-4" />
                  <span className="text-xs font-bold">Cancel</span>
                </button>
              </>
            )}
            <button 
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors backdrop-blur-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="absolute -bottom-12 left-10 flex items-end gap-6">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center border-4 border-white">
              <User className="w-12 h-12 text-indigo-600" />
            </div>
            <div className="pb-2">
              {isEditing ? (
                <input 
                  type="text"
                  className="text-2xl font-black text-slate-900 bg-white border border-slate-200 rounded-lg px-2 py-1 mb-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={editedStudent.name}
                  onChange={(e) => setEditedStudent({ ...editedStudent, name: e.target.value })}
                />
              ) : (
                <h3 className="text-2xl font-black text-slate-900">{student.name}</h3>
              )}
              <p className="text-slate-500 font-bold text-sm">Roll No: {student.rollNo} • PRN: {student.prn}</p>
            </div>
          </div>
        </div>

        <div className="pt-16 pb-10 px-10 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto custom-scrollbar">
          <div className="lg:col-span-2 space-y-8">
            <section className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3 h-3" />
                Personal Information
              </h4>
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</p>
                  {isEditing ? (
                    <select 
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={editedStudent.gender}
                      onChange={(e) => setEditedStudent({ ...editedStudent, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="font-bold text-slate-700">{student.gender}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                  {isEditing ? (
                    <div className="space-y-1">
                      <input 
                        type="email"
                        className={cn(
                          "w-full p-2 bg-white border rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none",
                          errors.email ? "border-red-500" : "border-slate-200"
                        )}
                        value={editedStudent.email}
                        onChange={(e) => {
                          setEditedStudent({ ...editedStudent, email: e.target.value });
                          if (errors.email) setErrors({...errors, email: undefined});
                        }}
                      />
                      {errors.email && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.email}</p>}
                    </div>
                  ) : (
                    <p className="font-bold text-slate-700 truncate">{student.email || '-'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                  {isEditing ? (
                    <div className="space-y-1">
                      <input 
                        type="tel"
                        className={cn(
                          "w-full p-2 bg-white border rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none",
                          errors.phone ? "border-red-500" : "border-slate-200"
                        )}
                        value={editedStudent.phone}
                        onChange={(e) => {
                          setEditedStudent({ ...editedStudent, phone: e.target.value });
                          if (errors.phone) setErrors({...errors, phone: undefined});
                        }}
                      />
                      {errors.phone && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.phone}</p>}
                    </div>
                  ) : (
                    <p className="font-bold text-slate-700">{student.phone || '-'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academic Year</p>
                  <p className="font-bold text-slate-700">{student.academicYear}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance</p>
                  {isEditing ? (
                    <input 
                      type="text"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={editedStudent.attendance}
                      onChange={(e) => setEditedStudent({ ...editedStudent, attendance: e.target.value })}
                    />
                  ) : (
                    <p className="font-bold text-slate-700">{student.attendance || '-'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fee Status</p>
                  {isEditing ? (
                    <select 
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={editedStudent.feeStatus}
                      onChange={(e) => setEditedStudent({ ...editedStudent, feeStatus: e.target.value })}
                    >
                      <option value="Paid">Paid</option>
                      <option value="Partial">Partial</option>
                      <option value="Pending">Pending</option>
                    </select>
                  ) : (
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      student.feeStatus === 'Paid' ? "bg-emerald-100 text-emerald-700" :
                      student.feeStatus === 'Partial' ? "bg-indigo-100 text-indigo-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {student.feeStatus || 'Pending'}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mentor Name</p>
                  {isEditing ? (
                    <input 
                      type="text"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={editedStudent.mentorName}
                      onChange={(e) => setEditedStudent({ ...editedStudent, mentorName: e.target.value })}
                    />
                  ) : (
                    <p className="font-bold text-slate-700">{student.mentorName || '-'}</p>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Award className="w-3 h-3" />
                Achievements & Skills
              </h4>
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hackathon Status</p>
                  {isEditing ? (
                    <select 
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={editedStudent.hackathonStatus}
                      onChange={(e) => setEditedStudent({ ...editedStudent, hackathonStatus: e.target.value })}
                    >
                      <option value="Winner">Winner</option>
                      <option value="Runner Up">Runner Up</option>
                      <option value="Participated">Participated</option>
                      <option value="None">None</option>
                    </select>
                  ) : (
                    <p className="font-bold text-slate-700">{student.hackathonStatus || 'None'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Internship Status</p>
                  {isEditing ? (
                    <select 
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={editedStudent.internshipStatus}
                      onChange={(e) => setEditedStudent({ ...editedStudent, internshipStatus: e.target.value })}
                    >
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="None">None</option>
                    </select>
                  ) : (
                    <p className="font-bold text-slate-700">{student.internshipStatus || 'None'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MOOC Status</p>
                  {isEditing ? (
                    <select 
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={editedStudent.moocStatus}
                      onChange={(e) => setEditedStudent({ ...editedStudent, moocStatus: e.target.value })}
                    >
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="None">None</option>
                    </select>
                  ) : (
                    <p className="font-bold text-slate-700">{student.moocStatus || 'None'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">VAC Subjects</p>
                  {isEditing ? (
                    <input 
                      type="text"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={editedStudent.vacSubjects}
                      onChange={(e) => setEditedStudent({ ...editedStudent, vacSubjects: e.target.value })}
                      placeholder="Comma separated subjects"
                    />
                  ) : (
                    <p className="font-bold text-slate-700">{student.vacSubjects || '-'}</p>
                  )}
                </div>
              </div>
            </section>
            
            <section className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ListTodo className="w-3 h-3" />
                Task Management
              </h4>
              <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a new task..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button 
                    type="submit"
                    disabled={!newTaskTitle.trim()}
                    className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </form>
                
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                  {studentTasks.length === 0 ? (
                    <p className="text-sm text-slate-400 italic text-center py-4">No tasks assigned yet.</p>
                  ) : (
                    studentTasks.map(task => (
                      <div 
                        key={task.id} 
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border transition-all",
                          task.completed ? "bg-slate-100 border-slate-200 opacity-60" : "bg-white border-slate-200 shadow-sm"
                        )}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <button 
                            onClick={() => toggleTask(task.id)}
                            className={cn(
                              "shrink-0 transition-colors",
                              task.completed ? "text-emerald-500 hover:text-emerald-600" : "text-slate-300 hover:text-indigo-500"
                            )}
                          >
                            {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                          </button>
                          <span className={cn(
                            "text-sm font-medium truncate",
                            task.completed ? "text-slate-500 line-through" : "text-slate-700"
                          )}>
                            {task.title}
                          </span>
                        </div>
                        <button 
                          onClick={() => deleteTask(task.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-3 h-3" />
                Mentorship Meeting Logs
              </h4>
              <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                <form onSubmit={handleAddMeetingLog} className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="date"
                        value={newMeetingDate}
                        onChange={(e) => setNewMeetingDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={!newMeetingRemarks.trim()}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-bold text-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Log Meeting</span>
                    </button>
                  </div>
                  <textarea
                    placeholder="Enter meeting remarks..."
                    value={newMeetingRemarks}
                    onChange={(e) => setNewMeetingRemarks(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </form>
                
                <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                  {studentMeetingLogs.length === 0 ? (
                    <p className="text-sm text-slate-400 italic text-center py-4">No meeting logs recorded yet.</p>
                  ) : (
                    studentMeetingLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                      <div 
                        key={log.id} 
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-indigo-600">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-xs font-black">{new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <button 
                            onClick={() => deleteMeetingLog(log.id)}
                            className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{log.remarks}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-3 h-3" />
                Social Profiles
              </h4>
              <div className="space-y-3">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">GitHub Username/URL</label>
                      <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                        <Github className="w-4 h-4 text-slate-400" />
                        <input 
                          type="text"
                          className="flex-1 bg-transparent text-sm font-bold text-slate-700 outline-none"
                          value={editedStudent.github}
                          onChange={(e) => setEditedStudent({ ...editedStudent, github: e.target.value })}
                          placeholder="github_username"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">LinkedIn Username/URL</label>
                      <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                        <Linkedin className="w-4 h-4 text-slate-400" />
                        <input 
                          type="text"
                          className="flex-1 bg-transparent text-sm font-bold text-slate-700 outline-none"
                          value={editedStudent.linkedin}
                          onChange={(e) => setEditedStudent({ ...editedStudent, linkedin: e.target.value })}
                          placeholder="linkedin_username"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {student.github && (
                      <a 
                        href={student.github.startsWith('http') ? student.github : `https://github.com/${student.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-slate-900 text-white rounded-2xl hover:scale-[1.02] transition-transform"
                      >
                        <Github className="w-5 h-5 flex-shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm">GitHub Profile</span>
                          <span className="text-[10px] opacity-60 truncate">{student.github}</span>
                        </div>
                      </a>
                    )}
                    {student.linkedin && (
                      <a 
                        href={student.linkedin.startsWith('http') ? student.linkedin : `https://linkedin.com/in/${student.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-blue-600 text-white rounded-2xl hover:scale-[1.02] transition-transform"
                      >
                        <Linkedin className="w-5 h-5 flex-shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm">LinkedIn Profile</span>
                          <span className="text-[10px] opacity-60 truncate">{student.linkedin}</span>
                        </div>
                      </a>
                    )}
                    {!student.github && !student.linkedin && (
                      <p className="text-sm text-slate-400 italic">No social profiles linked</p>
                    )}
                  </>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <BookOpen className="w-3 h-3" />
                Academic Context
              </h4>
              <div className="bg-indigo-50 p-6 rounded-3xl space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Class & Division</p>
                  <p className="font-bold text-indigo-900">{student.class} - {student.division}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Semester</p>
                  <p className="font-bold text-indigo-900">{student.semester}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">GFM Name</p>
                  <p className="font-bold text-indigo-900">{student.gfmName}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
