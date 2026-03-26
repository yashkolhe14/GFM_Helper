import { Component, inject, computed, signal } from '@angular/core';
import { DataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-moocs',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-3xl font-bold tracking-tight">MOOC Details</h1>
      
      <div class="glass-panel p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Enrolled Students</h2>
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search..." class="bg-bg-elevated border border-border-default rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent-primary/50 transition-colors w-48">
        </div>
        
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-white/5 border-b border-border-default">
              <th class="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Roll No</th>
              <th class="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Name</th>
              <th class="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">MOOC 1</th>
              <th class="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">MOOC 2</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-default">
            @for (student of filteredStudents(); track student.id) {
              <tr class="hover:bg-white/5 transition-colors">
                <td class="p-3 text-sm font-mono text-text-tertiary">{{student.rollNo}}</td>
                <td class="p-3 text-sm font-medium text-white">{{student.name}}</td>
                <td class="p-3 text-sm text-text-secondary">{{student.mooc1 || '-'}}</td>
                <td class="p-3 text-sm text-text-secondary">{{student.mooc2 || '-'}}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .bar-fill {
      transition: width 0.8s ease;
    }
  `]
})
export class MoocsComponent {
  dataService = inject(DataService);
  searchQuery = signal('');

  filteredStudents = computed(() => {
    const students = this.dataService.students();
    const q = this.searchQuery().toLowerCase();
    return students.filter(s => 
      (s.mooc1 && s.mooc1 !== 'Pending' && s.mooc1 !== 'None') || 
      (s.mooc2 && s.mooc2 !== 'Pending' && s.mooc2 !== 'None')
    ).filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.rollNo.includes(q)
    );
  });
}
