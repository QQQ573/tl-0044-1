import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Form,
  Modal,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  InboxOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  getTransferList,
  deleteTransfer,
  submitForApproval,
} from '@/api/transfers';
import { getWarehouseList, getSkuList } from '@/api';
import { Transfer, TransferStatus, TransferStatusLabel, TransferStatusColor, Warehouse, Sku, UserRole } from '@/types';
import { useUserStore } from '@/store/userStore';
import dayjs from 'dayjs';

const { Option } = Select;

const TransferList: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Transfer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const params: any = { page, limit: pageSize };
      Object.keys(values).forEach((key) => {
        if (values[key]) {
          params[key] = values[key];
        }
      });
      const result = await getTransferList(params);
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const result = await getWarehouseList({ limit: 100 });
      setWarehouses(result.data);
    } catch (error) {
      // handled
    }
  };

  const fetchSkus = async () => {
    try {
      const result = await getSkuList({ limit: 100 });
      setSkus(result.data);
    } catch (error) {
      // handled
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchSkus();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleReset = () => {
    form.resetFields();
    setPage(1);
    setTimeout(fetchData, 0);
  };

  const handleSubmit = async (id: string) => {
    try {
      await submitForApproval(id);
      message.success('提交审核成功');
      fetchData();
    } catch (error) {
      // handled
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransfer(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      // handled
    }
  };

  const columns = [
    {
      title: '调拨单号',
      dataIndex: 'transferNo',
      key: 'transferNo',
      width: 160,
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TransferStatus) => (
        <Tag color={TransferStatusColor[status] as any}>
          {TransferStatusLabel[status]}
        </Tag>
      ),
    },
    {
      title: '调出仓库',
      dataIndex: ['sourceWarehouse', 'name'],
      key: 'sourceWarehouse',
      width: 120,
    },
    {
      title: '调入仓库',
      dataIndex: ['targetWarehouse', 'name'],
      key: 'targetWarehouse',
      width: 120,
    },
    {
      title: 'SKU',
      dataIndex: ['items', '0', 'sku', 'skuName'],
      key: 'sku',
      width: 200,
      render: (_: any, record: Transfer) => {
        const sku = skus.find((s) => s.id === record.skuId);
        return sku?.skuName || '-';
      },
    },
    {
      title: '批次号',
      dataIndex: 'batchNo',
      key: 'batchNo',
      width: 120,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: '申请人',
      dataIndex: ['applicant', 'realName'],
      key: 'applicant',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: Transfer) => {
        const isOwner = record.applicantId === user?.id;
        const canEdit =
          record.status === TransferStatus.DRAFT &&
          (isOwner || hasRole([UserRole.REGION_MANAGER]));
        const canSubmit =
          record.status === TransferStatus.DRAFT && isOwner;
        const canDelete =
          (record.status === TransferStatus.DRAFT ||
            record.status === TransferStatus.REJECTED) &&
          (isOwner || hasRole([UserRole.REGION_MANAGER]));

        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/transfers/${record.id}`)}
            >
              详情
            </Button>
            {canEdit && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/transfers/${record.id}/edit`)}
              >
                编辑
              </Button>
            )}
            {canSubmit && (
              <Button
                type="link"
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleSubmit(record.id)}
              >
                提交
              </Button>
            )}
            {canDelete && (
              <Popconfirm
                title="确定要删除该调拨申请吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>调拨申请列表</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/transfers/create')}
        >
          新建调拨
        </Button>
      </div>

      <Form
        form={form}
        layout="inline"
        style={{ marginBottom: 16 }}
        onFinish={handleSearch}
      >
        <Form.Item name="transferNo" label="调拨单号">
          <Input placeholder="请输入" allowClear style={{ width: 150 }} />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select placeholder="请选择" allowClear style={{ width: 130 }}>
            {Object.entries(TransferStatusLabel).map(([value, label]) => (
              <Option key={value} value={value}>
                {label}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="sourceWarehouseId" label="调出仓库">
          <Select placeholder="请选择" allowClear style={{ width: 130 }}>
            {warehouses.map((wh) => (
              <Option key={wh.id} value={wh.id}>
                {wh.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="targetWarehouseId" label="调入仓库">
          <Select placeholder="请选择" allowClear style={{ width: 130 }}>
            {warehouses.map((wh) => (
              <Option key={wh.id} value={wh.id}>
                {wh.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
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
        scroll={{ x: 1200 }}
      />
    </div>
  );
};

export default TransferList;
