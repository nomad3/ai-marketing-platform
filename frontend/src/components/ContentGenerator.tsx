import { Loader, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import './ContentGenerator.css';

interface ContentGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContentGenerator({ isOpen, onClose }: ContentGeneratorProps) {
  const [contentType, setContentType] = useState<'image' | 'video' | 'copy'>('image');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedContent(null);

    try {
      const response = await fetch('http://localhost:3000/api/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: contentType,
          prompt,
          style,
          dimensions: contentType === 'image' ? { width: 1200, height: 628 } : undefined,
        }),
      });

      const data = await response.json();
      setGeneratedContent(data.content);
    } catch (error) {
      console.error('Failed to generate content:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card glass" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>
              <Sparkles size={24} />
              AI Content Generator
            </h2>
            <p>Create stunning content with AI</p>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* Content Type Selection */}
          <div className="form-group">
            <label>Content Type</label>
            <div className="content-type-tabs">
              <button
                className={`type-tab ${contentType === 'image' ? 'active' : ''}`}
                onClick={() => setContentType('image')}
              >
                🖼️ Image
              </button>
              <button
                className={`type-tab ${contentType === 'video' ? 'active' : ''}`}
                onClick={() => setContentType('video')}
              >
                🎥 Video
              </button>
              <button
                className={`type-tab ${contentType === 'copy' ? 'active' : ''}`}
                onClick={() => setContentType('copy')}
              >
                ✍️ Copy
              </button>
            </div>
          </div>

          {/* Prompt Input */}
          <div className="form-group">
            <label htmlFor="prompt">Prompt</label>
            <textarea
              id="prompt"
              className="input"
              rows={4}
              placeholder={`Describe the ${contentType} you want to generate...`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Style Input */}
          <div className="form-group">
            <label htmlFor="style">Style (Optional)</label>
            <input
              id="style"
              type="text"
              className="input"
              placeholder="e.g., modern, vibrant, professional"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
            />
          </div>

          {/* Generate Button */}
          <button
            className="btn btn-primary btn-large"
            onClick={handleGenerate}
            disabled={!prompt || generating}
            style={{ width: '100%' }}
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

          {/* Generated Content Display */}
          {generatedContent && (
            <div className="generated-content">
              <h3>Generated Content</h3>

              {contentType === 'image' && (
                <div className="content-preview">
                  <img src={generatedContent.url} alt="Generated" />
                  <p className="content-meta">Prompt: {generatedContent.prompt}</p>
                </div>
              )}

              {contentType === 'video' && (
                <div className="content-preview">
                  <div className="video-placeholder">
                    <p>🎥 Video Generation</p>
                    <p className="status">Status: {generatedContent.status}</p>
                    {generatedContent.url && (
                      <a href={generatedContent.url} target="_blank" rel="noopener noreferrer">
                        View Video
                      </a>
                    )}
                  </div>
                </div>
              )}

              {contentType === 'copy' && (
                <div className="content-preview copy-preview">
                  <div className="copy-section">
                    <label>Headline</label>
                    <p className="copy-headline">{generatedContent.headline}</p>
                  </div>
                  <div className="copy-section">
                    <label>Body</label>
                    <p className="copy-body">{generatedContent.body}</p>
                  </div>
                  <div className="copy-section">
                    <label>Call to Action</label>
                    <p className="copy-cta">{generatedContent.cta}</p>
                  </div>
                </div>
              )}

              <button className="btn btn-secondary" style={{ width: '100%', marginTop: 'var(--spacing-md)' }}>
                Use This Content
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
