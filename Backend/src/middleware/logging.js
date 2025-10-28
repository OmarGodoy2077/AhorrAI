const morgan = require('morgan');

const logger = morgan('combined'); // Or 'dev' for development

module.exports = logger;