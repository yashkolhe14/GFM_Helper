import { Component, inject, computed, signal } from '@angular/core';
import { DataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-fees',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-white">Fee Details</h1>
          <p class="text-text-tertiary mt-1 text-sm">Monitor class financial status and fee collection progress.</p>
        </div>
      </div>

      <!-- Premium Metric Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="glass-panel p-5 border-l-4 border-l-secondary-blue relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-xl bg-secondary-blue/10 flex items-center justify-center text-secondary-blue">
              <mat-icon>account_balance_wallet</mat-icon>
            </div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-secondary-blue bg-secondary-blue/10 px-2 py-1 rounded-full">Total</span>
          </div>
          <div class="space-y-1">
            <h3 class="text-text-tertiary text-xs font-semibold uppercase tracking-wider">Total Fees</h3>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold text-white">₹{{stats().total.toLocaleString()}}</span>
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <mat-icon class="text-7xl">account_balance_wallet</mat-icon>
          </div>
        </div>

        <div class="glass-panel p-5 border-l-4 border-l-secondary-green relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-xl bg-secondary-green/10 flex items-center justify-center text-secondary-green">
              <mat-icon>check_circle</mat-icon>
            </div>
          </div>
          <div class="space-y-1">
            <h3 class="text-text-tertiary text-xs font-semibold uppercase tracking-wider">Collected</h3>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold text-white">₹{{stats().paid.toLocaleString()}}</span>
              <span class="text-xs text-secondary-green">{{stats().rate}}%</span>
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <mat-icon class="text-7xl">check_circle</mat-icon>
          </div>
        </div>

        <div class="glass-panel p-5 border-l-4 border-l-danger relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center text-danger">
              <mat-icon>error</mat-icon>
            </div>
          </div>
          <div class="space-y-1">
            <h3 class="text-text-tertiary text-xs font-semibold uppercase tracking-wider">Pending</h3>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold text-white">₹{{stats().pending.toLocaleString()}}</span>
              <span class="text-xs text-danger">{{stats().pendingCount}} students</span>
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <mat-icon class="text-7xl">error</mat-icon>
          </div>
        </div>

        <div class="glass-panel p-5 border-l-4 border-l-accent-primary relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300">
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary">
              <mat-icon>trending_up</mat-icon>
            </div>
          </div>
          <div class="space-y-1">
            <h3 class="text-text-tertiary text-xs font-semibold uppercase tracking-wider">Collection Rate</h3>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold text-white">{{stats().rate}}%</span>
              <span class="text-xs text-accent-primary">+2.4% MoM</span>
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <mat-icon class="text-7xl">trending_up</mat-icon>
          </div>
        </div>
      </div>
      
      <div class="glass-panel overflow-hidden">
        <div class="p-6 border-b border-border-default flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 class="text-lg font-semibold text-white">Fee Status Directory</h2>
          <div class="flex flex-wrap items-center gap-3">
            <select [ngModel]="filterStatus()" (ngModelChange)="filterStatus.set($event)" class="bg-bg-elevated border border-border-default rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-primary/50 transition-colors appearance-none min-w-[150px]">
              <option value="">All Status</option>
              <option value="Paid">Fully Paid</option>
              <option value="Pending">Pending Balance</option>
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
                <th class="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Class</th>
                <th class="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Fee Amount</th>
                <th class="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Fee Paid</th>
                <th class="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Balance</th>
                <th class="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Status</th>
                <th class="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Email</th>
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
                  <td class="p-4 text-sm text-text-secondary">{{student.division}}</td>
                  <td class="p-4 text-sm font-mono text-text-secondary">₹{{(student.feeAmount || 0).toLocaleString()}}</td>
                  <td class="p-4 text-sm font-mono text-secondary-green">₹{{student.feePaid.toLocaleString()}}</td>
                  <td class="p-4 text-sm font-mono text-danger">₹{{student.feeBalance.toLocaleString()}}</td>
                  <td class="p-4">
                    @if (student.feeBalance === 0) {
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary-green/10 text-secondary-green border border-secondary-green/20">
                        Paid
                      </span>
                    } @else {
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-danger/10 text-danger border border-danger/20">
                        Pending
                      </span>
                    }
                  </td>
                  <td class="p-4 text-sm text-text-tertiary truncate max-w-[150px]" [title]="student.email">{{student.email}}</td>
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
export class FeesComponent {
  dataService = inject(DataService);
  searchQuery = signal('');
  filterStatus = signal('');

  stats = computed(() => {
    const students = this.dataService.students();
    const total = students.reduce((acc, s) => acc + (s.feeAmount || 0), 0);
    const paid = students.reduce((acc, s) => acc + s.feePaid, 0);
    const pending = students.reduce((acc, s) => acc + s.feeBalance, 0);
    const pendingCount = students.filter(s => s.feeBalance > 0).length;
    const rate = total ? Math.round((paid / total) * 100) : 0;

    return { total, paid, pending, pendingCount, rate };
  });

  filteredStudents = computed(() => {
    const students = this.dataService.students();
    const q = this.searchQuery().toLowerCase();
    const status = this.filterStatus();

    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(q) || s.rollNo.includes(q);
      const matchesStatus = !status || 
        (status === 'Paid' && s.feeBalance === 0) || 
        (status === 'Pending' && s.feeBalance > 0);
      return matchesSearch && matchesStatus;
    });
  });
}
