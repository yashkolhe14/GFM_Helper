import { Component, inject } from '@angular/core';
import { DataService } from '../../services/data.service';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  template: `
    <div class="space-y-8 pb-12">
      <!-- Hero Panel -->
      <div class="glass-panel p-8 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        
        <div class="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h1 class="text-3xl md:text-4xl font-bold mb-2 tracking-tight">Welcome, {{dataService.currentUser().name}}</h1>
            <p class="text-text-secondary text-lg mb-6">Manage your class, mentor groups, and student academic records</p>
            
            <div class="flex flex-wrap gap-3">
              <span class="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-sm font-medium">{{dataService.currentUser().department}}</span>
              <span class="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-sm font-medium">AY {{dataService.currentUser().academicYear}}</span>
              <span class="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-sm font-medium">Sem {{dataService.currentUser().semester}}</span>
              <span class="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-sm font-medium">Div {{dataService.currentUser().division}}</span>
              <span class="bg-accent-primary/10 border border-accent-primary/20 text-accent-primary rounded-full px-3 py-1 text-sm font-medium">{{dataService.students().length}} Students</span>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <button routerLink="/app/upload" class="btn-primary">
              <mat-icon class="text-[20px] w-5 h-5">cloud_upload</mat-icon>
              Quick Upload
            </button>
            <button class="btn-secondary">
              <mat-icon class="text-[20px] w-5 h-5">download</mat-icon>
              Export
            </button>
          </div>
        </div>
      </div>

      <!-- Summary Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        @for (metric of metrics; track metric.label) {
          <div [routerLink]="metric.route" class="glass-card p-5 relative overflow-hidden group cursor-pointer hover:border-white/20 transition-all">
            <div class="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-white/5 group-hover:bg-accent-primary/10 transition-colors blur-xl"></div>
            <div class="flex justify-between items-start mb-4">
              <span class="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">{{metric.label}}</span>
              <mat-icon [class]="'text-[20px] w-5 h-5 ' + metric.colorClass">{{metric.icon}}</mat-icon>
            </div>
            <div class="text-3xl font-bold mb-1">{{metric.value}}</div>
            <div class="text-xs text-text-tertiary">{{metric.trend}}</div>
            <div class="h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
              <div class="h-full transition-all duration-1000 sc-bar-fill" [class]="metric.bgClass" [style.width.%]="metric.percent"></div>
            </div>
          </div>
        }
      </div>

      <!-- Charts & Analysis Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Division Distribution (Donut-like) -->
        <div class="glass-panel p-6">
          <h3 class="text-xs font-bold text-text-secondary uppercase tracking-widest mb-6">Division Distribution</h3>
          <div class="flex items-center gap-6">
            <div class="relative w-32 h-32 flex-shrink-0">
              <svg viewBox="0 0 120 120" class="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="12"></circle>
                <circle cx="60" cy="60" r="46" fill="none" stroke="var(--accent-primary)" stroke-width="12" 
                        [attr.stroke-dasharray]="46 * 2 * 3.14159" 
                        [attr.stroke-dashoffset]="46 * 2 * 3.14159 * (1 - 0.75)"></circle>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-2xl font-bold">{{dataService.students().length}}</span>
                <span class="text-[8px] text-text-tertiary uppercase">Students</span>
              </div>
            </div>
            <div class="space-y-3 flex-1">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-accent-primary"></div>
                  <span class="text-sm text-text-secondary">Division A</span>
                </div>
                <span class="text-sm font-mono font-bold">{{dataService.students().length}}</span>
              </div>
              <div class="flex items-center justify-between opacity-50">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-white/20"></div>
                  <span class="text-sm text-text-secondary">Division B</span>
                </div>
                <span class="text-sm font-mono font-bold">0</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Subjects & Courses (Bar Chart) -->
        <div class="glass-panel p-6">
          <h3 class="text-xs font-bold text-text-secondary uppercase tracking-widest mb-6">Top Subjects & Courses</h3>
          <div class="space-y-4">
            @for (subj of topSubjects; track subj.name) {
              <div class="space-y-1.5">
                <div class="flex justify-between text-[11px]">
                  <span class="text-text-secondary font-medium truncate max-w-[150px]">{{subj.name}}</span>
                  <span class="text-white font-bold font-mono">{{subj.count}}</span>
                </div>
                <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div class="h-full bg-accent-primary rounded-full bar-fill" [style.width.%]="(subj.count / dataService.students().length) * 100"></div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Engagement Overview (Grid) -->
        <div class="glass-panel p-6">
          <h3 class="text-xs font-bold text-text-secondary uppercase tracking-widest mb-6">Engagement Overview</h3>
          <div class="grid grid-cols-2 gap-3">
            @for (item of engagementItems; track item.label) {
              <div class="bg-bg-surface border border-border-default rounded-xl p-3">
                <div class="text-[9px] font-bold text-text-tertiary uppercase tracking-wider mb-2">{{item.label}}</div>
                <div class="h-1 bg-white/5 rounded-full mb-2 overflow-hidden">
                  <div class="h-full" [class]="item.colorClass" [style.width.%]="item.percent"></div>
                </div>
                <div class="flex items-baseline gap-1">
                  <span class="text-lg font-bold" [class]="item.textColorClass">{{item.value}}</span>
                  <span class="text-[9px] text-text-tertiary font-medium">{{item.percent}}%</span>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Analysis Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- VAC Distribution -->
        <div class="glass-panel p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-8 h-8 rounded-lg bg-secondary-blue/10 text-secondary-blue flex items-center justify-center">
              <mat-icon class="text-[18px] w-[18px] h-[18px]">assignment</mat-icon>
            </div>
            <h3 class="text-sm font-bold">VAC Distribution</h3>
          </div>
          <div class="space-y-4">
            @for (vac of vacDistribution; track vac.name) {
              <div class="space-y-1.5">
                <div class="flex justify-between text-[11px]">
                  <span class="text-text-secondary font-medium">{{vac.name}}</span>
                  <span class="text-white font-bold font-mono">{{vac.count}}</span>
                </div>
                <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div class="h-full bg-secondary-blue rounded-full" [style.width.%]="(vac.count / dataService.students().length) * 100"></div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Participation Insights -->
        <div class="glass-panel p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center">
              <mat-icon class="text-[18px] w-[18px] h-[18px]">insights</mat-icon>
            </div>
            <h3 class="text-sm font-bold">Participation Insights</h3>
          </div>
          <div class="space-y-4">
            @for (insight of participationInsights; track insight.label) {
              <div class="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span class="text-xs text-text-secondary">{{insight.label}}</span>
                <span class="text-xs font-mono font-bold" [class]="insight.colorClass">{{insight.value}}</span>
              </div>
            }
          </div>
        </div>

        <!-- Gender & Activity Analysis -->
        <div class="glass-panel p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-8 h-8 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center">
              <mat-icon class="text-[18px] w-[18px] h-[18px]">analytics</mat-icon>
            </div>
            <h3 class="text-sm font-bold">Gender & Activity Analysis</h3>
          </div>
          <div class="space-y-4">
            @for (stat of genderStats; track stat.label) {
              <div class="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span class="text-xs text-text-secondary">{{stat.label}}</span>
                <span class="text-xs font-mono font-bold text-accent-primary">{{stat.value}}</span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Dashboard Panels Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Panel 1: Assigned Class Details -->
        <div class="glass-panel p-6 flex flex-col">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold">Assigned Class Details</h2>
            <button routerLink="/app/students" class="text-sm text-accent-primary hover:underline">View Student List</button>
          </div>
          
          <div class="grid grid-cols-2 gap-4 mb-6 flex-1">
            <div class="bg-bg-surface rounded-xl p-4 border border-border-default">
              <div class="text-xs text-text-tertiary uppercase tracking-wider mb-1">Class</div>
              <div class="font-medium text-lg">TE Computer</div>
            </div>
            <div class="bg-bg-surface rounded-xl p-4 border border-border-default">
              <div class="text-xs text-text-tertiary uppercase tracking-wider mb-1">Division</div>
              <div class="font-medium text-lg">{{dataService.currentUser().division}}</div>
            </div>
            <div class="bg-bg-surface rounded-xl p-4 border border-border-default">
              <div class="text-xs text-text-tertiary uppercase tracking-wider mb-1">Semester</div>
              <div class="font-medium text-lg">{{dataService.currentUser().semester}}</div>
            </div>
            <div class="bg-bg-surface rounded-xl p-4 border border-border-default">
              <div class="text-xs text-text-tertiary uppercase tracking-wider mb-1">Academic Year</div>
              <div class="font-medium text-lg">{{dataService.currentUser().academicYear}}</div>
            </div>
          </div>
        </div>

        <!-- Panel 2: Mentor-Mentee Overview -->
        <div class="glass-panel p-6 flex flex-col">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold">Mentor-Mentee Overview</h2>
            <button routerLink="/app/mentor-mentee" class="text-sm text-accent-primary hover:underline">View All</button>
          </div>
          
          <div class="space-y-3 flex-1">
            @for (mentor of dataService.mentors(); track mentor.id) {
              <div class="flex items-center justify-between p-3 rounded-xl border border-border-default bg-bg-surface hover:border-accent-primary/30 transition-colors"
                   [class.border-accent-primary]="mentor.name.includes('You')"
                   [class.bg-accent-primary]="mentor.name.includes('You') ? '!bg-accent-primary/5' : ''">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-text-secondary">
                    <mat-icon>person</mat-icon>
                  </div>
                  <div>
                    <div class="font-medium text-sm">{{mentor.name}}</div>
                    <div class="text-xs text-text-tertiary">{{mentor.studentCount}} Mentees Assigned</div>
                  </div>
                </div>
                <button class="btn-secondary py-1.5 px-3 text-xs">Open Group</button>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sc-bar-fill {
      transition: width 0.8s ease;
    }
    .bar-fill {
      transition: width 0.8s ease;
    }
  `]
})
export class DashboardComponent {
  dataService = inject(DataService);

  get metrics() {
    const students = this.dataService.students();
    const total = students.length || 1;
    const pendingFees = students.filter(s => s.feeBalance > 0).length;
    const missingRecords = students.filter(s => !s.vac || s.vac === 'Pending' || s.vac === 'None' || !s.mooc1 || s.mooc1 === 'Pending' || s.mooc1 === 'None').length;
    
    const extraFields = new Set<string>();
    students.forEach(s => {
      if (s.extraData) {
        Object.keys(s.extraData).forEach(key => extraFields.add(key));
      }
    });

    return [
      { label: 'Total Students', value: students.length, trend: 'Assigned to Div A', icon: 'people', colorClass: 'text-secondary-blue', bgClass: 'bg-secondary-blue', percent: 100, route: '/app/students' },
      { label: 'Mentor Groups', value: this.dataService.mentors().length, trend: 'Under your purview', icon: 'groups', colorClass: 'text-accent-primary', bgClass: 'bg-accent-primary', percent: 100, route: '/app/mentor-mentee' },
      { label: 'Instructors', value: this.dataService.instructors().length, trend: 'Teaching Div A', icon: 'school', colorClass: 'text-white', bgClass: 'bg-white', percent: 100, route: '/app/instructors' },
      { label: 'Extra Fields', value: extraFields.size, trend: 'Detected in sheets', icon: 'table_view', colorClass: 'text-success', bgClass: 'bg-success', percent: 85, route: '/app/sheet-view' },
      { label: 'Pending Fees', value: pendingFees, trend: 'Students with balance', icon: 'account_balance_wallet', colorClass: 'text-warning', bgClass: 'bg-warning', percent: (pendingFees / total) * 100, route: '/app/students' },
      { label: 'Missing Records', value: missingRecords, trend: 'Incomplete profiles', icon: 'warning', colorClass: 'text-danger', bgClass: 'bg-danger', percent: (missingRecords / total) * 100, route: '/app/students' },
    ];
  }

  get topSubjects() {
    const students = this.dataService.students();
    const subjects: Record<string, number> = {};
    
    students.forEach(s => {
      if (s.vac && s.vac !== 'Pending' && s.vac !== 'None') {
        subjects[s.vac] = (subjects[s.vac] || 0) + 1;
      }
      if (s.mooc1 && s.mooc1 !== 'Pending' && s.mooc1 !== 'None') {
        subjects[s.mooc1] = (subjects[s.mooc1] || 0) + 1;
      }
    });

    return Object.entries(subjects)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  get engagementItems() {
    const students = this.dataService.students();
    const total = students.length || 1;
    
    const mooc = students.filter(s => (s.mooc1 && s.mooc1 !== 'Pending' && s.mooc1 !== 'None') || (s.mooc2 && s.mooc2 !== 'Pending' && s.mooc2 !== 'None')).length;
    const linkedin = students.filter(s => s.linkedin).length;
    const hackathon = students.filter(s => s.hackathon && s.hackathon !== 'None').length;
    const github = students.filter(s => s.github).length;
    const internship = students.filter(s => s.internship && s.internship !== 'None').length;
    const mooc2 = students.filter(s => (s.mooc1 && s.mooc1 !== 'Pending' && s.mooc1 !== 'None') && (s.mooc2 && s.mooc2 !== 'Pending' && s.mooc2 !== 'None')).length;

    return [
      { label: 'MOOC', value: mooc, percent: Math.round((mooc / total) * 100), colorClass: 'bg-success', textColorClass: 'text-success' },
      { label: 'LinkedIn', value: linkedin, percent: Math.round((linkedin / total) * 100), colorClass: 'bg-secondary-blue', textColorClass: 'text-secondary-blue' },
      { label: 'Hackathon', value: hackathon, percent: Math.round((hackathon / total) * 100), colorClass: 'bg-danger', textColorClass: 'text-danger' },
      { label: 'GitHub', value: github, percent: Math.round((github / total) * 100), colorClass: 'bg-accent-primary', textColorClass: 'text-accent-primary' },
      { label: 'Internship', value: internship, percent: Math.round((internship / total) * 100), colorClass: 'bg-warning', textColorClass: 'text-warning' },
      { label: '2x MOOC', value: mooc2, percent: Math.round((mooc2 / total) * 100), colorClass: 'bg-purple-500', textColorClass: 'text-purple-500' },
    ];
  }

  get vacDistribution() {
    const students = this.dataService.students();
    const vacs: Record<string, number> = {};
    
    students.forEach(s => {
      if (s.vac && s.vac !== 'Pending' && s.vac !== 'None') {
        vacs[s.vac] = (vacs[s.vac] || 0) + 1;
      }
    });

    return Object.entries(vacs)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  get participationInsights() {
    const students = this.dataService.students();
    const total = students.length || 1;
    
    const both = students.filter(s => s.internship && s.internship !== 'None' && s.hackathon && s.hackathon !== 'None').length;
    const all3 = students.filter(s => s.internship && s.internship !== 'None' && s.hackathon && s.hackathon !== 'None' && s.mooc1 && s.mooc1 !== 'Pending').length;
    const none = students.filter(s => !s.internship && !s.hackathon && !s.mooc1 && !s.github && !s.linkedin).length;
    const feeDue = students.filter(s => s.feeBalance > 0).length;

    return [
      { label: 'Intern + Hackathon', value: `${both} (${Math.round((both / total) * 100)}%)`, colorClass: 'text-success' },
      { label: 'All 3 activities', value: all3, colorClass: 'text-success' },
      { label: 'No activity recorded', value: `${none} (${Math.round((none / total) * 100)}%)`, colorClass: none > 5 ? 'text-warning' : 'text-success' },
      { label: 'Fee balance pending', value: feeDue, colorClass: feeDue > 0 ? 'text-danger' : 'text-success' },
    ];
  }

  get genderStats() {
    const students = this.dataService.students();
    const male = students.filter(s => s.gender === 'Male');
    const female = students.filter(s => s.gender === 'Female');
    
    const maleIntern = male.filter(s => s.internship && s.internship !== 'None').length;
    const femaleIntern = female.filter(s => s.internship && s.internship !== 'None').length;
    
    return [
      { label: 'Male internship rate', value: `${male.length ? Math.round((maleIntern / male.length) * 100) : 0}%` },
      { label: 'Female internship rate', value: `${female.length ? Math.round((femaleIntern / female.length) * 100) : 0}%` },
      { label: 'M:F ratio', value: `${male.length}:${female.length}` },
      { label: 'GitHub penetration', value: `${Math.round((students.filter(s => s.github).length / (students.length || 1)) * 100)}%` },
    ];
  }
}
