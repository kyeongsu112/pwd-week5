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

// 제보 목록 조회
exports.list = asyncHandler(async (req, res) => {
  const items = await submissionsService.listSubmissions(req.query.status);
  res.json({ data: items });
});

// 특정 제보 조회
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

// 제보 업데이트 (승인/거절 포함)
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

  const updated = await submissionsService.updateSubmission(req.params.id, payload);
  if (!updated) return res.status(404).json({ error: { message: 'Submission not found' } });

  // ✅ 승인된 경우 restaurants에 추가 (submissions은 그대로 유지)
  if (req.body.status === 'approved') {
    const restaurantPayload = {
      name: updated.restaurantName,
      category: updated.category,
      location: updated.location,
      priceRange: updated.priceRange || '정보 없음',
      description: updated.review || '',
      recommendedMenu: updated.recommendedMenu || [],
    };
    await restaurantService.createRestaurant(restaurantPayload);
  }

  res.json({ data: updated });
});

// 제보 삭제
exports.remove = asyncHandler(async (req, res) => {
  const deleted = await submissionsService.deleteSubmission(req.params.id);
  if (!deleted) return res.status(404).json({ error: { message: 'Submission not found' } });
  res.status(204).send();
});
