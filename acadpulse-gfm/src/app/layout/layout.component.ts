import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { DataService } from '../services/data.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="min-h-screen bg-bg-page flex flex-col md:flex-row">
      <!-- Sidebar -->
      <aside class="w-full md:w-64 bg-bg-surface border-r border-border-default flex flex-col hidden md:flex h-screen sticky top-0">
        <div class="p-6 flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center text-bg-page font-bold text-xl">A</div>
          <span class="font-bold text-xl tracking-tight">AcadPulse GFM</span>
        </div>
        
        <nav class="flex-1 px-4 py-4 flex flex-col gap-1 overflow-y-auto">
          @for (item of navItems; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="bg-accent-primary/10 text-accent-primary border-accent-primary/30" [routerLinkActiveOptions]="{exact: false}" class="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:text-white hover:bg-white/5 border border-transparent transition-all duration-200">
              <mat-icon class="text-[20px] w-5 h-5 flex items-center justify-center">{{item.icon}}</mat-icon>
              <span class="font-medium">{{item.label}}</span>
            </a>
          }
        </nav>
        
        <div class="p-4 border-t border-border-default">
          <div class="flex items-center gap-3 px-4 py-3">
            <div class="w-10 h-10 rounded-full bg-secondary-blue/20 border border-secondary-blue/30 flex items-center justify-center text-secondary-blue font-bold">
              {{dataService.currentUser().name.charAt(4)}}
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-medium text-white truncate w-32">{{dataService.currentUser().name}}</span>
              <span class="text-xs text-text-tertiary">GFM</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col min-h-screen overflow-hidden">
        <!-- Topbar -->
        <header class="h-[72px] bg-bg-surface/80 backdrop-blur-md border-b border-border-default sticky top-0 z-30 flex items-center justify-between px-4 md:px-8">
          <div class="flex items-center gap-4 md:hidden">
            <div class="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center text-bg-page font-bold text-xl">A</div>
            <span class="font-bold text-xl tracking-tight">AcadPulse</span>
          </div>
          
          <div class="hidden md:flex items-center bg-bg-elevated border border-border-default rounded-xl px-4 py-2 w-96 focus-within:border-accent-primary/50 transition-colors">
            <mat-icon class="text-text-tertiary mr-2">search</mat-icon>
            <input type="text" placeholder="Search students, subjects, files..." class="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-text-tertiary">
            <div class="flex items-center gap-1 ml-2">
              <kbd class="bg-white/10 rounded px-1.5 py-0.5 text-[10px] text-text-secondary font-mono">⌘</kbd>
              <kbd class="bg-white/10 rounded px-1.5 py-0.5 text-[10px] text-text-secondary font-mono">K</kbd>
            </div>
          </div>
          
          <div class="flex items-center gap-4">
            <button class="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-text-secondary transition-colors relative">
              <mat-icon>notifications</mat-icon>
              <span class="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-accent-primary shadow-[0_0_8px_rgba(212,175,55,0.8)]"></span>
            </button>
            <button class="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-text-secondary transition-colors">
              <mat-icon>dark_mode</mat-icon>
            </button>
            <button (click)="logout()" class="hidden md:flex items-center gap-2 text-sm font-medium text-danger hover:bg-danger/10 px-3 py-2 rounded-lg transition-colors">
              <mat-icon class="text-[18px] w-[18px] h-[18px]">logout</mat-icon>
              Logout
            </button>
          </div>
        </header>
        
        <!-- Page Content -->
        <div class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div class="max-w-7xl mx-auto">
            <router-outlet></router-outlet>
          </div>
        </div>
      </main>
      
      <!-- Mobile Nav Bar (Bottom) -->
      <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-bg-surface border-t border-border-default flex items-center justify-around p-2 z-40 pb-safe">
        @for (item of mobileNavItems; track item.path) {
          <a [routerLink]="item.path" routerLinkActive="text-accent-primary" [routerLinkActiveOptions]="{exact: false}" class="flex flex-col items-center p-2 text-text-tertiary">
            <mat-icon>{{item.icon}}</mat-icon>
            <span class="text-[10px] mt-1 font-medium">{{item.label}}</span>
          </a>
        }
      </nav>
    </div>
  `
})
export class LayoutComponent {
  dataService = inject(DataService);
  router = inject(Router);

  navItems = [
    { path: '/app/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/app/students', label: 'Students', icon: 'people' },
    { path: '/app/divisions', label: 'Divisions', icon: 'account_balance' },
    { path: '/app/subjects', label: 'Subjects', icon: 'menu_book' },
    { path: '/app/moocs', label: 'MOOC Details', icon: 'school' },
    { path: '/app/internships', label: 'Internships', icon: 'work' },
    { path: '/app/hackathons', label: 'Hackathons', icon: 'emoji_events' },
    { path: '/app/github', label: 'GitHub Profiles', icon: 'code' },
    { path: '/app/linkedin', label: 'LinkedIn Profiles', icon: 'work' },
    { path: '/app/fees', label: 'Fees', icon: 'payments' },
    { path: '/app/analysis', label: 'Analysis', icon: 'analytics' },
    { path: '/app/mentor-mentee', label: 'Mentor-Mentee', icon: 'groups' },
    { path: '/app/instructors', label: 'Instructors & Subjects', icon: 'school' },
    { path: '/app/upload', label: 'Upload Data', icon: 'cloud_upload' },
    { path: '/app/sheet-view', label: 'Sheet View', icon: 'table_view' },
    { path: '/app/settings', label: 'Settings', icon: 'settings' },
  ];

  mobileNavItems = [
    { path: '/app/dashboard', label: 'Home', icon: 'dashboard' },
    { path: '/app/students', label: 'Students', icon: 'people' },
    { path: '/app/upload', label: 'Upload', icon: 'cloud_upload' },
    { path: '/app/settings', label: 'Settings', icon: 'settings' },
  ];

  logout() {
    this.router.navigate(['/login']);
  }
}
