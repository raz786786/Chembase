import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles } from 'lucide-react';
import { api } from '../../../../api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AITutor() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I am your AI Thermodynamics Tutor. I can help you understand concepts, derive equations, or explain industrial applications. What would you like to learn today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { id: Date.now().toString(), role: 'user' as const, content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Re-use the aiProxy we built for Lab Analytics, but with a Thermodynamics system prompt
      const systemPrompt = `You are an expert AI Thermodynamics Tutor for Chemical Engineering students. 
Explain concepts clearly using engineering terminology. Use markdown, bolding, and bullet points. 
Do not just give answers; explain the physical meaning. 
Current Topic Focus: Thermodynamics, First Law, Second Law, Entropy, Cycles, Refrigeration, Property Tables.`;
      
      // Convert chat history to a string block for context
      const chatContext = messages.map(m => `${m.role === 'assistant' ? 'AI' : 'Student'}: ${m.content}`).join('\n');
      const finalPrompt = `Previous Conversation:\n${chatContext}\n\nStudent: ${userMessage.content}`;
      
      const response = await api.aiProxy({
        provider: 'gemini',
        api_key: localStorage.getItem('GEMINI_API_KEY') || '',
        prompt: finalPrompt,
        system_prompt: systemPrompt
      });

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.text || 'Sorry, I could not generate a response.'
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I encountered an error connecting to the AI server. Please check your API keys in the settings.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[700px] bg-white dark:bg-surface-800 rounded-3xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-surface-900 dark:text-white leading-tight">AI Thermodynamics Tutor</h2>
            <p className="text-xs text-surface-500 font-medium">Powered by ChemBase AI</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-grow p-6 overflow-y-auto space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-surface-100 dark:bg-surface-700' : 'bg-primary-100 dark:bg-primary-900/30'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-surface-600 dark:text-surface-300" /> : <Bot className="w-4 h-4 text-primary-600" />}
            </div>
            <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white rounded-tr-sm' 
                : 'bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 text-surface-800 dark:text-surface-200 rounded-tl-sm shadow-sm'
            }`}>
              {/* Note: In a full implementation, you'd use ReactMarkdown here. For simplicity, we just render the text. */}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 max-w-[85%]">
            <div className="w-8 h-8 shrink-0 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-600 animate-pulse" />
            </div>
            <div className="px-5 py-4 rounded-2xl bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 rounded-tl-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about thermodynamics..."
            className="flex-grow px-5 py-3 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm font-medium outline-none focus:border-primary-500 shadow-sm"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="btn-tactile px-5 py-3 bg-primary-600 text-white rounded-xl disabled:bg-surface-300 dark:disabled:bg-surface-700 flex items-center gap-2 font-bold transition-colors"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
