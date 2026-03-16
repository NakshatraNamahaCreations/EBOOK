const Banner = require('../banners/Banner.model');
const Category = require('../categories/Category.model');
const User = require('../users/User.model');
const Book = require('../books/Book.model');
const Audiobook = require('../audiobooks/Audiobook.model');
const PodcastSeries = require('../podcasts/PodcastSeries.model');
const PodcastEpisode = require('../podcasts/PodcastEpisode.model');
const Chapter = require('../chapters/Chapter.model');
const Video = require('../videos/Video.model');
const Library = require('./Library.model');
const Wishlist = require('./Wishlist.model');
const ContentProgress = require('./ContentProgress.model');
const AppError = require('../../common/AppError');
const { asyncHandler } = require('../../common/errorHandler');

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Transform a Book document to the mobile Content format
 */
const bookToContent = (book) => ({
  id: book._id.toString(),
  title: book.title,
  description: book.description || '',
  content_type: 'book',
  cover_image: book.coverImage || '',
  author_id: book.authorId ? book.authorId._id?.toString() || book.authorId.toString() : '',
  author_name: book.authorId?.displayName || book.authorId?.name || 'Unknown',
  category_ids: book.categoryId ? [book.categoryId._id?.toString() || book.categoryId.toString()] : [],
  language: book.language || 'en',
  rating: book.averageRating || 0,
  reviews_count: book.ratingCount || 0,
  access_type: 'free',
  coin_price: 0,
  chapters: [],
  is_trending: book.totalReads > 100,
  is_featured: book.isFeatured || false,
  is_new_release: book.publishedAt ? Date.now() - new Date(book.publishedAt).getTime() < 30 * 24 * 60 * 60 * 1000 : false,
  created_at: book.createdAt ? book.createdAt.toISOString() : new Date().toISOString(),
  slug: book.slug,
});

/**
 * Transform a PodcastSeries document to the mobile Content format
 */
const podcastToContent = (series) => ({
  id: series._id.toString(),
  title: series.title,
  description: series.description || '',
  content_type: 'podcast',
  cover_image: series.thumbnail || '',
  author_id: series.authorId ? series.authorId._id?.toString() || series.authorId.toString() : '',
  author_name: series.authorId?.displayName || series.authorId?.name || 'Unknown',
  category_ids: series.categoryId ? [series.categoryId._id?.toString() || series.categoryId.toString()] : [],
  language: 'en',
  rating: 0,
  reviews_count: series.totalEpisodes || 0,
  access_type: 'free',
  coin_price: 0,
  chapters: [],
  is_trending: (series.totalEpisodes || 0) > 0,   // any published series with episodes
  is_featured: series.isFeatured || false,
  is_new_release: series.createdAt ? Date.now() - new Date(series.createdAt).getTime() < 90 * 24 * 60 * 60 * 1000 : false,
  created_at: series.createdAt ? series.createdAt.toISOString() : new Date().toISOString(),
});

/**
 * Transform a Video document to the mobile Content format
 */
const videoToContent = (video) => ({
  id: video._id.toString(),
  title: video.title,
  description: video.description || '',
  content_type: 'video',
  cover_image: video.thumbnail || video.youtubeMeta?.thumbnailUrl || '',
  author_id: video.authorId ? video.authorId.toString() : '',
  author_name: 'Unknown',
  category_ids: [],
  language: 'en',
  rating: 0,
  reviews_count: 0,
  access_type: video.isFree ? 'free' : 'coins',
  coin_price: video.coinCost || 0,
  chapters: [],
  is_trending: video.viewCount > 100,
  is_featured: false,
  is_new_release: video.createdAt ? Date.now() - new Date(video.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000 : false,
  created_at: video.createdAt ? video.createdAt.toISOString() : new Date().toISOString(),
});

/**
 * Transform a Book + aggregate audiobook stats to mobile Content format (audiobook type)
 * book: populated Book doc; totalListens: sum of listenCounts; isFree/coinCost from first track
 */
const audiobookToContent = (book, { totalListens = 0, isFree = true, coinCost = 0 } = {}) => ({
  id: book._id.toString(),
  title: book.title,
  description: book.description || '',
  content_type: 'audiobook',
  cover_image: book.coverImage || '',
  author_id: book.authorId ? book.authorId._id?.toString() || book.authorId.toString() : '',
  author_name: book.authorId?.displayName || book.authorId?.name || 'Unknown',
  category_ids: book.categoryId ? [book.categoryId._id?.toString() || book.categoryId.toString()] : [],
  language: book.language || 'en',
  rating: book.averageRating || 0,
  reviews_count: book.ratingCount || 0,
  access_type: isFree ? 'free' : 'coins',
  coin_price: coinCost,
  chapters: [],
  is_trending: totalListens > 300,
  is_featured: book.isFeatured || false,
  is_new_release: book.publishedAt ? Date.now() - new Date(book.publishedAt).getTime() < 30 * 24 * 60 * 60 * 1000 : false,
  created_at: book.createdAt ? book.createdAt.toISOString() : new Date().toISOString(),
  slug: book.slug,
});

// ─── Profile Controllers (Authenticated) ─────────────────────

/**
 * GET /api/v1/reader/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).lean();
  if (!user) throw AppError.notFound('User not found');
  res.json({
    success: true,
    data: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      profile_image: user.profileImage || '',
      preferences: user.preferences || {},
    },
  });
});

/**
 * PUT /api/v1/reader/profile
 * Body: { name }
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const update = {};
  if (name && name.trim()) update.name = name.trim();

  const user = await User.findByIdAndUpdate(req.userId, update, { new: true }).lean();
  if (!user) throw AppError.notFound('User not found');

  res.json({
    success: true,
    data: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      profile_image: user.profileImage || '',
      preferences: user.preferences || {},
    },
  });
});

/**
 * PUT /api/v1/reader/profile/preferences
 * Body: { language?, notifications? }
 */
const updatePreferences = asyncHandler(async (req, res) => {
  const { language, notifications } = req.body;
  const prefUpdate = {};
  if (language !== undefined) prefUpdate['preferences.language'] = language;
  if (notifications !== undefined) prefUpdate['preferences.notifications'] = notifications;

  const user = await User.findByIdAndUpdate(req.userId, prefUpdate, { new: true }).lean();
  if (!user) throw AppError.notFound('User not found');

  res.json({ success: true, data: { preferences: user.preferences || {} } });
});

// ─── Public Controllers ───────────────────────────────────────

/**
 * GET /api/v1/reader/banners
 */
const getBanners = asyncHandler(async (req, res) => {
  const now = new Date();
  const banners = await Banner.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  })
    .sort({ priority: -1, createdAt: -1 })
    .lean();

  const formatted = banners.map((b) => ({
    id: b._id.toString(),
    title: b.title || '',
    image: b.imageUrl || '',
    content_id: b.linkId ? b.linkId.toString() : null,
    action_url: b.externalUrl || null,
    order: b.priority || 0,
    active: b.isActive !== false,
  }));
  res.json({ success: true, data: formatted });
});

/**
 * GET /api/v1/reader/categories
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();
  const formatted = categories.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    image: c.image || null,
  }));
  res.json({ success: true, data: formatted });
});

/**
 * GET /api/v1/reader/search?q=query&content_type=book&limit=20
 */
const searchContent = asyncHandler(async (req, res) => {
  const { q, content_type, limit = 20 } = req.query;
  if (!q || q.trim().length < 1) {
    return res.json({ success: true, data: [] });
  }

  const results = [];
  const searchRegex = { $regex: q, $options: 'i' };
  const lim = Math.min(parseInt(limit) || 20, 100);

  if (!content_type || content_type === 'book') {
    const books = await Book.find({
      status: 'published',
      $or: [{ title: searchRegex }, { description: searchRegex }],
    })
      .populate('authorId', 'displayName name')
      .limit(lim)
      .lean();
    results.push(...books.map(bookToContent));
  }

  if (!content_type || content_type === 'podcast') {
    const podcasts = await PodcastSeries.find({
      $or: [{ title: searchRegex }, { description: searchRegex }],
    })
      .limit(lim)
      .lean();
    results.push(...podcasts.map(podcastToContent));
  }

  if (!content_type || content_type === 'video') {
    const videos = await Video.find({
      $or: [{ title: searchRegex }, { description: searchRegex }],
    })
      .limit(lim)
      .lean();
    results.push(...videos.map(videoToContent));
  }

  res.json({ success: true, data: results });
});

/**
 * GET /api/v1/reader/content
 * Unified content feed with filters: content_type, is_trending, is_featured, is_new_release, category_id, limit
 */
const getContent = asyncHandler(async (req, res) => {
  const { content_type, is_trending, is_featured, is_new_release, category_id, limit = 20 } = req.query;
  const lim = Math.min(parseInt(limit) || 20, 100);
  const results = [];

  // Books
  if (!content_type || content_type === 'book') {
    const bookQuery = { status: 'published' };
    if (is_featured === 'true') bookQuery.isFeatured = true;
    if (category_id) bookQuery.categoryId = category_id;

    const books = await Book.find(bookQuery)
      .populate('authorId', 'displayName name')
      .sort({ totalReads: -1, createdAt: -1 })
      .limit(lim)
      .lean();

    let bookResults = books.map(bookToContent);
    if (is_trending === 'true') bookResults = bookResults.filter((b) => b.is_trending);
    if (is_new_release === 'true') bookResults = bookResults.filter((b) => b.is_new_release);
    results.push(...bookResults);
  }

  // Audiobooks — query Audiobook tracks, group by bookId, return unique books as audiobook content
  if (!content_type || content_type === 'audiobook') {
    const abTracks = await Audiobook.find({ status: 'published' })
      .populate({ path: 'bookId', populate: { path: 'authorId', select: 'displayName name' } })
      .lean();

    // Aggregate per book
    const bookMap = new Map();
    for (const ab of abTracks) {
      const book = ab.bookId;
      if (!book || book.status === 'archived') continue;
      if (category_id && (!book.categoryId || book.categoryId.toString() !== category_id)) continue;
      const key = book._id.toString();
      if (!bookMap.has(key)) {
        bookMap.set(key, { book, totalListens: 0, isFree: ab.isFree, coinCost: ab.coinCost });
      }
      bookMap.get(key).totalListens += ab.listenCount || 0;
    }

    let abResults = Array.from(bookMap.values())
      .sort((a, b) => b.totalListens - a.totalListens)
      .slice(0, lim)
      .map(({ book, totalListens, isFree, coinCost }) =>
        audiobookToContent(book, { totalListens, isFree, coinCost })
      );

    if (is_trending === 'true') abResults = abResults.filter((a) => a.is_trending);
    if (is_featured === 'true') abResults = abResults.filter((a) => a.is_featured);
    if (is_new_release === 'true') abResults = abResults.filter((a) => a.is_new_release);
    results.push(...abResults);
  }

  // Podcasts
  if (!content_type || content_type === 'podcast') {
    const podcastQuery = { status: 'published' };
    if (is_featured === 'true') podcastQuery.isFeatured = true;
    if (category_id) podcastQuery.categoryId = category_id;

    const podcasts = await PodcastSeries.find(podcastQuery)
      .sort({ createdAt: -1 })
      .limit(lim)
      .lean();

    let podcastResults = podcasts.map(podcastToContent);
    if (is_new_release === 'true') podcastResults = podcastResults.filter((p) => p.is_new_release);
    results.push(...podcastResults);
  }

  if (!content_type || content_type === 'video') {
    const videoQuery = {};
    if (is_featured === 'true') videoQuery.isFeatured = true;

    const videos = await Video.find(videoQuery)
      .sort({ createdAt: -1 })
      .limit(lim)
      .lean();

    let videoResults = videos.map(videoToContent);

    if (is_new_release === 'true') {
      videoResults = videoResults.filter((v) => v.is_new_release);
    }

    results.push(...videoResults);
  }

  res.json({ success: true, data: results });
});

/**
 * GET /api/v1/reader/content/:id
 * Get any content item by ID
 */
const getContentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Try book first
  let book = await Book.findById(id)
    .populate('authorId', 'displayName name avatar bio')
    .populate('categoryId', 'name slug')
    .lean()
    .catch(() => null);

  if (book) {
    const [chapters, audioTracks] = await Promise.all([
      Chapter.find({ bookId: id, status: 'published' }).sort({ orderNumber: 1 }).lean(),
      Audiobook.find({ bookId: id, status: 'published' }).lean(),
    ]);

    // Map chapterId → audioUrl for quick lookup
    const audioUrlMap = {};
    audioTracks.forEach(track => {
      if (track.chapterId) {
        audioUrlMap[track.chapterId.toString()] = track.audioUrl || '';
      }
    });

    const content = bookToContent(book);
    content.chapters = chapters.map(ch => ({
      id: ch._id.toString(),
      title: ch.title,
      order: ch.orderNumber,
      is_free: ch.isFree,
      coin_cost: ch.coinCost,
      estimated_read_time: ch.estimatedReadTime || 0,
      audio_url: audioUrlMap[ch._id.toString()] || '',
    }));
    return res.json({ success: true, data: content });
  }

  // Try podcast
  let podcast = await PodcastSeries.findById(id).lean().catch(() => null);
  if (podcast) {
    const episodes = await PodcastEpisode.find({ seriesId: id, status: 'published' }).sort({ episodeNumber: 1 }).lean();
    const content = podcastToContent(podcast);
    content.chapters = episodes.map(ep => ({
      id: ep._id.toString(),
      title: ep.title,
      order: ep.episodeNumber,
      duration: ep.duration,
      youtube_id: ep.youtubeMeta?.videoId || '',
      thumbnail: ep.thumbnail || ep.youtubeMeta?.thumbnailUrl || '',
      is_free: ep.isFree,
      coin_cost: ep.coinCost,
      description: ep.description || '',
    }));
    return res.json({ success: true, data: content });
  }

  // Try video
  let video = await Video.findById(id).lean().catch(() => null);
  if (video) {
    return res.json({ success: true, data: videoToContent(video) });
  }

  throw AppError.notFound('Content not found');
});

/**
 * GET /api/v1/reader/audiobook/:id
 * Get audiobook detail by bookId
 */
const getAudiobookById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const book = await Book.findById(id)
    .populate('authorId', 'displayName name avatar bio')
    .lean()
    .catch(() => null);

  if (!book) {
    throw AppError.notFound('Audiobook not found');
  }

  const tracks = await Audiobook.find({ bookId: id, status: 'published' }).sort({ _id: 1 }).lean();

  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const narratorName = tracks.length > 0 ? tracks[0].narrator || '' : '';
  const isFree = tracks.length > 0 ? tracks[0].isFree : true;
  const coinCost = tracks.length > 0 ? tracks[0].coinCost || 0 : 0;
  const totalListens = tracks.reduce((sum, t) => sum + (t.listenCount || 0), 0);

  const content = audiobookToContent(book, { totalListens, isFree, coinCost });
  content.duration = totalDuration;
  content.narrator_name = narratorName;
  content.chapters = tracks.map((t, i) => ({
    id: t._id.toString(),
    title: t.title,
    order: i + 1,
    duration: t.duration,
    audio_url: t.audioUrl || '',
    narrator: t.narrator || '',
    is_free: t.isFree,
    coin_cost: t.coinCost,
  }));

  res.json({ success: true, data: content });
});

// ─── Library Controllers (Authenticated) ─────────────────────

/**
 * Enrich a list of { contentId, contentType } records into full Content objects
 */
const enrichEntries = async (entries) => {
  const results = [];
  for (const entry of entries) {
    try {
      if (entry.contentType === 'book') {
        const doc = await Book.findById(entry.contentId)
          .populate('authorId', 'displayName name')
          .lean();
        if (doc) results.push(bookToContent(doc));
      } else if (entry.contentType === 'audiobook') {
        // Audiobooks share the Book document; fetch audio tracks for stats
        const doc = await Book.findById(entry.contentId)
          .populate('authorId', 'displayName name')
          .lean();
        if (doc) {
          const tracks = await Audiobook.find({ bookId: entry.contentId, status: 'published' }).lean();
          const totalListens = tracks.reduce((sum, t) => sum + (t.listenCount || 0), 0);
          const isFree = tracks.length > 0 ? tracks[0].isFree : true;
          const coinCost = tracks.length > 0 ? tracks[0].coinCost || 0 : 0;
          results.push(audiobookToContent(doc, { totalListens, isFree, coinCost }));
        }
      } else if (entry.contentType === 'podcast') {
        const doc = await PodcastSeries.findById(entry.contentId).lean();
        if (doc) results.push(podcastToContent(doc));
      } else if (entry.contentType === 'video') {
        const doc = await Video.findById(entry.contentId).lean();
        if (doc) results.push(videoToContent(doc));
      }
    } catch (_) {
      // skip invalid/deleted content
    }
  }
  return results;
};

/**
 * GET /api/v1/reader/library?page=1&limit=20
 */
const getLibrary = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const [total, entries] = await Promise.all([
    Library.countDocuments({ userId: req.userId }),
    Library.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const content = await enrichEntries(entries);
  res.json({
    success: true,
    data: content,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

/**
 * POST /api/v1/reader/library/:contentId
 * Body: { content_type }
 */
const addToLibrary = asyncHandler(async (req, res) => {
  const { contentId } = req.params;
  const { content_type = 'book' } = req.body;

  await Library.findOneAndUpdate(
    { userId: req.userId, contentId },
    { userId: req.userId, contentId, contentType: content_type },
    { upsert: true, new: true }
  );

  res.json({ success: true, message: 'Added to library' });
});

/**
 * DELETE /api/v1/reader/library/:contentId
 */
const removeFromLibrary = asyncHandler(async (req, res) => {
  const { contentId } = req.params;
  await Library.findOneAndDelete({ userId: req.userId, contentId });
  res.json({ success: true, message: 'Removed from library' });
});

// ─── Wishlist Controllers (Authenticated) ─────────────────────

/**
 * GET /api/v1/reader/wishlist?page=1&limit=20
 */
const getWishlist = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const [total, entries] = await Promise.all([
    Wishlist.countDocuments({ userId: req.userId }),
    Wishlist.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const content = await enrichEntries(entries);
  res.json({
    success: true,
    data: content,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

/**
 * POST /api/v1/reader/wishlist/:contentId
 * Body: { content_type }
 */
const addToWishlist = asyncHandler(async (req, res) => {
  const { contentId } = req.params;
  const { content_type = 'book' } = req.body;

  await Wishlist.findOneAndUpdate(
    { userId: req.userId, contentId },
    { userId: req.userId, contentId, contentType: content_type },
    { upsert: true, new: true }
  );

  res.json({ success: true, message: 'Added to wishlist' });
});

/**
 * DELETE /api/v1/reader/wishlist/:contentId
 */
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { contentId } = req.params;
  await Wishlist.findOneAndDelete({ userId: req.userId, contentId });
  res.json({ success: true, message: 'Removed from wishlist' });
});

// ─── Progress Controllers (Authenticated) ─────────────────────

/**
 * GET /api/v1/reader/progress
 */
const getProgress = asyncHandler(async (req, res) => {
  const progress = await ContentProgress.find({ userId: req.userId })
    .sort({ lastAccessedAt: -1 })
    .lean();

  const formatted = progress.map((p) => ({
    id: p._id.toString(),
    user_id: p.userId.toString(),
    content_id: p.contentId,
    content_type: p.contentType,
    current_chapter_id: p.currentChapterId,
    current_position: p.currentPosition,
    total_progress: p.totalProgress,
    last_accessed: p.lastAccessedAt ? p.lastAccessedAt.toISOString() : new Date().toISOString(),
    completed: p.completed,
  }));

  res.json({ success: true, data: formatted });
});

/**
 * GET /api/v1/reader/progress/:contentId
 */
const getProgressByContent = asyncHandler(async (req, res) => {
  const { contentId } = req.params;
  const progress = await ContentProgress.findOne({ userId: req.userId, contentId }).lean();

  if (!progress) {
    return res.json({ success: true, data: null });
  }

  res.json({
    success: true,
    data: {
      id: progress._id.toString(),
      user_id: progress.userId.toString(),
      content_id: progress.contentId,
      content_type: progress.contentType,
      current_chapter_id: progress.currentChapterId,
      current_position: progress.currentPosition,
      total_progress: progress.totalProgress,
      last_accessed: progress.lastAccessedAt ? progress.lastAccessedAt.toISOString() : new Date().toISOString(),
      completed: progress.completed,
    },
  });
});

/**
 * POST /api/v1/reader/progress
 * Body: { content_id, content_type, current_chapter_id, current_position, total_progress, completed }
 */
const saveProgress = asyncHandler(async (req, res) => {
  const { content_id, content_type, current_chapter_id, current_position, total_progress, completed } = req.body;

  if (!content_id || !content_type) {
    throw AppError.badRequest('content_id and content_type are required');
  }

  const progress = await ContentProgress.findOneAndUpdate(
    { userId: req.userId, contentId: content_id },
    {
      userId: req.userId,
      contentId: content_id,
      contentType: content_type,
      currentChapterId: current_chapter_id || null,
      currentPosition: current_position || 0,
      totalProgress: total_progress || 0,
      completed: completed || false,
      lastAccessedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  res.json({
    success: true,
    data: {
      id: progress._id.toString(),
      user_id: progress.userId.toString(),
      content_id: progress.contentId,
      content_type: progress.contentType,
      current_chapter_id: progress.currentChapterId,
      current_position: progress.currentPosition,
      total_progress: progress.totalProgress,
      last_accessed: progress.lastAccessedAt.toISOString(),
      completed: progress.completed,
    },
  });
});

/**
 * GET /api/v1/reader/books/:bookId/chapter-status
 * Returns chapters of a book annotated with per-user unlock status.
 * Requires authentication. Uses subscription + coin-unlock checks.
 */
const getChapterUnlockStatus = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const userDoc = req.user; // always set because route uses authenticate

  const chapters = await Chapter.find({ bookId, status: 'published' })
    .sort({ orderNumber: 1 })
    .lean();

  const UnlockTransaction = require('../wallet/UnlockTransaction.model');

  // Check if user has an active premium plan
  const hasActivePlan =
    userDoc.isPremium === true &&
    (!userDoc.premiumExpiresAt || new Date(userDoc.premiumExpiresAt) > new Date());

  // Fetch all coin-unlock records for this user's chapters in one query
  const chapterIds = chapters.map((c) => c._id);
  const unlocks = await UnlockTransaction.find({
    userId: userDoc._id,
    contentType: 'chapter',
    contentId: { $in: chapterIds },
  }).lean();
  const unlockedSet = new Set(unlocks.map((u) => u.contentId.toString()));

  const result = chapters.map((ch) => {
    const isFree = ch.isFree === true;
    const isCoinUnlocked = unlockedSet.has(ch._id.toString());
    const isUnlocked = isFree || hasActivePlan || isCoinUnlocked;

    return {
      id: ch._id.toString(),
      title: ch.title,
      order: ch.orderNumber,
      is_free: isFree,
      coin_cost: ch.coinCost || 0,
      estimated_read_time: ch.estimatedReadTime || 0,
      is_unlocked: isUnlocked,
      access_reason: isFree
        ? 'free'
        : hasActivePlan
        ? 'subscription'
        : isCoinUnlocked
        ? 'coins'
        : 'locked',
    };
  });

  res.json({ success: true, data: result, has_active_plan: hasActivePlan });
});

module.exports = {
  getProfile,
  updateProfile,
  updatePreferences,
  getBanners,
  getCategories,
  searchContent,
  getContent,
  getContentById,
  getAudiobookById,
  getLibrary,
  addToLibrary,
  removeFromLibrary,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getProgress,
  getProgressByContent,
  saveProgress,
  getChapterUnlockStatus,
};
