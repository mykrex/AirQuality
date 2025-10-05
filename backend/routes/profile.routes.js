const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// CRUD de perfil
router.get('/:userId', profileController.getUserProfile);
router.post('/', profileController.createUserProfile);
router.put('/:userId', profileController.updateUserProfile);
router.delete('/:userId', profileController.deleteUserProfile);

// Configuración de notificaciones
router.patch('/:userId/notifications', profileController.updateNotificationSettings);

// Condiciones de salud
router.post('/:userId/health-conditions', profileController.addHealthCondition);
router.delete('/:userId/health-conditions/:condition', profileController.removeHealthCondition);

module.exports = router;