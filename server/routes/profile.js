/**
 * Private profile routes for Fabuloso Phase 2.
 *
 * Profile information is stored and retrieved from MongoDB rather than a users.json file.
 *
 * This router handles:
 * - Retrieving a private user profile.
 * - Updating profile names and username.
 * - Changing a user's password.
 * - Uploading a profile picture.
 *
 * Profile ownership is checked server-side before private profile operations are allowed.
 */

const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  User,
  publicUser,
  audit
} = require('../database');

const { exportSnapshot } = require('../export-snapshot');

const router = express.Router();

/**
 * Configure the directory used for uploaded profile pictures.
 *
 * __dirname:
 *   Refers to the directory containing this route file.
 *
 * '..':
 *   Moves from the routes directory back to the backend/server directory.
 *
 * uploads:
 *   Directory where Multer stores accepted profile-picture files.
 *
 * recursive: true:
 *   Creates the directory and any missing parent directories while avoiding an error when the directory already exists.
 */
const uploadDir = path.join(
  __dirname,
  '..',
  'uploads'
);

fs.mkdirSync(
  uploadDir,
  { recursive: true }
);

/**
 * Configure Multer disk storage for profile pictures.
 *
 * destination:
 *   Stores accepted files in the application's uploads directory.
 *
 * filename:
 *   Generates a server-side filename rather than trusting the original client filename.
 *
 * Date.now():
 *   Adds the current timestamp to reduce filename collisions.
 *
 * Math.random().toString(36).slice(2):
 *   Adds a random alphanumeric component for additional filename uniqueness.
 *
 * The extension is selected from the accepted MIME type so PNG and GIF retain their matching extensions,
 *                                  while accepted JPEG images use .jpg.
 */
const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDir);
  },

  filename: (_req, file, callback) => {
    const extension =
      file.mimetype === 'image/png'
        ? '.png'
        : file.mimetype === 'image/gif'
          ? '.gif'
          : '.jpg';

    callback(
      null,
      `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`
    );
  }
});

/**
 * Configure Multer profile-picture validation.
 *
 * storage:
 *   Uses the disk-storage configuration declared above.
 *
 * fileSize:
 *   Restricts uploaded profile pictures to a maximum of 2 MiB.
 *
 * fileFilter:
 *   Accepts only PNG, JPEG and GIF MIME types.
 *
 * The central Express error handler also handles Multer's LIMIT_FILE_SIZE error when a file exceeds the configured size.
 */
const upload = multer({
  storage,

  limits: {
    fileSize: 2 * 1024 * 1024
  },

  fileFilter: (req, file, callback) => {
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/gif'
    ];

    callback(
      null,
      allowedTypes.includes(file.mimetype)
    );
  }
});

/**
 * Verify ownership of a requested private profile.
 *
 * x-user-id:
 *   Identifies the user making the request.
 *
 * req.params.id:
 *   Identifies the profile being requested through the dynamic /:id route parameter.
 *
 * If x-user-id is present and does not match the requested profile ID, the server returns HTTP 403 Forbidden.
 *
 * After ownership checking, the requested user is loaded from MongoDB and attached to req.profileUser
 *                          so later handlers do not need to repeat the lookup.
 */
async function owner(req, res, next) {
  try {
    const requesterId = req.header('x-user-id');

    // Prevent one identified user from accessing another user's private profile.
    if (
      requesterId &&
      requesterId !== req.params.id
    ) {
      return res.status(403).json({
        message: 'Profiles are private.'
      });
    }

    // Retrieve the requested profile from MongoDB.
    const user = await User.findOne({
      id: req.params.id
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Store the trusted profile document for the route handler that executes next.
    req.profileUser = user;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/profile/:id
 *
 * Return the requested user's private profile after the owner middleware verifies access.
 *
 * publicUser():
 *   Removes sensitive/internal fields such as password and MongoDB's _id before the profile is returned to Angular.
 */
router.get('/:id', owner, (req, res) => {
  res.json(
    publicUser(req.profileUser)
  );
});

/**
 * PUT /api/profile/:id
 *
 * Update editable profile information for the profile owner.
 *
 * Supported fields:
 * - username
 * - firstName
 * - lastName
 *
 * Fields are only changed when they are present in req.body, allowing partial profile updates.
 */
router.put('/:id', owner, async (req, res, next) => {
  try {
    const user = req.profileUser;

    /**
     * Update the username when one was supplied.
     *
     * User.exists():
     *   Checks whether another account already uses the requested username.
     *
     * $ne:
     *   Excludes the current user's own ID from the duplicate check, allowing them to keep their existing username.
     */
    if (req.body.username !== undefined) {
      const username = String(
        req.body.username
      ).trim();

      const usernameExists = await User.exists({
        username,
        id: {
          $ne: user.id
        }
      });

      if (usernameExists) {
        return res.status(400).json({
          message: 'Username already exists'
        });
      }

      user.username = username;
    }

    // Update the first name only when the request explicitly includes the field.
    if (req.body.firstName !== undefined) {
      user.firstName = String(
        req.body.firstName || ''
      ).trim();
    }

    // Update the last name only when the request explicitly includes the field.
    if (req.body.lastName !== undefined) {
      user.lastName = String(
        req.body.lastName || ''
      ).trim();
    }

    // Persist the modified custom Document back to its MongoDB collection.
    await user.save();

    // Record the profile change for administrative auditing.
    await audit(
      user,
      'PROFILE_UPDATED'
    );

    // Refresh the optional marking/inspection snapshot after the persistent change.
    await exportSnapshot();

    res.json({
      message: 'Profile updated',
      username: user.username
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/profile/:id/password
 *
 * Change the profile owner's password.
 *
 * The current password must be verified before a replacement password is accepted.
 * Only the new bcrypt hash is persisted; the plaintext password is never stored.
 */
router.put('/:id/password', owner, async (req, res, next) => {
  try {
    const {
      currentPassword,
      newPassword
    } = req.body;

    // Both password values are required before verification can continue.
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current password and new password are required.'
      });
    }

    /**
     * Compare the supplied current password against the bcrypt hash stored in MongoDB.
     *
     * bcrypt.compare() performs the appropriate hashing comparison without decrypting or exposing the stored password hash.
     */
    const passwordMatches = await bcrypt.compare(
      currentPassword,
      req.profileUser.password
    );

    if (!passwordMatches) {
      return res.status(400).json({
        message: 'Current password is incorrect.'
      });
    }

    // Hash the replacement password using bcrypt cost factor 10 before assigning it to the user document.
    req.profileUser.password = await bcrypt.hash(
      newPassword,
      10
    );

    await req.profileUser.save();

    // Record the password change without storing either password in the audit details.
    await audit(
      req.profileUser,
      'PASSWORD_CHANGED'
    );

    await exportSnapshot();

    res.json({
      message: 'Password changed successfully.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/profile/:id/picture
 *
 * Upload and assign a new profile picture for the profile owner.
 *
 * owner:
 *   Verifies access and loads the user before file processing continues.
 *
 * upload.single('profilePicture'):
 *   Expects one multipart/form-data file whose field name is "profilePicture".
 *
 * Multer validates the file type and 2 MB maximum before this route handler executes.
 */
router.put(
  '/:id/picture',
  owner,
  upload.single('profilePicture'),
  async (req, res, next) => {
    try {
      // A missing req.file means no accepted profile-picture file was provided.
      if (!req.file) {
        return res.status(400).json({
          message: 'PNG, JPG/JPEG or GIF image required (max 2 MB).'
        });
      }

      /**
       * Store the public URL rather than the absolute filesystem path.
       *
       * server.js exposes the uploads directory through Express at /uploads, allowing Angular to request the
       *                                        stored image using this path.
       */
      req.profileUser.profilePicture =
        `/uploads/${req.file.filename}`;

      // Persist the new profile-picture path in MongoDB.
      await req.profileUser.save();

      // Record the profile-picture change in the audit log.
      await audit(
        req.profileUser,
        'PROFILE_PICTURE_CHANGED'
      );

      // Keep the optional inspection snapshot synchronised with the database.
      await exportSnapshot();

      res.json({
        message: 'Profile picture updated',
        profilePicture: req.profileUser.profilePicture
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Export the configured Express router for mounting under /api/profile in server.js.
 */
module.exports = router;