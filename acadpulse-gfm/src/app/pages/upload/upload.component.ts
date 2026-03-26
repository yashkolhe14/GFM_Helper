import { Component, signal, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService, Student, MentorGroup } from '../../services/data.service';
import * as Papa from 'papaparse';
import { read, utils } from 'xlsx';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [MatIconModule, CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6 pb-12">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight mb-1">Upload Academic Files</h1>
          <p class="text-text-secondary">Import PDF, CSV, and Excel files and map them to the GFM dashboard</p>
        </div>
      </div>

      @if (step() === 1) {
        <!-- Upload Area -->
        <div class="glass-panel p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-border-default hover:border-accent-primary/50 transition-colors cursor-pointer"
             (dragover)="onDragOver($event)" 
             (dragleave)="onDragLeave($event)" 
             (drop)="onDrop($event)"
             [class.border-accent-primary]="isDragging()">
          
          <div class="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 text-accent-primary">
            <mat-icon class="text-4xl w-10 h-10 flex items-center justify-center">cloud_upload</mat-icon>
          </div>
          
          <h3 class="text-xl font-bold text-white mb-2">Drag & Drop files here</h3>
          <p class="text-text-secondary mb-6 max-w-md">Upload Roll Call, Fee Details, Timetable, Mentor-Mentee, VAC, MOOC, or Internship files.</p>
          
          <div class="flex gap-4 mb-8">
            <span class="px-3 py-1 rounded-full bg-white/5 text-xs font-mono text-text-secondary border border-white/10">.PDF</span>
            <span class="px-3 py-1 rounded-full bg-white/5 text-xs font-mono text-text-secondary border border-white/10">.CSV</span>
            <span class="px-3 py-1 rounded-full bg-white/5 text-xs font-mono text-text-secondary border border-white/10">.XLSX</span>
          </div>
          
          <button class="btn-primary" (click)="fileInput.click()">
            Browse Files
          </button>
          <input type="file" #fileInput class="hidden" multiple accept=".pdf,.csv,.xls,.xlsx" (change)="onFileSelected($event)">
        </div>

        <!-- Uploaded Files List -->
        @if (uploadedFiles().length > 0) {
          <div class="space-y-4 mt-8">
            <h3 class="font-semibold text-lg">Files Ready for Processing</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (file of uploadedFiles(); track file.name) {
                <div class="glass-card p-4 flex items-center gap-4">
                  <div class="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-text-secondary shrink-0">
                    <mat-icon>{{getFileIcon(file.name)}}</mat-icon>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-white truncate">{{file.name}}</div>
                    <div class="text-xs text-text-tertiary">{{(file.size / 1024).toFixed(1)}} KB</div>
                  </div>
                  <button class="text-text-tertiary hover:text-danger transition-colors" (click)="removeFile(file)">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              }
            </div>
            <div class="flex justify-end mt-6">
              <button class="btn-primary" (click)="startMapping()">
                Continue to Data Mapping <mat-icon class="text-[18px] w-[18px] h-[18px]">arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        }
      }

      @if (step() === 2) {
        <!-- Data Mapping Screen -->
        <div class="flex flex-col h-[calc(100vh-200px)]">
          <div class="flex justify-between items-center mb-6 shrink-0">
            <div>
              <h2 class="text-xl font-bold">Data Mapping</h2>
              <p class="text-sm text-text-secondary">Map columns from <span class="text-white font-mono">{{uploadedFiles()[0]?.name}}</span> to system fields</p>
            </div>
            <div class="flex gap-3">
              <button class="btn-secondary" (click)="step.set(1)">Back</button>
              <button class="btn-primary" (click)="confirmImport()">Confirm Import</button>
            </div>
          </div>

          <!-- App Details Bar -->
          <div class="bg-bg-surface border border-border-default rounded-xl p-4 mb-6 shrink-0 flex flex-wrap items-center gap-6">
            <div class="flex items-center gap-2">
              <mat-icon class="text-accent-primary text-[18px] w-[18px] h-[18px]">school</mat-icon>
              <span class="text-sm text-text-secondary">Academic Year:</span>
              <span class="text-sm font-bold text-white">{{dataService.currentUser().academicYear || 'Not Detected'}}</span>
            </div>
            <div class="flex items-center gap-2">
              <mat-icon class="text-accent-primary text-[18px] w-[18px] h-[18px]">calendar_today</mat-icon>
              <span class="text-sm text-text-secondary">Semester:</span>
              <span class="text-sm font-bold text-white">{{dataService.currentUser().semester || 'Not Detected'}}</span>
            </div>
            <div class="flex items-center gap-2">
              <mat-icon class="text-accent-primary text-[18px] w-[18px] h-[18px]">class</mat-icon>
              <span class="text-sm text-text-secondary">Division:</span>
              <span class="text-sm font-bold text-white">{{dataService.currentUser().division || 'Not Detected'}}</span>
            </div>
          </div>

          <div class="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
            <!-- Left: Detected Columns -->
            <div class="w-full lg:w-1/2 glass-panel flex flex-col min-h-0">
              <div class="p-4 border-b border-border-default bg-white/5 shrink-0">
                <h3 class="font-semibold">Detected Columns (File)</h3>
              </div>
              <div class="flex-1 overflow-y-auto p-4 space-y-3">
                @for (col of detectedColumns(); track col.name) {
                  <div class="p-3 rounded-lg border border-border-default bg-bg-surface flex justify-between items-center">
                    <span class="font-mono text-sm text-white">{{col.name}}</span>
                    <span class="text-xs text-text-tertiary">Sample: {{col.sample}}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Right: System Fields -->
            <div class="w-full lg:w-1/2 glass-panel flex flex-col min-h-0">
              <div class="p-4 border-b border-border-default bg-white/5 shrink-0">
                <h3 class="font-semibold">System Fields (Target)</h3>
              </div>
              <div class="flex-1 overflow-y-auto p-4 space-y-3">
                @for (field of systemFields; track field.id) {
                  <div class="p-3 rounded-lg border border-border-default bg-bg-surface flex items-center gap-4">
                    <div class="w-1/3">
                      <span class="text-sm font-medium text-white">{{field.label}}</span>
                      @if (field.required) {
                        <span class="text-danger ml-1">*</span>
                      }
                    </div>
                    <div class="flex-1">
                      <select 
                        class="w-full bg-bg-elevated border border-border-default rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent-primary/50"
                        [ngModel]="fieldMappings()[field.id] || ''"
                        (ngModelChange)="updateMapping(field.id, $event)"
                      >
                        <option value="">-- Select Column --</option>
                        @for (col of detectedColumns(); track col.name) {
                          <option [value]="col.name">{{col.name}}</option>
                        }
                      </select>
                    </div>
                    <div class="w-8 flex justify-end">
                      @if (fieldMappings()[field.id]) {
                        <mat-icon class="text-success text-[18px] w-[18px] h-[18px]" title="Mapped">check_circle</mat-icon>
                      } @else if (field.required) {
                        <mat-icon class="text-warning text-[18px] w-[18px] h-[18px]" title="Required">error_outline</mat-icon>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      @if (step() === 3) {
        <!-- Success Screen -->
        <div class="glass-panel p-12 flex flex-col items-center justify-center text-center">
          <div class="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6 text-success">
            <mat-icon class="text-4xl w-10 h-10 flex items-center justify-center">check_circle</mat-icon>
          </div>
          <h2 class="text-2xl font-bold text-white mb-2">Import Successful</h2>
          <p class="text-text-secondary mb-8">Data has been successfully mapped and merged into the student records.</p>
          
          <div class="grid grid-cols-3 gap-4 mb-8 w-full max-w-md">
            <div class="bg-bg-surface rounded-xl p-4 border border-border-default">
              <div class="text-2xl font-bold text-white mb-1">{{importStats().updated}}</div>
              <div class="text-xs text-text-tertiary uppercase">Records Updated</div>
            </div>
            <div class="bg-bg-surface rounded-xl p-4 border border-border-default">
              <div class="text-2xl font-bold text-white mb-1">{{importStats().new}}</div>
              <div class="text-xs text-text-tertiary uppercase">New Students</div>
            </div>
            <div class="bg-bg-surface rounded-xl p-4 border border-border-default">
              <div class="text-2xl font-bold text-warning mb-1">{{importStats().conflicts}}</div>
              <div class="text-xs text-text-tertiary uppercase">Conflicts</div>
            </div>
          </div>
          
          <div class="flex gap-4">
            <button class="btn-secondary" (click)="step.set(1); uploadedFiles.set([])">Upload Another</button>
            <button class="btn-primary" routerLink="/app/students">View Students</button>
          </div>
        </div>
      }
    </div>
  `
})
export class UploadComponent {
  dataService = inject(DataService);
  step = signal(1);
  isDragging = signal(false);
  uploadedFiles = signal<File[]>([]);

  parsedData: Record<string, string | number>[] = [];
  detectedColumns = signal<{name: string, sample: string}[]>([]);
  fieldMappings = signal<Record<string, string>>({});
  importStats = signal({ updated: 0, new: 0, conflicts: 0 });

  systemFields = [
    { id: 'rollNo', label: 'Roll No', required: true },
    { id: 'prn', label: 'PRN', required: true },
    { id: 'name', label: 'Student Name', required: true },
    { id: 'gender', label: 'Gender', required: false },
    { id: 'mobile', label: 'Mobile', required: false },
    { id: 'email', label: 'Email', required: false },
    { id: 'division', label: 'Division', required: false },
    { id: 'feePaid', label: 'Fee Paid', required: false },
    { id: 'feeBalance', label: 'Fee Balance', required: false },
    { id: 'vac', label: 'VAC Status', required: false },
    { id: 'mooc1', label: 'MOOC 1', required: false },
    { id: 'mooc1Duration', label: 'MOOC 1 Duration', required: false },
    { id: 'mooc2', label: 'MOOC 2', required: false },
    { id: 'mooc2Duration', label: 'MOOC 2 Duration', required: false },
    { id: 'internship', label: 'Internship', required: false },
    { id: 'internshipDuration', label: 'Internship Duration', required: false },
    { id: 'hackathon', label: 'Hackathon', required: false },
    { id: 'hackathonDate', label: 'Hackathon Date', required: false },
    { id: 'teamMember1Name', label: 'Team Member 1 Name', required: false },
    { id: 'teamMember1RollNo', label: 'Team Member 1 Roll No', required: false },
    { id: 'teamMember2Name', label: 'Team Member 2 Name', required: false },
    { id: 'teamMember2RollNo', label: 'Team Member 2 Roll No', required: false },
    { id: 'teamMember3Name', label: 'Team Member 3 Name', required: false },
    { id: 'teamMember3RollNo', label: 'Team Member 3 Roll No', required: false },
    { id: 'teamMember4Name', label: 'Team Member 4 Name', required: false },
    { id: 'teamMember4RollNo', label: 'Team Member 4 Roll No', required: false },
    { id: 'teamMember5Name', label: 'Team Member 5 Name', required: false },
    { id: 'teamMember5RollNo', label: 'Team Member 5 Roll No', required: false },
    { id: 'teamMember6Name', label: 'Team Member 6 Name', required: false },
    { id: 'teamMember6RollNo', label: 'Team Member 6 Roll No', required: false },
    { id: 'hackathonCertificate', label: 'Hackathon Certificate', required: false },
    { id: 'hackathonMilestone', label: 'Hackathon Milestone', required: false },
    { id: 'hackathonMentor', label: 'Hackathon Mentor', required: false },
    { id: 'github', label: 'GitHub', required: false },
    { id: 'linkedin', label: 'LinkedIn', required: false },
  ];

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
    }
  }

  handleFiles(files: File[]) {
    this.uploadedFiles.update(current => [...current, ...files]);
  }

  removeFile(file: File) {
    this.uploadedFiles.update(current => current.filter(f => f !== file));
  }

  getFileIcon(filename: string): string {
    if (filename.endsWith('.pdf')) return 'picture_as_pdf';
    if (filename.endsWith('.csv')) return 'description';
    if (filename.endsWith('.xls') || filename.endsWith('.xlsx')) return 'table_chart';
    return 'insert_drive_file';
  }

  startMapping() {
    const file = this.uploadedFiles()[0];
    if (!file) return;

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: false, // Parse as array of arrays first to find the header
        skipEmptyLines: true,
        complete: (results) => {
          this.processRawData(results.data as (string | number)[][]);
        }
      });
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        
        const allHeaders = new Set<string>();
        const allParsedData: Record<string, string | number>[] = [];
        
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const rawRows = utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as (string | number)[][];
          
          if (rawRows.length > 0) {
            const result = this.parseRawRows(rawRows);
            if (result) {
              result.headers.forEach(h => allHeaders.add(h));
              allParsedData.push(...result.data);
            }
          }
        });
        
        if (allParsedData.length > 0) {
          this.processParsedData(allParsedData, Array.from(allHeaders));
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('Only CSV and Excel files are supported for data extraction currently.');
    }
  }

  processRawData(rawRows: (string | number)[][]) {
    const result = this.parseRawRows(rawRows);
    if (result) {
      this.processParsedData(result.data, result.headers);
    }
  }

  parseRawRows(rawRows: (string | number)[][]): { headers: string[], data: Record<string, string | number>[] } | null {
    // 1. Find the header row
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
      const row = rawRows[i];
      if (!Array.isArray(row)) continue;
      
      const stringValues = row.map(c => String(c || '').toLowerCase().trim());
      const validCols = stringValues.filter(Boolean).length;
      
      const hasIdentityCol = stringValues.some(c => {
        const match = ['roll', 'prn', 'name', 'student'].some(k => c.includes(k));
        const notHackathon = !c.includes('hackathon') && !c.includes('company') && !c.includes('course') && !c.includes('vac');
        return match && notHackathon;
      });

      if (validCols >= 2 && hasIdentityCol) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      return null;
    }

    // 2. Extract headers and data
    const rawHeaders = rawRows[headerRowIndex] as string[];
    const headers: string[] = [];
    const headerMap: Record<string, number> = {}; 
    
    rawHeaders.forEach((h, i) => {
      let headerName = String(h || '').trim();
      if (!headerName) headerName = `Column_${i+1}`;
      
      let uniqueName = headerName;
      let counter = 1;
      while (headerMap[uniqueName] !== undefined) {
        uniqueName = `${headerName}_${counter}`;
        counter++;
      }
      headerMap[uniqueName] = i;
      headers.push(uniqueName);
    });

    const dataRows = rawRows.slice(headerRowIndex + 1).filter(row => {
      return Array.isArray(row) && row.some(cell => String(cell || '').trim() !== '');
    });

    // 3. Convert to array of objects
    const data = dataRows.map(row => {
      const obj: Record<string, string | number> = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] as string | number;
      });
      return obj;
    });

    // 4. Extract app details from rows before the header
    if (headerRowIndex > 0) {
      const metaRows = rawRows.slice(0, headerRowIndex);
      this.extractAppDetailsFromMeta(metaRows);
    }

    return { headers, data };
  }

  extractAppDetailsFromMeta(metaRows: (string | number)[][]) {
    const currentUser = this.dataService.currentUser();
    let updated = false;

    metaRows.forEach(row => {
      if (!Array.isArray(row)) return;
      const rowText = row.map(c => String(c || '')).join(' ');
      
      const ayMatch = rowText.match(/A[. \s]?Y[. \s]?\s*(\d{4}[-–]\d{2,4})/i);
      if (ayMatch) { currentUser.academicYear = ayMatch[1]; updated = true; }
      
      const semMatch = rowText.match(/SEM(?:ESTER)?\s+([IVX\d]+)/i);
      if (semMatch) { currentUser.semester = 'SEM ' + semMatch[1]; updated = true; }
      
      const divMatch = rowText.match(/DIV(?:ISION)?[\s-]+([A-Z-]+)/i);
      if (divMatch) { currentUser.division = divMatch[1]; updated = true; }
      
      // Look for GFM or Faculty
      const gfmMatch = rowText.match(/(?:GFM|Faculty Incharge)[:\s]+([A-Za-z\s.]+)/i) || rowText.match(/(Dr\.|Prof\.)\s*([A-Za-z\s]+)/);
      if (gfmMatch && rowText.toLowerCase().includes('gfm')) {
         console.log("Detected GFM:", gfmMatch[0]);
      }
    });

    if (updated) {
      this.dataService.currentUser.set({ ...currentUser });
    }
  }

  processParsedData(data: Record<string, string | number>[], headers: string[]) {
    this.parsedData = data;
    const columns = headers.map(h => ({
      name: h,
      sample: data[0] && data[0][h] ? String(data[0][h]).substring(0, 30) : ''
    }));
    this.detectedColumns.set(columns);

    const initialMappings: Record<string, string> = {};
    const FIELD_KEYWORDS: Record<string, string[]> = {
      rollNo: ['roll no', 'roll no.', 'rollno', 'roll', 'sr no', 'sr.no', 'sno', 'sl no'],
      prn: ['prn', 'prn no', 'prn no.', 'enrollment', 'enrollment no', 'student id'],
      name: ['name of the student', 'name of student', 'student name', "student's name", 'name', 'full name'],
      gender: ['gender', 'm/f', 'sex'],
      mobile: ['mobile', 'mobile number', 'phone', 'contact', 'mobile no', 'phone number'],
      email: ['email', 'email id', 'email address', 'mail'],
      division: ['div', 'division', 'class div', 'section'],
      feePaid: ['actual fee paid', 'fee paid', 'fees paid', 'amount paid'],
      feeBalance: ['balance fee', 'fee balance', 'balance', 'pending fee'],
      vac: ['name of vac', 'vac', 'value added course', 'vac name'],
      mooc1: ['name of the course-1', 'course 1', 'mooc 1', 'mooc1', 'course-1', 'mooc'],
      mooc1Duration: ['duration-1', 'mooc 1 duration', 'mooc1 duration', 'course 1 duration'],
      mooc2: ['name of the course-2', 'course 2', 'mooc 2', 'mooc2', 'course-2'],
      mooc2Duration: ['duration-2', 'mooc 2 duration', 'mooc2 duration', 'course 2 duration'],
      internship: ['name of company', 'company', 'internship', 'organization'],
      internshipDuration: ['duration', 'internship duration', 'duration (please mention dates)'],
      hackathon: ['name of hackthon', 'name of hackathon', 'hackathon', 'competition'],
      hackathonDate: ['date', 'hackathon date'],
      teamMember1Name: ['team member 1 name', 'member 1 name', 'member 1'],
      teamMember1RollNo: ['team member 1 roll', 'member 1 roll'],
      teamMember2Name: ['team member 2 name', 'member 2 name', 'member 2'],
      teamMember2RollNo: ['team member 2 roll', 'member 2 roll'],
      teamMember3Name: ['team member 3 name', 'member 3 name', 'member 3'],
      teamMember3RollNo: ['team member 3 roll', 'member 3 roll'],
      teamMember4Name: ['team member 4 name', 'member 4 name', 'member 4'],
      teamMember4RollNo: ['team member 4 roll', 'member 4 roll'],
      teamMember5Name: ['team member 5 name', 'member 5 name', 'member 5'],
      teamMember5RollNo: ['team member 5 roll', 'member 5 roll'],
      teamMember6Name: ['team member 6 name', 'member 6 name', 'member 6'],
      teamMember6RollNo: ['team member 6 roll', 'member 6 roll'],
      hackathonCertificate: ['certificate', 'hackathon certificate'],
      hackathonMilestone: ['milestone', 'hackathon milestone', 'achievement'],
      hackathonMentor: ['mentor', 'hackathon mentor'],
      github: ['github id', 'github', 'github url', 'git'],
      linkedin: ['linkedin url', 'linkedin', 'linkedin id'],
    };

    const usedHeaders = new Set<string>();

    // Priority mapping
    Object.entries(FIELD_KEYWORDS).forEach(([fieldId, keywords]) => {
      for (const h of headers) {
        if (usedHeaders.has(h)) continue;
        const lowerH = h.toLowerCase().trim();
        
        if (fieldId === 'name') {
          if (keywords.some(k => lowerH === k || (lowerH.includes(k) && !lowerH.includes('hackathon') && !lowerH.includes('company') && !lowerH.includes('vac') && !lowerH.includes('course')))) {
            initialMappings[fieldId] = h;
            usedHeaders.add(h);
            break;
          }
        } else {
          if (keywords.some(k => lowerH === k || lowerH.includes(k) || k.includes(lowerH))) {
            initialMappings[fieldId] = h;
            usedHeaders.add(h);
            break;
          }
        }
      }
    });

    this.fieldMappings.set(initialMappings);
    this.step.set(2);
  }

  updateMapping(fieldId: string, columnName: string) {
    this.fieldMappings.update(m => ({ ...m, [fieldId]: columnName }));
  }

  confirmImport() {
    const mappings = this.fieldMappings();
    const mappedColumnNames = Object.values(mappings);
    const allColumnNames = this.detectedColumns().map(c => c.name);
    const unmappedColumnNames = allColumnNames.filter(name => !mappedColumnNames.includes(name));

    const rawStudents: Student[] = this.parsedData.map((row, index) => {
      const extraData: Record<string, string | number> = {};
      unmappedColumnNames.forEach(colName => {
        if (row[colName] !== undefined && row[colName] !== '') {
          extraData[colName] = row[colName];
        }
      });

      const cleanVal = (val: unknown, defaultVal: string) => {
        const s = String(val || '').trim();
        if (!s || s.toLowerCase() === 'na' || s.toLowerCase() === 'nan' || s === '-') return defaultVal;
        return s;
      };

      const rawGender = String(row[mappings['gender']] || '').trim().toLowerCase();
      let gender: 'Male' | 'Female' | 'Other' = 'Other';
      if (rawGender === 'm' || rawGender === 'male') gender = 'Male';
      else if (rawGender === 'f' || rawGender === 'female') gender = 'Female';

      return {
        id: `imported-${Date.now()}-${index}`,
        rollNo: String(row[mappings['rollNo']] || '').trim(),
        prn: String(row[mappings['prn']] || '').trim(),
        name: String(row[mappings['name']] || 'Unknown Student').trim(),
        gender: gender,
        mobile: String(row[mappings['mobile']] || '').trim(),
        email: String(row[mappings['email']] || '').trim(),
        division: String(row[mappings['division']] || 'A').trim(),
        feePaid: Number(row[mappings['feePaid']]) || 0,
        feeBalance: Number(row[mappings['feeBalance']]) || 0,
        vac: cleanVal(row[mappings['vac']], 'Pending'),
        mooc1: cleanVal(row[mappings['mooc1']], 'Pending'),
        mooc1Duration: cleanVal(row[mappings['mooc1Duration']], ''),
        mooc2: cleanVal(row[mappings['mooc2']], 'Pending'),
        mooc2Duration: cleanVal(row[mappings['mooc2Duration']], ''),
        internship: cleanVal(row[mappings['internship']], 'None'),
        internshipDuration: cleanVal(row[mappings['internshipDuration']], ''),
        hackathon: cleanVal(row[mappings['hackathon']], 'None'),
        hackathonDate: cleanVal(row[mappings['hackathonDate']], ''),
        teamMember1Name: cleanVal(row[mappings['teamMember1Name']], ''),
        teamMember1RollNo: cleanVal(row[mappings['teamMember1RollNo']], ''),
        teamMember2Name: cleanVal(row[mappings['teamMember2Name']], ''),
        teamMember2RollNo: cleanVal(row[mappings['teamMember2RollNo']], ''),
        teamMember3Name: cleanVal(row[mappings['teamMember3Name']], ''),
        teamMember3RollNo: cleanVal(row[mappings['teamMember3RollNo']], ''),
        teamMember4Name: cleanVal(row[mappings['teamMember4Name']], ''),
        teamMember4RollNo: cleanVal(row[mappings['teamMember4RollNo']], ''),
        teamMember5Name: cleanVal(row[mappings['teamMember5Name']], ''),
        teamMember5RollNo: cleanVal(row[mappings['teamMember5RollNo']], ''),
        teamMember6Name: cleanVal(row[mappings['teamMember6Name']], ''),
        teamMember6RollNo: cleanVal(row[mappings['teamMember6RollNo']], ''),
        hackathonCertificate: cleanVal(row[mappings['hackathonCertificate']], ''),
        hackathonMilestone: cleanVal(row[mappings['hackathonMilestone']], ''),
        hackathonMentor: cleanVal(row[mappings['hackathonMentor']], ''),
        github: cleanVal(row[mappings['github']], ''),
        linkedin: cleanVal(row[mappings['linkedin']], ''),
        mentorId: 'm1',
        extraData: Object.keys(extraData).length > 0 ? extraData : undefined
      } as Student;
    });

    const extractedMentors: MentorGroup[] = [];
    
    // Filter out rows that are likely mentor group definitions or invalid
    const validRawStudents = rawStudents.filter(s => {
      const rollStr = String(s.rollNo || '').toLowerCase();
      const isRange = rollStr.includes('to') || rollStr.includes('-');
      
      if (isRange && s.name === 'Unknown Student') {
        let mentorName = 'Unknown Mentor';
        if (s.extraData) {
          const mentorKey = Object.keys(s.extraData).find(k => 
            k.toLowerCase().includes('mentor') || 
            k.toLowerCase().includes('faculty') || 
            k.toLowerCase().includes('teacher') ||
            k.toLowerCase().includes('name')
          );
          if (mentorKey) {
            mentorName = String(s.extraData[mentorKey]);
          }
        }
        
        extractedMentors.push({
          id: `mentor-${Date.now()}-${Math.random()}`,
          name: mentorName,
          division: s.division || 'A',
          studentCount: 0,
          rollRange: s.rollNo
        });
        return false;
      }
      
      if (!s.rollNo && !s.prn && s.name === 'Unknown Student') {
        return false;
      }
      return true;
    });

    // Deduplicate and Merge
    const finalStudents: Student[] = [];
    validRawStudents.forEach(s => {
      // Find existing student by Roll No, PRN, or Name
      const existing = finalStudents.find(fs => 
        (s.rollNo && fs.rollNo === s.rollNo) || 
        (s.prn && fs.prn === s.prn) ||
        (s.name !== 'Unknown Student' && fs.name === s.name)
      );

      if (existing) {
        (Object.keys(s) as (keyof Student)[]).forEach(k => {
          const newVal = s[k];
          const oldVal = existing[k];
          
          // Don't overwrite with empty or default values
          const isNewValValid = newVal && 
                               newVal !== 'Pending' && 
                               newVal !== 'None' && 
                               newVal !== 'Other' && 
                               newVal !== '' && 
                               newVal !== 'Unknown Student';

          if (isNewValValid) {
            // Special case for name: don't overwrite a real name with something that looks like a hackathon (contains digits)
            if (k === 'name' && existing.name && existing.name !== 'Unknown Student') {
              const hasDigits = /\d/.test(String(newVal));
              if (hasDigits && !/\d/.test(existing.name)) {
                return; // Skip overwriting real name with something containing digits
              }
            }

            if (k === 'extraData' && newVal && typeof newVal === 'object') {
              existing.extraData = { ...(oldVal as Record<string, string | number> || {}), ...(newVal as Record<string, string | number>) };
            } else {
              (existing as unknown as Record<string, unknown>)[k] = newVal;
            }
          }
        });
      } else {
        finalStudents.push(s);
      }
    });

    // Update mentors in DataService
    if (extractedMentors.length > 0) {
      this.dataService.mentors.set(extractedMentors);
    }

    const currentMentors = this.dataService.mentors();

    // Assign students to mentors based on rollRange
    finalStudents.forEach(student => {
      const rollNum = parseInt(student.rollNo, 10);
      if (!isNaN(rollNum)) {
        const matchedMentor = currentMentors.find(m => {
          if (!m.rollRange) return false;
          const match = m.rollRange.match(/(\d+)\s*(?:to|-)\s*(\d+)/i);
          if (match) {
            const min = parseInt(match[1], 10);
            const max = parseInt(match[2], 10);
            return rollNum >= min && rollNum <= max;
          }
          return false;
        });
        
        if (matchedMentor) {
          student.mentorId = matchedMentor.id;
        }
      }
    });

    // Update student counts for mentors
    currentMentors.forEach(m => {
      m.studentCount = finalStudents.filter(s => s.mentorId === m.id).length;
    });
    this.dataService.mentors.set([...currentMentors]);

    // Attempt to extract app details from the first row if available
    if (this.parsedData.length > 0) {
      const firstRow = this.parsedData[0];
      const currentUser = this.dataService.currentUser();
      
      const possibleDeptKeys = Object.keys(firstRow).filter(k => k.toLowerCase().includes('dept') || k.toLowerCase().includes('department'));
      const possibleSemKeys = Object.keys(firstRow).filter(k => k.toLowerCase().includes('sem') || k.toLowerCase().includes('semester'));
      const possibleAyKeys = Object.keys(firstRow).filter(k => k.toLowerCase().includes('ay') || k.toLowerCase().includes('academic year'));
      
      if (possibleDeptKeys.length > 0 && firstRow[possibleDeptKeys[0]]) {
        currentUser.department = String(firstRow[possibleDeptKeys[0]]);
      }
      if (possibleSemKeys.length > 0 && firstRow[possibleSemKeys[0]]) {
        currentUser.semester = String(firstRow[possibleSemKeys[0]]);
      }
      if (possibleAyKeys.length > 0 && firstRow[possibleAyKeys[0]]) {
        currentUser.academicYear = String(firstRow[possibleAyKeys[0]]);
      }
      
      this.dataService.currentUser.set({ ...currentUser });
    }

    this.dataService.setStudents(finalStudents);
    this.importStats.set({
      updated: finalStudents.length,
      new: finalStudents.length,
      conflicts: 0
    });
    this.step.set(3);
  }
}
