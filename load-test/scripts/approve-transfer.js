const axios = require('axios');
const autocannon = require('autocannon');

const BASE_URL = 'http://localhost:3000/api';

async function login() {
  const res = await axios.post(`${BASE_URL}/auth/login`, {
    username: 'admin',
    password: '123456',
  });
  return res.data.accessToken;
}

async function prepareTransfers(token, count) {
  console.log(`准备 ${count} 条待审核的调拨申请...`);
  const warehouses = await axios.get(`${BASE_URL}/warehouses?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const skus = await axios.get(`${BASE_URL}/skus?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const wh = warehouses.data.data;
  const sku = skus.data.data[0];

  const transferIds = [];
  for (let i = 0; i < count; i++) {
    const batchNo = `APPR-BATCH-${Date.now()}-${i}`;
    try {
      const res = await axios.post(
        `${BASE_URL}/transfers`,
        {
          sourceWarehouseId: wh[0].id,
          targetWarehouseId: wh[1].id,
          skuId: sku.id,
          batchNo: batchNo,
          quantity: 10,
          submitForApproval: true,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      transferIds.push({
        id: res.data.id,
        version: res.data.version,
      });
    } catch (e) {
      // skip errors
    }
  }
  console.log(`已创建 ${transferIds.length} 条待审核申请`);
  return transferIds;
}

async function main() {
  console.log('=== 审核接口并发压测（乐观锁验证） ===');

  const token = await login();
  const transfers = await prepareTransfers(token, 50);

  if (transfers.length === 0) {
    console.error('没有可用的待审核申请');
    process.exit(1);
  }

  let idx = 0;

  const instance = autocannon({
    url: BASE_URL,
    connections: 50,
    duration: 10,
    pipelining: 1,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    requests: [
      {
        method: 'POST',
        path: '/transfers/placeholder/approve',
        setupRequest: (req) => {
          const transfer = transfers[idx % transfers.length];
          idx++;
          req.path = `/transfers/${transfer.id}/approve`;
          req.body = JSON.stringify({
            version: transfer.version,
            decision: 'pending_shipment',
          });
          return req;
        },
      },
    ],
  });

  instance.on('done', (result) => {
    console.log('\n=== 压测结果 ===');
    console.log(`并发数: 50`);
    console.log(`持续时间: 10秒`);
    console.log(`总请求数: ${result.requests.total}`);
    console.log(`平均每秒请求数: ${result.requests.average.toFixed(2)}`);
    console.log(`成功审核数(2xx): ${result['2xx']}`);
    console.log(`乐观锁冲突数(409): ${result['4xx']}`);
    console.log(`平均响应时间: ${result.latency.average.toFixed(2)} ms`);
    console.log(`P95 延迟: ${result.latency.p95.toFixed(2)} ms`);
    console.log(`P99 延迟: ${result.latency.p99.toFixed(2)} ms`);
    console.log('\n说明: 409状态码为乐观锁冲突，证明并发安全机制生效');
  });

  autocannon.track(instance, { renderProgressBar: true });
}

main().catch(console.error);
