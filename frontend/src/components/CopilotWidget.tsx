import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  X,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../lib/api';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  intent?: string;
  data?: any;
  actions?: Array<{ type: string; label: string; target?: string; payload?: any }>;
  voiceScript?: string;
  timestamp: string;
}

export const CopilotWidget: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `🛰️ **Namaste! I am Prakriti-Copilot**, your Autonomous Ecological AI Agent.\n\nI monitor real-time satellite telemetry across **Kudremukh National Park** and the **Mangaluru Coastal Zone**. Ask me anything, or speak using the microphone!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    'Which lake in Mangalore lost the most water?',
    'Calculate carbon loss for Tannirbhavi mangrove',
    'Draft legal FIR for Pilikula clearing',
    'What is the status of active alerts?',
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Speech-to-Text Setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSendMessage(transcript);
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Speech recognition start error:', e);
      }
    }
  };

  // Text-to-Speech Output
  const speakText = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis notice:', e);
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputMessage).trim();
    if (!textToSend || isLoading) return;

    setInputMessage('');

    // Add user message to thread
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await api.sendCopilotMessage(textToSend);

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.reply,
        intent: res.intent,
        data: res.data,
        actions: res.actions,
        voiceScript: res.voice_script,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (res.suggested_questions && res.suggested_questions.length > 0) {
        setSuggestedPrompts(res.suggested_questions);
      }

      // Speak voice briefing
      if (res.voice_script) {
        speakText(res.voice_script);
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `⚠️ **Agent Notice**: ${err.message || 'Unable to connect to Copilot reasoning service.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const executeAction = (action: { type: string; label: string; target?: string; payload?: any }) => {
    if (action.type === 'navigate' && action.target) {
      navigate(action.target);
      setIsOpen(false);
    } else if (action.type === 'copy_fir' && action.payload?.text) {
      handleCopy(action.payload.text, 'fir-action');
    } else if (action.type === 'dispatch_telegram') {
      handleSendMessage(`Dispatch alert ${action.target || 'alt-mng-001'} to telegram`);
    } else if (action.type === 'inspect_alert' && action.target) {
      navigate(action.target);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-bold text-sm rounded-full shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 transform hover:scale-105 border border-white/20 group"
          title="Open Prakriti-Copilot Autonomous AI Agent"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <Bot className="w-5 h-5 transition-transform group-hover:rotate-12" />
          <span>Ask Prakriti AI</span>
          <span className="text-[10px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full font-mono">
            Voice & Text
          </span>
        </button>
      )}

      {/* Floating Copilot Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[440px] h-[640px] max-h-[85vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-emerald-950/60 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-tight">Prakriti-Copilot</h3>
                  <span className="text-[9px] px-1.5 py-0.2 bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 rounded-full font-mono">
                    AI AGENT
                  </span>
                </div>
                <p className="text-[10px] text-slate-300">Autonomous Ecological Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Mute/Unmute Audio Speech */}
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isMuted ? 'text-slate-400 hover:text-white' : 'text-emerald-300 bg-white/10'
                }`}
                title={isMuted ? 'Unmute voice synthesis' : 'Mute voice synthesis'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400">
                  <span>{m.sender === 'user' ? 'Field Officer' : 'Prakriti AI'}</span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none shadow-md font-medium'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/60 dark:border-slate-700/60 shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>

                  {/* Action buttons if AI emitted actions */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-700/60 flex flex-wrap gap-1.5">
                      {m.actions.map((act, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => executeAction(act)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[11px] shadow-sm flex items-center gap-1 transition-colors"
                        >
                          <span>{act.label}</span>
                          {act.type === 'navigate' ? (
                            <ArrowRight className="w-3 h-3" />
                          ) : act.type === 'copy_fir' ? (
                            copiedId === 'fir-action' ? (
                              <Check className="w-3 h-3 text-emerald-300" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )
                          ) : (
                            <ExternalLink className="w-3 h-3" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Replay Voice button */}
                  {m.voiceScript && !isMuted && (
                    <button
                      type="button"
                      onClick={() => speakText(m.voiceScript!)}
                      className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline font-semibold"
                    >
                      <Volume2 className="w-3 h-3" />
                      Replay Voice Briefing
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse delay-150"></span>
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse delay-300"></span>
                <span className="text-[11px] text-slate-500 italic ml-1">
                  Querying satellite telemetry & executing agent tools...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Query Chips */}
          <div className="px-3 py-2 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-200/60 dark:border-slate-800 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              ⚡ Quick Prompt Chips
            </span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {suggestedPrompts.slice(0, 3).map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="text-[10.5px] px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 whitespace-nowrap shadow-2xs font-medium transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Voice & Text Input Box */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Mic Speech-to-Text Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-bounce shadow-md shadow-red-500/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 hover:text-emerald-700'
                }`}
                title={isListening ? 'Listening... click to stop' : 'Click to speak query'}
              >
                {isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={isListening ? 'Listening to voice...' : 'Ask Copilot AI or click mic...'}
                className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                disabled={isLoading}
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
