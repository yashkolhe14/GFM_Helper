import { Component, inject, signal, computed } from '@angular/core';
import { DataService, MentorGroup } from '../../services/data.service';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mentor-mentee',
  standalone: true,
  imports: [MatIconModule, FormsModule],
  template: `
    <div class="space-y-6 pb-12 h-[calc(100vh-120px)] flex flex-col">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 class="text-3xl font-bold tracking-tight mb-1">Mentor–Mentee</h1>
          <p class="text-text-secondary">View and manage mentor batches under this GFM</p>
        </div>
        <div class="flex items-center gap-3">
          <button class="btn-secondary">
            <mat-icon class="text-[20px] w-5 h-5">auto_awesome</mat-icon>
            Auto Assign
          </button>
          <button class="btn-primary" (click)="openNewGroupModal()">
            <mat-icon class="text-[20px] w-5 h-5">add</mat-icon>
            New Group
          </button>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        <!-- Left Panel: Mentor Groups -->
        <div class="w-full lg:w-1/3 flex flex-col gap-4">
          <div class="relative w-full shrink-0">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">search</mat-icon>
            <input type="text" [ngModel]="mentorSearchQuery()" (ngModelChange)="mentorSearchQuery.set($event)" placeholder="Search mentors..." class="w-full bg-bg-surface border border-border-default rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-accent-primary/50 transition-colors">
          </div>
          
          <div class="flex-1 overflow-y-auto space-y-3 pr-2">
            @for (group of filteredMentors(); track group.id) {
              <div class="glass-card p-4 cursor-pointer border-2 transition-all"
                   tabindex="0"
                   (keydown.enter)="selectGroup(group)"
                   [class.border-accent-primary]="selectedGroup()?.id === group.id"
                   [class.border-transparent]="selectedGroup()?.id !== group.id"
                   [class.bg-accent-primary]="selectedGroup()?.id === group.id ? '!bg-accent-primary/5' : ''"
                   (click)="selectGroup(group)">
                <div class="flex justify-between items-start mb-2">
                  <div class="font-semibold text-white">{{group.name}}</div>
                  <span class="status-pill status-neutral text-[10px] py-0">Div {{group.division}}</span>
                </div>
                <div class="flex items-center gap-4 text-sm text-text-secondary">
                  <div class="flex items-center gap-1">
                    <mat-icon class="text-[16px] w-4 h-4">groups</mat-icon>
                    {{getGroupStudentCount(group.id)}} Mentees
                  </div>
                  <div class="flex items-center gap-1">
                    <mat-icon class="text-[16px] w-4 h-4">tag</mat-icon>
                    Roll {{getGroupRollRange(group.id)}}
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Right Panel: Group Details -->
        <div class="w-full lg:w-2/3 glass-panel flex flex-col min-h-0">
          @if (selectedGroup()) {
            <!-- Group Header -->
            <div class="p-6 border-b border-border-default shrink-0">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h2 class="text-2xl font-bold text-white mb-1">{{selectedGroup()?.name}}'s Group</h2>
                  <p class="text-sm text-text-secondary">Division {{selectedGroup()?.division}} • {{selectedGroup()?.studentCount}} Students</p>
                </div>
                <button class="btn-secondary px-3 py-1.5 text-sm">
                  <mat-icon class="text-[16px] w-4 h-4">edit</mat-icon> Edit Group
                </button>
              </div>
              
              <!-- Group Stats -->
              <div class="grid grid-cols-4 gap-4">
                <div class="bg-bg-surface rounded-lg p-3 border border-border-default">
                  <div class="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Total</div>
                  <div class="font-semibold">{{selectedGroup()?.studentCount}}</div>
                </div>
                <div class="bg-bg-surface rounded-lg p-3 border border-border-default">
                  <div class="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Fee Dues</div>
                  <div class="font-semibold text-warning">{{studentsWithDues()}}</div>
                </div>
                <div class="bg-bg-surface rounded-lg p-3 border border-border-default">
                  <div class="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Incomplete</div>
                  <div class="font-semibold text-danger">{{incompleteProfiles()}}</div>
                </div>
                <div class="bg-bg-surface rounded-lg p-3 border border-border-default">
                  <div class="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Avg Attendance</div>
                  <div class="font-semibold text-success">85%</div>
                </div>
              </div>
            </div>

            <!-- Mentees List -->
            <div class="flex-1 overflow-y-auto p-6">
              <div class="flex justify-between items-center mb-4 gap-4">
                <h3 class="text-lg font-semibold whitespace-nowrap">Mentees</h3>
                <div class="flex items-center gap-3 flex-1 justify-end">
                  <select [ngModel]="filterVac()" (ngModelChange)="filterVac.set($event)" class="bg-bg-surface border border-border-default rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent-primary/50 appearance-none min-w-[120px]">
                    <option value="">All VAC Status</option>
                    <option value="Completed">Enrolled in VAC</option>
                    <option value="Pending">Not Enrolled</option>
                  </select>
                  <div class="relative w-64">
                    <mat-icon class="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary text-[18px] w-[18px] h-[18px]">search</mat-icon>
                    <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="Search mentees..." class="w-full bg-bg-surface border border-border-default rounded-lg pl-8 pr-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent-primary/50">
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                @for (student of filteredGroupStudents(); track student.id) {
                  <div class="flex items-center justify-between p-3 rounded-xl border border-border-default bg-bg-surface hover:bg-white/5 transition-colors group">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-text-secondary font-mono text-sm">
                        {{student.rollNo}}
                      </div>
                      <div class="w-48">
                        <div class="font-medium text-white truncate" [title]="student.name">{{student.name}}</div>
                        <div class="text-xs text-text-tertiary">{{student.prn}}</div>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-2 flex-1 px-4">
                      @if (student.vac && student.vac !== 'Pending' && student.vac !== 'None') {
                        <span class="bg-secondary-blue/10 text-secondary-blue border border-secondary-blue/20 rounded-md px-2 py-1 text-[10px] truncate max-w-[120px]" [title]="student.vac">{{student.vac}}</span>
                      }
                      @if (student.mooc1 && student.mooc1 !== 'Pending' && student.mooc1 !== 'None') {
                        <span class="bg-success/10 text-success border border-success/20 rounded-md px-2 py-1 text-[10px] truncate max-w-[120px]" [title]="student.mooc1">{{student.mooc1}}</span>
                      }
                    </div>

                    <div class="flex items-center gap-4">
                      @if (student.feeBalance > 0) {
                        <mat-icon class="text-warning text-[18px] w-[18px] h-[18px]" title="Fee Due">account_balance_wallet</mat-icon>
                      }
                      @if (!student.vac || student.vac === 'Pending' || student.vac === 'None') {
                        <mat-icon class="text-danger text-[18px] w-[18px] h-[18px]" title="Incomplete Profile">warning</mat-icon>
                      }
                      <button class="text-text-tertiary hover:text-accent-primary transition-colors opacity-0 group-hover:opacity-100">
                        <mat-icon>chevron_right</mat-icon>
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="flex-1 flex flex-col items-center justify-center text-text-tertiary p-12 text-center">
              <mat-icon class="text-6xl mb-4 opacity-50">groups</mat-icon>
              <h3 class="text-xl font-medium text-white mb-2">Select a Mentor Group</h3>
              <p class="max-w-sm">Choose a mentor from the left panel to view their assigned mentees and group statistics.</p>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- New Group Modal -->
    @if (isNewGroupModalOpen()) {
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" tabindex="0" (keydown.enter)="closeNewGroupModal()" (click)="closeNewGroupModal()">
        <div class="bg-bg-surface border border-border-default rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" tabindex="0" (keydown.enter)="$event.stopPropagation()" (click)="$event.stopPropagation()">
          <div class="p-6 border-b border-border-default flex justify-between items-center">
            <h2 class="text-xl font-bold text-white">Create New Mentor Group</h2>
            <button (click)="closeNewGroupModal()" class="text-text-tertiary hover:text-white transition-colors">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label for="mentorName" class="block text-sm font-medium text-text-secondary mb-1">Mentor Name</label>
              <input id="mentorName" type="text" [(ngModel)]="newGroupName" placeholder="e.g. Prof. Smith" class="w-full bg-bg-elevated border border-border-default rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent-primary/50">
            </div>
            <div>
              <label for="division" class="block text-sm font-medium text-text-secondary mb-1">Division</label>
              <input id="division" type="text" [(ngModel)]="newGroupDivision" placeholder="e.g. A" class="w-full bg-bg-elevated border border-border-default rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent-primary/50">
            </div>
          </div>
          <div class="p-6 border-t border-border-default flex justify-end gap-3 bg-bg-elevated/50">
            <button class="btn-secondary" (click)="closeNewGroupModal()">Cancel</button>
            <button class="btn-primary" (click)="createNewGroup()" [disabled]="!newGroupName || !newGroupDivision">Create Group</button>
          </div>
        </div>
      </div>
    }
  `
})
export class MentorMenteeComponent {
  dataService = inject(DataService);
  
  selectedGroup = signal<MentorGroup | null>(null);
  isNewGroupModalOpen = signal(false);
  newGroupName = '';
  newGroupDivision = '';
  searchQuery = signal('');
  mentorSearchQuery = signal('');
  filterVac = signal('');

  constructor() {
    // Select the first group by default if available
    const groups = this.dataService.mentors();
    if (groups.length > 0) {
      this.selectedGroup.set(groups.find(g => g.name.includes('You')) || groups[0]);
    }
  }

  selectGroup(group: MentorGroup) {
    this.selectedGroup.set(group);
  }

  openNewGroupModal() {
    this.isNewGroupModalOpen.set(true);
  }

  closeNewGroupModal() {
    this.isNewGroupModalOpen.set(false);
    this.newGroupName = '';
    this.newGroupDivision = '';
  }

  createNewGroup() {
    if (this.newGroupName && this.newGroupDivision) {
      const newGroup: MentorGroup = {
        id: Math.random().toString(36).substring(2, 9),
        name: this.newGroupName,
        division: this.newGroupDivision,
        studentCount: 0
      };
      this.dataService.mentors.update(mentors => [...mentors, newGroup]);
      this.closeNewGroupModal();
      this.selectGroup(newGroup);
    }
  }

  filteredMentors = computed(() => {
    const mentors = this.dataService.mentors();
    const q = this.mentorSearchQuery().toLowerCase();
    if (!q) return mentors;
    return mentors.filter(m => m.name.toLowerCase().includes(q) || m.division.toLowerCase().includes(q));
  });

  getGroupStudentCount(mentorId: string) {
    return this.dataService.students().filter(s => s.mentorId === mentorId).length;
  }

  getGroupRollRange(mentorId: string) {
    const students = this.dataService.students().filter(s => s.mentorId === mentorId);
    if (students.length === 0) return 'N/A';
    const rolls = students.map(s => parseInt(s.rollNo)).filter(r => !isNaN(r));
    if (rolls.length === 0) return 'N/A';
    const min = Math.min(...rolls);
    const max = Math.max(...rolls);
    return min === max ? `${min}` : `${min}-${max}`;
  }

  groupStudents = computed(() => {
    const group = this.selectedGroup();
    if (!group) return [];
    return this.dataService.students().filter(s => s.mentorId === group.id);
  });

  filteredGroupStudents = computed(() => {
    let students = this.groupStudents();
    
    const vac = this.filterVac();
    if (vac === 'Completed') {
      students = students.filter(s => s.vac && s.vac !== 'Pending' && s.vac !== 'None');
    } else if (vac === 'Pending') {
      students = students.filter(s => !s.vac || s.vac === 'Pending' || s.vac === 'None');
    }

    const q = this.searchQuery().toLowerCase();
    if (!q) return students;
    return students.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.rollNo.includes(q) || 
      (s.vac && s.vac.toLowerCase().includes(q)) ||
      (s.mooc1 && s.mooc1.toLowerCase().includes(q))
    );
  });

  studentsWithDues = computed(() => {
    return this.groupStudents().filter(s => s.feeBalance > 0).length;
  });

  incompleteProfiles = computed(() => {
    return this.groupStudents().filter(s => !s.vac || s.vac === 'Pending' || s.vac === 'None' || !s.mooc1 || s.mooc1 === 'Pending' || s.mooc1 === 'None').length;
  });
}
