const { Category } = require('../models');

const CategoryController = {
    async createCategory(req, res) {
        try {
            const data = { ...req.body, user_id: req.user.userId };
            const category = await Category.create(data);
            res.status(201).json(category);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getCategories(req, res) {
        try {
            const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
            const offset = (page - 1) * limit;
            const categories = await Category.findByUserId(req.user.userId, {
                limit: parseInt(limit),
                offset: parseInt(offset),
                sortBy,
                sortOrder
            });
            res.json({ data: categories, page: parseInt(page), limit: parseInt(limit) });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getCategory(req, res) {
        try {
            const category = await Category.findById(req.params.id);
            if (!category || category.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Category not found' });
            }
            res.json(category);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async updateCategory(req, res) {
        try {
            const category = await Category.findById(req.params.id);
            if (!category || category.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Category not found' });
            }
            const updatedCategory = await Category.update(req.params.id, req.body);
            res.json(updatedCategory);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async deleteCategory(req, res) {
        try {
            const category = await Category.findById(req.params.id);
            if (!category || category.user_id !== req.user.userId) {
                return res.status(404).json({ error: 'Category not found' });
            }
            await Category.delete(req.params.id);
            res.json({ message: 'Category deleted' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = CategoryController;