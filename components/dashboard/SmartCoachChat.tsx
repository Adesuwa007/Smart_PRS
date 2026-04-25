'use client';
import { useState, useRef, useEffect } from 'react';
import { ChatMessage, StudentScores } from '@/types';
import { generateCoachResponse } from '@/lib/ai-engine';

interface Props { scores: StudentScores; }

const QUICK_PROMPTS = [
  'Why is my PRS low?',
  'How do I get into product companies?',
  'Give me a 7-day improvement plan',
  'What should I study today?',
];

export default function SmartCoachChat({ scores }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 700));
    const response = generateCoachResponse(text, scores);
    const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: response, timestamp: new Date() };
    setTyping(false);
    setMessages(prev => [...prev, aiMsg]);
  };

  return (
    <>
      {/* FAB */}
      <button onClick={() => setOpen(!open)} className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-[#00C9A7] border-4 border-[#1A1035] shadow-[4px_4px_0px_#1A1035] flex items-center justify-center text-[#1A1035] text-xl hover:shadow-[6px_6px_0px_#1A1035] hover:-translate-y-1 transition-all">
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] bg-white border-4 border-[#1A1035] shadow-[8px_8px_0px_#1A1035] flex flex-col overflow-hidden animate-slide-up" style={{ borderRadius: '20px' }}>
          {/* Header */}
          <div className="p-4 border-b-4 border-[#1A1035] bg-[#F8F7FF]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00C9A7] border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] flex items-center justify-center text-xl">🤖</div>
              <div>
                <p className="text-sm font-black text-[#1A1035] uppercase tracking-tight">SmartCoach AI</p>
                <p className="text-[10px] text-[#1A1035]/60 font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5"><span className="w-2 h-2 bg-[#00C9A7] border border-[#1A1035] rounded-full inline-block"></span> Online</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <p className="text-4xl mb-4">👋</p>
                <p className="text-sm text-[#1A1035]/80 font-bold mb-6">Hi! I&apos;m your AI Placement Coach. Ask me anything about improving your scores.</p>
                <div className="space-y-3">
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <button key={i} onClick={() => sendMessage(prompt)} className="w-full text-left text-xs font-black p-3 rounded-xl border-2 border-[#1A1035] bg-[#F8F7FF] text-[#1A1035] hover:bg-[#EDE9FE] hover:shadow-[3px_3px_0px_#1A1035] hover:-translate-y-0.5 transition-all">
                      💬 {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed font-medium border-2 shadow-[2px_2px_0px_#1A1035] ${msg.role === 'user' ? 'bg-[#1A1035] text-white border-[#1A1035] rounded-br-md' : 'bg-[#EDE9FE] text-[#1A1035] border-[#1A1035] rounded-bl-md'}`}>
                  <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black">$1</strong>') }} />
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-[#EDE9FE] p-3 rounded-2xl rounded-bl-md border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035]">
                  <div className="typing-indicator"><span></span><span></span><span></span></div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t-4 border-[#1A1035] bg-[#F8F7FF]">
            <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask SmartCoach..." className="flex-1 py-3 px-4 text-sm font-bold text-[#1A1035] rounded-xl border-2 border-[#1A1035] bg-white focus:outline-none focus:ring-0 focus:border-[#6C47FF] shadow-[inset_0px_2px_4px_rgba(0,0,0,0.05)] placeholder-[#1A1035]/40" />
              <button type="submit" className="bg-[#6C47FF] py-2 px-4 text-white font-black text-sm rounded-xl border-2 border-[#1A1035] shadow-[2px_2px_0px_#1A1035] hover:shadow-[4px_4px_0px_#1A1035] hover:-translate-y-0.5 transition-all">→</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
