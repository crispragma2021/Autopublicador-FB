
import { db } from './firebaseConfig';
import { collection, addDoc, onSnapshot, doc } from 'firebase/firestore';

// ⚠️ REEMPLAZA ESTO CON EL PRICE ID DE TU DASHBOARD DE STRIPE
// Ejemplo: price_1Pxyz...
const STRIPE_PRICE_ID = "price_PLACEHOLDER_CAMBIAME"; 

export const startCheckoutSession = async (userId: string) => {
    if (!db) {
        throw new Error("Firebase no está configurado. Revisa services/firebaseConfig.ts");
    }

    if (STRIPE_PRICE_ID === "price_PLACEHOLDER_CAMBIAME") {
        alert("⚠️ CONFIGURACIÓN INCOMPLETA\n\nEl desarrollador debe añadir el STRIPE_PRICE_ID en services/paymentService.ts");
        throw new Error("Stripe Price ID no configurado");
    }

    // 1. Crear una referencia a la colección checkout_sessions del usuario
    // La extensión de Stripe "escucha" esta colección y procesa la solicitud.
    const checkoutRef = collection(db, 'customers', userId, 'checkout_sessions');

    try {
        // 2. Añadir documento para iniciar la sesión
        const docRef = await addDoc(checkoutRef, {
            price: STRIPE_PRICE_ID,
            success_url: window.location.origin + '?payment=success',
            cancel_url: window.location.origin + '?payment=cancel',
            mode: 'subscription', // O 'payment' si es pago único
        });

        console.log("Solicitud de pago creada con ID:", docRef.id);

        // 3. Escuchar cambios en el documento. La extensión escribirá la URL de redirección o un error.
        onSnapshot(doc(db, 'customers', userId, 'checkout_sessions', docRef.id), (snap) => {
            const { error, url } = snap.data() || {};
            
            if (error) {
                // Mostrar error al usuario
                console.error("Error de Stripe:", error.message);
                alert(`Error: ${error.message}`);
            }
            
            if (url) {
                // 4. Redirigir al usuario a la página de pago de Stripe
                console.log("Redirigiendo a Stripe:", url);
                window.location.assign(url);
            }
        });

    } catch (error) {
        console.error("Error iniciando checkout:", error);
        throw error;
    }
};
