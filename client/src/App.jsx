import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/global.css';
import './i18n/i18n';

import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LocationProvider } from './context/LocationContext';

import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import Loader from './components/common/Loader';
import useSocket from './hooks/useSocket';

const Home              = lazy(() => import('./pages/Home'));
const Login             = lazy(() => import('./pages/Login'));
const Register          = lazy(() => import('./pages/Register'));
const WorkerDashboard   = lazy(() => import('./pages/WorkerDashboard'));
const EmployerDashboard = lazy(() => import('./pages/EmployerDashboard'));
const SearchWorkers     = lazy(() => import('./pages/SearchWorkers'));
const WorkerProfilePage = lazy(() => import('./pages/WorkerProfilePage'));
const PostJob           = lazy(() => import('./pages/PostJob'));
const BookingPage       = lazy(() => import('./pages/BookingPage'));
const BookingsListPage  = lazy(() => import('./pages/BookingsListPage'));
const PaymentPage       = lazy(() => import('./pages/PaymentPage'));
const RatingPage        = lazy(() => import('./pages/RatingPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const SettingsPage      = lazy(() => import('./pages/SettingsPage'));
const AdminPanel        = lazy(() => import('./pages/AdminPanel'));
const NotFound          = lazy(() => import('./pages/NotFound'));

const PageLoader = () => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Loader fullPage />
  </div>
);

const SocketWrapper = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const token = localStorage.getItem('kamnaka_token');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useSocket(isLoggedIn ? token : null, {});
  return children;
};

const EmployerRoute = ({ children }) => (
  <ProtectedRoute roles={['employer', 'admin']}>{children}</ProtectedRoute>
);
const WorkerRoute = ({ children }) => (
  <ProtectedRoute roles={['worker', 'admin']}>{children}</ProtectedRoute>
);

const AppContent = () => {
  const { isLoggedIn, isWorker } = useAuth();

  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"            element={<Home />} />
            <Route path="/login"       element={<Login />} />
            <Route path="/register"    element={<Register />} />
            <Route path="/workers"     element={<SearchWorkers />} />
            <Route path="/workers/:id" element={<WorkerProfilePage />} />
            <Route path="/jobs"        element={<SearchWorkers />} />

            <Route path="/worker/dashboard" element={<WorkerRoute><WorkerDashboard /></WorkerRoute>} />
            <Route path="/employer/dashboard" element={<EmployerRoute><EmployerDashboard /></EmployerRoute>} />
            <Route path="/jobs/post" element={<EmployerRoute><PostJob /></EmployerRoute>} />

            <Route path="/bookings"           element={<ProtectedRoute><BookingsListPage /></ProtectedRoute>} />
            <Route path="/bookings/:id"       element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
            <Route path="/book/:workerId"     element={<EmployerRoute><BookingPage /></EmployerRoute>} />
            <Route path="/payment/:bookingId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
            <Route path="/rate/:bookingId"    element={<ProtectedRoute><RatingPage /></ProtectedRoute>} />
            <Route path="/notifications"      element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/settings"           element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/admin/*"            element={<ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>} />

            <Route path="/dashboard" element={
              !isLoggedIn ? <Navigate to="/login" replace />
                : isWorker ? <Navigate to="/worker/dashboard" replace />
                : <Navigate to="/employer/dashboard" replace />
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
        toastStyle={{ fontFamily: 'var(--font-family)', fontSize: 14 }}
      />
    </>
  );
};

const App = () => (
  <Router>
    <AuthProvider>
      <LocationProvider>
        <NotificationProvider>
          <SocketWrapper>
            <AppContent />
          </SocketWrapper>
        </NotificationProvider>
      </LocationProvider>
    </AuthProvider>
  </Router>
);

export default App;
