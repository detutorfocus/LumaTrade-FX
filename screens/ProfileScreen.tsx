
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { User, Loader2, Save, ArrowLeft, ShieldCheck, Mail, User as UserIcon, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileScreen: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await apiClient.patch('/api/auth/user/', formData);
      // Update local context
      login({ user: response.data, access: localStorage.getItem('access_token') || '', refresh: localStorage.getItem('refresh_token') || '' });
      setMessage({ type: 'success', text: 'Institutional records updated successfully.' });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'Synchronization failed. Please verify terminal access.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-5 space-y-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/settings')}
          className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400 active:scale-95 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Identity Management</h2>
      </div>

      <div className="flex flex-col items-center gap-4 pb-4">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 relative">
          <UserIcon size={44} />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-xl border-4 border-slate-950 flex items-center justify-center text-white">
            <BadgeCheck size={16} />
          </div>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">Verification Level: Enterprise</p>
          <h3 className="text-lg font-black text-white">{formData.username}</h3>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-2 border ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {message.type === 'success' ? <ShieldCheck size={18} /> : <BadgeCheck size={18} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Operator ID</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input 
                type="text" 
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-4 pl-10 pr-4 text-xs font-medium text-white focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Username"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5 col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Authorized Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input 
                type="email" 
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-4 pl-10 pr-4 text-xs font-medium text-white focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="email@luma-trade.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">First Name</label>
            <input 
              type="text" 
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-4 px-4 text-xs font-medium text-white focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="First Name"
              value={formData.first_name}
              onChange={e => setFormData({...formData, first_name: e.target.value})}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Last Name</label>
            <input 
              type="text" 
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-4 px-4 text-xs font-medium text-white focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Last Name"
              value={formData.last_name}
              onChange={e => setFormData({...formData, last_name: e.target.value})}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Update Clearance</>}
        </button>
      </form>

      <div className="pt-8 border-t border-slate-900">
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Audit Trail Active</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              Profile changes are logged in the global audit console for compliance. Institutional users may require supervisor approval for email updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
