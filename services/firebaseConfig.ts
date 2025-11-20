
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ⚠️ IMPORTANTE: REEMPLAZA ESTOS VALORES CON LOS DE TU CONSOLA DE FIREBASE
// Ve a Project Settings -> General -> Your apps -> SDK Setup and Configuration
const firebaseConfig = {
  apiKey: "TU_API_KEY_DE_FIREBASE",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "00000000000",
  appId: "1:00000000000:web:00000000000000"
};

// Inicializar Firebase de manera segura
let app;
let db: any = null;

try {
    // Verificación básica para no intentar conectar con credenciales placeholder vacías
    if (firebaseConfig.apiKey !== "TU_API_KEY_DE_FIREBASE") {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log("Firebase conectado correctamente.");
    } else {
        console.warn("Firebase no configurado (Usando credenciales placeholder). La app funcionará en modo local/simulación.");
    }
} catch (error) {
    console.error("Error inicializando Firebase:", error);
    // No lanzamos error para permitir que la app siga funcionando en modo simulación
}

export { db };
