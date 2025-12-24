import React from 'react';
import { useAppContext } from '../App';
import { Role } from '../types';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, currentPage, setCurrentPage, logout, settings } = useAppContext();

  const menuItems = [
    { id: 'DASHBOARD', label: 'داشبورد', icon: '📊', roles: [Role.ADMIN, Role.MANAGER, Role.EMPLOYEE] },
    { id: 'LETTERS', label: 'کارتابل نامه‌ها', icon: '✉️', roles: [Role.ADMIN, Role.MANAGER, Role.EMPLOYEE] },
    { id: 'ADMIN', label: 'پنل مدیریت', icon: '⚙️', roles: [Role.ADMIN] },
    { id: 'PROFILE', label: 'تنظیمات پروفایل', icon: '👤', roles: [Role.ADMIN, Role.MANAGER, Role.EMPLOYEE] },
  ];

  if (!user) return null;

  const handleNavigation = (id: any) => {
      setCurrentPage(id);
      // Close sidebar on mobile when navigating
      if (window.innerWidth < 1024) {
          onClose();
      }
  };

  return (
    <>
        {/* Mobile Overlay */}
        <div 
            className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
            onClick={onClose}
        ></div>

        <aside className={`fixed right-0 top-0 h-full w-64 bg-slate-900 text-white shadow-xl z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <h1 className="text-xl font-bold text-sky-400 truncate max-w-[180px]">{settings.siteName}</h1>
            <button onClick={onClose} className="lg:hidden text-white/70 hover:text-white">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        
        <div className="p-6 bg-slate-800">
            <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center text-xl font-bold overflow-hidden shrink-0 border-2 border-slate-600">
                {user.avatarUrl ? (
                     <img src={user.avatarUrl} className="w-full h-full object-cover" alt="avatar" />
                ) : (
                    user.fullName.charAt(0)
                )}
            </div>
            <div className="overflow-hidden">
                <p className="font-medium text-sm truncate">{user.fullName}</p>
                <p className="text-xs text-slate-400 truncate">{user.position}</p>
            </div>
            </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
                if (!item.roles.includes(user.role)) return null;
                
                const isActive = currentPage === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => handleNavigation(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            isActive 
                            ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/50' 
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                    </button>
                );
            })}
        </nav>

        <div className="p-4 border-t border-slate-700">
            <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
            >
                <span>خروج از سیستم</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </button>
        </div>
        </aside>
    </>
  );
};