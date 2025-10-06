const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }

  /**
   * Genera recomendaciones personalizadas basadas en calidad del aire y perfil de usuario
   */
  async generateRecommendations(airQualityData, userProfile) {
    const prompt = this.buildPrompt(airQualityData, userProfile);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseResponse(text);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Failed to generate AI recommendations');
    }
  }

  /**
   * Predice condiciones futuras del aire
   */
  async predictAirQuality(currentData, historicalData, location) {
    const prompt = `
Analiza los siguientes datos de calidad del aire y genera una predicción para las próximas 24 horas:

**Datos actuales en ${location}:**
- AQI: ${currentData.aqi}
- PM2.5: ${currentData.pm25}
- PM10: ${currentData.pm10}
- Nivel: ${currentData.level}

**Datos históricos (últimos 7 días):**
${historicalData.map(d => `- ${d.date}: AQI ${d.aqi}`).join('\n')}

Proporciona:
1. Predicción del AQI para las próximas 6, 12 y 24 horas
2. Tendencia esperada (mejorando/empeorando/estable)
3. Factores que podrían influir
4. Nivel de confianza de la predicción (%)

Responde en formato JSON:
{
  "predictions": [
    {"hours": 6, "aqi": number, "level": "string"},
    {"hours": 12, "aqi": number, "level": "string"},
    {"hours": 24, "aqi": number, "level": "string"}
  ],
  "trend": "string",
  "factors": ["string"],
  "confidence": number
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extraer JSON de la respuesta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error predicting air quality:', error);
      throw new Error('Failed to generate predictions');
    }
  }

  /**
   * Genera alertas urgentes basadas en condiciones críticas
   */
  async generateAlert(airQualityData, userProfile) {
    const { aqi, level } = airQualityData;
    const { healthConditions, age, activityLevel, transportation, maskUsage } = userProfile;

    // Solo generar alertas si AQI > 100 o si usuario tiene condiciones de salud
    if (aqi < 100 && (!healthConditions || healthConditions.length === 0)) {
      return null;
    }

    const prompt = `
Genera una alerta de salud urgente para:

**Condiciones del aire:**
- AQI: ${aqi} (${level})
- Calidad: ${this.getAirQualityDescription(aqi)}

**Perfil del usuario:**
- Edad: ${age} años
- Condiciones de salud: ${healthConditions?.join(', ') || 'Ninguna'}
- Nivel de actividad: ${activityLevel}
- Transporte habitual: ${this.getTransportationLabel(transportation)}
- Uso de mascarilla: ${this.getMaskUsageLabel(maskUsage)}

Genera una alerta CONCISA (máximo 2-3 oraciones) que:
1. Explique el riesgo específico para esta persona considerando su medio de transporte y uso de protección
2. Dé una acción inmediata a tomar

Responde SOLO el texto de la alerta, sin formato adicional.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error generating alert:', error);
      return null;
    }
  }

  /**
   * Construye el prompt para recomendaciones personalizadas
   */
  buildPrompt(airQualityData, userProfile) {
    const { aqi, pm25, pm10, level, location } = airQualityData;
    const { 
      name, 
      age, 
      healthConditions, 
      activityLevel, 
      preferences,
      transportation,
      maskUsage 
    } = userProfile;

    return `
Eres un experto en salud ambiental. Analiza estos datos y genera recomendaciones personalizadas:

**Calidad del aire en ${location}:**
- AQI: ${aqi} (${level})
- PM2.5: ${pm25} µg/m³
- PM10: ${pm10} µg/m³

**Perfil del usuario:**
- Nombre: ${name}
- Edad: ${age} años
- Condiciones de salud: ${healthConditions?.join(', ') || 'Ninguna'}
- Nivel de actividad: ${activityLevel}
- Actividades preferidas: ${preferences?.join(', ') || 'General'}
- Medio de transporte: ${this.getTransportationLabel(transportation)}
- Uso de mascarilla: ${this.getMaskUsageLabel(maskUsage)}

**Análisis de exposición:**
${this.getExposureAnalysis(transportation, maskUsage, aqi)}

Genera recomendaciones en formato JSON con esta estructura:
{
  "urgency": "low|medium|high",
  "summary": "Resumen breve (1 oración)",
  "recommendations": [
    {
      "category": "transportation|activity|health|indoor|outdoor|protection",
      "title": "Título corto",
      "description": "Descripción detallada considerando su medio de transporte y uso de protección",
      "priority": "low|medium|high"
    }
  ],
  "shouldGoOutside": boolean,
  "bestTimeToday": "HH:MM - HH:MM o 'No recomendado'",
  "nextCheck": "Cuándo volver a revisar (ej: 'en 2 horas')",
  "transportationAdvice": "Consejo específico sobre el medio de transporte que usa",
  "protectionAdvice": "Consejo sobre protección (mascarilla) basado en su uso actual"
}

Sé específico y considera:
- Su medio de transporte (${this.getTransportationLabel(transportation)}) afecta su exposición
- Su uso de mascarilla (${this.getMaskUsageLabel(maskUsage)}) es un factor de protección importante
- Las condiciones de salud del usuario
- El nivel de AQI actual

Las recomendaciones deben ser prácticas y accionables.
`;
  }

  /**
   * Analiza el nivel de exposición según transporte y protección
   */
  getExposureAnalysis(transportation, maskUsage, aqi) {
    let exposure = 'moderada';
    let risk = 'medio';

    // Calcular exposición según transporte
    if (transportation === 'bike' || transportation === 'walking') {
      exposure = 'alta';
      risk = 'alto';
    } else if (transportation === 'public') {
      exposure = 'moderada-alta';
      risk = 'medio-alto';
    } else if (transportation === 'car') {
      exposure = 'baja-moderada';
      risk = 'bajo-medio';
    }

    // Ajustar según uso de mascarilla
    if (maskUsage === 'always') {
      risk = risk.replace('alto', 'medio').replace('medio', 'bajo');
    } else if (maskUsage === 'never' && aqi > 100) {
      risk = risk.replace('bajo', 'medio').replace('medio', 'alto');
    }

    return `
- Exposición estimada: ${exposure} (debido a uso de ${this.getTransportationLabel(transportation)})
- Nivel de riesgo: ${risk}
- Protección actual: ${maskUsage === 'always' ? 'Adecuada' : maskUsage === 'sometimes' ? 'Parcial' : 'Insuficiente'}
${aqi > 100 && maskUsage === 'never' ? '- ⚠️ Se recomienda fuertemente el uso de mascarilla con este nivel de AQI' : ''}
`;
  }

  /**
   * Obtiene etiqueta de transporte
   */
  getTransportationLabel(transportation) {
    const labels = {
      car: 'Auto (exposición reducida)',
      bike: 'Bicicleta (alta exposición)',
      walking: 'Caminando (alta exposición directa)',
      public: 'Transporte público (exposición moderada)'
    };
    return labels[transportation] || transportation;
  }

  /**
   * Obtiene etiqueta de uso de mascarilla
   */
  getMaskUsageLabel(maskUsage) {
    const labels = {
      never: 'Nunca usa mascarilla',
      sometimes: 'Usa mascarilla ocasionalmente',
      always: 'Siempre usa mascarilla'
    };
    return labels[maskUsage] || maskUsage;
  }

  /**
   * Parsea la respuesta de Gemini a JSON
   */
  parseResponse(text) {
    try {
      // Extraer JSON de la respuesta (puede venir con texto adicional)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      // Retornar respuesta por defecto
      return {
        urgency: "medium",
        summary: "Revisa las condiciones actuales del aire",
        recommendations: [
          {
            category: "general",
            title: "Monitorea la calidad del aire",
            description: "Mantente informado sobre las condiciones actuales",
            priority: "medium"
          }
        ],
        shouldGoOutside: true,
        bestTimeToday: "Consulta el pronóstico local",
        nextCheck: "en 1 hora",
        transportationAdvice: "Considera tu medio de transporte habitual",
        protectionAdvice: "Evalúa el uso de mascarilla según las condiciones"
      };
    }
  }

  /**
   * Obtiene descripción textual del nivel de AQI
   */
  getAirQualityDescription(aqi) {
    if (aqi <= 50) return "Buena - El aire es satisfactorio";
    if (aqi <= 100) return "Moderada - Aceptable para la mayoría";
    if (aqi <= 150) return "Dañina para grupos sensibles";
    if (aqi <= 200) return "Dañina para la salud";
    if (aqi <= 300) return "Muy dañina";
    return "Peligrosa - Alerta de salud";
  }
}

module.exports = new GeminiService();