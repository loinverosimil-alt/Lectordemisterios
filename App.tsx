import React, { useState, useCallback, useRef, useEffect } from 'react';
import { convertTextToSpeech } from './services/geminiService';


// Nuevo componente para la barra de progreso del OVNI
const UfoProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
  const ufoSize = 24; // Tamaño aproximado del emoji de platillo volador en píxeles
  return (
    <div className="relative w-full h-10 bg-indigo-950 rounded-full mt-4 overflow-hidden border-2 border-cyan-700 shadow-inner shadow-indigo-700/50">
      {/* Fondo lleno que simula la energía o un haz de luz */}
      <div
        className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      ></div>
      {/* Icono del OVNI */}
      <div
        className="absolute top-1/2 -translate-y-1/2 transform transition-all duration-300 ease-out text-2xl z-10"
        style={{ left: `calc(${progress}% - ${ufoSize / 2}px)` }}
      >
        <span role="img" aria-label="Platillo volador" className="block animate-pulse">🛸</span>
      </div>
      {/* Texto del porcentaje */}
      <span className="absolute inset-0 flex items-center justify-center text-base font-['Orbitron',_sans-serif] font-semibold text-gray-100 z-20"
            style={{ textShadow: '0 0 5px rgba(0,0,0,0.7)' }}>
        {progress}%
      </span>
    </div>
  );
};


// Spinner de carga con colores temáticos de OVNI
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center space-x-2 animate-pulse-fast mt-4">
    <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce delay-0"></div>
    <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce delay-150"></div>
    <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce delay-300"></div>
  </div>
);

const App: React.FC = () => {
  const [text, setText] = useState<string>(`La noche era oscura, más oscura que de costumbre, cuando una luz anómala rasgó el cielo sobre el rancho de los Miller. No era un avión, ni una estrella fugaz. Era un objeto metálico, silencioso y con luces pulsantes que desafiaba toda lógica conocida. El ganado se agitó violentamente, y un zumbido de baja frecuencia comenzó a resonar, no en el aire, sino en la cabeza de cada ser vivo. El contacto había comenzado, y la Tierra nunca volvería a ser la misma.`);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  // Se añaden las nuevas voces al tipo de estado
  const [selectedVoice, setSelectedVoice] = useState<'Kore' | 'Charon' | 'Fenrir' | 'Puck' | 'Zephyr' | 'Mystery'>('Kore');
  const [progress, setProgress] = useState<number>(0);
  const progressIntervalRef = useRef<number | null>(null);


  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (error && (error.includes("Fallo al transmitir el mensaje") || error.includes("Error de inicialización"))) {
      // Clear error only if it's related to text-to-speech or initialisation, not MP3 export
      setError(null);
    }
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVoice(e.target.value as 'Kore' | 'Charon' | 'Fenrir' | 'Puck' | 'Zephyr' | 'Mystery');
    if (error) setError(null);
  };

  const readTextAloud = useCallback(async () => {
    if (!text.trim() || isLoading || isAudioPlaying) return;

    setIsLoading(true);
    setError(null);
    setProgress(0);

    let currentProgress = 0;
    progressIntervalRef.current = window.setInterval(() => {
      currentProgress = Math.min(90, currentProgress + 5);
      setProgress(currentProgress);
    }, 300);

    try {
      await convertTextToSpeech(text, selectedVoice);
      setProgress(100); // Completa el progreso al 100% instantáneamente al iniciar la reproducción
      setIsAudioPlaying(true);
    } catch (err) {
      console.error(err);
      setError(`Fallo al transmitir el mensaje: ${(err as Error).message}`);
      setProgress(0);
    } finally {
      setIsLoading(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  }, [text, selectedVoice, isLoading, isAudioPlaying]);

  const triggerReadTextAloud = async () => {
    setIsAudioPlaying(true); // Se establece `true` al iniciar la generación/reproducción
    try {
      await readTextAloud();
    } finally {
      // Este bloque se ejecuta una vez que la promesa de `readTextAloud` (y, por ende, la de `convertTextToSpeech`) se resuelve
      // (ya sea porque el audio terminó o hubo un error).
      setIsAudioPlaying(false); // Se establece `false` cuando el audio ha terminado o ha fallado
      setProgress(0); // Reinicia la barra de progreso
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-950 to-purple-950 text-gray-50 relative overflow-hidden">
      {/* Starfield Background */}
      <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>

      {/* Scanlines Overlay */}
      <div className="scanlines-overlay absolute inset-0 z-10 pointer-events-none backdrop-filter blur-[1px]"></div>

      <div className="w-full max-w-3xl relative z-20 bg-gray-900 border-4 border-cyan-700 rounded-2xl shadow-2xl shadow-cyan-500/40 p-10 mt-8 mb-8">
        {/* Hardware Remaches/Detalles */}
        <div className="absolute top-4 left-4 w-4 h-4 bg-gray-700 border border-gray-600 rounded-full"></div>
        <div className="absolute top-4 right-4 w-4 h-4 bg-gray-700 border border-gray-600 rounded-full"></div>
        <div className="absolute bottom-4 left-4 w-4 h-4 bg-gray-700 border border-gray-600 rounded-full"></div>
        <div className="absolute bottom-4 right-4 w-4 h-4 bg-gray-700 border border-gray-600 rounded-full"></div>

        {/* Pantalla de Encabezado (Main Display Unit) */}
        <div className="bg-slate-900/80 p-6 rounded-lg border-b-4 border-cyan-900 shadow-inner shadow-cyan-950/50 mb-10 relative">
          {/* Indicador de estado de sistema */}
          <div className="absolute top-3 right-3 w-3 h-3 bg-green-500 rounded-full animate-pulse-slow shadow-lg shadow-green-500/70"></div>
          <h1 className="text-5xl md:text-6xl font-['Orbitron',_sans-serif] uppercase tracking-wider text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.9)] text-center">
            Lector de Misterios
          </h1>
          <p className="text-gray-400 font-mono text-center leading-relaxed text-lg mt-4">
            ¡Ingresa tu relato más allá de las estrellas y deja que Gemini lo narre con una voz de otro mundo!
          </p>
        </div>

        {/* Módulo de Control de Voz (Voice Control Module) */}
        <div className="bg-gray-800 p-6 rounded-lg border-2 border-indigo-900 shadow-inner shadow-indigo-950/50 mb-8 relative transition-all duration-200 hover:border-green-500 hover:shadow-green-900/50 cursor-pointer">
          <span className="absolute top-[-10px] left-4 bg-gray-800 px-2 text-xs font-mono text-indigo-400 uppercase">Módulo de Voz</span>
          <label htmlFor="voice-select" className="block font-bold uppercase text-cyan-300 tracking-wide text-lg mb-3">
            Seleccionar Frecuencia de Voz:
          </label>
          <select
            id="voice-select"
            className="w-full p-3 rounded-md bg-gray-700 text-gray-100 border-2 border-indigo-600 focus:border-green-400 focus:ring-green-400 font-['Orbitron',_sans-serif] text-base appearance-none outline-none cursor-pointer bg-no-repeat bg-right-center pr-10"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0_0_24_24' stroke='%2360A5FA'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19_9l-7_7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1.5em' }}
            value={selectedVoice}
            onChange={handleVoiceChange}
            disabled={isLoading || isAudioPlaying}
            aria-label="Seleccionar frecuencia de voz para la narración"
          >
            <option value="Kore">Kore (Ecos Cósmicos)</option>
            <option value="Charon">Charon (Transmisión Alienígena)</option>
            <option value="Fenrir">Fenrir (Guardián del Abismo)</option>
            <option value="Puck">Puck (Susurro Espectral)</option>
            <option value="Zephyr">Zephyr (Bitácora del Abducido)</option>
            <option value="Mystery">Voz Misteriosa (Grave y Oculta)</option>
          </select>
        </div>

        {/* Módulo de Transcripción/Entrada (Transcript Log Module) */}
        <div className="bg-gray-800 p-6 rounded-lg border-2 border-indigo-900 shadow-inner shadow-indigo-950/50 mb-8 relative">
          <span className="absolute top-[-10px] left-4 bg-gray-800 px-2 text-xs font-mono text-indigo-400 uppercase">Registro de Transcripción</span>
          <label htmlFor="text-input" className="block font-bold uppercase text-cyan-300 tracking-wide text-lg mb-3">
            Introducir Mensaje:
          </label>
          <textarea
            id="text-input"
            className="w-full h-64 p-4 rounded-md bg-gray-700 text-gray-100 placeholder-gray-400 border-2 border-indigo-600 focus:border-green-400 focus:ring-green-400 font-mono text-lg resize-y outline-none"
            placeholder="Relata tu experiencia con el más allá..."
            value={text}
            onChange={handleTextChange}
            disabled={isLoading || isAudioPlaying}
            aria-label="Introducir texto para la narración"
          ></textarea>
        </div>

        {error && (
          <p className="font-mono text-red-500 text-center uppercase mt-4 text-sm">
            ¡ALERTA CRÍTICA DEL SISTEMA! {error}
          </p>
        )}

        {/* Panel de Comandos y Estado (Operation Controls) */}
        <div className="bg-gray-900 p-6 rounded-lg border-2 border-red-800 shadow-inner shadow-red-950/50 mt-8 relative">
          <span className="absolute top-[-10px] left-4 bg-gray-900 px-2 text-xs font-mono text-red-400 uppercase">Panel de Operaciones</span>
          <button
            onClick={triggerReadTextAloud}
            className={`w-full py-4 px-8 rounded-xl text-2xl font-bold transition-all duration-300
            font-['Orbitron',_sans-serif] uppercase tracking-widest
            ${(!text.trim() || isLoading || isAudioPlaying)
              ? 'bg-gray-800 text-gray-600 border-gray-700 shadow-inner shadow-gray-950/50 cursor-not-allowed' // Deshabilitado
              : 'bg-gradient-to-br from-green-700 to-green-900 text-white border-green-400 shadow-lg shadow-green-500/50 hover:from-green-600 hover:to-green-800 hover:shadow-xl hover:shadow-green-400/60 active:from-green-800 active:to-green-700 active:shadow-inner active:shadow-green-900/50 active:scale-98' // Listo
            }
            ${isLoading && 'bg-gradient-to-br from-indigo-800 to-indigo-950 text-indigo-300 border-indigo-700 shadow-lg shadow-indigo-500/30 animate-pulse-slow'}
            ${isAudioPlaying && !isLoading && 'bg-gradient-to-br from-blue-700 to-blue-900 text-white border-blue-400 shadow-lg shadow-blue-500/50 animate-pulse-fast'}`}
            disabled={isLoading || isAudioPlaying || !text.trim()}
          >
            {isLoading ? 'GENERANDO ONDA GRAVITACIONAL...' : (isAudioPlaying ? 'TRANSMITIENDO MENSAJE...' : 'ACTIVAR MÓDULO DE NARRACIÓN')}
          </button>

          {(isLoading || isAudioPlaying) && (
            <>
              <UfoProgressBar progress={progress} />
              <LoadingSpinner />
            </>
          )}
        </div>
      </div>
      <style jsx>{`
        .scanlines-overlay {
          background-image: repeating-linear-gradient(
            rgba(0, 0, 0, 0.1) 0,
            rgba(0, 0, 0, 0.1) 1px,
            transparent 1px,
            transparent 2px
          );
          background-size: 100% 2px;
          animation: scanlines-fade 10s infinite alternate;
        }

        @keyframes scanlines-fade {
          0% { opacity: 0.1; }
          50% { opacity: 0.2; }
          100% { opacity: 0.1; }
        }

        @keyframes pulse-slow {
          0%, 100% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.7); }
          50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.9), 0 0 30px rgba(99, 102, 241, 0.5); }
        }

        @keyframes pulse-fast {
          0%, 100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.7); }
          50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.9), 0 0 30px rgba(59, 130, 246, 0.5); }
        }
      `}</style>
    </div>
  );
};

export default App;