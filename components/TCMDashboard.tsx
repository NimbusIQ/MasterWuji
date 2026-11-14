import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon,
  VideoCameraIcon,
  PhotoIcon,
  HeartIcon,
  ClockIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  TrashIcon,
  SpeakerWaveIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  EyeIcon,
  LightBulbIcon,
  BoltIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { 
  getTCMResponse, 
  speakResponse, 
  generateHealthImage, 
  generateHealthVideo 
} from '../services/gemini';
import { TCMVisualizer } from './TCMVisualizer';

const STORAGE_KEY = 'master_wuji_tcm_lab_v2';

const TCM_OBSERVATION_CHANNELS = [
  { label: 'Tongue Inspection', tag: 'SHE-ZHEN', emoji: '👅', prompt: 'Perform a comprehensive Tongue Inspection (She Zhen): assess tongue body color, coating thickness, moisture, and tooth marks for Spleen and Liver Qi harmony.' },
  { label: 'Pulse & Qi Rhythm', tag: 'MAI-ZHEN', emoji: '💓', prompt: 'Analyze Pulse Dynamics (Mai Zhen): wiry, slippery, floating, or deep rhythms indicating Yin-Yang thermal balance.' },
  { label: 'Five Elements', tag: 'WU-XING', emoji: '☯️', prompt: 'Evaluate Five Element (Wu Xing) equilibrium across Wood (Liver), Fire (Heart), Earth (Spleen), Metal (Lung), and Water (Kidney).' },
  { label: 'Organ Clock Rhythm', tag: 'ZI-WU-CLOCK', emoji: '🕰️', prompt: 'Diagnose Circadian Horary Organ Clock (Zi Wu Liu Zhu) symptoms—such as nocturnal waking between 1-3 AM or afternoon energy drops.' },
  { label: 'Yao Shan Nutrition', tag: 'HERBAL-DIET', emoji: '🍵', prompt: 'Prescribe classical TCM Yao Shan medicinal culinary food therapy and herbal teas based on thermal energetics.' },
  { label: 'Meridian Acupoints', tag: 'JING-LUO', emoji: '📍', prompt: 'Identify targeted classical acupressure points (e.g., ST36, LV3, SP6, LI4, PC6) to unblock meridian channels and descend rebellious Qi.' }
];

type Tier = 1 | 2 | 3;

export const TCMDashboard: React.FC = () => {
  const [activeTier, setActiveTier] = useState<Tier>(1);
  const [messages, setMessages] = useState<any[]>([]);
  const [patternData, setPatternData] = useState<any>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [commitments, setCommitments] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [hasVeoKey, setHasVeoKey] = useState(false);
  const [generatingVisuals, setGeneratingVisuals] = useState(false);
  const [prescribedImage, setPrescribedImage] = useState<string | null>(null);
  const [prescribedVideo, setPrescribedVideo] = useState<string | null>(null);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [visualSettings, setVisualSettings] = useState({
    style: 'Classical TCM Botanical Herbalism',
    mood: 'Serene & Harmonious',
    elements: 'delicate herbal steam, porcelain tea bowls, goji berries, raw reishi, and bamboo shadows'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dashboardRef.current) {
        const rect = dashboardRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        dashboardRef.current.style.setProperty('--mouse-x', `${x}%`);
        dashboardRef.current.style.setProperty('--mouse-y', `${y}%`);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setHasVeoKey(hasKey);
      }
    };
    checkKey();
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMessages(parsed.messages || []);
        setPatternData(parsed.patternData || null);
        setCommitments(parsed.commitments || []);
        if (parsed.patternData) setActiveTier(2);
      } catch (e) {
        console.error("Storage load error", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, patternData, commitments }));
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, patternData, commitments]);

  const handleOpenKeyDialog = async () => {
    if ((window as any).aistudio?.openSelectKeyDialog) {
      await (window as any).aistudio.openSelectKeyDialog();
      setHasVeoKey(true);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !imagePreview) || isTyping) return;

    const userMessage = {
      role: 'user',
      text: input,
      image: imagePreview,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setImagePreview(null);
    setIsTyping(true);

    try {
      const response = await getTCMResponse(userMessage.text, userMessage.image || undefined);
      
      const aiMessage = {
        role: 'ai',
        text: response.text,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);

      if (response.data) {
        setPatternData(response.data);
      }

      if (response.data?.visualPrompts) {
        handleGenerateVisuals(response.data.visualPrompts, visualSettings);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'ai', 
          text: 'The Qi circulation was momentarily disrupted during transmission. Please restate your symptoms or re-upload the observation.', 
          timestamp: new Date().toISOString() 
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerateVisuals = async (prompts: any, settings?: any) => {
    if (!prompts) return;
    setGeneratingVisuals(true);
    try {
      if (prompts.imagePrompt) {
        const img = await generateHealthImage(prompts.imagePrompt, settings);
        setPrescribedImage(img);
      }
      if (prompts.videoPrompt && hasVeoKey) {
        const vid = await generateHealthVideo(prompts.videoPrompt, settings);
        setPrescribedVideo(vid);
      }
    } catch (e) {
      console.error("Visual generation failed", e);
    } finally {
      setGeneratingVisuals(false);
    }
  };

  const handleReSynthesize = () => {
    if (patternData?.visualPrompts) {
      handleGenerateVisuals(patternData.visualPrompts, visualSettings);
    }
  };

  const commitToTask = (taskId: string) => {
    if (!commitments.includes(taskId)) {
      setCommitments(prev => [...prev, taskId]);
    } else {
      setCommitments(prev => prev.filter(id => id !== taskId));
    }
  };

  const resetLab = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([]);
    setPatternData(null);
    setCommitments([]);
    setPrescribedImage(null);
    setPrescribedVideo(null);
    setActiveTier(1);
  };

  return (
    <div ref={dashboardRef} className="flex flex-col h-screen bg-[#080C14] text-white overflow-hidden bg-subtle-grid relative select-none">
      {/* Cursor-aware subtle ambient glow */}
      <div className="generative-glow" />

      {/* Top Hairline Indicator */}
      <div className="hairline-orange w-full shrink-0 relative z-50" />
      
      {/* Master Navigation Header */}
      <header className="shrink-0 bg-[#080C14]/75 backdrop-blur-3xl border-b border-white/[0.08] z-40 py-3.5 px-6 md:px-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.1] flex items-center justify-center shadow-lg relative group">
               <div className="absolute inset-0 rounded-xl bg-orange-500/10 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
               <span className="text-lg font-serif text-orange-400 select-none">☯</span>
             </div>
             <div>
               <div className="flex items-center gap-2">
                 <h1 className="font-display font-bold text-base tracking-tight text-white">Master Wuji</h1>
                 <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-widest">
                   TCM v26
                 </span>
               </div>
               <p className="text-[9px] text-slate-400 font-mono tracking-wider flex items-center gap-1.5">
                 <span className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />
                 Traditional Chinese Medicine & Biological Equilibrium Lab
               </p>
             </div>
          </div>

          {/* 3-Tier Scientific Method Navigation */}
          <nav className="flex items-center gap-8 md:gap-14">
            <button 
              onClick={() => setActiveTier(1)}
              className={`nav-step group ${activeTier === 1 ? 'step-active' : activeTier > 1 ? 'step-completed' : 'step-inactive'}`}
            >
              <div className="step-indicator">
                {activeTier > 1 ? <CheckCircleIcon className="w-5 h-5 text-orange-400" /> : <EyeIcon className="w-5 h-5" />}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em]">1. Observe</span>
            </button>
            
            <button 
              onClick={() => patternData && setActiveTier(2)}
              disabled={!patternData}
              className={`nav-step group ${activeTier === 2 ? 'step-active' : activeTier > 2 ? 'step-completed' : 'step-inactive'} ${!patternData ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <div className="step-indicator">
                {activeTier > 2 ? <CheckCircleIcon className="w-5 h-5 text-orange-400" /> : <LightBulbIcon className="w-5 h-5" />}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em]">2. Understand</span>
            </button>

            <button 
              onClick={() => patternData && setActiveTier(3)}
              disabled={!patternData}
              className={`nav-step group ${activeTier === 3 ? 'step-active' : 'step-inactive'} ${!patternData ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <div className="step-indicator">
                <BoltIcon className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em]">3. Act</span>
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={resetLab} 
              title="Reset diagnostic session"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              <TrashIcon className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Experience Arena */}
      <main className="flex-1 overflow-hidden relative z-10">
        <AnimatePresence mode="wait">
          {/* TIER 1: OBSERVE (Wang Wen Wen Qie) */}
          {activeTier === 1 && (
            <motion.div 
              key="tier1"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ duration: 0.4 }}
              className="h-full flex flex-col max-w-4xl mx-auto w-full p-4 md:p-8"
            >
              <div className="flex-1 overflow-y-auto space-y-6 pb-36 scrollbar-thin pr-2">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-7 py-6">
                    <div className="relative">
                      <div className="absolute -inset-10 bg-orange-500/5 blur-3xl rounded-full pointer-events-none" />
                      
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                        <span className="text-[9px] font-mono tracking-[0.2em] uppercase text-orange-400/90 font-bold">
                          The Four Examinations • 四诊合参
                        </span>
                      </div>

                      <h2 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight text-white leading-tight">
                        Classical TCM Diagnostics & <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-200 to-orange-400">
                          Biological Equilibrium
                        </span>
                      </h2>
                    </div>
                    
                    <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto font-normal leading-relaxed">
                      Upload a tongue photograph, describe your circadian sleep rhythm, or enter symptoms to initiate holistic syndrome differentiation (Bian Zheng).
                    </p>

                    {/* Diagnostic Channel Cards */}
                    <div className="flex gap-3 overflow-x-auto p-2 max-w-full no-scrollbar">
                       {TCM_OBSERVATION_CHANNELS.map((ch, idx) => (
                         <div 
                           key={idx} 
                           onClick={() => setInput(ch.prompt)}
                           className="p-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-orange-500/30 transition-all duration-300 flex flex-col items-center gap-1.5 shrink-0 w-36 cursor-pointer group"
                         >
                            <span className="text-2xl group-hover:scale-110 transition-transform">{ch.emoji}</span>
                            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-300 text-center">{ch.label}</span>
                            <span className="text-[7.5px] font-mono text-orange-400/80 uppercase">{ch.tag}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
                
                {messages.map((m, i) => (
                  <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} gap-2.5`}>
                    <div className={`max-w-[85%] p-6 rounded-3xl text-sm leading-relaxed backdrop-blur-2xl transition-all ${
                      m.role === 'user' 
                      ? 'bg-gradient-to-br from-orange-950/40 to-slate-900/80 text-white rounded-tr-none border border-orange-500/30 shadow-xl' 
                      : 'bg-white/[0.03] text-slate-200 rounded-tl-none border border-white/[0.08] shadow-xl'
                    }`}>
                      {m.image && (
                        <div className="mb-4">
                          <img 
                            src={m.image} 
                            alt="Observation" 
                            className="rounded-2xl w-full max-h-60 object-cover border border-white/10" 
                          />
                          <span className="text-[9px] font-mono text-orange-400/80 uppercase tracking-widest mt-1.5 block">
                            She Zhen Tongue Observation Attached
                          </span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap font-normal leading-relaxed text-sm">{m.text}</div>
                    </div>
                    {m.role === 'ai' && (
                      <div className="flex items-center gap-3 ml-2">
                         <button 
                           onClick={() => speakResponse(m.text)} 
                           title="Listen to Master Wuji's voice"
                           className="p-2 bg-white/[0.02] border border-white/[0.06] text-slate-400 hover:text-white hover:border-orange-500/30 rounded-xl transition-all"
                         >
                           <SpeakerWaveIcon className="w-3.5 h-3.5" />
                         </button>
                         {i === messages.length - 1 && patternData && (
                            <button 
                              onClick={() => setActiveTier(2)}
                              className="px-4 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs font-bold flex items-center gap-2 transition-all"
                            >
                              <span>Inspect TCM Syndrome Pattern</span>
                              <ChevronRightIcon className="w-3 h-3 stroke-[2]" />
                            </button>
                         )}
                      </div>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-2.5 p-4 bg-white/[0.02] border border-white/[0.08] rounded-2xl w-fit items-center ml-2 animate-pulse">
                    <SparklesIcon className="w-4 h-4 text-orange-400 stroke-[1.5]" />
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                      Master Wuji analyzing pulse, tongue & meridian flow...
                    </span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Frictionless Floating Command Bar */}
              <div className="absolute bottom-6 inset-x-4 md:inset-x-8">
                <div className="max-w-4xl mx-auto">
                  <div className="bg-[#0B0F17]/85 backdrop-blur-3xl p-3 border border-white/[0.09] rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex items-center gap-3 focus-within:border-orange-500/40 transition-all">
                    {imagePreview && (
                      <div className="relative shrink-0 w-12 h-12 ml-2">
                         <img src={imagePreview} className="w-full h-full object-cover rounded-2xl border border-white/20" alt="Tongue Preview" />
                         <button 
                           onClick={() => setImagePreview(null)} 
                           className="absolute -top-1.5 -right-1.5 bg-slate-900 text-white p-1 rounded-full border border-white/20 hover:bg-red-600 transition-colors"
                         >
                            <TrashIcon className="w-2.5 h-2.5" />
                         </button>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      title="Upload Tongue Photo (She Zhen)"
                      className="p-3 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-full transition-all"
                    >
                      <PhotoIcon className="w-5 h-5 stroke-[1.5]" />
                    </button>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const r = new FileReader();
                          r.onload = () => setImagePreview(r.result as string);
                          r.readAsDataURL(f);
                        }
                      }} 
                    />
                    
                    <input 
                      type="text" 
                      value={input} 
                      onChange={(e) => setInput(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Describe symptoms, fatigue timing, tongue coat, or emotional state..." 
                      className="flex-1 bg-transparent px-2 py-2.5 text-sm md:text-base font-normal text-white focus:outline-none placeholder:text-slate-500"
                    />
                    
                    <button 
                      onClick={handleSend} 
                      className="p-3.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/40 rounded-full transition-all active:scale-95 shadow-lg"
                    >
                      <PaperAirplaneIcon className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="mt-2.5 flex justify-between px-6">
                     <p className="text-[8px] text-slate-500 font-mono tracking-widest uppercase">
                       Daoist Classical Method • Confidential Health Protocol
                     </p>
                     <div className="flex gap-4">
                        <span 
                          onClick={() => setInput("Evaluate my sleep disruption: I wake up consistently between 1 AM and 3 AM with warm palms")}
                          className="text-[8px] text-slate-500 font-mono uppercase tracking-widest cursor-pointer hover:text-orange-400 transition-colors"
                        >
                          Horary Clock Scan
                        </span>
                        <span 
                          onClick={() => setInput("What Yao Shan congee and herbal tea formula harmonizes Spleen Dampness and fatigue?")}
                          className="text-[8px] text-slate-500 font-mono uppercase tracking-widest cursor-pointer hover:text-orange-400 transition-colors"
                        >
                          Yao Shan Formula
                        </span>
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TIER 2: UNDERSTAND (Bian Zheng & Zang-Fu Differentiation) */}
          {activeTier === 2 && (
            <motion.div 
              key="tier2"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.4 }}
              className="h-full flex flex-col max-w-6xl mx-auto w-full p-6 md:p-10 overflow-hidden"
            >
              <div className="flex flex-col md:flex-row gap-8 h-full overflow-hidden">
                 <div className="flex-1 space-y-8 overflow-y-auto pr-4 scrollbar-thin">
                    <div className="space-y-4">
                       <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                         <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-[0.2em]">
                           TCM Syndrome Differentiation • 辨证论治
                         </span>
                       </div>
                       
                       <div className="flex items-baseline gap-4">
                         <h2 className="text-3xl md:text-4xl font-display font-extrabold text-white tracking-tight leading-tight">
                           {patternData?.syndrome?.name || "Zang-Fu Disharmony Pattern"}
                         </h2>
                         {patternData?.syndrome?.chineseName && (
                           <span className="text-xl font-serif text-orange-400/90 font-medium">
                             {patternData.syndrome.chineseName}
                           </span>
                         )}
                       </div>

                       <p className="text-base text-slate-300 font-normal leading-relaxed max-w-2xl">
                          {patternData?.syndrome?.hypothesis}
                       </p>
                    </div>

                    <div className="tier-card p-6">
                       <TCMVisualizer data={patternData} view="DATA" />
                    </div>
                 </div>

                 {/* Master Wuji Diagnostic Wisdom Sidebar */}
                 <div className="w-full md:w-88 flex flex-col gap-6 sticky top-0 shrink-0">
                    <div className="tier-card p-8 bg-white/[0.02] border border-white/[0.08] relative overflow-hidden">
                       <div className="flex items-center gap-2 mb-4">
                         <LightBulbIcon className="w-4 h-4 text-orange-400 stroke-[1.5]" />
                         <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white">
                           Master Wuji's Counsel
                         </h3>
                       </div>
                       <p className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-orange-500/50 pl-4 py-1">
                          "When the Root (Ben) is nourished, the Branches (Biao) naturally flourish. We restore equilibrium not by battling symptoms, but by guiding Qi into its natural channels."
                       </p>
                       <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[9px] font-mono text-slate-400">
                         <span>Therapeutic Axis</span>
                         <span className="text-orange-400">
                           {patternData?.syndrome?.primaryElement || "Harmonize Qi & Blood"}
                         </span>
                       </div>
                    </div>
                    
                    <button 
                      onClick={() => setActiveTier(3)}
                      className="w-full py-5 px-6 rounded-2xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 font-display font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg group"
                    >
                      <span>Engage Harmonization Protocol</span>
                      <BoltIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                    
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                       <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-slate-400">
                         <span>Yin-Yang Alignment Ratio</span>
                         <span className="text-orange-400">{patternData?.syndrome?.yinYangRatio || 78}% Equilibrium</span>
                       </div>
                       <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-orange-500" 
                           style={{ width: `${patternData?.syndrome?.yinYangRatio || 78}%` }}
                         />
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {/* TIER 3: ACT (Yao Shan, Acupressure & Multimodal Synthesis) */}
          {activeTier === 3 && (
            <motion.div 
              key="tier3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="h-full flex flex-col max-w-7xl mx-auto w-full p-6 md:p-10 overflow-y-auto no-scrollbar"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                 <div className="lg:col-span-8 space-y-10">
                    {/* Action Cards */}
                    <div className="space-y-6">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                             <HeartIcon className="w-6 h-6 text-orange-400 stroke-[1.5]" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                              Harmonization Prescriptions
                            </span>
                            <h2 className="text-3xl font-display font-extrabold text-white tracking-tight leading-none">
                              Yao Shan & Meridian Regimen
                            </h2>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {patternData?.regimen?.actions?.map((action: any) => (
                            <button 
                              key={action.id}
                              onClick={() => commitToTask(action.id)}
                              className={`tier-card p-6 flex items-start gap-4 text-left group relative overflow-hidden transition-all ${
                                commitments.includes(action.id) 
                                ? 'bg-orange-500/[0.04] border-orange-500/30' 
                                : 'hover:border-white/20'
                              }`}
                            >
                              <span className="text-3xl block">{action.emoji || '🍵'}</span>
                              <div className="space-y-1 flex-1">
                                 {action.category && (
                                   <span className="text-[8px] font-mono uppercase tracking-widest text-orange-400/80 block">
                                     {action.category}
                                   </span>
                                 )}
                                 <h5 className={`font-display font-bold text-sm ${commitments.includes(action.id) ? 'text-orange-400' : 'text-white'}`}>
                                    {action.title}
                                 </h5>
                                 <p className="text-xs text-slate-400 leading-relaxed font-normal">{action.description}</p>
                              </div>
                              {commitments.includes(action.id) && (
                                <div className="shrink-0">
                                   <CheckCircleIcon className="w-5 h-5 text-orange-400" />
                                </div>
                              )}
                            </button>
                          ))}
                       </div>
                    </div>

                    {/* Multimodal Synthesis Section */}
                    <div className="space-y-6">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                <SparklesIcon className="w-6 h-6 text-orange-400 stroke-[1.5]" />
                             </div>
                             <div>
                                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                                  Sensory Synthesis Lab
                                </span>
                                <h2 className="text-2xl font-display font-extrabold text-white tracking-tight leading-none">
                                  TCM Visual Prescriptions
                                </h2>
                             </div>
                          </div>
                          <button 
                            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                            className={`p-2.5 rounded-xl border transition-all ${showSettingsPanel ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:text-white'}`}
                          >
                            <AdjustmentsHorizontalIcon className="w-5 h-5" />
                          </button>
                       </div>

                       <AnimatePresence>
                         {showSettingsPanel && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-6 tier-card flex flex-wrap gap-4 items-center mb-6">
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
                                    Visual Aesthetic Archetype
                                  </label>
                                  <select 
                                    value={visualSettings.style}
                                    onChange={(e) => setVisualSettings({...visualSettings, style: e.target.value})}
                                    className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-orange-500/40 transition-all w-60"
                                  >
                                    <option className="bg-[#0B0F17] text-white">Classical TCM Botanical Herbalism</option>
                                    <option className="bg-[#0B0F17] text-white">Yao Shan Medicinal Culinary Art</option>
                                    <option className="bg-[#0B0F17] text-white">Serene Qi Gong Flow & Movement</option>
                                    <option className="bg-[#0B0F17] text-white">Zen Sanctuary with Tea & Porcelain</option>
                                  </select>
                                </div>
                                
                                <button 
                                  onClick={handleReSynthesize}
                                  className="mt-5 px-6 py-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold flex items-center gap-2 transition-all shadow-md"
                                >
                                  <ArrowPathIcon className={`w-3.5 h-3.5 ${generatingVisuals ? 'animate-spin' : ''}`} />
                                  Synthesize New Visuals
                                </button>
                              </div>
                            </motion.div>
                         )}
                       </AnimatePresence>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="tier-card overflow-hidden relative group">
                             {prescribedImage ? (
                               <img src={prescribedImage} className="w-full h-72 object-cover" alt="Synthesized TCM Prescription" />
                             ) : (
                               <div className="w-full h-72 flex items-center justify-center text-slate-600 bg-white/[0.01]">
                                  <PhotoIcon className="w-16 h-16 opacity-20 stroke-[1]" />
                               </div>
                             )}
                             <div className="p-4 flex items-center justify-between bg-[#080C14]/80 backdrop-blur-2xl absolute bottom-0 inset-x-0 border-t border-white/[0.06]">
                                <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">
                                  Botanical Yao Shan Imagery
                                </span>
                                {generatingVisuals && <ClockIcon className="w-4 h-4 text-orange-400 animate-spin" />}
                             </div>
                          </div>
                          
                          <div className="tier-card overflow-hidden relative group">
                             {prescribedVideo ? (
                               <video src={prescribedVideo} controls className="w-full h-72 bg-black" />
                             ) : (
                               <div className="w-full h-72 flex items-center justify-center text-slate-600 flex-col gap-3 bg-white/[0.01]">
                                  <VideoCameraIcon className="w-16 h-16 opacity-20 stroke-[1]" />
                                  {!hasVeoKey && (
                                    <button 
                                      onClick={handleOpenKeyDialog} 
                                      className="px-4 py-1.5 bg-white/[0.04] hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/30 text-slate-300 hover:text-orange-400 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest transition-all"
                                    >
                                      Enable Meditative Veo Video Lab
                                    </button>
                                  )}
                               </div>
                             )}
                             <div className="p-4 flex items-center justify-between bg-[#080C14]/80 backdrop-blur-2xl absolute bottom-0 inset-x-0 border-t border-white/[0.06]">
                                <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">
                                  Qi Gong & Flow Motion
                                </span>
                                {generatingVisuals && <ClockIcon className="w-4 h-4 text-orange-400 animate-spin" />}
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Momentum & Regimen Commitment Card */}
                 <div className="lg:col-span-4 space-y-6">
                    <div className="p-8 tier-card text-center space-y-6">
                       <div className="relative inline-block">
                          <div className="w-24 h-24 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto shadow-inner">
                             <h4 className="text-5xl font-display font-extrabold text-orange-400">{commitments.length}</h4>
                          </div>
                       </div>
                       
                       <div className="space-y-1">
                          <h3 className="font-display font-bold text-lg text-white">Daily Jing-Qi Commitments</h3>
                          <p className="text-xs text-slate-400">Selected actions verified to cultivate balance and vital essence.</p>
                       </div>
                       
                       <div className="grid grid-cols-5 gap-2 max-w-[160px] mx-auto">
                          {[1,2,3,4,5].map(i => (
                            <div 
                              key={i} 
                              className={`h-1 rounded-full transition-all duration-700 ${commitments.length >= i ? 'bg-orange-500' : 'bg-white/[0.08]'}`} 
                            />
                          ))}
                       </div>
                       
                       <button 
                         onClick={resetLab}
                         className="w-full py-3 text-[10px] font-mono font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-[0.2em] border-t border-white/[0.06] pt-4"
                       >
                         Complete Daily Harmonization
                       </button>
                    </div>

                    <div className="p-6 tier-card italic text-sm text-slate-300 leading-relaxed border border-white/[0.08]">
                       "When Yin and Yang are balanced and the Jing-Shen resides within, disease has nowhere to enter."
                       <span className="block mt-2 text-[10px] font-mono text-orange-400/80 not-italic uppercase tracking-widest">
                         — Huangdi Neijing (Yellow Emperor's Classic)
                       </span>
                    </div>
                    
                    <div className="p-6 tier-card space-y-4">
                       <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                         Harmonization Indicators
                       </h4>
                       <div className="space-y-3">
                          {['Zang-Fu Organ Balance', 'Five Elements (Wu Xing) Flow', 'Yao Shan Dietary Absorption'].map((s) => (
                            <div key={s} className="space-y-1.5">
                               <div className="flex justify-between text-[9px] font-mono uppercase tracking-wider text-slate-400">
                                 <span>{s}</span>
                                 <span className="text-orange-400">Harmonized</span>
                               </div>
                               <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                                 <div className={`h-full rounded-full w-[94%] bg-orange-500`} />
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
