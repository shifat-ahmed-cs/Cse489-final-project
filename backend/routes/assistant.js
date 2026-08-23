const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { processMessage, getContextualSuggestions } = require('../engine/assistantEngine');

// @route   POST /api/assistant/chat
// @desc    Process user chat message and return intelligent adaptation or answer
router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message is required' });
    }

    const responseData = await processMessage(req.user._id, message.trim());
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/assistant/suggestions
// @desc    Get smart contextual quick suggestion pills
router.get('/suggestions', auth, async (req, res) => {
  try {
    const suggestions = await getContextualSuggestions(req.user._id);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
