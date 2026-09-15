import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OrgProvider } from './context/OrgContext';
import { ToastContainer } from './components/common/ToastContainer';
import { InactivityModal } from './components/common/InactivityModal';
import { DevSimulatorToolbar } from './components/common/DevSimulatorToolbar';
import { AppRoutes } from './routes/AppRoutes';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrgProvider>
          <div className="min-h-screen bg-[#070a12] text-gray-100 font-sans selection:bg-indigo-500 selection:text-white">
            <AppRoutes />
            <ToastContainer />
            <InactivityModal />
            <DevSimulatorToolbar />
          </div>
        </OrgProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
