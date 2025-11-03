/**
 * Utility functions for date handling in Guatemala timezone
 */

/**
 * Get current date in Guatemala timezone as YYYY-MM-DD string
 * @returns {string} Current date in format YYYY-MM-DD
 */
function getTodayGuatemalaString() {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'America/Guatemala'
    });
    return formatter.format(new Date());
}

/**
 * Get current date and time in Guatemala timezone
 * @returns {Date} Current date with time in Guatemala timezone
 */
function getNowGuatemala() {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Guatemala'
    });
    
    const parts = formatter.formatToParts(new Date());
    const dateObj = {};
    
    parts.forEach(part => {
        dateObj[part.type] = part.value;
    });
    
    return new Date(`${dateObj.year}-${dateObj.month}-${dateObj.day}T${dateObj.hour}:${dateObj.minute}:${dateObj.second}`);
}

/**
 * Get current day of month in Guatemala timezone
 * @returns {number} Day of month (1-31)
 */
function getTodayDayOfMonth() {
    const dateStr = getTodayGuatemalaString();
    return parseInt(dateStr.split('-')[2]);
}

/**
 * Get current month in Guatemala timezone
 * @returns {number} Month (1-12)
 */
function getCurrentMonthGuatemala() {
    const dateStr = getTodayGuatemalaString();
    return parseInt(dateStr.split('-')[1]);
}

/**
 * Get current year in Guatemala timezone
 * @returns {number} Year (e.g., 2025)
 */
function getCurrentYearGuatemala() {
    const dateStr = getTodayGuatemalaString();
    return parseInt(dateStr.split('-')[0]);
}

/**
 * Convert a date string to Guatemala timezone comparison
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date} Comparable Date object
 */
function parseGuatemalaDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/**
 * Check if a date string is today or in the past (Guatemala timezone)
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} True if date is today or in the past
 */
function isDateTodayOrPast(dateString) {
    const today = getTodayGuatemalaString();
    return dateString <= today;
}

/**
 * Check if a date string is in the future (Guatemala timezone)
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} True if date is in the future
 */
function isDateFuture(dateString) {
    const today = getTodayGuatemalaString();
    return dateString > today;
}

module.exports = {
    getTodayGuatemalaString,
    getNowGuatemala,
    getTodayDayOfMonth,
    getCurrentMonthGuatemala,
    getCurrentYearGuatemala,
    parseGuatemalaDate,
    isDateTodayOrPast,
    isDateFuture
};
