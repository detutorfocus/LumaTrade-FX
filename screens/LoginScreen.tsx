
import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Lock, Mail, ChevronRight, Globe, ShieldCheck, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { LumaLogo } from '../components/Branding';

const LoginScreen: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '' });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      const response = await apiClient.post('/api/token/', {
        email: formData.email,
        password: formData.password
      });
      login(response.data);
      navigate('/');
    } catch (err: any) {
      setError('Invalid credentials. Access to institutional liquidity is restricted.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const response = await apiClient.post('/api/token/', {
        provider: 'google',
        access_token: 'simulated_google_token'
      });
      login(response.data);
      navigate('/');
    } catch (err: any) {
      setError('Google authentication failed. Unauthorized domain.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-[400px] space-y-8 animate-in fade-in zoom-in-95 duration-700 relative z-10">
        <div className="text-center flex flex-col items-center">
          <LumaLogo height={64} className="mb-2" />
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-xs animate-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0" />
              <p className="font-bold leading-tight uppercase tracking-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Operator Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input 
                  type="email" 
                  required
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700"
                  placeholder="name@firm.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Master Key</label>
                <button type="button" className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors">Reset</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input 
                  type="password" 
                  required
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] uppercase text-xs tracking-[0.2em]"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <>Initialize Session <ChevronRight size={16} /></>}
            </button>
          </form>

          <div className="relative my-8 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800/50"></div></div>
            <span className="relative px-4 text-[9px] font-black text-slate-600 bg-transparent uppercase tracking-[0.2em]">Partner Portals</span>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] text-xs uppercase tracking-widest"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4"/>
              <path d="M12.24 24.0008C15.4765 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11385 19.252 6.45945 17.1399 5.50705 14.3003H1.51605V17.3912C3.55375 21.4434 7.70295 24.0008 12.24 24.0008Z" fill="#34A853"/>
              <path d="M5.50255 14.3003C5.25215 13.5544 5.12065 12.768 5.12065 11.968C5.12065 11.168 5.25215 10.3816 5.50255 9.63567V6.54477H1.51605C0.662445 8.24477 0.174744 10.1448 0.174744 12.1448C0.174744 14.1448 0.662445 16.0448 1.51605 17.7448L5.50255 14.3003Z" fill="#FBBC05"/>
              <path d="M12.24 4.748C14.0016 4.748 15.5766 5.352 16.8213 6.54477L20.2745 3.09157C18.1969 1.15417 15.4674 0 12.24 0C7.70295 0 3.55375 2.5574 1.51605 6.6096L5.50705 9.7005C6.45945 6.8609 9.11385 4.748 12.24 4.748Z" fill="#EA4335"/>
            </svg>
            Google Identity
          </button>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4 text-slate-600">
             <div className="flex items-center gap-1.5 border-r border-slate-800 pr-4">
                <Globe size={12} />
                <span className="text-[8px] font-black uppercase tracking-tighter">Global Node</span>
             </div>
             <div className="flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-emerald-500/50" />
                <span className="text-[8px] font-black uppercase tracking-tighter">Encrypted Port</span>
             </div>
          </div>
          
          <div className="text-center space-y-4">
            <div>
              <p className="text-slate-500 text-xs font-medium mb-1">New Operator?</p>
              <button 
                onClick={() => navigate('/register')}
                className="text-blue-500 font-black text-xs uppercase tracking-widest hover:text-blue-400 transition-colors"
              >
                Request Credentials
              </button>
            </div>
            
            <button 
              onClick={() => navigate('/terms')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-400 transition-colors mx-auto"
            >
              <Info size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">Operational Protocols</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
