import { useState, useRef, useEffect } from 'react';
import { Mic, Send, Bot, User, Play, Square } from 'lucide-react';
import { api } from '../../../../api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function Viva() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startViva = async () => {
    setIsActive(true);
    setIsLoading(true);
    setMessages([]);
    
    try {
      const systemPrompt = `You are a strict but fair Thermodynamics Professor conducting an oral Viva examination.
Start by asking the first question. It should be a fundamental concept.
Wait for the student's answer. 
Then, evaluate the answer briefly, and ask the next question.
Adapt the difficulty based on their answers. Do not ask more than one question at a time.`;
      
      const response = await api.aiProxy({
        provider: 'gemini',
        api_key: localStorage.getItem('GEMINI_API_KEY') || '',
        prompt: "Start the viva exam.",
        system_prompt: systemPrompt
      });

      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: response.text || 'Let us begin. What is the First Law of Thermodynamics?'
      }]);
    } catch (err) {
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Error connecting to the Viva system.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const endViva = () => {
    setIsActive(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isActive) return;

    const userMessage = { id: Date.now().toString(), role: 'user' as const, content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const systemPrompt = `You are a strict but fair Thermodynamics Professor conducting an oral Viva examination.
Evaluate the student's previous answer briefly (Correct, Partially Correct, Incorrect, and why).
Then, ask the next question. Adapt difficulty based on performance. Only ask ONE question.`;
      
      const chatContext = messages.map(m => `${m.role === 'assistant' ? 'Professor' : 'Student'}: ${m.content}`).join('\n');
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
        content: response.text || 'Sorry, I could not process that.'
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Connection error.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[700px] bg-white dark:bg-surface-800 rounded-3xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center">
            <Mic className="w-6 h-6 text-fuchsia-600 dark:text-fuchsia-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-surface-900 dark:text-white leading-tight">Adaptive Viva Examination</h2>
            <p className="text-xs text-surface-500 font-medium">Oral test simulation</p>
          </div>
        </div>
        <div>
          {!isActive ? (
            <button onClick={startViva} className="flex items-center gap-2 px-4 py-2 bg-fuchsia-600 text-white rounded-xl font-bold hover:bg-fuchsia-700 transition-colors text-sm">
              <Play className="w-4 h-4" /> Start Exam
            </button>
          ) : (
            <button onClick={endViva} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm">
              <Square className="w-4 h-4" /> End Exam
            </button>
          )}
        </div>
      </div>

      <div className="flex-grow p-6 overflow-y-auto space-y-6">
        {!isActive && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <Mic className="w-16 h-16 text-surface-300 dark:text-surface-600 mb-4" />
            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Ready for your Viva?</h3>
            <p className="text-surface-500">The AI professor will ask you thermodynamics questions one by one and adapt the difficulty based on your answers. Good luck!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-surface-100 dark:bg-surface-700' : 'bg-fuchsia-100 dark:bg-fuchsia-900/30'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-surface-600 dark:text-surface-300" /> : <Bot className="w-4 h-4 text-fuchsia-600" />}
              </div>
              <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-white rounded-tr-sm' 
                  : 'bg-fuchsia-50 dark:bg-fuchsia-900/10 border border-fuchsia-100 dark:border-fuchsia-900/30 text-surface-800 dark:text-surface-200 rounded-tl-sm shadow-sm'
              }`}>
                <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-surface-200 border-t-fuchsia-500 rounded-full animate-spin" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isActive ? "Type your answer..." : "Start the exam first..."}
            disabled={!isActive || isLoading}
            className="flex-grow px-5 py-3 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm font-medium outline-none focus:border-fuchsia-500 shadow-sm disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading || !isActive}
            className="btn-tactile px-5 py-3 bg-fuchsia-600 text-white rounded-xl disabled:bg-surface-300 dark:disabled:bg-surface-700 flex items-center gap-2 font-bold transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
