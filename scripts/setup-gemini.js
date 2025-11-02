const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Setting up Google Gemini API for Ajopay...\n');

console.log('📋 Steps to get your Gemini API key:');
console.log('1. Go to: https://aistudio.google.com/app/apikey');
console.log('2. Sign in with your Google account');
console.log('3. Click "Create API Key"');
console.log('4. Copy the generated API key\n');

rl.question('Enter your Gemini API key: ', (apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    console.log('❌ No API key provided. Please run this script again with a valid key.');
    rl.close();
    return;
  }

  // Update the .env file
  const envPath = path.join(__dirname, '..', 'dotenv');
  
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace the placeholder with the actual API key
    envContent = envContent.replace(
      'GEMINI_API_KEY=your_gemini_api_key_here',
      `GEMINI_API_KEY=${apiKey.trim()}`
    );
    
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Gemini API key saved successfully!');
    console.log('🎉 Your Ajopay app is now ready to use Google Gemini AI!');
    console.log('\n📊 Benefits of using Gemini:');
    console.log('• 60 requests per minute (vs OpenAI\'s strict limits)');
    console.log('• 1 million tokens per month free');
    console.log('• Better for development and testing');
    console.log('• More generous rate limits for your users');
    
  } catch (error) {
    console.error('❌ Error saving API key:', error.message);
  }
  
  rl.close();
});














