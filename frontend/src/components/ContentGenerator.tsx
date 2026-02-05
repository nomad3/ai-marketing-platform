import { Loader, Sparkles, X, Copy, Download, RefreshCw, Target, Users, Palette, Wand2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import './ContentGenerator.css';

interface ContentGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ContentTemplate {
  name: string;
  prompt: string;
  style: string;
  category: string;
}

interface GenerationOptions {
  objective: string;
  platform: string;
  audience: string;
  industry: string;
  tone: string;
  format: string;
}

export default function ContentGenerator({ isOpen, onClose }: ContentGeneratorProps) {
  const [contentType, setContentType] = useState<'image' | 'video' | 'copy'>('copy');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>({
    objective: 'conversions',
    platform: 'meta',
    audience: 'general',
    industry: 'ecommerce',
    tone: 'professional',
    format: 'single-image'
  });
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<any[]>([]);

  // Content templates for different industries and objectives
  const contentTemplates = {
    image: [
      {
        name: "Product Showcase",
        prompt: "Professional product photography with clean background, studio lighting, commercial photography style",
        style: "modern, clean, commercial",
        category: "ecommerce"
      },
      {
        name: "Lifestyle Shot",
        prompt: "People using the product in real-life scenarios, authentic moments, natural lighting, lifestyle photography",
        style: "authentic, vibrant, lifestyle",
        category: "brand"
      },
      {
        name: "Social Media Ad",
        prompt: "Eye-catching social media advertisement with bold colors, engaging composition, mobile-optimized design",
        style: "bold, colorful, engaging",
        category: "social"
      },
      {
        name: "Hero Banner",
        prompt: "Professional website header image, clean design, corporate aesthetic, high-quality business imagery",
        style: "professional, sleek, corporate",
        category: "business"
      }
    ],
    video: [
      {
        name: "Product Demo",
        prompt: "30-second product demonstration video showing key features and benefits, professional lighting",
        style: "clean, informative, engaging",
        category: "ecommerce"
      },
      {
        name: "Brand Story",
        prompt: "Emotional brand storytelling video with authentic moments, inspiring narrative, cinematic quality",
        style: "emotional, cinematic, authentic",
        category: "brand"
      },
      {
        name: "Testimonial",
        prompt: "Customer testimonial video with real people, genuine reactions, professional but authentic feel",
        style: "authentic, trustworthy, personal",
        category: "social-proof"
      },
      {
        name: "Explainer Animation",
        prompt: "Animated explainer video with motion graphics, clear messaging, professional animation style",
        style: "animated, clear, professional",
        category: "educational"
      }
    ],
    copy: [
      {
        name: "Conversion-Focused",
        prompt: "High-converting ad copy that drives immediate action with compelling headlines and clear CTAs",
        style: "persuasive, urgent, benefit-driven",
        category: "conversions"
      },
      {
        name: "Brand Awareness",
        prompt: "Engaging brand story that builds emotional connection and increases brand recognition",
        style: "emotional, memorable, brand-focused",
        category: "awareness"
      },
      {
        name: "Lead Generation",
        prompt: "Lead magnet copy that offers value in exchange for contact information with clear benefits",
        style: "value-focused, educational, trustworthy",
        category: "leads"
      },
      {
        name: "Social Engagement",
        prompt: "Social media copy that encourages likes, shares, and comments with conversational tone",
        style: "conversational, engaging, shareable",
        category: "engagement"
      }
    ]
  };

  useEffect(() => {
    // Auto-select template based on generation options
    const templates = contentTemplates[contentType];
    if (templates && generationOptions.objective) {
      const matchingTemplate = templates.find(t => 
        t.category === generationOptions.objective || 
        t.name.toLowerCase().includes(generationOptions.objective)
      );
      if (matchingTemplate) {
        setSelectedTemplate(matchingTemplate);
        setPrompt(matchingTemplate.prompt);
        setStyle(matchingTemplate.style);
      }
    }
  }, [contentType, generationOptions.objective]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedContent(null);

    try {
      // Enhanced request with more context
      const enhancedPrompt = generateEnhancedPrompt();
      
      const response = await fetch('http://localhost:3000/api/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: contentType,
          prompt: enhancedPrompt,
          style,
          generationOptions,
          dimensions: contentType === 'image' ? getDimensions() : undefined,
          template: selectedTemplate?.name
        }),
      });

      const data = await response.json();
      setGeneratedContent(data.content);
      
      // Add to generation history
      setGenerationHistory(prev => [
        { 
          type: contentType,
          prompt: enhancedPrompt,
          style,
          content: data.content,
          timestamp: new Date(),
          template: selectedTemplate?.name
        },
        ...prev
      ].slice(0, 10)); // Keep last 10 generations
      
    } catch (error) {
      console.error('Failed to generate content:', error);
      setGeneratedContent({
        error: 'Failed to generate content. Please try again.',
        type: 'error'
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateEnhancedPrompt = () => {
    let enhancedPrompt = prompt;
    
    // Add context based on generation options
    if (generationOptions.platform === 'meta') {
      enhancedPrompt += ', optimized for Facebook and Instagram feeds';
    } else if (generationOptions.platform === 'tiktok') {
      enhancedPrompt += ', designed for TikTok vertical format, engaging for young audience';
    } else if (generationOptions.platform === 'linkedin') {
      enhancedPrompt += ', professional and business-appropriate for LinkedIn';
    }

    // Add audience context
    if (generationOptions.audience !== 'general') {
      enhancedPrompt += `, targeting ${generationOptions.audience} audience`;
    }

    // Add industry context
    if (generationOptions.industry !== 'general') {
      enhancedPrompt += `, ${generationOptions.industry} industry focus`;
    }

    // Add tone context
    enhancedPrompt += `, ${generationOptions.tone} tone`;

    return enhancedPrompt;
  };

  const getDimensions = () => {
    const dimensionMap = {
      'square': { width: 1080, height: 1080 },
      'story': { width: 1080, height: 1920 },
      'landscape': { width: 1200, height: 628 },
      'banner': { width: 1200, height: 300 }
    };
    
    return dimensionMap[generationOptions.format] || { width: 1200, height: 628 };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const regenerateContent = () => {
    handleGenerate();
  };

  const useTemplate = (template: ContentTemplate) => {
    setSelectedTemplate(template);
    setPrompt(template.prompt);
    setStyle(template.style);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-large card glass" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>
              <Sparkles size={24} />
              AI Content Generator
            </h2>
            <p>Create high-converting content with advanced AI</p>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body-large">
          <div className="content-generator-grid">
            {/* Left Panel - Generation Controls */}
            <div className="generation-controls">
              {/* Content Type Selection */}
              <div className="form-group">
                <label>Content Type</label>
                <div className="content-type-tabs">
                  <button
                    className={`type-tab ${contentType === 'copy' ? 'active' : ''}`}
                    onClick={() => setContentType('copy')}
                  >
                    <Wand2 size={18} />
                    Copy
                  </button>
                  <button
                    className={`type-tab ${contentType === 'image' ? 'active' : ''}`}
                    onClick={() => setContentType('image')}
                  >
                    <Palette size={18} />
                    Image
                  </button>
                  <button
                    className={`type-tab ${contentType === 'video' ? 'active' : ''}`}
                    onClick={() => setContentType('video')}
                  >
                    🎥 Video
                  </button>
                </div>
              </div>

              {/* Quick Options */}
              <div className="quick-options">
                <div className="option-group">
                  <label>Campaign Objective</label>
                  <select
                    value={generationOptions.objective}
                    onChange={(e) => setGenerationOptions(prev => ({ ...prev, objective: e.target.value }))}
                    className="input"
                  >
                    <option value="conversions">Sales & Conversions</option>
                    <option value="leads">Lead Generation</option>
                    <option value="awareness">Brand Awareness</option>
                    <option value="engagement">Social Engagement</option>
                    <option value="traffic">Website Traffic</option>
                  </select>
                </div>

                <div className="option-group">
                  <label>Platform</label>
                  <select
                    value={generationOptions.platform}
                    onChange={(e) => setGenerationOptions(prev => ({ ...prev, platform: e.target.value }))}
                    className="input"
                  >
                    <option value="meta">Meta (Facebook/Instagram)</option>
                    <option value="google">Google Ads</option>
                    <option value="tiktok">TikTok</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="youtube">YouTube</option>
                  </select>
                </div>
              </div>

              {/* Templates */}
              <div className="templates-section">
                <label>Content Templates</label>
                <div className="templates-grid">
                  {contentTemplates[contentType].map((template, index) => (
                    <div
                      key={index}
                      className={`template-card ${selectedTemplate?.name === template.name ? 'selected' : ''}`}
                      onClick={() => useTemplate(template)}
                    >
                      <div className="template-name">{template.name}</div>
                      <div className="template-category">{template.category}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced Options */}
              <div className="advanced-toggle">
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                >
                  <Target size={16} />
                  Advanced Options
                </button>
              </div>

              {showAdvancedOptions && (
                <div className="advanced-options">
                  <div className="option-row">
                    <div className="option-group">
                      <label>Target Audience</label>
                      <select
                        value={generationOptions.audience}
                        onChange={(e) => setGenerationOptions(prev => ({ ...prev, audience: e.target.value }))}
                        className="input"
                      >
                        <option value="general">General Audience</option>
                        <option value="millennials">Millennials (25-40)</option>
                        <option value="gen-z">Gen Z (18-25)</option>
                        <option value="professionals">Business Professionals</option>
                        <option value="parents">Parents</option>
                        <option value="seniors">Seniors (55+)</option>
                      </select>
                    </div>

                    <div className="option-group">
                      <label>Industry</label>
                      <select
                        value={generationOptions.industry}
                        onChange={(e) => setGenerationOptions(prev => ({ ...prev, industry: e.target.value }))}
                        className="input"
                      >
                        <option value="ecommerce">E-commerce</option>
                        <option value="saas">SaaS/Technology</option>
                        <option value="finance">Finance</option>
                        <option value="health">Health & Wellness</option>
                        <option value="education">Education</option>
                        <option value="real-estate">Real Estate</option>
                      </select>
                    </div>
                  </div>

                  <div className="option-row">
                    <div className="option-group">
                      <label>Tone</label>
                      <select
                        value={generationOptions.tone}
                        onChange={(e) => setGenerationOptions(prev => ({ ...prev, tone: e.target.value }))}
                        className="input"
                      >
                        <option value="professional">Professional</option>
                        <option value="casual">Casual & Friendly</option>
                        <option value="urgent">Urgent & Direct</option>
                        <option value="emotional">Emotional</option>
                        <option value="humorous">Humorous</option>
                        <option value="luxurious">Luxurious</option>
                      </select>
                    </div>

                    {contentType === 'image' && (
                      <div className="option-group">
                        <label>Format</label>
                        <select
                          value={generationOptions.format}
                          onChange={(e) => setGenerationOptions(prev => ({ ...prev, format: e.target.value }))}
                          className="input"
                        >
                          <option value="square">Square (1:1)</option>
                          <option value="landscape">Landscape (16:9)</option>
                          <option value="story">Story (9:16)</option>
                          <option value="banner">Banner (4:1)</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Prompt */}
              <div className="form-group">
                <label htmlFor="prompt">Custom Prompt</label>
                <textarea
                  id="prompt"
                  className="input"
                  rows={4}
                  placeholder={`Describe the ${contentType} you want to generate or customize the template...`}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              {/* Style Input */}
              <div className="form-group">
                <label htmlFor="style">Style Keywords</label>
                <input
                  id="style"
                  type="text"
                  className="input"
                  placeholder="e.g., modern, vibrant, professional, minimalist"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                />
              </div>

              {/* Generate Button */}
              <div className="generate-actions">
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleGenerate}
                  disabled={!prompt || generating}
                >
                  {generating ? (
                    <>
                      <Loader size={20} className="spinning" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Generate {contentType}
                    </>
                  )}
                </button>
                
                {generatedContent && !generating && (
                  <button
                    className="btn btn-secondary"
                    onClick={regenerateContent}
                  >
                    <RefreshCw size={16} />
                    Regenerate
                  </button>
                )}
              </div>
            </div>

            {/* Right Panel - Generated Content */}
            <div className="generated-content-panel">
              {!generatedContent && !generating && (
                <div className="content-placeholder">
                  <Sparkles size={48} className="placeholder-icon" />
                  <h3>Ready to Create Amazing Content?</h3>
                  <p>Select a template or customize your prompt, then click generate to create AI-powered {contentType} content.</p>
                  
                  <div className="feature-highlights">
                    <div className="feature">
                      <Target className="feature-icon" />
                      <span>Platform-Optimized</span>
                    </div>
                    <div className="feature">
                      <Users className="feature-icon" />
                      <span>Audience-Targeted</span>
                    </div>
                    <div className="feature">
                      <Wand2 className="feature-icon" />
                      <span>AI-Enhanced</span>
                    </div>
                  </div>
                </div>
              )}

              {generating && (
                <div className="generation-loading">
                  <Loader size={48} className="spinning" />
                  <h3>Creating Your Content...</h3>
                  <p>Our AI is crafting the perfect {contentType} for your campaign</p>
                </div>
              )}

              {generatedContent && !generatedContent.error && (
                <div className="generated-content">
                  <div className="content-header">
                    <h3>Generated Content</h3>
                    <div className="content-actions">
                      <button 
                        className="btn btn-ghost"
                        onClick={() => copyToClipboard(JSON.stringify(generatedContent, null, 2))}
                      >
                        <Copy size={16} />
                        Copy
                      </button>
                      <button className="btn btn-ghost">
                        <Download size={16} />
                        Download
                      </button>
                    </div>
                  </div>

                  {contentType === 'copy' && (
                    <div className="copy-preview">
                      <div className="copy-section">
                        <div className="copy-label">
                          <span>Headline</span>
                          <button 
                            className="copy-btn"
                            onClick={() => copyToClipboard(generatedContent.headline)}
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                        <div className="copy-content copy-headline">
                          {generatedContent.headline || "Discover Amazing Products That Change Your Life"}
                        </div>
                      </div>
                      
                      <div className="copy-section">
                        <div className="copy-label">
                          <span>Body Text</span>
                          <button 
                            className="copy-btn"
                            onClick={() => copyToClipboard(generatedContent.body)}
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                        <div className="copy-content copy-body">
                          {generatedContent.body || "Experience the difference with our premium products designed to enhance your daily routine. Join thousands of satisfied customers who have transformed their lives."}
                        </div>
                      </div>
                      
                      <div className="copy-section">
                        <div className="copy-label">
                          <span>Call to Action</span>
                          <button 
                            className="copy-btn"
                            onClick={() => copyToClipboard(generatedContent.cta)}
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                        <div className="copy-content copy-cta">
                          {generatedContent.cta || "Shop Now - Limited Time Offer!"}
                        </div>
                      </div>

                      {generatedContent.variations && (
                        <div className="copy-variations">
                          <h4>Alternative Versions</h4>
                          {generatedContent.variations.map((variation, index) => (
                            <div key={index} className="variation-item">
                              <span className="variation-label">Version {index + 1}</span>
                              <div className="variation-content">{variation}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {contentType === 'image' && (
                    <div className="image-preview">
                      {generatedContent.url ? (
                        <img src={generatedContent.url} alt="Generated" className="generated-image" />
                      ) : (
                        <div className="image-placeholder">
                          <Palette size={48} />
                          <p>Image generation in progress...</p>
                          <p className="image-status">{generatedContent.status || 'Processing'}</p>
                        </div>
                      )}
                      
                      <div className="image-details">
                        <div className="detail">
                          <strong>Prompt:</strong> {generatedContent.prompt || prompt}
                        </div>
                        <div className="detail">
                          <strong>Style:</strong> {generatedContent.style || style}
                        </div>
                        <div className="detail">
                          <strong>Dimensions:</strong> {getDimensions().width} × {getDimensions().height}
                        </div>
                      </div>
                    </div>
                  )}

                  {contentType === 'video' && (
                    <div className="video-preview">
                      <div className="video-placeholder">
                        <div className="video-icon">🎥</div>
                        <h4>Video Concept Generated</h4>
                        <div className="video-details">
                          <div className="video-section">
                            <strong>Concept:</strong>
                            <p>{generatedContent.concept || "A 30-second product showcase highlighting key features with dynamic transitions and engaging visuals."}</p>
                          </div>
                          <div className="video-section">
                            <strong>Script:</strong>
                            <p>{generatedContent.script || "Hook: 'Tired of ordinary products?' → Problem demonstration → Product introduction → Key benefits → Call to action with special offer"}</p>
                          </div>
                          <div className="video-section">
                            <strong>Visual Style:</strong>
                            <p>{generatedContent.visualStyle || "Modern, clean aesthetic with vibrant colors, smooth transitions, and professional lighting"}</p>
                          </div>
                        </div>
                        
                        {generatedContent.status === 'ready' && generatedContent.url && (
                          <a href={generatedContent.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                            View Video
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="content-footer">
                    <button className="btn btn-primary btn-large" style={{ width: '100%' }}>
                      <Target size={16} />
                      Use This Content in Campaign
                    </button>
                  </div>
                </div>
              )}

              {generatedContent?.error && (
                <div className="generation-error">
                  <div className="error-content">
                    <h3>Generation Failed</h3>
                    <p>{generatedContent.error}</p>
                    <button className="btn btn-primary" onClick={handleGenerate}>
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {/* Generation History */}
              {generationHistory.length > 0 && (
                <div className="generation-history">
                  <h4>Recent Generations</h4>
                  <div className="history-list">
                    {generationHistory.slice(0, 3).map((item, index) => (
                      <div key={index} className="history-item" onClick={() => setGeneratedContent(item.content)}>
                        <div className="history-type">{item.type}</div>
                        <div className="history-template">{item.template}</div>
                        <div className="history-time">
                          {item.timestamp.toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
