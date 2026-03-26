import { Component, inject, computed, signal } from '@angular/core';
import { DataService, Student, MentorGroup } from '../../services/data.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Division {
  name: string;
  students: Student[];
  mentors: MentorGroup[];
  total: number;
  male: number;
  female: number;
  interns: number;
}

@Component({
  selector: 'app-divisions',
  standalone: true,
  imports: [MatIconModule, CommonModule, FormsModule],
  template: `
    <div class="space-y-8 pb-12">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight mb-1">Divisions</h1>
          <p class="text-text-secondary">Overview of class divisions and mentors</p>
        </div>
        <div class="relative w-full md:w-64">
          <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">search</mat-icon>
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search divisions..." class="w-full bg-bg-surface border border-border-default rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-accent-primary/50 transition-colors">
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (div of filteredDivisions(); track div.name) {
          <div class="glass-card overflow-hidden">
            <div class="p-5 border-b border-border-default">
              <h2 class="text-xl font-bold text-white mb-1">Division {{div.name}}</h2>
              <p class="text-sm text-text-secondary">CSE · SEM VI</p>
              
              <div class="flex gap-4 mt-4">
                <div class="text-center">
                  <div class="text-xl font-bold text-accent-primary">{{div.total}}</div>
                  <div class="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Total</div>
                </div>
                <div class="text-center">
                  <div class="text-xl font-bold text-secondary-blue">{{div.male}}</div>
                  <div class="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Male</div>
                </div>
                <div class="text-center">
                  <div class="text-xl font-bold text-pink-500">{{div.female}}</div>
                  <div class="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Female</div>
                </div>
                <div class="text-center">
                  <div class="text-xl font-bold text-success">{{div.interns}}</div>
                  <div class="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Interns</div>
                </div>
              </div>
            </div>
            
            <div class="p-4 border-b border-border-default">
              <div class="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Mentors</div>
              <div class="flex flex-wrap gap-2">
                @for (mentor of div.mentors; track mentor.id) {
                  <div class="bg-white/5 border border-border-default rounded-lg px-2 py-1 text-xs flex items-center gap-1">
                    <mat-icon class="text-[14px] w-[14px] h-[14px]">person</mat-icon>
                    {{mentor.name}}
                  </div>
                }
                @if (div.mentors.length === 0) {
                  <span class="text-xs text-text-tertiary">No mentors assigned</span>
                }
              </div>
            </div>
            
            <div class="p-4">
              <div class="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Students ({{div.students.length > 5 ? '5 of ' + div.students.length : div.students.length}})</div>
              <div class="space-y-1 max-h-32 overflow-y-auto">
                @for (student of div.students.slice(0, 5); track student.id) {
                  <div class="flex items-center gap-2 text-xs py-1">
                    <span class="font-mono text-text-tertiary w-6">{{student.rollNo}}</span>
                    <span class="flex-1 text-white truncate">{{student.name}}</span>
                    @if (student.gender) {
                      <span class="px-1.5 py-0.5 rounded-full text-[10px] font-medium" 
                            [class.bg-secondary-blue]="student.gender === 'Male'" [class.text-white]="student.gender === 'Male'"
                            [class.bg-pink-500]="student.gender === 'Female'" [class.text-white]="student.gender === 'Female'">
                        {{student.gender === 'Male' ? 'M' : 'F'}}
                      </span>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class DivisionsComponent {
  dataService = inject(DataService);
  searchQuery = signal('');

  divisions = computed(() => {
    const students = this.dataService.students();
    const mentors = this.dataService.mentors();
    
    const divsMap = new Map<string, Division>();
    
    students.forEach(s => {
      const divName = s.division || 'Unassigned';
      if (!divsMap.has(divName)) {
        divsMap.set(divName, {
          name: divName,
          students: [],
          mentors: mentors.filter(m => m.division === divName),
          total: 0,
          male: 0,
          female: 0,
          interns: 0
        });
      }
      const div = divsMap.get(divName)!;
      div.students.push(s);
      div.total++;
      if (s.gender === 'Male') div.male++;
      if (s.gender === 'Female') div.female++;
      if (s.internship && s.internship !== 'Pending' && s.internship !== 'None') div.interns++;
    });
    
    return Array.from(divsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  });

  filteredDivisions = computed(() => {
    const divs = this.divisions();
    const q = this.searchQuery().toLowerCase();
    if (!q) return divs;
    return divs.filter(d => d.name.toLowerCase().includes(q));
  });
}
