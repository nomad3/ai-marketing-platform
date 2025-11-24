#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { z } from 'zod';
import { AIContentService } from './services/ai-content.js';
import { AnalyticsService } from './services/analytics.js';
import { CampaignService } from './services/campaign.js';
import { MetaAdsService } from './services/meta-ads.js';

dotenv.config();

// Initialize services
const metaAds = new MetaAdsService();
const aiContent = new AIContentService();
const analytics = new AnalyticsService();
const campaigns = new CampaignService();

// Create MCP server
const server = new Server(
  {
    name: 'ai-marketing-platform',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// Define tool schemas
const CreateCampaignSchema = z.object({
  name: z.string(),
  platform: z.enum(['meta', 'google', 'tiktok']),
  objective: z.string(),
  budget: z.number(),
  target_audience: z.object({
    age_range: z.tuple([z.number(), z.number()]),
    interests: z.array(z.string()),
    locations: z.array(z.string()).optional(),
  }),
  generate_content: z.object({
    image: z.boolean().default(false),
    video: z.boolean().default(false),
    copy: z.boolean().default(false),
  }),
});

const GenerateContentSchema = z.object({
  type: z.enum(['image', 'video', 'copy']),
  prompt: z.string(),
  style: z.string().optional(),
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
  }).optional(),
});

const GetROISchema = z.object({
  campaign_id: z.string(),
  date_range: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
});

const OptimizeCampaignSchema = z.object({
  campaign_id: z.string(),
  optimization_goal: z.enum(['roi', 'reach', 'engagement', 'conversions']),
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'create_ad_campaign',
        description: 'Create a new advertising campaign with AI-generated content across Meta, Google, or TikTok platforms',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Campaign name' },
            platform: { type: 'string', enum: ['meta', 'google', 'tiktok'], description: 'Advertising platform' },
            objective: { type: 'string', description: 'Campaign objective (e.g., conversions, brand_awareness)' },
            budget: { type: 'number', description: 'Daily budget in USD' },
            target_audience: {
              type: 'object',
              properties: {
                age_range: { type: 'array', items: { type: 'number' }, description: 'Min and max age' },
                interests: { type: 'array', items: { type: 'string' }, description: 'Target interests' },
                locations: { type: 'array', items: { type: 'string' }, description: 'Target locations' },
              },
            },
            generate_content: {
              type: 'object',
              properties: {
                image: { type: 'boolean', description: 'Generate AI images' },
                video: { type: 'boolean', description: 'Generate AI videos' },
                copy: { type: 'boolean', description: 'Generate AI ad copy' },
              },
            },
          },
          required: ['name', 'platform', 'objective', 'budget', 'target_audience'],
        },
      },
      {
        name: 'generate_content',
        description: 'Generate AI content (images, videos, or copy) using Hugging Face, Nano Banana, and other AI tools',
        inputSchema: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['image', 'video', 'copy'], description: 'Content type' },
            prompt: { type: 'string', description: 'Generation prompt' },
            style: { type: 'string', description: 'Visual style or tone' },
            dimensions: {
              type: 'object',
              properties: {
                width: { type: 'number' },
                height: { type: 'number' },
              },
            },
          },
          required: ['type', 'prompt'],
        },
      },
      {
        name: 'get_campaign_roi',
        description: 'Get ROI analytics and performance metrics for a campaign',
        inputSchema: {
          type: 'object',
          properties: {
            campaign_id: { type: 'string', description: 'Campaign ID' },
            date_range: {
              type: 'object',
              properties: {
                start: { type: 'string', description: 'Start date (ISO format)' },
                end: { type: 'string', description: 'End date (ISO format)' },
              },
            },
          },
          required: ['campaign_id'],
        },
      },
      {
        name: 'optimize_campaign',
        description: 'AI-powered campaign optimization based on performance data',
        inputSchema: {
          type: 'object',
          properties: {
            campaign_id: { type: 'string', description: 'Campaign ID' },
            optimization_goal: {
              type: 'string',
              enum: ['roi', 'reach', 'engagement', 'conversions'],
              description: 'Optimization objective',
            },
          },
          required: ['campaign_id', 'optimization_goal'],
        },
      },
      {
        name: 'list_campaigns',
        description: 'List all active campaigns with their current status',
        inputSchema: {
          type: 'object',
          properties: {
            platform: { type: 'string', enum: ['meta', 'google', 'tiktok', 'all'], description: 'Filter by platform' },
            status: { type: 'string', enum: ['active', 'paused', 'completed', 'all'], description: 'Filter by status' },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'create_ad_campaign': {
        const params = CreateCampaignSchema.parse(args);
        const campaign = await campaigns.createCampaign(params);

        // Generate AI content if requested
        const generatedContent: any = {};
        if (params.generate_content.image) {
          generatedContent.image = await aiContent.generateImage({
            prompt: `Professional advertising image for ${params.name}`,
            dimensions: { width: 1200, height: 628 },
          });
        }
        if (params.generate_content.video) {
          generatedContent.video = await aiContent.generateVideo({
            prompt: `Engaging video ad for ${params.name}`,
          });
        }
        if (params.generate_content.copy) {
          generatedContent.copy = await aiContent.generateCopy({
            prompt: `Compelling ad copy for ${params.name}, objective: ${params.objective}`,
          });
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                campaign,
                generated_content: generatedContent,
                message: `Campaign "${params.name}" created successfully on ${params.platform}`,
              }, null, 2),
            },
          ],
        };
      }

      case 'generate_content': {
        const params = GenerateContentSchema.parse(args);
        let result;

        switch (params.type) {
          case 'image':
            result = await aiContent.generateImage({
              prompt: params.prompt,
              style: params.style,
              dimensions: params.dimensions,
            });
            break;
          case 'video':
            result = await aiContent.generateVideo({
              prompt: params.prompt,
              style: params.style,
            });
            break;
          case 'copy':
            result = await aiContent.generateCopy({
              prompt: params.prompt,
              style: params.style,
            });
            break;
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, content: result }, null, 2),
            },
          ],
        };
      }

      case 'get_campaign_roi': {
        const params = GetROISchema.parse(args);
        const roi = await analytics.getCampaignROI(params.campaign_id, params.date_range);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, roi }, null, 2),
            },
          ],
        };
      }

      case 'optimize_campaign': {
        const params = OptimizeCampaignSchema.parse(args);
        const optimization = await campaigns.optimizeCampaign(
          params.campaign_id,
          params.optimization_goal
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, optimization }, null, 2),
            },
          ],
        };
      }

      case 'list_campaigns': {
        const campaignList = await campaigns.listCampaigns(args);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, campaigns: campaignList }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// List resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'campaign://active',
        name: 'Active Campaigns',
        description: 'List of all active advertising campaigns',
        mimeType: 'application/json',
      },
      {
        uri: 'analytics://overview',
        name: 'Analytics Overview',
        description: 'Overall platform analytics and ROI metrics',
        mimeType: 'application/json',
      },
    ],
  };
});

// Read resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === 'campaign://active') {
    const activeCampaigns = await campaigns.listCampaigns({ status: 'active' });
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(activeCampaigns, null, 2),
        },
      ],
    };
  }

  if (uri === 'analytics://overview') {
    const overview = await analytics.getOverview();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(overview, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('AI Marketing Platform MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
