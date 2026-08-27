// BACKEND COMPLETO AUTOPUBLICADOR - Cloudflare Worker
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    // Preflight OPTIONS
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // RUTAS PRINCIPALES
    try {
      // 1. MEJORAR TEXTO (tu función original mejorada)
      if (url.pathname === "/api/improve-text" && request.method === "POST") {
        return await handleImproveText(request, env, corsHeaders);
      }

      // 2. GENERAR CONTENIDO NUEVO
      if (url.pathname === "/api/generate-content" && request.method === "POST") {
        return await handleGenerateContent(request, env, corsHeaders);
      }

      // 3. PROGRAMAR POSTS
      if (url.pathname === "/api/schedule-post" && request.method === "POST") {
        return await handleSchedulePost(request, env, corsHeaders);
      }

      // 4. ANALYTICS BÁSICOS
      if (url.pathname === "/api/analytics" && request.method === "GET") {
        return await handleAnalytics(request, env, corsHeaders);
      }

      // 5. HEALTH CHECK
      if (url.pathname === "/health" && request.method === "GET") {
        return new Response(JSON.stringify({ status: "ok", service: "autopublicador-backend" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders });

    } catch (error) {
      return new Response(JSON.stringify({ error: `Server Error: ${error.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  },
};

// 1. MEJORAR TEXTO (Tu función original mejorada)
async function handleImproveText(request, env, corsHeaders) {
  const { textToImprove, style = "professional" } = await request.json();
  
  if (!textToImprove) {
    return new Response(JSON.stringify({ error: "Texto requerido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const styles = {
    professional: "Mejora este texto de forma profesional para redes sociales:",
    casual: "Mejora este texto de forma casual y amigable:",
    viral: "Mejora este texto para que sea viral y atractivo:"
  };

  const prompt = `${styles[style] || styles.professional} "${textToImprove}"`;

  const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      stream: false,
      max_tokens: 1000
    }),
  });

  const data = await deepseekResponse.json();

  if (deepseekResponse.ok && data.choices?.[0]) {
    return new Response(JSON.stringify({ 
      success: true, 
      improvedText: data.choices[0].message.content.trim(),
      originalLength: textToImprove.length,
      improvedLength: data.choices[0].message.content.trim().length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } else {
    throw new Error(`DeepSeek API: ${deepseekResponse.status} - ${JSON.stringify(data)}`);
  }
}

// 2. GENERAR CONTENIDO DESDE CERO
async function handleGenerateContent(request, env, corsHeaders) {
  const { topic, platform = "facebook", tone = "professional" } = await request.json();
  
  if (!topic) {
    return new Response(JSON.stringify({ error: "Tema requerido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const prompt = `Genera un post para ${platform} sobre "${topic}" con un tono ${tone}. Incluye hashtags relevantes.`;

  const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      stream: false,
      max_tokens: 500
    }),
  });

  const data = await deepseekResponse.json();

  if (deepseekResponse.ok && data.choices?.[0]) {
    return new Response(JSON.stringify({ 
      success: true, 
      generatedContent: data.choices[0].message.content.trim(),
      topic: topic,
      platform: platform,
      tone: tone
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } else {
    throw new Error(`DeepSeek API: ${deepseekResponse.status} - ${JSON.stringify(data)}`);
  }
}

// 3. PROGRAMAR POSTS (placeholder - para futura integración con DB)
async function handleSchedulePost(request, env, corsHeaders) {
  const { content, scheduleTime, platforms } = await request.json();
  
  // Por ahora solo simula la programación
  // En el futuro integrar con base de datos D1
  return new Response(JSON.stringify({ 
    success: true, 
    message: "Post programado (simulación)",
    scheduledFor: scheduleTime,
    contentPreview: content.substring(0, 100) + "...",
    platforms: platforms || ["facebook"]
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

// 4. ANALYTICS BÁSICOS
async function handleAnalytics(request, env, corsHeaders) {
  // Por ahora devuelve analytics simulados
  // En el futuro integrar con base de datos D1
  return new Response(JSON.stringify({
    success: true,
    analytics: {
      totalImprovements: 150,
      totalGenerations: 75,
      averageTextLength: 245,
      mostUsedStyle: "professional",
      dailyUsage: {
        "2025-11-20": 12,
        "2025-11-21": 18,
        "2025-11-22": 15,
        "2025-11-23": 22
      }
    }
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
