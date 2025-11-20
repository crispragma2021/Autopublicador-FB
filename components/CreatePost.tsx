
import React, { useState, useEffect, useRef } from 'react';
import type { Post, ScheduleOptions, FacebookTarget, MediaItem, Placements, ToneType, Targeting, ScheduledPost } from '../types';
import { PostType, GenerationStatus, ScheduleType, FREE_PLAN_LIMITS } from '../types';
import { generateText, generateImage, generateVideo, checkVideoStatus } from '../services/geminiService';
import { checkLimitReached, incrementUsage, getRemainingCredits, getUsagePercentage } from '../services/usageService';
import { PostPreview } from './PostPreview';
import { Scheduler } from './Scheduler';
import { Icon } from './Icon';
import { Spinner } from './Spinner';
import { ConnectOverlay } from './ConnectOverlay';
import { SubscriptionModal } from './SubscriptionModal';

interface CreatePostProps {
  onPostNow: (post: Post, targets: FacebookTarget[]) => void;
  onSchedulePost: (post: Post, schedule: ScheduleOptions, targets: FacebookTarget[]) => void;
  isFacebookLinked: boolean;
  availableTargets: FacebookTarget[];
  initialPost?: ScheduledPost | null; // Prop para editar
}

interface GeneratedItem {
    id: string;
    type: 'text' | 'image' | 'video';
    content: string; // Texto o URL
    prompt: string;
    timestamp: Date;
}

type PendingAction = 
    | { type: 'POST_NOW'; post: Post; targets: FacebookTarget[] }
    | { type: 'SCHEDULE'; post: Post; schedule: ScheduleOptions; targets: FacebookTarget[] }
    | null;

const videoLoadingMessages = [
  "🎬 Iniciando motor de IA...",
  "🎨 Diseñando escenas...",
  "⚡ Renderizando fotogramas...",
  "✨ Aplicando efectos de luz...",
  "🚀 Finalizando tu video viral..."
];

const examplePrompts = [
  "Una imagen impresionante de viajes de aventura y ecoturismo en la naturaleza",
  "Un video cautivador sobre tendencias de moda sostenible",
  "5 consejos esenciales para mejorar la productividad trabajando desde casa",
  "Una receta deliciosa y saludable para una cena rápida de verano",
  "Reseña de los mejores gadgets tecnológicos para viajeros este año",
  "Rutina de ejercicios matutina para empezar el día con energía"
];

const HASHTAG_SETS = {
    'Negocios': '#emprendimiento #negocios #marketing #exito #ventas',
    'Tecnología': '#tecnologia #innovacion #tech #futuro #gadgets',
    'Lifestyle': '#lifestyle #vida #inspiracion #momentos #feliz',
    'Comida': '#foodie #delicioso #recetas #cocina #gourmet',
    'Viajes': '#viajes #turismo #aventura #travel #vacaciones'
};

const TONES: ToneType[] = ['Profesional', 'Divertido', 'Urgente', 'Empático', 'Lujo', 'Inspirador'];
const MAX_TARGETS = 5; // Límite de destinos

const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

const TUTORIAL_STEPS = [
    {
        id: 'step-editor',
        title: '1. Editor Principal',
        content: 'Escribe tu idea aquí. Usa los iconos de abajo para generar contenido con IA específicamente.',
        targetId: 'tutorial-editor-section'
    },
    {
        id: 'step-media',
        title: '2. Multimedia',
        content: 'Sube tus propias fotos/videos o pega enlaces aquí. Puedes arrastrar las imágenes para reordenarlas.',
        targetId: 'tutorial-media-section'
    },
    {
        id: 'step-targets',
        title: '3. Destinos',
        content: `Selecciona las páginas y grupos donde se publicará. (Máximo ${MAX_TARGETS} destinos simultáneos para evitar spam).`,
        targetId: 'tutorial-targets-section'
    },
    {
        id: 'step-schedule',
        title: '4. Configurar y Publicar',
        content: 'Haz clic en los botones "Publicar" o "Programar" en la parte superior derecha para finalizar.',
        targetId: 'header-actions'
    }
];

const toBoldUnicode = (str: string) => {
    const map: {[key: string]: string} = {
        'A':'𝗔','B':'𝗕','C':'𝗖','D':'𝗗','E':'𝗘','F':'𝗙','G':'𝗚','H':'𝗛','I':'𝗜','J':'𝗝','K':'𝗞','L':'𝗟','M':'𝗠','N':'𝗡','O':'𝗢','P':'𝗣','Q':'𝗤','R':'𝗥','S':'𝗦','T':'𝗧','U':'𝗨','V':'𝗩','W':'𝗪','X':'𝗫','Y':'𝗬','Z':'𝗭',
        'a':'𝗮','b':'𝗯','c':'𝗰','d':'𝗱','e':'𝗲','f':'𝗳','g':'𝗴','h':'𝗵','i':'𝗶','j':'𝗷','k':'𝗸','l':'𝗹','m':'𝗺','n':'𝗻','o':'𝗼','p':'𝗽','q':'𝗾','r':'𝗿','s':'𝘀','t':'𝘁','u':'𝘂','v':'𝘃','w':'𝘄','x':'𝗘','y':'𝘆','z':'𝘇',
        '0':'𝟬','1':'𝟭','2':'𝟮','3':'𝟯','4':'𝟰','5':'𝟱','6':'𝟲','7':'𝟳','8':'𝟴','9':'𝟵'
    };
    return str.split('').map(c => map[c] || c).join('');
};

const toItalicUnicode = (str: string) => {
    const map: {[key: string]: string} = {
        'A':'𝘈','B':'𝘉','C':'𝘊','D':'𝘋','E':'𝘌','F':'𝘍','G':'𝘎','H':'𝘏','I':'𝘐','J':'𝘑','K':'𝘒','L':'𝘓','M':'𝘔','N':'𝘕','O':'𝘖','P':'𝘗','Q':'𝘘','R':'𝘙','S':'𝘚','T':'𝘛','U':'𝘜','V':'𝘝','W':'𝘞','X':'𝘟','Y':'𝘠','Z':'𝘡',
        'a':'𝘢','b':'𝘣','c':'𝘤','d':'𝘥','e':'𝗲','f':'𝘧','g':'𝗴','h':'𝘩','i':'𝘪','j':'𝘫','k':'𝘬','l':'𝘭','m':'𝘮','n':'𝘯','o':'𝘰','p':'𝘱','q':'𝗲','r':'𝘳','s':'𝘴','t':'𝘵','u':'𝘂','v':'𝘷','w':'𝘸','x':'𝘹','y':'𝘺','z':'𝘻'
    };
    return str.split('').map(c => map[c] || c).join('');
};

export const CreatePost: React.FC<CreatePostProps> = ({ onPostNow, onSchedulePost, isFacebookLinked, availableTargets, initialPost }) => {
  const [text, setText] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const [placements, setPlacements] = useState<Placements>({ facebook: true, instagram: false });
  
  // Targeting & Tone State
  const [targeting, setTargeting] = useState<Targeting>({ ageMin: 18, ageMax: 65, locations: '', interests: '' });
  const [selectedTone, setSelectedTone] = useState<ToneType>('Profesional');
  const [isTargetingExpanded, setIsTargetingExpanded] = useState(false);

  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [targetSearchQuery, setTargetSearchQuery] = useState('');
  const [isTargetsExpanded, setIsTargetsExpanded] = useState(true);
  
  const [textGenStatus, setTextGenStatus] = useState(GenerationStatus.IDLE);
  const [imageGenStatus, setImageGenStatus] = useState(GenerationStatus.IDLE);
  const [videoGenStatus, setVideoGenStatus] = useState(GenerationStatus.IDLE);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [videoLoadingMessage, setVideoLoadingMessage] = useState(videoLoadingMessages[0]);
  const [videoGenElapsedTime, setVideoGenElapsedTime] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  
  const [manualUrl, setManualUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);

  const [generationHistory, setGenerationHistory] = useState<GeneratedItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const [credits, setCredits] = useState(getRemainingCredits());
  const [showUpsellModal, setShowUpsellModal] = useState(false);

  const [showHashtags, setShowHashtags] = useState(false);

  const [tutorialStep, setTutorialStep] = useState(0);
  const [isTutorialActive, setIsTutorialActive] = useState(false);

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const [isSchedulerModalOpen, setIsSchedulerModalOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const videoPollInterval = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  // LOAD INITIAL POST FOR EDITING
  useEffect(() => {
    if (initialPost) {
        setText(initialPost.post.text);
        setMediaList(initialPost.post.media);
        if (initialPost.post.placements) setPlacements(initialPost.post.placements);
        if (initialPost.post.targeting) setTargeting(initialPost.post.targeting);
        if (initialPost.post.tone) setSelectedTone(initialPost.post.tone);
        
        // Cargar destinos seleccionados
        const targetIds = initialPost.targets.map(t => t.id);
        setSelectedTargetIds(targetIds);
        
        // Scroll arriba para editar
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [initialPost]);

  useEffect(() => {
      const hasSeenTutorial = localStorage.getItem('hasSeenCreateTutorial');
      if (!hasSeenTutorial && isFacebookLinked && !initialPost) {
          setTimeout(() => setIsTutorialActive(true), 500);
      }
  }, [isFacebookLinked, initialPost]);

  useEffect(() => {
      if (isTutorialActive) {
          const currentStepObj = TUTORIAL_STEPS[tutorialStep];
          if (currentStepObj.id === 'step-targets') {
              setIsTargetsExpanded(true);
          }
          const element = document.getElementById(currentStepObj.targetId);
          if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }
  }, [tutorialStep, isTutorialActive]);

  const handleNextStep = () => {
      if (tutorialStep < TUTORIAL_STEPS.length - 1) {
          setTutorialStep(prev => prev + 1);
      } else {
          finishTutorial();
      }
  };

  const handlePrevStep = () => {
      if (tutorialStep > 0) {
          setTutorialStep(prev => prev - 1);
      }
  };

  const finishTutorial = () => {
      setIsTutorialActive(false);
      localStorage.setItem('hasSeenCreateTutorial', 'true');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
      if (availableTargets.length > 0 && selectedTargetIds.length === 0 && !initialPost) {
          const page = availableTargets.find(t => t.type === 'PAGE');
          if (page) setSelectedTargetIds([page.id]);
      }
  }, [availableTargets, initialPost]);

  useEffect(() => {
      setCredits(getRemainingCredits());
      const handleFocus = () => setCredits(getRemainingCredits());
      window.addEventListener('focus', handleFocus);
      return () => {
        if (videoPollInterval.current) window.clearInterval(videoPollInterval.current);
        if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
        window.removeEventListener('focus', handleFocus);
      };
  }, []);

  useEffect(() => {
      if ((text.trim() || mediaList.length > 0) && generationError && generationError.includes("vacía")) {
          setGenerationError(null);
      }
      if (selectedTargetIds.length > 0 && generationError && generationError.includes("destino")) {
          setGenerationError(null);
      }
  }, [text, mediaList, generationError, selectedTargetIds]);
  
  const handleExamplePrompt = () => {
      const randomPrompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
      setText(randomPrompt);
  };

  const handleToggleTarget = (id: string) => {
      setSelectedTargetIds(prev => {
          if (prev.includes(id)) {
              return prev.filter(tid => tid !== id);
          } else {
              if (prev.length >= MAX_TARGETS) {
                  setGenerationError(`⚠️ Solo puedes seleccionar hasta ${MAX_TARGETS} destinos a la vez para evitar spam.`);
                  // Auto-clear error after 3s
                  setTimeout(() => setGenerationError(null), 3000);
                  return prev;
              }
              return [...prev, id];
          }
      });
  };

  const handleFormat = (type: 'bold' | 'italic' | 'list') => {
      if (!textAreaRef.current) return;
      
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      const selectedText = text.substring(start, end);
      
      let newText = text;
      let newCursorPos = end;

      if (type === 'list') {
          const prefix = "• ";
          newText = text.substring(0, start) + prefix + text.substring(start);
          newCursorPos = start + prefix.length;
      } else if (selectedText) {
          let formattedText = selectedText;
          if (type === 'bold') formattedText = toBoldUnicode(selectedText);
          if (type === 'italic') formattedText = toItalicUnicode(selectedText);
          
          newText = text.substring(0, start) + formattedText + text.substring(end);
          newCursorPos = start + formattedText.length;
      }

      setText(newText);
      
      setTimeout(() => {
          if (textAreaRef.current) {
              textAreaRef.current.focus();
              textAreaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
      }, 0);
  };

  const addToHistory = (type: 'text' | 'image' | 'video', content: string, promptVal: string) => {
      const newItem: GeneratedItem = {
          id: Date.now().toString() + Math.random().toString(),
          type,
          content,
          prompt: promptVal,
          timestamp: new Date()
      };
      setGenerationHistory(prev => [newItem, ...prev].slice(0, 10));
      setShowHistory(true);
  };

  const restoreFromHistory = (item: GeneratedItem) => {
      if (item.type === 'text') {
          setText(item.content);
      } else {
          if (item.type === 'video') {
            setMediaList([{
                id: Date.now().toString(),
                type: PostType.VIDEO,
                url: item.content
            }]);
          } else {
            setMediaList(prev => {
                const hasVideo = prev.some(m => m.type === PostType.VIDEO);
                if (hasVideo) return [{ id: Date.now().toString(), type: PostType.IMAGE, url: item.content }];
                
                return [...prev, {
                    id: Date.now().toString(),
                    type: PostType.IMAGE,
                    url: item.content
                }];
            });
          }
          setManualUrl(''); 
          setUrlError(null);
      }
  };

  const clearHistory = () => {
      setGenerationHistory([]);
      setShowHistory(false);
  };

  const checkCreditsAndRun = async (type: 'text' | 'image' | 'video', action: () => Promise<void>) => {
      if (checkLimitReached(type)) {
          setGenerationError(`⚠️ Has alcanzado tu límite diario de ${type === 'text' ? 'textos' : type === 'image' ? 'imágenes' : 'videos'} gratuitos.`);
          setShowUpsellModal(true);
          return;
      }
      await action();
      incrementUsage(type);
      setCredits(getRemainingCredits());
  };

  const handleGenerateText = async () => {
    if (!text.trim()) {
        setGenerationError("Escribe una idea en el editor primero.");
        return;
    }
    await checkCreditsAndRun('text', async () => {
        setTextGenStatus(GenerationStatus.LOADING);
        setGenerationError(null);
        try {
          // Pasamos el tono seleccionado al servicio
          const generated = await generateText(text, selectedTone);
          setText(generated); 
          setTextGenStatus(GenerationStatus.SUCCESS);
          addToHistory('text', generated, text); 
        } catch (e: any) {
          setTextGenStatus(GenerationStatus.ERROR);
          setGenerationError(e.message || "Error generando texto.");
        }
    });
  };

  const handleGenerateImage = async () => {
    if (!text.trim()) {
        setGenerationError("Escribe una idea en el editor para generar la imagen.");
        return;
    }
    
    const hasVideo = mediaList.some(m => m.type === PostType.VIDEO);
    if (hasVideo) setMediaList([]);

    await checkCreditsAndRun('image', async () => {
        setVideoGenStatus(GenerationStatus.IDLE);
        if (videoPollInterval.current) window.clearInterval(videoPollInterval.current);
        if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
        
        setImageGenStatus(GenerationStatus.LOADING);
        setGenerationError(null);
        setManualUrl('');

        try {
          const imageUrl = await generateImage(text); 
          setMediaList(prev => [...prev, { id: Date.now().toString(), type: PostType.IMAGE, url: imageUrl }]);
          setImageGenStatus(GenerationStatus.SUCCESS);
          addToHistory('image', imageUrl, text);
        } catch (e: any) {
          setImageGenStatus(GenerationStatus.ERROR);
          setGenerationError(e.message || "Error generando imagen.");
        }
    });
  };

  const handleGenerateVideo = async () => {
    if (!text.trim()) {
        setGenerationError("Escribe una idea en el editor para generar el video.");
        return;
    }
    
    setMediaList([]);

    await checkCreditsAndRun('video', async () => {
        setImageGenStatus(GenerationStatus.IDLE);
        setVideoGenStatus(GenerationStatus.LOADING);
        setGenerationError(null);
        setManualUrl('');
        
        setVideoGenElapsedTime(0);
        setVideoProgress(0);
        
        if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = window.setInterval(() => {
            setVideoGenElapsedTime(prev => prev + 1);
            // Simular progreso hasta 90% en 20 segundos
            setVideoProgress(prev => {
                if (prev >= 90) return prev;
                return prev + (90 / 20);
            });
        }, 1000);
        
        let messageIndex = 0;
        setVideoLoadingMessage(videoLoadingMessages[0]);
        const messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % videoLoadingMessages.length;
            if (messageIndex === 0) messageIndex = videoLoadingMessages.length - 1;
            setVideoLoadingMessage(videoLoadingMessages[messageIndex]);
        }, 4000);

        try {
          const { operationName } = await generateVideo(text); 
          
          videoPollInterval.current = window.setInterval(async () => {
            try {
              const { done, url } = await checkVideoStatus(operationName);
              if (done) {
                if (url) {
                    setMediaList([{ id: Date.now().toString(), type: PostType.VIDEO, url }]);
                    setVideoGenStatus(GenerationStatus.SUCCESS);
                    setVideoProgress(100);
                    addToHistory('video', url, text);
                } else {
                    throw new Error("Video generado pero sin URL");
                }
                clearInterval(videoPollInterval.current!);
                clearInterval(timerIntervalRef.current!);
                clearInterval(messageInterval);
              }
            } catch (e) {
               console.error("Video polling error:", e);
            }
          }, 5000);

        } catch (e: any) {
          clearInterval(timerIntervalRef.current!);
          clearInterval(messageInterval);
          setVideoGenStatus(GenerationStatus.ERROR);
          setGenerationError(e.message || "Error iniciando video.");
        }
    });
  };

  const handleManualUrlBlur = async () => {
      if (!manualUrl.trim()) {
          setUrlError(null);
          return;
      }
      
      // Verificación estricta de protocolo
      if (!/^https?:\/\//i.test(manualUrl)) {
          setUrlError("La URL debe comenzar con http:// o https://");
          return;
      }

      setIsValidatingUrl(true);
      setUrlError(null);

      // Helper con timeout para no colgar la UI
      const loadWithTimeout = (promise: Promise<boolean>, ms: number) => {
          const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), ms));
          return Promise.race([promise, timeout]);
      };

      const validateImage = (url: string): Promise<boolean> => {
          return new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
              img.src = url;
          });
      };

      const validateVideo = (url: string): Promise<boolean> => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => resolve(true);
            video.onerror = () => resolve(false);
            video.src = url;
        });
      };

      try {
          const isVideoExt = /\.(mp4|webm|ogg|mov)$/i.test(manualUrl);
          let validImage = false;
          let validVideo = false;

          if (isVideoExt) {
               validVideo = await loadWithTimeout(validateVideo(manualUrl), 5000);
          } else {
               validImage = await loadWithTimeout(validateImage(manualUrl), 5000);
               if (!validImage) validVideo = await loadWithTimeout(validateVideo(manualUrl), 5000);
          }

          if (validImage) {
              setMediaList(prev => {
                  const hasVideo = prev.some(m => m.type === PostType.VIDEO);
                  if (hasVideo) return [{ id: Date.now().toString(), type: PostType.IMAGE, url: manualUrl }];
                  return [...prev, { id: Date.now().toString(), type: PostType.IMAGE, url: manualUrl }];
              });
          } else if (validVideo) {
              setMediaList([{ id: Date.now().toString(), type: PostType.VIDEO, url: manualUrl }]);
          } else {
              setUrlError("El archivo no es accesible, tiene formato inválido o tardó mucho en responder.");
          }
          
          setManualUrl(''); 
          setImageGenStatus(GenerationStatus.IDLE);
          setVideoGenStatus(GenerationStatus.IDLE);

      } catch (error) {
          setUrlError("Error de red al validar la URL.");
      } finally {
          setIsValidatingUrl(false);
      }
  };
  
  const handleManualUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setManualUrl(e.target.value);
      if (e.target.value === '') {
          setUrlError(null);
      }
  };

  const handleRemoveMediaItem = (id: string) => {
      setMediaList(prev => prev.filter(item => item.id !== id));
  };

  // Drag & Drop Handlers for Media Reordering
  const handleMediaDragStart = (index: number) => {
      setDraggedItemIndex(index);
  };

  const handleMediaDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      if (draggedItemIndex === null) return;
      if (draggedItemIndex !== index) {
          const newMediaList = [...mediaList];
          const draggedItem = newMediaList[draggedItemIndex];
          newMediaList.splice(draggedItemIndex, 1);
          newMediaList.splice(index, 0, draggedItem);
          setMediaList(newMediaList);
          setDraggedItemIndex(index);
      }
  };

  const handleMediaDragEnd = () => {
      setDraggedItemIndex(null);
  };

  // Drag & Drop Handlers for File Upload
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          processFiles(e.dataTransfer.files);
      }
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      processFiles(files);
      e.target.value = ''; 
  };

  const processFiles = (files: FileList) => {
      const fileArray: File[] = Array.from(files);
      
      const newMediaItems: MediaItem[] = [];
      let hasVideo = false;

      fileArray.forEach(file => {
          const type = file.type.startsWith('image') ? PostType.IMAGE : PostType.VIDEO;
          if (type === PostType.VIDEO) hasVideo = true;
          newMediaItems.push({
              id: Date.now().toString() + Math.random().toString(),
              type,
              url: URL.createObjectURL(file)
          });
      });

      if (hasVideo) {
          const videoItem = newMediaItems.find(m => m.type === PostType.VIDEO);
          if (videoItem) setMediaList([videoItem]);
      } else {
          setMediaList(prev => {
              const prevHasVideo = prev.some(m => m.type === PostType.VIDEO);
              if (prevHasVideo) return newMediaItems;
              return [...prev, ...newMediaItems];
          });
      }
  };

  const handleClearMedia = () => {
      setMediaList([]);
      setManualUrl('');
      setUrlError(null);
  };

  const handleInsertHashtags = (setKey: keyof typeof HASHTAG_SETS) => {
      const tags = HASHTAG_SETS[setKey];
      setText(prev => prev + (prev ? '\n\n' : '') + tags);
      setShowHashtags(false);
  };

  const isPostEmpty = !text.trim() && mediaList.length === 0;

  const validateBeforeAction = () => {
      if (isPostEmpty) {
          setGenerationError("⚠️ La publicación no puede estar vacía. Agrega texto o contenido multimedia.");
          return false;
      }
      if (selectedTargetIds.length === 0) {
          setGenerationError("⚠️ Selecciona al menos un destino (Página o Grupo) para publicar.");
          return false;
      }
      if (!placements.facebook && !placements.instagram) {
          setGenerationError("⚠️ Debes seleccionar al menos una plataforma (Facebook o Instagram).");
          return false;
      }
      return true;
  };

  const handlePostNowWrapper = () => {
      setIsSchedulerModalOpen(false); 
      if (!validateBeforeAction()) return;
      const targets = availableTargets.filter(t => selectedTargetIds.includes(t.id));
      
      setPendingAction({
          type: 'POST_NOW',
          post: { text, media: mediaList, placements, targeting, tone: selectedTone },
          targets
      });
      setShowConfirmationModal(true);
  };

  const handleScheduleWrapper = (schedule: ScheduleOptions) => {
      setIsSchedulerModalOpen(false); 
      if (!validateBeforeAction()) return;
      const targets = availableTargets.filter(t => selectedTargetIds.includes(t.id));
      
      setPendingAction({
          type: 'SCHEDULE',
          post: { text, media: mediaList, placements, targeting, tone: selectedTone },
          schedule,
          targets
      });
      setShowConfirmationModal(true);
  };

  const resetForm = () => {
      setText('');
      setMediaList([]);
      setManualUrl('');
      setGenerationError(null);
  };

  const confirmAction = () => {
      if (!pendingAction) return;

      if (pendingAction.type === 'POST_NOW') {
          onPostNow(pendingAction.post, pendingAction.targets);
          resetForm();
      } else if (pendingAction.type === 'SCHEDULE') {
          onSchedulePost(pendingAction.post, pendingAction.schedule, pendingAction.targets);
          resetForm();
      }

      setShowConfirmationModal(false);
      setPendingAction(null);
  };

  const cancelAction = () => {
      setShowConfirmationModal(false);
      setPendingAction(null);
  };

  const toggleSchedulerModal = () => {
      if (validateBeforeAction()) {
          setIsSchedulerModalOpen(true);
      }
  }

  const filteredTargets = availableTargets.filter(target => 
    target.name.toLowerCase().includes(targetSearchQuery.toLowerCase())
  );

  const pages = filteredTargets.filter(t => t.type === 'PAGE');
  const groups = filteredTargets.filter(t => t.type === 'GROUP');

  const visibleGroupIds = groups.map(t => t.id);
  const selectedVisibleGroupsCount = visibleGroupIds.filter(id => selectedTargetIds.includes(id)).length;
  const isAllVisibleGroupsSelected = visibleGroupIds.length > 0 && selectedVisibleGroupsCount === visibleGroupIds.length;
  const isIndeterminate = selectedVisibleGroupsCount > 0 && !isAllVisibleGroupsSelected;

  const handleToggleAllGroups = () => {
      if (isAllVisibleGroupsSelected) {
          setSelectedTargetIds(prev => prev.filter(id => !visibleGroupIds.includes(id)));
      } else {
          const currentlySelected = selectedTargetIds.length;
          const toAdd = visibleGroupIds.length;
          if (currentlySelected + toAdd > MAX_TARGETS) {
              setGenerationError(`⚠️ Selección masiva excede el límite de ${MAX_TARGETS} destinos.`);
              setTimeout(() => setGenerationError(null), 3000);
              return;
          }
          
          const newIds = new Set([...selectedTargetIds, ...visibleGroupIds]);
          setSelectedTargetIds(Array.from(newIds));
      }
  };

  const TargetRow: React.FC<{target: FacebookTarget}> = ({target}) => (
      <div 
        onClick={() => handleToggleTarget(target.id)}
        className={`flex items-center gap-3 p-3 sm:p-2.5 rounded-lg cursor-pointer transition-all duration-200 border group ${
            selectedTargetIds.includes(target.id) 
            ? 'bg-blue-600/20 border-blue-600/50 shadow-sm' 
            : 'bg-slate-900/40 border-transparent hover:bg-slate-800'
        }`}
      >
        <div className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
            selectedTargetIds.includes(target.id) ? 'bg-blue-500 border-blue-500' : 'border-slate-600 bg-slate-900 group-hover:border-slate-500'
        }`}>
            {selectedTargetIds.includes(target.id) && <Icon name="check" size={3} className="text-white" />}
        </div>
        <div className="relative flex-shrink-0 w-8 h-8">
             <div className="absolute inset-0 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                 <Icon name={target.type === 'PAGE' ? 'flag' : 'users'} size={3} className="text-slate-600" />
            </div>
            <img 
                src={target.avatar} 
                alt={target.name} 
                className="w-full h-full rounded-full object-cover relative z-10" 
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
            />
            <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5 border border-slate-700 z-20">
                <Icon name={target.type === 'PAGE' ? 'flag' : 'users'} size={2} className={target.type === 'PAGE' ? 'text-blue-400' : 'text-purple-400'} />
            </div>
        </div>
        <span className={`text-sm truncate flex-1 ${selectedTargetIds.includes(target.id) ? 'text-white font-medium' : 'text-slate-400 group-hover:text-slate-300'}`}>
            {target.name}
        </span>
      </div>
  );

  const getTutorialClass = (sectionId: string) => {
      if (!isTutorialActive) return '';
      const currentStepObj = TUTORIAL_STEPS[tutorialStep];
      if (currentStepObj.targetId === sectionId) {
          return 'relative z-50 ring-4 ring-blue-500/60 rounded-xl shadow-[0_0_50px_rgba(59,130,246,0.3)] bg-slate-800';
      }
      return 'opacity-30 pointer-events-none filter blur-[1px] transition-all';
  };

  const CreditTooltip = ({ text }: { text: string }) => (
    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-xs text-slate-300 px-3 py-2 rounded-lg shadow-xl w-48 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700"></div>
    </div>
  );

  const getProgressColor = (percentage: number) => {
      if (percentage > 90) return 'bg-red-500';
      if (percentage > 70) return 'bg-yellow-500';
      return 'bg-green-500';
  };

  const CreditBar = ({ type, label, count, limit, isPro }: { type: 'text'|'image'|'video', label: string, count: number, limit: number, isPro: boolean }) => {
      const percentage = isPro ? 0 : getUsagePercentage(type);
      const displayLimit = isPro ? '∞' : limit;
      
      return (
        <div className="flex-1 min-w-[80px] group relative">
             <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
                 <span className={`text-[10px] font-mono ${credits[type] === 0 ? 'text-red-400' : 'text-slate-300'}`}>
                     {isPro ? '∞' : credits[type]}<span className="text-slate-600">/{displayLimit}</span>
                 </span>
             </div>
             <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                 {isPro ? (
                     <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 w-full"></div>
                 ) : (
                     <div 
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(percentage)}`} 
                        style={{ width: `${Math.min(100, percentage)}%` }}
                     ></div>
                 )}
             </div>
             <CreditTooltip text={isPro ? `${label} Ilimitado` : `${credits[type]} restantes de ${limit} diarios.`} />
        </div>
      );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 relative animate-fade-in pb-20">
      
      {/* MODALES */}
      {isSchedulerModalOpen && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[65] flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center p-5 border-b border-slate-700 bg-slate-800/50">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Icon name="calendar" className="text-blue-400" /> Configurar Publicación
                      </h3>
                      <button onClick={() => setIsSchedulerModalOpen(false)} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                          <Icon name="x" size={6} />
                      </button>
                  </div>
                  <div className="p-6 overflow-y-auto custom-scrollbar">
                      <p className="text-sm text-slate-400 mb-6">Elige si quieres publicar este contenido inmediatamente o programarlo para más tarde.</p>
                      <Scheduler 
                        onPostNow={handlePostNowWrapper} 
                        onSchedulePost={handleScheduleWrapper} 
                        disabled={false}
                        isFacebookLinked={isFacebookLinked}
                    />
                  </div>
              </div>
          </div>
      )}

      {showConfirmationModal && pendingAction && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                  <div className="p-5 border-b border-slate-700 bg-slate-800/50">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Icon name="check" className="text-blue-400" /> Confirmar Publicación
                      </h3>
                  </div>
                  
                  <div className="p-6 space-y-5">
                      <div className="flex gap-4 border-b border-slate-700 pb-4">
                           <div className={`flex items-center gap-2 ${pendingAction.post.placements?.facebook ? 'text-blue-400' : 'text-slate-600'}`}>
                               <Icon name="facebook" size={5} /> 
                               <span className="text-sm font-bold">{pendingAction.post.placements?.facebook ? 'Facebook Feed' : 'No'}</span>
                           </div>
                           <div className={`flex items-center gap-2 ${pendingAction.post.placements?.instagram ? 'text-pink-500' : 'text-slate-600'}`}>
                               <Icon name="instagram" size={5} /> 
                               <span className="text-sm font-bold">{pendingAction.post.placements?.instagram ? 'Instagram Feed' : 'No'}</span>
                           </div>
                      </div>

                      <div>
                          <p className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Se publicará en:</p>
                          <div className="flex flex-wrap gap-2">
                              {pendingAction.targets.slice(0, 5).map(t => (
                                  <div key={t.id} className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-full pl-1 pr-3 py-1">
                                      <img src={t.avatar} className="w-5 h-5 rounded-full" alt={t.name}/>
                                      <span className="text-xs text-slate-200 max-w-[120px] truncate">{t.name}</span>
                                  </div>
                              ))}
                              {pendingAction.targets.length > 5 && (
                                  <div className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded-full flex items-center">
                                      +{pendingAction.targets.length - 5} más
                                  </div>
                              )}
                          </div>
                      </div>

                      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Contenido:</p>
                          <div className="flex gap-4">
                              {pendingAction.post.media.length > 0 && (
                                  <div className="w-16 h-16 bg-black rounded-lg shrink-0 overflow-hidden border border-slate-600 relative">
                                      {pendingAction.post.media[0].type === PostType.IMAGE ? (
                                          <img src={pendingAction.post.media[0].url} className="w-full h-full object-cover" alt="Preview"/>
                                      ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                              <Icon name="video" className="text-slate-500" />
                                          </div>
                                      )}
                                      {pendingAction.post.media.length > 1 && (
                                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                                              +{pendingAction.post.media.length - 1}
                                          </div>
                                      )}
                                  </div>
                              )}
                              <div className="min-w-0 flex-1">
                                  <p className="text-sm text-slate-300 italic line-clamp-3">
                                      "{pendingAction.post.text || "(Sin texto)"}"
                                  </p>
                              </div>
                          </div>
                      </div>
                      
                      {pendingAction.post.targeting && (pendingAction.post.targeting.locations || pendingAction.post.targeting.interests) && (
                          <div className="text-xs text-slate-400 bg-slate-900/30 p-2 rounded border border-slate-700">
                               <p><span className="font-bold">Target:</span> {pendingAction.post.targeting.locations || 'Global'}, {pendingAction.post.targeting.ageMin}-{pendingAction.post.targeting.ageMax} años.</p>
                          </div>
                      )}

                      <div className="flex items-center gap-3 text-sm">
                          <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                              <Icon name={pendingAction.type === 'POST_NOW' ? 'rocket' : 'clock'} />
                          </div>
                          <div>
                              <p className="text-slate-400 text-xs uppercase font-bold">Acción:</p>
                              <p className="text-white font-medium">
                                  {pendingAction.type === 'POST_NOW' ? 'Publicar Inmediatamente' : `Programar`}
                              </p>
                          </div>
                      </div>
                  </div>

                  <div className="p-4 bg-slate-900 border-t border-slate-700 flex gap-3 justify-end">
                      <button onClick={cancelAction} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 font-medium text-sm transition-colors">Cancelar</button>
                      <button onClick={confirmAction} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg transform active:scale-95 transition-all">Confirmar</button>
                  </div>
              </div>
          </div>
      )}
      
      {isTutorialActive && <div className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm transition-opacity"></div>}
      {isTutorialActive && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[60] w-[90%] max-w-md animate-fade-in">
              <div className="bg-slate-800 border border-blue-500 rounded-xl shadow-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <div className="flex items-start gap-4">
                      <div className="bg-blue-600 p-2 rounded-lg shrink-0 shadow-lg">
                          <Icon name="rocket" className="text-white" size={6} />
                      </div>
                      <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                              <h3 className="text-lg font-bold text-white">{TUTORIAL_STEPS[tutorialStep].title}</h3>
                              <span className="text-xs text-blue-300 bg-blue-900/30 px-2 py-1 rounded">{tutorialStep + 1} / {TUTORIAL_STEPS.length}</span>
                          </div>
                          <p className="text-sm text-slate-300 mb-4 leading-relaxed">{TUTORIAL_STEPS[tutorialStep].content}</p>
                          <div className="flex justify-between items-center mt-2">
                              <button onClick={finishTutorial} className="text-xs text-slate-500 hover:text-slate-300 underline">Saltar tutorial</button>
                              <div className="flex gap-2">
                                  {tutorialStep > 0 && <button onClick={handlePrevStep} className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-colors">Anterior</button>}
                                  <button onClick={handleNextStep} className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg transition-all transform hover:scale-105">{tutorialStep === TUTORIAL_STEPS.length - 1 ? '¡Entendido!' : 'Siguiente'}</button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {!isFacebookLinked && <ConnectOverlay />}
      {showUpsellModal && <SubscriptionModal onClose={() => setShowUpsellModal(false)} />}
      
      <div className="space-y-6">
        
        <div id="tutorial-targets-section" className={`bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-lg ${getTutorialClass('tutorial-targets-section')}`}>
             <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-3">Ubicaciones (Placements)</h3>
             <div className="flex gap-4 mb-4">
                 <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer flex-1 transition-all ${placements.facebook ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-900 border-slate-700 opacity-60'}`}>
                     <input type="checkbox" checked={placements.facebook} onChange={() => setPlacements(prev => ({...prev, facebook: !prev.facebook}))} className="hidden"/>
                     <div className={`w-5 h-5 rounded border flex items-center justify-center ${placements.facebook ? 'bg-blue-500 border-blue-500' : 'border-slate-500'}`}>
                         {placements.facebook && <Icon name="check" size={3} className="text-white" />}
                     </div>
                     <div className="flex items-center gap-2 text-sm font-bold text-white">
                         <Icon name="facebook" className="text-blue-500" /> Facebook
                     </div>
                 </label>
                 <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer flex-1 transition-all ${placements.instagram ? 'bg-pink-900/20 border-pink-500' : 'bg-slate-900 border-slate-700 opacity-60'}`}>
                     <input type="checkbox" checked={placements.instagram} onChange={() => setPlacements(prev => ({...prev, instagram: !prev.instagram}))} className="hidden"/>
                     <div className={`w-5 h-5 rounded border flex items-center justify-center ${placements.instagram ? 'bg-pink-500 border-pink-500' : 'border-slate-500'}`}>
                         {placements.instagram && <Icon name="check" size={3} className="text-white" />}
                     </div>
                     <div className="flex items-center gap-2 text-sm font-bold text-white">
                         <Icon name="instagram" className="text-pink-500" /> Instagram
                     </div>
                 </label>
             </div>

             <div className="border-t border-slate-700 pt-3">
                 <button 
                    onClick={() => setIsTargetingExpanded(!isTargetingExpanded)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors w-full"
                 >
                     <Icon name="target" size={3} /> Configuración de Audiencia (Opcional)
                     <Icon name="chevronDown" size={3} className={`transform transition-transform ${isTargetingExpanded ? 'rotate-180' : ''}`} />
                 </button>
                 
                 {isTargetingExpanded && (
                     <div className="mt-3 space-y-3 animate-fade-in bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                         <div className="grid grid-cols-2 gap-3">
                             <div>
                                 <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Edad Mín</label>
                                 <input 
                                    type="number" 
                                    min="13" max="65"
                                    value={targeting.ageMin}
                                    onChange={(e) => setTargeting(prev => ({...prev, ageMin: parseInt(e.target.value)}))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-sm text-white focus:ring-1 focus:ring-blue-500"
                                 />
                             </div>
                             <div>
                                 <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Edad Máx</label>
                                 <input 
                                    type="number" 
                                    min="13" max="65"
                                    value={targeting.ageMax}
                                    onChange={(e) => setTargeting(prev => ({...prev, ageMax: parseInt(e.target.value)}))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-sm text-white focus:ring-1 focus:ring-blue-500"
                                 />
                             </div>
                         </div>
                         <div>
                             <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Ubicación (País/Ciudad)</label>
                             <input 
                                type="text" 
                                placeholder="Ej: Madrid, México, Global"
                                value={targeting.locations}
                                onChange={(e) => setTargeting(prev => ({...prev, locations: e.target.value}))}
                                className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-sm text-white focus:ring-1 focus:ring-blue-500"
                             />
                         </div>
                         <div>
                             <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Intereses</label>
                             <input 
                                type="text" 
                                placeholder="Ej: Tecnología, Deportes, Moda..."
                                value={targeting.interests}
                                onChange={(e) => setTargeting(prev => ({...prev, interests: e.target.value}))}
                                className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-sm text-white focus:ring-1 focus:ring-blue-500"
                             />
                         </div>
                     </div>
                 )}
             </div>
        </div>

        {/* CREDITS WIDGET */}
        <div className={`bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 shadow-sm transition-all ${isTutorialActive ? 'opacity-30' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
                <Icon name="diamond" className="text-blue-400" size={4} />
                <p className="text-sm font-bold text-white">Créditos Disponibles Hoy</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
                 <CreditBar type="text" label="Texto IA" count={credits.text} limit={FREE_PLAN_LIMITS.TEXT_DAILY} isPro={credits.isPro} />
                 <CreditBar type="image" label="Imágenes" count={credits.image} limit={FREE_PLAN_LIMITS.IMAGE_DAILY} isPro={credits.isPro} />
                 <CreditBar type="video" label="Video" count={credits.video} limit={FREE_PLAN_LIMITS.VIDEO_DAILY} isPro={credits.isPro} />
            </div>
            {!credits.isPro && (
                <button onClick={() => setShowUpsellModal(true)} className="w-full mt-4 text-xs font-bold text-white bg-slate-700 hover:bg-slate-600 py-2 rounded-lg transition-colors">
                    Aumentar Límites
                </button>
            )}
        </div>

        {/* UNIFIED SUPER EDITOR */}
        <div id="tutorial-editor-section" className={`bg-slate-800 border border-slate-700 p-4 sm:p-6 rounded-xl shadow-lg transition-all duration-300 ${getTutorialClass('tutorial-editor-section')}`}>
          <div id="header-actions" className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                  <label className="text-sm font-bold text-white uppercase tracking-wide">Editor</label>
                  <div className="relative group ml-2">
                      <div className="flex items-center gap-1 text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded cursor-pointer hover:bg-slate-600">
                          <Icon name="magic" size={3} />
                          <span>Tono: {selectedTone}</span>
                      </div>
                      <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-600 rounded shadow-xl hidden group-hover:grid grid-cols-1 w-32 z-20">
                          {TONES.map(tone => (
                              <button 
                                key={tone}
                                onClick={() => setSelectedTone(tone)}
                                className={`text-left text-xs px-3 py-2 hover:bg-slate-700 ${selectedTone === tone ? 'text-blue-400 font-bold' : 'text-slate-300'}`}
                              >
                                  {tone}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="flex items-center gap-2">
                  
                  <button onClick={handleExamplePrompt} className="text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 border border-blue-600/30"><Icon name="rocket" size={3} /> Idea Ejemplo</button>

                  <button 
                    onClick={handlePostNowWrapper}
                    className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <Icon name="rocket" size={3} /> Publicar
                  </button>

                   <button 
                    onClick={toggleSchedulerModal}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <Icon name="calendar" size={3} /> Programar
                  </button>
              </div>
          </div>

          <div className="space-y-0">
            <div className="flex justify-between items-center mb-1 bg-slate-900 border-t border-l border-r border-slate-700 rounded-t-lg p-2">
                 <div className="flex items-center gap-1">
                    <button onClick={() => handleFormat('bold')} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Negrita (Unicode)">
                        <Icon name="bold" size={4} />
                    </button>
                    <button onClick={() => handleFormat('italic')} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Cursiva (Unicode)">
                        <Icon name="italic" size={4} />
                    </button>
                    <button onClick={() => handleFormat('list')} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Lista de viñetas">
                        <Icon name="list" size={4} />
                    </button>
                    <div className="h-4 w-px bg-slate-700 mx-1"></div>
                    <button onClick={() => setShowHashtags(!showHashtags)} className="text-xs text-blue-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-700 transition-all">
                        <Icon name="hash" size={3}/> Etiquetas
                    </button>
                 </div>
                 {text && <span className="text-xs text-slate-500 px-2">{text.length} cars.</span>}
            </div>
            
            <div className="relative">
                {showHashtags && (
                    <div className="bg-slate-900 border border-slate-700 p-2 mb-2 grid grid-cols-2 sm:grid-cols-3 gap-2 animate-fade-in absolute z-10 w-full shadow-xl top-0 rounded-b-lg">
                        {Object.keys(HASHTAG_SETS).map(key => (
                            <button 
                                key={key} 
                                onClick={() => handleInsertHashtags(key as keyof typeof HASHTAG_SETS)}
                                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white py-1 px-2 rounded border border-slate-700"
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                )}

                <textarea
                    ref={textAreaRef}
                    className="w-full p-4 bg-slate-900 border border-slate-700 rounded-b-lg focus:ring-2 focus:ring-blue-500 outline-none text-white text-lg placeholder-slate-500 transition-all resize-none h-40 leading-relaxed shadow-inner border-t-0"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Escribe aquí..."
                />
                
                {generationError && (
                   <div className="mt-2 bg-red-500/10 border border-red-500/50 text-red-200 text-sm p-3 rounded-lg flex items-center gap-2 animate-shake">
                       <Icon name="warning" className="text-red-400 shrink-0" size={4} /><span>{generationError}</span>
                   </div>
                )}
            </div>
            
            <div className="grid grid-cols-3 gap-2 pt-4">
                <button onClick={handleGenerateText} disabled={textGenStatus === GenerationStatus.LOADING || !text.trim()} className="flex items-center justify-center gap-2 p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium border border-slate-600 hover:border-slate-500 transition-colors h-10">
                    {textGenStatus === GenerationStatus.LOADING ? <Spinner size={3} /> : <Icon name="text" size={4} />}
                    Mejorar Texto
                </button>
                <button onClick={handleGenerateImage} disabled={imageGenStatus === GenerationStatus.LOADING || !text.trim()} className="flex items-center justify-center gap-2 p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium border border-slate-600 hover:border-slate-500 transition-colors h-10">
                    {imageGenStatus === GenerationStatus.LOADING ? <Spinner size={3} /> : <Icon name="image" size={4} />}
                    Crear Imagen
                </button>
                <button onClick={handleGenerateVideo} disabled={videoGenStatus === GenerationStatus.LOADING || !text.trim()} className="flex items-center justify-center gap-2 p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium border border-slate-600 hover:border-slate-500 transition-colors relative overflow-hidden h-10">
                    {!credits.isPro && <div className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full"></div>}
                    {videoGenStatus === GenerationStatus.LOADING ? <Spinner size={3} /> : <Icon name="video" size={4} />}
                    Crear Video
                </button>
            </div>
            
             {/* HISTORY TOGGLE */}
             <div className="mt-4 border-t border-slate-700 pt-2">
                <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-blue-400 transition-colors w-full py-1"
                >
                    <Icon name="history" size={3} />
                    <span className="font-medium">
                        {showHistory ? 'Ocultar Historial' : `Ver Historial de Generación (${generationHistory.length})`}
                    </span>
                    <Icon name="chevronDown" size={3} className={`ml-auto transform transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                </button>

                {showHistory && (
                    <div className="mt-2 bg-slate-900/50 border border-slate-700 rounded-lg p-2 space-y-2 max-h-60 overflow-y-auto custom-scrollbar animate-fade-in">
                        <div className="flex justify-between items-center mb-2 px-1">
                             <span className="text-[10px] text-slate-500 uppercase font-bold">Recientes</span>
                             {generationHistory.length > 0 && (
                                 <button onClick={clearHistory} className="text-[10px] text-red-400 hover:text-white">Borrar todo</button>
                             )}
                        </div>
                        {generationHistory.length === 0 && <p className="text-xs text-slate-500 text-center py-4 italic">No hay historial reciente.</p>}
                        {generationHistory.map(item => (
                            <div key={item.id} className="flex items-center justify-between bg-slate-800 p-2 rounded border border-slate-700/50 hover:border-slate-600 transition-colors group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="bg-slate-700 p-1.5 rounded text-slate-300 shrink-0">
                                        <Icon name={item.type === 'text' ? 'text' : item.type === 'image' ? 'image' : 'video'} size={3} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-slate-300 truncate font-medium leading-tight">"{item.prompt}"</p>
                                        <p className="text-[9px] text-slate-500 truncate">
                                            {item.type === 'text' ? 'Texto generado' : 'Multimedia generada'} · {item.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => restoreFromHistory(item)}
                                    className="text-[10px] bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white px-2 py-1 rounded transition-colors ml-2 font-medium opacity-0 group-hover:opacity-100 focus:opacity-100"
                                >
                                    Usar
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {videoGenStatus === GenerationStatus.LOADING && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-500/30 flex flex-col gap-3 shadow-inner">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                          <div className="relative">
                             <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
                             <Spinner size={5} />
                          </div>
                          <div className="flex flex-col">
                              <span className="text-sm font-bold text-white animate-pulse">{videoLoadingMessage}</span>
                              <span className="text-xs text-slate-400">Esto puede tomar unos segundos...</span>
                          </div>
                      </div>
                      <span className="text-sm font-mono text-blue-300 bg-slate-900/50 border border-slate-700 px-3 py-1 rounded-lg shrink-0">{formatTime(videoGenElapsedTime)}</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-1000 ease-out" style={{width: `${videoProgress}%`}}></div>
                  </div>
              </div>
            )}

            <div id="tutorial-media-section" className={`pt-4 border-t border-slate-700 mt-4 ${getTutorialClass('tutorial-media-section')}`}>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-slate-400 block">Contenido Multimedia</label>
                    {mediaList.length > 0 && (
                        <button onClick={handleClearMedia} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 p-1">
                            <Icon name="trash" size={3} /> Limpiar todo
                        </button>
                    )}
                </div>
                
                {mediaList.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                        {mediaList.map((item, index) => (
                            <div 
                                key={item.id} 
                                draggable
                                onDragStart={() => handleMediaDragStart(index)}
                                onDragOver={(e) => handleMediaDragOver(e, index)}
                                onDragEnd={handleMediaDragEnd}
                                className={`relative aspect-square rounded-lg overflow-hidden border border-slate-700 group cursor-move ${draggedItemIndex === index ? 'opacity-50 ring-2 ring-blue-500' : ''}`}
                                title="Arrastra para reordenar"
                            >
                                {item.type === PostType.IMAGE ? (
                                    <img src={item.url} alt="thumbnail" className="w-full h-full object-cover" />
                                ) : (
                                    <video src={item.url} className="w-full h-full object-cover" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleRemoveMediaItem(item.id); }}
                                        className="bg-red-600/80 text-white p-1.5 rounded-full hover:bg-red-500 transition-colors"
                                    >
                                        <Icon name="x" size={3} />
                                    </button>
                                </div>
                                {item.type === PostType.VIDEO && (
                                    <div className="absolute bottom-1 left-1 bg-black/60 text-[9px] text-white px-1 rounded">VIDEO</div>
                                )}
                            </div>
                        ))}
                        {!mediaList.some(m => m.type === PostType.VIDEO) && (
                            <div className="aspect-square rounded-lg border-2 border-dashed border-slate-700 flex flex-col items-center justify-center hover:bg-slate-800 cursor-pointer relative transition-colors">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFilesSelected}
                                />
                                <Icon name="upload" className="text-slate-500" size={4} />
                                <span className="text-[9px] text-slate-400 mt-1">Añadir +</span>
                            </div>
                        )}
                    </div>
                )}

                {mediaList.length === 0 && (
                    <div className="space-y-3">
                        <div className="relative">
                             <input 
                                type="text" 
                                placeholder="Pega URL de imagen/video..." 
                                value={manualUrl}
                                onChange={handleManualUrlChange}
                                onBlur={handleManualUrlBlur}
                                disabled={isValidatingUrl}
                                className={`w-full bg-slate-900 border ${urlError ? 'border-red-500' : 'border-slate-700'} rounded-lg py-3 px-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none pr-10`}
                             />
                             {isValidatingUrl && <div className="absolute right-3 top-2.5"><Spinner size={4} /></div>}
                        </div>
                        {urlError && <p className="text-xs text-red-400">{urlError}</p>}

                        <div className="relative flex py-1 items-center">
                             <div className="flex-grow border-t border-slate-700"></div>
                             <span className="flex-shrink-0 mx-4 text-slate-600 text-[10px] uppercase font-bold tracking-widest">O subir archivo</span>
                             <div className="flex-grow border-t border-slate-700"></div>
                        </div>

                        {/* DROPZONE */}
                        <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer group relative flex flex-col items-center justify-center gap-2 ${
                                isDragOver ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700 hover:bg-slate-800'
                            }`}
                        >
                            <input
                                type="file"
                                multiple 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                accept="image/*,video/*"
                                onChange={handleFilesSelected}
                            />
                            <div className="pointer-events-none flex flex-col items-center">
                                <Icon name="upload" className={`${isDragOver ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400'} transition-colors mb-1`} size={6} />
                                <p className="text-xs text-slate-400 group-hover:text-slate-300">
                                    {isDragOver ? '¡Suelta los archivos!' : 'Arrastra archivos aquí o haz clic'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
        
        {/* SECCIÓN TARGETS */}
        <div id="tutorial-targets-section" className={`pt-4 border-t border-slate-700 mt-4 transition-all duration-300 rounded-lg p-1 ${getTutorialClass('tutorial-targets-section')}`}>
             <div 
                    className="flex flex-col gap-3 mb-4 cursor-pointer"
                    onClick={() => setIsTargetsExpanded(!isTargetsExpanded)}
                >
                    <div className="flex justify-between items-center bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-md hover:border-slate-600 transition-all z-50 relative">
                         <div>
                            <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">Cuentas Conectadas</label>
                            <p className="text-[10px] text-slate-500 mt-0.5">Selecciona páginas y grupos <span className="text-blue-400">({selectedTargetIds.length}/{MAX_TARGETS})</span></p>
                         </div>
                         <Icon name="chevronDown" className={`text-slate-400 transform transition-transform duration-300 ${isTargetsExpanded ? 'rotate-180' : ''}`} size={5} />
                    </div>
                </div>
                
                <div className={`grid transition-all duration-300 ease-in-out ${isTargetsExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                        <div className="relative w-full mb-4">
                             <div className="absolute left-2.5 top-2 text-slate-500"><Icon name="search" size={3} /></div>
                             <input 
                                type="text"
                                placeholder="Buscar destinos..."
                                value={targetSearchQuery}
                                onChange={(e) => setTargetSearchQuery(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-full py-1.5 pl-8 pr-8 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                             />
                             {targetSearchQuery && <button onClick={() => setTargetSearchQuery('')} className="absolute right-2 top-1.5 text-slate-500 hover:text-white p-0.5 rounded-full hover:bg-slate-700 transition-colors"><Icon name="x" size={3} /></button>}
                        </div>
                        <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden max-h-64 overflow-y-auto custom-scrollbar relative">
                            {pages.length > 0 && (
                                <div className="pb-2">
                                    <div className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 px-3 py-2 mb-1 flex items-center gap-2 shadow-md">
                                        <Icon name="flag" size={3} className="text-blue-400"/><h4 className="text-xs font-bold text-slate-400 uppercase">Tus Páginas Comerciales</h4>
                                    </div>
                                    <div className="space-y-1 px-2">{pages.map(page => <TargetRow key={page.id} target={page} />)}</div>
                                </div>
                            )}
                            {groups.length > 0 && (
                                <div className="pb-2">
                                     <div className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 px-3 py-2 mb-1 flex items-center justify-between shadow-md">
                                        <div className="flex items-center gap-2">
                                            <Icon name="users" size={3} className="text-purple-400"/><h4 className="text-xs font-bold text-slate-400 uppercase">Grupos ({selectedVisibleGroupsCount}/{groups.length})</h4>
                                        </div>
                                        <button onClick={handleToggleAllGroups} className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white transition-colors px-2 py-0.5 rounded hover:bg-slate-800">
                                            <span className="mr-1">{isAllVisibleGroupsSelected ? 'Desmarcar' : 'Todos'}</span>
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isAllVisibleGroupsSelected || isIndeterminate ? 'bg-blue-600 border-blue-600' : 'border-slate-500 bg-slate-800'}`}>
                                                {isAllVisibleGroupsSelected && <Icon name="check" size={3} className="text-white" />}
                                                {isIndeterminate && <Icon name="minus" size={3} className="text-white" />}
                                            </div>
                                        </button>
                                    </div>
                                    <div className="space-y-1 px-2 mt-2">{groups.map(group => <TargetRow key={group.id} target={group} />)}</div>
                                </div>
                            )}
                            {filteredTargets.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                                    <Icon name="search" size={6} className="opacity-20 mb-2"/>
                                    <p className="text-xs">No se encontraron destinos.</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 px-1">
                            <span><strong className="text-white">{selectedTargetIds.length}</strong> destinos seleccionados</span>
                            {selectedTargetIds.length === 0 && <span className="text-red-400 flex items-center gap-1 animate-pulse"><Icon name="warning" size={3} /> Requerido</span>}
                        </div>
                    </div>
                </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className={`bg-slate-800 border border-slate-700 p-4 sm:p-6 rounded-xl shadow-lg transition-all duration-300 ${isTutorialActive ? 'opacity-30 pointer-events-none' : ''}`}>
            <label className="block text-sm font-bold text-white uppercase tracking-wide mb-4">Vista Previa</label>
            <PostPreview 
                post={{ text, media: mediaList, placements }} 
                editable={true}
                onTextChange={setText}
                onClearMedia={() => setMediaList([])} 
            />
        </div>
      </div>
    </div>
  );
};
