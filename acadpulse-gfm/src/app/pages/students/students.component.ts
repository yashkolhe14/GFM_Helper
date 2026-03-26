import { Component, inject, signal, computed } from '@angular/core';
import { DataService, Student } from '../../services/data.service';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

import { KeyValuePipe } from '@angular/common';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [MatIconModule, FormsModule, KeyValuePipe],
  template: `
    <div class="space-y-6 pb-12">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight mb-1">Students</h1>
          <p class="text-text-secondary">Search, filter, and inspect student records</p>
        </div>
        <div class="flex items-center gap-3">
          <button class="btn-secondary" (click)="copyEmails()">
            <mat-icon class="text-[20px] w-5 h-5">content_copy</mat-icon>
            Copy Emails
          </button>
          <button class="btn-secondary">
            <mat-icon class="text-[20px] w-5 h-5">download</mat-icon>
            Export CSV
          </button>
          <button class="btn-secondary">
            <mat-icon class="text-[20px] w-5 h-5">edit</mat-icon>
            Bulk Update
          </button>
          <button class="btn-primary">
            <mat-icon class="text-[20px] w-5 h-5">add</mat-icon>
            Add Student
          </button>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="glass-panel p-4 flex flex-col md:flex-row gap-4 items-center">
        <div class="relative flex-1 w-full">
          <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">search</mat-icon>
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search by name, roll no, PRN..." class="w-full bg-bg-surface border border-border-default rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-accent-primary/50 transition-colors">
        </div>
        
        <div class="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <select [(ngModel)]="filterDivision" class="bg-bg-surface border border-border-default rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary/50 appearance-none min-w-[120px]">
            <option value="">All Divisions</option>
            <option value="A">Division A</option>
            <option value="B">Division B</option>
          </select>
          
          <select [(ngModel)]="filterFee" class="bg-bg-surface border border-border-default rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary/50 appearance-none min-w-[120px]">
            <option value="">Fee Status</option>
            <option value="paid">Fully Paid</option>
            <option value="pending">Pending</option>
          </select>
          
          <select [(ngModel)]="filterMentor" class="bg-bg-surface border border-border-default rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary/50 appearance-none min-w-[120px]">
            <option value="">All Mentors</option>
            @for (mentor of dataService.mentors(); track mentor.id) {
              <option [value]="mentor.id">{{mentor.name}}</option>
            }
          </select>
          
          <button class="btn-secondary px-3 py-2.5" (click)="toggleMoreFilters()" [class.bg-white/10]="showMoreFilters()">
            <mat-icon>filter_list</mat-icon>
            More
          </button>
        </div>
      </div>

      <!-- Extended Filters -->
      @if (showMoreFilters()) {
        <div class="glass-panel p-4 flex flex-wrap gap-4 items-center animate-in fade-in slide-in-from-top-2 duration-200">
          <select [(ngModel)]="filterGender" class="bg-bg-surface border border-border-default rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary/50 appearance-none min-w-[120px]">
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <select [(ngModel)]="filterVac" class="bg-bg-surface border border-border-default rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary/50 appearance-none min-w-[120px]">
            <option value="">VAC Status</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
          </select>

          <select [(ngModel)]="filterMooc" class="bg-bg-surface border border-border-default rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary/50 appearance-none min-w-[120px]">
            <option value="">MOOC Status</option>
            <option value="Done">Done</option>
            <option value="Pending">Pending</option>
          </select>

          <select [(ngModel)]="filterInternship" class="bg-bg-surface border border-border-default rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary/50 appearance-none min-w-[120px]">
            <option value="">All Internships</option>
            @for (intern of dataService.uniqueInternships(); track intern) {
              <option [value]="intern">{{intern}}</option>
            }
          </select>

          <select [(ngModel)]="filterHackathon" class="bg-bg-surface border border-border-default rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary/50 appearance-none min-w-[120px]">
            <option value="">All Hackathons</option>
            @for (hack of dataService.uniqueHackathons(); track hack) {
              <option [value]="hack">{{hack}}</option>
            }
          </select>
          
          <button class="text-sm text-text-tertiary hover:text-white transition-colors ml-auto" (click)="clearFilters()">
            Clear All Filters
          </button>
        </div>
      }

      <!-- Student Table -->
      <div class="glass-panel overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-border-default bg-white/5">
                <th class="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Roll No</th>
                <th class="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Student Name</th>
                <th class="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">PRN</th>
                <th class="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Mobile</th>
                <th class="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Division</th>
                <th class="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Internship</th>
                <th class="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Hackathon</th>
                <th class="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Links</th>
                <th class="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Fee Status</th>
                <th class="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">VAC</th>
                <th class="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">MOOCs</th>
                <th class="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-default">
              @for (student of filteredStudents(); track student.id) {
                <tr class="hover:bg-white/5 transition-colors cursor-pointer group" tabindex="0" (keydown.enter)="openDrawer(student)" (click)="openDrawer(student)">
                  <td class="p-4 text-sm font-mono text-text-secondary">{{student.rollNo}}</td>
                  <td class="p-4">
                    <div class="font-medium text-white group-hover:text-accent-primary transition-colors">{{student.name}}</div>
                    <div class="text-xs text-text-tertiary">{{student.email}}</div>
                  </td>
                  <td class="p-4 text-sm font-mono text-text-secondary">{{student.prn}}</td>
                  <td class="p-4 text-sm text-text-secondary">{{student.mobile}}</td>
                  <td class="p-4 text-sm">{{student.division}}</td>
                  <td class="p-4 text-sm text-text-secondary truncate max-w-[120px]" [title]="student.internship">{{student.internship || 'None'}}</td>
                  <td class="p-4 text-sm text-text-secondary truncate max-w-[120px]" [title]="student.hackathon">{{student.hackathon || 'None'}}</td>
                  <td class="p-4">
                    <div class="flex gap-2">
                      @if (student.github) {
                        <a [href]="'https://github.com/' + student.github" target="_blank" class="text-text-tertiary hover:text-white" (click)="$event.stopPropagation()">
                          <mat-icon class="text-[18px] w-[18px] h-[18px]">code</mat-icon>
                        </a>
                      }
                      @if (student.linkedin) {
                        <a [href]="student.linkedin" target="_blank" class="text-text-tertiary hover:text-white" (click)="$event.stopPropagation()">
                          <mat-icon class="text-[18px] w-[18px] h-[18px]">work</mat-icon>
                        </a>
                      }
                    </div>
                  </td>
                  <td class="p-4">
                    @if (student.feeBalance === 0) {
                      <span class="status-pill status-paid">Paid</span>
                    } @else {
                      <span class="status-pill status-pending">Due: ₹{{student.feeBalance}}</span>
                    }
                  </td>
                  <td class="p-4">
                    @if (student.vac && student.vac !== 'Pending' && student.vac !== 'None') {
                      <mat-icon class="text-success text-[18px] w-[18px] h-[18px]" [title]="student.vac">check_circle</mat-icon>
                    } @else {
                      <mat-icon class="text-warning text-[18px] w-[18px] h-[18px]">pending</mat-icon>
                    }
                  </td>
                  <td class="p-4">
                    <div class="flex gap-1">
                      <div class="w-2 h-2 rounded-full" 
                           [class.bg-success]="student.mooc1 && student.mooc1 !== 'Pending' && student.mooc1 !== 'None'" 
                           [class.bg-warning]="!student.mooc1 || student.mooc1 === 'Pending' || student.mooc1 === 'None'"
                           [title]="student.mooc1"></div>
                      <div class="w-2 h-2 rounded-full" 
                           [class.bg-success]="student.mooc2 && student.mooc2 !== 'Pending' && student.mooc2 !== 'None'" 
                           [class.bg-warning]="!student.mooc2 || student.mooc2 === 'Pending' || student.mooc2 === 'None'"
                           [title]="student.mooc2"></div>
                    </div>
                  </td>
                  <td class="p-4">
                    <button class="text-text-tertiary hover:text-white transition-colors" (click)="$event.stopPropagation()">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                  </td>
                </tr>
              }
              @if (filteredStudents().length === 0) {
                <tr>
                  <td colspan="12" class="p-8 text-center text-text-secondary">
                    No students found matching your criteria.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Student Profile Drawer Overlay -->
    @if (selectedStudent()) {
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end" tabindex="0" (keydown.enter)="closeDrawer()" (click)="closeDrawer()">
        <div class="w-full max-w-md bg-bg-surface h-full border-l border-border-default shadow-2xl flex flex-col animate-in slide-in-from-right duration-300" tabindex="0" (keydown.enter)="$event.stopPropagation()" (click)="$event.stopPropagation()">
          
          <!-- Drawer Header -->
          <div class="p-6 border-b border-border-default flex justify-between items-start">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <div class="w-12 h-12 rounded-full bg-accent-primary/20 text-accent-primary flex items-center justify-center text-xl font-bold">
                  {{selectedStudent()?.name?.charAt(0)}}
                </div>
                <div>
                  <h2 class="text-xl font-bold text-white">{{selectedStudent()?.name}}</h2>
                  <p class="text-sm text-text-secondary font-mono">{{selectedStudent()?.prn}} | Roll: {{selectedStudent()?.rollNo}}</p>
                </div>
              </div>
            </div>
            <button (click)="closeDrawer()" class="text-text-tertiary hover:text-white transition-colors">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- Drawer Content -->
          <div class="flex-1 overflow-y-auto p-6 space-y-8">
            
            <!-- Basic Info -->
            <section>
              <h3 class="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Basic Information</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="text-xs text-text-tertiary mb-1">Email</div>
                  <div class="text-sm text-white truncate" [title]="selectedStudent()?.email">{{selectedStudent()?.email}}</div>
                </div>
                <div>
                  <div class="text-xs text-text-tertiary mb-1">Mobile</div>
                  <div class="text-sm text-white">{{selectedStudent()?.mobile}}</div>
                </div>
                <div>
                  <div class="text-xs text-text-tertiary mb-1">Gender</div>
                  <div class="text-sm text-white">{{selectedStudent()?.gender}}</div>
                </div>
                <div>
                  <div class="text-xs text-text-tertiary mb-1">Division</div>
                  <div class="text-sm text-white">{{selectedStudent()?.division}}</div>
                </div>
                <div>
                  <div class="text-xs text-text-tertiary mb-1">Mentor</div>
                  <div class="text-sm text-white">{{getMentorName(selectedStudent()?.mentorId)}}</div>
                </div>
              </div>
            </section>

            <div class="h-px bg-border-default"></div>

            <!-- Academic & Engagement -->
            <section>
              <h3 class="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Academic & Engagement</h3>
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-text-secondary">Value Added Course (VAC)</span>
                  <span class="status-pill" [class.status-paid]="selectedStudent()?.vac && selectedStudent()?.vac !== 'Pending' && selectedStudent()?.vac !== 'None'" [class.status-pending]="!selectedStudent()?.vac || selectedStudent()?.vac === 'Pending' || selectedStudent()?.vac === 'None'">{{selectedStudent()?.vac}}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-text-secondary">MOOC 1</span>
                  <div class="text-right">
                    <span class="status-pill" [class.status-paid]="selectedStudent()?.mooc1 && selectedStudent()?.mooc1 !== 'Pending' && selectedStudent()?.mooc1 !== 'None'" [class.status-pending]="!selectedStudent()?.mooc1 || selectedStudent()?.mooc1 === 'Pending' || selectedStudent()?.mooc1 === 'None'">{{selectedStudent()?.mooc1}}</span>
                    @if (selectedStudent()?.mooc1Duration) {
                      <div class="text-xs text-text-tertiary mt-1">{{selectedStudent()?.mooc1Duration}}</div>
                    }
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-text-secondary">MOOC 2</span>
                  <div class="text-right">
                    <span class="status-pill" [class.status-paid]="selectedStudent()?.mooc2 && selectedStudent()?.mooc2 !== 'Pending' && selectedStudent()?.mooc2 !== 'None'" [class.status-pending]="!selectedStudent()?.mooc2 || selectedStudent()?.mooc2 === 'Pending' || selectedStudent()?.mooc2 === 'None'">{{selectedStudent()?.mooc2}}</span>
                    @if (selectedStudent()?.mooc2Duration) {
                      <div class="text-xs text-text-tertiary mt-1">{{selectedStudent()?.mooc2Duration}}</div>
                    }
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-text-secondary">Internship</span>
                  <span class="text-sm text-white font-medium">{{selectedStudent()?.internship}}</span>
                </div>
                @if (selectedStudent()?.internshipDuration) {
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-text-secondary">Duration</span>
                    <span class="text-sm text-white">{{selectedStudent()?.internshipDuration}}</span>
                  </div>
                }
                <div class="flex justify-between items-center">
                  <span class="text-sm text-text-secondary">Hackathon</span>
                  <span class="text-sm text-white font-medium">{{selectedStudent()?.hackathon}}</span>
                </div>
                @if (selectedStudent()?.hackathonDate) {
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-text-secondary">Date</span>
                    <span class="text-sm text-white">{{selectedStudent()?.hackathonDate}}</span>
                  </div>
                }
                @if (selectedStudent()?.hackathonMilestone) {
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-text-secondary">Milestone</span>
                    <span class="text-sm text-white">{{selectedStudent()?.hackathonMilestone}}</span>
                  </div>
                }
                @if (selectedStudent()?.hackathonMentor) {
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-text-secondary">Mentor</span>
                    <span class="text-sm text-white">{{selectedStudent()?.hackathonMentor}}</span>
                  </div>
                }
                @if (selectedStudent()?.hackathonCertificate) {
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-text-secondary">Certificate</span>
                    <span class="text-sm text-white">{{selectedStudent()?.hackathonCertificate}}</span>
                  </div>
                }
              </div>
            </section>

            <div class="h-px bg-border-default"></div>

            <!-- Team Members -->
            @if (selectedStudent()?.teamMember1Name) {
              <section>
                <h3 class="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Team Members</h3>
                <div class="space-y-3">
                  @if (selectedStudent()?.teamMember1Name) {
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-white">{{selectedStudent()?.teamMember1Name}}</span>
                      <span class="text-xs text-text-tertiary">Roll: {{selectedStudent()?.teamMember1RollNo}}</span>
                    </div>
                  }
                  @if (selectedStudent()?.teamMember2Name) {
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-white">{{selectedStudent()?.teamMember2Name}}</span>
                      <span class="text-xs text-text-tertiary">Roll: {{selectedStudent()?.teamMember2RollNo}}</span>
                    </div>
                  }
                  @if (selectedStudent()?.teamMember3Name) {
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-white">{{selectedStudent()?.teamMember3Name}}</span>
                      <span class="text-xs text-text-tertiary">Roll: {{selectedStudent()?.teamMember3RollNo}}</span>
                    </div>
                  }
                  @if (selectedStudent()?.teamMember4Name) {
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-white">{{selectedStudent()?.teamMember4Name}}</span>
                      <span class="text-xs text-text-tertiary">Roll: {{selectedStudent()?.teamMember4RollNo}}</span>
                    </div>
                  }
                  @if (selectedStudent()?.teamMember5Name) {
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-white">{{selectedStudent()?.teamMember5Name}}</span>
                      <span class="text-xs text-text-tertiary">Roll: {{selectedStudent()?.teamMember5RollNo}}</span>
                    </div>
                  }
                  @if (selectedStudent()?.teamMember6Name) {
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-white">{{selectedStudent()?.teamMember6Name}}</span>
                      <span class="text-xs text-text-tertiary">Roll: {{selectedStudent()?.teamMember6RollNo}}</span>
                    </div>
                  }
                </div>
              </section>
              <div class="h-px bg-border-default"></div>
            }

            <div class="h-px bg-border-default"></div>

            <!-- Financial -->
            <section>
              <h3 class="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Financial Status</h3>
              <div class="bg-bg-elevated rounded-xl p-4 border border-border-default">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm text-text-secondary">Total Paid</span>
                  <span class="text-sm text-white font-medium">₹{{selectedStudent()?.feePaid}}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-text-secondary">Balance Due</span>
                  <span class="text-sm font-bold" [class.text-danger]="selectedStudent()?.feeBalance! > 0" [class.text-success]="selectedStudent()?.feeBalance === 0">₹{{selectedStudent()?.feeBalance}}</span>
                </div>
              </div>
            </section>

            <div class="h-px bg-border-default"></div>

            <!-- Extra Data -->
            @if (selectedStudent()?.extraData; as extraData) {
              <section>
                <h3 class="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Additional Information</h3>
                <div class="grid grid-cols-1 gap-4">
                  @for (item of extraData | keyvalue; track item.key) {
                    <div class="bg-bg-elevated rounded-xl p-3 border border-border-default">
                      <div class="text-xs text-text-tertiary mb-1">{{item.key}}</div>
                      <div class="text-sm text-white font-medium">{{item.value}}</div>
                    </div>
                  }
                </div>
              </section>
              <div class="h-px bg-border-default"></div>
            }

            <!-- Links -->
            <section>
              <h3 class="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">External Links</h3>
              <div class="flex gap-3">
                @if (selectedStudent()?.github) {
                  <a [href]="'https://github.com/' + selectedStudent()?.github" target="_blank" class="btn-secondary flex-1 py-2 text-sm">
                    <mat-icon class="text-[18px] w-[18px] h-[18px]">code</mat-icon> GitHub
                  </a>
                }
                @if (selectedStudent()?.linkedin) {
                  <a [href]="selectedStudent()?.linkedin" target="_blank" class="btn-secondary flex-1 py-2 text-sm">
                    <mat-icon class="text-[18px] w-[18px] h-[18px]">work</mat-icon> LinkedIn
                  </a>
                }
              </div>
            </section>

          </div>
          
          <!-- Drawer Footer -->
          <div class="p-6 border-t border-border-default flex gap-3">
            <button class="btn-secondary flex-1">Edit Profile</button>
            <button class="btn-primary flex-1">Message</button>
          </div>
        </div>
      </div>
    }
  `
})
export class StudentsComponent {
  dataService = inject(DataService);
  
  searchQuery = '';
  filterDivision = '';
  filterFee = '';
  filterGender = '';
  filterVac = '';
  filterMooc = '';
  filterMentor = '';
  filterInternship = '';
  filterHackathon = '';
  
  showMoreFilters = signal(false);
  selectedStudent = signal<Student | null>(null);

  toggleMoreFilters() {
    this.showMoreFilters.update(v => !v);
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterDivision = '';
    this.filterFee = '';
    this.filterGender = '';
    this.filterVac = '';
    this.filterMooc = '';
    this.filterMentor = '';
    this.filterInternship = '';
    this.filterHackathon = '';
  }

  filteredStudents = computed(() => {
    let students = this.dataService.students();
    
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      students = students.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.rollNo.includes(q) || 
        s.prn.toLowerCase().includes(q)
      );
    }
    
    if (this.filterDivision) {
      students = students.filter(s => s.division === this.filterDivision);
    }
    
    if (this.filterFee === 'paid') {
      students = students.filter(s => s.feeBalance === 0);
    } else if (this.filterFee === 'pending') {
      students = students.filter(s => s.feeBalance > 0);
    }

    if (this.filterGender) {
      students = students.filter(s => s.gender === this.filterGender);
    }

    if (this.filterVac === 'Completed') {
      students = students.filter(s => s.vac && s.vac !== 'Pending' && s.vac !== 'None');
    } else if (this.filterVac === 'Pending') {
      students = students.filter(s => !s.vac || s.vac === 'Pending' || s.vac === 'None');
    }

    if (this.filterMooc === 'Done') {
      students = students.filter(s => (s.mooc1 && s.mooc1 !== 'Pending' && s.mooc1 !== 'None') || (s.mooc2 && s.mooc2 !== 'Pending' && s.mooc2 !== 'None'));
    } else if (this.filterMooc === 'Pending') {
      students = students.filter(s => (!s.mooc1 || s.mooc1 === 'Pending' || s.mooc1 === 'None') && (!s.mooc2 || s.mooc2 === 'Pending' || s.mooc2 === 'None'));
    }

    if (this.filterInternship) {
      students = students.filter(s => s.internship === this.filterInternship);
    }

    if (this.filterHackathon) {
      students = students.filter(s => s.hackathon === this.filterHackathon);
    }
    
    if (this.filterMentor) {
      students = students.filter(s => s.mentorId === this.filterMentor);
    }
    
    return students;
  });

  openDrawer(student: Student) {
    this.selectedStudent.set(student);
  }

  closeDrawer() {
    this.selectedStudent.set(null);
  }

  copyEmails() {
    const emails = this.filteredStudents()
      .map(s => s.email)
      .filter(Boolean)
      .join(', ');
    
    if (emails) {
      navigator.clipboard.writeText(emails).then(() => {
        alert('Emails copied to clipboard!');
      });
    } else {
      alert('No emails found in the current filtered list.');
    }
  }

  getMentorName(mentorId: string | undefined): string {
    if (!mentorId) return 'Unassigned';
    const mentor = this.dataService.mentors().find(m => m.id === mentorId);
    return mentor ? mentor.name : 'Unassigned';
  }
}
