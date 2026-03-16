const express = require('express');
const router = express.Router();
const readerController = require('./reader.controller');
const { authenticate } = require('../../common/auth.middleware');

// ─── Public Routes ────────────────────────────────────────────
router.get('/banners', readerController.getBanners);
router.get('/categories', readerController.getCategories);
router.get('/search', readerController.searchContent);
router.get('/audiobook/:id', readerController.getAudiobookById);
router.get('/content', readerController.getContent);
router.get('/content/:id', readerController.getContentById);

// ─── Profile Routes (Authenticated) ──────────────────────────
router.get('/profile', authenticate, readerController.getProfile);
router.put('/profile', authenticate, readerController.updateProfile);
router.put('/profile/preferences', authenticate, readerController.updatePreferences);

// ─── Library Routes (Authenticated) ──────────────────────────
router.get('/library', authenticate, readerController.getLibrary);
router.post('/library/:contentId', authenticate, readerController.addToLibrary);
router.delete('/library/:contentId', authenticate, readerController.removeFromLibrary);

// ─── Wishlist Routes (Authenticated) ─────────────────────────
router.get('/wishlist', authenticate, readerController.getWishlist);
router.post('/wishlist/:contentId', authenticate, readerController.addToWishlist);
router.delete('/wishlist/:contentId', authenticate, readerController.removeFromWishlist);

// ─── Progress Routes (Authenticated) ─────────────────────────
router.get('/progress', authenticate, readerController.getProgress);
router.get('/progress/:contentId', authenticate, readerController.getProgressByContent);
router.post('/progress', authenticate, readerController.saveProgress);

module.exports = router;
