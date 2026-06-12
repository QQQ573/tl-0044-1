import { Layout, Menu, Avatar, Dropdown, Space, theme } from 'antd';
import {
  DatabaseOutlined,
  InboxOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { UserRole, TransferStatusLabel } from '@/types';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUserStore();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const roleLabels: Record<UserRole, string> = {
    [UserRole.REGION_MANAGER]: '区域经理',
    [UserRole.WAREHOUSE_KEEPER]: '仓管',
    [UserRole.FINANCE]: '财务',
  };

  const menuItems = [
    {
      key: '/transfers',
      icon: <DatabaseOutlined />,
      label: '调拨申请',
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={220}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <InboxOutlined style={{ fontSize: 24, color: '#1677ff', marginRight: 8 }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: '#1677ff' }}>
            仓调拨管理
          </span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: colorBgContainer,
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>
                {user?.realName} ({roleLabels[user?.role || UserRole.WAREHOUSE_KEEPER]})
              </span>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: colorBgContainer,
            borderRadius: 8,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
