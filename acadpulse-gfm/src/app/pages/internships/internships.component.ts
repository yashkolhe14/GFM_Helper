import { Component, inject, computed, signal } from '@angular/core';
import { DataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-internships',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-white">Internship Details</h1>
          <p class="text-text-tertiary mt-1 text-sm">Track student industry exposure and professional experience.</p>
        </div>
      </div>

      <!-- Premium Metric Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="glass-panel p-5 border-l-4 border-l-accent-primary relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary">
              <mat-icon>business</mat-icon>
            </div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-accent-primary bg-accent-primary/10 px-2 py-1 rounded-full">Active</span>
          </div>
          <div class="space-y-1">
            <h3 class="text-text-tertiary text-xs font-semibold uppercase tracking-wider">Total Interns</h3>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold text-white">{{stats().total}}</span>
              <span class="text-xs text-text-tertiary">students</span>
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <mat-icon class="text-7xl">business</mat-icon>
          </div>
        </div>

        <div class="glass-panel p-5 border-l-4 border-l-secondary-blue relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-xl bg-secondary-blue/10 flex items-center justify-center text-secondary-blue">
              <mat-icon>apartment</mat-icon>
            </div>
          </div>
          <div class="space-y-1">
            <h3 class="text-text-tertiary text-xs font-semibold uppercase tracking-wider">Companies</h3>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold text-white">{{stats().companies}}</span>
              <span class="text-xs text-secondary-blue">partners</span>
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <mat-icon class="text-7xl">apartment</mat-icon>
          </div>
        </div>

        <div class="glass-panel p-5 border-l-4 border-l-secondary-green relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-xl bg-secondary-green/10 flex items-center justify-center text-secondary-green">
              <mat-icon>assignment_turned_in</mat-icon>
            </div>
          </div>
          <div class="space-y-1">
            <h3 class="text-text-tertiary text-xs font-semibold uppercase tracking-wider">Placement Rate</h3>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold text-white">{{stats().rate}}%</span>
              <span class="text-xs text-secondary-green">of class</span>
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <mat-icon class="text-7xl">assignment_turned_in</mat-icon>
          </div>
        </div>

        <div class="glass-panel p-5 border-l-4 border-l-purple-500 relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <mat-icon>schedule</mat-icon>
            </div>
          </div>
          <div class="space-y-1">
            <h3 class="text-text-tertiary text-xs font-semibold uppercase tracking-wider">Avg Duration</h3>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold text-white">4.2</span>
              <span class="text-xs text-purple-500">months</span>
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <mat-icon class="text-7xl">schedule</mat-icon>
          </div>
        </div>
      </div>
      
      <div class="glass-panel overflow-hidden">
        <div class="p-6 border-b border-border-default flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 class="text-lg font-semibold text-white">Enrolled Students</h2>
          <div class="flex flex-wrap items-center gap-3">
            <select [ngModel]="filterCompany()" (ngModelChange)="filterCompany.set($event)" class="bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-primary/50 transition-colors appearance-none min-w-[150px]">
              <option value="">All Companies</option>
              @for (company of dataService.uniqueInternships(); track company) {
                <option [value]="company">{{company}}</option>
              }
            </select>
            <div class="relative group">
              <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-accent-primary transition-colors">search</mat-icon>
              <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="Search..." class="bg-bg-elevated border border-border-default rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-accent-primary/50 transition-all w-48">
            </div>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-white/5">
                <th class="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Roll No</th>
                <th class="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Name</th>
                <th class="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Gender</th>
                <th class="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Internship</th>
                <th class="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Duration</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-default">
              @for (student of filteredStudents(); track student.id) {
                <tr class="hover:bg-white/5 transition-colors">
                  <td class="p-4 text-sm font-mono text-text-tertiary">{{student.rollNo}}</td>
                  <td class="p-4">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary text-xs font-bold border border-accent-primary/20">
                        {{student.name.charAt(0)}}
                      </div>
                      <span class="text-sm font-medium text-white">{{student.name}}</span>
                    </div>
                  </td>
                  <td class="p-4">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" 
                          [ngClass]="student.gender === 'Female' ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20' : 'bg-secondary-blue/10 text-secondary-blue border border-secondary-blue/20'">
                      {{student.gender}}
                    </span>
                  </td>
                  <td class="p-4">
                    <div class="flex items-center gap-2">
                      <mat-icon class="text-accent-primary text-[18px] w-[18px] h-[18px]">business</mat-icon>
                      <span class="text-sm text-text-secondary">{{student.internship || '-'}}</span>
                    </div>
                  </td>
                  <td class="p-4">
                    <div class="flex items-center gap-2">
                      <mat-icon class="text-text-tertiary text-[18px] w-[18px] h-[18px]">schedule</mat-icon>
                      <span class="text-sm text-text-tertiary">{{student.internshipDuration || '-'}}</span>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class InternshipsComponent {
  dataService = inject(DataService);
  searchQuery = signal('');
  filterCompany = signal('');

  stats = computed(() => {
    const students = this.dataService.students();
    const interns = students.filter(s => s.internship && s.internship !== 'Pending' && s.internship !== 'None');
    const total = interns.length;
    const companies = new Set(interns.map(i => i.internship)).size;
    const rate = Math.round((total / students.length) * 100);

    return { total, companies, rate };
  });

  filteredStudents = computed(() => {
    const students = this.dataService.students();
    const q = this.searchQuery().toLowerCase();
    const company = this.filterCompany();

    return students.filter(s => 
      s.internship && s.internship !== 'Pending' && s.internship !== 'None'
    ).filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(q) || s.rollNo.includes(q);
      const matchesCompany = !company || s.internship === company;
      return matchesSearch && matchesCompany;
    });
  });
}
