// src/services/restaurants.service.js
const Restaurant = require('../models/restaurant.model');

async function getAllRestaurants() {
  return await Restaurant.find().sort({ createdAt: -1 }).lean();
}

async function getRestaurantById(id) {
  const numericId = Number(id);
  return await Restaurant.findOne({ id: numericId }).lean();
}

async function getPopularRestaurants(limit = 5) {
  return await Restaurant.find().sort({ rating: -1 }).limit(limit).lean();
}

async function getNextRestaurantId() {
  const max = await Restaurant.findOne().sort('-id').select('id').lean();
  return (max?.id || 0) + 1;
}

async function createRestaurant(payload) {
  const requiredFields = ['name', 'category', 'location'];
  const missing = requiredFields.find((f) => !payload[f]);
  if (missing) {
    const err = new Error(`'${missing}' is required`);
    err.statusCode = 400;
    throw err;
  }

  const nextId = await getNextRestaurantId();
  const doc = await Restaurant.create({
    id: nextId,
    name: payload.name,
    category: payload.category,
    location: payload.location,
    priceRange: payload.priceRange ?? '정보 없음',
    rating: payload.rating ?? 0,
    description: payload.description ?? '',
    recommendedMenu: payload.recommendedMenu ?? [],
    likes: 0,
    image: payload.image ?? ''
  });

  return doc.toObject();
}

async function updateRestaurant(id, payload) {
  const numericId = Number(id);
  return await Restaurant.findOneAndUpdate(
    { id: numericId },
    { $set: payload },
    { new: true, runValidators: true, lean: true }
  );
}

async function deleteRestaurant(id) {
  const numericId = Number(id);
  return await Restaurant.findOneAndDelete({ id: numericId }).lean();
}

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  getPopularRestaurants,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
};
