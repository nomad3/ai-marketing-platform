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

-- ============================================
-- Seed Demo Prospects
-- ============================================

-- Healthcare prospects
INSERT INTO prospects (user_id, company_name, industry, sub_industry, website, location_city, location_state, estimated_revenue_min, estimated_revenue_max, employee_count_range, year_founded, owner_name, owner_title, owner_estimated_age, ownership_type, sell_likelihood_score, score_breakdown, stage, source) VALUES
(1, 'Pacific MedTech Solutions', 'healthcare', 'Medical Devices', 'www.pacificmedtech.com', 'Irvine', 'CA', 45000000, 65000000, '200-500', 1998, 'Robert Chen', 'CEO & Founder', 62, 'founder', 87, '{"ownership_succession": 85, "market_timing": 78, "company_performance": 72, "external_triggers": 65}', 'engaged', 'ai_discovery'),
(1, 'Heritage Home Health Partners', 'healthcare', 'Home Health Services', 'www.heritagehomehealth.com', 'San Diego', 'CA', 28000000, 42000000, '200-500', 2003, 'Margaret Williams', 'President & Owner', 58, 'founder', 74, '{"ownership_succession": 70, "market_timing": 82, "company_performance": 68, "external_triggers": 55}', 'contacted', 'ai_discovery'),
(1, 'Coastal Dental Group', 'healthcare', 'Dental Services', 'www.coastaldentalgroup.com', 'Newport Beach', 'CA', 18000000, 25000000, '50-200', 2001, 'Dr. James Park', 'Managing Partner', 55, 'founder', 68, '{"ownership_succession": 60, "market_timing": 75, "company_performance": 65, "external_triggers": 50}', 'lead', 'manual'),
-- Consumer prospects
(1, 'Artisan Provisions Co.', 'consumer', 'Specialty Food & Beverage', 'www.artisanprovisions.com', 'Portland', 'OR', 32000000, 48000000, '50-200', 1996, 'David Morrison', 'Founder & CEO', 64, 'founder', 92, '{"ownership_succession": 95, "market_timing": 88, "company_performance": 80, "external_triggers": 75}', 'active_deal', 'ai_discovery'),
(1, 'Summit Outdoor Brands', 'consumer', 'DTC E-Commerce', 'www.summitoutdoor.com', 'Denver', 'CO', 22000000, 35000000, '50-200', 2005, 'Karen Mitchell', 'CEO & Co-Founder', 51, 'founder', 55, '{"ownership_succession": 40, "market_timing": 65, "company_performance": 70, "external_triggers": 45}', 'lead', 'campaign'),
-- Industrial prospects
(1, 'Precision Metal Works Inc.', 'industrial', 'Precision Machining', 'www.precisionmetalworks.com', 'Phoenix', 'AZ', 55000000, 78000000, '200-500', 1992, 'Thomas Blackwell', 'Owner & President', 67, 'founder', 85, '{"ownership_succession": 90, "market_timing": 72, "company_performance": 78, "external_triggers": 70}', 'contacted', 'ai_discovery'),
(1, 'WestPac Packaging Solutions', 'industrial', 'Packaging Manufacturing', 'www.westpacpkg.com', 'Sacramento', 'CA', 40000000, 60000000, '200-500', 1999, 'Richard Yamamoto', 'Chairman & CEO', 63, 'family', 78, '{"ownership_succession": 82, "market_timing": 70, "company_performance": 75, "external_triggers": 60}', 'engaged', 'manual'),
-- Business Services prospects
(1, 'TalentBridge Staffing', 'business_services', 'IT Staffing', 'www.talentbridge.com', 'Austin', 'TX', 35000000, 52000000, '50-200', 2002, 'Lisa Hernandez', 'Founder & CEO', 56, 'founder', 71, '{"ownership_succession": 65, "market_timing": 80, "company_performance": 72, "external_triggers": 55}', 'lead', 'ai_discovery'),
(1, 'CleanSpace Commercial Services', 'business_services', 'Commercial Cleaning', 'www.cleanspacecommercial.com', 'Los Angeles', 'CA', 15000000, 22000000, '200-500', 1997, 'Frank Delgado', 'Owner', 61, 'founder', 45, '{"ownership_succession": 55, "market_timing": 35, "company_performance": 40, "negative": 30}', 'lead', 'manual'),
(1, 'NextLevel IT Consulting', 'business_services', 'IT Consulting', 'www.nextlevelitc.com', 'Seattle', 'WA', 20000000, 30000000, '50-200', 2008, 'Alex Petrov', 'Managing Director', 44, 'founder', 32, '{"ownership_succession": 20, "market_timing": 45, "company_performance": 55, "negative": 40}', 'lead', 'ai_discovery');

-- Signals for top prospects
INSERT INTO prospect_signals (prospect_id, signal_category, signal_type, signal_description, signal_strength, confidence, source_type) VALUES
((SELECT id FROM prospects WHERE company_name = 'Pacific MedTech Solutions'), 'ownership_succession', 'owner_age', 'Founder Robert Chen is 62 years old, approaching typical exit age', 9, 0.85, 'ai_analysis'),
((SELECT id FROM prospects WHERE company_name = 'Pacific MedTech Solutions'), 'market_timing', 'industry_ma_activity', 'Medical device M&A at record levels', 8, 0.80, 'ai_analysis'),
((SELECT id FROM prospects WHERE company_name = 'Artisan Provisions Co.'), 'ownership_succession', 'owner_age', 'Founder David Morrison is 64, strong likelihood of exit consideration', 9, 0.90, 'ai_analysis'),
((SELECT id FROM prospects WHERE company_name = 'Artisan Provisions Co.'), 'market_timing', 'multiples_at_cycle_highs', 'Specialty food brands commanding 10-14x EBITDA multiples', 9, 0.85, 'ai_analysis'),
((SELECT id FROM prospects WHERE company_name = 'Precision Metal Works Inc.'), 'ownership_succession', 'owner_age', 'Owner Thomas Blackwell at 67, well past typical retirement age', 10, 0.90, 'ai_analysis'),
((SELECT id FROM prospects WHERE company_name = 'Precision Metal Works Inc.'), 'market_timing', 'industry_consolidation', 'PE firms actively rolling up precision machining shops', 8, 0.85, 'ai_analysis');

-- Sample activities
INSERT INTO prospect_activities (prospect_id, user_id, activity_type, title, content) VALUES
((SELECT id FROM prospects WHERE company_name = 'Pacific MedTech Solutions'), 1, 'note', 'Initial research complete', 'Strong target - founder attending conferences but not presenting.'),
((SELECT id FROM prospects WHERE company_name = 'Artisan Provisions Co.'), 1, 'email_sent', 'Cold email sent to David Morrison', 'Sent personalized outreach referencing recent specialty food M&A activity.'),
((SELECT id FROM prospects WHERE company_name = 'Precision Metal Works Inc.'), 1, 'note', 'Industry intel', 'Two competitors in Phoenix area recently sold to PE groups.');
