import * as XLSX from 'xlsx';
import { AppData, GFMContext, Student, Subject, MentorMentee, FeeRecord, VACRecord, MOOCRecord, Internship, Hackathon, TimetableEntry, FacultyMapping } from '../types';

interface WorkbookContext {
  gfmName: string;
  academicYear: string;
  semester: string;
  class: string;
  division: string;
}

export async function parseWorkbook(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      
      const appData: AppData = {
        students: [],
        subjects: [],
        mentorMentees: [],
        meetingLogs: [],
        tasks: [],
        feeRecords: [],
        vacRecords: [],
        moocRecords: [],
        internships: [],
        hackathons: [],
        timetable: [],
        faculty: [],
        gfmContexts: [],
      };

      // Stage 1: Detect Global Workbook Context
      const globalContext = extractWorkbookContext(workbook);

      const githubProfilesMap = new Map<string, string>();
      const linkedinProfilesMap = new Map<string, string>();

      // Stage 2: Parse Data Sheets
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
        
        if (jsonData.length === 0) return;

        const normalizedSheetName = normalizeSheetName(sheetName);

        if (normalizedSheetName.includes('rollcall') || normalizedSheetName.includes('student')) {
          appData.students = [...appData.students, ...parseStudents(jsonData, globalContext)];
        } else if (normalizedSheetName.includes('vac') || normalizedSheetName.includes('value added') || normalizedSheetName.includes('value_added')) {
          appData.vacRecords = [...appData.vacRecords, ...parseVACRecords(jsonData, globalContext)];
        } else if (normalizedSheetName.includes('subject')) {
          appData.subjects = [...appData.subjects, ...parseSubjects(jsonData, globalContext)];
        } else if (normalizedSheetName.includes('mentor')) {
          appData.mentorMentees = [...appData.mentorMentees, ...parseMentorMentees(jsonData, globalContext)];
        } else if (normalizedSheetName.includes('fee')) {
          appData.feeRecords = [...appData.feeRecords, ...parseFeeRecords(jsonData, globalContext)];
        } else if (normalizedSheetName.includes('mooc')) {
          appData.moocRecords = [...appData.moocRecords, ...parseMOOCRecords(jsonData, globalContext)];
        } else if (normalizedSheetName.includes('internship')) {
          appData.internships = [...appData.internships, ...parseInternships(jsonData, globalContext)];
        } else if (normalizedSheetName.includes('hackathon') || normalizedSheetName.includes('hackthon') || normalizedSheetName.includes('competition') || (normalizedSheetName.includes('participation') && !normalizedSheetName.includes('mooc') && !normalizedSheetName.includes('internship'))) {
          appData.hackathons = [...appData.hackathons, ...parseHackathons(jsonData, globalContext)];
        } else if (normalizedSheetName.includes('timetable') || normalizedSheetName.includes('schedule') || normalizedSheetName.includes('lectures')) {
          appData.timetable = [...appData.timetable, ...parseTimetable(jsonData, globalContext)];
        } else if (normalizedSheetName.includes('faculty')) {
          appData.faculty = [...appData.faculty, ...parseFaculty(jsonData, globalContext)];
        } else if (normalizedSheetName.includes('github')) {
          parseSocialProfiles(jsonData, 'github', githubProfilesMap);
        } else if (normalizedSheetName.includes('linkedin')) {
          parseSocialProfiles(jsonData, 'linkedin', linkedinProfilesMap);
        }
      });

      // Stage 3: Post-processing & Cross-referencing
      
      // 1. If subjects are empty, try to populate from faculty sheet
      if (appData.subjects.length === 0 && appData.faculty.length > 0) {
        appData.subjects = appData.faculty.map(f => ({
          code: f.subjectCode,
          name: f.subjectName,
          type: f.type,
          faculty: f.facultyName,
          weeklyHours: 0,
          semester: f.semester,
          class: f.class,
          division: f.division,
          gfmName: f.gfmName,
        }));
      } else if (appData.faculty.length > 0) {
        // If subjects exist, update their type from faculty sheet mapping
        const subjectTypeMap = new Map<string, Set<string>>();
        appData.faculty.forEach(f => {
          const name = f.subjectName.toLowerCase().trim();
          if (!subjectTypeMap.has(name)) subjectTypeMap.set(name, new Set());
          if (f.type && f.type !== 'N/A') {
            f.type.split('&').forEach(t => {
              const trimmedType = t.trim();
              if (trimmedType) subjectTypeMap.get(name)!.add(trimmedType);
            });
          }
        });

        appData.subjects.forEach(s => {
          const name = s.name.toLowerCase().trim();
          if (subjectTypeMap.has(name)) {
            const types = Array.from(subjectTypeMap.get(name)!);
            if (types.length > 0) {
              // Sort to ensure consistent display (Theory then Lab)
              types.sort((a, b) => b.localeCompare(a)); 
              s.type = types.join(' & ');
            }
          }
        });
      }

      // 1b. Add VAC subjects to subjects list
      const vacSubjects = appData.vacRecords.map(v => ({
        code: 'VAC',
        name: v.subjectName,
        type: 'VAC',
        faculty: 'N/A',
        weeklyHours: 0,
        semester: v.semester,
        class: v.class,
        division: v.division,
        gfmName: v.gfmName,
      }));
      
      // Filter out duplicates
      const existingSubjectNames = new Set(appData.subjects.map(s => s.name.toLowerCase()));
      vacSubjects.forEach(vs => {
        if (!existingSubjectNames.has(vs.name.toLowerCase())) {
          appData.subjects.push(vs);
          existingSubjectNames.add(vs.name.toLowerCase());
        }
      });

      // 2. Cross-reference student names using Roll No
      const studentMap = new Map(appData.students.map(s => [s.rollNo.trim(), s]));
      
      // Merge social profiles
      githubProfilesMap.forEach((url, rollNo) => {
        const trimmedRoll = rollNo.trim();
        if (studentMap.has(trimmedRoll)) {
          studentMap.get(trimmedRoll)!.github = url;
        }
      });

      linkedinProfilesMap.forEach((url, rollNo) => {
        const trimmedRoll = rollNo.trim();
        if (studentMap.has(trimmedRoll)) {
          studentMap.get(trimmedRoll)!.linkedin = url;
        }
      });

      appData.feeRecords.forEach(f => {
        const trimmedRoll = f.rollNo.trim();
        if (trimmedRoll && studentMap.has(trimmedRoll)) {
          const s = studentMap.get(trimmedRoll)!;
          if (!f.studentName) f.studentName = s.name;
          if (!f.gfmName) f.gfmName = s.gfmName;
          
          // Sync fee status to student object
          s.feeStatus = f.status;
        }
      });

      appData.internships.forEach(i => {
        const trimmedRoll = i.rollNo.trim();
        if (trimmedRoll && studentMap.has(trimmedRoll)) {
          const s = studentMap.get(trimmedRoll)!;
          if (!i.studentName) i.studentName = s.name;
          if (!i.gfmName) i.gfmName = s.gfmName;
        }
      });

      appData.mentorMentees.forEach(m => {
        const trimmedRoll = m.studentRollNo.trim();
        if (trimmedRoll && studentMap.has(trimmedRoll)) {
          const student = studentMap.get(trimmedRoll)!;
          if (!m.studentName) m.studentName = student.name;
          if (!m.contact) m.contact = student.phone || student.email || '';
          if (!m.gfmName) m.gfmName = student.gfmName;
          
          // Also update the student record with their mentor
          student.mentorName = m.mentorName;
        }
      });
      
      // Filter out mentees that couldn't be mapped to a real student
      appData.mentorMentees = appData.mentorMentees.filter(m => m.studentName);

      appData.moocRecords.forEach(m => {
        const trimmedRoll = m.rollNo.trim();
        if (trimmedRoll && studentMap.has(trimmedRoll)) {
          const student = studentMap.get(trimmedRoll)!;
          if (!m.studentName) m.studentName = student.name;
          if (!m.gfmName) m.gfmName = student.gfmName;
          
          const status = m.status;
          const entry = `${m.courseName} (${status})`;
          if (!student.moocStatus) student.moocStatus = entry;
          else if (!student.moocStatus.includes(m.courseName)) {
            student.moocStatus += `; ${entry}`;
          }
        }
      });

      appData.hackathons.forEach(h => {
        const trimmedRoll = h.rollNo.trim();
        if (trimmedRoll && studentMap.has(trimmedRoll)) {
          const student = studentMap.get(trimmedRoll)!;
          if (!h.studentName) h.studentName = student.name;
          if (!h.gfmName) h.gfmName = student.gfmName;
          
          const entry = `${h.hackathonName} (${h.status})`;
          if (!student.hackathonStatus) student.hackathonStatus = entry;
          else if (!student.hackathonStatus.includes(h.hackathonName)) {
            student.hackathonStatus += `; ${entry}`;
          }
        }
      });

      appData.vacRecords.forEach(v => {
        const trimmedRoll = v.rollNo.trim();
        if (trimmedRoll && studentMap.has(trimmedRoll)) {
          const student = studentMap.get(trimmedRoll)!;
          if (!v.studentName) v.studentName = student.name;
          if (!v.gfmName) v.gfmName = student.gfmName;
          
          if (!student.vacSubjects) student.vacSubjects = v.subjectName;
          else if (!student.vacSubjects.includes(v.subjectName)) {
            student.vacSubjects += `, ${v.subjectName}`;
          }
        }
      });

      // 3. Cross-reference Timetable faculty from Faculty sheet
      if (appData.faculty.length > 0) {
        const facultyMap = new Map<string, string>();
        appData.faculty.forEach(f => {
          const key = f.subjectName.toLowerCase().trim();
          if (!facultyMap.has(key)) {
            facultyMap.set(key, f.facultyName);
          } else {
            const existing = facultyMap.get(key)!;
            if (!existing.includes(f.facultyName)) {
              facultyMap.set(key, `${existing} / ${f.facultyName}`);
            }
          }
        });

        appData.timetable.forEach(t => {
          const subjectKey = t.subject.toLowerCase().trim();
          
          // 1. Try exact match
          if (facultyMap.has(subjectKey)) {
            if (!t.faculty || t.faculty === 'N/A' || t.faculty === '-' || t.faculty.length < 3) {
              t.faculty = facultyMap.get(subjectKey)!;
            }
          } else {
            // 2. Try base subject match for electives (e.g., "PEC-II" matching "PEC-II (DMA)")
            const aggregatedFaculty: string[] = [];
            appData.faculty.forEach(f => {
              const fSubjectLower = f.subjectName.toLowerCase();
              // Check if the timetable subject is a prefix or part of the faculty subject
              // e.g., "PEC-II" is in "PEC-II (DMA)"
              if (fSubjectLower.includes(subjectKey) && subjectKey.length > 3) {
                const electiveMatch = f.subjectName.match(/\((.+?)\)$/);
                const display = electiveMatch ? `${f.facultyName} (${electiveMatch[1]})` : f.facultyName;
                if (!aggregatedFaculty.includes(display)) {
                  aggregatedFaculty.push(display);
                }
              }
            });
            
            if (aggregatedFaculty.length > 0 && (!t.faculty || t.faculty === 'N/A' || t.faculty === '-' || t.faculty.length < 3)) {
              t.faculty = aggregatedFaculty.join(' / ');
            }
          }
        });
      }

      // Extract GFM Contexts
      appData.gfmContexts = extractGFMContexts(appData, globalContext);

      if (appData.gfmContexts.length === 0) {
        reject(new Error('Could not determine GFM context from the workbook. No row-level GFM column was found, and no workbook metadata such as GFM: ... was detected in sheets like TIME TABLE or FACULTY.'));
      } else {
        resolve(appData);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

function normalizeSheetName(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}

function parseNumeric(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Remove currency symbols, commas, and other non-numeric characters except decimal point and minus sign
  const str = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function extractWorkbookContext(workbook: XLSX.WorkBook): WorkbookContext | null {
  const context: Partial<WorkbookContext> = {};
  
  // Scan all sheets for metadata if not found in primary ones
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: '' }) as any[][];
    
    // Scan first 20 rows and 10 columns
    for (let r = 0; r < Math.min(data.length, 20); r++) {
      for (let c = 0; c < Math.min(data[r].length, 10); c++) {
        const cellValue = String(data[r][c] || '').trim();
        if (!cellValue) continue;

        // GFM Pattern
        const gfmMatch = cellValue.match(/(gfm|guardian faculty member|class teacher)\s*[:\-]\s*(.+)/i);
        if (gfmMatch && !context.gfmName) context.gfmName = gfmMatch[2].trim();

        // Academic Year Pattern
        const ayMatch = cellValue.match(/(academic year|a\.y\.|ay)\s*[:\-]?\s*(\d{4}-\d{2,4})/i);
        if (ayMatch && !context.academicYear) context.academicYear = ayMatch[2].trim();

        // Semester Pattern
        const semMatch = cellValue.match(/(semester|sem)\s*[:\-]?\s*([ivx\d]+)/i);
        if (semMatch && !context.semester) context.semester = semMatch[2].trim().toUpperCase();

        // Class Pattern
        const classMatch = cellValue.match(/(class|year\/class)\s*[:\-]\s*(.+)/i);
        if (classMatch && !context.class) context.class = classMatch[2].trim();

        // Division Pattern
        const divMatch = cellValue.match(/(division|div)\s*[:\-]\s*(.+)/i);
        if (divMatch && !context.division) context.division = divMatch[2].trim();
      }
    }
    // If we found GFM, we can stop or keep looking for others
    if (context.gfmName && context.class && context.division) break;
  }

  if (context.gfmName) {
    return {
      gfmName: context.gfmName,
      academicYear: context.academicYear || 'N/A',
      semester: context.semester || 'N/A',
      class: context.class || 'N/A',
      division: context.division || 'N/A',
    };
  }

  return null;
}

function findHeaderRow(data: any[][], keywords: string[]): number {
  let bestRow = 0;
  let maxMatches = 0;

  for (let i = 0; i < Math.min(data.length, 50); i++) {
    const row = data[i];
    if (!row) continue;
    
    let matches = 0;
    row.forEach(cell => {
      const cellText = String(cell || '').toLowerCase().trim();
      if (keywords.some(kw => cellText.includes(kw.toLowerCase()))) {
        matches++;
      }
    });

    if (matches > maxMatches) {
      maxMatches = matches;
      bestRow = i;
    }
  }
  return bestRow;
}

/**
 * Finds the index of a header that matches any of the provided keywords.
 * Optionally skips a specific index (useful for multiple occurrences).
 */
function getHeaderIndex(headers: string[], keywords: string[], skipIndex: number = -1): number {
  for (const k of keywords) {
    const lowerK = k.toLowerCase();
    const index = headers.findIndex((h, i) => h.includes(lowerK) && i !== skipIndex);
    if (index !== -1) return index;
  }
  return -1;
}

function parseStudents(data: any[][], context: WorkbookContext | null): Student[] {
  const headerRow = findHeaderRow(data, ['roll', 'prn', 'name', 'gender']);
  const headers = data[headerRow].map(h => String(h || '').toLowerCase().trim());
  const rows = data.slice(headerRow + 1);

  const idx = {
    roll: getHeaderIndex(headers, ['roll']),
    prn: getHeaderIndex(headers, ['prn', 'id']),
    name: getHeaderIndex(headers, ['student name', 'name', 'candidate']),
    gender: getHeaderIndex(headers, ['gender', 'm/f']),
    email: getHeaderIndex(headers, ['email']),
    phone: getHeaderIndex(headers, ['phone', 'contact', 'mobile']),
    fee: getHeaderIndex(headers, ['fee', 'status']),
    class: getHeaderIndex(headers, ['class']),
    div: getHeaderIndex(headers, ['division', 'div']),
    sem: getHeaderIndex(headers, ['semester', 'sem']),
    ay: getHeaderIndex(headers, ['academic year', 'year']),
    gfm: getHeaderIndex(headers, ['gfm']),
    github: getHeaderIndex(headers, ['github']),
    linkedin: getHeaderIndex(headers, ['linkedin']),
  };

  return rows.map(row => {
    const gfmName = String(row[idx.gfm] || context?.gfmName || '').trim();
    if (!gfmName) return null;

    const student: Student = {
      rollNo: String(row[idx.roll] || ''),
      prn: String(row[idx.prn] || ''),
      name: String(row[idx.name] || ''),
      gender: (String(row[idx.gender] || '').toLowerCase().startsWith('f') ? 'Female' : 'Male') as 'Male' | 'Female',
      email: String(row[idx.email] || ''),
      phone: String(row[idx.phone] || ''),
      feeStatus: row[idx.fee] as any || 'Pending',
      class: String(row[idx.class] || context?.class || ''),
      division: String(row[idx.div] || context?.division || ''),
      semester: String(row[idx.sem] || context?.semester || ''),
      academicYear: String(row[idx.ay] || context?.academicYear || ''),
      gfmName: gfmName,
      github: String(row[idx.github] || ''),
      linkedin: String(row[idx.linkedin] || ''),
    };
    return student;
  }).filter((s): s is Student => !!s && !!s.name && s.name.toLowerCase() !== 'name');
}

function parseSubjects(data: any[][], context: WorkbookContext | null): Subject[] {
  const headerRow = findHeaderRow(data, ['subject', 'code', 'faculty']);
  const headers = data[headerRow].map(h => String(h || '').toLowerCase().trim());
  const rows = data.slice(headerRow + 1);

  const idx = {
    code: getHeaderIndex(headers, ['code']),
    name: getHeaderIndex(headers, ['subject', 'name']),
    type: getHeaderIndex(headers, ['type']),
    faculty: getHeaderIndex(headers, ['faculty']),
    hours: getHeaderIndex(headers, ['hours', 'weekly']),
    sem: getHeaderIndex(headers, ['semester', 'sem']),
    class: getHeaderIndex(headers, ['class']),
    div: getHeaderIndex(headers, ['division', 'div']),
    gfm: getHeaderIndex(headers, ['gfm']),
    lecture: getHeaderIndex(headers, ['lecture', 'theory']),
    practical: getHeaderIndex(headers, ['practical', 'lab']),
  };

  return rows.map(row => {
    const gfmName = String(row[idx.gfm] || context?.gfmName || '').trim();
    if (!gfmName) return null;

    // Determine subject type (Theory/Lab)
    const types: string[] = [];
    if (row[idx.lecture] && String(row[idx.lecture]).trim()) types.push('Theory');
    if (row[idx.practical] && String(row[idx.practical]).trim()) types.push('Lab');
    const subjectType = types.length > 0 ? types.join(' & ') : String(row[idx.type] || '');

    const subject: Subject = {
      id: crypto.randomUUID(),
      code: String(row[idx.code] || ''),
      name: String(row[idx.name] || ''),
      type: subjectType,
      faculty: String(row[idx.faculty] || ''),
      weeklyHours: Number(row[idx.hours] || 0),
      semester: String(row[idx.sem] || context?.semester || ''),
      class: String(row[idx.class] || context?.class || ''),
      division: String(row[idx.div] || context?.division || ''),
      gfmName: gfmName,
    };
    return subject;
  }).filter((s): s is Subject => !!s && !!s.name && !s.name.toLowerCase().includes('total'));
}

function parseMentorMentees(data: any[][], context: WorkbookContext | null): MentorMentee[] {
  const headerRow = findHeaderRow(data, ['mentor', 'mentee', 'student', 'roll']);
  const headers = data[headerRow].map(h => String(h || '').toLowerCase().trim());
  const rows = data.slice(headerRow + 1);

  const idx = {
    mentor: getHeaderIndex(headers, ['mentor']),
    mentorContact: getHeaderIndex(headers, ['mentor contact', 'mentor phone', 'mentor email']),
    roll: getHeaderIndex(headers, ['roll']),
    student: getHeaderIndex(headers, ['student', 'mentee', 'name']),
    contact: getHeaderIndex(headers, ['contact', 'phone']),
    remarks: getHeaderIndex(headers, ['remark']),
    gfm: getHeaderIndex(headers, ['gfm']),
  };

  const mentorMentees: MentorMentee[] = [];
  let currentMentor = '';
  let currentMentorContact = '';

  rows.forEach(row => {
    const gfmName = String(row[idx.gfm] || context?.gfmName || '').trim();

    // Keep track of the current mentor if cells are merged/empty below
    const rowMentor = String(row[idx.mentor] || '').trim();
    if (rowMentor && rowMentor.toLowerCase() !== 'mentor') {
      currentMentor = rowMentor;
      currentMentorContact = String(row[idx.mentorContact] || '').trim();
    }

    if (!currentMentor) return;

    const rollValue = String(row[idx.roll] || '').trim();
    const studentName = String(row[idx.student] || '').trim();

    // Handle roll number ranges like "1-10" or "1 to 10"
    const rangeMatch = rollValue.match(/^(\d+)\s*(?:-|to)\s*(\d+)$/i);
    
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          mentorMentees.push({
            id: crypto.randomUUID(),
            mentorName: currentMentor,
            mentorContact: currentMentorContact,
            studentRollNo: String(i),
            studentName: '', // Will be populated in Stage 3
            contact: '',
            remarks: '',
            class: context?.class || 'N/A',
            division: context?.division || 'N/A',
            semester: context?.semester || 'N/A',
            gfmName: gfmName,
          });
        }
      }
    } else if (rollValue || studentName) {
      // Handle individual student entries
      mentorMentees.push({
        id: crypto.randomUUID(),
        mentorName: currentMentor,
        mentorContact: currentMentorContact,
        studentRollNo: rollValue,
        studentName: studentName,
        contact: String(row[idx.contact] || ''),
        remarks: String(row[idx.remarks] || ''),
        class: context?.class || 'N/A',
        division: context?.division || 'N/A',
        semester: context?.semester || 'N/A',
        gfmName: gfmName,
      });
    }
  });

  return mentorMentees.filter(m => m.studentRollNo || m.studentName);
}

function parseFeeRecords(data: any[][], context: WorkbookContext | null): FeeRecord[] {
  const headerRow = findHeaderRow(data, ['roll', 'status', 'amount', 'paid', 'pending', 'balance']);
  const headers = data[headerRow].map(h => String(h || '').toLowerCase().trim());
  const rows = data.slice(headerRow + 1);

  const idx = {
    roll: getHeaderIndex(headers, ['roll']),
    name: getHeaderIndex(headers, ['student name', 'student', 'candidate']),
    status: getHeaderIndex(headers, ['status', 'fee']),
    paid: getHeaderIndex(headers, ['amount paid', 'paid']),
    pending: getHeaderIndex(headers, ['amount pending', 'pending', 'balance', 'unpaid']),
    total: getHeaderIndex(headers, ['total amount', 'total', 'fees']),
    due: getHeaderIndex(headers, ['due date', 'deadline']),
    remark: getHeaderIndex(headers, ['remark']),
    gfm: getHeaderIndex(headers, ['gfm']),
  };

  return rows.map(row => {
    const gfmName = String(row[idx.gfm] || context?.gfmName || '').trim();

    let total = parseNumeric(row[idx.total]);
    let paid = parseNumeric(row[idx.paid]);
    let pending = parseNumeric(row[idx.pending]);
    
    // Cross-calculate if values are missing
    if (total === 0 && (paid > 0 || pending > 0)) {
      total = paid + pending;
    } else if (pending === 0 && total > paid) {
      pending = total - paid;
    } else if (paid === 0 && total > pending && pending > 0) {
      paid = total - pending;
    }

    const rawStatus = String(row[idx.status] || '').toLowerCase();
    
    let status: 'Paid' | 'Pending' | 'Partial' = 'Pending';
    if (total > 0 && paid > 0 && paid < total) {
      status = 'Partial';
    } else if (total > 0 && paid >= total) {
      status = 'Paid';
    } else if (pending === 0 && total > 0) {
      status = 'Paid';
    } else if (rawStatus.includes('paid') || rawStatus.includes('complete') || rawStatus.includes('cleared')) {
      status = 'Paid';
    } else if (rawStatus.includes('partial')) {
      status = 'Partial';
    }

    const fee: FeeRecord = {
      id: crypto.randomUUID(),
      rollNo: String(row[idx.roll] || ''),
      studentName: String(row[idx.name] || ''),
      status: status,
      amountPaid: paid,
      amountPending: pending,
      totalAmount: total,
      dueDate: String(row[idx.due] || ''),
      remark: String(row[idx.remark] || ''),
      class: context?.class || 'N/A',
      division: context?.division || 'N/A',
      semester: context?.semester || 'N/A',
      gfmName: gfmName,
    };
    return fee;
  }).filter((f): f is FeeRecord => !!f && !!f.studentName && !f.studentName.toLowerCase().includes('total'));
}

/**
 * Finds all indices of headers that match any of the provided keywords.
 */
function getAllHeaderIndices(headers: string[], keywords: string[], excludeKeywords: string[] = []): number[] {
  const indices: number[] = [];
  const lowerKeywords = keywords.map(k => k.toLowerCase());
  const lowerExclude = excludeKeywords.map(k => k.toLowerCase());

  headers.forEach((h, i) => {
    const lowerH = h.toLowerCase();
    const matches = lowerKeywords.some(k => lowerH.includes(k));
    const excluded = lowerExclude.some(k => lowerH.includes(k));
    if (matches && !excluded) {
      indices.push(i);
    }
  });
  return indices;
}

function parseVACRecords(data: any[][], context: WorkbookContext | null): VACRecord[] {
  const headerRow = findHeaderRow(data, ['student', 'vac', 'course', 'subject', 'roll', 'name', 'status', 'value added']);
  const headers = data[headerRow].map(h => String(h || '').toLowerCase().trim());
  const rows = data.slice(headerRow + 1);

  const rollIdx = getHeaderIndex(headers, ['roll']);
  const nameIdx = getHeaderIndex(headers, ['student name', 'student', 'candidate', 'name']);
  const gfmIdx = getHeaderIndex(headers, ['gfm']);
  
  const subjectIndices = getAllHeaderIndices(headers, ['subject', 'course', 'vac', 'value added'], ['platform', 'status', 'cert', 'duration', 'date', 'roll', 'student', 'gfm']);
  const statusIndices = getAllHeaderIndices(headers, ['status', 'completion status']);
  const certIndices = getAllHeaderIndices(headers, ['cert', 'certification', 'certificate']);

  return rows.flatMap(row => {
    const gfmName = String(row[gfmIdx] || context?.gfmName || '').trim();

    const records: VACRecord[] = [];

    subjectIndices.forEach((sIdx, i) => {
      const rawValue = String(row[sIdx] || '').trim();
      const lowerVal = rawValue.toLowerCase();
      if (!rawValue || lowerVal === 'n/a' || lowerVal === 'na' || lowerVal === 'none' || lowerVal === '-' || lowerVal === '0') return;

      // Split by comma, slash, semicolon or newline in case multiple courses are in one cell
      const subjects = rawValue.split(/[,/;\n\r]/).map(s => s.trim()).filter(Boolean);
      
      subjects.forEach(sName => {
        const sIdx = statusIndices.length > i ? statusIndices[i] : statusIndices[0];
        let status = sIdx !== undefined ? String(row[sIdx] || '').trim() : '';
        
        if (!status || status === '-') {
          status = 'Pending';
        }

        records.push({
          id: crypto.randomUUID(),
          rollNo: String(row[rollIdx] || ''),
          studentName: String(row[nameIdx] || ''),
          subjectName: sName,
          status: status,
          certification: String(row[certIndices[i]] || (certIndices[0] !== undefined ? row[certIndices[0]] : '') || 'No'),
          class: context?.class || 'N/A',
          division: context?.division || 'N/A',
          semester: context?.semester || 'N/A',
          gfmName: gfmName,
        });
      });
    });

    return records;
  }).filter((v): v is VACRecord => !!v && (!!v.studentName || !!v.rollNo));
}

function parseMOOCRecords(data: any[][], context: WorkbookContext | null): MOOCRecord[] {
  const headerRow = findHeaderRow(data, ['student', 'mooc', 'platform', 'course', 'roll', 'portal', 'status']);
  const headers = data[headerRow].map(h => String(h || '').toLowerCase().trim());
  const rows = data.slice(headerRow + 1);

  const rollIdx = getHeaderIndex(headers, ['roll']);
  const nameIdx = getHeaderIndex(headers, ['student name', 'student', 'candidate', 'name']);
  const gfmIdx = getHeaderIndex(headers, ['gfm']);
  
  const courseIndices = getAllHeaderIndices(headers, ['course', 'mooc', 'title', 'subject', 'certification name', 'topic'], ['platform', 'status', 'duration', 'date', 'roll', 'student', 'gfm']);
  const platformIndices = getAllHeaderIndices(headers, ['platform', 'portal', 'website', 'portal name', 'mooc platform', 'website name']);
  const statusIndices = getAllHeaderIndices(headers, ['status', 'completion status', 'result']);
  const certIndices = getAllHeaderIndices(headers, ['cert', 'certification', 'certificate', 'certified']);
  const durationIndices = getAllHeaderIndices(headers, ['duration', 'hours', 'weeks', 'period']);
  const startIndices = getAllHeaderIndices(headers, ['start', 'from date', 'commencement']);
  const endIndices = getAllHeaderIndices(headers, ['end', 'to date', 'completion date']);

  return rows.flatMap(row => {
    const gfmName = String(row[gfmIdx] || context?.gfmName || '').trim();

    const records: MOOCRecord[] = [];

    courseIndices.forEach((cIdx, i) => {
      const rawValue = String(row[cIdx] || '').trim();
      const lowerVal = rawValue.toLowerCase();
      const isEmpty = !rawValue || lowerVal === 'n/a' || lowerVal === 'na' || lowerVal === 'none' || lowerVal === '-' || lowerVal === '0';
      
      const platform = String(row[platformIndices[i]] || (platformIndices[0] !== undefined ? row[platformIndices[0]] : '') || '').trim();
      const sIdx = statusIndices.length > i ? statusIndices[i] : statusIndices[0];
      let status = sIdx !== undefined ? String(row[sIdx] || '').trim() : '';

      if (isEmpty) {
        records.push({
          id: crypto.randomUUID(),
          rollNo: String(row[rollIdx] || ''),
          studentName: String(row[nameIdx] || ''),
          platform: platform || '-',
          courseName: '-',
          status: 'Not Enrolled',
          certification: 'No',
          startDate: '',
          endDate: '',
          duration: '',
          class: context?.class || 'N/A',
          division: context?.division || 'N/A',
          semester: context?.semester || 'N/A',
          gfmName: gfmName,
        });
      } else {
        // If course name is present, status is "Enrolled" (as per user request) 
        // but we might want to keep the original status if it's "Completed"
        const finalStatus = (status.toLowerCase().includes('complete') || status.toLowerCase().includes('pass')) 
          ? 'Completed' 
          : 'Enrolled';

        records.push({
          id: crypto.randomUUID(),
          rollNo: String(row[rollIdx] || ''),
          studentName: String(row[nameIdx] || ''),
          platform: platform || '-',
          courseName: rawValue,
          status: finalStatus,
          certification: String(row[certIndices[i]] || (certIndices[0] !== undefined ? row[certIndices[0]] : '') || 'No'),
          startDate: String(row[startIndices[i]] || row[startIndices[0]] || ''),
          endDate: String(row[endIndices[i]] || row[endIndices[0]] || ''),
          duration: String(row[durationIndices[i]] || row[durationIndices[0]] || ''),
          class: context?.class || 'N/A',
          division: context?.division || 'N/A',
          semester: context?.semester || 'N/A',
          gfmName: gfmName,
        });
      }
    });

    return records;
  }).filter((m): m is MOOCRecord => !!m && (!!m.studentName || !!m.rollNo));
}

function parseInternships(data: any[][], context: WorkbookContext | null): Internship[] {
  const headerRow = findHeaderRow(data, ['student', 'company', 'role']);
  const headers = data[headerRow].map(h => String(h || '').toLowerCase().trim());
  const rows = data.slice(headerRow + 1);

  const idx = {
    roll: getHeaderIndex(headers, ['roll']),
    name: getHeaderIndex(headers, ['student name', 'student', 'candidate']),
    company: getHeaderIndex(headers, ['company']),
    role: getHeaderIndex(headers, ['role']),
    start: getHeaderIndex(headers, ['start date', 'start']),
    end: getHeaderIndex(headers, ['end date', 'end']),
    duration: getHeaderIndex(headers, ['duration']),
    status: getHeaderIndex(headers, ['status']),
    stipend: getHeaderIndex(headers, ['stipend']),
    gfm: getHeaderIndex(headers, ['gfm']),
  };

  return rows.map(row => {
    const gfmName = String(row[idx.gfm] || context?.gfmName || '').trim();

    const internship: Internship = {
      id: crypto.randomUUID(),
      rollNo: String(row[idx.roll] || ''),
      studentName: String(row[idx.name] || ''),
      company: String(row[idx.company] || ''),
      role: String(row[idx.role] || ''),
      startDate: String(row[idx.start] || ''),
      endDate: String(row[idx.end] || ''),
      duration: String(row[idx.duration] || ''),
      status: String(row[idx.status] || ''),
      stipend: String(row[idx.stipend] || ''),
      class: context?.class || 'N/A',
      division: context?.division || 'N/A',
      semester: context?.semester || 'N/A',
      gfmName: gfmName,
    };
    return internship;
  }).filter((i): i is Internship => !!i && !!i.studentName);
}

function parseHackathons(data: any[][], context: WorkbookContext | null): Hackathon[] {
  const headerRow = findHeaderRow(data, ['student', 'hackathon', 'team', 'event', 'participation', 'roll', 'rank', 'date', 'prize']);
  if (headerRow === -1 || !data[headerRow]) return [];
  
  const headers = data[headerRow].map(h => String(h || '').toLowerCase().trim());
  const rows = data.slice(headerRow + 1);

  const rollIdx = getHeaderIndex(headers, ['roll', 'no', 'sr']);
  const nameIdx = getHeaderIndex(headers, ['student name', 'student', 'candidate', 'name', 'full name']);
  const gfmIdx = getHeaderIndex(headers, ['gfm']);
  
  const hackIndices = getAllHeaderIndices(headers, ['hackathon', 'event', 'title', 'competition', 'participation', 'name of hackathon', 'activity', 'workshop', 'topic'], ['team', 'status', 'rank', 'date', 'level', 'organizer', 'roll', 'student', 'gfm']);
  const teamIndices = getAllHeaderIndices(headers, ['team', 'name of team']);
  const statusIndices = getAllHeaderIndices(headers, ['status', 'result', 'participation status', 'outcome']);
  const rankIndices = getAllHeaderIndices(headers, ['rank', 'position', 'prize', 'award']);
  const dateIndices = getAllHeaderIndices(headers, ['date', 'year', 'month', 'time']);
  const levelIndices = getAllHeaderIndices(headers, ['level', 'category', 'type']);
  const orgIndices = getAllHeaderIndices(headers, ['organizer', 'venue', 'college', 'host', 'organization']);

  return rows.flatMap(row => {
    const gfmName = String(row[gfmIdx] || context?.gfmName || '').trim();

    const records: Hackathon[] = [];

    hackIndices.forEach((hIdx, i) => {
      const rawValue = String(row[hIdx] || '').trim();
      const lowerVal = rawValue.toLowerCase();
      if (!rawValue || lowerVal === 'n/a' || lowerVal === 'na' || lowerVal === 'none' || lowerVal === '-' || lowerVal === '0') return;

      records.push({
        id: crypto.randomUUID(),
        rollNo: String(row[rollIdx] || ''),
        studentName: String(row[nameIdx] || ''),
        hackathonName: rawValue,
        teamName: String(row[teamIndices[i]] || row[teamIndices[0]] || ''),
        status: String(row[statusIndices[i]] || row[statusIndices[0]] || 'Participated'),
        rank: String(row[rankIndices[i]] || row[rankIndices[0]] || ''),
        date: String(row[dateIndices[i]] || row[dateIndices[0]] || ''),
        level: String(row[levelIndices[i]] || row[levelIndices[0]] || ''),
        organizer: String(row[orgIndices[i]] || row[orgIndices[0]] || ''),
        class: context?.class || 'N/A',
        division: context?.division || 'N/A',
        semester: context?.semester || 'N/A',
        gfmName: gfmName,
      });
    });

    return records;
  }).filter((h): h is Hackathon => !!h && (!!h.studentName || !!h.rollNo));
}

function parseTimetable(data: any[][], context: WorkbookContext | null): TimetableEntry[] {
  const headerRow = findHeaderRow(data, ['day', 'time', 'subject', 'monday', 'tuesday', 'wednesday']);
  if (headerRow === -1 || !data[headerRow]) return [];

  const headers = data[headerRow].map(h => String(h || '').toLowerCase().trim());
  const rows = data.slice(headerRow + 1);

  const idx = {
    day: getHeaderIndex(headers, ['day']),
    time: getHeaderIndex(headers, ['time', 'slot', 'period']),
    subject: getHeaderIndex(headers, ['subject', 'course']),
    faculty: getHeaderIndex(headers, ['faculty', 'teacher', 'instructor']),
    room: getHeaderIndex(headers, ['room', 'lab', 'hall']),
    class: getHeaderIndex(headers, ['class']),
    div: getHeaderIndex(headers, ['division', 'div']),
    sem: getHeaderIndex(headers, ['semester', 'sem']),
    gfm: getHeaderIndex(headers, ['gfm']),
  };

  // Check if this is a GRID format (Days as columns)
  const dayColumns = [
    { name: 'Monday', index: getHeaderIndex(headers, ['monday']) },
    { name: 'Tuesday', index: getHeaderIndex(headers, ['tuesday']) },
    { name: 'Wednesday', index: getHeaderIndex(headers, ['wednesday']) },
    { name: 'Thursday', index: getHeaderIndex(headers, ['thursday']) },
    { name: 'Friday', index: getHeaderIndex(headers, ['friday']) },
    { name: 'Saturday', index: getHeaderIndex(headers, ['saturday']) },
  ].filter(d => d.index !== -1);

  if (dayColumns.length > 0 && idx.time !== -1) {
    // GRID FORMAT detected
    const entries: TimetableEntry[] = [];
    rows.forEach(row => {
      const time = String(row[idx.time] || '').trim();
      if (!time || time.toLowerCase().includes('time')) return;

      dayColumns.forEach(dayCol => {
        const cellContent = String(row[dayCol.index] || '').trim();
        if (!cellContent || cellContent === '-' || cellContent.toLowerCase() === 'break') return;

        // Often grid cells contain "Subject (Faculty)" or "Subject / Faculty" or "Subject (Room)"
        // Or the new format: "Subject\n(Faculty)\n[Room]"
        let subject = cellContent;
        let faculty = '';
        let room = String(row[idx.room] || '').trim();
        
        // Handle newlines if present
        if (cellContent.includes('\n')) {
          const parts = cellContent.split('\n').map(p => p.trim()).filter(Boolean);
          subject = parts[0];
          parts.slice(1).forEach(part => {
            const fMatch = part.match(/^\((.+)\)$/);
            const rMatch = part.match(/^\[(.+)\]$/);
            if (fMatch) faculty = fMatch[1];
            else if (rMatch) room = rMatch[1];
            else if (!faculty) faculty = part;
            else if (!room) room = part;
          });
        } else {
          // Try to extract room if it's at the end, e.g., "Subject (Faculty) 101" or "Subject (Faculty) [101]"
          const roomMatch = cellContent.match(/(.+?)\s*(?:\[|\b(?:Room|Lab)\s+)([A-Z0-9]+)(?:\])?$/i) || cellContent.match(/(.+?)\s+([A-Z]?\d{1,4}[A-Z]?)$/i);
          if (roomMatch) {
            subject = roomMatch[1].trim();
            if (!room) room = roomMatch[2].trim();
          }

          const infoMatch = subject.match(/^(.+?)\s*[\(\/]\s*(.+?)\s*[\)]?$/);
          if (infoMatch) {
            subject = infoMatch[1].trim();
            const info = infoMatch[2].trim();
            
            // Heuristic: if it's short and contains numbers, it might be a room
            if (!room && (info.match(/^[A-Z]?\d+[A-Z]?$/i) || info.toLowerCase().includes('room') || info.toLowerCase().includes('lab'))) {
              room = info;
            } else {
              faculty = info;
            }
          }
        }

        const gfmName = String(row[idx.gfm] || context?.gfmName || '').trim();
        if (!gfmName) return;

        entries.push({
          id: crypto.randomUUID(),
          day: dayCol.name,
          time: time,
          subject: subject,
          faculty: faculty || String(row[idx.faculty] || ''),
          room: room,
          class: String(row[idx.class] || context?.class || 'N/A'),
          division: String(row[idx.div] || context?.division || 'N/A'),
          semester: String(row[idx.sem] || context?.semester || 'N/A'),
          gfmName: gfmName,
        });
      });
    });
    return entries;
  }

  // LIST FORMAT (Original logic)
  return rows.map(row => {
    const gfmName = String(row[idx.gfm] || context?.gfmName || '').trim();
    if (!gfmName) return null;

    const entry: TimetableEntry = {
      id: crypto.randomUUID(),
      day: normalizeDay(String(row[idx.day] || '')),
      time: String(row[idx.time] || ''),
      subject: String(row[idx.subject] || ''),
      faculty: String(row[idx.faculty] || ''),
      room: String(row[idx.room] || ''),
      class: String(row[idx.class] || context?.class || 'N/A'),
      division: String(row[idx.div] || context?.division || 'N/A'),
      semester: String(row[idx.sem] || context?.semester || 'N/A'),
      gfmName: gfmName,
    };
    return entry;
  }).filter((t): t is TimetableEntry => !!t && !!t.subject && !t.subject.toLowerCase().includes('subject'));
}

function normalizeDay(day: string): string {
  const d = day.toLowerCase().trim();
  if (d.startsWith('mon')) return 'Monday';
  if (d.startsWith('tue')) return 'Tuesday';
  if (d.startsWith('wed')) return 'Wednesday';
  if (d.startsWith('thu')) return 'Thursday';
  if (d.startsWith('fri')) return 'Friday';
  if (d.startsWith('sat')) return 'Saturday';
  if (d.startsWith('sun')) return 'Sunday';
  return day;
}

function parseFaculty(data: any[][], context: WorkbookContext | null): FacultyMapping[] {
  const headerRow = findHeaderRow(data, ['faculty', 'subject', 'role']);
  if (headerRow === -1 || !data[headerRow]) return [];
  
  const headers = data[headerRow].map(h => String(h || '').toLowerCase().trim());
  const rows = data.slice(headerRow + 1);

  const idx = {
    name: getHeaderIndex(headers, ['faculty', 'instructor']),
    subject: getHeaderIndex(headers, ['subject']),
    code: getHeaderIndex(headers, ['code']),
    class: getHeaderIndex(headers, ['class']),
    div: getHeaderIndex(headers, ['division', 'div']),
    sem: getHeaderIndex(headers, ['semester', 'sem']),
    role: getHeaderIndex(headers, ['role']),
    gfm: getHeaderIndex(headers, ['gfm']),
    lecture: getHeaderIndex(headers, ['lecture', 'theory']),
    practical: getHeaderIndex(headers, ['practical', 'lab']),
  };

  return rows.flatMap(row => {
    const gfmName = String(row[idx.gfm] || context?.gfmName || '').trim();
    if (!gfmName) return [];

    const rawFaculty = String(row[idx.name] || '').trim();
    if (!rawFaculty || rawFaculty.toLowerCase().includes('total') || rawFaculty.toLowerCase().includes('faculty')) return [];

    // Split by slash to handle multiple instructors for the same subject
    const instructors = rawFaculty.split('/').map(i => i.trim()).filter(Boolean);

    // Determine subject type (Theory/Lab)
    const types: string[] = [];
    if (row[idx.lecture] && String(row[idx.lecture]).trim()) types.push('Theory');
    if (row[idx.practical] && String(row[idx.practical]).trim()) types.push('Lab');
    const subjectType = types.length > 0 ? types.join(' & ') : 'N/A';

    return instructors.map(instructor => {
      let facultyName = instructor;
      let subjectName = String(row[idx.subject] || '');
      
      // Check for elective pattern: "Faculty Name (Subject Name)"
      const electiveMatch = instructor.match(/^(.+?)\s*\((.+?)\)$/);
      if (electiveMatch) {
        const potentialFaculty = electiveMatch[1].trim();
        const potentialElective = electiveMatch[2].trim();
        
        // Only treat as elective if the parentheses content is short (likely a subject code)
        // and doesn't look like a title or degree
        if (potentialElective.length < 15 && !potentialElective.toLowerCase().includes('prof')) {
          facultyName = potentialFaculty;
          subjectName = `${subjectName} (${potentialElective})`;
        }
      }

      return {
        facultyName,
        subjectName,
        subjectCode: String(row[idx.code] || ''),
        class: String(row[idx.class] || context?.class || ''),
        division: String(row[idx.div] || context?.division || ''),
        semester: String(row[idx.sem] || context?.semester || ''),
        role: String(row[idx.role] || ''),
        type: subjectType,
        gfmName: gfmName,
      };
    });
  });
}

function extractGFMContexts(appData: AppData, globalContext: WorkbookContext | null): GFMContext[] {
  const contexts: Map<string, GFMContext> = new Map();

  // If global context exists, add it first
  if (globalContext) {
    const key = `${globalContext.gfmName}-${globalContext.class}-${globalContext.division}-${globalContext.semester}`;
    contexts.set(key, globalContext);
  }

  // Also extract from all data to support multi-GFM workbooks
  const allData = [
    ...appData.students,
    ...appData.timetable,
    ...appData.subjects,
    ...appData.faculty,
    ...appData.mentorMentees,
    ...appData.feeRecords,
    ...appData.vacRecords,
    ...appData.moocRecords,
    ...appData.internships,
    ...appData.hackathons
  ];

  allData.forEach(item => {
    if (item.gfmName) {
      const className = (item as any).class || 'N/A';
      const division = (item as any).division || 'N/A';
      const semester = (item as any).semester || 'N/A';
      
      const key = `${item.gfmName}-${className}-${division}-${semester}`;
      if (!contexts.has(key)) {
        contexts.set(key, {
          gfmName: item.gfmName,
          academicYear: (item as any).academicYear || globalContext?.academicYear || 'N/A',
          semester: semester,
          class: className,
          division: division,
        });
      }
    }
  });

  return Array.from(contexts.values());
}

function parseSocialProfiles(data: any[][], type: 'github' | 'linkedin', profileMap: Map<string, string>) {
  const headerRow = findHeaderRow(data, ['roll', 'prn', 'name', 'url', 'link', 'profile', type]);
  if (headerRow === -1 || !data[headerRow]) return;
  
  const headers = data[headerRow].map(h => String(h || '').toLowerCase().trim());
  const rows = data.slice(headerRow + 1);

  const idx = {
    roll: getHeaderIndex(headers, ['roll']),
    url: getHeaderIndex(headers, ['url', 'link', 'profile', type]),
  };

  if (idx.roll === -1 || idx.url === -1) return;

  rows.forEach(row => {
    const rollNo = String(row[idx.roll] || '').trim();
    const url = String(row[idx.url] || '').trim();
    if (rollNo && url && url.toLowerCase() !== 'na' && url.toLowerCase() !== 'n/a' && url !== '-') {
      profileMap.set(rollNo, url);
    }
  });
}
