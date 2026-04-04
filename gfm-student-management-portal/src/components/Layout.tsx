import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAppContext } from '../context/AppContext';
import { Dashboard } from './pages/Dashboard';
import { StudentsPage } from './pages/StudentsPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { MentorMenteePage } from './pages/MentorMenteePage';
import { FeeDetailsPage } from './pages/FeeDetailsPage';
import { VACPage } from './pages/VACPage';
import { MOOCPage } from './pages/MOOCPage';
import { InternshipPage } from './pages/InternshipPage';
import { HackathonPage } from './pages/HackathonPage';
import { GitHubPage } from './pages/GitHubPage';
import { LinkedInPage } from './pages/LinkedInPage';
import { TimetablePage } from './pages/TimetablePage';
import { FacultyPage } from './pages/FacultyPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { UploadPage } from './pages/UploadPage';
import { ExportPage } from './pages/ExportPage';

export const Layout: React.FC = () => {
  const { appData, theme, activePage, setActivePage } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!appData) {
    return <UploadPage />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'students': return <StudentsPage />;
      case 'subjects': return <SubjectsPage />;
      case 'mentor-mentee': return <MentorMenteePage />;
      case 'fees': return <FeeDetailsPage />;
      case 'vac': return <VACPage />;
      case 'mooc': return <MOOCPage />;
      case 'internship': return <InternshipPage />;
      case 'hackathon': return <HackathonPage />;
      case 'github': return <GitHubPage />;
      case 'linkedin': return <LinkedInPage />;
      case 'timetable': return <TimetablePage />;
      case 'faculty': return <FacultyPage />;
      case 'analysis': return <AnalysisPage />;
      case 'export': return <ExportPage />;
      case 'upload': return <UploadPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar 
        activePage={activePage} 
        setActivePage={(page) => {
          setActivePage(page);
          setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar 
          setActivePage={setActivePage} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};
