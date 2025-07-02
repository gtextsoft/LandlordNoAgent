import { useLocation } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/components/admin/AdminDashboard';
import UserManagement from '@/components/admin/UserManagement';
import PropertyReviewPanel from '@/components/admin/PropertyReviewPanel';
import AdminAnalyticsDashboard from '@/components/admin/AdminAnalyticsDashboard';
import DatabaseManagement from '@/components/admin/DatabaseManagement';
import SystemSettings from '@/components/admin/SystemSettings';

const AdminPanel = () => {
  const location = useLocation();

  const renderContent = () => {
    const path = location.pathname;

    switch (path) {
      case '/admin':
        return <AdminDashboard />;
      case '/admin/users':
        return <UserManagement />;
      case '/admin/properties':
        return <PropertyReviewPanel />;
      case '/admin/analytics':
        return <AdminAnalyticsDashboard />;
      case '/admin/database':
        return <DatabaseManagement />;
      case '/admin/settings':
        return <SystemSettings />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <AdminLayout>
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminPanel;
