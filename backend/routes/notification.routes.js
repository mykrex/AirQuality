const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Obtener notificaciones
router.get('/user/:userId', notificationController.getUserNotifications);
router.get('/user/:userId/unread', notificationController.getUnreadUserNotifications);

// Marcar como leída
router.patch('/:notificationId/read', notificationController.markAsRead);
router.patch('/user/:userId/read-all', notificationController.markAllAsRead);

// Generar notificaciones con IA
router.post('/generate/recommendations', notificationController.generateRecommendations);
router.post('/generate/predictions', notificationController.generatePredictions);
router.post('/generate/alerts', notificationController.checkAndGenerateAlerts);

// Eliminar notificación
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;