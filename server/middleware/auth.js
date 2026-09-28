/**
 * Server-side authentication and role-authorisation middleware for Fabuloso Phase 2.
 *
 * These middleware functions protect backend routes independently of the Angular interface.
 * Hiding or disabling an Angular button is not a security control because a user could still send HTTP requests directly to
 *                                                          the API.
 *
 * Authentication:
 *   Identifies the requesting user from the x-user-id request header and confirms that the user exists in MongoDB.
 *
 * Authorisation:
 *   superAdmin() verifies that the authenticated user has the required "super-admin" role before allowing access to protected
 *                                                   administration routes.
 */

const { User } = require('../database');

/**
 * Authenticate an incoming request.
 *
 * x-user-id:
 *   The Angular client sends the current user's application-level ID in this HTTP request header.
 *
 * User.findOne():
 *   Verifies the supplied ID against the MongoDB users collection rather than trusting the client-provided value by itself.
 *
 * req.user:
 *   Stores the authenticated user document on the request so later middleware and route handlers can use the trusted database
 *                                                          record.
 *
 * next():
 *   Passes control to the next middleware or route handler after authentication succeeds.
 *
 * A missing or unknown user ID returns HTTP 401 Unauthorized.
 * Unexpected database errors are forwarded to Express's central error handler using next(error).
 */
async function auth(req, res, next) {
  try {
    // Read the application-level user ID supplied by the frontend.
    const id = req.header('x-user-id');

    // Only query MongoDB when an ID was actually supplied.
    const user = id
      ? await User.findOne({ id })
      : null;

    // Reject requests that cannot be associated with an existing user account.
    if (!user) {
      return res.status(401).json({
        message: 'Authentication required.'
      });
    }

    // Attach the trusted database user to the request for later middleware and route handlers.
    req.user = user;

    next();
  } catch (error) {
    // Forward unexpected errors to the central Express error-handling middleware.
    next(error);
  }
}

/**
 * Require the authenticated user to have the super-admin role.
 *
 * This middleware is intended to run after auth(), which populates req.user.
 *
 * Optional chaining (?.):
 *   Safely handles the case where req.user is unexpectedly missing.
 *
 * HTTP 403 Forbidden:
 *   The request may come from an authenticated user, but that user does not have permission to access the protected resource.
 */
function superAdmin(req, res, next) {
  if (req.user?.role !== 'super-admin') {
    return res.status(403).json({
      message: 'Super admin required.'
    });
  }

  next();
}

/**
 * Export the middleware so route modules can apply authentication and role checks where required.
 */
module.exports = {
  auth,
  superAdmin
};