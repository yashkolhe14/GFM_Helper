/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Student {
  rollNo: string;
  prn: string;
  name: string;
  gender: 'Male' | 'Female';
  email?: string;
  phone?: string;
  attendance?: string;
  feeStatus?: 'Paid' | 'Pending' | 'Partial';
  mentorName?: string;
  internshipStatus?: string;
  hackathonStatus?: string;
  github?: string;
  linkedin?: string;
  moocStatus?: string;
  vacSubjects?: string;
  class: string;
  division: string;
  semester: string;
  academicYear: string;
  gfmName: string;
}

export interface Subject {
  id?: string;
  code: string;
  name: string;
  type: string;
  faculty: string;
  weeklyHours: number;
  semester: string;
  class: string;
  division: string;
  gfmName: string;
}

export interface MentorMentee {
  id?: string;
  mentorName: string;
  mentorContact?: string;
  studentRollNo: string;
  studentName: string;
  contact?: string;
  remarks?: string;
  class: string;
  division: string;
  semester: string;
  gfmName: string;
}

export interface FeeRecord {
  id?: string;
  rollNo: string;
  studentName: string;
  status: 'Paid' | 'Pending' | 'Partial';
  amountPaid: number;
  amountPending: number;
  totalAmount: number;
  dueDate?: string;
  remark?: string;
  class: string;
  division: string;
  semester: string;
  gfmName: string;
}

export interface VACRecord {
  id?: string;
  rollNo?: string;
  studentName: string;
  subjectName: string;
  status: string;
  certification: string;
  class: string;
  division: string;
  semester: string;
  gfmName: string;
}

export interface MOOCRecord {
  id?: string;
  rollNo?: string;
  studentName: string;
  platform: string;
  courseName: string;
  status: string;
  certification: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
  class: string;
  division: string;
  semester: string;
  gfmName: string;
}

export interface Internship {
  id?: string;
  rollNo?: string;
  studentName: string;
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  duration: string;
  status: string;
  stipend?: string;
  class: string;
  division: string;
  semester: string;
  gfmName: string;
}

export interface Hackathon {
  id?: string;
  rollNo?: string;
  studentName: string;
  hackathonName: string;
  teamName: string;
  status: string;
  rank?: string;
  date?: string;
  level?: string;
  organizer?: string;
  class: string;
  division: string;
  semester: string;
  gfmName: string;
}

export interface TimetableEntry {
  id?: string;
  day: string;
  time: string;
  subject: string;
  faculty: string;
  room: string;
  class: string;
  division: string;
  semester: string;
  gfmName: string;
}

export interface FacultyMapping {
  id?: string;
  facultyName: string;
  subjectName: string;
  subjectCode: string;
  class: string;
  division: string;
  semester: string;
  role: string;
  type: string;
  gfmName: string;
}

export interface GFMContext {
  gfmName: string;
  academicYear: string;
  semester: string;
  class: string;
  division: string;
}

export interface Task {
  id: string;
  studentRollNo: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface MeetingLog {
  id: string;
  studentRollNo: string;
  date: string;
  remarks: string;
  gfmName: string;
}

export interface AppData {
  students: Student[];
  subjects: Subject[];
  mentorMentees: MentorMentee[];
  meetingLogs: MeetingLog[];
  tasks: Task[];
  feeRecords: FeeRecord[];
  vacRecords: VACRecord[];
  moocRecords: MOOCRecord[];
  internships: Internship[];
  hackathons: Hackathon[];
  timetable: TimetableEntry[];
  faculty: FacultyMapping[];
  gfmContexts: GFMContext[];
}

export interface UploadedFile {
  id: string;
  name: string;
  data: AppData;
  uploadDate: string;
}
