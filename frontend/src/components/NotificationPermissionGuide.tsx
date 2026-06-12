import { useState, useEffect } from 'react';
import { Modal, Button, Typography, Space, Alert, Switch } from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useUserStore } from '@/store/userStore';
import { useMessageStore } from '@/store/messageStore';
import { UserRole } from '@/types';

const { Title, Paragraph, Text } = Typography;

const NotificationPermissionGuide: React.FC = () => {
  const { user } = useUserStore();
  const {
    notificationPermission,
    initNotificationPermission,
    requestNotificationPermission,
  } = useMessageStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('notification_permission_dismissed') === 'true';
  });

  const shouldShowGuide =
    user &&
    (user.role === UserRole.WAREHOUSE_KEEPER || user.role === UserRole.FINANCE) &&
    notificationPermission !== 'granted' &&
    !dismissed;

  useEffect(() => {
    initNotificationPermission();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (shouldShowGuide && notificationPermission === 'default') {
        setModalVisible(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [shouldShowGuide, notificationPermission]);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setModalVisible(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notification_permission_dismissed', 'true');
    setDismissed(true);
    setModalVisible(false);
  };

  if (!user) return null;

  const roleLabel = user.role === UserRole.WAREHOUSE_KEEPER ? '仓管' : '财务';

  return (
    <>
      <Modal
        title={
          <Space>
            <BellOutlined style={{ color: '#1677ff', fontSize: 20 }} />
            <span>开启浏览器通知</span>
          </Space>
        }
        open={modalVisible}
        onCancel={handleDismiss}
        closable={false}
        maskClosable={false}
        footer={[
          <Button key="dismiss" onClick={handleDismiss}>
            稍后再说
          </Button>,
          <Button
            key="enable"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handleRequestPermission}
          >
            开启通知
          </Button>,
        ]}
        width={520}
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <BellOutlined
            style={{ fontSize: 64, color: '#1677ff', marginBottom: 16 }}
          />
          <Title level={4} style={{ marginBottom: 16 }}>
            开启浏览器通知，不错过重要消息
          </Title>
          <Paragraph style={{ color: '#666', lineHeight: 1.8 }}>
            作为 <Text strong>{roleLabel}</Text>，您将收到以下重要通知：
          </Paragraph>
          <div
            style={{
              background: '#f5f5f5',
              borderRadius: 8,
              padding: 16,
              margin: '16px 0',
              textAlign: 'left',
            }}
          >
            {user.role === UserRole.FINANCE && (
              <Paragraph style={{ margin: '8px 0' }}>
                <InfoCircleOutlined style={{ color: '#1677ff', marginRight: 8 }} />
                新的调拨申请提交时，收到审核提醒
              </Paragraph>
            )}
            {user.role === UserRole.WAREHOUSE_KEEPER && (
              <>
                <Paragraph style={{ margin: '8px 0' }}>
                  <InfoCircleOutlined style={{ color: '#1677ff', marginRight: 8 }} />
                  您负责的仓库有调拨出库/入库时，收到操作提醒
                </Paragraph>
                <Paragraph style={{ margin: '8px 0' }}>
                  <InfoCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
                  物流轨迹超时未更新时，收到告警通知
                </Paragraph>
              </>
            )}
          </div>
          <Alert
            type="info"
            showIcon
            message="开启后，新消息会以系统通知的形式推送到您的桌面，即使浏览器在后台运行也能收到。"
            style={{ textAlign: 'left' }}
          />
          <Paragraph style={{ color: '#999', fontSize: 12, marginTop: 16 }}>
            您可以随时在浏览器设置中修改通知权限
          </Paragraph>
        </div>
      </Modal>

      {notificationPermission === 'denied' && !dismissed && (
        <Alert
          type="warning"
          showIcon
          message="浏览器通知已被禁用"
          description={
            <Space>
              <span>您可以在浏览器设置中重新启用通知，或</span>
              <Button type="link" size="small" onClick={handleDismiss}>
                不再提示
              </Button>
            </Space>
          }
          style={{ marginBottom: 16 }}
          closable
          onClose={handleDismiss}
        />
      )}

      {notificationPermission === 'granted' && (
        <input type="hidden" />
      )}
    </>
  );
};

export default NotificationPermissionGuide;
