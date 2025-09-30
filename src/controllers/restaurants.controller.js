const restaurantService = require('../services/restaurants.service');
const asyncHandler = require('../utils/asyncHandler');

// 전체 레스토랑 조회
exports.getRestaurants = asyncHandler(async (req, res) => {
  const restaurants = await restaurantService.getAllRestaurants();
  res.json({ data: restaurants });
});

// 단일 레스토랑 조회
exports.getRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await restaurantService.getRestaurantById(req.params.id);
  if (!restaurant) {
    return res.status(404).json({ error: { message: 'Restaurant not found' } });
  }
  res.json({ data: restaurant });
});

// 인기 레스토랑 조회
exports.getPopularRestaurants = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 5;
  const restaurants = await restaurantService.getPopularRestaurants(limit);
  res.json({ data: restaurants });
});

// 레스토랑 생성
exports.createRestaurant = asyncHandler(async (req, res) => {
  const payload = {
    name: req.body.name,
    category: req.body.category,
    location: req.body.location,
    priceRange: req.body.priceRange,
    rating: req.body.rating,
    description: req.body.description,
    recommendedMenu: req.body.recommendedMenu,
    image: req.body.image,
  };

  const created = await restaurantService.createRestaurant(payload);
  res.status(201).json({ data: created });
});

// 레스토랑 수정
exports.updateRestaurant = asyncHandler(async (req, res) => {
  const updated = await restaurantService.updateRestaurant(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: { message: 'Restaurant not found' } });
  }
  res.json({ data: updated });
});

// 레스토랑 삭제
exports.deleteRestaurant = asyncHandler(async (req, res) => {
  const deleted = await restaurantService.deleteRestaurant(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: { message: 'Restaurant not found' } });
  }
  res.status(204).send();
});
