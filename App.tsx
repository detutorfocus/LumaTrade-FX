
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import ChatScreen from './screens/ChatScreen';
import TradesScreen from './screens/TradesScreen';
import AuditScreen from './screens/AuditScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfileScreen from './screens/ProfileScreen';
import ChartScreen from './screens/ChartScreen';
import NewsScreen from './screens/NewsScreen';
import TermsScreen from './screens/TermsScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            <Route path="/terms" element={<TermsScreen />} />
            
            <Route path="/" element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
              <Route index element={<DashboardScreen />} />
              <Route path="chat" element={<ChatScreen />} />
              <Route path="news" element={<NewsScreen />} />
              <Route path="trades" element={<TradesScreen />} />
              <Route path="audit" element={<AuditScreen />} />
              <Route path="settings" element={<SettingsScreen />} />
              <Route path="profile" element={<ProfileScreen />} />
              <Route path="chart/:symbol" element={<ChartScreen />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
