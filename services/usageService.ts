
import { UserUsage, FREE_PLAN_LIMITS } from '../types';

// Prefijo base, se le añadirá el ID de usuario
const USAGE_PREFIX = 'usage_fb_';

const getTodayString = () => new Date().toISOString().split('T')[0];

// Obtener ID del usuario actual (simulado o real) desde localStorage
const getCurrentUserId = (): string => {
    return localStorage.getItem('fb_user_id') || 'guest_user';
};

export const getUserUsage = (userId?: string): UserUsage => {
    const id = userId || getCurrentUserId();
    const storageKey = `${USAGE_PREFIX}${id}`;
    const stored = localStorage.getItem(storageKey);
    const today = getTodayString();
    
    let usage: UserUsage;

    if (stored) {
        usage = JSON.parse(stored);
        // Si la fecha guardada no es hoy, reiniciamos los contadores
        if (usage.lastResetDate !== today) {
            usage = {
                textCount: 0,
                imageCount: 0,
                videoCount: 0,
                lastResetDate: today
            };
            localStorage.setItem(storageKey, JSON.stringify(usage));
        }
        // Migración para usuarios antiguos que no tengan imageCount
        if (typeof usage.imageCount === 'undefined') {
            usage.imageCount = 0;
        }
    } else {
        usage = {
            textCount: 0,
            imageCount: 0,
            videoCount: 0,
            lastResetDate: today
        };
        localStorage.setItem(storageKey, JSON.stringify(usage));
    }
    
    return usage;
};

export const incrementUsage = (type: 'text' | 'image' | 'video') => {
    const id = getCurrentUserId();
    const storageKey = `${USAGE_PREFIX}${id}`;
    const usage = getUserUsage(id);
    
    if (type === 'text') usage.textCount++;
    if (type === 'image') usage.imageCount++;
    if (type === 'video') usage.videoCount++;
    
    localStorage.setItem(storageKey, JSON.stringify(usage));
    return usage;
};

export const checkLimitReached = (type: 'text' | 'image' | 'video'): boolean => {
    const usage = getUserUsage();
    // Verificar suscripción PRO
    const isPro = localStorage.getItem('is_pro_user') === 'true';
    
    if (isPro) return false; 

    if (type === 'text') return usage.textCount >= FREE_PLAN_LIMITS.TEXT_DAILY;
    if (type === 'image') return usage.imageCount >= FREE_PLAN_LIMITS.IMAGE_DAILY;
    if (type === 'video') return usage.videoCount >= FREE_PLAN_LIMITS.VIDEO_DAILY;
    
    return false;
};

export const getRemainingCredits = () => {
    const usage = getUserUsage();
    const isPro = localStorage.getItem('is_pro_user') === 'true';
    
    if (isPro) return { text: Infinity, image: Infinity, video: Infinity, isPro: true };

    return {
        text: Math.max(0, FREE_PLAN_LIMITS.TEXT_DAILY - usage.textCount),
        image: Math.max(0, FREE_PLAN_LIMITS.IMAGE_DAILY - usage.imageCount),
        video: Math.max(0, FREE_PLAN_LIMITS.VIDEO_DAILY - usage.videoCount),
        isPro: false
    };
};
