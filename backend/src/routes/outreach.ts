import { Router } from 'express';
import { query } from '../db.js';
import { generateOutreach } from '../services/outreach-generator.js';
import { emitWebhook } from '../services/webhook-emitter.js';

const router = Router();

// POST /api/outreach/generate - Generate outreach content
router.post('/generate', async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { prospect_id, outreach_type, custom_instructions } = req.body;

    if (!prospect_id || !outreach_type) {
      return res.status(400).json({ error: 'prospect_id and outreach_type are required' });
    }

    const validTypes = ['cold_email', 'follow_up', 'linkedin_message', 'intro_one_pager'];
    if (!validTypes.includes(outreach_type)) {
      return res.status(400).json({ error: `Invalid outreach_type. Must be one of: ${validTypes.join(', ')}` });
    }

    const result = await generateOutreach(prospect_id, outreach_type, custom_instructions);

    // Save draft to database
    const saved = await query(`
      INSERT INTO outreach_drafts (prospect_id, user_id, outreach_type, subject, content, ai_prompt)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [prospect_id, userId, outreach_type, result.subject || null, result.content, custom_instructions || null]);

    // Log activity
    await query(`
      INSERT INTO prospect_activities (prospect_id, user_id, activity_type, title, metadata)
      VALUES ($1, $2, 'outreach_generated', $3, $4)
    `, [prospect_id, userId, `${outreach_type} draft generated`, JSON.stringify({ outreach_type, draft_id: saved.rows[0].id })]);

    res.status(201).json({ draft: saved.rows[0] });
  } catch (error) {
    console.error('Error generating outreach:', error);
    res.status(500).json({ error: 'Failed to generate outreach' });
  }
});

// GET /api/outreach/prospect/:prospectId - Get all drafts for a prospect
router.get('/prospect/:prospectId', async (req, res) => {
  try {
    const { prospectId } = req.params;

    const result = await query(
      `SELECT * FROM outreach_drafts WHERE prospect_id = $1 ORDER BY created_at DESC`,
      [prospectId]
    );

    res.json({ drafts: result.rows });
  } catch (error) {
    console.error('Error fetching outreach drafts:', error);
    res.status(500).json({ error: 'Failed to fetch outreach drafts' });
  }
});

// PUT /api/outreach/:id - Edit a draft
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, content } = req.body;

    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (subject !== undefined) {
      setClauses.push(`subject = $${paramIndex++}`);
      params.push(subject);
    }
    if (content !== undefined) {
      setClauses.push(`content = $${paramIndex++}`);
      params.push(content);
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const result = await query(
      `UPDATE outreach_drafts SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    res.json({ draft: result.rows[0] });
  } catch (error) {
    console.error('Error updating draft:', error);
    res.status(500).json({ error: 'Failed to update draft' });
  }
});

// PUT /api/outreach/:id/status - Mark as approved/sent
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id || 1;

    const validStatuses = ['draft', 'approved', 'sent'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updates: any[] = [status, id];
    let sql = `UPDATE outreach_drafts SET status = $1, updated_at = CURRENT_TIMESTAMP`;
    if (status === 'sent') {
      sql += `, sent_at = CURRENT_TIMESTAMP`;
    }
    sql += ` WHERE id = $2 RETURNING *`;

    const result = await query(sql, updates);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    const draft = result.rows[0];

    // Log activity if sent
    if (status === 'sent') {
      await query(`
        INSERT INTO prospect_activities (prospect_id, user_id, activity_type, title, metadata)
        VALUES ($1, $2, 'email_sent', $3, $4)
      `, [draft.prospect_id, userId, `${draft.outreach_type} marked as sent`, JSON.stringify({ draft_id: draft.id, outreach_type: draft.outreach_type })]);
    }

    // Fire-and-forget webhook notification
    emitWebhook('outreach.status_changed', {
      outreach_id: id,
      prospect_id: draft.prospect_id,
      outreach_type: draft.outreach_type,
      new_status: status,
    });

    res.json({ draft });
  } catch (error) {
    console.error('Error updating draft status:', error);
    res.status(500).json({ error: 'Failed to update draft status' });
  }
});

export default router;
