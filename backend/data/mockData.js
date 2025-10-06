// backend/data/mockDataAI.js

const mockUsers = [
    {
      id: '1',
      name: 'Ana García',
      email: 'ana@example.com',
      age: 32,
      location: {
        city: 'Los Angeles',
        country: 'USA'
      },
      healthConditions: ['asthma'],
      activityLevel: 'moderate',
      preferences: {
        outdoorActivities: ['running', 'cycling'],
        exercisePreferences: ['morning', 'outdoor'],
        notificationSettings: {
          alerts: true,
          dailyReport: true,
          predictions: true
        }
      },
      transportation: 'bike',
      maskUsage: 'sometimes',
      createdAt: new Date('2025-01-15')
    },
    {
      id: '2',
      name: 'Carlos Rodríguez',
      email: 'carlos@example.com',
      age: 45,
      location: {
        city: 'New York',
        country: 'USA'
      },
      healthConditions: ['heart_disease', 'diabetes'],
      activityLevel: 'light',
      preferences: {
        outdoorActivities: ['walking'],
        exercisePreferences: ['indoor'],
        notificationSettings: {
          alerts: true,
          dailyReport: true,
          predictions: false
        }
      },
      transportation: 'bike',
      maskUsage: 'sometimes',
      createdAt: new Date('2025-02-01')
    }
  ];
  
  const mockAirQualityData = [
    {
      id: '1',
      city: 'Los Angeles',
      country: 'USA',
      aqi: 87,
      level: 'Moderate',
      pm25: 28.5,
      pm10: 45.2,
      no2: 32.1,
      o3: 55.3,
      co: 0.8,
      so2: 5.2,
      timestamp: new Date(),
      historical: [
        { date: '2025-10-04', aqi: 92 },
        { date: '2025-10-03', aqi: 78 },
        { date: '2025-10-02', aqi: 85 },
        { date: '2025-10-01', aqi: 95 },
        { date: '2025-09-30', aqi: 88 },
        { date: '2025-09-29', aqi: 82 },
        { date: '2025-09-28', aqi: 76 }
      ]
    },
    {
      id: '2',
      city: 'New York',
      country: 'USA',
      aqi: 52,
      level: 'Good',
      pm25: 15.2,
      pm10: 28.7,
      no2: 25.4,
      o3: 42.1,
      co: 0.5,
      so2: 3.8,
      timestamp: new Date(),
      historical: [
        { date: '2025-10-04', aqi: 48 },
        { date: '2025-10-03', aqi: 55 },
        { date: '2025-10-02', aqi: 50 }
      ]
    },
    {
      id: '3',
      city: 'Chicago',
      country: 'USA',
      aqi: 125,
      level: 'Unhealthy for Sensitive Groups',
      pm25: 42.8,
      pm10: 68.5,
      no2: 45.2,
      o3: 72.4,
      co: 1.2,
      so2: 8.5,
      timestamp: new Date(),
      historical: [
        { date: '2025-10-04', aqi: 118 },
        { date: '2025-10-03', aqi: 132 }
      ]
    }
  ];
  
  const mockNotifications = [
    {
      id: '1',
      userId: '1',
      type: 'alert',
      urgency: 'high',
      title: 'Alerta de calidad del aire',
      message: 'El AQI ha alcanzado niveles dañinos.',
      read: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000)
    }
  ];
  
  // Helper functions
  const findUserById = (id) => mockUsers.find(u => u.id === id);
  const findUserByEmail = (email) => mockUsers.find(u => u.email === email);
  const findAirQualityByCity = (city) => mockAirQualityData.find(d => 
    d.city.toLowerCase() === city.toLowerCase()
  );
  const getNotificationsByUserId = (userId) => 
    mockNotifications.filter(n => n.userId === userId);
  const getUnreadNotifications = (userId) => 
    mockNotifications.filter(n => n.userId === userId && !n.read);
  
  module.exports = {
    mockUsers,
    mockAirQualityData,
    mockNotifications,
    findUserById,
    findUserByEmail,
    findAirQualityByCity,
    getNotificationsByUserId,
    getUnreadNotifications
  };