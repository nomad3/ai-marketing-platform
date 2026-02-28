import { Router, Request, Response } from 'express';
import { emitWebhook } from '../services/webhook-emitter.js';

const router = Router();

router.get('/status', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'hca-deal-intelligence',
    version: '1.0.0',
    uptime: process.uptime(),
    webhook_url: process.env.SERVICETSUNAMI_WEBHOOK_URL ? 'configured' : 'not_configured',
  });
});

router.get('/config', (req: Request, res: Response) => {
  res.json({
    events: [
      'prospect.created',
      'prospect.stage_changed',
      'prospect.scored',
      'prospect.research_completed',
      'outreach.status_changed',
    ],
    endpoints: [
      { method: 'GET', path: '/api/prospects', description: 'List/filter prospects' },
      { method: 'GET', path: '/api/prospects/:id', description: 'Get prospect detail' },
      { method: 'POST', path: '/api/prospects/discover', description: 'AI prospect discovery' },
      { method: 'POST', path: '/api/prospects/discover/save', description: 'Save discovered prospects' },
      { method: 'POST', path: '/api/prospects/:id/score', description: 'Run AI scoring' },
      { method: 'POST', path: '/api/prospects/:id/research', description: 'Generate research brief' },
      { method: 'PUT', path: '/api/prospects/:id/stage', description: 'Advance pipeline stage' },
      { method: 'POST', path: '/api/outreach/generate', description: 'Generate outreach' },
      { method: 'GET', path: '/api/outreach/prospect/:id', description: 'Get outreach drafts' },
      { method: 'PUT', path: '/api/outreach/:id/status', description: 'Update outreach status' },
    ],
    auth: {
      type: 'service_key',
      header: 'X-Service-Key',
    },
  });
});

router.post('/webhook-test', async (req: Request, res: Response) => {
  try {
    await emitWebhook('integration.test', { message: 'Test webhook from HCA' });
    res.json({ status: 'sent' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
