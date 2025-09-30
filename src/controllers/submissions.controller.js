const submissionsService = require('../services/submissions.service');
const asyncHandler = require('../utils/asyncHandler');
const restaurantService = require('../services/restaurants.service');

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
  const { status } = req.body;
  const submissionId = req.params.id;

  const updated = await submissionsService.updateSubmission(submissionId, req.body);
  if (!updated) return res.status(404).json({ error: { message: 'Submission not found' } });

  // ✅ 승인 시 자동으로 restaurants에 추가하고 submissions에서 삭제
  if (status === 'approved') {
    const payload = {
      name: updated.restaurantName,
      category: updated.category,
      location: updated.location,
      priceRange: updated.priceRange || '정보 없음',
      description: updated.review || '',
      recommendedMenu: updated.recommendedMenu || [],
    };
    await restaurantService.createRestaurant(payload);
    await submissionsService.deleteSubmission(submissionId);
  }

  res.json({ data: updated });
});

exports.remove = asyncHandler(async (req, res) => {
  const deleted = await submissionsService.deleteSubmission(req.params.id);
  if (!deleted) return res.status(404).json({ error: { message: 'Submission not found' } });
  res.status(204).send();
});
