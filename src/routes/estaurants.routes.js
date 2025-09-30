// src/routes/restaurants.routes.js
const express = require('express');
const restaurantsController = require('../controllers/restaurants.controller');

const router = express.Router();

// CRUD 전용 엔드포인트
// 인기 맛집
router.get('/popular', restaurantsController.getPopularRestaurants);
router.get('/', restaurantsController.getRestaurants);
router.get('/:id', restaurantsController.getRestaurant);
router.post('/', restaurantsController.createRestaurant);
router.put('/:id', restaurantsController.updateRestaurant);
router.delete('/:id', restaurantsController.deleteRestaurant);

module.exports = router;