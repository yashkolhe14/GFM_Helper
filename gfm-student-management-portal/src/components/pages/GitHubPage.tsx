import React from 'react';
import { Github, ExternalLink, Search, Download, Filter, User, LayoutGrid, List } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../lib/utils';

export const GitHubPage: React.FC = () => {
  const { appData, selectedContext } = useAppContext();
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  if (!appData || !selectedContext) return null;

  const filteredStudents = appData.students.filter(s => 
    s.gfmName === selectedContext.gfmName && 
    s.class === selectedContext.class && 
    s.division === selectedContext.division
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">GitHub Profiles</h2>
          <p className="text-slate-500 font-medium">Tracking {filteredStudents.length} student profiles for {selectedContext.gfmName}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'grid' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'list' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
            <Download className="w-4 h-4" />
            <span>Export Profile Data</span>
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg">
                    <Github className="w-6 h-6" />
                  </div>
                  {student.github ? (
                    <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Active
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      N/A
                    </span>
                  )}
                </div>
                
                <div className="space-y-1 mb-6">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{student.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Roll No: {student.rollNo}</p>
                </div>

                {student.github ? (
                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-slate-500">
                      <User className="w-4 h-4 flex-shrink-0" />
                      <a 
                        href={student.github.startsWith('http') ? student.github : `https://github.com/${student.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium truncate text-indigo-600 hover:underline"
                      >
                        {student.github}
                      </a>
                    </div>
                    <a 
                      href={student.github.startsWith('http') ? student.github : `https://github.com/${student.github}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2 bg-slate-100 text-slate-900 rounded-xl font-bold text-xs hover:bg-slate-900 hover:text-white transition-all"
                    >
                      <span>View Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-slate-300 mb-4">
                      <User className="w-4 h-4 flex-shrink-0" />
                      <p className="text-sm font-medium italic">Not Linked</p>
                    </div>
                    <button className="w-full py-2 bg-slate-50 text-slate-400 rounded-xl font-bold text-xs cursor-not-allowed">
                      Profile Unavailable
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="bg-slate-100 p-4 rounded-3xl text-slate-400">
                  <Github className="w-8 h-8" />
                </div>
                <p className="text-slate-500 font-medium">No students found for this context</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Roll No</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">GitHub Username</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">
                          {student.rollNo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{student.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        {student.github ? (
                          <div className="flex items-center gap-2">
                            <Github className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-indigo-600 font-medium">{student.github}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-300 italic">Not Linked</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {student.github ? (
                          <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[9px] font-bold uppercase tracking-wider">Active</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full text-[9px] font-bold uppercase tracking-wider">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {student.github ? (
                          <a 
                            href={student.github.startsWith('http') ? student.github : `https://github.com/${student.github}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs font-bold text-slate-300">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                      No students found for this context
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
