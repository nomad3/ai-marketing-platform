import axios from 'axios';
import OpenAI from 'openai';

export class AIContentService {
  private openai: OpenAI;
  private huggingfaceApiKey: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY || '';
  }

  async generateImage(params: {
    prompt: string;
    style?: string;
    dimensions?: { width: number; height: number };
  }) {
    try {
      // Using Hugging Face Stable Diffusion
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
        {
          inputs: params.style ? `${params.prompt}, ${params.style}` : params.prompt,
        },
        {
          headers: {
            Authorization: `Bearer ${this.huggingfaceApiKey}`,
          },
          responseType: 'arraybuffer',
        }
      );

      // Convert to base64
      const base64Image = Buffer.from(response.data).toString('base64');
      return {
        type: 'image',
        format: 'png',
        data: base64Image,
        url: `data:image/png;base64,${base64Image}`,
      };
    } catch (error) {
      console.error('Image generation error:', error);
      // Fallback to mock data for demo
      return {
        type: 'image',
        format: 'png',
        url: 'https://via.placeholder.com/1200x628',
        message: 'Demo image - configure API keys for real generation',
      };
    }
  }

  async generateVideo(params: { prompt: string; style?: string }) {
    try {
      // Placeholder for video generation API (Runway, Pika, etc.)
      // This would integrate with services like Runway ML or Pika Labs
      const videoGenUrl = process.env.VIDEO_GEN_API_URL;

      if (!videoGenUrl) {
        return {
          type: 'video',
          status: 'pending',
          message: 'Video generation API not configured. Set VIDEO_GEN_API_URL',
          mockUrl: 'https://example.com/demo-video.mp4',
        };
      }

      // Example API call structure
      const response = await axios.post(
        videoGenUrl,
        {
          prompt: params.prompt,
          style: params.style,
          duration: 15, // 15 seconds
          aspect_ratio: '16:9',
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.VIDEO_GEN_API_KEY}`,
          },
        }
      );

      return {
        type: 'video',
        status: 'completed',
        url: response.data.url,
        jobId: response.data.id,
      };
    } catch (error) {
      console.error('Video generation error:', error);
      return {
        type: 'video',
        status: 'error',
        message: 'Video generation failed - configure API keys',
      };
    }
  }

  async generateCopy(params: { prompt: string; style?: string }) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert advertising copywriter. Create compelling, conversion-focused ad copy that resonates with the target audience. ${params.style ? `Style: ${params.style}` : ''}`,
          },
          {
            role: 'user',
            content: params.prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 500,
      });

      const copy = completion.choices[0].message.content || '';

      return {
        type: 'copy',
        headline: this.extractHeadline(copy),
        body: this.extractBody(copy),
        cta: this.extractCTA(copy),
        fullText: copy,
      };
    } catch (error) {
      console.error('Copy generation error:', error);
      return {
        type: 'copy',
        headline: 'Transform Your Business with AI',
        body: 'Discover how AI-powered marketing can boost your ROI by 300%. Get started today!',
        cta: 'Learn More',
        fullText: 'Demo copy - configure OpenAI API key for real generation',
      };
    }
  }

  private extractHeadline(text: string): string {
    const lines = text.split('\n').filter(l => l.trim());
    return lines[0] || 'Headline';
  }

  private extractBody(text: string): string {
    const lines = text.split('\n').filter(l => l.trim());
    return lines.slice(1, -1).join(' ') || 'Body text';
  }

  private extractCTA(text: string): string {
    const lines = text.split('\n').filter(l => l.trim());
    const lastLine = lines[lines.length - 1] || '';
    return lastLine.includes('CTA:') ? lastLine.replace('CTA:', '').trim() : 'Learn More';
  }
}
