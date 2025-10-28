const { Currency } = require('../models');

const CurrencyController = {
    async getCurrencies(req, res) {
        try {
            const currencies = await Currency.findAll();
            res.json(currencies);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = CurrencyController;