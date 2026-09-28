/**
 * Super Admin-only administration routes for Fabuloso Phase 2.
 *
 * This router provides privileged operations for:
 * - Viewing registered users.
 * - Permanently deleting and banning user accounts.
 * - Viewing permanently banned email addresses.
 * - Viewing and filtering audit-log records.
 *
 * Every route in this router is protected by both authentication and super-admin authorisation middleware.
 */

const express = require('express');

const {
  User,
  Group,
  BannedEmail,
  AuditLog,
  publicUser,
  audit
} = require('../database');

const {
  auth,
  superAdmin
} = require('../middleware/auth');

const { exportSnapshot } = require('../export-snapshot');

const router = express.Router();

/**
 * Protect every endpoint declared below.
 *
 * auth:
 *   Verifies the requesting user against MongoDB and attaches the trusted user document to req.user.
 *
 * superAdmin:
 *   Requires req.user.role to equal "super-admin".
 *
 * Because router.use() is registered before the routes, both checks execute before any administration endpoint can run.
 */
router.use(auth, superAdmin);

/**
 * GET /api/admin/users
 *
 * Return all registered users ordered alphabetically by username.
 *
 * User.find():
 *   Uses an empty/default MongoDB filter, so every user is returned.
 *
 * sort({ username: 1 }):
 *   Sorts usernames in ascending order.
 *
 * map(publicUser):
 *   Sanitises every user before sending the response, removing fields such as password and MongoDB's internal _id.
 */
router.get('/users', async (req, res, next) => {
  try {
    const users = await User
      .find()
      .sort({ username: 1 });

    res.json(
      users.map(publicUser)
    );
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/users/:id
 *
 * Permanently delete a normal user account and prevent its email address from being registered again.
 *
 * Safety rules:
 * - The target user must exist.
 * - A super-admin account cannot be deleted through this endpoint.
 * - A user cannot be deleted when they are the sole administrator of a group.
 *
 * If deletion is allowed, the user is removed from all group member/admin arrays, deleted from MongoDB and their email
 *                                      is added to the banned_emails collection.
 */
router.delete('/users/:id', async (req, res, next) => {
  try {
    // Find the account identified by the dynamic :id route parameter.
    const user = await User.findOne({
      id: req.params.id
    });

    // Prevent deletion of missing accounts and protected super-admin accounts.
    if (!user || user.role === 'super-admin') {
      return res.status(400).json({
        message: 'Cannot delete that account.'
      });
    }

    /**
     * Check whether the user is the sole administrator of any group.
     *
     * admins: user.id:
     *   Requires the target user's ID to appear in the group's admins array.
     *
     * $expr:
     *   Allows MongoDB to evaluate an expression against fields inside each document.
     *
     * $size:
     *   Calculates the number of entries in the admins array.
     *
     * $eq [..., 1]:
     *   Requires the group to have exactly one administrator.
     *
     * Together, these conditions detect a group that would be left without an administrator if this user were deleted.
     */
    const blockingGroup = await Group.findOne({
      admins: user.id,
      $expr: {
        $eq: [
          { $size: '$admins' },
          1
        ]
      }
    });

    if (blockingGroup) {
      return res.status(400).json({
        message: 'Assign a replacement administrator first.'
      });
    }

    /**
     * Remove the user from every group's membership and administrator arrays.
     *
     * $pull:
     *   Removes matching values from MongoDB array fields.
     *
     * updateMany({}, ...):
     *   Applies the cleanup to every group because the deleted user may belong to multiple groups.
     */
    await Group.updateMany(
      {},
      {
        $pull: {
          members: user.id,
          admins: user.id
        }
      }
    );

    // Permanently remove the user document from the users collection.
    await User.deleteOne({
      id: user.id
    });

    /**
     * Preserve the deleted email in the banned_emails collection.
     *
     * Registration checks this collection later, preventing a permanently deleted account from being recreated using the same
     *                                                    email address.
     */
    await BannedEmail.create({
      email: user.email
    });

    // Record who performed the permanent deletion and which account was affected.
    await audit(
      req.user,
      'USER_PERMANENTLY_DELETED',
      {
        userId: user.id,
        email: user.email
      }
    );

    // Refresh the optional marking/inspection JSON snapshot after persistent data changes.
    await exportSnapshot();

    res.json({
      message: 'User permanently deleted/banned.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/banned-emails
 *
 * Return permanently banned email records ordered from newest to oldest.
 *
 * sort({ deletedAt: -1 }):
 *   Sorts by deletion timestamp in descending order.
 *
 * MongoDB's internal _id is removed before each record is returned to the frontend.
 */
router.get('/banned-emails', async (req, res, next) => {
  try {
    const rows = await BannedEmail
      .find()
      .sort({ deletedAt: -1 });

    const safeRows = rows.map((row) => {
      const object = row.toObject();
      delete object._id;
      return object;
    });

    res.json(safeRows);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/audit
 *
 * Return audit-log records with optional action-type and date filtering.
 *
 * Query parameters:
 * - type: matches a specific audit action.
 * - date: matches audit entries occurring during one calendar date.
 *
 * With no query parameters, all audit records are returned.
 */
router.get('/audit', async (req, res, next) => {
  try {
    // Begin with an empty MongoDB filter so all records match by default.
    const query = {};

    // Restrict results to one audit action when a type query parameter is supplied.
    if (req.query.type) {
      query.action = req.query.type;
    }

    /**
     * Build a one-day timestamp range when a date filter is supplied.
     *
     * start:
     *   Midnight at the beginning of the requested date.
     *
     * end:
     *   Midnight at the beginning of the following date.
     *
     * $gte / $lt:
     *   Includes timestamps at or after start and before end, covering the requested day without overlapping the next day.
     */
    if (req.query.date) {
      const start = new Date(
        req.query.date + 'T00:00:00'
      );

      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      query.timestamp = {
        $gte: start,
        $lt: end
      };
    }

    // Retrieve matching audit records with the newest events displayed first.
    const logs = await AuditLog
      .find(query)
      .sort({ timestamp: -1 });

    // Remove MongoDB's internal _id before returning audit records to Angular.
    const safeLogs = logs.map((log) => {
      const object = log.toObject();
      delete object._id;
      return object;
    });

    res.json(safeLogs);
  } catch (error) {
    next(error);
  }
});

/**
 * Export the configured Express router for mounting under /api/admin in server.js.
 */
module.exports = router;