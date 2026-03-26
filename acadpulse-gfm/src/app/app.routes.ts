import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  {
    path: 'app',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'students', loadComponent: () => import('./pages/students/students.component').then(m => m.StudentsComponent) },
      { path: 'divisions', loadComponent: () => import('./pages/divisions/divisions.component').then(m => m.DivisionsComponent) },
      { path: 'subjects', loadComponent: () => import('./pages/subjects/subjects.component').then(m => m.SubjectsComponent) },
      { path: 'analysis', loadComponent: () => import('./pages/analysis/analysis.component').then(m => m.AnalysisComponent) },
      { path: 'mentor-mentee', loadComponent: () => import('./pages/mentor-mentee/mentor-mentee.component').then(m => m.MentorMenteeComponent) },
      { path: 'instructors', loadComponent: () => import('./pages/instructors/instructors.component').then(m => m.InstructorsComponent) },
      { path: 'upload', loadComponent: () => import('./pages/upload/upload.component').then(m => m.UploadComponent) },
      { path: 'moocs', loadComponent: () => import('./pages/moocs/moocs.component').then(m => m.MoocsComponent) },
      { path: 'internships', loadComponent: () => import('./pages/internships/internships.component').then(m => m.InternshipsComponent) },
      { path: 'hackathons', loadComponent: () => import('./pages/hackathons/hackathons.component').then(m => m.HackathonsComponent) },
      { path: 'github', loadComponent: () => import('./pages/github/github.component').then(m => m.GithubComponent) },
      { path: 'linkedin', loadComponent: () => import('./pages/linkedin/linkedin.component').then(m => m.LinkedinComponent) },
      { path: 'fees', loadComponent: () => import('./pages/fees/fees.component').then(m => m.FeesComponent) },
      { path: 'sheet-view', loadComponent: () => import('./pages/sheet-view/sheet-view.component').then(m => m.SheetViewComponent) },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) },
    ]
  }
];
