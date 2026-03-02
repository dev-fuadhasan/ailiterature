/**
 * Test if webhook endpoint is accessible
 */

async function testWebhook() {
  console.log('Testing webhook endpoint...\n');
  
  const webhookUrl = 'https://www.researchroomai.com/api/webhooks/paddle/test';
  
  try {
    const response = await fetch(webhookUrl);
    const data = await response.json();
    
    console.log('✅ Webhook endpoint is accessible');
    console.log('\n=== Configuration Status ===');
    console.log('Webhook Secret:', data.config.webhookSecretConfigured ? '✅ Configured' : '❌ Missing');
    console.log('API Key:', data.config.apiKeyConfigured ? '✅ Configured' : '❌ Missing');
    console.log('Client Token:', data.config.clientTokenConfigured ? '✅ Configured' : '❌ Missing');
    console.log('Environment:', data.config.environment);
    console.log('\n=== Webhook URL ===');
    console.log(data.config.webhookUrl);
    console.log('\n=== Price IDs ===');
    console.log('Monthly:', data.config.priceIds.monthly);
    console.log('Yearly:', data.config.priceIds.yearly);
    
    console.log('\n=== Next Steps ===');
    console.log('1. Verify this URL is configured in Paddle Dashboard:');
    console.log('   https://www.researchroomai.com/api/webhooks/paddle');
    console.log('2. Check Paddle Dashboard → Developer Tools → Notifications → Webhook Logs');
    console.log('3. Make a test payment and look for webhook delivery attempts');
    
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
  }
}

testWebhook();
