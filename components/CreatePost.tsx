import React, { useState, useEffect, useRef } from 'react';
import type { Post, ScheduleOptions } from '../types';
import { PostType, GenerationStatus } from '../types';
import { generateText, generateImage, generateVideo, checkVideoStatus } from '../services/geminiService';
import { PostPreview } from './PostPreview';
import { Scheduler } from './Scheduler';
import { Icon } from './Icon';
import { Spinner } from './Spinner';
import { ConnectOverlay } from './ConnectOverlay';

interface CreatePostProps {
  onPostNow: (post: Post) => void;
  onSchedulePost: (post: Post, schedule: ScheduleOptions) => void;
  isFacebookLinked: boolean;
}

const videoLoadingMessages = [
  "Iniciando el motor de renderizado...",
  "Compilando los píxeles en una obra maestra...",
  "Dando los toques finales a tu video...",
  "El video está casi listo para deslumbrar...",
  "Ajustando la cinematografía...",
  "Generando fotogramas de alta calidad..."
];

const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};


export const CreatePost: React.FC<CreatePostProps> = ({ onPostNow, onSchedulePost, isFacebookLinked }) => {
  const [text, setText] = useState('');
  const [media, setMedia] = useState<{ type: PostType.IMAGE | PostType.VIDEO; url: string } | undefined>(undefined);
  const [prompt, setPrompt] = useState('');
  
  const [textGenStatus, setTextGenStatus] = useState(GenerationStatus.IDLE);
  const [imageGenStatus, setImageGenStatus] = useState(GenerationStatus.IDLE);
  const [videoGenStatus, setVideoGenStatus] = useState(GenerationStatus.IDLE);
  const [videoLoadingMessage, setVideoLoadingMessage] = useState(videoLoadingMessages[0]);
  const [videoGenElapsedTime, setVideoGenElapsedTime] = useState(0);

  
  const videoPollInterval = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (videoPollInterval.current) {
        clearInterval(videoPollInterval.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);
  
  const handleGenerateText = async () => {
    if (!prompt) return;
    setTextGenStatus(GenerationStatus.LOADING);
    try {
      const generated = await generateText(prompt);
      setText(generated);
      setTextGenStatus(GenerationStatus.SUCCESS);
    } catch (e) {
      setTextGenStatus(GenerationStatus.ERROR);
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt) return;
    setImageGenStatus(GenerationStatus.LOADING);
    setMedia(undefined);
    try {
      const imageUrl = await generateImage(prompt);
      setMedia({ type: PostType.IMAGE, url: imageUrl });
      setImageGenStatus(GenerationStatus.SUCCESS);
    } catch (e) {
      setImageGenStatus(GenerationStatus.ERROR);
    }
  };

  const handleGenerateVideo = async () => {
    if (!prompt) return;
    setVideoGenStatus(GenerationStatus.LOADING);
    setMedia(undefined);
    setVideoGenElapsedTime(0);

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = window.setInterval(() => {
        setVideoGenElapsedTime(prev => prev + 1);
    }, 1000);


    const messageInterval = setInterval(() => {
      setVideoLoadingMessage(videoLoadingMessages[Math.floor(Math.random() * videoLoadingMessages.length)]);
    }, 3000);

    try {
      const { operationName } = await generateVideo(prompt);
      
      videoPollInterval.current = window.setInterval(async () => {
        try {
          const status = await checkVideoStatus(operationName);
          if (status.done && status.url) {
            if(videoPollInterval.current) clearInterval(videoPollInterval.current);
            if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            clearInterval(messageInterval);
            setMedia({ type: PostType.VIDEO, url: status.url });
            setVideoGenStatus(GenerationStatus.SUCCESS);
          }
        } catch (pollError) {
          console.error("Error en sondeo de video:", pollError);
          if(videoPollInterval.current) clearInterval(videoPollInterval.current);
          if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          clearInterval(messageInterval);
          setVideoGenStatus(GenerationStatus.ERROR);
        }
      }, 10000);

    } catch (e) {
      clearInterval(messageInterval);
      if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setVideoGenStatus(GenerationStatus.ERROR);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('image/') ? PostType.IMAGE : PostType.VIDEO;
      setMedia({ type, url });
    }
  };

  const clearPost = () => {
    setText('');
    setMedia(undefined);
    setPrompt('');
    setTextGenStatus(GenerationStatus.IDLE);
    setImageGenStatus(GenerationStatus.IDLE);
    setVideoGenStatus(GenerationStatus.IDLE);
    setVideoGenElapsedTime(0);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (videoPollInterval.current) clearInterval(videoPollInterval.current);
  };
  
  const isPostEmpty = !text.trim() && !media;
  
  const post: Post = { text, media };

  return (
    <div className="relative">
      {!isFacebookLinked && <ConnectOverlay />}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-gray-800 rounded-lg shadow-xl p-6 space-y-6 h-fit">
          {/* IA Prompt Input */}
          <div className="space-y-2">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300">
              1. Describe tu idea para la IA
            </label>
            <div className="relative">
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ej: 'Una oferta de verano para helados artesanales'"
                className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-white focus:ring-2 focus:ring-blue-500 transition duration-200"
                rows={2}
              />
            </div>
          </div>
          
          {/* AI Generation Buttons */}
          <div className="space-y-2">
            <p className="block text-sm font-medium text-gray-300">
              2. Genera el contenido
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={handleGenerateText} disabled={!prompt || textGenStatus === GenerationStatus.LOADING} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition duration-200">
                {textGenStatus === GenerationStatus.LOADING ? <Spinner/> : <Icon name="text" />} Texto
              </button>
              <button onClick={handleGenerateImage} disabled={!prompt || imageGenStatus === GenerationStatus.LOADING || videoGenStatus === GenerationStatus.LOADING} className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition duration-200">
                {imageGenStatus === GenerationStatus.LOADING ? <Spinner/> : <Icon name="image" />} Imagen
              </button>
              <button onClick={handleGenerateVideo} disabled={!prompt || videoGenStatus === GenerationStatus.LOADING || imageGenStatus === GenerationStatus.LOADING} className="flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition duration-200">
                {videoGenStatus === GenerationStatus.LOADING ? <Spinner/> : <Icon name="video" />} Video
              </button>
            </div>
          </div>

          {videoGenStatus === GenerationStatus.LOADING && (
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                  <div className="flex justify-center items-center gap-4 mb-2">
                    <p className="text-teal-300 animate-pulse">{videoLoadingMessage}</p>
                    <span className="text-sm font-mono bg-gray-900 text-white py-1 px-2 rounded">{formatTime(videoGenElapsedTime)}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">La generación de video puede tardar varios minutos.</p>
              </div>
          )}

          {/* Post Content Area */}
          <div className="space-y-2">
            <p className="block text-sm font-medium text-gray-300">
              3. Revisa y edita tu publicación
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe tu publicación aquí o genera el texto con IA..."
              className="w-full h-32 bg-gray-900 border border-gray-700 rounded-md p-3 text-white focus:ring-2 focus:ring-blue-500 transition duration-200"
            />
            <div className="flex justify-between items-center text-sm text-gray-400">
              <label htmlFor="file-upload" className="cursor-pointer text-blue-400 hover:text-blue-300 font-medium flex items-center gap-2">
                  <Icon name="upload" /> Subir archivo
                </label>
              <input id="file-upload" type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
              <button onClick={clearPost} className="text-red-400 hover:text-red-300 font-medium flex items-center gap-2">
                  <Icon name="trash" /> Limpiar
              </button>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          {/* Post Preview */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold mb-3 text-white">Vista Previa</h3>
            <PostPreview post={post} />
          </div>

          {/* Scheduler and Actions */}
          <Scheduler
            onPostNow={() => onPostNow(post)}
            onSchedulePost={(schedule) => onSchedulePost(post, schedule)}
            disabled={isPostEmpty}
            isFacebookLinked={isFacebookLinked}
          />
        </div>
      </div>
    </div>
  );
};