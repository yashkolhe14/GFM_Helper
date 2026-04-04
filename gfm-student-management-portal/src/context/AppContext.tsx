import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { AppData, GFMContext, Task, UploadedFile, Student, Hackathon, Subject, MentorMentee, FeeRecord, VACRecord, MOOCRecord, Internship, TimetableEntry, FacultyMapping, MeetingLog } from '../types';

interface AppContextType {
  appData: AppData | null;
  uploadedFiles: UploadedFile[];
  selectedContext: GFMContext | null;
  activePage: string;
  setActivePage: (page: string) => void;
  tasks: Task[];
  meetingLogs: MeetingLog[];
  theme: 'light' | 'dark';
  addUploadedFile: (file: Omit<UploadedFile, 'id' | 'uploadDate'>) => void;
  removeUploadedFile: (id: string) => void;
  addStudent: (student: Student) => void;
  updateStudents: (rollNos: string[], updates: Partial<Student>) => void;
  updateHackathons: (ids: string[], updates: Partial<Hackathon>) => void;
  updateSubjects: (ids: string[], updates: Partial<Subject>) => void;
  updateMentorMentees: (ids: string[], updates: Partial<MentorMentee>) => void;
  updateFeeRecords: (ids: string[], updates: Partial<FeeRecord>) => void;
  updateVACRecords: (ids: string[], updates: Partial<VACRecord>) => void;
  updateMOOCRecords: (ids: string[], updates: Partial<MOOCRecord>) => void;
  updateInternships: (ids: string[], updates: Partial<Internship>) => void;
  updateTimetable: (ids: string[], updates: Partial<TimetableEntry>) => void;
  updateFaculty: (ids: string[], updates: Partial<FacultyMapping>) => void;
  addFacultyMapping: (mapping: FacultyMapping) => void;
  setSelectedContext: (context: GFMContext | null) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  toggleTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  addMeetingLog: (log: Omit<MeetingLog, 'id'>) => void;
  deleteMeetingLog: (id: string) => void;
  toggleTheme: () => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'gfm_management_data'; // We'll keep this for backwards compatibility if needed, or migrate
const FILES_KEY = 'gfm_uploaded_files';
const CONTEXT_KEY = 'gfm_selected_context';
const TASKS_KEY = 'gfm_tasks';
const MEETING_LOGS_KEY = 'gfm_meeting_logs';
const THEME_KEY = 'gfm_theme';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [uploadedFiles, setUploadedFilesState] = useState<UploadedFile[]>([]);
  const [selectedContext, setSelectedContextState] = useState<GFMContext | null>(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [meetingLogs, setMeetingLogsState] = useState<MeetingLog[]>([]);
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedFiles = localStorage.getItem(FILES_KEY);
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedContext = localStorage.getItem(CONTEXT_KEY);
    const savedTasks = localStorage.getItem(TASKS_KEY);
    const savedMeetingLogs = localStorage.getItem(MEETING_LOGS_KEY);
    const savedTheme = localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null;

    if (savedTheme) {
      setThemeState(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    }

    let initialFiles: UploadedFile[] = [];

    if (savedFiles) {
      try {
        let parsedFiles: UploadedFile[] = JSON.parse(savedFiles);
        
        // Migration: Ensure all items have IDs
        let isModified = false;
        parsedFiles = parsedFiles.map(file => {
          let fileModified = false;
          const newData = { ...file.data };
          
          const collections: (keyof AppData)[] = ['students', 'subjects', 'mentorMentees', 'feeRecords', 'vacRecords', 'moocRecords', 'internships', 'hackathons', 'timetable', 'faculty'];
          
          collections.forEach(key => {
            if (Array.isArray(newData[key])) {
              newData[key] = (newData[key] as any[]).map(item => {
                if (!item.id && key !== 'students') { // Students use rollNo
                  fileModified = true;
                  return { ...item, id: crypto.randomUUID() };
                }
                return item;
              });
            }
          });
          
          if (fileModified) {
            isModified = true;
            return { ...file, data: newData };
          }
          return file;
        });

        if (isModified) {
          localStorage.setItem(FILES_KEY, JSON.stringify(parsedFiles));
        }

        setUploadedFilesState(parsedFiles);
      } catch (e) {
        console.error('Failed to parse saved files', e);
      }
    } else if (savedData) {
      // Migrate old data
      try {
        const parsedData = JSON.parse(savedData);
        const migratedFile: UploadedFile = {
          id: crypto.randomUUID(),
          name: 'Migrated Data.xlsx',
          data: parsedData,
          uploadDate: new Date().toISOString(),
        };
        initialFiles = [migratedFile];
        setUploadedFilesState(initialFiles);
        localStorage.setItem(FILES_KEY, JSON.stringify(initialFiles));
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }

    if (savedContext) {
      try {
        setSelectedContextState(JSON.parse(savedContext));
      } catch (e) {
        console.error('Failed to parse saved context', e);
      }
    }

    if (savedTasks) {
      try {
        setTasksState(JSON.parse(savedTasks));
      } catch (e) {
        console.error('Failed to parse saved tasks', e);
      }
    }

    if (savedMeetingLogs) {
      try {
        setMeetingLogsState(JSON.parse(savedMeetingLogs));
      } catch (e) {
        console.error('Failed to parse saved meeting logs', e);
      }
    }

    setIsLoading(false);
  }, []);

  const appData = useMemo(() => {
    if (uploadedFiles.length === 0) return null;

    const merged: AppData = {
      students: [],
      subjects: [],
      mentorMentees: [],
      meetingLogs: meetingLogs,
      tasks: tasks,
      feeRecords: [],
      vacRecords: [],
      moocRecords: [],
      internships: [],
      hackathons: [],
      timetable: [],
      faculty: [],
      gfmContexts: [],
    };

    const uniqueContexts = new Map<string, GFMContext>();

    uploadedFiles.forEach(file => {
      merged.students.push(...file.data.students);
      merged.subjects.push(...file.data.subjects);
      merged.mentorMentees.push(...file.data.mentorMentees);
      merged.feeRecords.push(...file.data.feeRecords);
      merged.vacRecords.push(...file.data.vacRecords);
      merged.moocRecords.push(...file.data.moocRecords);
      merged.internships.push(...file.data.internships);
      merged.hackathons.push(...file.data.hackathons);
      merged.timetable.push(...file.data.timetable);
      merged.faculty.push(...file.data.faculty);

      file.data.gfmContexts.forEach(c => {
        const key = `${c.gfmName}-${c.class}-${c.division}`;
        if (!uniqueContexts.has(key)) {
          uniqueContexts.set(key, c);
        }
      });
    });

    merged.gfmContexts = Array.from(uniqueContexts.values());
    return merged;
  }, [uploadedFiles]);

  const setUploadedFiles = (files: UploadedFile[]) => {
    setUploadedFilesState(files);
    localStorage.setItem(FILES_KEY, JSON.stringify(files));
    
    // Auto-select logic
    const allContexts = files.flatMap(f => f.data.gfmContexts);
    const uniqueContexts = Array.from(new Map(allContexts.map(c => [`${c.gfmName}-${c.class}-${c.division}`, c])).values());

    if (uniqueContexts.length === 1) {
      setSelectedContext(uniqueContexts[0]);
    } else if (uniqueContexts.length > 0) {
      const isValid = selectedContext && uniqueContexts.some(c => 
        c.gfmName === selectedContext.gfmName && 
        c.class === selectedContext.class && 
        c.division === selectedContext.division
      );
      
      if (!isValid) {
        setSelectedContext(uniqueContexts[0]);
      }
    } else {
      setSelectedContext(null);
    }
  };

  const addUploadedFile = (fileData: Omit<UploadedFile, 'id' | 'uploadDate'>) => {
    const newFile: UploadedFile = {
      ...fileData,
      id: crypto.randomUUID(),
      uploadDate: new Date().toISOString(),
    };
    setUploadedFiles([...uploadedFiles, newFile]);
  };

  const removeUploadedFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== id));
  };

  const addStudent = (student: Student) => {
    if (uploadedFiles.length === 0) return;
    
    // Add to the first file for simplicity in this demo
    const newFiles = [...uploadedFiles];
    newFiles[0] = {
      ...newFiles[0],
      data: {
        ...newFiles[0].data,
        students: [...newFiles[0].data.students, student]
      }
    };
    setUploadedFiles(newFiles);
  };

  const updateStudents = (rollNos: string[], updates: Partial<Student>) => {
    const newFiles = uploadedFiles.map(file => {
      let isModified = false;
      const newStudents = file.data.students.map(s => {
        if (rollNos.includes(s.rollNo)) {
          isModified = true;
          return { ...s, ...updates };
        }
        return s;
      });

      if (isModified) {
        return {
          ...file,
          data: {
            ...file.data,
            students: newStudents
          }
        };
      }
      return file;
    });
    setUploadedFiles(newFiles);
  };

  const updateHackathons = (ids: string[], updates: Partial<Hackathon>) => {
    const newFiles = uploadedFiles.map(file => {
      let isModified = false;
      const newHackathons = file.data.hackathons.map(h => {
        if (h.id && ids.includes(h.id)) {
          isModified = true;
          return { ...h, ...updates };
        }
        return h;
      });

      if (isModified) {
        return {
          ...file,
          data: {
            ...file.data,
            hackathons: newHackathons
          }
        };
      }
      return file;
    });
    setUploadedFiles(newFiles);
  };

  const updateSubjects = (ids: string[], updates: Partial<Subject>) => {
    const newFiles = uploadedFiles.map(file => {
      let isModified = false;
      const newSubjects = file.data.subjects.map(s => {
        if (s.id && ids.includes(s.id)) {
          isModified = true;
          return { ...s, ...updates };
        }
        return s;
      });
      return isModified ? { ...file, data: { ...file.data, subjects: newSubjects } } : file;
    });
    setUploadedFiles(newFiles);
  };

  const updateMentorMentees = (ids: string[], updates: Partial<MentorMentee>) => {
    const newFiles = uploadedFiles.map(file => {
      let isModified = false;
      const newMentorMentees = file.data.mentorMentees.map(m => {
        if (m.id && ids.includes(m.id)) {
          isModified = true;
          return { ...m, ...updates };
        }
        return m;
      });
      return isModified ? { ...file, data: { ...file.data, mentorMentees: newMentorMentees } } : file;
    });
    setUploadedFiles(newFiles);
  };

  const updateFeeRecords = (ids: string[], updates: Partial<FeeRecord>) => {
    const newFiles = uploadedFiles.map(file => {
      let isModified = false;
      const newFeeRecords = file.data.feeRecords.map(f => {
        if (f.id && ids.includes(f.id)) {
          isModified = true;
          return { ...f, ...updates };
        }
        return f;
      });
      return isModified ? { ...file, data: { ...file.data, feeRecords: newFeeRecords } } : file;
    });
    setUploadedFiles(newFiles);
  };

  const updateVACRecords = (ids: string[], updates: Partial<VACRecord>) => {
    const newFiles = uploadedFiles.map(file => {
      let isModified = false;
      const newVACRecords = file.data.vacRecords.map(v => {
        if (v.id && ids.includes(v.id)) {
          isModified = true;
          return { ...v, ...updates };
        }
        return v;
      });
      return isModified ? { ...file, data: { ...file.data, vacRecords: newVACRecords } } : file;
    });
    setUploadedFiles(newFiles);
  };

  const updateMOOCRecords = (ids: string[], updates: Partial<MOOCRecord>) => {
    const newFiles = uploadedFiles.map(file => {
      let isModified = false;
      const newMOOCRecords = file.data.moocRecords.map(m => {
        if (m.id && ids.includes(m.id)) {
          isModified = true;
          return { ...m, ...updates };
        }
        return m;
      });
      return isModified ? { ...file, data: { ...file.data, moocRecords: newMOOCRecords } } : file;
    });
    setUploadedFiles(newFiles);
  };

  const updateInternships = (ids: string[], updates: Partial<Internship>) => {
    const newFiles = uploadedFiles.map(file => {
      let isModified = false;
      const newInternships = file.data.internships.map(i => {
        if (i.id && ids.includes(i.id)) {
          isModified = true;
          return { ...i, ...updates };
        }
        return i;
      });
      return isModified ? { ...file, data: { ...file.data, internships: newInternships } } : file;
    });
    setUploadedFiles(newFiles);
  };

  const updateTimetable = (ids: string[], updates: Partial<TimetableEntry>) => {
    const newFiles = uploadedFiles.map(file => {
      let isModified = false;
      const newTimetable = file.data.timetable.map(t => {
        if (t.id && ids.includes(t.id)) {
          isModified = true;
          return { ...t, ...updates };
        }
        return t;
      });
      return isModified ? { ...file, data: { ...file.data, timetable: newTimetable } } : file;
    });
    setUploadedFiles(newFiles);
  };

  const updateFaculty = (ids: string[], updates: Partial<FacultyMapping>) => {
    const newFiles = uploadedFiles.map(file => {
      let isModified = false;
      const newFaculty = file.data.faculty.map(f => {
        if (f.id && ids.includes(f.id)) {
          isModified = true;
          return { ...f, ...updates };
        }
        return f;
      });
      return isModified ? { ...file, data: { ...file.data, faculty: newFaculty } } : file;
    });
    setUploadedFiles(newFiles);
  };

  const addFacultyMapping = (mapping: FacultyMapping) => {
    if (uploadedFiles.length === 0) return;
    const newFiles = [...uploadedFiles];
    const mappingWithId = { ...mapping, id: mapping.id || crypto.randomUUID() };
    newFiles[0] = {
      ...newFiles[0],
      data: {
        ...newFiles[0].data,
        faculty: [...newFiles[0].data.faculty, mappingWithId]
      }
    };
    setUploadedFiles(newFiles);
  };

  const setTasks = (newTasks: Task[]) => {
    setTasksState(newTasks);
    localStorage.setItem(TASKS_KEY, JSON.stringify(newTasks));
  };

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTasks([...tasks, newTask]);
  };

  const toggleTask = (taskId: string) => {
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    setTasks(updatedTasks);
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const setMeetingLogs = (newLogs: MeetingLog[]) => {
    setMeetingLogsState(newLogs);
    localStorage.setItem(MEETING_LOGS_KEY, JSON.stringify(newLogs));
  };

  const addMeetingLog = (logData: Omit<MeetingLog, 'id'>) => {
    const newLog: MeetingLog = {
      ...logData,
      id: crypto.randomUUID(),
    };
    setMeetingLogs([...meetingLogs, newLog]);
  };

  const deleteMeetingLog = (id: string) => {
    setMeetingLogs(meetingLogs.filter(l => l.id !== id));
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setSelectedContext = (context: GFMContext | null) => {
    setSelectedContextState(context);
    if (context) {
      localStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
    } else {
      localStorage.removeItem(CONTEXT_KEY);
    }
  };

  return (
    <AppContext.Provider value={{ 
      appData, 
      uploadedFiles,
      selectedContext, 
      activePage,
      setActivePage,
      tasks,
      meetingLogs,
      theme,
      addUploadedFile,
      removeUploadedFile,
      addStudent,
      updateStudents,
      updateHackathons,
      updateSubjects,
      updateMentorMentees,
      updateFeeRecords,
      updateVACRecords,
      updateMOOCRecords,
      updateInternships,
      updateTimetable,
      updateFaculty,
      addFacultyMapping,
      setSelectedContext, 
      addTask,
      toggleTask,
      deleteTask,
      addMeetingLog,
      deleteMeetingLog,
      toggleTheme,
      isLoading 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
