import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

// Utility function to decode raw PCM audio data into an AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; // Normalize to -1.0 to 1.0
    }
  }
  return buffer;
}

/**
 * Converts text to speech using the Gemini API and plays the audio.
 * @param text The text to convert to speech.
 * @param voiceName The name of the voice to use (e.g., 'Kore', 'Charon').
 * @returns A Promise that resolves with the base64 encoded audio string when audio playback starts, or rejects on error.
 */
export async function convertTextToSpeech(text: string, voiceName: string): Promise<void> {
  if (!process.env.API_KEY) {
    throw new Error("La clave API no está configurada. Asegúrate de que process.env.API_KEY esté disponible.");
  }

  // Always create a new GoogleGenAI instance right before an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Mapeo de voces personalizadas a voces reales de la API
  // 'Mystery' se mapea a 'Charon' o 'Fenrir' para obtener ese tono grave masculino.
  // Usamos Charon por su tono profundo y autoritario.
  let apiVoiceName = voiceName;
  if (voiceName === 'Mystery') {
    apiVoiceName = 'Charon'; 
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: apiVoiceName }, 
          },
        },
      },
    });

    const base64EncodedAudioString =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64EncodedAudioString) {
      throw new Error("No se recibieron datos de audio de la API de Gemini.");
    }

    // Initialize AudioContext
    const outputAudioContext = new window.AudioContext({ sampleRate: 24000 });

    // Utility function to decode base64 string to Uint8Array
    function decodeBase64(base64: string): Uint8Array {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }

    const audioBuffer = await decodeAudioData(
      decodeBase64(base64EncodedAudioString),
      outputAudioContext,
      24000, 
      1, 
    );

    const source = outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputAudioContext.destination);
    source.start();

    return new Promise<void>((resolve) => {
      source.onended = () => resolve();
    });

  } catch (error) {
    console.error("Error al convertir texto a voz:", error);
    throw new Error(`Error al generar o reproducir audio: ${(error as Error).message}`);
  }
}