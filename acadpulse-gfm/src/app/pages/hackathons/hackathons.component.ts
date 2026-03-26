import { Component, inject, computed, signal } from '@angular/core';
import { DataService, Student } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-hackathons',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-white">Hackathon Details</h1>
          <p class="text-text-tertiary mt-1 text-sm">Track student participation in competitive coding and innovation events.</p>
        </div>
      </div>

      <!-- Premium Metric Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="glass-panel p-5 border-l-4 border-l-accent-primary relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary">
              <mat-icon>emoji_events</mat-icon>
            </div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-accent-primary bg-accent-primary/10 px-2 py-1 rounded-full">Active</span>
          </div>
          <div class="space-y-1">
            <h3 class="text-text-tertiary text-xs font-semibold uppercase tracking-wider">Total Participants</h3>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold text-white">{{stats().total}}</span>
              <span class="text-xs text-text-tertiary">students</span>
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <mat-icon class="text-7xl">emoji_events</mat-icon>
          </div>
        </div>

        <div class="glass-panel p-5 border-l-4 border-l-secondary-blue relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-xl bg-secondary-blue/10 flex items-center justify-center text-secondary-blue">
              <mat-icon>event</mat-icon>
            </div>
          </div>
          <div class="space-y-1">
            <h3 class="text-text-tertiary text-xs font-semibold uppercase tracking-wider">Unique Events</h3>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold text-white">{{stats().events}}</span>
              <span class="text-xs text-secondary-blue">competitions</span>
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <mat-icon class="text-7xl">event</mat-icon>
          </div>
        </div>

        <div class="glass-panel p-5 border-l-4 border-l-secondary-green relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-xl bg-secondary-green/10 flex items-center justify-center text-secondary-green">
              <mat-icon>military_tech</mat-icon>
            </div>
          </div>
          <div class="space-y-1">
            <h3 class="text-text-tertiary text-xs font-semibold uppercase tracking-wider">Winners</h3>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold text-white">{{stats().winners}}</span>
              <span class="text-xs text-secondary-green">podium finishes</span>
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <mat-icon class="text-7xl">military_tech</mat-icon>
          </div>
        </div>

        <div class="glass-panel p-5 border-l-4 border-l-purple-500 relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <mat-icon>groups</mat-icon>
            </div>
          </div>
          <div class="space-y-1">
            <h3 class="text-text-tertiary text-xs font-semibold uppercase tracking-wider">Mentors</h3>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold text-white">{{stats().mentors}}</span>
              <span class="text-xs text-purple-500">faculty guides</span>
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <mat-icon class="text-7xl">groups</mat-icon>
          </div>
        </div>
      </div>
      
      <div class="glass-panel overflow-hidden">
        <div class="p-6 border-b border-border-default flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 class="text-lg font-semibold text-white">Participation Directory</h2>
          <div class="flex flex-wrap items-center gap-3">
            <select [ngModel]="filterHackathon()" (ngModelChange)="filterHackathon.set($event)" class="bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-primary/50 transition-colors appearance-none min-w-[150px]">
              <option value="">All Hackathons</option>
              @for (hack of dataService.uniqueHackathons(); track hack) {
                <option [value]="hack">{{hack}}</option>
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
                <th class="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Hackathon</th>
                <th class="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Date</th>
                <th class="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Team Members</th>
                <th class="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Milestone</th>
                <th class="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Mentor</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-default">
              @for (student of filteredStudents(); track student.id) {
                <tr class="hover:bg-white/5 transition-colors group">
                  <td class="p-4 text-sm font-mono text-text-tertiary">{{student.rollNo}}</td>
                  <td class="p-4">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary text-xs font-bold border border-accent-primary/20">
                        {{student.name.charAt(0)}}
                      </div>
                      <span class="text-sm font-medium text-white">{{student.name}}</span>
                    </div>
                  </td>
                  <td class="p-4 text-sm text-text-secondary">{{student.hackathon || '-'}}</td>
                  <td class="p-4 text-sm text-text-tertiary font-mono">{{student.hackathonDate || '-'}}</td>
                  <td class="p-4">
                    <div class="max-w-[200px] truncate text-xs text-text-tertiary" [title]="getTeamMembers(student)">
                      {{getTeamMembers(student)}}
                    </div>
                  </td>
                  <td class="p-4">
                    @if (student.hackathonMilestone) {
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary-green/10 text-secondary-green border border-secondary-green/20">
                        {{student.hackathonMilestone}}
                      </span>
                    } @else {
                      <span class="text-sm text-text-tertiary">-</span>
                    }
                  </td>
                  <td class="p-4 text-sm text-text-secondary">{{student.hackathonMentor || '-'}}</td>
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
export class HackathonsComponent {
  dataService = inject(DataService);
  searchQuery = signal('');
  filterHackathon = signal('');

  stats = computed(() => {
    const students = this.dataService.students();
    const participants = students.filter(s => s.hackathon && s.hackathon !== 'Pending' && s.hackathon !== 'None');
    const total = participants.length;
    const events = new Set(participants.map(p => p.hackathon)).size;
    const winners = participants.filter(p => p.hackathonMilestone && (p.hackathonMilestone.toLowerCase().includes('winner') || p.hackathonMilestone.toLowerCase().includes('runner'))).length;
    const mentors = new Set(participants.map(p => p.hackathonMentor).filter(Boolean)).size;

    return { total, events, winners, mentors };
  });

  filteredStudents = computed(() => {
    const students = this.dataService.students();
    const q = this.searchQuery().toLowerCase();
    const hack = this.filterHackathon();

    return students.filter(s => 
      s.hackathon && s.hackathon !== 'Pending' && s.hackathon !== 'None'
    ).filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(q) || s.rollNo.includes(q);
      const matchesHack = !hack || s.hackathon === hack;
      return matchesSearch && matchesHack;
    });
  });

  getTeamMembers(student: Student): string {
    const members = [];
    const s = student as unknown as Record<string, unknown>;
    for (let i = 1; i <= 6; i++) {
      const name = s[`teamMember${i}Name`];
      const roll = s[`teamMember${i}RollNo`];
      if (name) {
        members.push(`${name}${roll ? ` (${roll})` : ''}`);
      }
    }
    return members.length > 0 ? members.join(', ') : '-';
  }
}
