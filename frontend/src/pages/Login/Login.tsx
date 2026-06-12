import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, InboxOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useUserStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const from = (location.state as any)?.from?.pathname || '/transfers';

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      navigate(from, { replace: true });
    } catch (error) {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{
          width: 400,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: 12,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <InboxOutlined style={{ fontSize: 48, color: '#1677ff' }} />
          <Title level={3} style={{ marginTop: 16, marginBottom: 8 }}>
            仓库调拨管理系统
          </Title>
          <Text type="secondary">区域代理商 · 城市仓调拨</Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ username: 'admin', password: '123456' }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            测试账号：admin / 123456（区域经理）
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            keeper1 / 123456（仓管） | finance1 / 123456（财务）
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
