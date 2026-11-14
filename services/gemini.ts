import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const createTCMChat = () => {
  return ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: `You are Master Wuji, a revered Grandmaster of Traditional Chinese Medicine (TCM) and Sovereign Biological Equilibrium Intelligence. 
      Your mission is to guide seekers to profound harmony using the classical TCM Scientific Method:
      
      1. Tier 1 - Observation (Wang, Wen, Wen, Qie):
         - Deeply analyze user symptoms, emotional patterns, tongue photos (body color, coating thickness, moisture, tooth marks), pulse feelings, and circadian sleep/wake cycles.
         - Reference the 12-Organ Horary Clock (Zi Wu Liu Zhu): Liver (1-3 AM), Lung (3-5 AM), Large Intestine (5-7 AM), Stomach (7-9 AM), Spleen (9-11 AM), Heart (11 AM-1 PM), Small Intestine (1-3 PM), Bladder (3-5 PM), Kidney (5-7 PM), Pericardium (7-9 PM), Triple Burner (7-9 PM), Gallbladder (11 PM-1 AM).
      
      2. Tier 2 - Understand & Syndrome Differentiation (Bian Zheng):
         - Identify the authentic TCM syndrome pattern (e.g., Liver Qi Stagnation, Spleen Qi Deficiency with Dampness, Kidney Yin Deficiency, Heart-Kidney Disharmony, Lung Wei-Qi Depletion).
         - Evaluate the Five Elements (Wu Xing: Wood, Fire, Earth, Metal, Water) and Yin-Yang thermal equilibrium.
         - Explain the root cause (Ben) versus the branch manifestations (Biao) with Daoist wisdom, poetic clarity, and physiological precision.
      
      3. Tier 3 - Act & Harmonic Intervention (Yao Shan & Regimen):
         - Prescribe therapeutic medicinal culinary food (Yao Shan) and herbal teas (e.g., Chrysanthemum, Goji, Poria, Astragalus, Jujube, Lily Bulb).
         - Prescribe classical acupressure points with exact anatomical locations (e.g., ST36 Zusanli, LV3 Taichong, LI4 Hegu, SP6 Sanyinjiao, KD3 Taixi, PC6 Neiguan).
         - Prescribe Qi Gong breathwork (e.g., Six Healing Sounds / Liu Zi Jue, Baduanjin, Dan Tian breathing).
      
      Tone: Serene, authoritative, compassionate, deeply knowledgeable in classical Chinese medical texts (Huangdi Neijing, Shanghan Lun).
      Always provide visual prompts for high-aesthetic botanical image and mindful movement video generation.`,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          data: {
            type: Type.OBJECT,
            properties: {
              syndrome: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  chineseName: { type: Type.STRING },
                  hypothesis: { type: Type.STRING },
                  primaryElement: { type: Type.STRING },
                  yinYangRatio: { type: Type.NUMBER },
                  organClock: { type: Type.STRING },
                  metrics: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        value: { type: Type.NUMBER },
                        sub: { type: Type.STRING },
                        trend: { type: Type.ARRAY, items: { type: Type.NUMBER } }
                      }
                    }
                  }
                }
              },
              regimen: {
                type: Type.OBJECT,
                properties: {
                  actions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        category: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        emoji: { type: Type.STRING }
                      }
                    }
                  }
                }
              },
              visualPrompts: {
                type: Type.OBJECT,
                properties: {
                  imagePrompt: { type: Type.STRING },
                  videoPrompt: { type: Type.STRING }
                }
              }
            }
          },
          sources: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                uri: { type: Type.STRING },
                title: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
};

let chat = createTCMChat();

export const getTCMResponse = async (text: string, imageUriOrBase64?: string, context?: any) => {
  try {
    let messageContent: any;

    if (imageUriOrBase64 && imageUriOrBase64.startsWith("data:")) {
      const match = imageUriOrBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const data = match[2];
        messageContent = [
          { text: `User Observation & Symptoms: ${text || "Please analyze this tongue/physical observation according to TCM inspection."}${context ? ` | Context: ${JSON.stringify(context)}` : ""}` },
          { inlineData: { mimeType, data } }
        ];
      } else {
        messageContent = `User Observation: ${text}`;
      }
    } else {
      messageContent = `User Observation: ${text}${context ? ` | Context: ${JSON.stringify(context)}` : ""}`;
    }

    const result = await chat.sendMessage(messageContent);
    const parsed = JSON.parse(result.text || "{}");
    return parsed;
  } catch (error) {
    console.error("Master Wuji TCM Chat Error:", error);
    // Reset chat on severe context disruption
    chat = createTCMChat();
    throw error;
  }
};

export const speakResponse = async (text: string) => {
  try {
    const cleanText = text.replace(/[*#_`\[\]]/g, '').slice(0, 300);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: `Say warmly, calmly and peacefully like a Traditional Chinese Medicine Master: ${cleanText}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audio.play();
    }
  } catch (e) {
    console.warn("Speech generation fallback:", e);
  }
};

export const generateHealthImage = async (prompt: string, settings?: { style?: string, mood?: string, elements?: string }) => {
  const stylePart = settings?.style ? ` in a ${settings.style} style` : " in an elegant Traditional Chinese Medicine herbal sanctuary style";
  const moodPart = settings?.mood ? ` with a ${settings.mood} mood` : " serene, harmonious, and restorative";
  const elementsPart = settings?.elements ? `. Featuring: ${settings.elements}` : "";

  const response = await ai.models.generateContent({
    model: 'imagen-3.0-generate-002',
    contents: {
      parts: [
        {
          text: `A museum-quality, luminous aesthetic photo of: ${prompt}${stylePart}${moodPart}${elementsPart}. Delicate lighting, porcelain tea cups, medicinal herbs, clean organic zen aesthetics, warm terracotta and crisp white accents.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      },
    },
  });
  
  const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
  return part ? `data:image/png;base64,${part.inlineData.data}` : null;
};

export const generateHealthVideo = async (prompt: string, settings?: { style?: string, mood?: string, elements?: string }) => {
  const stylePart = settings?.style ? ` in a ${settings.style} style` : " in a classical meditative TCM Qi Gong style";
  const moodPart = settings?.mood ? ` with a ${settings.mood} mood` : " tranquil and flowing";
  const elementsPart = settings?.elements ? `. Include: ${settings.elements}` : "";

  let operation = await ai.models.generateVideos({
    model: 'veo-2.0-generate-001',
    prompt: `Cinematic, slow-motion restorative video of: ${prompt}${stylePart}${moodPart}${elementsPart}. Peaceful tea steam rising, flowing Qi Gong movements, bamboo mist, warm ambient light, serene Zen atmosphere.`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 8000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const apiKey = process.env.API_KEY;
  const response = await fetch(downloadLink!, {
    method: 'GET',
    headers: {
      'x-goog-api-key': apiKey!,
    },
  });
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
