const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true, sparse: true },
    phoneVerified: { type: Boolean, default: false },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['reader', 'author', 'admin', 'superadmin'],
      default: 'reader',
    },
    profileImage: { type: String, default: '' },
    googleId: { type: String, sparse: true },
    deviceTokens: [{ type: String }],
    isBlocked: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    preferences: {
      language: { type: String, default: 'en' },
      notifications: { type: Boolean, default: true },
    },
    lastActive: { type: Date, default: Date.now },
    isPremium: { type: Boolean, default: false },
    premiumExpiresAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isBlocked: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Remove sensitive fields from JSON output
userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
