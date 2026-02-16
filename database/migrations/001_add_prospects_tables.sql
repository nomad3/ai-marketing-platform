-- Migration: Add Deal Intelligence tables for HCA prospect management
-- Date: 2026-02-16

-- Companies identified as potential sell-side clients
CREATE TABLE IF NOT EXISTS prospects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Company info
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    sub_industry VARCHAR(200),
    website VARCHAR(500),
    location_city VARCHAR(200),
    location_state VARCHAR(100),
    location_country VARCHAR(100) DEFAULT 'US',

    -- Size indicators
    estimated_revenue_min BIGINT,
    estimated_revenue_max BIGINT,
    employee_count_range VARCHAR(50),
    year_founded INTEGER,

    -- Ownership
    owner_name VARCHAR(255),
    owner_title VARCHAR(200),
    owner_linkedin VARCHAR(500),
    owner_email VARCHAR(255),
    owner_phone VARCHAR(50),
    owner_estimated_age INTEGER,
    ownership_type VARCHAR(50),

    -- AI scoring
    sell_likelihood_score INTEGER DEFAULT 0,
    score_breakdown JSONB,
    last_scored_at TIMESTAMP,

    -- AI research
    ai_research JSONB,
    last_researched_at TIMESTAMP,

    -- Pipeline
    stage VARCHAR(50) DEFAULT 'lead',
    stage_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Source tracking
    source VARCHAR(50),
    source_campaign_id VARCHAR(255) REFERENCES campaigns(id) ON DELETE SET NULL,

    -- Meta
    tags TEXT[],
    notes TEXT,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual signals detected for each prospect
CREATE TABLE IF NOT EXISTS prospect_signals (
    id SERIAL PRIMARY KEY,
    prospect_id INTEGER REFERENCES prospects(id) ON DELETE CASCADE,

    signal_category VARCHAR(50) NOT NULL,
    signal_type VARCHAR(100) NOT NULL,
    signal_description TEXT NOT NULL,
    signal_strength INTEGER NOT NULL,
    confidence DECIMAL(3,2),
    source_url VARCHAR(1000),
    source_type VARCHAR(50),

    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Timeline of interactions with prospects
CREATE TABLE IF NOT EXISTS prospect_activities (
    id SERIAL PRIMARY KEY,
    prospect_id INTEGER REFERENCES prospects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    activity_type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    content TEXT,
    metadata JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI-generated outreach content for prospects
CREATE TABLE IF NOT EXISTS outreach_drafts (
    id SERIAL PRIMARY KEY,
    prospect_id INTEGER REFERENCES prospects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    outreach_type VARCHAR(50) NOT NULL,
    subject VARCHAR(500),
    content TEXT NOT NULL,
    ai_prompt TEXT,

    status VARCHAR(50) DEFAULT 'draft',
    sent_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prospects_user_id ON prospects(user_id);
CREATE INDEX IF NOT EXISTS idx_prospects_stage ON prospects(stage);
CREATE INDEX IF NOT EXISTS idx_prospects_industry ON prospects(industry);
CREATE INDEX IF NOT EXISTS idx_prospects_sell_score ON prospects(sell_likelihood_score DESC);
CREATE INDEX IF NOT EXISTS idx_prospects_source_campaign ON prospects(source_campaign_id);
CREATE INDEX IF NOT EXISTS idx_prospects_archived ON prospects(is_archived);
CREATE INDEX IF NOT EXISTS idx_prospect_signals_prospect ON prospect_signals(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_signals_category ON prospect_signals(signal_category);
CREATE INDEX IF NOT EXISTS idx_prospect_activities_prospect ON prospect_activities(prospect_id);
CREATE INDEX IF NOT EXISTS idx_outreach_drafts_prospect ON outreach_drafts(prospect_id);
