import { Component, inject, computed, signal } from '@angular/core';
import { DataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-linkedin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-white">LinkedIn Profiles</h1>
          <p class="text-text-tertiary mt-1 text-sm">Monitor student professional networking and profiles.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative group">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-accent-primary transition-colors">search</mat-icon>
            <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="Search students..." class="bg-bg-elevated border border-border-default rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-accent-primary/50 transition-all w-64">
          </div>
        </div>
      </div>

      <!-- Premium Metric Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="glass-panel p-5 border-l-4 border-l-secondary-blue relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-xl bg-secondary-blue/10 flex items-center justify-center text-secondary-blue">
              <mat-icon>work</mat-icon>
            </div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-secondary-blue bg-secondary-blue/10 px-2 py-1 rounded-full">Professional</span>
          </div>
          <div class="space-y-1">
            <h3 class="text-text-tertiary text-xs font-semibold uppercase tracking-wider">Total Profiles</h3>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold text-white">{{stats().total}}</span>
              <span class="text-xs text-text-tertiary">students</span>
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <mat-icon class="text-7xl">work</mat-icon>
          </div>
        </div>

        <div class="glass-panel p-5 border-l-4 border-l-accent-primary relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary">
              <mat-icon>verified</mat-icon>
            </div>
          </div>
          <div class="space-y-1">
            <h3 class="text-text-tertiary text-xs font-semibold uppercase tracking-wider">Profile Linked</h3>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold text-white">{{stats().linked}}</span>
              <span class="text-xs text-accent-primary">{{stats().linkedPercentage}}%</span>
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <mat-icon class="text-7xl">verified</mat-icon>
          </div>
        </div>

        <div class="glass-panel p-5 border-l-4 border-l-danger relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center text-danger">
              <mat-icon>person_off</mat-icon>
            </div>
          </div>
          <div class="space-y-1">
            <h3 class="text-text-tertiary text-xs font-semibold uppercase tracking-wider">Pending</h3>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold text-white">{{stats().pending}}</span>
              <span class="text-xs text-danger">{{stats().pendingPercentage}}%</span>
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <mat-icon class="text-7xl">person_off</mat-icon>
          </div>
        </div>

        <div class="glass-panel p-5 border-l-4 border-l-secondary-green relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-xl bg-secondary-green/10 flex items-center justify-center text-secondary-green">
              <mat-icon>stars</mat-icon>
            </div>
          </div>
          <div class="space-y-1">
            <h3 class="text-text-tertiary text-xs font-semibold uppercase tracking-wider">Job Readiness</h3>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold text-white">Good</span>
              <span class="text-xs text-secondary-green">+8% this week</span>
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <mat-icon class="text-7xl">stars</mat-icon>
          </div>
        </div>
      </div>

      <div class="glass-panel overflow-hidden">
        <div class="p-6 border-b border-border-default flex items-center justify-between">
          <h2 class="text-lg font-semibold text-white">Student LinkedIn Directory</h2>
          <span class="text-xs text-text-tertiary font-mono bg-white/5 px-2 py-1 rounded">Showing {{filteredStudents().length}} records</span>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-white/5">
                <th class="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Roll No</th>
                <th class="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Student Name</th>
                <th class="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">LinkedIn ID</th>
                <th class="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Status</th>
                <th class="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-default">
              @for (student of filteredStudents(); track student.id) {
                <tr class="hover:bg-white/5 transition-colors group">
                  <td class="p-4 text-sm font-mono text-text-tertiary">{{student.rollNo}}</td>
                  <td class="p-4">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-secondary-blue/10 flex items-center justify-center text-secondary-blue text-xs font-bold border border-secondary-blue/20">
                        {{student.name.charAt(0)}}
                      </div>
                      <span class="text-sm font-medium text-white">{{student.name}}</span>
                    </div>
                  </td>
                  <td class="p-4">
                    @if (student.linkedin) {
                      <div class="flex items-center gap-2 text-secondary-blue">
                        <mat-icon class="text-[18px] w-[18px] h-[18px]">link</mat-icon>
                        <span class="text-sm font-mono">{{student.linkedin}}</span>
                      </div>
                    } @else {
                      <span class="text-sm text-text-tertiary">Not provided</span>
                    }
                  </td>
                  <td class="p-4">
                    @if (student.linkedin) {
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary-green/10 text-secondary-green border border-secondary-green/20">
                        <span class="w-1.5 h-1.5 rounded-full bg-secondary-green animate-pulse"></span>
                        Linked
                      </span>
                    } @else {
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-danger/10 text-danger border border-danger/20">
                        Pending
                      </span>
                    }
                  </td>
                  <td class="p-4">
                    @if (student.linkedin) {
                      <a [href]="'https://linkedin.com/' + student.linkedin" target="_blank" class="w-8 h-8 rounded-lg bg-bg-elevated border border-border-default flex items-center justify-center text-text-secondary hover:text-secondary-blue hover:border-secondary-blue/50 transition-all">
                        <mat-icon class="text-[18px]">open_in_new</mat-icon>
                      </a>
                    } @else {
                      <button class="w-8 h-8 rounded-lg bg-bg-elevated border border-border-default flex items-center justify-center text-text-tertiary cursor-not-allowed">
                        <mat-icon class="text-[18px]">block</mat-icon>
                      </button>
                    }
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
export class LinkedinComponent {
  dataService = inject(DataService);
  searchQuery = signal('');

  stats = computed(() => {
    const students = this.dataService.students();
    const total = students.length;
    const linked = students.filter(s => s.linkedin && s.linkedin !== 'None').length;
    const pending = total - linked;
    
    return {
      total,
      linked,
      pending,
      linkedPercentage: total ? Math.round((linked / total) * 100) : 0,
      pendingPercentage: total ? Math.round((pending / total) * 100) : 0
    };
  });

  filteredStudents = computed(() => {
    const students = this.dataService.students();
    const q = this.searchQuery().toLowerCase();

    return students.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.rollNo.includes(q) || 
      (s.linkedin && s.linkedin.toLowerCase().includes(q))
    );
  });
}
