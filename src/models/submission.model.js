const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    restaurantName: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    location: { type: String, required: true },
    priceRange: { type: String, default: '' },
    recommendedMenu: { type: [String], default: [] },
    review: { type: String, default: '' },
    submitterName: { type: String, default: '' },
    submitterEmail: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    restaurantId: { type: Number, default: null } // 🔽 승인 시 생성된 restaurant의 id 저장
  },
  {
    timestamps: true,
    versionKey: false,
    toObject: {
      transform: (_doc, ret) => {
        delete ret._id;
        return ret;
      }
    },
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        return ret;
      }
    }
  }
);

module.exports = mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);
