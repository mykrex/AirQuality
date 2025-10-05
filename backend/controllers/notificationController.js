const geminiService = require('../services/geminiService');
const { 
  findUserById, 
  findAirQualityByCity, 
  getNotificationsByUserId,
  getUnreadNotifications,
  mockNotifications 
} = require('../data/mockData');

/**
 * Obtiene todas las notificaciones de un usuario
 */
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = getNotificationsByUserId(userId);
    
    // Ordenar por fecha (más recientes primero)
    notifications.sort((a, b) => b.createdAt - a.createdAt);
    
    res.json({
      success: true,
      count: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Obtiene solo notificaciones no leídas
 */
const getUnreadUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = getUnreadNotifications(userId);
    
    res.json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Marca una notificación como leída
 */
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = mockNotifications.find(n => n.id === notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    notification.read = true;
    
    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Marca todas las notificaciones de un usuario como leídas
 */
const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = getNotificationsByUserId(userId);
    
    notifications.forEach(n => n.read = true);
    
    res.json({
      success: true,
      message: `${notifications.length} notifications marked as read`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Genera recomendaciones personalizadas usando Gemini AI
 */
const generateRecommendations = async (req, res) => {
  try {
    const { userId, city } = req.body;
    
    if (!userId || !city) {
      return res.status(400).json({
        success: false,
        error: 'userId and city are required'
      });
    }
    
    const user = findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const airQuality = findAirQualityByCity(city);
    if (!airQuality) {
      return res.status(404).json({
        success: false,
        error: 'Air quality data not found for this city'
      });
    }
    
    // Preparar datos para Gemini
    const airQualityData = {
      aqi: airQuality.aqi,
      pm25: airQuality.pm25,
      pm10: airQuality.pm10,
      level: airQuality.level,
      location: airQuality.city
    };
    
    const userProfile = {
      name: user.name,
      age: user.age,
      healthConditions: user.healthConditions,
      activityLevel: user.activityLevel,
      preferences: user.preferences.outdoorActivities
    };
    
    // Generar recomendaciones con IA
    const recommendations = await geminiService.generateRecommendations(
      airQualityData, 
      userProfile
    );
    
    // Crear notificación
    const notification = {
      id: String(mockNotifications.length + 1),
      userId: userId,
      type: 'recommendation',
      urgency: recommendations.urgency,
      title: 'Recomendaciones personalizadas',
      message: recommendations.summary,
      recommendations: recommendations.recommendations.map(r => r.title),
      detailedRecommendations: recommendations.recommendations,
      metadata: {
        shouldGoOutside: recommendations.shouldGoOutside,
        bestTimeToday: recommendations.bestTimeToday,
        nextCheck: recommendations.nextCheck
      },
      read: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
    };
    
    mockNotifications.push(notification);
    
    res.json({
      success: true,
      data: {
        notification,
        fullRecommendations: recommendations
      }
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Genera predicciones del aire con Gemini AI
 */
const generatePredictions = async (req, res) => {
  try {
    const { userId, city } = req.body;
    
    const user = findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const airQuality = findAirQualityByCity(city);
    if (!airQuality) {
      return res.status(404).json({
        success: false,
        error: 'Air quality data not found'
      });
    }
    
    // Generar predicciones
    const predictions = await geminiService.predictAirQuality(
      {
        aqi: airQuality.aqi,
        pm25: airQuality.pm25,
        pm10: airQuality.pm10,
        level: airQuality.level
      },
      airQuality.historical,
      airQuality.city
    );
    
    // Crear notificación de predicción
    const notification = {
      id: String(mockNotifications.length + 1),
      userId: userId,
      type: 'prediction',
      urgency: 'low',
      title: 'Pronóstico de calidad del aire',
      message: `Tendencia: ${predictions.trend}. Confianza: ${predictions.confidence}%`,
      predictions: predictions.predictions,
      metadata: {
        trend: predictions.trend,
        factors: predictions.factors,
        confidence: predictions.confidence
      },
      read: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
    
    mockNotifications.push(notification);
    
    res.json({
      success: true,
      data: {
        notification,
        predictions
      }
    });
  } catch (error) {
    console.error('Error generating predictions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Genera alertas urgentes si las condiciones son peligrosas
 */
const checkAndGenerateAlerts = async (req, res) => {
  try {
    const { userId, city } = req.body;
    
    const user = findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const airQuality = findAirQualityByCity(city);
    if (!airQuality) {
      return res.status(404).json({
        success: false,
        error: 'Air quality data not found'
      });
    }
    
    // Generar alerta con IA
    const alertMessage = await geminiService.generateAlert(
      {
        aqi: airQuality.aqi,
        level: airQuality.level,
        pm25: airQuality.pm25
      },
      {
        healthConditions: user.healthConditions,
        age: user.age,
        activityLevel: user.activityLevel
      }
    );
    
    // Si no hay alerta necesaria, retornar null
    if (!alertMessage) {
      return res.json({
        success: true,
        alert: null,
        message: 'No alerts needed at this time'
      });
    }
    
    // Crear notificación de alerta
    const notification = {
      id: String(mockNotifications.length + 1),
      userId: userId,
      type: 'alert',
      urgency: airQuality.aqi > 150 ? 'high' : 'medium',
      title: '⚠️ Alerta de calidad del aire',
      message: alertMessage,
      airQuality: {
        aqi: airQuality.aqi,
        level: airQuality.level,
        city: airQuality.city
      },
      read: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 horas
    };
    
    mockNotifications.push(notification);
    
    res.json({
      success: true,
      alert: notification
    });
  } catch (error) {
    console.error('Error generating alert:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Elimina una notificación
 */
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const index = mockNotifications.findIndex(n => n.id === notificationId);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    mockNotifications.splice(index, 1);
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getUserNotifications,
  getUnreadUserNotifications,
  markAsRead,
  markAllAsRead,
  generateRecommendations,
  generatePredictions,
  checkAndGenerateAlerts,
  deleteNotification
}