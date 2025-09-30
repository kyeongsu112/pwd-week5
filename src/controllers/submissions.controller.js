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
    recommendedMenu: Array.isArray(req.body.recommendedMenu) ? req.body.recommendedMenu : undefined,
    review: req.body.review,
    submitterName: req.body.submitterName,
    submitterEmail: req.body.submitterEmail,
    status: req.body.status,
  };

  // ✅ 승인된 경우 restaurant 생성 후 ID 저장
  if (payload.status === 'approved') {
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

  const updated = await submissionsService.updateSubmission(req.params.id, payload);
  if (!updated) return res.status(404).json({ error: { message: 'Submission not found' } });
  res.json({ data: updated });
});

exports.remove = asyncHandler(async (req, res) => {
  const deleted = await submissionsService.deleteSubmission(req.params.id);
  if (!deleted) return res.status(404).json({ error: { message: 'Submission not found' } });

  // ✅ 승인된 submission이었다면 restaurant도 삭제
  if (deleted.status === 'approved' && deleted.restaurantId) {
    await restaurantsService.deleteRestaurantById(deleted.restaurantId);
  }

  res.status(204).send();
});
