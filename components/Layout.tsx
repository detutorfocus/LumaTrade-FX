
import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Newspaper, TrendingUp, Settings, Bell, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LumaIcon } from './Branding';

const Layout: React.FC = () => {
  const { user, accountMode, setAccountMode } = useAuth();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, path: '/', label: 'Home' },
    { icon: MessageSquare, path: '/chat', label: 'AI' },
    { icon: Newspaper, path: '/news', label: 'News' },
    { icon: TrendingUp, path: '/trades', label: 'Trades' },
    { icon: Settings, path: '/settings', label: 'Tools' },
  ];

  const getPageTitle = () => {
    const active = navItems.find(item => item.path === location.pathname);
    return active ? active.label : 'LumaTrade';
  };

  const isRealAvailable = !!user?.mt5_linked;

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-slate-950 overflow-hidden">
      {/* Persistent Header */}
      <header className="sticky top-0 z-40 glass border-b border-slate-800/50 px-4 py-3 flex justify-between items-center h-16 shrink-0">
        <div className="flex items-center gap-3">
          <LumaIcon size={36} />
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-tighter uppercase leading-none text-white">LumaTrade</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{getPageTitle()}</span>
              <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
              <span className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${accountMode === 'REAL' ? 'text-emerald-500' : 'text-amber-500'}`}>
                {accountMode === 'REAL' ? <CheckCircle2 size={8} /> : <ShieldAlert size={8} />}
                {accountMode} MODE
              </span>
            </div>
          </div>
        </div>

        {/* Account Mode Switcher */}
        <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800 h-9">
          <button 
            onClick={() => setAccountMode('DEMO')}
            className={`px-3 h-full rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
              accountMode === 'DEMO' 
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' 
                : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            Demo
          </button>
          <button 
            disabled={!isRealAvailable}
            onClick={() => setAccountMode('REAL')}
            className={`px-3 h-full rounded-lg text-[9px] font-black uppercase tracking-widest transition-all relative ${
              accountMode === 'REAL' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                : isRealAvailable 
                  ? 'text-slate-500 hover:text-slate-400' 
                  : 'text-slate-700'
            }`}
          >
            Real
            {!isRealAvailable && (
              <div className="absolute -top-1 -right-1">
                <div className="w-2 h-2 bg-slate-800 rounded-full border border-slate-700" />
              </div>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-950" />
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto pb-24 relative outline-none scroll-smooth">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-slate-800/50 px-6 pt-2 pb-8 flex justify-between items-center z-50 h-24 shrink-0 safe-bottom">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center group relative transition-all duration-300
              ${isActive ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}
            `}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute -top-3 w-8 h-1 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                )}
                <item.icon size={22} className={isActive ? 'scale-110' : ''} />
                <span className="text-[9px] mt-1.5 uppercase font-bold tracking-widest leading-none text-center">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
