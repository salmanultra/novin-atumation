import React, { useState, useEffect, createContext, useContext } from 'react';
import { User, Role, SystemSettings } from './types';
import { dbService } from './services/dbService';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Letters } from './pages/Letters';
import { AdminPanel } from './pages/AdminPanel';
import { Profile } from './pages/Profile';

// --- Router Context ---
type Page = 'LOGIN' | 'DASHBOARD' | 'LETTERS' | 'ADMIN' | 'PROFILE';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  logout: () => void;
  settings: SystemSettings;
  updateSettings: (s: SystemSettings) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('LOGIN');
  const [settings, setSettings] = useState<SystemSettings>(dbService.getSettings());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check session on load
  useEffect(() => {
    const savedUser = localStorage.getItem('session_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentPage('DASHBOARD');
    }
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('session_user', JSON.stringify(u));
    setCurrentPage('DASHBOARD');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('session_user');
    setCurrentPage('LOGIN');
    setIsSidebarOpen(false);
  };

  const updateSettings = (newSettings: SystemSettings) => {
      dbService.saveSettings(newSettings);
      setSettings(newSettings);
  };

  return (
    <AppContext.Provider value={{ user, setUser: handleLogin, currentPage, setCurrentPage, logout, settings, updateSettings }}>
      {/* Dynamic Theme Injection */}
      <style>{`
        :root {
          --primary-color: ${settings.themeColor};
        }
        .text-primary-600, .text-sky-600, .text-blue-600 { color: var(--primary-color) !important; }
        .bg-primary-600, .bg-sky-600, .bg-blue-600 { background-color: var(--primary-color) !important; }
        .bg-primary-500, .bg-sky-500 { background-color: var(--primary-color) !important; }
        .border-primary-500, .focus\\:ring-primary-500:focus, .focus\\:ring-sky-500:focus { border-color: var(--primary-color) !important; --tw-ring-color: var(--primary-color) !important; }
        .hover\\:bg-primary-700:hover, .hover\\:bg-sky-700:hover { filter: brightness(0.9); background-color: var(--primary-color) !important; }
      `}</style>

      <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row overflow-hidden relative">
        {user && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}
        
        {/* Mobile Header */}
        {user && (
           <div className="lg:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md z-30 sticky top-0">
               <span className="font-bold truncate max-w-[200px]">{settings.siteName}</span>
               <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded hover:bg-white/10">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
               </button>
           </div>
        )}

        <main className={`flex-1 transition-all duration-300 ${user ? 'lg:mr-64 w-full' : 'w-full'} h-[calc(100vh-64px)] lg:h-screen overflow-y-auto`}>
           {!user ? (
             <Login />
           ) : (
             <div className="p-4 lg:p-8">
               {currentPage === 'DASHBOARD' && <Dashboard />}
               {currentPage === 'LETTERS' && <Letters />}
               {currentPage === 'ADMIN' && <AdminPanel />}
               {currentPage === 'PROFILE' && <Profile />}
             </div>
           )}
        </main>
      </div>
    </AppContext.Provider>
  );
};

export default App;