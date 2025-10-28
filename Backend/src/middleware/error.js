const errorHandler = (err, req, res, next) => {
    // Log error for debugging
    console.error('[ERROR]', {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        status: err.status || 500,
        message: err.message
    });

    // Supabase specific errors
    if (err.code && err.status) {
        return res.status(err.status).json({
            error: 'Database error',
            code: err.code,
            message: err.message
        });
    }

    // Validation errors
    if (err.array) {
        return res.status(400).json({
            error: 'Validation failed',
            details: err.array()
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expired'
        });
    }

    // Generic error response
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
};

module.exports = errorHandler;