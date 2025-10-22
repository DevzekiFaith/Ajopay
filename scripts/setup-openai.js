#!/usr/bin/env node

/**
 * OpenAI API Key Setup Script
 * This script helps you set up your OpenAI API key for the Ajopay project
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🤖 OpenAI API Key Setup for Ajopay');
console.log('=====================================\n');

console.log('📋 Steps to get your OpenAI API Key:');
console.log('1. Go to: https://platform.openai.com/');
console.log('2. Sign up for a free account (get $5 free credits!)');
console.log('3. Navigate to: API Keys section');
console.log('4. Click: "Create new secret key"');
console.log('5. Copy the key (starts with "sk-")\n');

rl.question('🔑 Enter your OpenAI API Key: ', (apiKey) => {
  if (!apiKey || !apiKey.startsWith('sk-')) {
    console.log('❌ Invalid API key format. Please make sure it starts with "sk-"');
    rl.close();
    return;
  }

  // Update the dotenv file
  const dotenvPath = path.join(__dirname, '..', 'dotenv');
  
  try {
    let content = fs.readFileSync(dotenvPath, 'utf8');
    
    // Replace the placeholder with the actual API key
    content = content.replace(
      'OPENAI_API_KEY=your_openai_api_key_here',
      `OPENAI_API_KEY=${apiKey}`
    );
    
    fs.writeFileSync(dotenvPath, content);
    
    console.log('✅ API key saved successfully!');
    console.log('🎉 Your chatbot now has both text and voice capabilities!');
    console.log('\n📊 Cost estimates with your $5 free credits:');
    console.log('- Text responses: ~$0.0015 per 1K tokens (thousands of responses)');
    console.log('- Voice responses: ~$0.015 per 1K characters (hundreds of voice messages)');
    console.log('\n🚀 Start your development server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Error saving API key:', error.message);
  }
  
  rl.close();
});

rl.on('close', () => {
  console.log('\n💡 Pro tip: Your API key is stored in the dotenv file and will be used automatically!');
  process.exit(0);
});











