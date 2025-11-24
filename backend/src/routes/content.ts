import { Router } from 'express';

const router = Router();

// Generate AI content
router.post('/generate', async (req, res) => {
  try {
    const { type, prompt, style, dimensions } = req.body;

    // TODO: Implement real AI content generation via MCP server
    // For now, we'll generate dynamic content based on the prompt
    let content;

    switch (type) {
      case 'image':
        content = {
          type: 'image',
          url: `https://via.placeholder.com/1200x628/667eea/ffffff?text=${encodeURIComponent(prompt || 'AI Generated Image')}`,
          prompt,
          style,
          dimensions: dimensions || { width: 1200, height: 628 },
        };
        break;
      case 'video':
        content = {
          type: 'video',
          url: 'https://example.com/demo-video.mp4',
          prompt,
          status: 'processing',
          message: `Video generation started for: "${prompt}"`,
        };
        break;
      case 'copy':
        // Generate dynamic ad copy based on the prompt
        const generatedCopy = generateAdCopy(prompt, style);
        content = {
          type: 'copy',
          headline: generatedCopy.headline,
          body: generatedCopy.body,
          cta: generatedCopy.cta,
          prompt,
          style,
        };
        break;
      default:
        return res.status(400).json({ error: 'Invalid content type' });
    }

    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// Helper function to generate ad copy based on prompt
function generateAdCopy(prompt: string, style?: string) {
  // Simple AI-like generation based on keywords in the prompt
  const lowerPrompt = prompt.toLowerCase();

  // Detect keywords to customize the copy
  const isSale = lowerPrompt.includes('sale') || lowerPrompt.includes('discount') || lowerPrompt.includes('off');
  const isTech = lowerPrompt.includes('tech') || lowerPrompt.includes('technology') || lowerPrompt.includes('software');
  const isUrgent = lowerPrompt.includes('limited') || lowerPrompt.includes('now') || lowerPrompt.includes('today') ||
    (style && style.toLowerCase().includes('urgent'));
  const isBlackFriday = lowerPrompt.includes('black friday') || lowerPrompt.includes('cyber monday');

  let headline, body, cta;

  if (isBlackFriday && isTech) {
    headline = '🔥 Black Friday Tech Blowout - Up to 70% Off!';
    body = 'Don\'t miss out on the biggest tech deals of the year. Premium gadgets, software, and electronics at unbeatable prices. Limited stock available!';
    cta = 'Shop Now';
  } else if (isSale && isTech) {
    headline = '💻 Massive Tech Sale - Save Big Today!';
    body = 'Upgrade your tech game with incredible discounts on the latest devices and software. Limited time offer!';
    cta = 'Get Deals';
  } else if (isSale) {
    headline = '🎉 Exclusive Sale - Don\'t Miss Out!';
    body = `${prompt}. Grab amazing deals while supplies last. Your perfect purchase awaits!`;
    cta = 'Shop Sale';
  } else if (isTech) {
    headline = '🚀 Next-Gen Technology Awaits';
    body = `${prompt}. Experience cutting-edge innovation that transforms how you work and play.`;
    cta = 'Learn More';
  } else if (isUrgent) {
    headline = `⚡ ${prompt} - Act Fast!`;
    body = 'Limited time opportunity! Don\'t let this amazing offer slip away. Available while supplies last.';
    cta = 'Claim Now';
  } else {
    // Generic but personalized to the prompt
    headline = `✨ ${prompt.charAt(0).toUpperCase() + prompt.slice(1)}`;
    body = `Discover amazing opportunities with ${prompt}. Transform your experience with our premium solutions designed just for you.`;
    cta = 'Get Started';
  }

  return { headline, body, cta };
}

// Get generation history
router.get('/history', async (req, res) => {
  try {
    res.json({
      history: [
        {
          id: 1,
          type: 'image',
          prompt: 'Professional business meeting',
          createdAt: new Date().toISOString(),
        },
      ],
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
