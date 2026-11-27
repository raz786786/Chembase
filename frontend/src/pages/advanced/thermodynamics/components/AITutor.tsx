import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import {
  sendAutoRoutedChat,
  type RoutedChatMessage,
} from '../../../../utils/providerRouter';

const THERMO_TUTOR_SYSTEM_PROMPT = `You are an expert AI Thermodynamics Tutor for Chemical Engineering students.
Explain concepts clearly using rigorous engineering terminology, SI units, markdown, bolding, bullet points, and LaTeX ($...$) for equations.
Do not just state final answers; explain the underlying physical meaning, system boundaries, and assumptions.
Core Focus: First Law, Second Law, Entropy, Exergy, Equations of State, Power & Refrigeration Cycles, Phase/Chemical Equilibrium, and Property Tables.`;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function localThermoAnswer(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('first law') || q.includes('energy balance')) {
    return '**First Law of Thermodynamics (Conservation of Energy)**\n\n• **Closed system:** ΔU = Q − W (sign convention: heat in +, work out +)\n• **Open steady-flow system (SFEE):** Q̇ − Ẇ_s = ṁ[(h₂ − h₁) + ½(v₂² − v₁²) + g(z₂ − z₁)]\n• **Physical meaning:** Energy cannot be created or destroyed—only transferred as heat/work or converted between internal, kinetic, potential, and flow (Pv) energy.';
  }
  if (q.includes('second law') || q.includes('entropy')) {
    return '**Second Law of Thermodynamics & Entropy**\n\n• **Clausius Inequality:** ∮ δQ/T ≤ 0, with equality for reversible cycles.\n• **Entropy balance:** ΔS_universe = ΔS_system + ΔS_surroundings ≥ 0.\n• **Ideal gas entropy change:** Δs = c_p ln(T₂/T₁) − R ln(P₂/P₁).\n• **Engineering takeaway:** Entropy generation (S_gen > 0) measures lost work (W_lost = T₀·S_gen) caused by friction, finite-ΔT heat transfer, and unrestrained expansion.';
  }
  if (q.includes('carnot') || q.includes('rankine') || q.includes('brayton') || q.includes('cycle')) {
    return '**Thermodynamic Power Cycles**\n\n• **Carnot Efficiency (theoretical max):** η_Carnot = 1 − T_L / T_H (temperatures in Kelvin).\n• **Rankine Cycle (steam plants):** Pump → Boiler → Turbine → Condenser; η = (w_t − w_p) / q_in. Reheat and regeneration boost thermal efficiency.\n• **Brayton Cycle (gas turbines):** Isentropic compression → isobaric heat addition → isentropic expansion; η = 1 − r_p^(-(γ-1)/γ).';
  }
  if (q.includes('gibbs') || q.includes('equilibrium') || q.includes('fugacity')) {
    return '**Gibbs Free Energy & Phase/Chemical Equilibrium**\n\n• **Definition:** G = H − TS; at constant T and P, a process is spontaneous when ΔG < 0 and at equilibrium when ΔG = 0.\n• **Reaction equilibrium:** ΔG° = −RT ln(K).\n• **VLE criterion:** f_i^V = f_i^L (equal fugacity in vapor and liquid phases), simplifying to Raoult’s Law (y_i P = x_i P_i^sat) for ideal solutions.';
  }
  if (q.includes('enthalpy') || q.includes('steam') || q.includes('quality')) {
    return '**Enthalpy & Two-Phase Steam Properties**\n\n• **Enthalpy:** H = U + PV (accounts for internal energy plus flow work).\n• **Wet vapor quality (x):** h = h_f + x·h_fg, s = s_f + x·s_fg, v = v_f + x·(v_g − v_f).\n• Use the **Property DB** tab to look up saturated and superheated steam tables directly.';
  }
  return `**Thermodynamics Tutor Guidance**\n\nFor "${question}":\n• **Step 1 — Define the system:** Identify whether it is a closed control mass or an open steady-flow control volume.\n• **Step 2 — Select governing equations:** Apply Mass Balance, First Law (ΔU = Q − W or SFEE), and Second Law (ΔS_gen ≥ 0).\n• **Step 3 — Property relations:** Use ideal gas (PV = nRT, Δh = c_pΔT), Peng–Robinson EOS, or Steam Tables from the **Property DB**.\n\nTry asking specifically about the *First Law*, *Second Law / Entropy*, *Carnot / Rankine / Brayton cycles*, *Gibbs free energy*, or *Steam quality*.`;
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
  const [aiMode, setAiMode] = useState<'idle' | 'ai' | 'offline'>('idle');
  const [activeModel, setActiveModel] = useState<string | null>(null);
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
        systemPrompt: THERMO_TUTOR_SYSTEM_PROMPT,
        messages: nextHistory,
        temperature: 0.3,
        maxTokens: 2048,
        timeoutMs: 25000,
        stripThinking: true,
      });

      if (res.ok && res.text.trim()) {
        setAiMode('ai');
        setActiveModel(res.model_id || res.display_name || 'Auto');
        setMessages(prev => [...prev, {
          id: `${Date.now()}-a`,
          role: 'assistant',
          content: res.text.trim(),
        }]);
      } else {
        setAiMode('offline');
        setActiveModel(null);
        setMessages(prev => [...prev, {
          id: `${Date.now()}-a`,
          role: 'assistant',
          content: localThermoAnswer(userMessage.content),
        }]);
      }
    } catch {
      setAiMode('offline');
      setActiveModel(null);
      setMessages(prev => [...prev, {
        id: `${Date.now()}-a`,
        role: 'assistant',
        content: localThermoAnswer(userMessage.content),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[700px] bg-white dark:bg-surface-800 rounded-3xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-surface-900 dark:text-white leading-tight">AI Thermodynamics Tutor</h2>
            <p className="text-xs text-surface-500 font-medium">Powered by ChemBase AI</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            aiMode === 'offline'
              ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              aiMode === 'offline' ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          />
          {aiMode === 'offline'
            ? 'Offline Reference'
            : `Live AI · ${activeModel || 'Auto'}`}
        </span>
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
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
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
