import { Component, inject, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DataService, Student } from '../../services/data.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sheet-view',
  standalone: true,
  imports: [MatIconModule, FormsModule, CommonModule],
  template: `
    <div class="space-y-6 pb-12 h-[calc(100vh-120px)] flex flex-col">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 class="text-3xl font-bold tracking-tight mb-1">Data Explorer</h1>
          <p class="text-text-secondary">Inspect raw uploaded sheets and normalized data</p>
        </div>
        <div class="flex items-center gap-3">
          <button class="btn-secondary">
            <mat-icon class="text-[20px] w-5 h-5">download</mat-icon>
            Download Sheet
          </button>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="flex justify-between items-center shrink-0">
        <div class="relative w-64">
          <mat-icon class="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary text-[18px] w-[18px] h-[18px]">search</mat-icon>
          <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="Search in sheet..." class="w-full bg-bg-surface border border-border-default rounded-lg pl-8 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent-primary/50">
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-text-tertiary">Total Columns: {{allColumns().length}}</span>
          <button class="btn-secondary px-3 py-1.5 text-sm">
            <mat-icon class="text-[16px] w-4 h-4">view_column</mat-icon> Columns
          </button>
        </div>
      </div>

      <!-- Spreadsheet View -->
      <div class="glass-panel flex-1 min-h-0 overflow-hidden flex flex-col">
        <div class="flex-1 overflow-auto">
          <table class="w-full text-left border-collapse whitespace-nowrap">
            <thead class="sticky top-0 z-10 bg-bg-elevated shadow-sm">
              <tr>
                <th class="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-r border-border-default w-16 text-center bg-white/5">#</th>
                @for (col of allColumns(); track col) {
                  <th class="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-r border-border-default bg-white/5">{{col}}</th>
                }
              </tr>
            </thead>
            <tbody class="font-mono text-sm">
              @for (student of filteredStudents(); track student.id; let i = $index) {
                <tr class="hover:bg-white/5 border-b border-border-default/50">
                  <td class="p-3 text-text-tertiary text-center border-r border-border-default/50 bg-white/5">{{i + 1}}</td>
                  @for (col of allColumns(); track col) {
                    <td class="p-3 border-r border-border-default/50">
                      {{getStudentValue(student, col)}}
                    </td>
                  }
                </tr>
              }
              @if (filteredStudents().length === 0) {
                <tr>
                  <td [attr.colspan]="allColumns().length + 1" class="p-8 text-center text-text-secondary font-sans">
                    No data found matching your search.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="p-3 border-t border-border-default bg-bg-surface text-xs text-text-tertiary flex justify-between items-center shrink-0">
          <span>Showing {{filteredStudents().length}} of {{dataService.students().length}} rows</span>
          <span>Normalized View</span>
        </div>
      </div>
    </div>
  `
})
export class SheetViewComponent {
  dataService = inject(DataService);
  searchQuery = signal('');

  allColumns = computed(() => {
    const students = this.dataService.students();
    const systemFields = [
      'rollNo', 'prn', 'name', 'gender', 'division', 'email', 'mobile', 
      'feePaid', 'feeBalance', 'vac', 'mooc1', 'mooc2', 'internship', 'hackathon'
    ];
    
    const extraFields = new Set<string>();
    students.forEach(s => {
      if (s.extraData) {
        Object.keys(s.extraData).forEach(key => extraFields.add(key));
      }
    });
    
    return [...systemFields, ...Array.from(extraFields)];
  });

  filteredStudents = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const students = this.dataService.students();
    
    if (!query) return students;
    
    return students.filter(s => {
      const basicMatch = Object.values(s).some(val => 
        typeof val === 'string' && val.toLowerCase().includes(query)
      );
      
      const extraMatch = s.extraData && Object.values(s.extraData).some(val => 
        String(val).toLowerCase().includes(query)
      );
      
      return basicMatch || extraMatch;
    });
  });

  getStudentValue(student: Student, col: string): string {
    if (col in student) {
      return String((student as unknown as Record<string, string | number>)[col]);
    }
    if (student.extraData && col in student.extraData) {
      return String(student.extraData[col]);
    }
    return '-';
  }
}
