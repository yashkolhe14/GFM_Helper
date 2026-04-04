import React from 'react';
import { Code, Trophy, Users, Search, Download, Filter, Star, CheckSquare, Square, Edit3, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { Hackathon } from '../../types';

export const HackathonPage: React.FC = () => {
  const { appData, selectedContext, updateHackathons } = useAppContext();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showAll, setShowAll] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = React.useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  
  // New Filters
  const [filters, setFilters] = React.useState({
    status: '',
    level: '',
    organizer: '',
    rank: '',
    hackathonName: ''
  });

  if (!appData || !selectedContext) return null;

  const allHackathons = appData.hackathons;

  // Extract unique values for filters
  const uniqueValues = React.useMemo(() => {
    const contextHackathons = allHackathons.filter(h => 
      h.gfmName.trim() === selectedContext.gfmName.trim() && 
      (selectedContext.class === 'N/A' || h.class === selectedContext.class) &&
      (selectedContext.division === 'N/A' || h.division === selectedContext.division)
    );
    
    const source = showAll ? allHackathons : contextHackathons;

    return {
      statuses: Array.from(new Set(source.map(h => h.status).filter(Boolean))).sort(),
      levels: Array.from(new Set(source.map(h => h.level).filter(Boolean))).sort(),
      organizers: Array.from(new Set(source.map(h => h.organizer).filter(Boolean))).sort(),
      ranks: Array.from(new Set(source.map(h => h.rank).filter(Boolean))).sort(),
      names: Array.from(new Set(source.flatMap(h => 
        (h.hackathonName || '').split(/[,/]/).map(s => s.trim()).filter(Boolean)
      ))).sort()
    };
  }, [allHackathons, selectedContext, showAll]);

  const filteredHackathons = allHackathons.filter(h => {
    const matchesSearch = 
      h.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.hackathonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.rollNo || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !filters.status || h.status === filters.status;
    const matchesLevel = !filters.level || h.level === filters.level;
    const matchesOrganizer = !filters.organizer || h.organizer === filters.organizer;
    const matchesRank = !filters.rank || h.rank === filters.rank;
    const matchesName = !filters.hackathonName || (h.hackathonName || '').includes(filters.hackathonName);

    if (showAll) {
      return matchesSearch && matchesStatus && matchesLevel && matchesOrganizer && matchesRank && matchesName;
    }

    const gfmMatch = h.gfmName.trim() === selectedContext.gfmName.trim();
    const classMatch = selectedContext.class === 'N/A' || h.class === selectedContext.class;
    const divMatch = selectedContext.division === 'N/A' || h.division === selectedContext.division;
      
    return gfmMatch && classMatch && divMatch && matchesSearch && matchesStatus && matchesLevel && matchesOrganizer && matchesRank && matchesName;
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

  const toggleAllSelection = () => {
    if (selectedIds.size === paginatedHackathons.length && paginatedHackathons.length > 0) {
      setSelectedIds(new Set());
    } else {
      const newSelection = new Set<string>();
      paginatedHackathons.forEach(h => {
        if (h.id) newSelection.add(h.id);
      });
      setSelectedIds(newSelection);
    }
  };

  const handleBulkEditSave = (updates: Partial<Hackathon>) => {
    updateHackathons(Array.from(selectedIds), updates);
    setSelectedIds(new Set());
    setIsBulkEditModalOpen(false);
  };

  const contextStudents = React.useMemo(() => {
    if (showAll) return appData.students;
    return appData.students.filter(s => 
      s.gfmName.trim() === selectedContext.gfmName.trim() && 
      (selectedContext.class === 'N/A' || s.class === selectedContext.class) &&
      (selectedContext.division === 'N/A' || s.division === selectedContext.division)
    );
  }, [appData.students, selectedContext, showAll]);

  const totalContextStudents = contextStudents.length || 1;
  const uniqueParticipants = new Set(filteredHackathons.map(h => h.rollNo)).size;
  const winnersCount = filteredHackathons.filter(h => 
    (h.rank && h.rank !== '-' && h.rank.toLowerCase() !== 'participated') || 
    (h.status && (h.status.toLowerCase().includes('win') || h.status.toLowerCase().includes('rank') || h.status.toLowerCase().includes('prize')))
  ).length;

  const participationPercentage = Math.round((uniqueParticipants / totalContextStudents) * 100);
  const winnersPercentage = Math.round((winnersCount / totalContextStudents) * 100);

  const allStudentHackathons = React.useMemo(() => {
    if (showAll) return filteredHackathons;

    return contextStudents.flatMap(student => {
      const studentHackathons = filteredHackathons.filter(h => h.rollNo === student.rollNo);
      if (studentHackathons.length === 0) {
        return [{
          id: `placeholder-${student.rollNo}`,
          studentName: student.name,
          rollNo: student.rollNo,
          hackathonName: '-',
          teamName: '-',
          status: 'Not Participated',
          rank: '-',
          level: '-',
          organizer: '-',
          date: '-',
          gfmName: student.gfmName,
          class: student.class,
          division: student.division
        } as Hackathon];
      }
      return studentHackathons;
    });
  }, [contextStudents, filteredHackathons, showAll]);

  const totalPages = Math.ceil(allStudentHackathons.length / itemsPerPage);
  const paginatedHackathons = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return allStudentHackathons.slice(startIndex, startIndex + itemsPerPage);
  }, [allStudentHackathons, currentPage, itemsPerPage]);

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('win') || s.includes('rank') || s.includes('prize') || s.includes('1st') || s.includes('2nd') || s.includes('3rd')) {
      return "bg-emerald-50 text-emerald-600 border-emerald-100";
    }
    if (s.includes('runner') || s.includes('finalist')) {
      return "bg-amber-50 text-amber-600 border-amber-100";
    }
    if (s.includes('participated')) {
      return "bg-blue-50 text-blue-600 border-blue-100";
    }
    if (s === 'n/a' || s === '-' || !s) {
      return "bg-slate-50 text-slate-400 border-slate-100";
    }
    return "bg-slate-50 text-slate-600 border-slate-100";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Hackathon Participation</h2>
          <p className="text-slate-500 font-medium">
            {showAll ? (
              `Showing all ${filteredHackathons.length} hackathon records`
            ) : (
              `Tracking ${filteredHackathons.length} hackathon records for ${selectedContext.gfmName}`
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setShowAll(false)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                !showAll ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              My Context
            </button>
            <button 
              onClick={() => setShowAll(true)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                showAll ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              All Records ({allHackathons.length})
            </button>
          </div>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95">
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-rose-200 transition-all">
          <div className="flex items-center gap-4">
            <div className="bg-rose-50 p-3 rounded-2xl text-rose-600 group-hover:scale-110 transition-transform">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Participation</p>
              <p className="text-2xl font-black text-slate-900">{filteredHackathons.length}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="px-3 py-1 bg-rose-50 text-rose-700 rounded-xl font-black text-lg">
              {participationPercentage}%
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-amber-200 transition-all">
          <div className="flex items-center gap-4">
            <div className="bg-amber-50 p-3 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Winners/Rankers</p>
              <p className="text-2xl font-black text-slate-900">{winnersCount}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="px-3 py-1 bg-amber-50 text-amber-700 rounded-xl font-black text-lg">
              {winnersPercentage}%
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unique Students</p>
              <p className="text-2xl font-black text-slate-900">{uniqueParticipants}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl font-black text-lg">
              {participationPercentage}%
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by student, hackathon or team..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent w-full"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {selectedIds.size > 0 && (
              <button 
                onClick={() => setIsBulkEditModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 rounded-xl font-bold text-sm hover:bg-rose-200 transition-all shadow-sm"
              >
                <Edit3 className="w-4 h-4" />
                <span>Bulk Edit ({selectedIds.size})</span>
              </button>
            )}
            <button 
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={cn(
                "p-2.5 border rounded-xl transition-all flex items-center gap-2",
                isFilterPanelOpen 
                  ? "bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-200" 
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
              )}
            >
              <Filter className="w-5 h-5" />
              {isFilterPanelOpen && <span className="text-xs font-bold">Close Filters</span>}
            </button>
          </div>
        </div>

        {isFilterPanelOpen && (
          <div className="p-6 bg-slate-50/50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
              <select 
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All Statuses</option>
                {uniqueValues.statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Level</label>
              <select 
                value={filters.level}
                onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All Levels</option>
                {uniqueValues.levels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Organizer</label>
              <select 
                value={filters.organizer}
                onChange={(e) => setFilters(prev => ({ ...prev, organizer: e.target.value }))}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All Organizers</option>
                {uniqueValues.organizers.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Rank/Prize</label>
              <select 
                value={filters.rank}
                onChange={(e) => setFilters(prev => ({ ...prev, rank: e.target.value }))}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All Ranks</option>
                {uniqueValues.ranks.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hackathon Name</label>
              <select 
                value={filters.hackathonName}
                onChange={(e) => setFilters(prev => ({ ...prev, hackathonName: e.target.value }))}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All Hackathons</option>
                {uniqueValues.names.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="md:col-span-3 lg:col-span-5 flex justify-end">
              <button 
                onClick={() => setFilters({ status: '', level: '', organizer: '', rank: '', hackathonName: '' })}
                className="text-[10px] font-bold text-rose-600 uppercase tracking-widest hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 w-12">
                  <button 
                    onClick={toggleAllSelection}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    {paginatedHackathons.length > 0 && selectedIds.size === paginatedHackathons.length ? (
                      <CheckSquare className="w-5 h-5 text-rose-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Roll No</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hackathon Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rank/Prize</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Level/Org</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedHackathons.length > 0 ? (
                paginatedHackathons.map((h, idx) => {
                  return (
                    <tr 
                      key={h.id || idx} 
                      className={cn(
                        "hover:bg-slate-50/50 transition-colors group cursor-pointer",
                        h.id && selectedIds.has(h.id) && "bg-rose-50/30",
                        h.id?.startsWith('placeholder-') && "opacity-60"
                      )}
                      onClick={() => !h.id?.startsWith('placeholder-') && h.id && toggleSelection(h.id)}
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        {h.id && !h.id.startsWith('placeholder-') && (
                          <button 
                            onClick={() => h.id && toggleSelection(h.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            {h.id && selectedIds.has(h.id) ? (
                              <CheckSquare className="w-5 h-5 text-rose-600" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-slate-100 rounded-xl text-sm font-bold text-slate-700">
                          {h.rollNo || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors">{h.studentName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-700">{h.hackathonName}</p>
                          {h.date && <p className="text-[10px] text-slate-400">{h.date}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-500">{h.teamName || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border",
                          getStatusColor(h.status)
                        )}>
                          {h.status || 'Participated'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {h.rank && h.rank !== '-' ? (
                          <div className="flex items-center gap-1 text-amber-600 font-bold text-sm">
                            <Star className="w-3 h-3 fill-amber-600" />
                            <span>{h.rank}</span>
                          </div>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          {h.level && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h.level}</p>}
                          {h.organizer && <p className="text-xs text-slate-500">{h.organizer}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
                      <div className="bg-slate-100 p-4 rounded-3xl text-slate-400">
                        <Code className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-900 font-bold text-lg">No hackathon records found</p>
                        <p className="text-slate-500 text-sm">
                          {allHackathons.length > 0 
                            ? `We found ${allHackathons.length} records in total, but none match the current context (${selectedContext.gfmName}). Try clicking "All Records" above.`
                            : "We couldn't find any hackathon participation data in the uploaded Excel file. Please ensure the sheet name contains 'Hackathon' and has headers like 'Student Name' and 'Hackathon Name'."}
                        </p>
                      </div>
                      {allHackathons.length > 0 && !showAll && (
                        <button 
                          onClick={() => setShowAll(true)}
                          className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all"
                        >
                          Show All Records
                        </button>
                      )}
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
              Showing <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * itemsPerPage, allStudentHackathons.length)}</span> of <span className="text-slate-900">{allStudentHackathons.length}</span> records
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
                            ? "bg-rose-600 text-white shadow-md shadow-rose-200" 
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

const BulkEditModal: React.FC<{ selectedCount: number; onClose: () => void; onSave: (updates: Partial<Hackathon>) => void }> = ({ selectedCount, onClose, onSave }) => {
  const [field, setField] = React.useState<keyof Hackathon>('status');
  const [value, setValue] = React.useState('');

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
              <p className="text-slate-500 font-medium">Updating {selectedCount} hackathon records</p>
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
                  setField(e.target.value as keyof Hackathon);
                  setValue('');
                }}
              >
                <option value="status">Status</option>
                <option value="rank">Rank/Prize</option>
                <option value="level">Level</option>
                <option value="organizer">Organizer</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Value</label>
              {field === 'status' ? (
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Winner">Winner</option>
                  <option value="Runner Up">Runner Up</option>
                  <option value="Finalist">Finalist</option>
                  <option value="Participated">Participated</option>
                </select>
              ) : field === 'level' ? (
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                >
                  <option value="">Select Level</option>
                  <option value="College">College</option>
                  <option value="State">State</option>
                  <option value="National">National</option>
                  <option value="International">International</option>
                </select>
              ) : (
                <input 
                  type="text"
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
