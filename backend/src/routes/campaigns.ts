import { Router } from 'express';
import { getCampaigns, saveCampaign, updateCampaign, deleteCampaign, getCampaignById } from '../utils/storage.js';
import { getCampaignMetrics, getAggregateMetrics } from '../utils/metrics.js';

const router = Router();

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    // TODO: Extract user ID from JWT when auth is implemented
    const userId = req.user?.id; // Will be available after auth middleware is implemented
    const campaigns = await getCampaigns(userId);
    res.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Create new campaign with enhanced platform support
router.post('/', async (req, res) => {
  try {
    const { name, platform, objective, budget, targeting, templateId, aiGenerated, dailyBudget, startDate, endDate } = req.body;

    // Apply platform-specific configurations
    const platformConfig = getPlatformConfiguration(platform, objective);
    
    const campaign = {
      id: `camp_${Date.now()}`,
      user_id: req.user?.id || 1, // Default to user 1 for demo, will use JWT user when auth is implemented
      name,
      platform,
      objective,
      budget: parseFloat(budget),
      daily_budget: dailyBudget ? parseFloat(dailyBudget) : Math.round(budget / 30),
      targeting: {
        ...targeting,
        ...platformConfig.targeting
      },
      status: 'draft' as const,
      start_date: startDate || null,
      end_date: endDate || null,
      created_at: new Date().toISOString()
    };

    await saveCampaign(campaign);
    
    // Generate initial performance prediction
    const performancePrediction = generatePerformancePrediction(campaign);
    
    res.status(201).json({ 
      campaign: {
        ...campaign,
        performancePrediction
      }
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Platform-specific configuration function
function getPlatformConfiguration(platform: string, objective: string) {
  const configurations = {
    meta: {
      targeting: {
        placements: ['feed', 'stories', 'reels'],
        devices: ['mobile', 'desktop'],
        optimization: objective === 'conversions' ? 'conversions' : 'link_clicks'
      },
      settings: {
        bidStrategy: objective === 'conversions' ? 'lowest_cost_with_bid_cap' : 'lowest_cost',
        optimization: 'conversions',
        attributionWindow: '7d_click_1d_view'
      }
    },
    google: {
      targeting: {
        networks: ['search', 'display'],
        matchTypes: ['broad', 'phrase', 'exact'],
        optimization: objective === 'conversions' ? 'conversions' : 'clicks'
      },
      settings: {
        bidStrategy: objective === 'conversions' ? 'target_cpa' : 'maximize_clicks',
        optimization: 'conversions',
        conversionWindow: '30d'
      }
    },
    tiktok: {
      targeting: {
        placements: ['for_you', 'video_feeds'],
        ageRange: [18, 35],
        optimization: 'complete_payment'
      },
      settings: {
        bidStrategy: 'lowest_cost',
        optimization: 'conversions',
        campaignType: 'auction'
      }
    },
    linkedin: {
      targeting: {
        placements: ['feed', 'message'],
        targeting: ['company_size', 'job_title', 'industry'],
        optimization: objective === 'leads' ? 'lead_generation' : 'visits'
      },
      settings: {
        bidStrategy: 'maximum_delivery',
        optimization: 'leads',
        format: 'single_image_ad'
      }
    }
  };
  
  return configurations[platform] || configurations.meta;
}

// Generate performance prediction based on platform and objective
function generatePerformancePrediction(campaign: any) {
  const basePredictions = {
    meta: {
      conversions: { ctr: 2.8, conversionRate: 4.2, cpc: 1.85, cpa: 45 },
      leads: { ctr: 3.1, conversionRate: 8.1, cpc: 1.65, cpa: 25 },
      awareness: { ctr: 1.9, conversionRate: 2.1, cpc: 0.95, cpa: 15 },
      traffic: { ctr: 2.4, conversionRate: 3.5, cpc: 1.25, cpa: 35 }
    },
    google: {
      conversions: { ctr: 3.2, conversionRate: 5.8, cpc: 2.15, cpa: 38 },
      leads: { ctr: 3.8, conversionRate: 9.2, cpc: 1.95, cpa: 22 },
      awareness: { ctr: 2.1, conversionRate: 2.8, cpc: 1.05, cpa: 18 },
      traffic: { ctr: 2.8, conversionRate: 4.1, cpc: 1.35, cpa: 32 }
    },
    tiktok: {
      conversions: { ctr: 4.5, conversionRate: 3.2, cpc: 1.25, cpa: 42 },
      leads: { ctr: 3.9, conversionRate: 6.8, cpc: 1.15, cpa: 28 },
      awareness: { ctr: 5.2, conversionRate: 2.1, cpc: 0.85, cpa: 12 },
      traffic: { ctr: 4.1, conversionRate: 2.9, cpc: 1.05, cpa: 38 }
    },
    linkedin: {
      conversions: { ctr: 2.1, conversionRate: 6.8, cpc: 5.25, cpa: 85 },
      leads: { ctr: 2.8, conversionRate: 12.1, cpc: 4.85, cpa: 45 },
      awareness: { ctr: 1.5, conversionRate: 3.2, cpc: 3.95, cpa: 65 },
      traffic: { ctr: 1.9, conversionRate: 4.5, cpc: 4.15, cpa: 75 }
    }
  };
  
  const platformPredictions = basePredictions[campaign.platform] || basePredictions.meta;
  const objectivePredictions = platformPredictions[campaign.objective] || platformPredictions.conversions;
  
  const budgetMultiplier = campaign.budget > 5000 ? 1.1 : campaign.budget < 2000 ? 0.9 : 1.0;
  
  return {
    estimatedCTR: Math.round(objectivePredictions.ctr * budgetMultiplier * 100) / 100,
    estimatedConversionRate: Math.round(objectivePredictions.conversionRate * budgetMultiplier * 100) / 100,
    estimatedCPC: Math.round(objectivePredictions.cpc * 100) / 100,
    estimatedCPA: Math.round(objectivePredictions.cpa * 100) / 100,
    projectedReach: Math.floor((campaign.budget / objectivePredictions.cpc) * 1000),
    timeToResults: campaign.platform === 'tiktok' ? '3-7 days' : campaign.platform === 'linkedin' ? '7-14 days' : '5-10 days'
  };
}

// Get campaign by ID with metrics
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await getCampaignById(id);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get detailed metrics for this campaign
    const metrics = await getCampaignMetrics(id);
    
    res.json({ 
      campaign: {
        ...campaign,
        detailedMetrics: metrics
      }
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
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
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Delete campaign
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteCampaign(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
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
      // Add user_id to campaign
      response.campaign.user_id = req.user?.id || 1;
      await saveCampaign(response.campaign);
    }

    res.json(response);
  } catch (error) {
    console.error('AI Builder error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Enhanced AI conversation processing logic
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
    // Enhanced objective extraction
    if (message.includes('sales') || message.includes('sell') || message.includes('purchase') || message.includes('ecommerce')) {
      newData.objective = 'conversions';
      newData.objectiveText = 'increase sales and conversions';
    } else if (message.includes('lead') || message.includes('contact') || message.includes('subscription') || message.includes('signup')) {
      newData.objective = 'leads';
      newData.objectiveText = 'generate qualified leads';
    } else if (message.includes('awareness') || message.includes('brand') || message.includes('visibility')) {
      newData.objective = 'awareness';
      newData.objectiveText = 'build brand awareness';
    } else if (message.includes('traffic') || message.includes('visit') || message.includes('website')) {
      newData.objective = 'traffic';
      newData.objectiveText = 'drive website traffic';
    } else {
      newData.objective = 'conversions';
      newData.objectiveText = userMessage.trim();
    }

    nextState = 'gathering_platform';
    assistantMessage = `Perfect! I'll help you ${newData.objectiveText}. 🎯\n\n**Which platform would you like to advertise on?**\n\n• Meta (Facebook & Instagram)\n• Google Ads\n• TikTok\n• LinkedIn`;
  }
  else if (!currentData.platform) {
    // Enhanced platform extraction
    if (message.includes('meta') || message.includes('facebook') || message.includes('instagram')) {
      newData.platform = 'meta';
    } else if (message.includes('google')) {
      newData.platform = 'google';
    } else if (message.includes('tiktok')) {
      newData.platform = 'tiktok';
    } else if (message.includes('linkedin')) {
      newData.platform = 'linkedin';
    } else {
      newData.platform = 'meta'; // Default
    }

    nextState = 'gathering_budget';
    assistantMessage = `Great choice! ${newData.platform} is perfect for ${newData.objectiveText}.\n\n**What's your monthly budget?** (e.g., $3,000, $5,000, $10,000)`;
  }
  else if (!currentData.budget) {
    const budgetMatch = message.match(/\$?(\d+,?\d*)/);
    if (budgetMatch) {
      newData.budget = parseInt(budgetMatch[1].replace(',', ''));
    } else {
      newData.budget = 5000; // Default
    }

    nextState = 'gathering_audience';
    assistantMessage = `Perfect! Budget set to $${newData.budget.toLocaleString()}/month.\n\n**Tell me about your target audience:**\n• Age range\n• Location\n• Interests`;
  }
  else if (!currentData.targetAudience) {
    newData.targetAudience = userMessage.trim();
    nextState = 'gathering_name';
    assistantMessage = `Great audience targeting!\n\n**What would you like to name this campaign?**`;
  }
  else if (!currentData.name) {
    newData.name = userMessage.trim();
    nextState = 'confirming';
    assistantMessage = `Perfect! Here's your campaign summary:\n\n• **Name:** ${newData.name}\n• **Objective:** ${newData.objectiveText}\n• **Platform:** ${newData.platform}\n• **Budget:** $${newData.budget.toLocaleString()}/month\n• **Audience:** ${newData.targetAudience}\n\n**Ready to create this campaign?** Type "yes" to proceed.`;
  }
  else if (state === 'confirming') {
    if (message.includes('yes') || message.includes('confirm') || message.includes('create')) {
      const campaign = {
        id: `camp_${Date.now()}`,
        name: newData.name,
        platform: newData.platform,
        objective: newData.objective,
        budget: newData.budget,
        daily_budget: Math.round(newData.budget / 30),
        targeting: { description: newData.targetAudience },
        status: 'draft',
        created_at: new Date().toISOString()
      };

      nextState = 'ready';
      assistantMessage = `🎉 Campaign "${newData.name}" created successfully!\n\nYour campaign has been saved as a draft and will appear in your dashboard.`;

      return {
        message: assistantMessage,
        campaignData: newData,
        state: nextState,
        campaign
      };
    } else {
      assistantMessage = `What would you like to change? I can help you modify any part of the campaign.`;
      nextState = 'gathering_platform';
    }
  }

  return {
    message: assistantMessage,
    campaignData: newData,
    state: nextState
  };
}

export default router;