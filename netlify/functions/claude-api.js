const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { input, conversation, currentItems } = JSON.parse(event.body);

    // Determinar si el usuario quiere crear una lista o solo conversar
    const lowerInput = input.toLowerCase();
    const isListRequest = lowerInput.includes('necesito') || 
                         lowerInput.includes('quiero') || 
                         lowerInput.includes('comprar') ||
                         lowerInput.includes('kilos') ||
                         lowerInput.includes('panes') ||
                         /\d+/.test(input) || // Contiene números
                         lowerInput.includes('agrega') ||
                         lowerInput.includes('añade');

    let systemPrompt = '';
    
    if (isListRequest) {
      // Usuario quiere crear/agregar productos
      systemPrompt = `Eres un asistente de compras. El usuario te está diciendo productos que necesita comprar.

Tu tarea: Convertir lo que dice en un JSON array con este formato EXACTO (sin texto adicional, sin explicaciones, SOLO el JSON):

[{"name":"Papa","quantity":"2 kilos","category":"Verduras","estimatedPrice":500}]

Categorías: Frutas, Verduras, Lácteos, Carnes, Panadería, Bebidas, Limpieza, Snacks, Otros

IMPORTANTE: Responde ÚNICAMENTE con el array JSON, nada más. Sin texto antes ni después.

Usuario dice: "${input}"`;

    } else {
      // Usuario está conversando o haciendo preguntas
      systemPrompt = `Eres un asistente amigable de compras. El usuario está conversando contigo.

Responde de forma natural, amigable y útil. NO uses JSON. Habla como una persona normal.

Si te pregunta por sugerencias o qué necesita, menciona productos específicos que podrías agregar.

Lista actual del usuario: ${currentItems.length > 0 ? currentItems.map(i => i.name).join(', ') : 'vacía'}

Usuario dice: "${input}"`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [
          { role: 'user', content: systemPrompt }
        ]
      })
    });

    const data = await response.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
