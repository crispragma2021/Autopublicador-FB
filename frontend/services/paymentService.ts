
import { db } from './firebaseConfig';
import { collection, addDoc, onSnapshot, doc } from 'firebase/firestore';

// ⚠️ REEMPLAZA ESTO CON EL PRICE ID DE TU DASHBOARD DE STRIPE PARA PAGOS REALES
// Ejemplo: price_1Pxyz...
const STRIPE_PRICE_ID = "price_PLACEHOLDER_CAMBIAME"; 

export const startCheckoutSession = async (userId: string) => {
    const isConfigured = db && STRIPE_PRICE_ID !== "price_PLACEHOLDER_CAMBIAME";

    // ============================================================================
    // MODO SIMULACIÓN (Si no hay configuración real)
    // ============================================================================
    if (!isConfigured) {
        console.log("⚠️ No se detectó configuración de Stripe/Firebase. Iniciando MODO SIMULACIÓN DE PAGO.");
        
        // Simulamos una demora de red (como si fuera a Stripe)
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Redirigimos a la misma página con el parámetro de éxito simulado
        // Esto activará el useEffect en App.tsx que desbloquea el Plan Pro
        const successUrl = new URL(window.location.href);
        successUrl.searchParams.set('payment', 'success');
        window.location.href = successUrl.toString();
        return;
    }

    // ============================================================================
    // MODO REAL (Stripe + Firebase Extension)
    // ============================================================================
    
    // 1. Crear una referencia a la colección checkout_sessions del usuario
    const checkoutRef = collection(db, 'customers', userId, 'checkout_sessions');

    try {
        // 2. Añadir documento para iniciar la sesión
        const docRef = await addDoc(checkoutRef, {
            price: STRIPE_PRICE_ID,
            success_url: window.location.origin + '?payment=success',
            cancel_url: window.location.origin + '?payment=cancel',
            mode: 'subscription', 
        });

        console.log("Solicitud de pago creada con ID:", docRef.id);

        // 3. Escuchar cambios en el documento para obtener la URL de Stripe
        onSnapshot(doc(db, 'customers', userId, 'checkout_sessions', docRef.id), (snap) => {
            const { error, url } = snap.data() || {};
            
            if (error) {
                console.error("Error de Stripe:", error.message);
                alert(`Error: ${error.message}`);
            }
            
            if (url) {
                console.log("Redirigiendo a Stripe:", url);
                window.location.assign(url);
            }
        });

    } catch (error) {
        console.error("Error iniciando checkout real:", error);
        // Si falla la conexión real, hacemos fallback a simulación para no bloquear al usuario
        alert("Error conectando con pasarela de pago real. Activando modo prueba.");
        window.location.reload();
    }
};
