/**
 * Format a success response
 * @param {Object} data - The data to send in the response
 * @param {string} message - A success message
 * @returns {Object} The formatted success response
 */
export const successResponse = (data = null, message = 'Success') => ({
  success: true,
  message,
  data,
});

/**
 * Format an error response
 * @param {string} message - An error message
 * @param {number} statusCode - The HTTP status code
 * @param {Object} errors - Additional error details
 * @returns {Object} The formatted error response
 */
export const errorResponse = (message = 'Error', statusCode = 500, errors = null) => ({
  success: false,
  message,
  statusCode,
  errors,
});

/**
 * Format a paginated response
 * @param {Array} data - The paginated data
 * @param {number} page - The current page number
 * @param {number} limit - The number of items per page
 * @param {number} total - The total number of items
 * @returns {Object} The formatted paginated response
 */
export const paginatedResponse = (data, page, limit, total) => ({
  success: true,
  data,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  },
}); 