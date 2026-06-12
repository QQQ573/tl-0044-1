import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import MainLayout from '@/layouts/MainLayout';
import LoginPage from '@/pages/Login/Login';
import TransferList from '@/pages/Transfers/TransferList';
import TransferForm from '@/pages/Transfers/TransferForm';
import TransferDetail from '@/pages/Transfers/TransferDetail';
import NotificationCenter from '@/pages/Notifications/NotificationCenter';
import { UserRole } from '@/types';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/transfers" replace />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/transfers" element={<TransferList />} />
        <Route path="/transfers/create" element={<TransferForm />} />
        <Route path="/transfers/:id" element={<TransferDetail />} />
        <Route path="/transfers/:id/edit" element={<TransferForm />} />
        <Route path="/notifications" element={<NotificationCenter />} />
      </Route>

      <Route path="/403" element={<div style={{ padding: 50, textAlign: 'center' }}>403 - 无权限访问</div>} />
      <Route path="*" element={<div style={{ padding: 50, textAlign: 'center' }}>404 - 页面不存在</div>} />
    </Routes>
  );
};

export default App;
