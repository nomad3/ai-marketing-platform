import {
  Building2,
  Check,
  Loader2,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useState } from 'react';
import './ProspectDiscovery.css';

interface DiscoveredProspect {
  company_name: string;
  industry: string;
  sub_industry?: string;
  website?: string;
  location_city?: string;
  location_state?: string;
  estimated_revenue_min?: number;
  estimated_revenue_max?: number;
  employee_count_range?: string;
  year_founded?: number;
  owner_name?: string;
  owner_title?: string;
  owner_estimated_age?: number;
  ownership_type?: string;
  key_signals: string[];
  estimated_score?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProspectsAdded: () => void;
}

export default function ProspectDiscovery({ isOpen, onClose, onProspectsAdded }: Props) {
  const [industry, setIndustry] = useState('healthcare');
  const [revenueMin, setRevenueMin] = useState('10000000');
  const [revenueMax, setRevenueMax] = useState('100000000');
  const [geography, setGeography] = useState('California');
  const [ownershipType, setOwnershipType] = useState('founder');
  const [maxResults, setMaxResults] = useState('10');

  const [discovering, setDiscovering] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<DiscoveredProspect[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [step, setStep] = useState<'form' | 'results'>('form');
  const [progressMsg, setProgressMsg] = useState('');

  const handleDiscover = async () => {
    setDiscovering(true);
    setProgressMsg('Searching for prospects...');
    try {
      setTimeout(() => setProgressMsg('Analyzing company signals...'), 3000);
      setTimeout(() => setProgressMsg('Scoring sell likelihood...'), 6000);

      const res = await fetch('/api/prospects/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry,
          revenue_min: parseInt(revenueMin),
          revenue_max: parseInt(revenueMax),
          geography,
          ownership_type: ownershipType,
          max_results: parseInt(maxResults),
        }),
      });
      const data = await res.json();
      setResults(data.prospects || []);
      setSelected(new Set(data.prospects?.map((_: any, i: number) => i) || []));
      setStep('results');
    } catch (error) {
      console.error('Discovery failed:', error);
    } finally {
      setDiscovering(false);
      setProgressMsg('');
    }
  };

  const handleSaveSelected = async () => {
    setSaving(true);
    try {
      const selectedProspects = results.filter((_, i) => selected.has(i));
      const res = await fetch('/api/prospects/discover/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospects: selectedProspects }),
      });
      if (res.ok) {
        onProspectsAdded();
      }
    } catch (error) {
      console.error('Failed to save prospects:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (index: number) => {
    const newSelected = new Set(selected);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelected(newSelected);
  };

  const toggleAll = () => {
    if (selected.size === results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map((_, i) => i)));
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#00f2fe';
    if (score >= 50) return '#fee140';
    return '#b8c1ec';
  };

  const formatRevenue = (min?: number, max?: number) => {
    const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(0)}M` : `$${(n / 1_000).toFixed(0)}K`;
    if (min && max) return `${fmt(min)}-${fmt(max)}`;
    if (min) return `${fmt(min)}+`;
    return '—';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="discovery-modal card glass" onClick={(e) => e.stopPropagation()}>
        <div className="discovery-header">
          <div className="discovery-title">
            <Sparkles size={24} className="discovery-icon" />
            <div>
              <h2>AI Prospect Discovery</h2>
              <p>Find companies likely to sell using AI-powered signal analysis</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {step === 'form' && (
          <div className="discovery-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Industry *</label>
                <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
                  <option value="healthcare">Healthcare</option>
                  <option value="consumer">Consumer</option>
                  <option value="industrial">Industrial</option>
                  <option value="business_services">Business Services</option>
                </select>
              </div>
              <div className="form-group">
                <label>Geography</label>
                <input type="text" value={geography} onChange={(e) => setGeography(e.target.value)} placeholder="e.g., California, Texas" />
              </div>
              <div className="form-group">
                <label>Revenue Min ($)</label>
                <select value={revenueMin} onChange={(e) => setRevenueMin(e.target.value)}>
                  <option value="5000000">$5M</option>
                  <option value="10000000">$10M</option>
                  <option value="20000000">$20M</option>
                  <option value="50000000">$50M</option>
                </select>
              </div>
              <div className="form-group">
                <label>Revenue Max ($)</label>
                <select value={revenueMax} onChange={(e) => setRevenueMax(e.target.value)}>
                  <option value="50000000">$50M</option>
                  <option value="100000000">$100M</option>
                  <option value="200000000">$200M</option>
                  <option value="500000000">$500M</option>
                </select>
              </div>
              <div className="form-group">
                <label>Ownership Type</label>
                <select value={ownershipType} onChange={(e) => setOwnershipType(e.target.value)}>
                  <option value="founder">Founder-owned</option>
                  <option value="family">Family-owned</option>
                  <option value="any">Any</option>
                </select>
              </div>
              <div className="form-group">
                <label>Max Results</label>
                <select value={maxResults} onChange={(e) => setMaxResults(e.target.value)}>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                </select>
              </div>
            </div>

            <button className="btn btn-primary btn-large discover-btn" onClick={handleDiscover} disabled={discovering}>
              {discovering ? (
                <>
                  <Loader2 size={18} className="spinning" />
                  <span>{progressMsg || 'Discovering...'}</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span>Discover Prospects</span>
                </>
              )}
            </button>
          </div>
        )}

        {step === 'results' && (
          <div className="discovery-results">
            <div className="results-header">
              <span>{results.length} companies found</span>
              <div className="results-actions">
                <button className="btn btn-secondary btn-sm" onClick={toggleAll}>
                  {selected.size === results.length ? 'Deselect All' : 'Select All'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setStep('form')}>
                  New Search
                </button>
              </div>
            </div>

            <div className="results-list">
              {results.map((prospect, i) => (
                <div key={i} className={`result-card ${selected.has(i) ? 'selected' : ''}`} onClick={() => toggleSelect(i)}>
                  <div className="result-checkbox">
                    {selected.has(i) ? <Check size={16} /> : <div className="checkbox-empty" />}
                  </div>
                  <div className="result-info">
                    <div className="result-top">
                      <div className="result-name">
                        <Building2 size={16} />
                        <span>{prospect.company_name}</span>
                      </div>
                      <div className="result-score" style={{ color: getScoreColor(prospect.estimated_score || 0) }}>
                        {prospect.estimated_score || '—'}
                      </div>
                    </div>
                    <div className="result-meta">
                      <span>{prospect.industry}</span>
                      <span>{formatRevenue(prospect.estimated_revenue_min, prospect.estimated_revenue_max)}</span>
                      <span>{[prospect.location_city, prospect.location_state].filter(Boolean).join(', ')}</span>
                      {prospect.owner_name && <span>{prospect.owner_name}{prospect.owner_estimated_age ? `, ${prospect.owner_estimated_age}` : ''}</span>}
                    </div>
                    {prospect.key_signals?.length > 0 && (
                      <div className="result-signals">
                        {prospect.key_signals.slice(0, 3).map((signal, j) => (
                          <span key={j} className="signal-chip">{signal}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="results-footer">
              <button className="btn btn-primary btn-large" onClick={handleSaveSelected} disabled={saving || selected.size === 0}>
                {saving ? (
                  <><Loader2 size={18} className="spinning" /> Saving...</>
                ) : (
                  <>Add {selected.size} to Pipeline</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
