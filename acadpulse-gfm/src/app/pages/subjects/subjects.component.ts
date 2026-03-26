import { Component, inject, signal, computed, effect } from '@angular/core';
import { DataService, Student } from '../../services/data.service';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Subject {
  name: string;
  type: string;
  count: number;
  male: number;
  female: number;
  students: Student[];
  expanded: boolean;
}

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [MatIconModule, FormsModule, CommonModule],
  template: `
    <div class="space-y-8 pb-12">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight mb-1">Subjects & VAC</h1>
          <p class="text-text-secondary">Overview of subjects, VAC, and MOOCs</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <!-- Sidebar -->
        <div class="md:col-span-1 glass-panel overflow-hidden sticky top-24 max-h-[calc(100vh-120px)] flex flex-col">
          <div class="p-3 text-xs font-bold text-text-tertiary uppercase tracking-wider bg-white/5 border-b border-border-default flex items-center justify-between">
            Subjects
            <div class="flex gap-1">
              <select [(ngModel)]="sortOption" class="bg-bg-elevated text-[10px] rounded px-1">
                <option value="count">Count</option>
                <option value="name">Name</option>
                <option value="type">Type</option>
              </select>
              <select [(ngModel)]="filterType" class="bg-bg-elevated text-[10px] rounded px-1">
                <option value="All">All</option>
                <option value="Theory">Theory</option>
                <option value="Lab">Lab</option>
                <option value="Tutorial">Tutorial</option>
                <option value="VAC">VAC</option>
                <option value="MOOC">MOOC</option>
              </select>
            </div>
          </div>
          <div class="overflow-y-auto flex-1">
            @for (sub of subjects(); track sub.name) {
              <div class="flex flex-col cursor-pointer transition-colors border-l-2"
                   [class.bg-white/10]="activeSubject() === sub.name"
                   [class.border-accent-primary]="activeSubject() === sub.name"
                   [class.border-transparent]="activeSubject() !== sub.name"
                   (click)="activeSubject.set(sub.name)"
                   (keydown.enter)="activeSubject.set(sub.name)"
                   tabindex="0">
                <div class="flex items-center justify-between p-3 text-sm font-medium"
                     [class.text-accent-primary]="activeSubject() === sub.name"
                     [class.text-text-secondary]="activeSubject() !== sub.name">
                  <span class="truncate" [title]="sub.name">{{sub.name}}</span>
                  <span class="bg-bg-elevated border border-border-default rounded-full px-2 py-0.5 text-[10px] text-text-tertiary font-mono">
                    {{sub.count}}
                  </span>
                </div>
                @if (activeSubject() === sub.name) {
                  <div class="px-3 pb-3 text-xs text-text-tertiary animate-in fade-in duration-200">
                    Type: {{sub.type}}
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Main Content -->
        <div class="md:col-span-3">
          @if (activeSubjectData(); as data) {
            <div class="glass-panel p-6 mb-6">
              <h2 class="text-2xl font-bold text-white mb-2">{{data.name}}</h2>
              <p class="text-sm text-text-secondary mb-4">{{data.type}} · {{data.count}} Enrolled</p>
              
              <div class="flex gap-4">
                <div class="bg-white/5 border border-border-default rounded-xl p-3 text-center min-w-[80px]">
                  <div class="text-xl font-bold text-accent-primary">{{data.count}}</div>
                  <div class="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Enrolled</div>
                </div>
                <div class="bg-white/5 border border-border-default rounded-xl p-3 text-center min-w-[80px]">
                  <div class="text-xl font-bold text-secondary-blue">{{data.male}}</div>
                  <div class="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Male</div>
                </div>
                <div class="bg-white/5 border border-border-default rounded-xl p-3 text-center min-w-[80px]">
                  <div class="text-xl font-bold text-pink-500">{{data.female}}</div>
                  <div class="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Female</div>
                </div>
              </div>
            </div>

            <div class="glass-panel overflow-hidden">
              <div class="flex items-center justify-between p-4 border-b border-border-default">
                <h3 class="font-bold text-white">Enrolled Students ({{data.count}})</h3>
                <input type="text" [(ngModel)]="searchQuery" placeholder="Filter..." class="bg-bg-elevated border border-border-default rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent-primary/50 transition-colors w-48">
              </div>
              
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-white/5 border-b border-border-default">
                      <th class="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider cursor-pointer hover:text-white" (click)="sortBy('rollNo')">Roll No</th>
                      <th class="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider cursor-pointer hover:text-white" (click)="sortBy('name')">Name</th>
                      <th class="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider cursor-pointer hover:text-white" (click)="sortBy('gender')">Gender</th>
                      <th class="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider cursor-pointer hover:text-white" (click)="sortBy('division')">Division</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border-default">
                    @for (student of filteredStudents(); track student.id) {
                      <tr class="hover:bg-white/5 transition-colors">
                        <td class="p-3 text-sm font-mono text-text-tertiary">{{student.rollNo}}</td>
                        <td class="p-3 text-sm font-medium text-white">{{student.name}}</td>
                        <td class="p-3 text-sm">
                          @if (student.gender) {
                            <span class="px-2 py-1 rounded-full text-[10px] font-medium" 
                                  [class.bg-secondary-blue/20]="student.gender === 'Male'" [class.text-secondary-blue]="student.gender === 'Male'"
                                  [class.bg-pink-500/20]="student.gender === 'Female'" [class.text-pink-500]="student.gender === 'Female'">
                              {{student.gender === 'Male' ? 'M' : 'F'}}
                            </span>
                          } @else {
                            <span class="text-text-tertiary">-</span>
                          }
                        </td>
                        <td class="p-3 text-sm">
                          <span class="bg-bg-elevated border border-border-default rounded-md px-2 py-1 text-xs text-text-secondary">
                            {{student.division || '-'}}
                          </span>
                        </td>
                      </tr>
                    }
                    @if (filteredStudents().length === 0) {
                      <tr>
                        <td colspan="4" class="p-8 text-center text-text-secondary">No students found.</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          } @else {
            <div class="flex flex-col items-center justify-center h-64 text-text-secondary">
              <mat-icon class="text-4xl mb-4 opacity-50">auto_stories</mat-icon>
              <p>Select a subject to view details</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bar-fill {
      transition: width 0.8s ease;
    }
  `]
})
export class SubjectsComponent {
  dataService = inject(DataService);

  activeSubject = signal<string | null>(null);
  searchQuery = signal('');
  sortColumn = signal<string>('name');
  sortDirection = signal<number>(1);

  constructor() {
    effect(() => {
      const subs = this.subjects();
      if (subs.length > 0 && !this.activeSubject()) {
        this.activeSubject.set(subs[0].name);
      }
    });
  }

  sortOption = signal<'name' | 'count' | 'type'>('count');
  filterType = signal<string>('All');
  
  // ... (rest of the component) ...

  subjects = computed(() => {
    const students = this.dataService.students();
    const instructors = this.dataService.instructors();
    const subsMap = new Map<string, Subject>();

    const addSub = (name: string, type: string, student: Student) => {
      if (!name || name === 'Pending' || name === 'None') return;
      const key = `${type}:${name}`;
      if (!subsMap.has(key)) {
        // Try to find type from instructors
        const instructor = instructors.find(i => i.subject === name);
        subsMap.set(key, { name, type: instructor?.type || type, count: 0, male: 0, female: 0, students: [], expanded: false });
      }
      const sub = subsMap.get(key)!;
      sub.count++;
      if (student.gender === 'Male') sub.male++;
      if (student.gender === 'Female') sub.female++;
      sub.students.push(student);
    };

    students.forEach(s => {
      if (s.vac) addSub(s.vac, 'VAC', s);
      if (s.mooc1) addSub(s.mooc1, 'MOOC', s);
      if (s.mooc2) addSub(s.mooc2, 'MOOC', s);
    });

    let result = Array.from(subsMap.values());
    
    if (this.filterType() !== 'All') {
      result = result.filter(s => s.type === this.filterType());
    }

    return result.sort((a, b) => {
      const opt = this.sortOption();
      if (opt === 'name') return a.name.localeCompare(b.name);
      if (opt === 'type') return a.type.localeCompare(b.type);
      return b.count - a.count;
    });
  });

  activeSubjectData = computed(() => {
    const name = this.activeSubject();
    if (!name) return null;
    return this.subjects().find(s => s.name === name) || null;
  });

  filteredStudents = computed(() => {
    const data = this.activeSubjectData();
    if (!data) return [];
    
    let students = data.students;
    const q = this.searchQuery().toLowerCase();
    
    if (q) {
      students = students.filter((s: Student) => 
        s.name.toLowerCase().includes(q) || 
        s.rollNo.includes(q) || 
        (s.division && s.division.toLowerCase().includes(q))
      );
    }

    const col = this.sortColumn();
    const dir = this.sortDirection();

    return students.sort((a: Student, b: Student) => {
      const valA = a[col as keyof Student] || '';
      const valB = b[col as keyof Student] || '';
      if (col === 'rollNo') {
        const numA = parseInt(valA.toString());
        const numB = parseInt(valB.toString());
        if (!isNaN(numA) && !isNaN(numB)) {
          return (numA - numB) * dir;
        }
      }
      return valA.toString().localeCompare(valB.toString()) * dir;
    });
  });

  sortBy(col: string) {
    if (this.sortColumn() === col) {
      this.sortDirection.update(d => d * -1);
    } else {
      this.sortColumn.set(col);
      this.sortDirection.set(1);
    }
  }
}
