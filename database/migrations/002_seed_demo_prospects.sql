-- Seed demo prospects for HCA Deal Intelligence
-- Assumes user ID 1 exists (demo user)

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

-- Add signals for top prospects
-- Pacific MedTech (score 87)
INSERT INTO prospect_signals (prospect_id, signal_category, signal_type, signal_description, signal_strength, confidence, source_type) VALUES
((SELECT id FROM prospects WHERE company_name = 'Pacific MedTech Solutions'), 'ownership_succession', 'owner_age', 'Founder Robert Chen is 62 years old, approaching typical exit age for medical device founders', 9, 0.85, 'ai_analysis'),
((SELECT id FROM prospects WHERE company_name = 'Pacific MedTech Solutions'), 'ownership_succession', 'years_in_business', 'Company operating for 28 years, suggesting mature business ready for transition', 8, 0.90, 'ai_analysis'),
((SELECT id FROM prospects WHERE company_name = 'Pacific MedTech Solutions'), 'market_timing', 'industry_ma_activity', 'Medical device M&A at record levels with strategic acquirers actively seeking targets', 8, 0.80, 'ai_analysis'),
((SELECT id FROM prospects WHERE company_name = 'Pacific MedTech Solutions'), 'company_performance', 'revenue_at_attractive_size', 'Revenue of $45-65M places company in the sweet spot for middle-market acquisition', 7, 0.85, 'ai_analysis');

-- Artisan Provisions (score 92 - highest)
INSERT INTO prospect_signals (prospect_id, signal_category, signal_type, signal_description, signal_strength, confidence, source_type) VALUES
((SELECT id FROM prospects WHERE company_name = 'Artisan Provisions Co.'), 'ownership_succession', 'owner_age', 'Founder David Morrison is 64, indicating strong likelihood of exit consideration', 9, 0.90, 'ai_analysis'),
((SELECT id FROM prospects WHERE company_name = 'Artisan Provisions Co.'), 'ownership_succession', 'no_succession_plan', 'No family members visible in leadership; limited management team depth', 8, 0.75, 'ai_analysis'),
((SELECT id FROM prospects WHERE company_name = 'Artisan Provisions Co.'), 'market_timing', 'multiples_at_cycle_highs', 'Specialty food brands commanding 10-14x EBITDA multiples, near historic highs', 9, 0.85, 'ai_analysis'),
((SELECT id FROM prospects WHERE company_name = 'Artisan Provisions Co.'), 'market_timing', 'competitor_exits', 'Three comparable specialty food companies sold in past 12 months', 8, 0.80, 'ai_analysis'),
((SELECT id FROM prospects WHERE company_name = 'Artisan Provisions Co.'), 'company_performance', 'profitability_improving', 'EBITDA margins estimated to have expanded from 12% to 18% over past 3 years', 7, 0.70, 'ai_analysis');

-- Precision Metal Works (score 85)
INSERT INTO prospect_signals (prospect_id, signal_category, signal_type, signal_description, signal_strength, confidence, source_type) VALUES
((SELECT id FROM prospects WHERE company_name = 'Precision Metal Works Inc.'), 'ownership_succession', 'owner_age', 'Owner Thomas Blackwell at 67, well past typical retirement age for industrial business owners', 10, 0.90, 'ai_analysis'),
((SELECT id FROM prospects WHERE company_name = 'Precision Metal Works Inc.'), 'ownership_succession', 'key_person_risk', 'Single founder with no identified successor or management team capable of running operations', 8, 0.80, 'ai_analysis'),
((SELECT id FROM prospects WHERE company_name = 'Precision Metal Works Inc.'), 'market_timing', 'industry_consolidation', 'PE firms actively rolling up precision machining shops across the Southwest', 8, 0.85, 'ai_analysis'),
((SELECT id FROM prospects WHERE company_name = 'Precision Metal Works Inc.'), 'external_triggers', 'capex_slowdown', 'Capital expenditure appears to have slowed, suggesting exit mindset over reinvestment', 7, 0.65, 'ai_analysis');

-- Add some activities
INSERT INTO prospect_activities (prospect_id, user_id, activity_type, title, content) VALUES
((SELECT id FROM prospects WHERE company_name = 'Pacific MedTech Solutions'), 1, 'note', 'Initial research complete', 'Strong target - founder is attending industry conferences but not presenting. May be exploring options.'),
((SELECT id FROM prospects WHERE company_name = 'Pacific MedTech Solutions'), 1, 'stage_change', 'Stage changed from contacted to engaged', NULL),
((SELECT id FROM prospects WHERE company_name = 'Artisan Provisions Co.'), 1, 'email_sent', 'Cold email sent to David Morrison', 'Sent personalized outreach referencing recent specialty food M&A activity.'),
((SELECT id FROM prospects WHERE company_name = 'Artisan Provisions Co.'), 1, 'stage_change', 'Stage changed from engaged to active_deal', NULL),
((SELECT id FROM prospects WHERE company_name = 'Heritage Home Health Partners'), 1, 'note', 'Spoke with industry contact', 'Confirmed Margaret Williams has been exploring options. Husband recently retired.'),
((SELECT id FROM prospects WHERE company_name = 'Precision Metal Works Inc.'), 1, 'note', 'Industry intel', 'Two competitors in Phoenix area recently sold to PE groups. Blackwell may be feeling pressure to act.');
