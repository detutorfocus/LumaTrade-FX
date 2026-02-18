
import React, { useState } from 'react';
import { UserPlus, AlertCircle, Loader2, ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

const RegisterScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignUp = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // In simulation mode, registration and login are handled by the same engine
      await apiClient.post('/api/auth/registration/', {
        provider: 'google',
        id_token: 'simulated_google_id_token'
      });

      alert("Institutional profile created successfully.");
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      setError('Registration failed. Your organizational domain might not be authorized.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-10">
        <button 
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
        >
          <ArrowLeft size={14} /> Back to Entry
        </button>

        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">Create Profile</h1>
          <p className="text-slate-500 font-medium text-sm">Join the LumaTrade global network</p>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0" />
              <p className="font-medium leading-tight">{error}</p>
            </div>
          )}

          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Verified Identity</h3>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  LumaTrade requires a verified Google Workspace or personal account for institutional compliance.
                </p>
              </div>
            </div>

            <button
              onClick={handleGoogleSignUp}
              disabled={isSubmitting}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4"/>
                    <path d="M12.24 24.0008C15.4765 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11385 19.252 6.45945 17.1399 5.50705 14.3003H1.51605V17.3912C3.55375 21.4434 7.70295 24.0008 12.24 24.0008Z" fill="#34A853"/>
                    <path d="M5.50255 14.3003C5.25215 13.5544 5.12065 12.768 5.12065 11.968C5.12065 11.168 5.25215 10.3816 5.50255 9.63567V6.54477H1.51605C0.662445 8.24477 0.174744 10.1448 0.174744 12.1448C0.174744 14.1448 0.662445 16.0448 1.51605 17.7448L5.50255 14.3003Z" fill="#FBBC05"/>
                    <path d="M12.24 4.748C14.0016 4.748 15.5766 5.352 16.8213 6.54477L20.2745 3.09157C18.1969 1.15417 15.4674 0 12.24 0C7.70295 0 3.55375 2.5574 1.51605 6.6096L5.50705 9.7005C6.45945 6.8609 9.11385 4.748 12.24 4.748Z" fill="#EA4335"/>
                  </svg>
                  Sign up with Google
                </>
              )}
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-slate-600 text-[10px] font-medium uppercase tracking-tight">
            By creating an account, you agree to our <br/>
            <span className="text-slate-400 hover:text-white cursor-pointer transition-colors">Terms of Service</span> and <span className="text-slate-400 hover:text-white cursor-pointer transition-colors">Risk Disclosure</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;
