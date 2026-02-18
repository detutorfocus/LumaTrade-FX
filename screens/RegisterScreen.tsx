
import React, { useState } from 'react';
import { UserPlus, AlertCircle, Loader2, ArrowLeft, Shield, Mail, Lock, User, CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

const RegisterScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passkeys do not match institutional security requirements.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await apiClient.post('/api/auth/registration/', {
        username: formData.username,
        email: formData.email,
        password1: formData.password,
        password2: formData.confirmPassword
      });
      alert("Institutional profile initialized. Verify via secure email.");
      navigate('/login');
    } catch (err: any) {
      setError('Registration restricted. Firm domain validation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.post('/api/auth/registration/', {
        provider: 'google',
        id_token: 'simulated_google_id_token'
      });
      alert("Institutional profile created via Identity Provider.");
      navigate('/login');
    } catch (err: any) {
      setError('Registration failed. Identity Provider rejected clearance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>
      <div className="absolute top-[20%] left-[-15%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-[440px] space-y-8 relative z-10">
        <button 
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em] group"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800 group-hover:border-slate-700 transition-colors">
            <ArrowLeft size={14} />
          </div>
          Return to Terminal
        </button>

        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight text-white uppercase mb-2">Initialize <span className="text-blue-500">Profile</span></h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">Join LumaTrade Global Network</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start gap-4 mb-8 bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-[11px] font-black text-white uppercase tracking-wider mb-1">Compliance Protocol</h3>
              <p className="text-[9px] text-slate-500 leading-relaxed font-medium uppercase tracking-tight">
                Identification required for global liquidity pool clearance.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-xs">
              <AlertCircle size={18} className="shrink-0" />
              <p className="font-bold leading-tight uppercase tracking-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Operator Tag</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input 
                    type="text" 
                    required
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700"
                    placeholder="Trader_Handle"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Institutional Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input 
                    type="email" 
                    required
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700"
                    placeholder="operator@firm.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Passkey</label>
                  <input 
                    type="password" 
                    required
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-5 text-sm font-medium text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700"
                    placeholder="••••"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Confirm</label>
                  <input 
                    type="password" 
                    required
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-5 text-sm font-medium text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-700"
                    placeholder="••••"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] uppercase text-xs tracking-[0.2em] mt-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <>Generate Profile <ChevronRight size={16} /></>}
            </button>
          </form>

          <div className="relative my-8 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800/50"></div></div>
            <span className="relative px-4 text-[9px] font-black text-slate-600 bg-transparent uppercase tracking-[0.2em]">O-Auth Protocols</span>
          </div>

          <button
            onClick={handleGoogleSignUp}
            disabled={isSubmitting}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] text-xs uppercase tracking-widest"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4"/>
              <path d="M12.24 24.0008C15.4765 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11385 19.252 6.45945 17.1399 5.50705 14.3003H1.51605V17.3912C3.55375 21.4434 7.70295 24.0008 12.24 24.0008Z" fill="#34A853"/>
              <path d="M5.50255 14.3003C5.25215 13.5544 5.12065 12.768 5.12065 11.968C5.12065 11.168 5.25215 10.3816 5.50255 9.63567V6.54477H1.51605C0.662445 8.24477 0.174744 10.1448 0.174744 12.1448C0.174744 14.1448 0.662445 16.0448 1.51605 17.7448L5.50255 14.3003Z" fill="#FBBC05"/>
              <path d="M12.24 4.748C14.0016 4.748 15.5766 5.352 16.8213 6.54477L20.2745 3.09157C18.1969 1.15417 15.4674 0 12.24 0C7.70295 0 3.55375 2.5574 1.51605 6.6096L5.50705 9.7005C6.45945 6.8609 9.11385 4.748 12.24 4.748Z" fill="#EA4335"/>
            </svg>
            Google Profile
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-slate-600 text-[9px] font-black uppercase tracking-tight leading-relaxed max-w-[280px] mx-auto">
            By initializing, you agree to our <button onClick={() => navigate('/terms')} className="text-slate-400 hover:text-white cursor-pointer transition-colors underline decoration-slate-700 underline-offset-4">Terms of Operational Risk</button> and <span className="text-slate-400 hover:text-white cursor-pointer transition-colors underline decoration-slate-700 underline-offset-4">Privacy Cipher</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;
