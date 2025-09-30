const submissionsService = require('../services/submissions.service');
const restaurantService = require('../services/restaurants.service');
const asyncHandler = require('../utils/asyncHandler');

const normaliseMenu = (menu) => {
  if (!menu) return [];
  if (Array.isArray(menu)) return menu;
  if (typeof menu === 'string') {
    return menu.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

exports.list = asyncHandler(async (req, res) => {
  const items = await submissionsService.listSubmissions(req.query.status);
  res.json({ data: items });
});

exports.get = asyncHandler(async (req, res) => {
  const item = await submissionsService.getSubmissionById(req.params.id);
  if (!item) return res.status(404).json({ error: { message: 'Submission not found' } });
  res.json({ data: item });
});

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

exports.update = asyncHandler(async (req, res) => {
  const payload = {
    restaurantName: req.body.restaurantName,
    category: req.body.category,
    location: req.body.location,
    priceRange: req.body.priceRange,
    review: req.body.review,
    submitterName: req.body.submitterName,
    submitterEmail: req.body.submitterEmail,
    status: req.body.status,
  };

  if (Array.isArray(req.body.recommendedMenu)) {
    payload.recommendedMenu = req.body.recommendedMenu;
  }

  // undefined 제거
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

  const updated = await submissionsService.updateSubmission(req.params.id, payload);

  if (!updated) {
    return res.status(404).json({ error: { message: 'Submission not found' } });
  }

  // ✅ 승인 → 레스토랑 추가
  if (payload.status === 'approved') {
    await restaurantService.createRestaurant({
      name: updated.restaurantName,
      category: updated.category,
      location: updated.location,
      priceRange: updated.priceRange || '정보 없음',
      description: updated.review || '',
      recommendedMenu: updated.recommendedMenu || [],
    });
  }

  // ✅ 거절 → 기존 레스토랑 삭제
  if (payload.status === 'rejected') {
    await restaurantService.deleteRestaurantByName(updated.restaurantName);
  }

  res.json({ data: updated });
});

exports.remove = asyncHandler(async (req, res) => {
  const deleted = await submissionsService.deleteSubmission(req.params.id);
  if (!deleted) return res.status(404).json({ error: { message: 'Submission not found' } });

  // 삭제 시 레스토랑도 같이 삭제
  await restaurantService.deleteRestaurantByName(deleted.restaurantName);

  res.json({ data: deleted });
});
