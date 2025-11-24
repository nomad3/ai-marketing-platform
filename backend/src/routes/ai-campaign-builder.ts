import { Router } from 'express';

const router = Router();

// AI Campaign Builder endpoint
router.post('/ai-builder', async (req, res) => {
  try {
    const { userMessage, conversationHistory, currentData, state } = req.body;

    // Simple rule-based AI agent (can be replaced with OpenAI/Anthropic later)
    const response = await processUserMessage(userMessage, currentData, state, conversationHistory);

    res.json(response);
  } catch (error) {
    console.error('AI Builder error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Simple conversational AI logic
async function processUserMessage(
  userMessage: string,
  currentData: any,
  state: string,
  history: any[]
): Promise<any> {
  const message = userMessage.toLowerCase();
  const newData = { ...currentData };
  let nextState = state;
  let assistantMessage = '';

  // State machine for conversation flow
  if (state === 'initial' || !currentData.objective) {
    // Extract objective from user message
    if (message.includes('sales') || message.includes('sell')) {
      newData.objective = 'conversions';
      newData.objectiveText = 'increase sales';
    } else if (message.includes('lead') || message.includes('contact')) {
      newData.objective = 'leads';
      newData.objectiveText = 'generate leads';
    } else if (message.includes('awareness') || message.includes('brand')) {
      newData.objective = 'awareness';
      newData.objectiveText = 'build brand awareness';
    } else if (message.includes('traffic') || message.includes('visit')) {
      newData.objective = 'traffic';
      newData.objectiveText = 'drive website traffic';
    } else {
      newData.objective = 'conversions';
      newData.objectiveText = userMessage;
    }

    nextState = 'gathering';
    assistantMessage = `Perfect! I'll help you ${newData.objectiveText}. 🎯\n\n**Which platform would you like to advertise on?**\n\n• Meta (Facebook & Instagram)\n• Google Ads\n• TikTok\n• LinkedIn\n• Multiple platforms`;
  }
  else if (!currentData.platform) {
    // Extract platform
    if (message.includes('meta') || message.includes('facebook') || message.includes('instagram')) {
      newData.platform = 'meta';
    } else if (message.includes('google')) {
      newData.platform = 'google';
    } else if (message.includes('tiktok')) {
      newData.platform = 'tiktok';
    } else if (message.includes('linkedin')) {
      newData.platform = 'linkedin';
    } else if (message.includes('multiple') || message.includes('all')) {
      newData.platform = 'multi';
    } else {
      newData.platform = 'meta'; // default
    }

    assistantMessage = `Great choice! ${newData.platform === 'meta' ? 'Meta' : newData.platform} is excellent for ${newData.objectiveText}. 📱\n\n**What's your total campaign budget?** (e.g., $5,000, $10,000)`;
  }
  else if (!currentData.budget) {
    // Extract budget
    const budgetMatch = message.match(/\$?(\d+,?\d*)/);
    if (budgetMatch) {
      newData.budget = parseInt(budgetMatch[1].replace(',', ''));
      newData.dailyBudget = Math.round(newData.budget / 30); // Estimate daily budget
    } else {
      newData.budget = 5000; // default
      newData.dailyBudget = 167;
    }

    assistantMessage = `Perfect! Budget set to $${newData.budget.toLocaleString()}. 💰\n\nI'll allocate approximately $${newData.dailyBudget}/day.\n\n**Who is your target audience?** Tell me about:\n• Age range (e.g., 25-45)\n• Location (e.g., United States, Canada)\n• Interests (e.g., technology, fitness, business)`;
  }
  else if (!currentData.targetAudience) {
    // Extract target audience
    const ageMatch = message.match(/(\d+)[-\s](\d+)/);
    const age = ageMatch ? [parseInt(ageMatch[1]), parseInt(ageMatch[2])] : [25, 45];

    // Extract locations
    const locations = extractLocations(message);

    // Extract interests
    const interests = extractInterests(message);

    newData.targetAudience = {
      ageRange: age,
      locations: locations.length > 0 ? locations : ['United States'],
      interests: interests.length > 0 ? interests : ['general'],
    };

    assistantMessage = `Excellent! I've got your target audience defined. 👥\n\n**How long should this campaign run?**\n• Start date (e.g., today, next Monday, December 1st)\n• Duration (e.g., 30 days, 2 months, ongoing)`;
  }
  else if (!currentData.schedule) {
    // Extract schedule
    const today = new Date();
    const startDate = extractDate(message) || today;
    const duration = extractDuration(message) || 30;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);

    newData.schedule = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      duration,
    };

    assistantMessage = `Perfect! Campaign scheduled from ${formatDate(startDate)} to ${formatDate(endDate)}. 📅\n\n**Finally, what should we name this campaign?** (This helps you identify it later)`;
  }
  else if (!currentData.name) {
    // Extract campaign name
    newData.name = userMessage.trim() || `${newData.objectiveText} - ${newData.platform}`;

    nextState = 'confirming';
    assistantMessage = `Awesome! Let me summarize your campaign:\n\n📋 **Campaign Summary**\n• **Name:** ${newData.name}\n• **Goal:** ${newData.objectiveText}\n• **Platform:** ${newData.platform}\n• **Budget:** $${newData.budget.toLocaleString()} (${newData.dailyBudget}/day)\n• **Audience:** Ages ${newData.targetAudience.ageRange[0]}-${newData.targetAudience.ageRange[1]}, ${newData.targetAudience.locations.join(', ')}\n• **Duration:** ${formatDate(new Date(newData.schedule.startDate))} - ${formatDate(new Date(newData.schedule.endDate))}\n\n**Does this look good?** Type "yes" to create the campaign, or tell me what you'd like to change.`;
  }
  else if (state === 'confirming') {
    if (message.includes('yes') || message.includes('confirm') || message.includes('looks good') || message.includes('perfect')) {
      // Create the campaign
      const campaign = {
        name: newData.name,
        platform: newData.platform,
        objective: newData.objective,
        budget: newData.budget,
        dailyBudget: newData.dailyBudget,
        startDate: newData.schedule.startDate,
        endDate: newData.schedule.endDate,
        targetAudience: newData.targetAudience,
        status: 'draft',
        createdAt: new Date().toISOString(),
      };

      nextState = 'ready';
      assistantMessage = `🎉 **Campaign created successfully!**\n\nYour campaign "${newData.name}" is ready to launch. You can review and activate it from your dashboard.\n\nWould you like to generate AI-powered ad content for this campaign now?`;

      return {
        message: assistantMessage,
        campaignData: newData,
        state: nextState,
        campaign,
      };
    } else {
      assistantMessage = `No problem! What would you like to change? You can update:\n• Campaign name\n• Budget\n• Target audience\n• Schedule\n• Platform`;
      nextState = 'gathering';
    }
  }

  return {
    message: assistantMessage,
    campaignData: newData,
    state: nextState,
  };
}

// Helper functions
function extractLocations(text: string): string[] {
  const locations = [];
  const locationKeywords = [
    'united states', 'usa', 'us', 'america',
    'canada', 'uk', 'united kingdom', 'australia',
    'germany', 'france', 'spain', 'italy',
    'brazil', 'mexico', 'argentina',
  ];

  for (const keyword of locationKeywords) {
    if (text.toLowerCase().includes(keyword)) {
      locations.push(keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    }
  }

  return locations;
}

function extractInterests(text: string): string[] {
  const interests = [];
  const interestKeywords = [
    'technology', 'tech', 'fitness', 'health', 'business',
    'marketing', 'fashion', 'travel', 'food', 'sports',
    'gaming', 'music', 'art', 'education', 'finance',
  ];

  for (const keyword of interestKeywords) {
    if (text.toLowerCase().includes(keyword)) {
      interests.push(keyword);
    }
  }

  return interests;
}

function extractDate(text: string): Date | null {
  if (text.includes('today')) {
    return new Date();
  }
  if (text.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  if (text.includes('next week')) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  }
  return null;
}

function extractDuration(text: string): number {
  const durationMatch = text.match(/(\d+)\s*(day|week|month)/);
  if (durationMatch) {
    const value = parseInt(durationMatch[1]);
    const unit = durationMatch[2];
    if (unit === 'week') return value * 7;
    if (unit === 'month') return value * 30;
    return value;
  }
  return 30; // default
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default router;
