-- Initialize database schema for AI Marketing Platform

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    objective VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    budget DECIMAL(10, 2) NOT NULL,
    daily_budget DECIMAL(10, 2),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    targeting JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ad creatives table
CREATE TABLE IF NOT EXISTS ad_creatives (
    id SERIAL PRIMARY KEY,
    campaign_id VARCHAR(255) REFERENCES campaigns(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- image, video, copy
    content_url TEXT,
    content_data JSONB,
    headline TEXT,
    body TEXT,
    cta VARCHAR(100),
    generated_by_ai BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign metrics table
CREATE TABLE IF NOT EXISTS campaign_metrics (
    id SERIAL PRIMARY KEY,
    campaign_id VARCHAR(255) REFERENCES campaigns(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    spend DECIMAL(10, 2) DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    ctr DECIMAL(5, 2),
    cpc DECIMAL(10, 2),
    cpm DECIMAL(10, 2),
    roi DECIMAL(10, 2),
    roas DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, date)
);

-- API integrations table
CREATE TABLE IF NOT EXISTS api_integrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    credentials JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, platform)
);

-- AI generation history
CREATE TABLE IF NOT EXISTS ai_generation_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    campaign_id VARCHAR(255) REFERENCES campaigns(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    prompt TEXT NOT NULL,
    result JSONB,
    cost DECIMAL(10, 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_platform ON campaigns(platform);
CREATE INDEX idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);
CREATE INDEX idx_campaign_metrics_date ON campaign_metrics(date);
CREATE INDEX idx_ad_creatives_campaign_id ON ad_creatives(campaign_id);

-- Insert demo user
INSERT INTO users (email, password_hash, name, company, role)
VALUES ('demo@aimarketing.com', '$2b$10$demohashdemohashdemohashdemohashdemohashdemoha', 'Demo User', 'AI Marketing Co', 'admin')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- Deal Intelligence Module (HCA)
-- ============================================

-- Companies identified as potential sell-side clients
CREATE TABLE IF NOT EXISTS prospects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    sub_industry VARCHAR(200),
    website VARCHAR(500),
    location_city VARCHAR(200),
    location_state VARCHAR(100),
    location_country VARCHAR(100) DEFAULT 'US',
    estimated_revenue_min BIGINT,
    estimated_revenue_max BIGINT,
    employee_count_range VARCHAR(50),
    year_founded INTEGER,
    owner_name VARCHAR(255),
    owner_title VARCHAR(200),
    owner_linkedin VARCHAR(500),
    owner_email VARCHAR(255),
    owner_phone VARCHAR(50),
    owner_estimated_age INTEGER,
    ownership_type VARCHAR(50),
    sell_likelihood_score INTEGER DEFAULT 0,
    score_breakdown JSONB,
    last_scored_at TIMESTAMP,
    ai_research JSONB,
    last_researched_at TIMESTAMP,
    stage VARCHAR(50) DEFAULT 'lead',
    stage_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    source VARCHAR(50),
    source_campaign_id VARCHAR(255) REFERENCES campaigns(id) ON DELETE SET NULL,
    tags TEXT[],
    notes TEXT,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
