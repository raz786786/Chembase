import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, X } from 'lucide-react';
import { api } from '../../api';

interface VivaModalProps {
  subject: string;
  onClose: () => void;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export default function VivaModal({ subject, onClose }: VivaModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Welcome to the ${subject.replace('-', ' ')} Viva session. I will be assessing your conceptual understanding, theoretical knowledge, and practical laboratory application. Let's begin. What is the fundamental driving force for ${subject.replace('-', ' ')}?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      // Format history for the prompt
      const historyStr = newMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
      
      const prompt = `You are a strict but fair Chemical Engineering Professor conducting an interactive oral Viva examination on the subject of "${subject}".
Your goal is to test the student's knowledge dynamically. 
Analyze the student's last response. If it is weak, correct them and ask a simpler concept. If it is strong, increase the difficulty.
Do NOT give away all the answers at once. Ask ONE follow-up question at a time.
Keep your responses concise, academic, and engaging.

Conversation History:
${historyStr}

PROFESSOR (Your response):`;

      // Get active model settings
      let provider = 'groq';
      let model = 'llama-3.3-70b-versatile';
      let apiKey = localStorage.getItem('api_keys') ? JSON.parse(localStorage.getItem('api_keys') || '{}')[provider] : '';

      // fallback to whatever is available
      if (!apiKey) {
        provider = 'gemini';
        model = 'gemini-2.5-flash';
        apiKey = localStorage.getItem('api_keys') ? JSON.parse(localStorage.getItem('api_keys') || '{}')[provider] : '';
      }

      if (!apiKey) {
         setMessages(prev => [...prev, { role: 'assistant', content: 'System Error: No AI API key found. Please configure your models in Settings.' }]);
         setIsTyping(false);
         return;
      }

      const res = await api.aiProxy({ provider, api_key: apiKey, prompt, model });
      
      if (res.error) {
        throw new Error(res.error);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: res.text.replace(/<[^>]*>?/gm, '').trim() }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. The professor is currently unavailable.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-surface-900 rounded-3xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-500/10 text-accent-600 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-surface-900 dark:text-white leading-tight">AI Professor</h3>
              <p className="text-xs text-surface-500 font-medium capitalize">{subject.replace('-', ' ')} Viva Mode</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-300'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-primary-600 text-white rounded-tr-sm' 
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-surface-200 dark:bg-surface-800 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-surface-500" />
              </div>
              <div className="p-4 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-500 rounded-tl-sm flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-surface-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-surface-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-surface-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Answer the professor..."
              className="flex-1 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-accent-500 transition-colors"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="p-3 bg-accent-600 hover:bg-accent-500 disabled:bg-surface-300 dark:disabled:bg-surface-700 text-white rounded-xl transition-colors shrink-0 btn-tactile"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
