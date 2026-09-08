# ⚡ Publicador IA para Redes Sociales (Facebook Auto-Publisher)

Aplicación web para crear contenido optimizado con Inteligencia Artificial y programar publicaciones automáticas en Facebook (Páginas y Grupos) con protección anti-baneo.

---

## 🚀 Características Principales

- **🤖 Generación con IA:**
  - **Textos / Copys:** Generación de publicaciones estructuradas (gancho, contenido, llamada a la acción y hashtags) con 6 tonos distintos utilizando Google Gemini.
  - **Imágenes:** Generación fotográfica e ilustraciones ilimitadas y gratuitas mediante Pollinations.ai (Flux).
  - **Videos:** Generación de videos verticales (9:16) con Google Veo.
- **👁️ Previsualización Realista:** Vista previa en tiempo real estilo Facebook Dark Mode con edición directa de texto.
- **📢 Publicación en Facebook:**
  - Integración oficial con Facebook Graph API (SDK) para publicar en Páginas conectadas.
  - Modo simulación para pruebas locales sin requerir App ID.
- **🛡️ Sistema Anti-Baneo y Programación Inteligente:**
  - Programación por intervalos o por días/horas concretas.
  - Límite diario de seguridad (máx. 20 posts/día).
  - Espaciado mínimo (30 min) y variación aleatoria de horario (*jitter* ±5 min).
  - Publicador automático en segundo plano en tiempo real.
- **📊 Panel de Control y Calendario:** Métricas de rendimiento, calendario mensual interactivo e historial de publicaciones.

---

## 🛠️ Instalación y Uso Local

### Requisitos previos
- **Node.js** (versión 18 o superior)
- **npm**

### Pasos

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno (Opcional):**
   Copia el archivo `.env.example` a `.env.local` y añade tu clave de Gemini:
   ```bash
   cp .env.example .env.local
   ```
   *Edita `.env.local` y coloca tu `GEMINI_API_KEY`.*

3. **Configurar Facebook App ID (Opcional para modo real):**
   En `App.tsx`, introduce tu ID de aplicación de Facebook en la constante:
   ```typescript
   const FACEBOOK_APP_ID = 'TU_APP_ID_AQUI';
   ```
   *(Si se deja vacío, la aplicación funcionará automáticamente en Modo Simulación / Demo).*

4. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

5. **Construir para producción:**
   ```bash
   npm run build
   ```
