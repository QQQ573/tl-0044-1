import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  Space,
  message,
  Row,
  Col,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createTransfer,
  updateTransfer,
  getTransferDetail,
} from '@/api/transfers';
import { getWarehouseList, getSkuList } from '@/api';
import { Warehouse, Sku, TransferStatus } from '@/types';

const { Option } = Select;
const { TextArea } = Input;

const TransferForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [skus, setSkus] = useState<Sku[]>([]);

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

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const detail = await getTransferDetail(id);
      if (detail.status !== TransferStatus.DRAFT) {
        message.error('只有草稿状态的申请可以编辑');
        navigate(-1);
        return;
      }
      form.setFieldsValue(detail);
    } catch (error) {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchSkus();
    if (isEdit) {
      fetchDetail();
    }
  }, [id]);

  const handleSubmit = async (submitForApproval: boolean) => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (isEdit) {
        await updateTransfer(id!, values);
        message.success('保存成功');
      } else {
        await createTransfer({ ...values, submitForApproval });
        message.success(submitForApproval ? '提交成功' : '保存成功');
      }

      navigate('/transfers');
    } catch (error: any) {
      if (error?.errorFields) {
        // validation error
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        >
          返回列表
        </Button>
      </div>

      <Card title={isEdit ? '编辑调拨申请' : '新建调拨申请'}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ quantity: 1 }}
          disabled={loading}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sourceWarehouseId"
                label="调出仓库"
                rules={[{ required: true, message: '请选择调出仓库' }]}
              >
                <Select placeholder="请选择调出仓库">
                  {warehouses.map((wh) => (
                    <Option key={wh.id} value={wh.id}>
                      {wh.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="targetWarehouseId"
                label="调入仓库"
                rules={[{ required: true, message: '请选择调入仓库' }]}
              >
                <Select placeholder="请选择调入仓库">
                  {warehouses.map((wh) => (
                    <Option key={wh.id} value={wh.id}>
                      {wh.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="skuId"
                label="SKU"
                rules={[{ required: true, message: '请选择SKU' }]}
              >
                <Select placeholder="请选择SKU" showSearch optionFilterProp="children">
                  {skus.map((sku) => (
                    <Option key={sku.id} value={sku.id}>
                      {sku.skuCode} - {sku.skuName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="batchNo"
                label="批次号"
                rules={[{ required: true, message: '请输入批次号' }]}
              >
                <Input placeholder="请输入批次号" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="quantity"
            label="调拨数量"
            rules={[{ required: true, message: '请输入调拨数量' }]}
          >
            <InputNumber min={1} style={{ width: 200 }} />
          </Form.Item>

          <Form.Item name="reason" label="调拨原因">
            <TextArea rows={3} placeholder="请输入调拨原因" maxLength={500} showCount />
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <TextArea rows={2} placeholder="请输入备注" maxLength={200} showCount />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
            <Space size="large">
              <Button onClick={() => navigate(-1)}>取消</Button>
              <Button
                icon={<SaveOutlined />}
                loading={loading}
                onClick={() => handleSubmit(false)}
              >
                保存草稿
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={loading}
                onClick={() => handleSubmit(true)}
              >
                提交审核
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default TransferForm;
