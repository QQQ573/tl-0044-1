import { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Divider,
  Modal,
  Form,
  Input,
  Select,
  message,
  Row,
  Col,
  Timeline,
  Upload,
  List,
  Empty,
  Popconfirm,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  InboxOutlined,
  RocketOutlined,
  UploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getTransferDetail,
  submitForApproval,
  approveTransfer,
  shipTransfer,
  receiveTransfer,
} from '@/api/transfers';
import {
  getAttachments,
  uploadAttachment,
  deleteAttachment,
  getLogisticsTrackings,
  generateMockLogistics,
} from '@/api';
import {
  Transfer,
  TransferStatus,
  TransferStatusLabel,
  TransferStatusColor,
  Attachment,
  LogisticsTracking,
  UserRole,
  AuditLog,
  AuditActionLabel,
} from '@/types';
import { getAuditLogs } from '@/api/messages';
import { useUserStore } from '@/store/userStore';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const TransferDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Transfer | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [trackings, setTrackings] = useState<LogisticsTracking[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [approveForm] = Form.useForm();
  const [shipForm] = Form.useForm();
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getTransferDetail(id);
      setDetail(data);
    } catch (error) {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachments = async () => {
    if (!id) return;
    try {
      const data = await getAttachments(id);
      setAttachments(data);
    } catch (error) {
      // handled
    }
  };

  const fetchTrackings = async () => {
    if (!id) return;
    try {
      const data = await getLogisticsTrackings(id);
      setTrackings(data);
    } catch (error) {
      // handled
    }
  };

  const fetchAuditLogs = async () => {
    if (!id) return;
    try {
      const { data } = await getAuditLogs(id);
      setAuditLogs(data);
    } catch (error) {
      // handled
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetail();
      fetchAttachments();
      fetchTrackings();
      fetchAuditLogs();
    }
  }, [id]);

  const handleSubmit = async () => {
    if (!detail) return;
    try {
      await submitForApproval(detail.id);
      message.success('提交审核成功');
      fetchDetail();
    } catch (error) {
      // handled
    }
  };

  const handleApprove = async () => {
    if (!detail) return;
    try {
      const values = await approveForm.validateFields();
      setActionLoading(true);
      await approveTransfer(detail.id, {
        version: detail.version,
        decision: values.decision,
        rejectionReason: values.rejectionReason,
      });
      message.success('审核成功');
      setApproveModalOpen(false);
      approveForm.resetFields();
      fetchDetail();
    } catch (error: any) {
      if (error?.response?.status === 409) {
        message.error('数据已被修改，请刷新页面后重试');
        fetchDetail();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleShip = async () => {
    if (!detail) return;
    try {
      const values = await shipForm.validateFields();
      setActionLoading(true);
      await shipTransfer(detail.id, values);
      message.success('确认出库成功');
      setShipModalOpen(false);
      shipForm.resetFields();
      fetchDetail();
    } catch (error) {
      // handled
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceive = async () => {
    if (!detail) return;
    try {
      await receiveTransfer(detail.id);
      message.success('确认入库成功');
      fetchDetail();
    } catch (error) {
      // handled
    }
  };

  const handleUpload = async (file: File) => {
    if (!detail) return false;
    try {
      await uploadAttachment(file, detail.id);
      message.success('上传成功');
      fetchAttachments();
    } catch (error) {
      // handled
    }
    return false;
  };

  const handleDeleteAttachment = async (attId: string) => {
    try {
      await deleteAttachment(attId);
      message.success('删除成功');
      fetchAttachments();
    } catch (error) {
      // handled
    }
  };

  const handleGenerateMockLogistics = async () => {
    if (!detail) return;
    try {
      await generateMockLogistics(detail.id, 5);
      message.success('已生成Mock物流轨迹');
      fetchTrackings();
    } catch (error) {
      // handled
    }
  };

  const getTimelineItems = () => {
    if (!detail) return [];
    const items: { color: string; label: string; time?: string }[] = [];

    items.push({
      color: 'blue',
      label: '创建申请',
      time: dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    });

    if (detail.status !== TransferStatus.DRAFT) {
      items.push({
        color: detail.status === TransferStatus.REJECTED ? 'red' : 'blue',
        label: '提交审核',
      });
    }

    if (detail.approvedAt) {
      items.push({
        color: detail.status === TransferStatus.REJECTED ? 'red' : 'green',
        label: detail.status === TransferStatus.REJECTED ? '已驳回' : '审核通过',
        time: dayjs(detail.approvedAt).format('YYYY-MM-DD HH:mm:ss'),
      });
    }

    if (detail.shippedAt) {
      items.push({
        color: 'blue',
        label: '已出库',
        time: dayjs(detail.shippedAt).format('YYYY-MM-DD HH:mm:ss'),
      });
    }

    if (detail.receivedAt) {
      items.push({
        color: 'green',
        label: '已入库',
        time: dayjs(detail.receivedAt).format('YYYY-MM-DD HH:mm:ss'),
      });
    }

    return items;
  };

  const renderActions = () => {
    if (!detail || !user) return null;
    const actions: React.ReactNode[] = [];

    if (
      detail.status === TransferStatus.DRAFT &&
      (detail.applicantId === user.id || hasRole([UserRole.REGION_MANAGER]))
    ) {
      actions.push(
        <Button icon={<SendOutlined />} onClick={handleSubmit}>
          提交审核
        </Button>,
      );
      actions.push(
        <Button onClick={() => navigate(`/transfers/${detail.id}/edit`)}>
          编辑
        </Button>,
      );
    }

    if (
      detail.status === TransferStatus.PENDING_APPROVAL &&
      hasRole([UserRole.REGION_MANAGER, UserRole.FINANCE])
    ) {
      actions.push(
        <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setApproveModalOpen(true)}>
          审核
        </Button>,
      );
    }

    if (
      detail.status === TransferStatus.PENDING_SHIPMENT &&
      hasRole([UserRole.WAREHOUSE_KEEPER, UserRole.REGION_MANAGER])
    ) {
      actions.push(
        <Button type="primary" icon={<RocketOutlined />} onClick={() => setShipModalOpen(true)}>
          确认出库
        </Button>,
      );
    }

    if (
      detail.status === TransferStatus.IN_TRANSIT &&
      hasRole([UserRole.WAREHOUSE_KEEPER, UserRole.REGION_MANAGER])
    ) {
      actions.push(
        <Button type="primary" icon={<InboxOutlined />} onClick={handleReceive}>
          确认入库
        </Button>,
      );
    }

    return actions.length > 0 ? (
      <Space>{actions}</Space>
    ) : null;
  };

  if (loading && !detail) {
    return <div>加载中...</div>;
  }

  if (!detail) {
    return <Empty description="未找到该调拨申请" />;
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        >
          返回列表
        </Button>
        {renderActions()}
      </div>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="调拨单号">
                {detail.transferNo}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={TransferStatusColor[detail.status] as any}>
                  {TransferStatusLabel[detail.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="调出仓库">
                {detail.sourceWarehouse?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="调入仓库">
                {detail.targetWarehouse?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="SKU">
                {detail.items?.[0]?.sku?.skuName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="批次号">
                {detail.batchNo}
              </Descriptions.Item>
              <Descriptions.Item label="数量">
                {detail.quantity}
              </Descriptions.Item>
              <Descriptions.Item label="版本">
                v{detail.version}
              </Descriptions.Item>
              <Descriptions.Item label="申请人">
                {detail.applicant?.realName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="审核人">
                {detail.approver?.realName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="物流公司">
                {detail.logisticsCompany || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="运单号">
                {detail.trackingNo || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="调拨原因" span={2}>
                {detail.reason || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {detail.remark || '-'}
              </Descriptions.Item>
              {detail.rejectionReason && (
                <Descriptions.Item label="驳回原因" span={2}>
                  <span style={{ color: '#ff4d4f' }}>{detail.rejectionReason}</span>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card
            title="附件管理"
            extra={
              <Upload
                beforeUpload={handleUpload}
                showUploadList={false}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              >
                <Button type="primary" size="small" icon={<UploadOutlined />}>
                  上传附件
                </Button>
              </Upload>
            }
            style={{ marginBottom: 16 }}
          >
            {attachments.length === 0 ? (
              <Empty description="暂无附件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                size="small"
                dataSource={attachments}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => window.open(item.downloadUrl)}
                      >
                        下载
                      </Button>,
                      <Popconfirm
                        title="确定删除该附件？"
                        onConfirm={() => handleDeleteAttachment(item.id)}
                      >
                        <Button
                          type="link"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                        >
                          删除
                        </Button>
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      title={item.originalName}
                      description={`${(item.size / 1024).toFixed(2)} KB · ${dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}`}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card
            title="物流轨迹"
            extra={
              detail.status === TransferStatus.IN_TRANSIT && (
                <Button size="small" onClick={handleGenerateMockLogistics}>
                  生成Mock轨迹
                </Button>
              )
            }
          >
            {trackings.length === 0 ? (
              <Empty description="暂无物流轨迹" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Timeline
                items={trackings.map((t) => ({
                  color: 'blue',
                  dot: <EnvironmentOutlined />,
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>{t.status}</div>
                      <div style={{ color: '#666', fontSize: 13 }}>
                        {t.description || t.location}
                      </div>
                      <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {dayjs(t.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                        {t.operator && ` · ${t.operator}`}
                      </div>
                    </div>
                  ),
                }))}
              />
            )}
          </Card>

          <Card title="操作日志" style={{ marginTop: 16 }}>
            {auditLogs.length === 0 ? (
              <Empty description="暂无操作日志" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                dataSource={auditLogs}
                renderItem={(log) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: '#e6f7ff',
                            color: '#1890ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 500,
                            fontSize: 12,
                          }}
                        >
                          {log.userName?.charAt(0) || '系'}
                        </div>
                      }
                      title={
                        <Space>
                          <Typography.Text strong>{AuditActionLabel[log.action]}</Typography.Text>
                          {log.oldStatus && log.newStatus && (
                            <Tag color="blue">
                              {TransferStatusLabel[log.oldStatus as TransferStatus]} → {TransferStatusLabel[log.newStatus as TransferStatus]}
                            </Tag>
                          )}
                        </Space>
                      }
                      description={
                        <div>
                          {log.remark && (
                            <Typography.Paragraph style={{ marginBottom: 4, color: '#666' }}>
                              {log.remark}
                            </Typography.Paragraph>
                          )}
                          <Space size="large" style={{ fontSize: 12, color: '#999' }}>
                            <span>
                              操作人：{log.userName || '系统'}
                              {log.userRole && ` (${log.userRole === UserRole.WAREHOUSE_KEEPER ? '仓管' : log.userRole === UserRole.FINANCE ? '财务' : '区域经理'})`}
                            </span>
                            <span>
                              <ClockCircleOutlined style={{ marginRight: 4 }} />
                              {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                            </span>
                          </Space>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card title="处理进度">
            <Timeline
              items={getTimelineItems().map((item) => ({
                color: item.color,
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.label}</div>
                    {item.time && (
                      <div style={{ color: '#999', fontSize: 12 }}>{item.time}</div>
                    )}
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="审核调拨申请"
        open={approveModalOpen}
        onCancel={() => setApproveModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={approveForm} layout="vertical">
          <Form.Item
            name="decision"
            label="审核结果"
            rules={[{ required: true, message: '请选择审核结果' }]}
          >
            <Select placeholder="请选择">
              <Option value={TransferStatus.PENDING_SHIPMENT}>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                通过
              </Option>
              <Option value={TransferStatus.REJECTED}>
                <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                驳回
              </Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="rejectionReason"
            label="驳回原因"
            dependencies={['decision']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (getFieldValue('decision') === TransferStatus.REJECTED && !value) {
                    return Promise.reject(new Error('驳回时必须填写驳回原因'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <TextArea rows={4} placeholder="请输入驳回原因" />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setApproveModalOpen(false)}>取消</Button>
              <Button type="primary" loading={actionLoading} onClick={handleApprove}>
                确认
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <Modal
        title="确认出库"
        open={shipModalOpen}
        onCancel={() => setShipModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={shipForm} layout="vertical">
          <Form.Item
            name="logisticsCompany"
            label="物流公司"
            rules={[{ required: true, message: '请输入物流公司' }]}
          >
            <Input placeholder="请输入物流公司名称" />
          </Form.Item>
          <Form.Item
            name="trackingNo"
            label="运单号"
            rules={[{ required: true, message: '请输入运单号' }]}
          >
            <Input placeholder="请输入运单号" />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setShipModalOpen(false)}>取消</Button>
              <Button type="primary" loading={actionLoading} onClick={handleShip}>
                确认出库
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default TransferDetail;
