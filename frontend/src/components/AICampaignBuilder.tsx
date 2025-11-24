import { Loader, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import './AICampaignBuilder.css';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

interface AICampaignBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated?: (campaign: any) => void;
}

export default function AICampaignBuilder({ isOpen, onClose, onCampaignCreated }: AICampaignBuilderProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationState, setConversationState] = useState<'initial' | 'gathering' | 'confirming' | 'creating'>('initial');
  const [campaignData, setCampaignData] = useState<any>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting
      addAssistantMessage(
        "👋 Hi! I'm your AI Campaign Assistant. I'll help you create a powerful advertising campaign tailored to your goals.\n\nLet's start with the basics: **What's the main goal of your campaign?** (e.g., increase sales, generate leads, build brand awareness, drive website traffic)"
      );
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addAssistantMessage = (content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
  };

  const addUserMessage = (content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    setInput('');
    addUserMessage(userInput);
    setIsLoading(true);

    try {
      // Send to backend AI agent
      const response = await fetch('http://localhost:3000/api/campaigns/ai-builder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: userInput,
          conversationHistory: messages,
          currentData: campaignData,
          state: conversationState,
        }),
      });

      const data = await response.json();

      // Update campaign data
      if (data.campaignData) {
        setCampaignData(data.campaignData);
      }

      // Update conversation state
      if (data.state) {
        setConversationState(data.state);
      }

      // Add assistant response
      addAssistantMessage(data.message);

      // If campaign is ready to create
      if (data.state === 'ready' && data.campaign) {
        setTimeout(() => {
          if (onCampaignCreated) {
            onCampaignCreated(data.campaign);
          }
          resetConversation();
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to process message:', error);
      addAssistantMessage(
        "I apologize, but I encountered an error. Let me try to help you differently. Could you please rephrase your last response?"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = () => {
    setMessages([]);
    setCampaignData({});
    setConversationState('initial');
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ai-campaign-builder" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-content">
            <Sparkles className="ai-icon" />
            <div>
              <h2>AI Campaign Builder</h2>
              <p>Let's create your perfect campaign together</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="chat-container">
          <div className="messages-list">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.role === 'user' ? 'message-user' : 'message-assistant'}`}
              >
                <div className="message-avatar">
                  {message.role === 'assistant' ? '🤖' : '👤'}
                </div>
                <div className="message-content">
                  <div className="message-text">{message.content}</div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message message-assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <div className="campaign-progress">
              {campaignData.objective && (
                <span className="progress-tag">
                  🎯 Goal: {campaignData.objective}
                </span>
              )}
              {campaignData.platform && (
                <span className="progress-tag">
                  📱 Platform: {campaignData.platform}
                </span>
              )}
              {campaignData.budget && (
                <span className="progress-tag">
                  💰 Budget: ${campaignData.budget}
                </span>
              )}
              {campaignData.targetAudience && (
                <span className="progress-tag">
                  👥 Audience: Defined
                </span>
              )}
            </div>

            <div className="input-wrapper">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your response..."
                rows={1}
                disabled={isLoading}
              />
              <button
                className="send-button"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? <Loader className="spin" size={20} /> : <Send size={20} />}
              </button>
            </div>

            <div className="quick-suggestions">
              {conversationState === 'initial' && !isLoading && messages.length === 1 && (
                <>
                  <button
                    className="suggestion-chip"
                    onClick={() => {
                      setInput('Increase online sales');
                      setTimeout(() => handleSend(), 100);
                    }}
                  >
                    Increase sales
                  </button>
                  <button
                    className="suggestion-chip"
                    onClick={() => {
                      setInput('Generate qualified leads');
                      setTimeout(() => handleSend(), 100);
                    }}
                  >
                    Generate leads
                  </button>
                  <button
                    className="suggestion-chip"
                    onClick={() => {
                      setInput('Build brand awareness');
                      setTimeout(() => handleSend(), 100);
                    }}
                  >
                    Brand awareness
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
