const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../../config');
const User = require('../users/User.model');
const Admin = require('../users/Admin.model');
const Author = require('../../modules/authors/Author.model');
const Wallet = require('../wallet/Wallet.model');
const WalletTransaction = require('../wallet/WalletTransaction.model');
const Referral = require('../referrals/Referral.model');
const DeviceSession = require('../security/DeviceSession.model');
const AppError = require('../../common/AppError');
const otpService = require('./otp.service');
const PhoneOTP = require('./PhoneOTP.model');

const REFERRAL_REWARD_COINS = 10;

/**
 * Generate access and refresh tokens
 */
const generateTokens = (userId, role) => {
  const isAdmin = role === 'admin' || role === 'superadmin' || role === 'author';
  const accessExpiry = isAdmin ? config.jwt.adminExpiry : config.jwt.readerExpiry;

  const accessToken = jwt.sign(
    { userId, role },
    config.jwt.accessSecret,
    { expiresIn: accessExpiry }
  );

  const refreshToken = jwt.sign(
    { userId, role, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiry }
  );

  return { accessToken, refreshToken };
};

/**
 * Format user object for mobile app response
 */
const formatMobileUser = async (user) => {
  const wallet = await Wallet.findOne({ userId: user._id });
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    mobile_number: user.phone || '',
    country_code: '',
    profile_image: user.profileImage || '',
    coin_balance: wallet ? wallet.availableCoins : 0,
    is_premium: user.isPremium || false,
    referral_code: user.referralCode || '',
    created_at: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
    preferences: user.preferences || {},
  };
};

/**
 * Register a new reader
 */
const register = async ({ name, email, password, phone, referralCode }) => {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw AppError.conflict('Email already registered');
  }

  if (phone) {
    const phoneExists = await User.findOne({ phone: phone.trim() });
    if (phoneExists) throw AppError.conflict('Phone number already registered');
  }

  const user = new User({
    name,
    email: email.toLowerCase(),
    phone: phone || '',
    passwordHash: password,
    role: 'reader',
    isVerified: true,
  });
  await user.save();

  await Wallet.create({ userId: user._id });

  // ── Apply referral code: award 10 coins to referrer ──────────
  if (referralCode) {
    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase().trim() });
    if (referrer && referrer._id.toString() !== user._id.toString()) {
      const referrerWallet = await Wallet.findOne({ userId: referrer._id });
      if (referrerWallet) {
        referrerWallet.availableCoins += REFERRAL_REWARD_COINS;
        referrerWallet.totalCoins += REFERRAL_REWARD_COINS;
        await referrerWallet.save();

        await WalletTransaction.create({
          userId: referrer._id,
          type: 'credit',
          source: 'referral',
          coins: REFERRAL_REWARD_COINS,
          balanceAfter: referrerWallet.availableCoins,
          notes: `Referral reward: ${user.name} joined using your code`,
        });
      }

      await Referral.create({
        referrerId: referrer._id,
        refereeId: user._id,
        referralCode: referralCode.toUpperCase().trim(),
        status: 'completed',
        rewardGiven: true,
        rewardAmount: REFERRAL_REWARD_COINS,
      });
    }
  }

  const tokens = generateTokens(user._id, user.role);
  const formattedUser = await formatMobileUser(user);
  return {
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    is_new_user: true,
    user: formattedUser,
  };
};

/**
 * Login for any role — identifier can be email or phone number
 */
const login = async ({ identifier, email, password, expectedRole }) => {
  const lookupValue = (identifier || email || '').trim();
  const isEmail = lookupValue.includes('@');

  let user;
  if (isEmail) {
    user = await User.findOne({ email: lookupValue.toLowerCase() }).select('+passwordHash');
  } else {
    user = await User.findOne({ phone: lookupValue }).select('+passwordHash');
  }

  if (!user) {
    throw AppError.unauthorized('Invalid credentials');
  }

  if (expectedRole && user.role !== expectedRole && user.role !== 'superadmin') {
    throw AppError.unauthorized('Invalid credentials for this portal');
  }

  if (user.isBlocked) {
    throw AppError.forbidden('Your account has been blocked');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw AppError.unauthorized('Invalid credentials');
  }

  user.lastActive = new Date();
  await user.save();

  const tokens = generateTokens(user._id, user.role);

  // Admin / author — return existing format for web panels
  if (user.role !== 'reader') {
    let roleData = {};
    if (user.role === 'admin' || user.role === 'superadmin') {
      const admin = await Admin.findOne({ userId: user._id });
      roleData.permissions = admin ? admin.permissions : [];
    }
    if (user.role === 'author') {
      const author = await Author.findOne({ userId: user._id });
      if (author && !author.isApproved) {
        throw AppError.forbidden('Your author account is pending approval');
      }
      roleData.author = author;
    }
    return { user: user.toSafeJSON(), ...roleData, ...tokens };
  }

  // Reader — return mobile-friendly format
  const formattedUser = await formatMobileUser(user);
  return {
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    is_new_user: false,
    user: formattedUser,
  };
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    if (decoded.type !== 'refresh') {
      throw AppError.unauthorized('Invalid refresh token');
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.isBlocked) {
      throw AppError.unauthorized('User not found or blocked');
    }

    const tokens = generateTokens(user._id, user.role);
    return tokens;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw AppError.unauthorized('Refresh token expired. Please login again.');
    }
    throw error;
  }
};

/**
 * Forgot password - generate reset token
 */
const forgotPassword = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Don't reveal if user exists
    return { message: 'If the email exists, a reset link has been sent.' };
  }

  const resetToken = jwt.sign(
    { userId: user._id, type: 'reset' },
    config.jwt.accessSecret,
    { expiresIn: '1h' }
  );

  // TODO: Send email with reset token/link
  // For now, return the token in dev mode
  const result = { message: 'Password reset link sent to your email' };
  if (config.env === 'development') {
    result.resetToken = resetToken;
  }
  return result;
};

/**
 * Reset password
 */
const resetPassword = async (token, newPassword) => {
  const decoded = jwt.verify(token, config.jwt.accessSecret);
  if (decoded.type !== 'reset') {
    throw AppError.badRequest('Invalid reset token');
  }

  const user = await User.findById(decoded.userId).select('+passwordHash');
  if (!user) {
    throw AppError.notFound('User not found');
  }

  user.passwordHash = newPassword; // pre-save hook will hash
  await user.save();

  return { message: 'Password reset successfully' };
};

/**
 * Request OTP for phone-based authentication
 */
const requestOTP = async (phone) => {
  return otpService.requestOTP(phone);
};

/**
 * Verify OTP and auto-login user (or create new user)
 */
const verifyOTP = async (phone, otp) => {
  const normalizedPhone = phone.trim().toLowerCase();

  // Step 1: Verify the OTP code
  await otpService.verifyOTP(normalizedPhone, otp);

  // Step 2: Find or create user by phone
  let user = await User.findOne({ phone: normalizedPhone });
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = new User({
      name: 'Reader',
      email: `phone_${Date.now()}@saliljaveri.local`,
      phone: normalizedPhone,
      phoneVerified: true,
      passwordHash: `phone_${normalizedPhone}`,
      role: 'reader',
      isVerified: true,
    });
    await user.save();
    await Wallet.create({ userId: user._id });
  }

  // Check if user is blocked
  if (user.isBlocked) {
    throw AppError.forbidden('Your account has been blocked');
  }

  // Update last active and phone verified status
  user.lastActive = new Date();
  user.phoneVerified = true;
  await user.save();

  // Generate tokens
  const tokens = generateTokens(user._id, user.role);

  // Get wallet balance for mobile response
  const wallet = await Wallet.findOne({ userId: user._id });
  const coinBalance = wallet ? wallet.availableCoins : 0;

  // Clean up verified OTP
  await PhoneOTP.deleteOne({ phone: normalizedPhone, verified: true });

  return {
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    is_new_user: isNewUser,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      mobile_number: normalizedPhone,
      country_code: '',
      profile_image: user.profileImage || '',
      coin_balance: coinBalance,
      is_premium: false,
      created_at: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
      preferences: user.preferences || {},
    },
  };
};

/**
 * Change password (authenticated user)
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw AppError.notFound('User not found');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw AppError.unauthorized('Current password is incorrect');

  if (currentPassword === newPassword) {
    throw AppError.badRequest('New password must be different from your current password');
  }

  user.passwordHash = newPassword; // pre-save hook will hash
  await user.save();

  return { message: 'Password changed successfully' };
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  generateTokens,
  requestOTP,
  verifyOTP,
  changePassword,
};
