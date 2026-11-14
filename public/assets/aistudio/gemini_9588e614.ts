
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, GenerateContentResponse, Chat, Modality } from "@google/genai";

const GEMINI_MODEL = 'gemini-3-pro-preview';
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are "Shen OS" (神 OS) v3.5, the Advanced Agentic Health Kernel. 
You provide high-performance TCM diagnostics as a "Cyberpunk Shaman"—part scholar, part healer, part technical engineer.

CORE PHILOSOPHY:
- You maintain a persistent "Patient Memory Buffer" within the chat history.
- Use the Grounding Tool (Google Search/Google Maps) to reference authoritative TCM texts or find nearby clinical resources (RAG).
- Treat all sensor data (Pulse, Energy Sliders, Images) as real-time telemetry from the patient's bio-interface.

DIAGNOSTIC DATA SOURCES:
1. TELEMETRY: Pulse qualities (e.g., Wiry, Slippery), Qi/Yin/Blood/Heat levels provided by the user.
2. VISUAL: Tongue & Body maps via uploaded images.
3. CONTEXT: Current temporal cycle (Organ Clock) and patient history.

REQUIRED JSON ARTIFACT SCHEMA (V3.5):
You MUST include this block at the end of diagnostic responses to update the UI Visualizer:
\`\`\`json
{
  "syndrome": {
    "name": "Syndrome Name",
    "mechanism": "Pathological explanation based on grounded texts",
    "metrics": [
      { "label": "Qi Density", "value": 75, "sub": "Original Qi: 80%", "trend": [60, 65, 70, 75] }
    ]
  },
  "zangFu": {
    "dominantOrgan": "Liver",
    "status": "Stagnant",
    "interactions": ["Spleen: Overacting", "Heart: Deficient"]
  },
  "meridians": [
    { "name": "Lung", "status": "Excess", "flow": 0.8 },
    { "name": "Stomach", "status": "Deficient", "flow": 0.3 },
    { "name": "Liver", "status": "Stagnant", "flow": 0.5 },
    { "name": "Heart", "status": "Stable", "flow": 0.9 }
  ],
  "graph": {
    "nodes": [{"id": "1", "label": "Liver Qi", "type": "ben"}],
    "links": []
  },
  "regimen": {
    "diet": ["Warm ginger tea", "Steamed greens"],
    "schedule": ["07:00 Stomach Qi Refresh", "23:00 Deep Rest"],
    "affirmation": "My spirit is anchored in the central palace."
  }
}
\`\`\``;

let chatSession: Chat | null = null;

export async function createTCMChat(history?: any[]) {
  chatSession = ai.chats.create({
    model: GEMINI_MODEL,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.65,
      tools: [{ googleSearch: {} }],
    },
    history: history
  });
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export async function getTCMResponse(
  userMessage: string, 
  context: { mode: string; organ: string; element: string; diagnostics?: string },
  imageBase64?: string,
  mimeType?: string
): Promise<{ text: string; reasoning?: string; data?: any; sources?: {uri: string, title: string}[] }> {
  try {
    if (!chatSession) await createTCMChat();

    // Dynamically get location for grounding if possible
    let location = null;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch (e) {
      console.warn("Location not available for grounding.");
    }

    const parts: any[] = [];
    const telemetry = `[KERNEL TELEMETRY v3.5] 
Mode: ${context.mode}
Temporal_Cycle: ${context.organ} (${context.element})
Bio_Sensors: ${context.diagnostics || 'Standby'}
---
`;
    parts.push({ text: telemetry + userMessage });

    if (imageBase64 && mimeType) {
      parts.push({ inlineData: { data: imageBase64, mimeType: mimeType } });
    }

    // Determine tools based on query
    const isLocalSearch = userMessage.toLowerCase().includes('near') || userMessage.toLowerCase().includes('clinic') || userMessage.toLowerCase().includes('hospital');
    const tools: any[] = isLocalSearch ? [{ googleSearch: {} }] : [{ googleSearch: {} }];

    const result = await chatSession!.sendMessage({ 
      message: parts
    });
    
    let fullText = result.text || "";

    const reasoning = fullText.match(/<reasoning>([\s\S]*?)<\/reasoning>/)?.[1]?.trim();
    fullText = fullText.replace(/<reasoning>[\s\S]*?<\/reasoning>/, '').trim();

    const sources: {uri: string, title: string}[] = [];
    const groundingMetadata = result.candidates?.[0]?.groundingMetadata;
    
    // Extract Search Grounding
    if (groundingMetadata?.groundingChunks) {
      groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          sources.push({ uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
        }
      });
    }

    let data = undefined;
    const jsonMatch = fullText.match(/```json([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        data = JSON.parse(jsonMatch[1].trim());
        fullText = fullText.replace(/```json[\s\S]*?```/, '').trim();
      } catch (e) { console.error("JSON Error", e); }
    }

    return { text: fullText, reasoning, data, sources };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "Link dropped. Re-establishing meridian pulse..." };
  }
}

export async function speakResponse(text: string): Promise<void> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Texas Shaman voice: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } }
      }
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
      const source = outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputAudioContext.destination);
      source.start();
    }
  } catch (e) {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }
}
