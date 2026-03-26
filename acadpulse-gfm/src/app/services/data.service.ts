import { Injectable, signal, computed } from '@angular/core';

export interface Student {
  id: string;
  rollNo: string;
  prn: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  email: string;
  division: string;
  feePaid: number;
  feeBalance: number;
  feeAmount?: number;
  vac: string;
  mooc1: string;
  mooc1Duration?: string;
  mooc2: string;
  mooc2Duration?: string;
  internship: string;
  internshipDuration?: string;
  hackathon: string;
  hackathonDate?: string;
  teamMember1Name?: string;
  teamMember1RollNo?: string;
  teamMember2Name?: string;
  teamMember2RollNo?: string;
  teamMember3Name?: string;
  teamMember3RollNo?: string;
  teamMember4Name?: string;
  teamMember4RollNo?: string;
  teamMember5Name?: string;
  teamMember5RollNo?: string;
  teamMember6Name?: string;
  teamMember6RollNo?: string;
  hackathonCertificate?: string;
  hackathonMilestone?: string;
  hackathonMentor?: string;
  github: string;
  linkedin: string;
  mentorId: string;
  extraData?: Record<string, string | number>;
}

export interface MentorGroup {
  id: string;
  name: string;
  division: string;
  studentCount: number;
  rollRange?: string;
}

export interface Instructor {
  id: string;
  name: string;
  subject: string;
  division: string;
  room: string;
  email: string;
  type: 'Theory' | 'Lab' | 'Tutorial';
  syllabus?: string[];
  learningObjectives?: string[];
}

export interface TimetableEntry {
  id: string;
  day: string;
  time: string;
  subject: string;
  room: string;
  instructor: string;
  type: 'Theory' | 'Lab' | 'Tutorial';
}

@Injectable({ providedIn: 'root' })
export class DataService {
  currentUser = signal({
    id: 'gfm-001',
    name: 'Dr. Alan Turing',
    department: 'Computer Science',
    academicYear: '2025-2026',
    semester: '6',
    division: 'A',
  });

  students = signal<Student[]>([
    { 
      id: 's1', rollNo: '101', prn: 'PRN2023001', name: 'Alice Smith', gender: 'Female', mobile: '9876543210', email: 'alice@example.com', division: 'A', 
      feePaid: 50000, feeBalance: 0, feeAmount: 50000, 
      vac: 'Completed', mooc1: 'Done', mooc1Duration: '4 Weeks', mooc2: 'Pending', 
      internship: 'Google', internshipDuration: '3 Months',
      hackathon: 'CodeFest 2025', hackathonDate: '2025-05-15',
      teamMember1Name: 'Bob Jones', teamMember1RollNo: '102',
      hackathonCertificate: 'Yes', hackathonMilestone: 'Winner', hackathonMentor: 'Dr. Alan Turing',
      github: 'alicesmith', linkedin: 'in/alicesmith', mentorId: 'm1' 
    },
    { 
      id: 's2', rollNo: '102', prn: 'PRN2023002', name: 'Bob Jones', gender: 'Male', mobile: '9876543211', email: 'bob@example.com', division: 'A', 
      feePaid: 25000, feeBalance: 25000, feeAmount: 50000,
      vac: 'Pending', mooc1: 'Done', mooc1Duration: '6 Weeks', mooc2: 'Done', mooc2Duration: '8 Weeks',
      internship: 'Microsoft', internshipDuration: '6 Months',
      hackathon: 'CodeFest 2025', hackathonDate: '2025-05-15',
      teamMember1Name: 'Alice Smith', teamMember1RollNo: '101',
      hackathonCertificate: 'Yes', hackathonMilestone: 'Winner', hackathonMentor: 'Dr. Alan Turing',
      github: 'bobjones', linkedin: 'in/bobjones', mentorId: 'm1' 
    },
    { 
      id: 's3', rollNo: '103', prn: 'PRN2023003', name: 'Charlie Brown', gender: 'Male', mobile: '9876543212', email: 'charlie@example.com', division: 'A', 
      feePaid: 50000, feeBalance: 0, feeAmount: 50000,
      vac: 'Completed', mooc1: 'Pending', mooc2: 'Pending', 
      internship: 'Amazon', internshipDuration: '2 Months',
      hackathon: 'None', github: 'charlieb', linkedin: 'in/charlieb', mentorId: 'm2' 
    },
    { 
      id: 's4', rollNo: '104', prn: 'PRN2023004', name: 'Diana Prince', gender: 'Female', mobile: '9876543213', email: 'diana@example.com', division: 'A', 
      feePaid: 10000, feeBalance: 40000, feeAmount: 50000,
      vac: 'Completed', mooc1: 'Done', mooc1Duration: '2 Weeks', mooc2: 'Done', mooc2Duration: '4 Weeks',
      internship: 'Meta', internshipDuration: '4 Months',
      hackathon: 'HackPune', hackathonDate: '2025-06-20',
      teamMember1Name: 'Evan Wright', teamMember1RollNo: '105',
      hackathonCertificate: 'Yes', hackathonMilestone: 'Runner Up', hackathonMentor: 'Prof. Grace Hopper',
      github: 'dianap', linkedin: 'in/dianap', mentorId: 'm2' 
    },
    { 
      id: 's5', rollNo: '105', prn: 'PRN2023005', name: 'Evan Wright', gender: 'Male', mobile: '9876543214', email: 'evan@example.com', division: 'A', 
      feePaid: 50000, feeBalance: 0, feeAmount: 50000,
      vac: 'Pending', mooc1: 'Pending', mooc2: 'Pending', 
      internship: 'None', hackathon: 'None', github: 'evanw', linkedin: 'in/evanw', mentorId: 'm1' 
    },
  ]);

  mentors = signal<MentorGroup[]>([
    { id: 'm1', name: 'Prof. Grace Hopper', division: 'A', studentCount: 20 },
    { id: 'm2', name: 'Dr. Alan Turing (You)', division: 'A', studentCount: 22 },
    { id: 'm3', name: 'Prof. Ada Lovelace', division: 'A', studentCount: 18 },
  ]);

  instructors = signal<Instructor[]>([
    { id: 'i1', name: 'Dr. John Doe', subject: 'Data Structures', division: 'A', room: 'Room 301', email: 'john@example.com', type: 'Theory', syllabus: ['Arrays & Linked Lists', 'Trees & Graphs', 'Dynamic Programming'], learningObjectives: ['Understand basic data structures', 'Analyze algorithm complexity'] },
    { id: 'i2', name: 'Prof. Jane Roe', subject: 'Algorithms Lab', division: 'A', room: 'Lab 2', email: 'jane@example.com', type: 'Lab', syllabus: ['Sorting Algorithms', 'Graph Traversal', 'NP-Completeness'], learningObjectives: ['Implement complex algorithms', 'Optimize code performance'] },
    { id: 'i3', name: 'Dr. Alan Turing', subject: 'Machine Learning', division: 'A', room: 'Room 305', email: 'alan@example.com', type: 'Theory', syllabus: ['Linear Regression', 'Neural Networks', 'Support Vector Machines'], learningObjectives: ['Build predictive models', 'Understand deep learning concepts'] },
    { id: 'i4', name: 'Prof. Richard Roe', subject: 'Database Systems', division: 'A', room: 'Room 302', email: 'richard@example.com', type: 'Theory', syllabus: ['Relational Model', 'SQL', 'Normalization', 'Transactions'], learningObjectives: ['Design database schemas', 'Write complex queries'] },
  ]);

  timetable = signal<TimetableEntry[]>([
    { id: 't1', day: 'Monday', time: '09:00 AM', subject: 'Data Structures', room: 'Room 301', instructor: 'Dr. John Doe', type: 'Theory' },
    { id: 't2', day: 'Monday', time: '10:00 AM', subject: 'Machine Learning', room: 'Room 305', instructor: 'Dr. Alan Turing', type: 'Theory' },
    { id: 't3', day: 'Monday', time: '11:15 AM', subject: 'Database Systems', room: 'Room 302', instructor: 'Prof. Richard Roe', type: 'Theory' },
    
    { id: 't4', day: 'Tuesday', time: '09:00 AM', subject: 'Machine Learning', room: 'Room 305', instructor: 'Dr. Alan Turing', type: 'Theory' },
    { id: 't5', day: 'Tuesday', time: '10:00 AM', subject: 'Database Systems', room: 'Room 302', instructor: 'Prof. Richard Roe', type: 'Theory' },
    { id: 't6', day: 'Tuesday', time: '11:15 AM', subject: 'Data Structures', room: 'Room 301', instructor: 'Dr. John Doe', type: 'Theory' },
    
    { id: 't7', day: 'Wednesday', time: '09:00 AM', subject: 'Algorithms Lab', room: 'Lab 2', instructor: 'Prof. Jane Roe', type: 'Lab' },
    { id: 't8', day: 'Wednesday', time: '10:00 AM', subject: 'Algorithms Lab', room: 'Lab 2', instructor: 'Prof. Jane Roe', type: 'Lab' },
    { id: 't9', day: 'Wednesday', time: '11:15 AM', subject: 'Machine Learning', room: 'Room 305', instructor: 'Dr. Alan Turing', type: 'Theory' },
    
    { id: 't10', day: 'Thursday', time: '09:00 AM', subject: 'Database Systems', room: 'Room 302', instructor: 'Prof. Richard Roe', type: 'Theory' },
    { id: 't11', day: 'Thursday', time: '10:00 AM', subject: 'Data Structures', room: 'Room 301', instructor: 'Dr. John Doe', type: 'Theory' },
    { id: 't12', day: 'Thursday', time: '11:15 AM', subject: 'Algorithms Lab', room: 'Lab 2', instructor: 'Prof. Jane Roe', type: 'Lab' },
    
    { id: 't13', day: 'Friday', time: '09:00 AM', subject: 'Data Structures', room: 'Room 301', instructor: 'Dr. John Doe', type: 'Theory' },
    { id: 't14', day: 'Friday', time: '10:00 AM', subject: 'Machine Learning', room: 'Room 305', instructor: 'Dr. Alan Turing', type: 'Theory' },
    { id: 't15', day: 'Friday', time: '11:15 AM', subject: 'Database Systems', room: 'Room 302', instructor: 'Prof. Richard Roe', type: 'Theory' },
  ]);

  uniqueInternships = computed(() => {
    const internships = this.students().map(s => s.internship).filter(i => i && i !== 'Pending' && i !== 'None');
    return Array.from(new Set(internships)).sort();
  });

  uniqueHackathons = computed(() => {
    const hackathons = this.students().map(s => s.hackathon).filter(h => h && h !== 'Pending' && h !== 'None');
    return Array.from(new Set(hackathons)).sort();
  });

  setStudents(newStudents: Student[]) {
    this.students.set(newStudents);
  }

  addStudents(newStudents: Student[]) {
    this.students.update(current => {
      const merged = [...current];
      for (const ns of newStudents) {
        // Match by PRN or Roll No (if provided)
        const existingIndex = merged.findIndex(s => 
          (ns.prn && s.prn === ns.prn) || 
          (ns.rollNo && s.rollNo === ns.rollNo)
        );

        if (existingIndex >= 0) {
          const existing = merged[existingIndex];
          const updated = { ...existing };
          
          // Merge fields, but don't overwrite with empty values if we already have data
          (Object.keys(ns) as (keyof Student)[]).forEach(key => {
            const newValue = ns[key];
            const oldValue = existing[key];
            
            if (newValue !== undefined && newValue !== null && newValue !== '') {
              // Special case for extraData: merge the objects
              if (key === 'extraData' && newValue && typeof newValue === 'object') {
                updated.extraData = { 
                  ...(oldValue as Record<string, string | number> || {}), 
                  ...(newValue as Record<string, string | number>) 
                };
              } else {
                (updated as Record<string, unknown>)[key] = newValue;
              }
            }
          });
          
          merged[existingIndex] = updated;
        } else {
          merged.push(ns);
        }
      }
      return merged;
    });
  }
}
