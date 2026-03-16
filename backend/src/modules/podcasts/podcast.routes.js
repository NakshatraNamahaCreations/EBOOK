const express = require('express');
const podcastController = require('./podcast.controller');
const { authenticate, authorize } = require('../../common/auth.middleware');

// ─── Admin Podcast Routes (/api/v1/admin/podcast-series) ──
const adminRouter = express.Router();
adminRouter.use(authenticate, authorize('admin', 'superadmin'));

adminRouter.post('/', podcastController.createSeries);
adminRouter.get('/', podcastController.getAllSeries);
adminRouter.get('/:id', podcastController.getSeries);
adminRouter.put('/:id', podcastController.updateSeries);
adminRouter.delete('/:id', podcastController.deleteSeries);

// Episodes (nested under series)
adminRouter.post('/:seriesId/episodes', podcastController.createEpisode);
adminRouter.get('/:seriesId/episodes', podcastController.getEpisodes);

// Episode direct routes (/api/v1/admin/podcast-episodes)
const adminEpisodeRouter = express.Router();
adminEpisodeRouter.use(authenticate, authorize('admin', 'superadmin'));
adminEpisodeRouter.put('/:id', podcastController.updateEpisode);
adminEpisodeRouter.delete('/:id', podcastController.deleteEpisode);

// ─── Reader Podcast Routes (/api/v1/reader/podcasts) ─────
const readerRouter = express.Router();
readerRouter.get('/', podcastController.getAllSeries);
readerRouter.get('/:id', podcastController.getSeries);
readerRouter.get('/:seriesId/episodes', podcastController.getEpisodes);

module.exports = { adminRouter, adminEpisodeRouter, readerRouter };
