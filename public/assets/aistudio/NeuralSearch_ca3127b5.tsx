import React, { useState, useEffect, useRef } from 'react';
import { PageTitle, ActionButton, LoadingState, ErrorState } from '../components/shared';
import { MaterialSymbol } from '../components/icons';

interface AuditMatch {
    category: 'potential_patents' | 'tech_stacks' | 'verticals' | 'forgotten_data';
    keyword: string;
    file: string;
    line_number: number;
    line_text: string;
    confidence: number;
}

const SEARCH_VECTORS = {
    potential_patents: ['patent', 'unique algorithm', 'invention', 'proprietary', 'sovereign engine'],
    tech_stacks: ['blockchain', 'Web3', 'AlloyDB', 'Vertex AI', 'BigQuery', 'AI agent', 'Gemini Live'],
    verticals: ['roofing', 'sports', 'F&I', 'finance', 'NIL', 'water', 'satellite', 'travel', 'TCM'],
    forgotten_data: ['draft', 'old version', 'deprecated', 'legacy', 'TODO', 'FIXME']
};

const NeuralSearch: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<AuditMatch[]>([]);
    const [telemetry, setTelemetry] = useState<string[]>([]);
    const [activeVector, setActiveVector] = useState<string | null>(null);
    
    const logEndRef = useRef<HTMLDivElement>(null);

    const addTelemetry = (msg: string) => {
        setTelemetry(prev => [...prev.slice(-15), `> ${msg}`]);
    };

    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [telemetry]);

    const handleStartScan = async () => {
        setIsScanning(true);
        setProgress(0);
        setResults([]);
        setTelemetry([]);
        addTelemetry("INITIALIZING NEURAL CODEBASE INGESTION...");
        addTelemetry("MAPPING REPOSITORY TOPOLOGY...");

        const categories = Object.keys(SEARCH_VECTORS) as (keyof typeof SEARCH_VECTORS)[];
        
        for (let i = 0; i < categories.length; i++) {
            const cat = categories[i];
            setActiveVector(cat.toUpperCase());
            addTelemetry(`EXECUTING VECTOR SCAN: ${cat.toUpperCase()}`);
            
            // Simulate scanning files
            for (let j = 0; j < 5; j++) {
                await new Promise(r => setTimeout(r, 600));
                setProgress(prev => Math.min(prev + (100 / (categories.length * 5)), 99));
                addTelemetry(`ANALYZING SOURCE BLOCK [${Math.random().toString(16).slice(2, 8)}]...`);
            }

            // Generate some mock results based on the "Brain File"
            const categoryResults: AuditMatch[] = [
                {
                    category: cat,
                    keyword: SEARCH_VECTORS[cat][0],
                    file: `src/features/${cat === 'verticals' ? 'TheBrain' : 'ClaimCore'}.tsx`,
                    line_number: Math.floor(Math.random() * 500),
                    line_text: `export const ${cat}_logic = () => { /* Sovereign Implementation */ }`,
                    confidence: 0.85 + Math.random() * 0.14
                }
            ];
            setResults(prev => [...prev, ...categoryResults]);
            addTelemetry(`MATCH IDENTIFIED: ${categoryResults[0].keyword} in ${categoryResults[0].file}`);
        }

        setProgress(100);
        setIsScanning(false);
        setActiveVector(null);
        addTelemetry("INGESTION CYCLE COMPLETE. DATA NORMALIZED.");
    };

    return (
        <div className="flex flex-col h-full animate-fade-in space-y-10 relative">
            <PageTitle 
                title="Neural Search" 
                subtitle="Recursive codebase ingestion and multi-modal IP audit engine." 
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Control Panel */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="glass-panel rounded-[3.5rem] p-10 space-y-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px]"></div>
                        
                        <div className="space-y-6">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Forensic Scan Status</label>
                            <div className="bg-slate-950/50 rounded-3xl p-8 border border-white/5 space-y-6">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="space-y-1">
                                        <p className="text-2xl font-black text-white">{Math.round(progress)}%</p>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Global Ingestion Progress</p>
                                    </div>
                                    {isScanning && (
                                        <div className="flex gap-1 mb-2">
                                            {[1,2,3].map(i => (
                                                <div key={i} className="w-1 h-4 bg-indigo-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-indigo-600 to-cyan-500 transition-all duration-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Active Search Vectors</label>
                            <div className="grid grid-cols-1 gap-3">
                                {Object.keys(SEARCH_VECTORS).map((v) => (
                                    <div key={v} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${activeVector === v.toUpperCase() ? 'bg-indigo-500/10 border-indigo-500/50 text-white' : 'bg-slate-950/30 border-white/5 text-slate-500'}`}>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{v.replace('_', ' ')}</span>
                                        {activeVector === v.toUpperCase() ? <MaterialSymbol icon="sync" className="animate-spin text-sm" /> : <MaterialSymbol icon="check_circle" className="text-sm opacity-20" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <ActionButton 
                            onClick={handleStartScan}
                            isLoading={isScanning}
                            disabled={isScanning}
                            className="w-full py-8 text-xl uppercase tracking-[0.4em] shadow-2xl shadow-indigo-600/20"
                            icon={<MaterialSymbol icon="biometrics" />}
                        >
                            {isScanning ? 'Scanning...' : 'Start Audit'}
                        </ActionButton>
                    </div>

                    {/* Telemetry Hub */}
                    <div className="bg-[#020617] border border-white/5 rounded-[2rem] p-8 h-64 flex flex-col font-mono text-[10px] text-slate-500 overflow-hidden shadow-inner">
                        <div className="flex items-center gap-3 mb-6 opacity-50 border-b border-white/5 pb-4">
                            <MaterialSymbol icon="terminal" className="text-xs" />
                            <span className="uppercase tracking-[0.3em] font-black">Forensic Telemetry Stream</span>
                        </div>
                        <div className="flex-grow overflow-y-auto custom-scrollbar space-y-2 pr-4">
                            {telemetry.map((log, i) => (
                                <div key={i} className="flex gap-4 animate-fade-in">
                                    <span className="opacity-20 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                                    <span className="text-indigo-400/80 leading-relaxed">{log}</span>
                                </div>
                            ))}
                            <div ref={logEndRef}></div>
                        </div>
                    </div>
                </div>

                {/* Audit Results */}
                <div className="lg:col-span-8 flex flex-col space-y-8">
                    <div className="flex-grow glass-panel rounded-[3.5rem] p-12 flex flex-col shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden min-h-[700px]">
                        <div className="absolute top-0 right-0 p-10 opacity-10">
                            <MaterialSymbol icon="search_insights" className="text-[120px]" />
                        </div>
                        
                        <div className="flex items-center justify-between mb-12 relative z-10">
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Audit Manifest</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Identified IP Assets & Tech Stacks</p>
                            </div>
                            <div className="px-6 py-3 bg-white/5 rounded-full border border-white/10 flex items-center gap-3">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{results.length} Matches Found</span>
                            </div>
                        </div>

                        <div className="flex-grow space-y-6 relative z-10 overflow-y-auto custom-scrollbar max-h-[500px] pr-6">
                            {results.length > 0 ? (
                                results.map((result, i) => (
                                    <div key={i} className="group p-8 bg-slate-950/60 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/30 transition-all duration-500 animate-pop-in">
                                        <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-4">
                                                    <span className="px-4 py-1.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                        {result.category.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-slate-500 font-mono text-[10px]">{result.file} : L{result.line_number}</span>
                                                </div>
                                                <h4 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">Target: "{result.keyword}"</h4>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Confidence: {Math.round(result.confidence * 100)}%</div>
                                                <div className="h-1.5 w-32 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${result.confidence * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-[#020617] p-6 rounded-2xl border border-white/5 font-mono text-[11px] text-indigo-300/60 overflow-x-hidden relative group-hover:text-indigo-300 transition-colors">
                                           <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-slate-950/80 to-transparent"></div>
                                           {result.line_text}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 space-y-10 py-20">
                                    <div className="w-48 h-48 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center animate-spin-slow">
                                        <MaterialSymbol icon="database" className="text-6xl" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h4 className="text-xl font-black uppercase tracking-widest">Awaiting Command</h4>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Initialize code ingestion to populate manifest</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NeuralSearch;
