import axios from 'axios';
import { Router } from 'express';

const router = Router();

// Generate AI content
// Generate AI content
router.post('/generate', async (req, res) => {
  try {
    const { type, prompt, style, dimensions } = req.body;
    let content;

    // Higgsfield API Credentials
    const HIGGSFIELD_API_KEY_ID = process.env.HIGGSFIELD_API_KEY_ID || 'b6ee7a1e-edb8-4a34-9294-0407cb3353a1';
    const HIGGSFIELD_API_KEY_SECRET = process.env.HIGGSFIELD_API_KEY_SECRET || 'ecdd39e43963d70428e0a7b0e34b93d6a141673ffaffbf86c8db1076aa215ce8';
    const HIGGSFIELD_BASE_URL = 'https://platform.higgsfield.ai';

    const getAuthHeader = () => ({
      'Authorization': `Key ${HIGGSFIELD_API_KEY_ID}:${HIGGSFIELD_API_KEY_SECRET}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });

    const pollStatus = async (statusUrl: string): Promise<any> => {
      const maxAttempts = 60; // 1 minute timeout (1s interval)
      let attempts = 0;

      while (attempts < maxAttempts) {
        try {
          const response = await axios.get(statusUrl, { headers: getAuthHeader() });
          const data = response.data;

          if (data.status === 'completed') {
            return data;
          } else if (data.status === 'failed') {
            throw new Error(`Generation failed: ${data.error || 'Unknown error'}`);
          }

          // Wait 1 second before next poll
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        } catch (error) {
          console.error('Polling error:', error);
          throw error;
        }
      }
      throw new Error('Generation timed out');
    };

    switch (type) {
      case 'image':
        try {
          // Call Higgsfield Image API
          const imageResponse = await axios.post(
            `${HIGGSFIELD_BASE_URL}/higgsfield-ai/soul/standard`,
            {
              prompt: style ? `${prompt}, ${style}` : prompt,
              aspect_ratio: "16:9",
              resolution: "720p"
            },
            { headers: getAuthHeader() }
          );

          // Poll for result
          const imageResult = await pollStatus(imageResponse.data.status_url);

          content = {
            type: 'image',
            url: imageResult.images[0].url,
            prompt,
            style,
            dimensions: dimensions || { width: 1200, height: 628 },
          };
        } catch (error) {
          console.error('Higgsfield Image Generation Error:', error);
          // Fallback if API fails
          content = {
            type: 'image',
            url: `https://via.placeholder.com/1200x628/667eea/ffffff?text=${encodeURIComponent(prompt || 'AI Generated Image')}`,
            prompt,
            style,
            error: 'Failed to generate with Higgsfield, using placeholder',
          };
        }
        break;

      case 'video':
        try {
          // For video, we need an input image. If none provided, we generate one first or use a placeholder.
          // Since the UI doesn't support image upload for video yet, we'll use a placeholder image based on the prompt
          // or generate an image first (which takes time).
          // For now, let's use a generated image from the prompt to feed into video generation.

          // 1. Generate Image first
          const imgGenResponse = await axios.post(
            `${HIGGSFIELD_BASE_URL}/higgsfield-ai/soul/standard`,
            {
              prompt: style ? `${prompt}, ${style}` : prompt,
              aspect_ratio: "16:9",
              resolution: "720p"
            },
            { headers: getAuthHeader() }
          );

          const baseImageResult = await pollStatus(imgGenResponse.data.status_url);
          const sourceImageUrl = baseImageResult.images[0].url;

          // 2. Generate Video from Image
          const videoResponse = await axios.post(
            `${HIGGSFIELD_BASE_URL}/higgsfield-ai/dop/standard`,
            {
              image_url: sourceImageUrl,
              prompt: style ? `${prompt}, ${style}` : prompt,
              duration: 5
            },
            { headers: getAuthHeader() }
          );

          // Return pending status immediately for video as it takes longer
          content = {
            type: 'video',
            url: '',
            prompt,
            status: 'processing',
            message: 'Video generation started. Please check back later.',
            jobId: videoResponse.data.request_id,
            statusUrl: videoResponse.data.status_url,
            sourceImage: sourceImageUrl
          };
        } catch (error) {
          console.error('Higgsfield Video Generation Error:', error);
          content = {
            type: 'video',
            url: 'https://example.com/demo-video.mp4',
            prompt,
            status: 'error',
            message: 'Failed to start video generation',
          };
        }
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
    console.error('Content generation error:', error);
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
