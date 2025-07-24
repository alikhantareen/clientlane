#!/usr/bin/env node

/**
 * Vercel Health Check Script
 * Run this script to monitor your Vercel deployment health
 */

const https = require('https');

// Replace with your Vercel deployment URL
const VERCEL_URL = process.env.VERCEL_URL || 'https://your-app.vercel.app';

const endpoints = [
  '/api/health/database',
  '/api/portals?page=1&limit=1',
  '/api/plan-limits',
  '/api/notifications?page=1&limit=10'
];

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    https.get(url, (res) => {
      const endTime = Date.now();
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const responseTime = endTime - startTime;
          const jsonData = JSON.parse(data);
          
          resolve({
            status: res.statusCode,
            responseTime,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            responseTime: endTime - startTime,
            data: data,
            error: 'Failed to parse JSON'
          });
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function runHealthCheck() {
  console.log('🏥 Starting Vercel Health Check...\n');
  console.log(`📍 Target: ${VERCEL_URL}\n`);
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const url = `${VERCEL_URL}${endpoint}`;
    console.log(`🔍 Testing: ${endpoint}`);
    
    try {
      const result = await makeRequest(url);
      results.push({ endpoint, ...result });
      
      const status = result.status === 200 ? '✅' : '❌';
      console.log(`${status} Status: ${result.status} | Time: ${result.responseTime}ms`);
      
      if (result.status !== 200) {
        console.log(`   Error: ${JSON.stringify(result.data)}`);
      }
    } catch (error) {
      results.push({ endpoint, error: error.message });
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('');
  }
  
  // Summary
  console.log('📊 Summary:');
  const successful = results.filter(r => r.status === 200).length;
  const failed = results.length - successful;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n🚨 Issues detected! Check the logs above for details.');
    process.exit(1);
  } else {
    console.log('\n🎉 All endpoints are healthy!');
  }
}

// Run the health check
runHealthCheck().catch(console.error); 