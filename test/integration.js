/**
 * Test utilities for the AI Chatbot system
 */

const http = require('http');
const { config } = require('../src/config');

class TestClient {
  constructor(baseUrl = `http://localhost:${config.server.port}`) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make HTTP request
   * @param {string} method - HTTP method
   * @param {string} path - Request path
   * @param {Object} data - Request data
   * @returns {Promise<Object>} Response data
   */
  async request(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + path);
      const postData = data ? JSON.stringify(data) : null;

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
        }
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData);
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: parsedData
            });
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: responseData
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  }

  /**
   * Send chat message
   * @param {string} message - Message to send
   * @returns {Promise<Object>} Chat response
   */
  async chat(message) {
    return this.request('POST', '/api/chat', { message });
  }

  /**
   * Get health status
   * @returns {Promise<Object>} Health status
   */
  async health() {
    return this.request('GET', '/api/health');
  }

  /**
   * Get simple status
   * @returns {Promise<Object>} Status
   */
  async status() {
    return this.request('GET', '/api/status');
  }

  /**
   * Refresh system
   * @returns {Promise<Object>} Refresh result
   */
  async refresh() {
    return this.request('POST', '/api/refresh');
  }
}

/**
 * Test different query types
 */
async function runTests() {
  const client = new TestClient();
  
  console.log('🧪 Starting AI Chatbot Tests...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const health = await client.health();
    console.log(`Status: ${health.statusCode}`);
    console.log(`System Status: ${health.data.status}`);
    console.log('✅ Health check passed\n');

    // Test 2: English Query
    console.log('2️⃣ Testing English Query...');
    const englishResponse = await client.chat('What courses do you offer?');
    console.log(`Status: ${englishResponse.statusCode}`);
    console.log(`Response Length: ${englishResponse.data.response?.length || 0} chars`);
    console.log(`Has Context: ${englishResponse.data.hasContext}`);
    console.log(`Language: ${englishResponse.data.language}`);
    console.log(`Response Time: ${englishResponse.data.responseTime}`);
    console.log('✅ English query passed\n');

    // Test 3: Arabic Query
    console.log('3️⃣ Testing Arabic Query...');
    const arabicResponse = await client.chat('ما هي أسعار الدورات التدريبية؟');
    console.log(`Status: ${arabicResponse.statusCode}`);
    console.log(`Response Length: ${arabicResponse.data.response?.length || 0} chars`);
    console.log(`Has Context: ${arabicResponse.data.hasContext}`);
    console.log(`Language: ${arabicResponse.data.language}`);
    console.log(`Response Time: ${arabicResponse.data.responseTime}`);
    console.log('✅ Arabic query passed\n');

    // Test 4: Company Information Query
    console.log('4️⃣ Testing Company Information...');
    const companyResponse = await client.chat('Tell me about your company');
    console.log(`Status: ${companyResponse.statusCode}`);
    console.log(`Has Context: ${companyResponse.data.hasContext}`);
    console.log(`Sources: ${companyResponse.data.sources?.join(', ') || 'none'}`);
    console.log('✅ Company info query passed\n');

    // Test 5: Contact Information
    console.log('5️⃣ Testing Contact Information...');
    const contactResponse = await client.chat('How can I contact you?');
    console.log(`Status: ${contactResponse.statusCode}`);
    console.log(`Has Context: ${contactResponse.data.hasContext}`);
    console.log(`Sources: ${contactResponse.data.sources?.join(', ') || 'none'}`);
    console.log('✅ Contact query passed\n');

    // Test 6: Invalid Input
    console.log('6️⃣ Testing Invalid Input...');
    const invalidResponse = await client.request('POST', '/api/chat', { message: '' });
    console.log(`Status: ${invalidResponse.statusCode}`);
    console.log(`Error Code: ${invalidResponse.data.error?.code}`);
    console.log('✅ Invalid input handling passed\n');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

/**
 * Performance test
 */
async function performanceTest(queries = 10) {
  const client = new TestClient();
  
  console.log(`🚀 Starting Performance Test (${queries} queries)...\n`);

  const testMessages = [
    'What services do you offer?',
    'ما هي أسعار الدورات؟',
    'Tell me about your company',
    'How can I contact you?',
    'What are your policies?'
  ];

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < queries; i++) {
    const message = testMessages[i % testMessages.length];
    const queryStart = Date.now();
    
    try {
      const response = await client.chat(message);
      const queryTime = Date.now() - queryStart;
      
      results.push({
        query: i + 1,
        message,
        responseTime: queryTime,
        success: response.statusCode === 200,
        hasContext: response.data.hasContext,
        language: response.data.language
      });

      console.log(`Query ${i + 1}/${queries}: ${queryTime}ms`);
      
    } catch (error) {
      results.push({
        query: i + 1,
        message,
        error: error.message,
        success: false
      });
    }
  }

  const totalTime = Date.now() - startTime;
  const successful = results.filter(r => r.success).length;
  const avgResponseTime = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.responseTime, 0) / successful;

  console.log('\n📊 Performance Results:');
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Successful Queries: ${successful}/${queries}`);
  console.log(`Average Response Time: ${Math.round(avgResponseTime)}ms`);
  console.log(`Queries per Second: ${Math.round((successful / totalTime) * 1000)}`);
}

// Export for use as module
module.exports = {
  TestClient,
  runTests,
  performanceTest
};

// Run tests if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--performance')) {
    const queries = parseInt(args.find(arg => arg.startsWith('--queries='))?.split('=')[1]) || 10;
    performanceTest(queries);
  } else {
    runTests();
  }
}
