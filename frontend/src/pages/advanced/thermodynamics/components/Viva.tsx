import { useState, useRef, useEffect } from 'react';
import { Mic, Send, Bot, User, Play, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import {
  sendAutoRoutedChat,
  type RoutedChatMessage,
} from '../../../../utils/providerRouter';

const VIVA_EXAMINER_SYSTEM_PROMPT = `You are a strict but fair Chemical Engineering Thermodynamics Professor conducting an oral Viva examination.
- On the first turn, greet the student briefly and ask Question 1 on a fundamental thermodynamics concept.
- On every subsequent turn, briefly evaluate the student's previous answer (Correct, Partially Correct, or Incorrect, with a concise thermodynamic justification), then ask the next question.
- Adapt difficulty based on the student's performance.
- Ask strictly ONE question per turn. Format equations cleanly with LaTeX ($...$).`;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const OFFLINE_VIVA_BANK = [
  {
    q: 'Let us begin your Thermodynamics Viva. **Question 1:** State the First Law of Thermodynamics for both a closed system and an open steady-flow system, and explain the physical meaning of enthalpy ($H = U + PV$).',
    keywords: ['conservation', 'energy', 'u', 'q', 'w', 'flow', 'pv', 'enthalpy', 'created', 'destroyed'],
    keyAnswer: 'Energy is conserved: $\\Delta U = Q - W$ for a closed system, and $\\dot{Q} - \\dot{W}_s = \\dot{m}\\Delta(h + ke + pe)$ for steady flow. Enthalpy combines internal energy and flow work ($Pv$).'
  },
  {
    q: '**Question 2:** Why can no real heat engine achieve 100% thermal efficiency, and what sets the upper bound for an engine operating between reservoirs at $T_H$ and $T_L$?',
    keywords: ['second law', 'kelvin', 'planck', 'carnot', 'entropy', 'heat', 'reject', 'tl', 'th'],
    keyAnswer: 'By the Kelvin–Planck statement of the Second Law, some heat must be rejected to a cold sink; maximum efficiency is the Carnot limit $\\eta = 1 - T_L/T_H$.'
  },
  {
    q: '**Question 3:** In a Rankine steam power cycle, why do we pump saturated liquid rather than compressing a two-phase wet vapor mixture as in a Carnot vapor cycle?',
    keywords: ['specific volume', 'liquid', 'pump', 'work', 'cavitation', 'two-phase', 'small', 'vdp'],
    keyAnswer: 'Pump work is $w_p = \\int v\\,dP$. Liquid specific volume $v_f$ is orders of magnitude smaller than vapor $v_g$, drastically reducing back-work ratio and avoiding mechanical damage.'
  },
  {
    q: '**Question 4:** What is the thermodynamic criterion for vapor–liquid phase equilibrium (VLE) in a multicomponent mixture at constant $T$ and $P$, and how does it simplify to Raoult’s Law?',
    keywords: ['fugacity', 'chemical potential', 'gibbs', 'equal', 'ideal', 'raoult', 'psat', 'vapor', 'liquid'],
    keyAnswer: 'Chemical potential (and fugacity) of each species must be equal across phases: $\\hat{f}_i^V = \\hat{f}_i^L$. Assuming an ideal gas and ideal liquid solution gives $y_i P = x_i P_i^{\\text{sat}}$.'
  },
  {
    q: '**Question 5:** Explain the physical meaning of the Joule–Thomson coefficient $\\mu_{JT} = (\\partial T / \\partial P)_H$. Why is it zero for an ideal gas, and when does throttling cool a real gas?',
    keywords: ['enthalpy', 'isenthalpic', 'throttling', 'ideal', 'inversion', 'positive', 'cool', 'intermolecular'],
    keyAnswer: 'Throttling is isenthalpic. For an ideal gas $h = h(T)$ so $\\mu_{JT} = 0$. A real gas cools upon expansion when $\\mu_{JT} > 0$ (below its inversion temperature) as attractive forces dominate.'
  }
];

export default function Viva() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vivaMode, setVivaMode] = useState<'idle' | 'ai' | 'offline'>('idle');
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const offlineIdxRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startViva = async () => {
    setIsActive(true);
    setIsLoading(true);
    setMessages([]);
    setVivaMode('idle');
    setActiveModel(null);
    offlineIdxRef.current = 0;

    try {
      const res = await sendAutoRoutedChat({
        systemPrompt: VIVA_EXAMINER_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: 'Start the Thermodynamics oral viva examination by asking Question 1 on a fundamental concept.',
          },
        ],
        temperature: 0.35,
        maxTokens: 1024,
        timeoutMs: 25000,
        stripThinking: true,
      });

      if (res.ok && res.text.trim()) {
        setVivaMode('ai');
        setActiveModel(res.model_id || res.display_name || null);
        setMessages([{
          id: `${Date.now()}-a`,
          role: 'assistant',
          content: res.text.trim(),
        }]);
      } else {
        setVivaMode('offline');
        setActiveModel(null);
        setMessages([{
          id: `${Date.now()}-a`,
          role: 'assistant',
          content: OFFLINE_VIVA_BANK[0].q,
        }]);
      }
    } catch {
      setVivaMode('offline');
      setActiveModel(null);
      setMessages([{
        id: `${Date.now()}-a`,
        role: 'assistant',
        content: OFFLINE_VIVA_BANK[0].q,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const endViva = () => {
    setIsActive(false);
  };

  const buildOfflineEvaluation = (answer: string) => {
    const currentItem = OFFLINE_VIVA_BANK[offlineIdxRef.current % OFFLINE_VIVA_BANK.length];
    const lower = answer.toLowerCase();
    const hits = currentItem.keywords.filter(k => lower.includes(k)).length;
    const verdict = hits >= 2
      ? '**Evaluation: Correct** — Strong grasp of the key thermodynamic principles.'
      : hits === 1
        ? '**Evaluation: Partially Correct** — You touched on a relevant idea, though more rigor is needed.'
        : '**Evaluation: Needs Improvement** — Let us tighten the fundamental definition.';

    offlineIdxRef.current += 1;
    const nextItem = OFFLINE_VIVA_BANK[offlineIdxRef.current % OFFLINE_VIVA_BANK.length];
    return `${verdict}\n\n*Key point:* ${currentItem.keyAnswer}\n\n---\n\n${nextItem.q}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isActive) return;

    const userMessage: Message = { id: `${Date.now()}-u`, role: 'user', content: input.trim() };
    const nextHistory: RoutedChatMessage[] = [...messages, userMessage].map(m => ({
      role: m.role,
      content: m.content,
    }));

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await sendAutoRoutedChat({
        systemPrompt: VIVA_EXAMINER_SYSTEM_PROMPT,
        messages: nextHistory,
        temperature: 0.35,
        maxTokens: 1200,
        timeoutMs: 25000,
        stripThinking: true,
      });

      if (res.ok && res.text.trim()) {
        setVivaMode('ai');
        setActiveModel(res.model_id || res.display_name || null);
        setMessages(prev => [...prev, {
          id: `${Date.now()}-a`,
          role: 'assistant',
          content: res.text.trim(),
        }]);
      } else {
        setVivaMode('offline');
        setActiveModel(null);
        setMessages(prev => [...prev, {
          id: `${Date.now()}-a`,
          role: 'assistant',
          content: buildOfflineEvaluation(userMessage.content),
        }]);
      }
    } catch {
      setVivaMode('offline');
      setActiveModel(null);
      setMessages(prev => [...prev, {
        id: `${Date.now()}-a`,
        role: 'assistant',
        content: buildOfflineEvaluation(userMessage.content),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[700px] bg-white dark:bg-surface-800 rounded-3xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center">
            <Mic className="w-6 h-6 text-fuchsia-600 dark:text-fuchsia-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-surface-900 dark:text-white leading-tight">Adaptive Viva Examination</h2>
            <p className="text-xs text-surface-500 font-medium">Oral test simulation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {vivaMode !== 'idle' && (
            <span
              title={activeModel || undefined}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                vivaMode === 'offline'
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  vivaMode === 'offline' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
              {vivaMode === 'offline' ? 'Offline Viva Bank' : 'Live AI Examiner'}
            </span>
          )}
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
                <div className="prose prose-sm dark:prose-invert max-w-none font-medium">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
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
