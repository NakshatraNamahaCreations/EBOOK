const User = require('../users/User.model');
const Author = require('../authors/Author.model');
const Book = require('../books/Book.model');
const CoinPack = require('../wallet/CoinPack.model');
const logger = require('../../common/logger');

// Safely require models that may not exist yet
let Payment, WalletTransaction;
try { Payment = require('../payments/Payment.model'); } catch (_) {}
try { WalletTransaction = require('../wallet/WalletTransaction.model'); } catch (_) {}

exports.getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalAuthors, totalBooks, pendingAuthors] = await Promise.all([
      User.countDocuments(),
      Author.countDocuments({ isApproved: true }),
      Book.countDocuments({ status: 'published' }),
      Author.countDocuments({ isApproved: false }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalAuthors,
        totalBooks,
        pendingAuthors,
      },
    });
  } catch (error) {
    next(error);
  }
};
