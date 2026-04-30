import { getSuggestedReplies } from '../src/services/ai.service.js';

(async () => {
  try {
    console.log("TEST 1: Generic issue");
    const s1 = await getSuggestedReplies({
      issue: 'My app crashes when I click the save button',
      messages: [
        { sender: 'user', text: 'It crashes every time' },
        { sender: 'agent', text: 'Can you share the error?' }
      ]
    });
    console.log('Suggestions:', s1);
    console.log('');

    console.log("TEST 2: Payment/Billing issue (should get payment escalation suggestions)");
    const s2 = await getSuggestedReplies({
      issue: 'I was charged twice for my subscription',
      messages: [
        { sender: 'user', text: 'I see duplicate charges in my billing' }
      ]
    });
    console.log('Suggestions:', s2);
    console.log('');

    console.log("TEST 3: Security issue (should get security escalation suggestions)");
    const s3 = await getSuggestedReplies({
      issue: 'Unauthorized access to my account — someone changed my password',
      messages: [
        { sender: 'user', text: 'My account was hacked' }
      ]
    });
    console.log('Suggestions:', s3);
    console.log('');

    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(2);
  }
})();

