// Simple test script to verify reward claiming API
const testRewardClaiming = async () => {
  try {
    console.log('Testing reward claiming API...');
    
    // Test the API endpoint
    const response = await fetch('http://localhost:3000/api/commissions/rewards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rewardId: 'sample-reward-1' })
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Reward claiming API is working!');
      console.log('Message:', data.message);
    } else {
      console.log('❌ Reward claiming API failed');
      console.log('Error:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testRewardClaiming();

