import { Component, inject, computed } from '@angular/core';
import { DataService } from '../../services/data.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analysis',
  standalone: true,
  imports: [MatIconModule, CommonModule],
  template: `
    <div class="space-y-8 pb-12">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight mb-1">Analysis & Insights</h1>
          <p class="text-text-secondary">Detailed breakdown of student participation and engagement</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- VAC Distribution -->
        <div class="glass-panel p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-xl bg-secondary-blue/10 text-secondary-blue flex items-center justify-center">
              <mat-icon>assignment</mat-icon>
            </div>
            <h2 class="text-lg font-bold text-white">VAC Distribution</h2>
          </div>
          
          <div class="space-y-4">
            @for (vac of vacDistribution(); track vac.name) {
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-text-secondary truncate pr-2" [title]="vac.name">{{vac.name}}</span>
                  <span class="font-mono text-secondary-blue font-bold">{{vac.count}}</span>
                </div>
                <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div class="h-full bg-secondary-blue rounded-full bar-fill" [style.width.%]="(vac.count / totalStudents()) * 100"></div>
                </div>
              </div>
            }
            @if (vacDistribution().length === 0) {
              <p class="text-sm text-text-tertiary">No VAC data available</p>
            }
          </div>
        </div>

        <!-- Participation Insights -->
        <div class="glass-panel p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
              <mat-icon>trending_up</mat-icon>
            </div>
            <h2 class="text-lg font-bold text-white">Participation Insights</h2>
          </div>
          
          <div class="space-y-0 divide-y divide-border-default/50">
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-text-secondary">Intern + Hackathon</span>
              <span class="text-sm font-mono font-bold text-success">{{insights().internAndHack}} ({{pct(insights().internAndHack)}}%)</span>
            </div>
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-text-secondary">All 3 activities</span>
              <span class="text-sm font-mono font-bold text-success">{{insights().allThree}}</span>
            </div>
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-text-secondary">Multiple hackathons</span>
              <span class="text-sm font-mono font-bold text-secondary-blue">{{insights().multipleHack}}</span>
            </div>
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-text-secondary">No activity recorded</span>
              <span class="text-sm font-mono font-bold" [class.text-warning]="insights().none > 5" [class.text-success]="insights().none <= 5">
                {{insights().none}} ({{pct(insights().none)}}%)
              </span>
            </div>
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-text-secondary">Both MOOCs filled</span>
              <span class="text-sm font-mono font-bold text-success">{{insights().bothMoocs}}</span>
            </div>
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-text-secondary">Fee balance pending</span>
              <span class="text-sm font-mono font-bold" [class.text-danger]="insights().feeDue > 0" [class.text-success]="insights().feeDue === 0">
                {{insights().feeDue}}
              </span>
            </div>
          </div>
        </div>

        <!-- Gender Activity -->
        <div class="glass-panel p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
              <mat-icon>balance</mat-icon>
            </div>
            <h2 class="text-lg font-bold text-white">Gender Activity</h2>
          </div>
          
          <div class="space-y-0 divide-y divide-border-default/50">
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-text-secondary">Male internship rate</span>
              <span class="text-sm font-mono font-bold text-secondary-blue">{{genderStats().maleInternRate}}%</span>
            </div>
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-text-secondary">Female internship rate</span>
              <span class="text-sm font-mono font-bold" [class.text-success]="+genderStats().femaleInternRate > 10" [class.text-warning]="+genderStats().femaleInternRate <= 10">
                {{genderStats().femaleInternRate}}%
              </span>
            </div>
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-text-secondary">Male hackathon rate</span>
              <span class="text-sm font-mono font-bold text-secondary-blue">{{genderStats().maleHackRate}}%</span>
            </div>
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-text-secondary">Female hackathon rate</span>
              <span class="text-sm font-mono font-bold text-secondary-blue">{{genderStats().femaleHackRate}}%</span>
            </div>
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-text-secondary">M:F ratio</span>
              <span class="text-sm font-mono font-bold text-secondary-blue">{{genderStats().male}}:{{genderStats().female}}</span>
            </div>
            <div class="flex items-center justify-between py-3">
              <span class="text-sm text-text-secondary">GitHub penetration</span>
              <span class="text-sm font-mono font-bold" [class.text-success]="+genderStats().githubRate > 50" [class.text-warning]="+genderStats().githubRate <= 50">
                {{genderStats().githubRate}}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bar-fill {
      transition: width 0.8s ease;
    }
  `]
})
export class AnalysisComponent {
  dataService = inject(DataService);

  totalStudents = computed(() => this.dataService.students().length);

  pct(val: number): string {
    const total = this.totalStudents();
    return total ? ((val / total) * 100).toFixed(0) : '0';
  }

  vacDistribution = computed(() => {
    const students = this.dataService.students();
    const dist = new Map<string, number>();
    
    students.forEach(s => {
      if (s.vac && s.vac !== 'Pending' && s.vac !== 'None') {
        const name = s.vac.replace(/\s+/g, ' ').trim();
        dist.set(name, (dist.get(name) || 0) + 1);
      }
    });
    
    return Array.from(dist.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  });

  insights = computed(() => {
    const students = this.dataService.students();
    let internAndHack = 0;
    let allThree = 0;
    let multipleHack = 0;
    let none = 0;
    let bothMoocs = 0;
    let feeDue = 0;

    students.forEach(s => {
      const hasIntern = s.internship && s.internship !== 'Pending' && s.internship !== 'None';
      const hasHack = s.hackathon && s.hackathon !== 'Pending' && s.hackathon !== 'None';
      const hasMooc1 = s.mooc1 && s.mooc1 !== 'Pending' && s.mooc1 !== 'None';
      const hasMooc2 = s.mooc2 && s.mooc2 !== 'Pending' && s.mooc2 !== 'None';
      const hasGithub = s.github && s.github !== 'Pending' && s.github !== 'None';
      const hasLinkedin = s.linkedin && s.linkedin !== 'Pending' && s.linkedin !== 'None';

      if (hasIntern && hasHack) internAndHack++;
      if (hasIntern && hasHack && hasMooc1) allThree++;
      if (hasHack && s.hackathon.includes(',')) multipleHack++;
      if (!hasIntern && !hasHack && !hasMooc1 && !hasGithub && !hasLinkedin) none++;
      if (hasMooc1 && hasMooc2) bothMoocs++;
      if (s.feeBalance > 0) feeDue++;
    });

    return { internAndHack, allThree, multipleHack, none, bothMoocs, feeDue };
  });

  genderStats = computed(() => {
    const students = this.dataService.students();
    let male = 0;
    let female = 0;
    let maleIntern = 0;
    let femIntern = 0;
    let maleHack = 0;
    let femHack = 0;
    let github = 0;

    students.forEach(s => {
      const hasIntern = s.internship && s.internship !== 'Pending' && s.internship !== 'None';
      const hasHack = s.hackathon && s.hackathon !== 'Pending' && s.hackathon !== 'None';
      const hasGithub = s.github && s.github !== 'Pending' && s.github !== 'None';

      if (s.gender === 'Male') {
        male++;
        if (hasIntern) maleIntern++;
        if (hasHack) maleHack++;
      } else if (s.gender === 'Female') {
        female++;
        if (hasIntern) femIntern++;
        if (hasHack) femHack++;
      }
      if (hasGithub) github++;
    });

    const total = students.length;

    return {
      male,
      female,
      maleInternRate: male ? ((maleIntern / male) * 100).toFixed(0) : '0',
      femaleInternRate: female ? ((femIntern / female) * 100).toFixed(0) : '0',
      maleHackRate: male ? ((maleHack / male) * 100).toFixed(0) : '0',
      femaleHackRate: female ? ((femHack / female) * 100).toFixed(0) : '0',
      githubRate: total ? ((github / total) * 100).toFixed(0) : '0'
    };
  });
}
