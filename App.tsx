
import React, { useState, useCallback, useEffect } from 'react';
import { CreatePost } from './components/CreatePost';
import { Dashboard } from './components/Dashboard';
import { Content } from './components/Content';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { LoginPage } from './components/LoginPage';
import { SubscriptionModal } from './components/SubscriptionModal';
import { WelcomeTutorialModal } from './components/WelcomeTutorialModal'; // Import nuevo modal
import type { Post, ScheduledPost, ScheduleOptions, AppView, DayOfWeek, FacebookTarget } from './types';
import { PostStatus, ScheduleType } from './types';
import { postToFacebook, getConnectedTargets } from './services/facebookService';
import { requestNotificationPermission, sendNotification } from './services/notificationService';

// ==================================================================================
// ⚠️ CONFIGURACIÓN REAL DE FACEBOOK
// 1. Ve a developers.facebook.com -> Mis Apps -> Copia el "Identificador de la App"
// 2. Pégalo abajo dentro de las comillas.
// 3. Si lo dejas vacío, la app usará el MODO SIMULACIÓN.
const FACEBOOK_APP_ID = ''; 
// ==================================================================================

// ==================================================================================
// CONFIGURACIÓN DE SEGURIDAD ANTI-BANEO (HUMAN EMULATION)
// ==================================================================================
const MAX_DAILY_POSTS = 20; // Límite seguro sugerido por expertos en FB Ads
const MIN_MINUTES_BETWEEN_POSTS = 30; // Facebook marca como spam si hay posts muy seguidos
const FORCED_JITTER_MINUTES = 5; // Variación aleatoria forzada +/- minutos
// ==================================================================================

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

const calculateNextPublishTime = (schedule: ScheduleOptions, fromDate: Date = new Date()): Date => {
  let targetDate = new Date();

  // 1. CALCULO BASE
  if (schedule.type === ScheduleType.INTERVAL) {
    const startDate = new Date(fromDate.getTime() + 1000); 
    // Aplicamos un randomize base si el usuario lo eligió
    const delay = schedule.randomize
      ? schedule.frequencyMinutes * 0.8 + Math.random() * (schedule.frequencyMinutes * 0.4)
      : schedule.frequencyMinutes;
    targetDate = new Date(startDate.getTime() + delay * 60 * 1000);
  }

  else if (schedule.type === ScheduleType.SPECIFIC_DAYS) {
    let earliestNextDate: Date | null = null;
    const searchFromDate = new Date(fromDate.getTime() + 1000);

    for (const pattern of schedule.patterns) {
        const sortedTimes = pattern.times.sort();
        const sortedDays = pattern.days.sort();
        if (sortedDays.length === 0 || sortedTimes.length === 0) continue;

        for (let i = 0; i < 14; i++) {
            const checkDate = new Date(searchFromDate);
            checkDate.setDate(searchFromDate.getDate() + i);
            const checkDay = checkDate.getDay() as DayOfWeek;

            if (sortedDays.includes(checkDay)) {
                for (const time of sortedTimes) {
                    const [hours, minutes] = time.split(':').map(Number);
                    const potentialDate = new Date(checkDate);
                    potentialDate.setHours(hours, minutes, 0, 0);

                    if (potentialDate > searchFromDate) {
                       if (!earliestNextDate || potentialDate < earliestNextDate) {
                           earliestNextDate = potentialDate;
                       }
                       break; 
                    }
                }
            }
            if (earliestNextDate && new Date(earliestNextDate).getDate() === checkDate.getDate()) {
                break;
            }
        }
    }
    
    if (earliestNextDate) {
        targetDate = earliestNextDate;
    } else {
        const fallbackDate = new Date();
        fallbackDate.setDate(fallbackDate.getDate() + 7);
        targetDate = fallbackDate;
    }
  }
  
  // 2. CAPA DE SEGURIDAD: JITTER FORZADO (Humanización)
  // Incluso si el cálculo matemático dice "09:00:00", añadimos ruido aleatorio
  // para que Facebook no detecte un patrón robótico perfecto.
  const jitterMs = (Math.random() * FORCED_JITTER_MINUTES * 2 - FORCED_JITTER_MINUTES) * 60 * 1000; // +/- 5 min
  const humanizedDate = new Date(targetDate.getTime() + jitterMs);

  // Nunca permitir que el jitter mueva la fecha al pasado
  return humanizedDate > new Date() ? humanizedDate : targetDate;
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('DASHBOARD');
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [history, setHistory] = useState<ScheduledPost[]>([]);
  
  // FACEBOOK STATE
  const [isFacebookLinked, setIsFacebookLinked] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [availableTargets, setAvailableTargets] = useState<FacebookTarget[]>([]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  
  // WELCOME TUTORIAL STATE
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Solicitar permisos de notificación al cargar
  useEffect(() => {
      requestNotificationPermission();
  }, []);

  // DETECTAR PAGO EXITOSO (Callback de Stripe)
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment') === 'success') {
          // Activar Plan Pro
          localStorage.setItem('is_pro_user', 'true');
          sendNotification("¡Plan Pro Activado!", "Has desbloqueado generación de video ilimitada.", "success");
          
          // Limpiar URL para evitar re-activaciones al refrescar
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Abrir Dashboard o mostrar confeti (opcional)
          setView('CREATE');
      } else if (params.get('payment') === 'cancel') {
          sendNotification("Pago Cancelado", "El proceso de suscripción no se completó.", "error");
          window.history.replaceState({}, document.title, window.location.pathname);
      }
  }, []);

  // Fetch Targets when linked and CHECK WELCOME
  useEffect(() => {
      if (isFacebookLinked) {
          getConnectedTargets().then(setAvailableTargets);
          
          // Check if user has seen the welcome modal
          const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeModal');
          if (!hasSeenWelcome) {
              setShowWelcomeModal(true);
          }
      } else {
          setAvailableTargets([]);
      }
  }, [isFacebookLinked]);

  // Inicializar SDK de Facebook Real si existe APP ID y verificar LocalStorage
  useEffect(() => {
    const fbToken = localStorage.getItem('fb_access_token');
    if (fbToken) {
      setIsFacebookLinked(true);
    }
    
    if (FACEBOOK_APP_ID) {
        console.log("Inicializando Facebook SDK con ID:", FACEBOOK_APP_ID);
        // Cargar script del SDK asíncronamente
        (function(d, s, id){
             var js, fjs = d.getElementsByTagName(s)[0];
             if (d.getElementById(id)) {return;}
             js = d.createElement(s) as HTMLScriptElement; 
             js.id = id;
             js.src = "https://connect.facebook.net/es_LA/sdk.js";
             if (fjs && fjs.parentNode) {
                fjs.parentNode.insertBefore(js, fjs);
             }
           }(document, 'script', 'facebook-jssdk'));

        window.fbAsyncInit = function() {
            window.FB.init({
              appId      : FACEBOOK_APP_ID,
              cookie     : true,
              xfbml      : true,
              version    : 'v19.0'
            });
            
            // Verificar estado de login al cargar
            window.FB.getLoginStatus(function(response: any) {
                if (response.status === 'connected') {
                    setIsFacebookLinked(true);
                    localStorage.setItem('fb_access_token', response.authResponse.accessToken);
                    localStorage.setItem('fb_user_id', response.authResponse.userID); // Guardar ID real
                }
            });
        };
    }
  }, []);

  // --- WELCOME HANDLERS ---
  const handleStartTutorial = () => {
      // 1. Marcar que ya vio el modal de bienvenida
      localStorage.setItem('hasSeenWelcomeModal', 'true');
      // 2. Asegurarse de que NO tenga marcado el tutorial de CreatePost como visto (para que se active)
      localStorage.removeItem('hasSeenCreateTutorial');
      // 3. Ir a la vista de crear
      setView('CREATE');
      setShowWelcomeModal(false);
  };

  const handleSkipTutorial = () => {
      // 1. Marcar bienvenida como vista
      localStorage.setItem('hasSeenWelcomeModal', 'true');
      // 2. Marcar tutorial de post como visto (para que no salga)
      localStorage.setItem('hasSeenCreateTutorial', 'true');
      setShowWelcomeModal(false);
  };

  // --- FACEBOOK HANDLERS ---
  const handleLinkFacebook = () => {
    setIsLinking(true);

    // 1. LOGIN REAL (Si hay APP ID configurado)
    if (FACEBOOK_APP_ID && window.FB) {
        console.log("Intentando login real con Facebook SDK...");
        window.FB.login(function(response: any) {
            if (response.authResponse) {
                 console.log('Login exitoso con Facebook Real');
                 localStorage.setItem('fb_access_token', response.authResponse.accessToken);
                 localStorage.setItem('fb_user_id', response.authResponse.userID);
                 setIsFacebookLinked(true);
            } else {
                 console.log('Usuario canceló el login o no autorizó completamente.');
                 alert('La conexión con Facebook fue cancelada.');
            }
            setIsLinking(false);
        }, {scope: 'public_profile,email'}); // Añadir 'pages_manage_posts' requiere revisión de app en FB
        return; 
    }

    // 2. FALLBACK: SIMULACIÓN DIRECTA (Si no hay APP ID)
    console.log("Iniciando MODO SIMULACIÓN (Sin App ID configurado)");
    setTimeout(() => {
        const mockToken = 'mock_access_token_' + Date.now();
        const mockUserId = 'fb_user_' + Math.floor(Math.random() * 100000); // ID Único Simulado
        
        localStorage.setItem('fb_access_token', mockToken);
        localStorage.setItem('fb_user_id', mockUserId); // Guardamos ID único simulado
        
        setIsFacebookLinked(true);
        setIsLinking(false);
    }, 1500); // 1.5 segundos de carga simulada
  };

  const handleUnlinkFacebook = () => {
    localStorage.removeItem('fb_access_token');
    localStorage.removeItem('fb_user_id'); // Limpiamos el ID
    setIsFacebookLinked(false);
    if (FACEBOOK_APP_ID && window.FB) {
        try {
            window.FB.logout();
        } catch (e) {
            console.log("Sesión local cerrada");
        }
    }
  };

  // --- VALIDACIÓN DE SEGURIDAD (ANTI-BAN) ---
  const validateSafeScheduling = (publishDate: Date): boolean => {
    const today = new Date();
    const postsToday = scheduledPosts.filter(p => 
        new Date(p.publishAt).toDateString() === publishDate.toDateString()
    ).length;
    
    const historyToday = history.filter(p => 
        new Date(p.publishAt).toDateString() === publishDate.toDateString()
    ).length;

    if ((postsToday + historyToday) >= MAX_DAILY_POSTS) {
        alert(`🛡️ ALERTA DE SEGURIDAD FACEBOOK\n\nHas alcanzado el límite diario seguro de ${MAX_DAILY_POSTS} publicaciones.`);
        return false;
    }

    const conflict = scheduledPosts.find(p => {
        const diffMinutes = Math.abs(new Date(p.publishAt).getTime() - publishDate.getTime()) / (1000 * 60);
        return diffMinutes < MIN_MINUTES_BETWEEN_POSTS;
    });

    if (conflict) {
        alert(`🛡️ ALERTA DE SPAM\n\nEl sistema requiere al menos ${MIN_MINUTES_BETWEEN_POSTS} minutos entre publicaciones.`);
        return false;
    }

    return true;
  };

  // --- POST HANDLING ---

  const handleSchedulePost = useCallback((post: Post, schedule: ScheduleOptions, targets: FacebookTarget[]) => {
    if (!isFacebookLinked) return; 
    
    const firstPublishAt = calculateNextPublishTime(schedule);
    if (!validateSafeScheduling(firstPublishAt)) return;

    const newScheduledPost: ScheduledPost = {
      id: Date.now(),
      post,
      schedule,
      status: PostStatus.SCHEDULED,
      publishAt: firstPublishAt,
      targets
    };
    setScheduledPosts(prev => [...prev, newScheduledPost].sort((a, b) => new Date(a.publishAt).getTime() - new Date(b.publishAt).getTime()));
    setView('CONTENT');
    
    // Solicitar permiso si aún no lo tiene al programar
    requestNotificationPermission();

  }, [isFacebookLinked, scheduledPosts, history]);

  const handlePostNow = useCallback(async (post: Post, targets: FacebookTarget[]) => {
    if (!isFacebookLinked) return;
    if (!validateSafeScheduling(new Date())) return;

    const newPost: ScheduledPost = {
      id: Date.now(),
      post,
      schedule: { type: ScheduleType.INTERVAL, frequencyMinutes: 0, randomize: false },
      status: PostStatus.PUBLISHING,
      publishAt: new Date(),
      targets
    };

    setHistory(prev => [newPost, ...prev]);
    setView('CONTENT');

    try {
      await postToFacebook(post, targets.map(t => t.id));
      setHistory(prev => prev.map(p => p.id === newPost.id ? { ...p, status: PostStatus.PUBLISHED } : p));
      sendNotification("Publicación Exitosa", `Tu post se ha publicado correctamente en ${targets.length} destinos.`, "success");
    } catch (error) {
      console.error("Error al publicar:", error);
      setHistory(prev => prev.map(p => p.id === newPost.id ? { ...p, status: PostStatus.FAILED } : p));
      sendNotification("Error de Publicación", `Hubo un problema al publicar tu contenido. Revisa el panel de historial.`, "error");
    }
  }, [isFacebookLinked, history, scheduledPosts]); 

  // EFFECT LOOP: CHECK SCHEDULED POSTS
  useEffect(() => {
    if (!isFacebookLinked) return;
    const interval = setInterval(() => {
      const now = new Date();
      scheduledPosts.forEach(async (p) => {
        if (p.status === PostStatus.SCHEDULED && new Date(p.publishAt) <= now) {
          setScheduledPosts(prev => prev.map(sp => sp.id === p.id ? {...sp, status: PostStatus.PUBLISHING} : sp));
          const historyPost = { ...p, status: PostStatus.PUBLISHING, publishAt: new Date() };
          setHistory(prev => [historyPost, ...prev]);

          try {
            await postToFacebook(p.post, p.targets.map(t => t.id));
            
            // Success
            setHistory(prev => prev.map(hp => hp.id === historyPost.id ? { ...hp, status: PostStatus.PUBLISHED } : hp));
            sendNotification("Publicación Automática Exitosa", `Tu post programado se ha publicado correctamente.`, "success");

            // Reschedule if recurring (Interval) or find next slot (Days)
            // Note: For specific days, calculateNextPublishTime finds the next valid slot in future
            const nextPublishAt = calculateNextPublishTime(p.schedule, new Date());
            
            // If next time is valid and user wants repetition (Assuming interval or recurring logic desired)
            // For this app logic, we reschedule the item back into scheduledPosts
            setScheduledPosts(prev => prev.map(sp => sp.id === p.id ? { ...sp, status: PostStatus.SCHEDULED, publishAt: nextPublishAt } : sp).sort((a, b) => new Date(a.publishAt).getTime() - new Date(b.publishAt).getTime()));

          } catch (error) {
            // Failure
            setHistory(prev => prev.map(hp => hp.id === historyPost.id ? { ...hp, status: PostStatus.FAILED } : hp));
            setScheduledPosts(prev => prev.map(sp => sp.id === p.id ? {...sp, status: PostStatus.FAILED} : sp));
            sendNotification("Fallo en Publicación Automática", `Un post programado no se pudo publicar.`, "error");
          }
        }
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [scheduledPosts, isFacebookLinked]);

  const handleViewChange = (newView: AppView) => {
      setView(newView);
      setIsMobileMenuOpen(false);
  };

  const renderView = () => {
    switch(view) {
      case 'DASHBOARD':
        return <Dashboard scheduledPosts={scheduledPosts} history={history} createPost={() => handleViewChange('CREATE')} isFacebookLinked={isFacebookLinked} />;
      case 'CREATE':
        return <CreatePost onPostNow={handlePostNow} onSchedulePost={handleSchedulePost} isFacebookLinked={isFacebookLinked} availableTargets={availableTargets} />;
      case 'CONTENT':
        return <Content scheduledPosts={scheduledPosts} history={history} isFacebookLinked={isFacebookLinked} />;
      default:
        return <Dashboard scheduledPosts={scheduledPosts} history={history} createPost={() => handleViewChange('CREATE')} isFacebookLinked={isFacebookLinked} />;
    }
  }

  if (!isFacebookLinked) {
      return (
        <LoginPage 
            onLoginFacebook={handleLinkFacebook} 
            isLoggingInFacebook={isLinking}
        />
      );
  }

  return (
    <div className="h-[100dvh] bg-slate-900 text-slate-200 font-sans flex overflow-hidden">
      {isSubscriptionModalOpen && <SubscriptionModal onClose={() => setIsSubscriptionModalOpen(false)} />}
      {showWelcomeModal && <WelcomeTutorialModal onStartTutorial={handleStartTutorial} onSkip={handleSkipTutorial} />}
      
      <Navigation 
        currentView={view} 
        setView={handleViewChange} 
        isFacebookLinked={isFacebookLinked} 
        isFacebookLinking={isLinking}
        onLinkFacebook={handleLinkFacebook}
        onUnlinkFacebook={handleUnlinkFacebook}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isSubscriptionOpen={isSubscriptionModalOpen}
        onToggleSubscription={() => setIsSubscriptionModalOpen(prev => !prev)}
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header view={view} onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 p-4 pb-24 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
