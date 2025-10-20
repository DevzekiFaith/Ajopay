// Quick Paystack Keys Verification Script
// Run this with: node test-paystack.js

const https = require('https');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

console.log('🔍 Paystack Keys Verification');
console.log('============================');

// Check if keys exist
console.log('\n📋 Environment Variables:');
console.log(`PAYSTACK_SECRET_KEY: ${PAYSTACK_SECRET_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: ${PAYSTACK_PUBLIC_KEY ? '✅ Set' : '❌ Missing'}`);

// Check key formats
if (PAYSTACK_SECRET_KEY) {
  console.log(`Secret Key Format: ${PAYSTACK_SECRET_KEY.startsWith('sk_') ? '✅ Valid' : '❌ Invalid (should start with sk_)'}`);
  console.log(`Secret Key Length: ${PAYSTACK_SECRET_KEY.length} characters`);
  console.log(`Secret Key Type: ${PAYSTACK_SECRET_KEY.includes('sk_live_') ? '🟢 Live' : PAYSTACK_SECRET_KEY.includes('sk_test_') ? '🟡 Test' : '❓ Unknown'}`);
}

if (PAYSTACK_PUBLIC_KEY) {
  console.log(`Public Key Format: ${PAYSTACK_PUBLIC_KEY.startsWith('pk_') ? '✅ Valid' : '❌ Invalid (should start with pk_)'}`);
  console.log(`Public Key Length: ${PAYSTACK_PUBLIC_KEY.length} characters`);
  console.log(`Public Key Type: ${PAYSTACK_PUBLIC_KEY.includes('pk_live_') ? '🟢 Live' : PAYSTACK_PUBLIC_KEY.includes('pk_test_') ? '🟡 Test' : '❓ Unknown'}`);
}

// Test Paystack API connection
if (PAYSTACK_SECRET_KEY && PAYSTACK_SECRET_KEY.startsWith('sk_')) {
  console.log('\n🌐 Testing Paystack API Connection...');
  
  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/transaction/totals',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (res.statusCode === 200) {
          console.log('✅ Paystack API Connection: SUCCESS');
          console.log(`📊 Response: ${JSON.stringify(response, null, 2)}`);
        } else {
          console.log('❌ Paystack API Connection: FAILED');
          console.log(`Status Code: ${res.statusCode}`);
          console.log(`Response: ${data}`);
        }
      } catch (error) {
        console.log('❌ Paystack API Connection: FAILED');
        console.log(`Error parsing response: ${error.message}`);
        console.log(`Raw response: ${data}`);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Paystack API Connection: FAILED');
    console.log(`Error: ${error.message}`);
  });

  req.end();
} else {
  console.log('\n⚠️  Cannot test API connection - invalid or missing secret key');
}

console.log('\n🎯 Next Steps:');
console.log('1. If all checks pass, your Paystack integration is ready!');
console.log('2. Visit your app at http://localhost:3000/wallet');
console.log('3. Use the "Paystack Integration Test" component to test payments');
console.log('4. Try making a real deposit or withdrawal');

console.log('\n📚 Documentation:');
console.log('- Paystack API Docs: https://paystack.com/docs/api/');
console.log('- Test Cards: https://paystack.com/docs/payments/test-payments/');
