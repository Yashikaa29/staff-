import Announcement from '../models/Announcement.js';
import User from '../models/User.js';
import { inMemoryDB, isUsingInMemory } from '../config/db.js';

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private (All authenticated users)
export const getAllAnnouncements = async (req, res) => {
  try {
    const { priority, category } = req.query;

    if (isUsingInMemory()) {
      let list = inMemoryDB.announcements.map((a) => {
        const author = inMemoryDB.users.find(
          (u) => u._id.toString() === a.authorId.toString()
        );
        return {
          ...a,
          authorName: author ? author.name : 'HR Team',
          authorRole: author ? author.role : 'HR',
        };
      });

      if (priority) {
        list = list.filter((a) => a.priority === priority);
      }
      if (category) {
        list = list.filter(
          (a) => a.category && a.category.toLowerCase() === category.toLowerCase()
        );
      }

      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return res.status(200).json({
        success: true,
        count: list.length,
        announcements: list,
      });
    }

    const filter = {};
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const announcements = await Announcement.find(filter)
      .populate('authorId', 'name role department')
      .sort({ createdAt: -1 });

    const formatted = announcements.map((a) => ({
      ...a.toObject(),
      authorName: a.authorId ? a.authorId.name : 'HR Team',
      authorRole: a.authorId ? a.authorId.role : 'HR',
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      announcements: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve announcements',
      error: error.message,
    });
  }
};

// @desc    Create new announcement
// @route   POST /api/announcements
// @access  Private (HR only)
export const createAnnouncement = async (req, res) => {
  try {
    const { title, content, priority, category } = req.body;
    const authorId = req.user._id;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required',
      });
    }

    if (isUsingInMemory()) {
      const newAnnouncement = {
        _id: '67c1c' + Math.floor(1000000000000000000 + Math.random() * 9000000000000000000).toString(16).substring(0, 19),
        title: title.trim(),
        content: content.trim(),
        priority: priority || 'Medium',
        category: category || 'General',
        authorId,
        createdAt: new Date(),
        authorName: req.user.name,
        authorRole: req.user.role,
      };

      inMemoryDB.announcements.unshift(newAnnouncement);

      return res.status(201).json({
        success: true,
        message: 'Announcement broadcasted successfully',
        announcement: newAnnouncement,
      });
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      content: content.trim(),
      priority: priority || 'Medium',
      category: category || 'General',
      authorId,
    });

    const populated = await Announcement.findById(announcement._id).populate('authorId', 'name role');

    return res.status(201).json({
      success: true,
      message: 'Announcement broadcasted successfully',
      announcement: {
        ...populated.toObject(),
        authorName: populated.authorId?.name || req.user.name,
        authorRole: populated.authorId?.role || req.user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create announcement',
      error: error.message,
    });
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private (HR only)
export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, priority, category } = req.body;

    if (isUsingInMemory()) {
      const item = inMemoryDB.announcements.find((a) => a._id.toString() === id.toString());
      if (!item) {
        return res.status(404).json({ success: false, message: 'Announcement not found' });
      }

      if (title) item.title = title.trim();
      if (content) item.content = content.trim();
      if (priority) item.priority = priority;
      if (category) item.category = category;

      return res.status(200).json({
        success: true,
        message: 'Announcement updated successfully',
        announcement: item,
      });
    }

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (title) announcement.title = title.trim();
    if (content) announcement.content = content.trim();
    if (priority) announcement.priority = priority;
    if (category) announcement.category = category;

    await announcement.save();

    return res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      announcement,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update announcement',
      error: error.message,
    });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (HR only)
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    if (isUsingInMemory()) {
      const index = inMemoryDB.announcements.findIndex((a) => a._id.toString() === id.toString());
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Announcement not found' });
      }

      inMemoryDB.announcements.splice(index, 1);
      return res.status(200).json({
        success: true,
        message: 'Announcement removed successfully',
      });
    }

    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Announcement removed successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete announcement',
      error: error.message,
    });
  }
};
