const Rating = require('../models/Rating');
const User = require('../models/User');

// GET /api/ratings/:userId
// Returns the rating summary and recent rating entries for a user.
const getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    const rating = await Rating.findOne({ userId }).populate(
      'ratings.reviewerId',
      'name email',
    );

    if (!rating) {
      return res.json({ userId, average: null, count: 0, ratings: [] });
    }

    const ratings = rating.ratings.map((r) => ({
      score: r.score,
      comment: r.comment,
      createdAt: r.createdAt,
    }));

    return res.json({
      userId,
      average: rating.average,
      count: rating.count,
      ratings,
    });
  } catch (err) {
    console.error('Get user ratings error:', err.message);
    res.status(500).json({ message: 'Could not load ratings.' });
  }
};

// POST /api/ratings/:userId
// Submit or update rating for a member.
const submitUserRating = async (req, res) => {
  try {
    const { userId } = req.params;
    const { score, comment } = req.body;
    const reviewerId = req.user?._id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
    if (!reviewerId) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }
    if (String(userId) === String(reviewerId)) {
      return res.status(400).json({ message: 'You cannot rate yourself.' });
    }
    const numericScore = Number(score);
    if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 5) {
      return res.status(400).json({ message: 'Score must be between 0 and 5.' });
    }

    const userToRate = await User.findById(userId);
    if (!userToRate) {
      return res.status(404).json({ message: 'User to rate not found.' });
    }

    const ratingDoc =
      (await Rating.findOne({ userId })) ||
      new Rating({ userId, ratings: [], average: null, count: 0 });

    const existingIndex = ratingDoc.ratings.findIndex((r) =>
      String(r.reviewerId) === String(reviewerId),
    );

    const now = new Date();

    if (existingIndex >= 0) {
      ratingDoc.ratings[existingIndex].score = numericScore;
      ratingDoc.ratings[existingIndex].comment = comment || '';
      ratingDoc.ratings[existingIndex].createdAt = now;
    } else {
      ratingDoc.ratings.push({
        reviewerId,
        score: numericScore,
        comment: comment || '',
        createdAt: now,
      });
    }

    ratingDoc.count = ratingDoc.ratings.length;
    const sum = ratingDoc.ratings.reduce((acc, r) => acc + Number(r.score || 0), 0);
    ratingDoc.average = ratingDoc.count ? sum / ratingDoc.count : null;
    ratingDoc.updatedAt = now;

    await ratingDoc.save();

    // Update user cached rating for fast access
    userToRate.rating = ratingDoc.average;
    await userToRate.save();

    // Load reviewer names for returned data
    const populated = await Rating.findOne({ userId }).populate(
      'ratings.reviewerId',
      'name',
    );

    const ratings = (populated?.ratings || []).map((r) => ({
      score: r.score,
      comment: r.comment,
      createdAt: r.createdAt,
    }));

    return res.json({
      userId,
      average: ratingDoc.average,
      count: ratingDoc.count,
      ratings,
    });
  } catch (err) {
    console.error('Submit user rating error:', err.message);
    res.status(500).json({ message: 'Could not submit rating.' });
  }
};

module.exports = { getUserRatings, submitUserRating };
