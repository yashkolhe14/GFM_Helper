import { Component, inject, signal, computed } from '@angular/core';
import { DataService, Instructor } from '../../services/data.service';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-instructors',
  standalone: true,
  imports: [MatIconModule, FormsModule, CommonModule],
  template: `
    <div class="space-y-8 pb-12">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight mb-1">Instructors & Subjects</h1>
          <p class="text-text-secondary">Teachers and subjects associated with your class</p>
        </div>
        <div class="flex items-center gap-3">
          <button class="btn-secondary">
            <mat-icon class="text-[20px] w-5 h-5">print</mat-icon>
            Print Timetable
          </button>
        </div>
      </div>

      <!-- Instructors Section -->
      <section>
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <mat-icon class="text-accent-primary">person</mat-icon> Instructors
          </h2>
          <div class="flex items-center gap-3">
            <div class="relative">
              <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary w-4 h-4 text-[16px]">search</mat-icon>
              <input 
                type="text" 
                placeholder="Search instructors..." 
                class="input-field pl-9 py-1.5 text-sm w-full md:w-64"
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
              >
            </div>
            <select 
              class="input-field py-1.5 px-3 text-sm"
              [ngModel]="sortBy()"
              (ngModelChange)="sortBy.set($event)"
            >
              <option value="name">Sort by Name</option>
              <option value="subject">Sort by Subject</option>
              <option value="room">Sort by Room</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          @for (instructor of filteredAndSortedInstructors(); track instructor.id) {
            <div class="glass-card p-5 flex flex-col">
              <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 rounded-full bg-secondary-blue/20 text-secondary-blue flex items-center justify-center text-xl font-bold border border-secondary-blue/30">
                  {{instructor.name.charAt(instructor.name.indexOf('.') + 2) || instructor.name.charAt(0)}}
                </div>
                <span class="status-pill status-neutral text-[10px] py-0">{{instructor.type}}</span>
              </div>
              
              <h3 class="font-bold text-lg text-white mb-1">{{instructor.name}}</h3>
              <p class="text-sm text-accent-primary mb-4">{{instructor.subject}}</p>
              
              <div class="mt-auto space-y-2">
                <div class="flex items-center gap-2 text-xs text-text-secondary">
                  <mat-icon class="text-[14px] w-[14px] h-[14px]">room</mat-icon>
                  {{instructor.room}}
                </div>
                <div class="flex items-center gap-2 text-xs text-text-secondary">
                  <mat-icon class="text-[14px] w-[14px] h-[14px]">email</mat-icon>
                  {{instructor.email}}
                </div>
              </div>
              
              <div class="mt-4 pt-4 border-t border-border-default">
                <button class="w-full btn-secondary py-1.5 text-sm" (click)="openContactModal(instructor)">Contact</button>
              </div>
            </div>
          }
          @if (filteredAndSortedInstructors().length === 0) {
            <div class="col-span-full py-8 text-center text-text-secondary bg-white/5 rounded-xl border border-border-default">
              No instructors found matching your search.
            </div>
          }
        </div>
      </section>

      <!-- Subjects Section -->
      <section>
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2 mt-8">
          <mat-icon class="text-accent-primary">menu_book</mat-icon> Subjects
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (instructor of dataService.instructors(); track instructor.id) {
            <div class="glass-panel flex flex-col hover:border-accent-primary/30 transition-colors cursor-pointer" (click)="toggleSubject(instructor.id)" tabindex="0" (keydown.enter)="toggleSubject(instructor.id)">
              <div class="p-5 flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-text-secondary">
                  <mat-icon>auto_stories</mat-icon>
                </div>
                <div class="flex-1">
                  <h3 class="font-bold text-white">{{instructor.subject}}</h3>
                  <p class="text-sm text-text-secondary">Taught by {{instructor.name}}</p>
                </div>
                <button class="text-text-tertiary hover:text-accent-primary transition-colors">
                  <mat-icon>{{expandedSubjectId() === instructor.id ? 'expand_less' : 'expand_more'}}</mat-icon>
                </button>
              </div>
              
              @if (expandedSubjectId() === instructor.id) {
                <div class="px-5 pb-5 pt-2 border-t border-border-default/50 text-sm">
                  <div class="mb-3">
                    <h4 class="font-semibold text-white mb-1">Syllabus Highlights</h4>
                    <ul class="list-disc list-inside text-text-secondary space-y-1">
                      @for (item of instructor.syllabus; track item) {
                        <li>{{item}}</li>
                      }
                      @if (!instructor.syllabus?.length) {
                        <li>No syllabus details available.</li>
                      }
                    </ul>
                  </div>
                  <div>
                    <h4 class="font-semibold text-white mb-1">Learning Objectives</h4>
                    <ul class="list-disc list-inside text-text-secondary space-y-1">
                      @for (item of instructor.learningObjectives; track item) {
                        <li>{{item}}</li>
                      }
                      @if (!instructor.learningObjectives?.length) {
                        <li>No learning objectives available.</li>
                      }
                    </ul>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </section>

      <!-- Timetable Snapshot -->
      <section>
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 mt-8">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <mat-icon class="text-accent-primary">calendar_today</mat-icon> Weekly Timetable Snapshot
          </h2>
          <div class="flex items-center gap-3">
            <button class="btn-secondary px-2" (click)="changeDay(-1)" [disabled]="days.indexOf(selectedDay()) === 0">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <select 
              id="daySelect"
              class="input-field py-1.5 px-3 text-sm font-bold w-32 text-center"
              [ngModel]="selectedDay()"
              (ngModelChange)="selectedDay.set($event)"
            >
              @for (day of days; track day) {
                <option [value]="day">{{day}}</option>
              }
            </select>
            <button class="btn-secondary px-2" (click)="changeDay(1)" [disabled]="days.indexOf(selectedDay()) === days.length - 1">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        </div>
        <div class="glass-panel overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr class="border-b border-border-default bg-white/5">
                  <th class="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider w-24">Time</th>
                  @for (day of days; track day) {
                    <th class="p-4 text-xs font-semibold uppercase tracking-wider"
                        [ngClass]="selectedDay() === day ? 'text-accent-primary bg-accent-primary/5' : 'text-text-secondary'">
                      {{day}}
                    </th>
                  }
                </tr>
              </thead>
              <tbody class="divide-y divide-border-default">
                @for (timeSlot of ['09:00 AM', '10:00 AM', '11:15 AM']; track timeSlot) {
                  @if ($index === 2) {
                    <tr class="bg-white/5">
                      <td class="p-2 text-center text-xs text-text-tertiary uppercase tracking-widest" colspan="6">Break</td>
                    </tr>
                  }
                  <tr class="hover:bg-white/5 transition-colors">
                    <td class="p-4 text-xs font-mono text-text-tertiary">{{timeSlot}}</td>
                    @for (day of days; track day) {
                      <td class="p-4" [ngClass]="selectedDay() === day ? 'bg-accent-primary/5 border-x border-accent-primary/10' : ''">
                        @if (getTimetableEntry(day, timeSlot); as entry) {
                          <div class="text-sm font-medium" [ngClass]="selectedDay() === day ? 'text-accent-primary' : 'text-white'">{{entry.subject}}</div>
                          <div class="text-xs text-text-tertiary">{{entry.room}}</div>
                        } @else {
                          <div class="text-xs text-text-tertiary opacity-50">-</div>
                        }
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>

    <!-- Contact Modal -->
    @if (selectedInstructorForContact()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div class="glass-panel w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-white">Contact Instructor</h3>
            <button class="text-text-tertiary hover:text-white transition-colors" (click)="closeContactModal()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          
          <div class="mb-4">
            <p class="text-sm text-text-secondary mb-1">To:</p>
            <div class="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-border-default">
              <div class="w-8 h-8 rounded-full bg-secondary-blue/20 text-secondary-blue flex items-center justify-center font-bold">
                {{selectedInstructorForContact()!.name.charAt(selectedInstructorForContact()!.name.indexOf('.') + 2) || selectedInstructorForContact()!.name.charAt(0)}}
              </div>
              <div>
                <p class="text-sm font-medium text-white">{{selectedInstructorForContact()!.name}}</p>
                <p class="text-xs text-text-tertiary">{{selectedInstructorForContact()!.email}}</p>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label for="emailSubject" class="block text-sm font-medium text-text-secondary mb-1">Subject</label>
              <input type="text" id="emailSubject" class="input-field w-full" placeholder="Enter subject" [ngModel]="emailSubject()" (ngModelChange)="emailSubject.set($event)">
            </div>
            <div>
              <label for="emailBody" class="block text-sm font-medium text-text-secondary mb-1">Message</label>
              <textarea id="emailBody" rows="4" class="input-field w-full resize-none" placeholder="Type your message here..." [ngModel]="emailBody()" (ngModelChange)="emailBody.set($event)"></textarea>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button class="btn-secondary" (click)="closeContactModal()">Cancel</button>
            <button class="btn-primary" (click)="sendEmail()" [disabled]="!emailSubject() || !emailBody()">
              <mat-icon class="w-4 h-4 text-[16px] mr-2">send</mat-icon>
              Send Message
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class InstructorsComponent {
  dataService = inject(DataService);

  searchQuery = signal('');
  sortBy = signal<'name' | 'subject' | 'room'>('name');

  filteredAndSortedInstructors = computed(() => {
    let instructors = this.dataService.instructors();
    const query = this.searchQuery().toLowerCase();
    
    if (query) {
      instructors = instructors.filter(i => 
        i.name.toLowerCase().includes(query) || 
        i.subject.toLowerCase().includes(query)
      );
    }

    instructors = [...instructors].sort((a, b) => {
      if (this.sortBy() === 'name') {
        return a.name.localeCompare(b.name);
      } else if (this.sortBy() === 'subject') {
        return a.subject.localeCompare(b.subject);
      } else {
        return a.room.localeCompare(b.room);
      }
    });

    return instructors;
  });

  // Contact Modal
  selectedInstructorForContact = signal<Instructor | null>(null);
  emailSubject = signal('');
  emailBody = signal('');

  openContactModal(instructor: Instructor) {
    this.selectedInstructorForContact.set(instructor);
    this.emailSubject.set(`Inquiry regarding ${instructor.subject}`);
    this.emailBody.set('');
  }

  closeContactModal() {
    this.selectedInstructorForContact.set(null);
  }

  sendEmail() {
    // Mock sending email
    console.log('Sending email to', this.selectedInstructorForContact()?.email);
    console.log('Subject:', this.emailSubject());
    console.log('Body:', this.emailBody());
    this.closeContactModal();
  }

  // Expandable Subjects
  expandedSubjectId = signal<string | null>(null);

  toggleSubject(id: string) {
    this.expandedSubjectId.update(current => current === id ? null : id);
  }

  // Timetable
  selectedDay = signal<string>('Wednesday');
  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  changeDay(dir: number) {
    const currentIndex = this.days.indexOf(this.selectedDay());
    const newIndex = Math.max(0, Math.min(this.days.length - 1, currentIndex + dir));
    this.selectedDay.set(this.days[newIndex]);
  }

  getTimetableEntry(day: string, time: string) {
    return this.dataService.timetable().find(t => t.day === day && t.time === time);
  }
}
