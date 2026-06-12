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

async function main() {
  console.log('=== 调拨申请列表查询压测 ===');

  const token = await login();

  const instance = autocannon({
    url: BASE_URL,
    connections: 50,
    duration: 10,
    pipelining: 1,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    requests: [
      {
        method: 'GET',
        path: '/transfers?page=1&limit=20',
      },
    ],
  });

  instance.on('done', (result) => {
    console.log('\n=== 压测结果 ===');
    console.log(`并发数: 50`);
    console.log(`持续时间: 10秒`);
    console.log(`总请求数: ${result.requests.total}`);
    console.log(`平均每秒请求数: ${result.requests.average.toFixed(2)}`);
    console.log(`成功请求数: ${result['2xx']}`);
    console.log(`平均响应时间: ${result.latency.average.toFixed(2)} ms`);
    console.log(`P50 延迟: ${result.latency.p50.toFixed(2)} ms`);
    console.log(`P95 延迟: ${result.latency.p95.toFixed(2)} ms`);
    console.log(`P99 延迟: ${result.latency.p99.toFixed(2)} ms`);
  });

  autocannon.track(instance, { renderProgressBar: true });
}

main().catch(console.error);
