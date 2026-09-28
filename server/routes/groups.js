/**
 * Group, request, membership, channel and group-administration routes for Fabuloso.
 *
 * This router manages the MongoDB-backed workflow for:
 * - Viewing groups.
 * - Requesting creation of new groups.
 * - Approving/rejecting group creation requests.
 * - Requesting membership of existing groups.
 * - Approving/rejecting membership requests.
 * - Viewing group memberships and administrators.
 * - Promoting, demoting and removing members.
 * - Updating group settings and age restrictions.
 * - Creating, viewing, updating and deleting group channels.
 *
 * Administrative authority is always checked on the server before protected mutations are performed.
 */

const express = require('express');

const {
  Group,
  Channel,
  Request,
  User,
  audit,
  publicUser
} = require('../database');

const { auth } = require('../middleware/auth');
const { exportSnapshot } = require('../export-snapshot');

const router = express.Router();

/**
 * Check whether a user is an administrator of a particular group.
 *
 * Group administration is determined by membership of the group's admins array rather than the user's global role.
 *
 * !!group:
 *   Ensures a missing/null group immediately produces false.
 *
 * (group.admins || []):
 *   Provides an empty-array fallback if the admins field is unexpectedly missing.
 *
 * includes(user.id):
 *   Checks whether the authenticated user's application-level UUID appears in the group's administrator list.
 */
const isAdmin = (group, user) =>
  !!group && (group.admins || []).includes(user.id);

/**
 * Convert a custom database Document into a plain object suitable for an API response.
 *
 * toObject():
 *   Used when the supplied value is one of Fabuloso's custom Document wrappers.
 *
 * _id:
 *   MongoDB's internal identifier is removed because the frontend uses the application's UUID id field.
 */
const plain = (document) => {
  const object = document.toObject
    ? document.toObject()
    : document;

  delete object._id;

  return object;
};

/**
 * GET /api/groups
 *
 * Return all groups ordered alphabetically by name.
 *
 * This endpoint is intentionally public in the current implementation so the frontend can display available groups before
 *                                          a user submits a membership request.
 */
router.get('/', async (req, res, next) => {
  try {
    const groups = await Group
      .find()
      .sort({ name: 1 });

    res.json(
      groups.map(plain)
    );
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/groups/:id
 *
 * Return one group using its application-level UUID.
 *
 * HTTP 404 is returned when no matching group exists.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const group = await Group.findOne({
      id: req.params.id
    });

    if (!group) {
      return res.status(404).json({
        message: 'Group not found.'
      });
    }

    res.json(
      plain(group)
    );
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/groups/requests
 *
 * Submit a request asking the Super Admin to create a new group.
 *
 * auth:
 *   Requires an authenticated MongoDB user before a request can be submitted.
 *
 * The requester does NOT create the group directly. Instead, a pending Request document is created for later
 *                                          Super Admin approval.
 */
router.post('/requests', auth, async (req, res, next) => {
  try {
    // Accept groupName or name so the endpoint remains compatible with the frontend's expected request formats.
    const name = String(
      req.body.groupName ||
      req.body.name ||
      ''
    ).trim();

    if (!name) {
      return res.status(400).json({
        message: 'Group name required.'
      });
    }

    /**
     * Create the pending group-creation request.
     *
     * requesterId/requesterUsername:
     *   Taken from req.user, which auth middleware loaded from MongoDB, rather than trusting requester identity supplied
     *                                                  in req.body.
     *
     * slice():
     *   Restricts the stored group name to 30 characters and description to 250 characters.
     *
     * ageLimit:
     *   Converted to a number before storage.
     */
    const request = await Request.create({
      type: 'group-create',
      requesterId: req.user.id,
      requesterUsername: req.user.username,
      groupName: name.slice(0, 30),
      description: String(req.body.description || '').slice(0, 250),
      ageLimit: Number(req.body.ageLimit || 0),
      status: 'pending'
    });

    /**
     * Preserve requestId for compatibility with frontend code that expects this field.
     * The request's application-level id remains the underlying identifier.
     */
    request.requestId = request.id;
    await request.save();

    await audit(
      req.user,
      'GROUP_CREATE_REQUESTED',
      {
        requestId: request.id,
        groupName: request.groupName
      }
    );

    await exportSnapshot();

    res.status(201).json(
      plain(request)
    );
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/groups/requests/user/:id
 *
 * Return one user's group-creation requests.
 *
 * This endpoint specifically retrieves requests asking the Super Admin to create a new group.
 * Filtering by type prevents join requests from appearing in Angular's "My Group Creation Requests" interface.
 *
 * A normal user may inspect only their own requests, while the global Super Admin may inspect another user's requests for
 *                                              administration/debugging.
 */
router.get('/requests/user/:id', auth, async (req, res, next) => {
  try {
    if (
      req.user.id !== req.params.id &&
      req.user.role !== 'super-admin'
    ) {
      return res.status(403).json({
        message: 'You may only view your own requests.'
      });
    }

    /**
     * Retrieve only group-creation requests belonging to the requested user.
     *
     * sort({ createdAt: -1 }):
     *   Displays the newest requests first.
     */
    const requests = await Request
      .find({
        requesterId: req.params.id,
        type: 'group-create'
      })
      .sort({ createdAt: -1 });

    res.json(
      requests.map(plain)
    );
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/groups/membership-requests/user/:id
 *
 * Return one user's group-membership requests.
 *
 * This endpoint is deliberately separate from /requests/user/:id because multiple request types are stored in the
 *                                      same MongoDB Request collection:
 * - group-create: user is asking the Super Admin to create a new group.
 * - join: user is asking a Group Admin to join an existing group.
 *
 * Filtering by type prevents Angular from displaying group-creation requests where it expects membership requests.
 */
router.get('/membership-requests/user/:id', auth, async (req, res, next) => {
  try {
    // Normal users may inspect only their own membership requests; the Super Admin may inspect another user's requests.
    if (
      req.user.id !== req.params.id &&
      req.user.role !== 'super-admin'
    ) {
      return res.status(403).json({
        message: 'You may only view your own membership requests.'
      });
    }

    // Retrieve only join requests belonging to this user, with the newest requests first.
    const requests = await Request
      .find({
        requesterId: req.params.id,
        type: 'join'
      })
      .sort({ createdAt: -1 });

    res.json(
      requests.map(plain)
    );
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/groups/requests/creation
 *
 * Return all pending group-creation requests for Super Admin review.
 *
 * Authentication alone is insufficient; the user's trusted MongoDB role must also equal "super-admin".
 */
router.get('/requests/creation', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({
        message: 'Super admin required.'
      });
    }

    const requests = await Request.find({
      type: 'group-create',
      status: 'pending'
    });

    res.json(
      requests.map(plain)
    );
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/groups/requests/:id/approve
 *
 * Approve a group-creation request.
 *
 * Only the global Super Admin may perform this action.
 *
 * Approval:
 * 1. Loads the requested group-creation Request.
 * 2. Creates the Group.
 * 3. Makes the original requester both the first member and first Group Admin.
 * 4. Adds the group UUID to the requester's User.groups array.
 * 5. Marks the Request as approved.
 * 6. Audits and exports the mutation.
 */
router.post('/requests/:id/approve', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({
        message: 'Super admin required.'
      });
    }

    const request = await Request.findOne({
      id: req.params.id,
      type: 'group-create'
    });

    if (!request) {
      return res.status(404).json({
        message: 'Request not found.'
      });
    }

    /**
     * Create the approved group.
     *
     * The requester becomes both:
     * - the initial group member, and
     * - the initial group administrator.
     *
     * Group administration remains separate from the user's global application role.
     */
    const group = await Group.create({
      name: request.groupName,
      description: request.description,
      ageLimit: request.ageLimit,
      theme: {
        mode: 'default',
        colour: '#ffffff'
      },
      members: [
        request.requesterId
      ],
      admins: [
        request.requesterId
      ]
    });

    /**
     * Add the new group UUID to the requester's User.groups array.
     *
     * $addToSet:
     *   Adds the value only when it is not already present, preventing duplicate group references.
     */
    await User.updateOne(
      {
        id: request.requesterId
      },
      {
        $addToSet: {
          groups: group.id
        }
      }
    );

    // Mark the request as decided and link it to the newly created group.
    request.status = 'approved';
    request.groupId = group.id;
    request.decidedAt = new Date();

    await request.save();

    await audit(
      req.user,
      'GROUP_CREATED',
      {
        groupId: group.id,
        requestId: request.id,
        defaultAdminId: request.requesterId
      }
    );

    await exportSnapshot();

    res.json(
      plain(group)
    );
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/groups/requests/:id/reject
 *
 * Reject a request as the global Super Admin.
 *
 * The Request document is retained for history but its status, rejection reason and decision timestamp are updated.
 */
router.post('/requests/:id/reject', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({
        message: 'Super admin required.'
      });
    }

    const request = await Request.findOne({
      id: req.params.id
    });

    if (!request) {
      return res.status(404).json({
        message: 'Not found.'
      });
    }

    request.status = 'rejected';
    request.reason =
      req.body.reason ||
      'Rejected by super admin';
    request.decidedAt = new Date();

    await request.save();

    await audit(
      req.user,
      'GROUP_REQUEST_REJECTED',
      {
        requestId: request.id,
        reason: request.reason
      }
    );

    await exportSnapshot();

    res.json(
      plain(request)
    );
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/groups/:id/join-request
 *
 * Request membership of an existing group.
 *
 * Server-side checks prevent:
 * - Requests for nonexistent groups.
 * - Users below the group's age requirement from requesting access.
 * - Existing members from requesting membership again.
 * - Duplicate pending join requests.
 *
 * Passing these checks creates a pending Request for Group Admin approval.
 */
router.post('/:id/join-request', auth, async (req, res, next) => {
  try {
    const group = await Group.findOne({
      id: req.params.id
    });

    if (!group) {
      return res.status(404).json({
        message: 'Group not found.'
      });
    }

    // Enforce the group's age restriction using the authenticated user's MongoDB profile.
    if (req.user.age < group.ageLimit) {
      return res.status(403).json({
        message: `You must be at least ${group.ageLimit} years old to join this group.`
      });
    }

    if (group.members.includes(req.user.id)) {
      return res.status(400).json({
        message: 'Already a member.'
      });
    }

    // Prevent multiple unresolved join requests from the same user for the same group.
    const pendingRequestExists = await Request.exists({
      type: 'join',
      groupId: group.id,
      requesterId: req.user.id,
      status: 'pending'
    });

    if (pendingRequestExists) {
      return res.status(400).json({
        message: 'A join request is already pending.'
      });
    }

    const request = await Request.create({
      type: 'join',
      groupId: group.id,
      groupName: group.name,
      requesterId: req.user.id,
      requesterUsername: req.user.username,
      status: 'pending'
    });

    // Preserve the compatibility requestId field used by the frontend.
    request.requestId = request.id;
    await request.save();

    await audit(
      req.user,
      'GROUP_JOIN_REQUESTED',
      {
        groupId: group.id
      }
    );

    await exportSnapshot();

    res.status(201).json(
      plain(request)
    );
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/groups/requests/admin/:id
 *
 * Return pending join requests for all groups administered by the specified user.
 *
 * The response also contains the administered groups and a convenience isGroupAdmin flag used by Angular.
 */
router.get('/requests/admin/:id', auth, async (req, res, next) => {
  try {
    // Find every group whose admins array contains the supplied user UUID.
    const groups = await Group.find({
      admins: req.params.id
    });

    const groupIds = groups.map(
      (group) => group.id
    );

    /**
     * Retrieve pending join requests whose groupId belongs to one of the administered groups.
     *
     * $in:
     *   Matches any request whose groupId occurs in the groupIds array.
     */
    const requests = await Request.find({
      type: 'join',
      status: 'pending',
      groupId: {
        $in: groupIds
      }
    });

    res.json({
      requests: requests.map(plain),
      groups: groups.map(plain),
      isGroupAdmin: groups.length > 0
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/groups/:gid/membership-requests/:rid/approve
 *
 * Approve a pending membership request as a Group Admin.
 *
 * The relevant group is re-loaded from MongoDB and isAdmin() verifies server-side authority before membership is changed.
 */
router.post(
  '/:gid/membership-requests/:rid/approve',
  auth,
  async (req, res, next) => {
    try {
      const group = await Group.findOne({
        id: req.params.gid
      });

      if (!isAdmin(group, req.user)) {
        return res.status(403).json({
          message: 'Group admin required.'
        });
      }

      // Require the request to belong to this group and represent a join operation.
      const request = await Request.findOne({
        id: req.params.rid,
        groupId: group.id,
        type: 'join'
      });

      if (!request) {
        return res.status(404).json({
          message: 'Request not found.'
        });
      }

      /**
       * Add the requester to the group's members array.
       *
       * addToSet() is the custom Document-array helper provided by database.js and prevents duplicate membership IDs.
       */
      group.members.addToSet(
        request.requesterId
      );

      await group.save();

      // Keep the User.groups relationship synchronised using MongoDB's native $addToSet operator.
      await User.updateOne(
        {
          id: request.requesterId
        },
        {
          $addToSet: {
            groups: group.id
          }
        }
      );

      request.status = 'approved';
      request.decidedAt = new Date();

      await request.save();

      await audit(
        req.user,
        'JOIN_APPROVED',
        {
          groupId: group.id,
          userId: request.requesterId
        }
      );

      await exportSnapshot();

      res.json(
        plain(request)
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/groups/:gid/membership-requests/:rid/reject
 *
 * Reject a membership request as a Group Admin.
 *
 * The request remains stored for history but is marked rejected with a reason and decision timestamp.
 */
router.post(
  '/:gid/membership-requests/:rid/reject',
  auth,
  async (req, res, next) => {
    try {
      const group = await Group.findOne({
        id: req.params.gid
      });

      if (!isAdmin(group, req.user)) {
        return res.status(403).json({
          message: 'Group admin required.'
        });
      }

      const request = await Request.findOne({
        id: req.params.rid,
        groupId: group.id
      });

      if (!request) {
        return res.status(404).json({
          message: 'Not found.'
        });
      }

      request.status = 'rejected';
      request.reason =
        req.body.reason ||
        'Rejected';
      request.decidedAt = new Date();

      await request.save();

      await audit(
        req.user,
        'JOIN_REJECTED',
        {
          groupId: group.id,
          userId: request.requesterId
        }
      );

      await exportSnapshot();

      res.json(
        plain(request)
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/groups/user/:id
 *
 * Return every group containing the specified user as a member.
 *
 * membershipRole:
 *   Adds a frontend-friendly role derived from whether the user's UUID also appears in the group's admins array.
 *
 * This group-level role is independent of the User.role global application role.
 */
router.get('/user/:id', auth, async (req, res, next) => {
  try {
    const groups = await Group.find({
      members: req.params.id
    });

    const memberships = groups.map((group) => ({
      ...plain(group),

      membershipRole: group.admins.includes(req.params.id)
        ? 'admin'
        : 'member'
    }));

    res.json(memberships);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/groups/owned/:id
 *
 * Return every group administered by the specified user.
 *
 * A user can administer multiple groups without becoming a global Super Admin.
 */
router.get('/owned/:id', auth, async (req, res, next) => {
  try {
    const groups = await Group.find({
      admins: req.params.id
    });

    res.json(
      groups.map(plain)
    );
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/groups/:id/members
 *
 * Return user information for every member of a group.
 *
 * Each returned user receives:
 * - role: "admin" or "member" based on the group's admins array.
 * - online: false as the current default/presentation value.
 *
 * publicUser() ensures password and MongoDB _id values are not exposed.
 */
router.get('/:id/members', auth, async (req, res, next) => {
  try {
    const group = await Group.findOne({
      id: req.params.id
    });

    if (!group) {
      return res.status(404).json({
        message: 'Not found.'
      });
    }

    /**
     * Retrieve all User documents whose application UUID occurs in the group's members array.
     *
     * $in:
     *   Matches users whose id is contained in group.members.
     */
    const users = await User
      .find({
        id: {
          $in: group.members
        }
      })
      .sort({ username: 1 });

    const members = users.map((user) => ({
      ...publicUser(user),

      role: group.admins.includes(user.id)
        ? 'admin'
        : 'member',

      online: false
    }));

    res.json(members);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/groups/:id/admins/:uid/promote
 *
 * Promote an existing group member to Group Admin.
 *
 * Only an existing administrator of this group may perform the promotion.
 * The target must already be a group member before administrator privileges can be granted.
 */
router.post(
  '/:id/admins/:uid/promote',
  auth,
  async (req, res, next) => {
    try {
      const group = await Group.findOne({
        id: req.params.id
      });

      if (!isAdmin(group, req.user)) {
        return res.status(403).json({
          message: 'Group admin required.'
        });
      }

      if (!group.members.includes(req.params.uid)) {
        return res.status(400).json({
          message: 'User must be a member first.'
        });
      }

      // Prevent duplicate administrator UUIDs using the custom array addToSet() helper.
      group.admins.addToSet(
        req.params.uid
      );

      await group.save();

      await audit(
        req.user,
        'ADMIN_PROMOTED',
        {
          groupId: group.id,
          userId: req.params.uid
        }
      );

      await exportSnapshot();

      res.json(
        plain(group)
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/groups/:id/admins/:uid/demote
 *
 * Remove Group Admin privileges from an existing administrator.
 *
 * A group must always retain at least one administrator, so the final administrator cannot be demoted.
 * Demotion changes only the admins array; the user remains a normal group member.
 */
router.post(
  '/:id/admins/:uid/demote',
  auth,
  async (req, res, next) => {
    try {
      const group = await Group.findOne({
        id: req.params.id
      });

      if (!isAdmin(group, req.user)) {
        return res.status(403).json({
          message: 'Group admin required.'
        });
      }

      if (!group.admins.includes(req.params.uid)) {
        return res.status(400).json({
          message: 'User is not an admin.'
        });
      }

      if (group.admins.length <= 1) {
        return res.status(400).json({
          message: 'A group must always have at least one admin.'
        });
      }

      // Create a new admins array containing every administrator except the target user.
      group.admins = group.admins.filter(
        (userId) => userId !== req.params.uid
      );

      await group.save();

      await audit(
        req.user,
        'ADMIN_DEMOTED',
        {
          groupId: group.id,
          userId: req.params.uid
        }
      );

      await exportSnapshot();

      res.json(
        plain(group)
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/groups/:id/members/:uid
 *
 * Remove a normal member from a group.
 *
 * Group Admins cannot be removed directly because doing so could silently remove administrative authority.
 * They must first be explicitly demoted using the administrator endpoint.
 */
router.delete(
  '/:id/members/:uid',
  auth,
  async (req, res, next) => {
    try {
      const group = await Group.findOne({
        id: req.params.id
      });

      if (!isAdmin(group, req.user)) {
        return res.status(403).json({
          message: 'Group admin required.'
        });
      }

      if (group.admins.includes(req.params.uid)) {
        return res.status(400).json({
          message: 'Demote the admin before removing them.'
        });
      }

      // Remove the target UUID from the group's member list.
      group.members = group.members.filter(
        (userId) => userId !== req.params.uid
      );

      await group.save();

      /**
       * Remove the reverse relationship from the User document.
       *
       * $pull:
       *   Removes the matching group UUID from the user's groups array.
       */
      await User.updateOne(
        {
          id: req.params.uid
        },
        {
          $pull: {
            groups: group.id
          }
        }
      );

      await audit(
        req.user,
        'MEMBER_REMOVED',
        {
          groupId: group.id,
          userId: req.params.uid
        }
      );

      await exportSnapshot();

      res.json({
        message: 'Member removed.'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/groups/:id
 *
 * Update group configuration as a Group Admin.
 *
 * Supported fields:
 * - name
 * - description
 * - theme
 * - ageLimit
 *
 * If the minimum age is increased, members below the new requirement are automatically removed from the group and from the
 *                                              corresponding User.groups arrays.
 */
router.put('/:id', auth, async (req, res, next) => {
  try {
    const group = await Group.findOne({
      id: req.params.id
    });

    if (!isAdmin(group, req.user)) {
      return res.status(403).json({
        message: 'Group admin required.'
      });
    }

    // Restrict group names to the application's 30-character maximum.
    if (req.body.name !== undefined) {
      group.name = String(
        req.body.name
      ).slice(0, 30);
    }

    // Restrict descriptions to the application's 250-character maximum.
    if (req.body.description !== undefined) {
      group.description = String(
        req.body.description
      ).slice(0, 250);
    }

    // Replace the stored theme when a new theme object is supplied.
    if (req.body.theme !== undefined) {
      group.theme = req.body.theme;
    }

    /**
     * Apply a changed minimum age and remove members who no longer satisfy the restriction.
     *
     * The relevant User documents are loaded so their stored ages can be compared with the new group ageLimit.
     *
     * u.age ?? 999:
     *   Uses the stored age when present and a high fallback value when age is null/undefined, preventing an absent age
     *                      value from being treated as zero by this specific cleanup calculation.
     */
    if (req.body.ageLimit !== undefined) {
      group.ageLimit = Number(
        req.body.ageLimit
      );

      const members = await User.find({
        id: {
          $in: group.members
        }
      });

      const removedUserIds = members
        .filter(
          (user) =>
            (user.age ?? 999) < group.ageLimit
        )
        .map(
          (user) => user.id
        );

      // Remove under-age users from both normal membership and administrator lists.
      group.members = group.members.filter(
        (userId) =>
          !removedUserIds.includes(userId)
      );

      group.admins = group.admins.filter(
        (userId) =>
          !removedUserIds.includes(userId)
      );

      // Keep the reverse User.groups relationship synchronised for removed users.
      await User.updateMany(
        {
          id: {
            $in: removedUserIds
          }
        },
        {
          $pull: {
            groups: group.id
          }
        }
      );
    }

    /**
     * Prevent a configuration change from leaving an existing group without any administrator.
     *
     * This is particularly important when an increased age limit removes an administrator.
     */
    if (
      group.admins.length === 0 &&
      group.members.length > 0
    ) {
      return res.status(400).json({
        message: 'Age change would leave the group without an administrator.'
      });
    }

    await group.save();

    await audit(
      req.user,
      'GROUP_UPDATED',
      {
        groupId: group.id
      }
    );

    await exportSnapshot();

    res.json(
      plain(group)
    );
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/groups/channels
 *
 * Create a channel inside a group.
 *
 * Only an administrator of the specified group may create channels.
 */
router.post('/channels', auth, async (req, res, next) => {
  try {
    const group = await Group.findOne({
      id: req.body.groupId
    });

    if (!isAdmin(group, req.user)) {
      return res.status(403).json({
        message: 'Group admin required.'
      });
    }

    const name = String(
      req.body.name || ''
    ).trim();

    if (!name) {
      return res.status(400).json({
        message: 'Channel name required.'
      });
    }

    const channel = await Channel.create({
      groupId: group.id,
      name,
      description: String(
        req.body.description || ''
      ).trim()
    });

    await audit(
      req.user,
      'CHANNEL_CREATED',
      {
        groupId: group.id,
        channelId: channel.id
      }
    );

    await exportSnapshot();

    res.status(201).json(
      plain(channel)
    );
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/groups/:id/rooms
 *
 * Return the channels/rooms belonging to a group.
 *
 * Access is permitted when:
 * - the authenticated user belongs to the group's members array, or
 * - the authenticated user is the global Super Admin.
 *
 * Channels are returned alphabetically by name.
 */
router.get('/:id/rooms', auth, async (req, res, next) => {
  try {
    const group = await Group.findOne({
      id: req.params.id
    });

    if (
      !group ||
      (
        !group.members.includes(req.user.id) &&
        req.user.role !== 'super-admin'
      )
    ) {
      return res.status(403).json({
        message: 'Group membership required.'
      });
    }

    const channels = await Channel
      .find({
        groupId: group.id
      })
      .sort({ name: 1 });

    res.json(
      channels.map(plain)
    );
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/groups/channels/group/:id
 *
 * Return all channels whose groupId matches the supplied group UUID.
 *
 * This endpoint is retained separately from /:id/rooms for frontend/API compatibility.
 */
router.get('/channels/group/:id', auth, async (req, res, next) => {
  try {
    const channels = await Channel.find({
      groupId: req.params.id
    });

    res.json(
      channels.map(plain)
    );
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/groups/channels/:id
 *
 * Update an existing channel as an administrator of its parent group.
 *
 * The server first loads the Channel, then loads its Group using channel.groupId and finally checks Group Admin authority.
 * This prevents the client from choosing a different group ID to bypass the authorisation check.
 */
router.put('/channels/:id', auth, async (req, res, next) => {
  try {
    const channel = await Channel.findOne({
      id: req.params.id
    });

    const group = channel
      ? await Group.findOne({
          id: channel.groupId
        })
      : null;

    if (
      !channel ||
      !isAdmin(group, req.user)
    ) {
      return res.status(403).json({
        message: 'Group admin required.'
      });
    }

    if (req.body.name !== undefined) {
      channel.name = String(
        req.body.name
      ).trim();
    }

    if (req.body.description !== undefined) {
      channel.description = String(
        req.body.description
      ).trim();
    }

    await channel.save();

    await audit(
      req.user,
      'CHANNEL_UPDATED',
      {
        groupId: group.id,
        channelId: channel.id
      }
    );

    await exportSnapshot();

    res.json(
      plain(channel)
    );
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/groups/channels/:id
 *
 * Permanently delete a channel as an administrator of its parent group.
 *
 * As with channel updates, the group is derived from the stored Channel document and Group Admin authority is checked
 *                                          server-side before deletion.
 */
router.delete('/channels/:id', auth, async (req, res, next) => {
  try {
    const channel = await Channel.findOne({
      id: req.params.id
    });

    const group = channel
      ? await Group.findOne({
          id: channel.groupId
        })
      : null;

    if (
      !channel ||
      !isAdmin(group, req.user)
    ) {
      return res.status(403).json({
        message: 'Group admin required.'
      });
    }

    await Channel.deleteOne({
      id: channel.id
    });

    await audit(
      req.user,
      'CHANNEL_DELETED',
      {
        groupId: group.id,
        channelId: channel.id
      }
    );

    await exportSnapshot();

    res.json({
      message: 'Channel deleted.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Export the configured Express router for mounting under /api/groups in server.js.
 */
module.exports = router;