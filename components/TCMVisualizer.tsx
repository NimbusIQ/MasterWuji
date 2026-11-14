import React from 'react';
import { 
  ArrowTrendingUpIcon,
  SparklesIcon,
  FireIcon,
  SunIcon,
  MoonIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface VisualizerProps {
  data: any;
  view?: 'MINDMAP' | 'REGIMEN' | 'DATA' | 'MERIDIAN';
}

const FIVE_ELEMENTS = [
  { name: 'Wood', zh: '木', organ: 'Liver / Gallbladder', color: 'text-emerald-400', border: 'border-emerald-500/20' },
  { name: 'Fire', zh: '火', organ: 'Heart / Small Intestine', color: 'text-rose-400', border: 'border-rose-500/20' },
  { name: 'Earth', zh: '土', organ: 'Spleen / Stomach', color: 'text-amber-400', border: 'border-amber-500/20' },
  { name: 'Metal', zh: '金', organ: 'Lung / Large Intestine', color: 'text-slate-300', border: 'border-slate-400/20' },
  { name: 'Water', zh: '水', organ: 'Kidney / Bladder', color: 'text-cyan-400', border: 'border-cyan-500/20' },
];

export const TCMVisualizer: React.FC<VisualizerProps> = ({ data }) => {
  if (!data) return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 py-16">
      <div className="relative">
        <div className="absolute -inset-4 bg-orange-500/10 blur-2xl rounded-full" />
        <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center">
          <span className="text-2xl font-serif text-slate-400 select-none">☯</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
        <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 font-mono">
          Meridian Channels Awaiting Diagnostic Observation
        </p>
      </div>
    </div>
  );

  const syndrome = data.syndrome || {};
  const currentHour = new Date().getHours();

  // Classical 12-Hour Organ Clock mapping
  const getActiveOrgan = (hour: number) => {
    if (hour >= 23 || hour < 1) return { organ: 'Gallbladder (胆)', time: '23:00 - 01:00', channel: 'Zu Shao Yang' };
    if (hour >= 1 && hour < 3) return { organ: 'Liver (肝)', time: '01:00 - 03:00', channel: 'Zu Jue Yin' };
    if (hour >= 3 && hour < 5) return { organ: 'Lung (肺)', time: '03:00 - 05:00', channel: 'Shou Tai Yin' };
    if (hour >= 5 && hour < 7) return { organ: 'Large Intestine (大肠)', time: '05:00 - 07:00', channel: 'Shou Yang Ming' };
    if (hour >= 7 && hour < 9) return { organ: 'Stomach (胃)', time: '07:00 - 09:00', channel: 'Zu Yang Ming' };
    if (hour >= 9 && hour < 11) return { organ: 'Spleen (脾)', time: '09:00 - 11:00', channel: 'Zu Tai Yin' };
    if (hour >= 11 && hour < 13) return { organ: 'Heart (心)', time: '11:00 - 13:00', channel: 'Shou Shao Yin' };
    if (hour >= 13 && hour < 15) return { organ: 'Small Intestine (小肠)', time: '13:00 - 15:00', channel: 'Shou Tai Yang' };
    if (hour >= 15 && hour < 17) return { organ: 'Bladder (膀胱)', time: '15:00 - 17:00', channel: 'Zu Tai Yang' };
    if (hour >= 17 && hour < 19) return { organ: 'Kidney (肾)', time: '17:00 - 19:00', channel: 'Zu Shao Yin' };
    if (hour >= 19 && hour < 21) return { organ: 'Pericardium (心包)', time: '19:00 - 21:00', channel: 'Shou Jue Yin' };
    return { organ: 'Triple Burner (三焦)', time: '21:00 - 23:00', channel: 'Shou Shao Yang' };
  };

  const activeOrgan = getActiveOrgan(currentHour);

  return (
    <div className="h-full overflow-y-auto space-y-6 pr-1 scrollbar-thin">
      {/* Header telemetry bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <span className="text-orange-400 text-xs font-serif">☯</span>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">
              Meridian & Five Elements Telemetry
            </h4>
            <p className="text-[8px] font-mono text-slate-400">Classical TCM Bian Zheng Diagnostics</p>
          </div>
        </div>

        {/* Current Horary Organ Clock status */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.08]">
          <ClockIcon className="w-3 h-3 text-orange-400" />
          <span className="text-[9px] font-mono text-slate-300">
            Horary Clock: <span className="text-orange-400 font-bold">{activeOrgan.organ}</span>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
        </div>
      </div>

      {/* Five Element Harmonic Flow Bar */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-2xl space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400">
            Five Elements Dynamics (Wu Xing • 五行生克)
          </span>
          {syndrome.primaryElement && (
            <span className="text-[9px] font-mono text-orange-400 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
              Primary Axis: {syndrome.primaryElement}
            </span>
          )}
        </div>

        <div className="grid grid-cols-5 gap-2">
          {FIVE_ELEMENTS.map((el) => {
            const isDominant = syndrome.primaryElement?.toLowerCase().includes(el.name.toLowerCase());
            return (
              <div 
                key={el.name}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isDominant 
                    ? 'bg-orange-500/10 border-orange-500/40 shadow-sm' 
                    : 'bg-white/[0.01] border-white/[0.06] hover:border-white/10'
                }`}
              >
                <span className="text-sm block font-serif text-white">{el.zh}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-300 mt-0.5">{el.name}</span>
                <span className="text-[7px] text-slate-500 block truncate font-mono mt-0.5">{el.organ.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Four Core Diagnostic Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {syndrome.metrics?.map((m: any, i: number) => (
          <div 
            key={i} 
            className="p-5 rounded-2xl bg-white/[0.02] backdrop-blur-2xl border border-white/[0.08] hover:border-orange-500/30 transition-all duration-500 flex flex-col gap-3 group"
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                {m.label}
              </span>
              <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-orange-400 stroke-[1.5] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-display font-extrabold text-white tracking-tight">
                {m.value}%
              </span>
              <span className="text-[10px] text-orange-400/90 font-mono font-medium tracking-tight flex items-center gap-1">
                {m.sub}
              </span>
            </div>

            {/* 1.5px Hairline Sparkline */}
            {m.trend && (
              <div className="h-8 mt-1 overflow-hidden rounded-xl bg-white/[0.02] border border-white/[0.04] relative">
                <svg viewBox="0 0 100 20" className="w-full h-full" preserveAspectRatio="none">
                  <path 
                    d={m.trend.map((v: number, j: number) => `${j === 0 ? 'M' : 'L'} ${(j / (m.trend.length - 1)) * 100} ${20 - (v / 100) * 20}`).join(' ')} 
                    fill="none" 
                    stroke="#EA580C" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* TCM Diagnostic Hypothesis & Syndrome Root (Ben vs Biao) */}
      <div className="p-6 rounded-2xl bg-white/[0.02] backdrop-blur-2xl border border-white/[0.08] relative overflow-hidden group hover:border-orange-500/25 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-[0.2em] font-mono">
              Syndrome Differentiation (Bian Zheng • 辨证核心)
            </span>
          </div>
          {syndrome.chineseName && (
            <span className="text-xs font-serif text-slate-400 px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
              {syndrome.chineseName}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-normal">
          {syndrome.hypothesis || "Awaiting observation input to generate classical TCM diagnostic hypothesis."}
        </p>
      </div>
    </div>
  );
};
