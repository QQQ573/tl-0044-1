import { useState, useEffect } from 'react';
import {
  List,
  Card,
  Tag,
  Button,
  Space,
  Empty,
  Select,
  Badge,
  Typography,
  Divider,
  Modal,
  message,
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMessageStore } from '@/store/messageStore';
import {
  Message,
  MessageType,
  MessageTypeLabel,
  MessageTypeIcon,
  TransferStatus,
} from '@/types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const {
    messages,
    total,
    unreadCount,
    loading,
    fetchMessages,
    markAsRead,
    markAllAsRead,
    fetchUnreadCount,
  } = useMessageStore();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterRead, setFilterRead] = useState<boolean | undefined>(undefined);
  const [filterType, setFilterType] = useState<MessageType | undefined>(undefined);
  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    message: Message | null;
  }>({ open: false, message: null });

  useEffect(() => {
    loadMessages();
  }, [page, pageSize, filterRead, filterType]);

  const loadMessages = () => {
    const params: any = { page, limit: pageSize };
    if (filterRead !== undefined) params.read = filterRead;
    if (filterType) params.type = filterType;
    fetchMessages(params);
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markAsRead(id);
    message.success('已标记为已读');
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      message.info('没有未读消息');
      return;
    }
    Modal.confirm({
      title: '确认全部标记为已读？',
      content: `将把 ${unreadCount} 条未读消息标记为已读`,
      onOk: async () => {
        await markAllAsRead();
        message.success('已全部标记为已读');
      },
    });
  };

  const handleViewDetail = (msg: Message) => {
    if (!msg.read) {
      markAsRead(msg.id);
    }
    if (msg.transferId) {
      navigate(`/transfers/${msg.transferId}`);
    } else {
      setPreviewModal({ open: true, message: msg });
    }
  };

  const renderMessageItem = (msg: Message) => (
    <List.Item
      key={msg.id}
      onClick={() => handleViewDetail(msg)}
      style={{
        cursor: 'pointer',
        background: msg.read ? 'transparent' : '#f0f7ff',
        padding: '16px 24px',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <List.Item.Meta
        avatar={
          <div
            style={{
              fontSize: 24,
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f5f5f5',
              borderRadius: 8,
            }}
          >
            {MessageTypeIcon[msg.type]}
          </div>
        }
        title={
          <Space>
            {!msg.read && (
              <Badge status="processing" text="" />
            )}
            <Text strong={!msg.read} style={{ fontSize: 15 }}>
              {msg.title}
            </Text>
            <Tag color="blue">{MessageTypeLabel[msg.type]}</Tag>
            {msg.transferNo && <Tag>{msg.transferNo}</Tag>}
          </Space>
        }
        description={
          <div>
            <Paragraph
              ellipsis={{ rows: 2 }}
              style={{ marginBottom: 8, color: '#666' }}
            >
              {msg.content}
            </Paragraph>
            <Space size="large">
              <Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(msg.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Text>
              {msg.transferId && (
                <Text style={{ fontSize: 12, color: '#1677ff' }}>
                  查看详情 <ArrowRightOutlined />
                </Text>
              )}
            </Space>
          </div>
        }
      />
      {!msg.read && (
        <Button
          type="text"
          size="small"
          icon={<CheckOutlined />}
          onClick={(e) => handleMarkAsRead(msg.id, e)}
        >
          标记已读
        </Button>
      )}
    </List.Item>
  );

  return (
    <div>
      <Card
        title={
          <Space>
            <BellOutlined />
            <Title level={4} style={{ margin: 0 }}>
              通知中心
            </Title>
            {unreadCount > 0 && (
              <Badge count={unreadCount} offset={[5, -5]} />
            )}
          </Space>
        }
        extra={
          <Space>
            <Select
              placeholder="筛选已读状态"
              allowClear
              style={{ width: 140 }}
              value={filterRead}
              onChange={setFilterRead}
            >
              <Option value={false}>未读</Option>
              <Option value={true}>已读</Option>
            </Select>
            <Select
              placeholder="筛选消息类型"
              allowClear
              style={{ width: 140 }}
              value={filterType}
              onChange={setFilterType}
            >
              {Object.entries(MessageTypeLabel).map(([type, label]) => (
                <Option key={type} value={type}>
                  {label}
                </Option>
              ))}
            </Select>
            <Button icon={<ReloadOutlined />} onClick={loadMessages}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              全部已读
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Text type="secondary">
              共 {total} 条消息，未读 {unreadCount} 条
            </Text>
          </Space>
        </div>

        {messages.length === 0 ? (
          <Empty description="暂无消息" />
        ) : (
          <List
            loading={loading}
            dataSource={messages}
            renderItem={renderMessageItem}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
          />
        )}
      </Card>

      <Modal
        title={previewModal.message?.title}
        open={previewModal.open}
        onCancel={() => setPreviewModal({ open: false, message: null })}
        footer={[
          <Button
            key="close"
            onClick={() => setPreviewModal({ open: false, message: null })}
          >
            关闭
          </Button>,
        ]}
        width={600}
      >
        {previewModal.message && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Tag>{MessageTypeLabel[previewModal.message.type]}</Tag>
              {previewModal.message.transferNo && (
                <Tag>{previewModal.message.transferNo}</Tag>
              )}
              <Text type="secondary">
                {dayjs(previewModal.message.createdAt).format(
                  'YYYY-MM-DD HH:mm:ss',
                )}
              </Text>
            </Space>
            <Divider style={{ margin: '12px 0' }} />
            <Paragraph style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {previewModal.message.content}
            </Paragraph>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NotificationCenter;
