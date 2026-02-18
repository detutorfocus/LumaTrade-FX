
import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

const LoginScreen: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Simulate network latency for a more "real" authentication feel
      await new Promise(resolve => setTimeout(resolve, 800));

      // Simulating a Google OAuth redirect/callback flow
      const response = await apiClient.post('/api/token/', {
        provider: 'google',
        access_token: 'simulated_google_token'
      });

      // Update Auth Context with mock or real data
      login(response.data);
      
      // Explicitly navigate to Dashboard after successful login
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('Google authentication failed. Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-600/20 mb-6 rotate-3">
            <TrendingUp size={44} />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">LumaTrade</h1>
          <p className="text-slate-500 font-medium text-sm">Institutional Trading Terminal</p>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0" />
              <p className="font-medium leading-tight">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
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
                  Continue with Google
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-500 text-center font-bold uppercase tracking-widest px-4 leading-relaxed">
              Secure institutional access via enterprise identity provider.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 text-center">
          <p className="text-slate-500 text-sm font-medium mb-4">Don't have an account?</p>
          <button 
            onClick={() => navigate('/register')}
            className="text-blue-500 font-black text-sm uppercase tracking-widest hover:text-blue-400 transition-colors"
          >
            Create Trading Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
