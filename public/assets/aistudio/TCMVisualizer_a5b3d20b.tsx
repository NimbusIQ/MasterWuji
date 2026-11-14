
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { 
  SparklesIcon, 
  MapIcon, 
  TableCellsIcon, 
  CircleStackIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ScaleIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

interface VisualizerProps {
  data: any;
  view: 'MINDMAP' | 'REGIMEN' | 'DATA' | 'MERIDIAN';
}

export const TCMVisualizer: React.FC<VisualizerProps> = ({ data, view }) => {
  if (!data) return (
    <div className="flex flex-col items-center justify-center h-full text-zinc-700 space-y-3 opacity-30">
        <CircleStackIcon className="w-12 h-12 animate-pulse" />
        <p className="text-[10px] uppercase font-black tracking-[0.3em]">Vector Buffer Empty</p>
    </div>
  );

  const syndrome = data.syndrome || {};
  const regimen = data.regimen || {};
  const graph = data.graph || { nodes: [], links: [] };
  const zangFu = data.zangFu || {};
  const meridians = data.meridians || [];

  const renderMindMap = () => (
    <div className="h-full relative overflow-hidden bg-black/20 rounded-3xl border border-white/5 p-6 animate-in fade-in zoom-in duration-700">
        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
                <MapIcon className="w-5 h-5 text-[var(--wood)]" />
                <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-300">Topology Matrix</h4>
            </div>
            <div className="text-[9px] font-mono text-zinc-600 bg-zinc-950 px-3 py-1 rounded-full border border-white/5 uppercase">Nodes_{graph.nodes.length}</div>
        </div>
        <svg width="100%" height="240" viewBox="0 0 400 240" className="drop-shadow-2xl">
            {graph.links.map((link: any, i: number) => {
                const s = graph.nodes.find((n: any) => n.id === link.source);
                const t = graph.nodes.find((n: any) => n.id === link.target);
                if (!s || !t) return null;
                const sIdx = graph.nodes.indexOf(s);
                const tIdx = graph.nodes.indexOf(t);
                return (
                    <line key={i} x1={50 + sIdx * 100} y1={120} x2={50 + tIdx * 100} y2={120} stroke="var(--wood)" strokeWidth="1" strokeDasharray="4 4" opacity="0.2" className="animate-[dash_5s_linear_infinite]" />
                );
            })}
            {graph.nodes.map((node: any, i: number) => (
                <g key={node.id} transform={`translate(${50 + i * 100}, 120)`} className="cursor-pointer hover:scale-110 transition-transform">
                    <circle r="10" fill={node.type === 'ben' ? 'var(--fire)' : node.type === 'mechanism' ? 'var(--wood)' : 'var(--water)'} className="animate-pulse" />
                    <circle r="14" fill="none" stroke={node.type === 'ben' ? 'var(--fire)' : 'var(--wood)'} strokeWidth="1" opacity="0.3" />
                    <foreignObject x="-45" y="20" width="90" height="40">
                        <div className="text-[9px] text-center font-black text-zinc-200 leading-tight uppercase bg-zinc-900/95 p-1.5 rounded-lg border border-white/10 shadow-xl">{node.label}</div>
                    </foreignObject>
                </g>
            ))}
        </svg>
    </div>
  );

  const renderMeridian = () => (
    <div className="h-full space-y-6 animate-in slide-in-from-left-4 duration-500">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {meridians.map((m: any, i: number) => (
                <div key={i} className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col items-center gap-3 transition-all hover:border-[var(--water)] group">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-white transition-colors">{m.name}</span>
                    <div className="relative w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-black/20">
                        <div 
                            className={`absolute inset-y-0 left-0 transition-all duration-1000 ${m.status === 'Excess' ? 'bg-[var(--fire)]' : m.status === 'Deficient' ? 'bg-[var(--water)]' : 'bg-[var(--wood)]'}`} 
                            style={{ width: `${(m.flow || 0.5) * 100}%` }}
                        ></div>
                    </div>
                    <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-tighter">{m.status || 'Stable'}</span>
                </div>
            ))}
        </div>
        
        {zangFu.dominantOrgan && (
            <div className="p-6 rounded-[2rem] bg-zinc-950/60 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--wood)]/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                <div className="flex items-center gap-3 mb-6">
                    <ScaleIcon className="w-5 h-5 text-[var(--fire)]" />
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Organ Resonance Interaction</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-zinc-700 uppercase">Primary_Node</span>
                        <p className="text-2xl font-black text-white tracking-tighter">{zangFu.dominantOrgan}</p>
                        <span className={`text-[10px] font-bold uppercase ${zangFu.status === 'Stagnant' ? 'text-orange-500' : 'text-[var(--wood)]'}`}>{zangFu.status}</span>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.2em]">Inter-System Feedback</span>
                        <div className="flex flex-wrap gap-2">
                            {zangFu.interactions?.map((it: string, j: number) => (
                                <span key={j} className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-xl text-[10px] font-mono text-zinc-400 hover:text-white transition-colors">
                                    {it}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );

  const renderData = () => (
      <div className="h-full overflow-y-auto space-y-6 pr-2 scrollbar-thin animate-in slide-in-from-right-4 duration-500">
          <div className="p-6 bg-zinc-900/60 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
              <h4 className="text-[9px] font-black uppercase text-zinc-600 mb-6 flex items-center gap-2">
                  <ChartBarIcon className="w-4 h-4 text-[var(--fire)]"/> Active Synthesis Pattern
              </h4>
              <div className="space-y-6">
                  <div>
                      <span className="text-[10px] text-[var(--wood)] font-black uppercase tracking-widest">Protocol_Name</span>
                      <p className="text-2xl font-black text-white leading-tight mt-1 tracking-tighter">{syndrome.name || "Kernel Idle"}</p>
                  </div>
                  <div className="p-4 bg-black/20 rounded-2xl border-l-4 border-[var(--wood)]">
                      <p className="text-[11px] leading-relaxed text-zinc-400 italic font-medium">
                        {syndrome.mechanism || "Standing by for bio-feedback..."}
                      </p>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {syndrome.metrics?.map((m: any, i: number) => (
                  <div key={i} className="p-5 bg-zinc-900/40 rounded-[2rem] border border-white/5 flex flex-col gap-3 group hover:border-[var(--wood)]/30 transition-all">
                      <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{m.label}</span>
                          <ArrowTrendingUpIcon className="w-3 h-3 text-zinc-700 group-hover:text-[var(--wood)] transition-all"/>
                      </div>
                      <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-mono font-black text-white">{m.value}%</span>
                          <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight">{m.sub}</span>
                      </div>
                      {m.trend && (
                          <div className="h-8 mt-1 opacity-20 group-hover:opacity-100 transition-all duration-500">
                              <svg viewBox="0 0 100 20" className="w-full h-full">
                                  <polyline fill="none" stroke="var(--wood)" strokeWidth="1.5" strokeLinecap="round" points={m.trend.map((v:number, j:number) => `${(j/(m.trend.length-1))*100},${20-(v/100)*20}`).join(' ')} />
                              </svg>
                          </div>
                      )}
                  </div>
              ))}
          </div>
      </div>
  );

  return (
    <div className="h-full">
        {view === 'MINDMAP' && renderMindMap()}
        {view === 'MERIDIAN' && renderMeridian()}
        {view === 'REGIMEN' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full animate-in slide-in-from-bottom-4 duration-700">
                <div className="p-8 bg-zinc-900/40 rounded-[3rem] border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--earth)]/5 rounded-full blur-3xl"></div>
                    <h5 className="text-[10px] font-black text-zinc-600 uppercase mb-8 flex items-center gap-3 z-10 relative">
                        <SparklesIcon className="w-5 h-5 text-[var(--earth)]"/> Bio-System Optimization
                    </h5>
                    <div className="space-y-4 z-10 relative">
                        {regimen.diet?.map((d: string, i: number) => (
                            <div key={i} className="flex items-center gap-4 group cursor-default">
                                <div className="w-2 h-2 rounded-full bg-zinc-800 group-hover:bg-[var(--wood)] transition-all shadow-[0_0_8px_rgba(16,185,129,0)] group-hover:shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                <span className="text-[11px] text-zinc-400 font-bold group-hover:text-white transition-colors">{d}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-8 bg-zinc-900/40 rounded-[3rem] border border-white/5 flex flex-col justify-between group overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-[var(--water)]/5 rounded-full blur-3xl"></div>
                    <div className="z-10 relative">
                        <h5 className="text-[10px] font-black text-zinc-600 uppercase mb-8 flex items-center gap-3">
                            <TableCellsIcon className="w-5 h-5 text-[var(--water)]"/> Temporal Flow Cycle
                        </h5>
                        <div className="space-y-5">
                            {regimen.schedule?.map((s: string, i: number) => (
                                <div key={i} className="text-[10px] text-zinc-500 font-mono flex items-center gap-4 border-l-2 border-white/5 pl-4 hover:border-[var(--water)] transition-all hover:text-zinc-300">
                                    {s}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-12 pt-6 border-t border-white/5 z-10 relative">
                        <p className="text-[10px] italic text-[var(--fire)] font-black uppercase text-center tracking-[0.3em] group-hover:tracking-[0.4em] transition-all">
                            {regimen.affirmation || "Focus. Flow. Balance."}
                        </p>
                    </div>
                </div>
            </div>
        )}
        {view === 'DATA' && renderData()}
        <style>{`
            @keyframes dash {
                to { stroke-dashoffset: -20; }
            }
        `}</style>
    </div>
  );
};
