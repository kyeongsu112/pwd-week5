// src/controllers/submissions.controller.js
const submissionsService = require('../services/submissions.service');
const restaurantsService = require('../services/restaurants.service');
const asyncHandler = require('../utils/asyncHandler');

const normaliseMenu = (menu) => {
  if (!menu) return [];
  if (Array.isArray(menu)) return menu;
  if (typeof menu === 'string') {
    return menu.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

// 목록 조회
exports.list = asyncHandler(async (req, res) => {
  const items = await submissionsService.listSubmissions(req.query.status);
  res.json({ data: items });
});

// 단일 조회
exports.get = asyncHandler(async (req, res) => {
  const item = await submissionsService.getSubmissionById(req.params.id);
  if (!item) return res.status(404).json({ error: { message: 'Submission not found' } });
  res.json({ data: item });
});

// 제보 생성
exports.create = asyncHandler(async (req, res) => {
  const payload = {
    restaurantName: req.body.restaurantName,
    category: req.body.category,
    location: req.body.location,
    priceRange: req.body.priceRange ?? '',
    recommendedMenu: normaliseMenu(req.body.recommendedMenu),
    review: req.body.review ?? '',
    submitterName: req.body.submitterName ?? '',
    submitterEmail: req.body.submitterEmail ?? '',
    status: 'pending',
  };

  const required = ['restaurantName', 'category', 'location'];
  const missing = required.find((k) => !payload[k]);
  if (missing) {
    res.status(400).json({ error: { message: `'${missing}' is required` } });
    return;
  }

  const created = await submissionsService.createSubmission(payload);
  res.status(201).json({ data: created });
});

// 제보 수정 (승인/거절/업데이트)
exports.update = asyncHandler(async (req, res) => {
  // 기존 submission 불러오기
  const existing = await submissionsService.getSubmissionById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: { message: 'Submission not found' } });
  }

  // 기존 데이터 + 새 데이터 병합
  const payload = {
    restaurantName: req.body.restaurantName ?? existing.restaurantName,
    category: req.body.category ?? existing.category,
    location: req.body.location ?? existing.location,
    priceRange: req.body.priceRange ?? existing.priceRange,
    recommendedMenu: Array.isArray(req.body.recommendedMenu)
      ? req.body.recommendedMenu
      : existing.recommendedMenu,
    review: req.body.review ?? existing.review,
    submitterName: req.body.submitterName ?? existing.submitterName,
    submitterEmail: req.body.submitterEmail ?? existing.submitterEmail,
    status: req.body.status ?? existing.status,
    restaurantId: existing.restaurantId,
  };

  // 승인 시 → restaurant 생성 (이미 생성된 경우는 건너뜀)
  if (payload.status === 'approved' && !payload.restaurantId) {
    const restaurant = await restaurantsService.createRestaurant({
      name: payload.restaurantName,
      category: payload.category,
      location: payload.location,
      priceRange: payload.priceRange,
      description: payload.review,
      recommendedMenu: payload.recommendedMenu,
    });
    payload.restaurantId = restaurant.id;
  }

  // 거절 시 → 연결된 restaurant 자동 삭제
  if (payload.status === 'rejected' && payload.restaurantId) {
    await restaurantsService.deleteRestaurantById(payload.restaurantId);
    payload.restaurantId = null;
  }

  const updated = await submissionsService.updateSubmission(req.params.id, payload);
  res.json({ data: updated });
});

// 제보 삭제
exports.remove = asyncHandler(async (req, res) => {
  const existing = await submissionsService.getSubmissionById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: { message: 'Submission not found' } });
  }

  // 승인된 제보 → restaurant도 같이 삭제
  if (existing.restaurantId) {
    await restaurantsService.deleteRestaurantById(existing.restaurantId);
  }

  await submissionsService.deleteSubmission(req.params.id);
  res.status(204).send();
});
