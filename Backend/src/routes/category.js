const express = require('express');
const { CategoryController } = require('../controllers');
const { authenticate, validateCategory } = require('../middleware');

const router = express.Router();

router.post('/', authenticate, validateCategory, CategoryController.createCategory);
router.get('/', authenticate, CategoryController.getCategories);
router.get('/:id', authenticate, CategoryController.getCategory);
router.put('/:id', authenticate, validateCategory, CategoryController.updateCategory);
router.delete('/:id', authenticate, CategoryController.deleteCategory);

module.exports = router;