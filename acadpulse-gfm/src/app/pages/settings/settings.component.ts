import { Component, inject } from '@angular/core';
import { DataService } from '../../services/data.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="space-y-8 pb-12 max-w-4xl">
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-bold tracking-tight mb-1">Settings</h1>
        <p class="text-text-secondary">Manage your profile and dashboard preferences</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <!-- Settings Nav -->
        <div class="col-span-1 space-y-1">
          <button class="w-full text-left px-4 py-3 rounded-xl bg-accent-primary/10 text-accent-primary font-medium border border-accent-primary/30">
            Profile Information
          </button>
          <button class="w-full text-left px-4 py-3 rounded-xl text-text-secondary hover:text-white hover:bg-white/5 transition-colors">
            Account Security
          </button>
          <button class="w-full text-left px-4 py-3 rounded-xl text-text-secondary hover:text-white hover:bg-white/5 transition-colors">
            Data Preferences
          </button>
          <button class="w-full text-left px-4 py-3 rounded-xl text-text-secondary hover:text-white hover:bg-white/5 transition-colors">
            Appearance
          </button>
        </div>

        <!-- Settings Content -->
        <div class="col-span-1 md:col-span-2 space-y-6">
          
          <div class="glass-panel p-6">
            <h2 class="text-xl font-semibold mb-6">Profile Information</h2>
            
            <div class="flex items-center gap-6 mb-8">
              <div class="w-20 h-20 rounded-full bg-secondary-blue/20 text-secondary-blue flex items-center justify-center text-3xl font-bold border border-secondary-blue/30">
                {{dataService.currentUser().name.charAt(4)}}
              </div>
              <div>
                <button class="btn-secondary mb-2">Change Avatar</button>
                <p class="text-xs text-text-tertiary">JPG, GIF or PNG. Max size of 800K</p>
              </div>
            </div>

            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-sm font-medium text-text-secondary" for="fullName">Full Name</label>
                  <input type="text" id="fullName" [value]="dataService.currentUser().name" class="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent-primary/50">
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium text-text-secondary" for="facultyId">Faculty ID</label>
                  <input type="text" id="facultyId" [value]="dataService.currentUser().id" disabled class="w-full bg-bg-surface/50 border border-border-default rounded-xl px-4 py-2 text-text-tertiary cursor-not-allowed">
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium text-text-secondary" for="department">Department</label>
                <input type="text" id="department" [value]="dataService.currentUser().department" disabled class="w-full bg-bg-surface/50 border border-border-default rounded-xl px-4 py-2 text-text-tertiary cursor-not-allowed">
              </div>

              <div class="grid grid-cols-3 gap-4">
                <div class="space-y-2">
                  <label class="text-sm font-medium text-text-secondary" for="academicYear">Academic Year</label>
                  <input type="text" id="academicYear" [value]="dataService.currentUser().academicYear" class="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent-primary/50">
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium text-text-secondary" for="semester">Semester</label>
                  <input type="text" id="semester" [value]="dataService.currentUser().semester" class="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent-primary/50">
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium text-text-secondary" for="division">Division</label>
                  <input type="text" id="division" [value]="dataService.currentUser().division" class="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent-primary/50">
                </div>
              </div>
            </div>
            
            <div class="mt-8 pt-6 border-t border-border-default flex justify-end">
              <button class="btn-primary">Save Changes</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class SettingsComponent {
  dataService = inject(DataService);
}
