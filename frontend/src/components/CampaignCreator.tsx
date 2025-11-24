import { Calendar, DollarSign, Target, TrendingUp, Users, X } from 'lucide-react';
import { useState } from 'react';
import './CampaignCreator.css';

interface CampaignCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated?: (campaign: any) => void;
}

export default function CampaignCreator({ isOpen, onClose, onCampaignCreated }: CampaignCreatorProps) {
  const [formData, setFormData] = useState({
    name: '',
    platform: 'meta',
    objective: 'conversions',
    budget: '',
    dailyBudget: '',
    startDate: '',
    endDate: '',
    targetAudience: {
      ageMin: '18',
      ageMax: '65',
      locations: '',
      interests: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          platform: formData.platform,
          objective: formData.objective,
          budget: parseFloat(formData.budget),
          dailyBudget: parseFloat(formData.dailyBudget),
          startDate: formData.startDate,
          endDate: formData.endDate,
          targetAudience: {
            ageRange: [parseInt(formData.targetAudience.ageMin), parseInt(formData.targetAudience.ageMax)],
            locations: formData.targetAudience.locations.split(',').map(l => l.trim()),
            interests: formData.targetAudience.interests.split(',').map(i => i.trim()),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create campaign');
      }

      const data = await response.json();

      if (onCampaignCreated) {
        onCampaignCreated(data.campaign);
      }

      // Reset form and close
      setFormData({
        name: '',
        platform: 'meta',
        objective: 'conversions',
        budget: '',
        dailyBudget: '',
        startDate: '',
        endDate: '',
        targetAudience: {
          ageMin: '18',
          ageMax: '65',
          locations: '',
          interests: '',
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('targetAudience.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        targetAudience: {
          ...prev.targetAudience,
          [field]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content campaign-creator" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Create New Campaign</h2>
            <p>Set up your advertising campaign</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="campaign-form">
          {/* Basic Information */}
          <div className="form-section">
            <h3>
              <Target size={20} />
              Basic Information
            </h3>

            <div className="form-group">
              <label htmlFor="name">Campaign Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Summer Sale 2024"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="platform">Platform *</label>
                <select
                  id="platform"
                  name="platform"
                  value={formData.platform}
                  onChange={handleChange}
                  required
                >
                  <option value="meta">Meta (Facebook/Instagram)</option>
                  <option value="google">Google Ads</option>
                  <option value="tiktok">TikTok</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="objective">Objective *</label>
                <select
                  id="objective"
                  name="objective"
                  value={formData.objective}
                  onChange={handleChange}
                  required
                >
                  <option value="conversions">Conversions</option>
                  <option value="traffic">Traffic</option>
                  <option value="awareness">Brand Awareness</option>
                  <option value="engagement">Engagement</option>
                  <option value="leads">Lead Generation</option>
                </select>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="form-section">
            <h3>
              <DollarSign size={20} />
              Budget
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="budget">Total Budget ($) *</label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="5000"
                  min="1"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dailyBudget">Daily Budget ($) *</label>
                <input
                  type="number"
                  id="dailyBudget"
                  name="dailyBudget"
                  value={formData.dailyBudget}
                  onChange={handleChange}
                  placeholder="100"
                  min="1"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="form-section">
            <h3>
              <Calendar size={20} />
              Schedule
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate">Start Date *</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate}
                />
              </div>
            </div>
          </div>

          {/* Target Audience */}
          <div className="form-section">
            <h3>
              <Users size={20} />
              Target Audience
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ageMin">Age Range *</label>
                <div className="age-range">
                  <input
                    type="number"
                    id="ageMin"
                    name="targetAudience.ageMin"
                    value={formData.targetAudience.ageMin}
                    onChange={handleChange}
                    placeholder="18"
                    min="13"
                    max="65"
                    required
                  />
                  <span>to</span>
                  <input
                    type="number"
                    name="targetAudience.ageMax"
                    value={formData.targetAudience.ageMax}
                    onChange={handleChange}
                    placeholder="65"
                    min="13"
                    max="65"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="locations">Locations (comma-separated)</label>
              <input
                type="text"
                id="locations"
                name="targetAudience.locations"
                value={formData.targetAudience.locations}
                onChange={handleChange}
                placeholder="United States, Canada, United Kingdom"
              />
            </div>

            <div className="form-group">
              <label htmlFor="interests">Interests (comma-separated)</label>
              <textarea
                id="interests"
                name="targetAudience.interests"
                value={formData.targetAudience.interests}
                onChange={handleChange}
                placeholder="technology, business, marketing, entrepreneurship"
                rows={3}
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="spinner-small"></div>
                  Creating...
                </>
              ) : (
                <>
                  <TrendingUp size={20} />
                  Create Campaign
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
