import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatIconModule, FormsModule],
  template: `
    <div class="min-h-screen flex flex-col md:flex-row bg-bg-page">
      <!-- Left Column (Visual Branding) -->
      <div class="hidden md:flex flex-1 flex-col justify-center items-center p-12 relative overflow-hidden" style="background: linear-gradient(135deg, #0a0a12 0%, #050508 100%);">
        <!-- Subtle Pattern Overlay -->
        <div class="absolute inset-0 opacity-5" style="background-image: radial-gradient(#D4AF37 1px, transparent 1px); background-size: 32px 32px;"></div>
        
        <div class="relative z-10 max-w-md text-center">
          <div class="w-32 h-32 mx-auto mb-8 rounded-3xl bg-bg-elevated border border-border-default shadow-[0_0_60px_rgba(212,175,55,0.15)] flex items-center justify-center">
            <mat-icon class="text-6xl text-accent-primary w-16 h-16 flex items-center justify-center">account_balance</mat-icon>
          </div>
          <h1 class="text-4xl font-bold mb-4 tracking-tight">GFM Academic Management</h1>
          <p class="text-text-secondary text-lg leading-relaxed">Student records, mentor groups, and class operations in one secure dashboard.</p>
        </div>
      </div>

      <!-- Right Column (Login Form) -->
      <div class="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative">
        <div class="w-full max-w-[420px] glass-panel p-8 md:p-10">
          <div class="mb-8 text-center md:text-left">
            <h2 class="text-3xl font-bold mb-2">Faculty Login</h2>
            <p class="text-text-secondary">Sign in with your GFM credentials</p>
          </div>

          <form (ngSubmit)="login()" class="space-y-6">
            <div class="space-y-2">
              <label class="text-sm font-medium text-text-secondary" for="email">Faculty ID / Email</label>
              <input type="text" id="email" [(ngModel)]="email" name="email" class="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-primary/50 transition-colors" placeholder="Enter your ID or email" required>
            </div>
            
            <div class="space-y-2">
              <label class="text-sm font-medium text-text-secondary" for="password">Password</label>
              <input type="password" id="password" [(ngModel)]="password" name="password" class="w-full bg-bg-surface border border-border-default rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-primary/50 transition-colors" placeholder="••••••••" required>
            </div>

            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" class="w-4 h-4 rounded border-border-default bg-bg-surface text-accent-primary focus:ring-accent-primary/50">
                <span class="text-sm text-text-secondary">Remember this device</span>
              </label>
              <a href="#" class="text-sm text-accent-primary hover:underline">Forgot password?</a>
            </div>

            <button type="submit" class="w-full btn-primary py-3 text-lg">
              Sign In
            </button>

            <div class="relative flex items-center py-2">
              <div class="flex-grow border-t border-border-default"></div>
              <span class="flex-shrink-0 mx-4 text-text-tertiary text-sm">or</span>
              <div class="flex-grow border-t border-border-default"></div>
            </div>

            <button type="button" class="w-full btn-secondary py-3">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" class="w-5 h-5 mr-2">
              Continue with Institutional Google
            </button>
          </form>

          <p class="mt-8 text-center text-xs text-text-tertiary">
            <mat-icon class="inline-block align-middle text-[14px] w-[14px] h-[14px] mr-1">lock</mat-icon>
            Only authorized faculty members can access dashboard data
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  router = inject(Router);
  email = '';
  password = '';

  login() {
    // Mock login
    this.router.navigate(['/app/dashboard']);
  }
}
