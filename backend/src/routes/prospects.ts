import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// GET /api/prospects - List prospects with filtering
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { stage, industry, score_min, assigned_to, source, search, sort_by, sort_order, limit, offset } = req.query;

    let sql = `SELECT * FROM prospects WHERE is_archived = false`;
    const params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      sql += ` AND user_id = $${paramIndex++}`;
      params.push(userId);
    }
    if (stage) {
      sql += ` AND stage = $${paramIndex++}`;
      params.push(stage);
    }
    if (industry) {
      sql += ` AND industry = $${paramIndex++}`;
      params.push(industry);
    }
    if (score_min) {
      sql += ` AND sell_likelihood_score >= $${paramIndex++}`;
      params.push(parseInt(score_min as string));
    }
    if (assigned_to) {
      sql += ` AND assigned_to = $${paramIndex++}`;
      params.push(parseInt(assigned_to as string));
    }
    if (source) {
      sql += ` AND source = $${paramIndex++}`;
      params.push(source);
    }
    if (search) {
      sql += ` AND (company_name ILIKE $${paramIndex} OR owner_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Sorting
    const validSortColumns = ['sell_likelihood_score', 'company_name', 'stage', 'industry', 'created_at', 'updated_at'];
    const sortCol = validSortColumns.includes(sort_by as string) ? sort_by : 'sell_likelihood_score';
    const sortDir = sort_order === 'asc' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${sortCol} ${sortDir}`;

    // Pagination
    const queryLimit = Math.min(parseInt(limit as string) || 50, 200);
    const queryOffset = parseInt(offset as string) || 0;
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(queryLimit, queryOffset);

    const result = await query(sql, params);

    // Get total count for pagination
    let countSql = `SELECT COUNT(*) FROM prospects WHERE is_archived = false`;
    const countParams: any[] = [];
    let countIndex = 1;
    if (userId) {
      countSql += ` AND user_id = $${countIndex++}`;
      countParams.push(userId);
    }
    if (stage) {
      countSql += ` AND stage = $${countIndex++}`;
      countParams.push(stage);
    }
    if (industry) {
      countSql += ` AND industry = $${countIndex++}`;
      countParams.push(industry);
    }

    const countResult = await query(countSql, countParams);

    res.json({
      prospects: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: queryLimit,
      offset: queryOffset,
    });
  } catch (error) {
    console.error('Error fetching prospects:', error);
    res.status(500).json({ error: 'Failed to fetch prospects' });
  }
});

// POST /api/prospects - Create prospect manually
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const {
      company_name, industry, sub_industry, website,
      location_city, location_state, location_country,
      estimated_revenue_min, estimated_revenue_max, employee_count_range, year_founded,
      owner_name, owner_title, owner_linkedin, owner_email, owner_phone, owner_estimated_age,
      ownership_type, stage, source, tags, notes,
    } = req.body;

    if (!company_name) {
      return res.status(400).json({ error: 'company_name is required' });
    }

    const result = await query(`
      INSERT INTO prospects (
        user_id, company_name, industry, sub_industry, website,
        location_city, location_state, location_country,
        estimated_revenue_min, estimated_revenue_max, employee_count_range, year_founded,
        owner_name, owner_title, owner_linkedin, owner_email, owner_phone, owner_estimated_age,
        ownership_type, stage, source, tags, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
      RETURNING *
    `, [
      userId, company_name, industry || null, sub_industry || null, website || null,
      location_city || null, location_state || null, location_country || 'US',
      estimated_revenue_min || null, estimated_revenue_max || null, employee_count_range || null, year_founded || null,
      owner_name || null, owner_title || null, owner_linkedin || null, owner_email || null, owner_phone || null, owner_estimated_age || null,
      ownership_type || 'founder', stage || 'lead', source || 'manual', tags || null, notes || null,
    ]);

    // Log activity
    await query(`
      INSERT INTO prospect_activities (prospect_id, user_id, activity_type, title)
      VALUES ($1, $2, 'created', 'Prospect added to pipeline')
    `, [result.rows[0].id, userId]);

    res.status(201).json({ prospect: result.rows[0] });
  } catch (error) {
    console.error('Error creating prospect:', error);
    res.status(500).json({ error: 'Failed to create prospect' });
  }
});

// GET /api/prospects/:id - Get prospect detail with signals, activities, and outreach
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const prospectResult = await query(`SELECT * FROM prospects WHERE id = $1 AND is_archived = false`, [id]);
    if (prospectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    const [signalsResult, activitiesResult, outreachResult] = await Promise.all([
      query(`SELECT * FROM prospect_signals WHERE prospect_id = $1 AND is_active = true ORDER BY signal_strength DESC`, [id]),
      query(`SELECT * FROM prospect_activities WHERE prospect_id = $1 ORDER BY created_at DESC LIMIT 50`, [id]),
      query(`SELECT * FROM outreach_drafts WHERE prospect_id = $1 ORDER BY created_at DESC`, [id]),
    ]);

    res.json({
      prospect: prospectResult.rows[0],
      signals: signalsResult.rows,
      activities: activitiesResult.rows,
      outreach_drafts: outreachResult.rows,
    });
  } catch (error) {
    console.error('Error fetching prospect:', error);
    res.status(500).json({ error: 'Failed to fetch prospect' });
  }
});

// PUT /api/prospects/:id - Update prospect
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const allowedFields = [
      'company_name', 'industry', 'sub_industry', 'website',
      'location_city', 'location_state', 'location_country',
      'estimated_revenue_min', 'estimated_revenue_max', 'employee_count_range', 'year_founded',
      'owner_name', 'owner_title', 'owner_linkedin', 'owner_email', 'owner_phone', 'owner_estimated_age',
      'ownership_type', 'tags', 'notes',
    ];

    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex++}`);
        params.push(updates[field]);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const result = await query(
      `UPDATE prospects SET ${setClauses.join(', ')} WHERE id = $${paramIndex} AND is_archived = false RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    res.json({ prospect: result.rows[0] });
  } catch (error) {
    console.error('Error updating prospect:', error);
    res.status(500).json({ error: 'Failed to update prospect' });
  }
});

// DELETE /api/prospects/:id - Soft delete (archive)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE prospects SET is_archived = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    res.json({ message: 'Prospect archived successfully' });
  } catch (error) {
    console.error('Error deleting prospect:', error);
    res.status(500).json({ error: 'Failed to delete prospect' });
  }
});

// PUT /api/prospects/:id/stage - Change pipeline stage
router.put('/:id/stage', async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    const userId = req.user?.id || 1;

    const validStages = ['lead', 'contacted', 'engaged', 'active_deal', 'closed_won', 'closed_lost'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ error: `Invalid stage. Must be one of: ${validStages.join(', ')}` });
    }

    // Get current stage for activity log
    const current = await query(`SELECT stage FROM prospects WHERE id = $1`, [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    const previousStage = current.rows[0].stage;

    const result = await query(
      `UPDATE prospects SET stage = $1, stage_changed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [stage, id]
    );

    // Log stage change activity
    await query(`
      INSERT INTO prospect_activities (prospect_id, user_id, activity_type, title, metadata)
      VALUES ($1, $2, 'stage_change', $3, $4)
    `, [id, userId, `Stage changed from ${previousStage} to ${stage}`, JSON.stringify({ stage_from: previousStage, stage_to: stage })]);

    res.json({ prospect: result.rows[0] });
  } catch (error) {
    console.error('Error changing prospect stage:', error);
    res.status(500).json({ error: 'Failed to change stage' });
  }
});

// POST /api/prospects/:id/signals - Manually add a signal
router.post('/:id/signals', async (req, res) => {
  try {
    const { id } = req.params;
    const { signal_category, signal_type, signal_description, signal_strength, confidence, source_url, source_type } = req.body;

    if (!signal_category || !signal_type || !signal_description || !signal_strength) {
      return res.status(400).json({ error: 'signal_category, signal_type, signal_description, and signal_strength are required' });
    }

    const result = await query(`
      INSERT INTO prospect_signals (prospect_id, signal_category, signal_type, signal_description, signal_strength, confidence, source_url, source_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [id, signal_category, signal_type, signal_description, signal_strength, confidence || 0.7, source_url || null, source_type || 'manual']);

    res.status(201).json({ signal: result.rows[0] });
  } catch (error) {
    console.error('Error adding signal:', error);
    res.status(500).json({ error: 'Failed to add signal' });
  }
});

// POST /api/prospects/:id/notes - Add a note activity
router.post('/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user?.id || 1;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    const result = await query(`
      INSERT INTO prospect_activities (prospect_id, user_id, activity_type, title, content)
      VALUES ($1, $2, 'note', 'Note added', $3)
      RETURNING *
    `, [id, userId, content]);

    res.status(201).json({ activity: result.rows[0] });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

export default router;
