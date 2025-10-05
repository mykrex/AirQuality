const { findUserById, findUserByEmail, mockUsers } = require('../data/mockData');

/**
 * Obtiene el perfil de un usuario por ID
 */
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = findUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Crea un nuevo perfil de usuario
 */
const createUserProfile = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      age, 
      location, 
      healthConditions, 
      activityLevel,
      preferences 
    } = req.body;
    
    // Validar campos requeridos
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required'
      });
    }
    
    // Verificar si el email ya existe
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }
    
    // Crear nuevo usuario
    const newUser = {
      id: String(mockUsers.length + 1),
      name,
      email,
      age: age || null,
      location: location || { city: '', country: '' },
      healthConditions: healthConditions || [],
      activityLevel: activityLevel || 'moderate',
      preferences: {
        outdoorActivities: preferences?.outdoorActivities || [],
        exercisePreferences: preferences?.exercisePreferences || [],
        notificationSettings: {
          alerts: preferences?.notificationSettings?.alerts ?? true,
          dailyReport: preferences?.notificationSettings?.dailyReport ?? true,
          predictions: preferences?.notificationSettings?.predictions ?? false
        }
      },
      createdAt: new Date()
    };
    
    mockUsers.push(newUser);
    
    res.status(201).json({
      success: true,
      message: 'User profile created successfully',
      data: newUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Actualiza el perfil de un usuario
 */
const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    const user = findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Actualizar campos permitidos
    const allowedUpdates = [
      'name', 
      'age', 
      'location', 
      'healthConditions', 
      'activityLevel',
      'preferences'
    ];
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'preferences' && user.preferences) {
          // Merge preferences instead of replacing
          user.preferences = {
            ...user.preferences,
            ...updates.preferences,
            notificationSettings: {
              ...user.preferences.notificationSettings,
              ...(updates.preferences?.notificationSettings || {})
            }
          };
        } else {
          user[field] = updates[field];
        }
      }
    });
    
    user.updatedAt = new Date();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Actualiza configuración de notificaciones
 */
const updateNotificationSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { alerts, dailyReport, predictions } = req.body;
    
    const user = findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Actualizar settings
    if (alerts !== undefined) user.preferences.notificationSettings.alerts = alerts;
    if (dailyReport !== undefined) user.preferences.notificationSettings.dailyReport = dailyReport;
    if (predictions !== undefined) user.preferences.notificationSettings.predictions = predictions;
    
    user.updatedAt = new Date();
    
    res.json({
      success: true,
      message: 'Notification settings updated',
      data: user.preferences.notificationSettings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Agrega una condición de salud
 */
const addHealthCondition = async (req, res) => {
  try {
    const { userId } = req.params;
    const { condition } = req.body;
    
    if (!condition) {
      return res.status(400).json({
        success: false,
        error: 'Condition is required'
      });
    }
    
    const user = findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Verificar si ya existe
    if (user.healthConditions.includes(condition)) {
      return res.status(400).json({
        success: false,
        error: 'Condition already exists'
      });
    }
    
    user.healthConditions.push(condition);
    user.updatedAt = new Date();
    
    res.json({
      success: true,
      message: 'Health condition added',
      data: user.healthConditions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Elimina una condición de salud
 */
const removeHealthCondition = async (req, res) => {
  try {
    const { userId, condition } = req.params;
    
    const user = findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const index = user.healthConditions.indexOf(condition);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Condition not found'
      });
    }
    
    user.healthConditions.splice(index, 1);
    user.updatedAt = new Date();
    
    res.json({
      success: true,
      message: 'Health condition removed',
      data: user.healthConditions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Elimina el perfil de un usuario
 */
const deleteUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const index = mockUsers.findIndex(u => u.id === userId);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    mockUsers.splice(index, 1);
    
    res.json({
      success: true,
      message: 'User profile deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  updateNotificationSettings,
  addHealthCondition,
  removeHealthCondition,
  deleteUserProfile
};