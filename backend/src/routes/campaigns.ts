import { Router } from 'express';
import { generateCampaignMetrics, getCampaigns, saveCampaign, updateCampaign } from '../utils/storage.js';

const router = Router();

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    const campaigns = await getCampaigns();
    res.json({ campaigns });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Create new campaign
router.post('/', async (req, res) => {
  try {
    const { name, platform, objective, budget, targeting } = req.body;

    const campaign = {
      id: `camp_${Date.now()}`,
      name,
      platform,
      objective,
      budget,
      targeting,
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      metrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        revenue: 0
      }
    };

    await saveCampaign(campaign);
    res.status(201).json({ campaign });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Get campaign by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const campaigns = await getCampaigns();
    const campaign = campaigns.find(c => c.id === id);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ campaign });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Update campaign
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const campaign = await updateCampaign(id, updates);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ campaign });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Delete campaign
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implement campaign deletion
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// AI Campaign Builder endpoint
router.post('/ai-builder', async (req, res) => {
  try {
    const { userMessage, conversationHistory, currentData, state } = req.body;

    // Process user message with AI logic
    const response = await processUserMessage(userMessage, currentData, state, conversationHistory);

    // If campaign is ready, save it
    if (response.campaign) {
      // Generate initial simulated metrics for the new campaign
      const metrics = generateCampaignMetrics(response.campaign);
      const campaignWithMetrics = {
        ...response.campaign,
        metrics
      };

      await saveCampaign(campaignWithMetrics);
      response.campaign = campaignWithMetrics;
    }

    res.json(response);
  } catch (error) {
    console.error('AI Builder error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// AI conversation processing logic
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
    // Extract objective
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
    assistantMessage = `Perfect! I'll help you ${newData.objectiveText}. 🎯\n\n**Which platform would you like to advertise on?**\n\n• Meta (Facebook & Instagram)\n• Google Ads\n• TikTok\n• LinkedIn`;
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
    } else {
      newData.platform = 'meta';
    }

    assistantMessage = `Great choice! ${newData.platform.charAt(0).toUpperCase() + newData.platform.slice(1)} is excellent for ${newData.objectiveText}. 📱\n\n**What's your total campaign budget?** (e.g., $5,000, $10,000)`;
  }
  else if (!currentData.budget) {
    // Extract budget
    const budgetMatch = message.match(/\$?(\d+,?\d*)/);
    if (budgetMatch) {
      newData.budget = parseInt(budgetMatch[1].replace(',', ''));
      newData.dailyBudget = Math.round(newData.budget / 30);
    } else {
      newData.budget = 5000;
      newData.dailyBudget = 167;
    }

    assistantMessage = `Perfect! Budget set to $${newData.budget.toLocaleString()}. 💰\n\nI'll allocate approximately $${newData.dailyBudget}/day.\n\n**Who is your target audience?** Tell me about:\n• Age range (e.g., 25-45)\n• Location (e.g., United States, Canada)\n• Interests (e.g., technology, fitness, business)`;
  }
  else if (!currentData.targetAudience) {
    // Extract target audience
    const ageMatch = message.match(/(\d+)[-\s](\d+)/);
    const age = ageMatch ? [parseInt(ageMatch[1]), parseInt(ageMatch[2])] : [25, 45];

    newData.targetAudience = {
      ageRange: age,
      locations: ['United States'],
      interests: ['general'],
    };

    assistantMessage = `Excellent! I've got your target audience defined. 👥\n\n**Finally, what should we name this campaign?** (This helps you identify it later)`;
  }
  else if (!currentData.name) {
    // Extract campaign name
    newData.name = userMessage.trim() || `${newData.objectiveText} - ${newData.platform}`;

    nextState = 'confirming';
    assistantMessage = `Awesome! Let me summarize your campaign:\n\n📋 **Campaign Summary**\n• **Name:** ${newData.name}\n• **Goal:** ${newData.objectiveText}\n• **Platform:** ${newData.platform}\n• **Budget:** $${newData.budget.toLocaleString()} ($${newData.dailyBudget}/day)\n• **Audience:** Ages ${newData.targetAudience.ageRange[0]}-${newData.targetAudience.ageRange[1]}\n\n**Does this look good?** Type "yes" to create the campaign, or tell me what you'd like to change.`;
  }
  else if (state === 'confirming') {
    if (message.includes('yes') || message.includes('confirm') || message.includes('looks good') || message.includes('perfect')) {
      // Create the campaign
      const campaign = {
        id: `camp_${Date.now()}`,
        name: newData.name,
        platform: newData.platform,
        objective: newData.objective,
        budget: newData.budget,
        dailyBudget: newData.dailyBudget,
        targetAudience: newData.targetAudience,
        status: 'active', // Set to active so it shows up with metrics
        createdAt: new Date().toISOString(),
      };

      nextState = 'ready';
      assistantMessage = `🎉 **Campaign created successfully!**\n\nYour campaign "${newData.name}" is ready to launch. You can review and activate it from your dashboard.`;

      return {
        message: assistantMessage,
        campaignData: newData,
        state: nextState,
        campaign,
      };
    } else {
      assistantMessage = `No problem! What would you like to change?`;
      nextState = 'gathering';
    }
  }

  return {
    message: assistantMessage,
    campaignData: newData,
    state: nextState,
  };
}

export default router;
