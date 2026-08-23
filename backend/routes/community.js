const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const CommunityPost = require('../models/CommunityPost');
const Challenge = require('../models/Challenge');

// @route   GET /api/community/feed
// @desc    Get community social feed
router.get('/feed', async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;

    const posts = await CommunityPost.find(filter)
      .populate('userId', 'name profileImage')
      .populate('comments.userId', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await CommunityPost.countDocuments(filter);
    res.json({ posts, total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/community/posts
// @desc    Create a community post
router.post('/posts', auth, async (req, res) => {
  try {
    const { type, content, imageUrl, workoutLogId, challengeId } = req.body;
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Content is required' });
    }

    const post = await CommunityPost.create({
      userId: req.user._id,
      type: type || 'general',
      content: content.trim(),
      imageUrl: imageUrl || '',
      workoutLogId,
      challengeId
    });

    const populated = await CommunityPost.findById(post._id).populate('userId', 'name profileImage');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/community/posts/:id/like
// @desc    Toggle like on a post
router.post('/posts/:id/like', auth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const idx = post.likes.indexOf(req.user._id);
    let isLiked = false;

    if (idx === -1) {
      post.likes.push(req.user._id);
      isLiked = true;
    } else {
      post.likes.splice(idx, 1);
    }

    post.likeCount = post.likes.length;
    await post.save();

    res.json({ message: isLiked ? 'Liked post' : 'Unliked post', isLiked, likeCount: post.likeCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/community/posts/:id/comment
// @desc    Add a comment to a post
router.post('/posts/:id/comment', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Comment content required' });
    }

    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({
      userId: req.user._id,
      content: content.trim(),
      createdAt: new Date()
    });

    post.commentCount = post.comments.length;
    await post.save();

    const updated = await CommunityPost.findById(post._id)
      .populate('userId', 'name profileImage')
      .populate('comments.userId', 'name profileImage');

    res.status(201).json({ message: 'Comment added', post: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/community/challenges
// @desc    Get active community challenges
router.get('/challenges', async (req, res) => {
  try {
    const challenges = await Challenge.find({ isActive: true }).sort({ startDate: -1 });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/community/challenges/:id/join
// @desc    Join a community challenge
router.post('/challenges/:id/join', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    const exists = challenge.participants.some(p => p.userId.toString() === req.user._id.toString());
    if (exists) return res.status(400).json({ message: 'Already joined this challenge' });

    challenge.participants.push({
      userId: req.user._id,
      progress: 0,
      joinedAt: new Date()
    });
    challenge.participantCount = challenge.participants.length;
    await challenge.save();

    res.json({ message: 'Joined challenge successfully', challenge });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/community/challenges/:id/leaderboard
// @desc    Get challenge leaderboard ranked by progress
router.get('/challenges/:id/leaderboard', async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('participants.userId', 'name profileImage');

    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    const leaderboard = challenge.participants
      .filter(p => p.userId)
      .map(p => ({
        user: p.userId,
        progress: p.progress,
        isCompleted: p.isCompleted
      }))
      .sort((a, b) => b.progress - a.progress);

    res.json({ challengeTitle: challenge.title, target: challenge.target, leaderboard });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
