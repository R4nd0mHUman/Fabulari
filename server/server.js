/**
 * Fabuloso Phase 2 application server.
 *
 * This file is the main entry point for the Node.js backend and is responsible for:
 * - Creating and configuring the Express REST API.
 * - Connecting the application to MongoDB.
 * - Registering the authentication, profile, group and admin API routes.
 * - Serving uploaded files through Express.
 * - Creating the HTTP server used by both Express and Socket.io.
 * - Managing real-time group chat through Socket.io.
 * - Persisting chat messages and enforcing the five-message history limit.
 * - Handling server/database errors centrally.
 *
 * Application architecture:
 * - Angular frontend: http://localhost:4200
 * - Node.js/Express backend: http://localhost:3000
 * - MongoDB: persistent application database.
 * - Socket.io: persistent two-way connection used for live group chat.
 *
 * Angular runs separately from this server.
 * The frontend sends normal HTTP requests to the Express API and uses Socket.io when real-time communication is required.
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const db = require('./database');
const { validChatImage } = require('./validation');
const { exportSnapshot } = require('./export-snapshot');

/**
 * Create the Express application and wrap it in a Node HTTP server.
 *
 * Express:
 *   Handles REST API routes, middleware and static files.
 *
 * HTTP server:
 *   Socket.io needs access to the underlying HTTP server so Express HTTP requests and WebSocket/Socket.io connections
 *                                               can use the same port.
 *
 * Socket.io:
 *   Provides persistent, two-way communication between the Angular client and server for real-time group chat.
 */
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    // Only allow the locally running Angular application to open Socket.io connections.
    origin: 'http://localhost:4200',

    // These methods are used during Socket.io's HTTP/WebSocket connection process.
    methods: ['GET', 'POST'],
  },

  maxHttpBufferSize: 4 * 1024 * 1024 // Allows Socket.io to receive the Base64 representation of a chat image.
    /*A binary image becomes larger when converted to Base64, so the Socket.io transport limit must be larger than
    the application's 2 MB decoded-image limit. The application still performs its own strict 2 MB validation below. */
});

/**
 * Enable Cross-Origin Resource Sharing (CORS).
 *
 * Angular runs on port 4200 while this backend runs on port 3000.
 * Because these are different origins, the browser would normally block Angular from making requests to the API.
 * CORS explicitly allows the Angular development server to communicate with this Express server.
 */
app.use(cors({
  origin: 'http://localhost:4200'
}));

/**
 * Parse incoming JSON request bodies.
 *
 * Express converts JSON request bodies into JavaScript objects available through req.body.
 *
 * limit:
 *   Allows request bodies up to 3 MB. This is large enough for the application's expected JSON payloads while still
 *                                      preventing excessively large requests.
 *
 * Chat images have their own stricter 2 MB validation below.
 */
app.use(express.json({ limit: '3mb' }));

/**
 * Expose files inside the local "uploads" directory through /uploads URLs.
 *
 * __dirname:
 *   Absolute path of the directory containing this server file.
 *
 * path.join():
 *   Creates a platform-safe path to the uploads directory.
 *
 * Example:
 *   uploads/example.png
 *   -> http://localhost:3000/uploads/example.png
 */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/**
 * Register the application's REST API route modules.
 *
 * Each router handles a separate area of backend functionality.
 * Express prefixes every route declared inside the router with the path supplied here.
 *
 * Examples:
 *   ./routes/auth    -> /api/auth/...
 *   ./routes/profile -> /api/profile/...
 *   ./routes/groups  -> /api/groups/...
 *   ./routes/admin   -> /api/admin/...
 *
 * Keeping these concerns in separate route files prevents server.js from becoming responsible for every individual API endpoint.
 */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/admin', require('./routes/admin'));

const onlineUsers = new Map(); // Tracks how many active Socket.io connections each user currently has.

/**
 * Handle Socket.io connections.
 *
 * Socket.io gives the application a persistent two-way connection rather than requiring the browser to repeatedly poll
 *                                              the REST API for new messages.
 *
 *                      Each connected browser receives its own "socket" object.
 * Chat channels are represented by Socket.io rooms, allowing messages to be broadcast only to users
 *                                who have joined the same channel.
 */
io.on('connection', (socket) => {

  /**
   * Join a user to a chat channel.
   *
   * Client payload:
   * {
   *   channelId,
   *   userId,
   *   username
   * }
   *
   * Security:
   *   The server does NOT trust the username supplied by the browser. 
   *   It retrieves the actual user from MongoDB and uses the stored username.
   *
   * Before allowing the socket to join, the server verifies:
   * 1. The channel exists.
   * 2. The channel belongs to an existing group.
   * 3. The user exists.
   * 4. The user is actually a member of that group.
   */
  socket.on('join-channel', async ({ channelId, userId, username }) => {
    try {
      // Find the requested channel in MongoDB using the application's custom ID.
      const gChannel = await db.Channel.findOne({ id: channelId });

      /**
       * If the channel exists, retrieve the group that owns it.
       *
       * The conditional expression avoids attempting a group lookup when the supplied channel ID does not correspond
       *                                                to a real channel.
       */
      const group = gChannel
        ? await db.Group.findOne({ id: gChannel.groupId })
        : null;

      // Retrieve the user attempting to enter the channel.
      const user = await db.User.findOne({ id: userId });

      /**
       * Authorisation check.
       *
       * A socket may only enter the room if:
       * - the user exists,
       * - the group exists, and
       * - the group's members array contains the user's ID.
       *
       * This prevents a client from joining another group's chat simply by sending a different channelId through Socket.io.
       */
      if (!user || !group || !group.members.includes(userId)) {
        socket.emit('chat-error', {
          message: 'You are not a member of this group.'
        });

        return;
      }

      /**
       * Add this socket to the Socket.io room identified by channelId.
       *
       * Future broadcasts sent with io.to(channelId) will therefore only be delivered to sockets currently inside this channel.
       */
      socket.join(channelId);

      /**
       * Store trusted connection information directly on the socket.
       *
       * socket.data persists for the lifetime of this connection and allows later events such as send-message to verify that
       *                        the payload matches the channel and user that originally joined.
       *
       * Importantly, username comes from the database rather than trusting whatever username the client supplied.
       */
      socket.data = {
        channelId,
        userId,
        username: user.username,
        profilePicture: user.profilePicture || ''
      };

      /*
       * Register this connection for online/offline presence.
       * presenceRegistered prevents the same socket from accidentally increasing the user's connection count more than once.
       */
      if (!socket.data.presenceRegistered) {

        const connectionCount =
          (onlineUsers.get(userId) || 0) + 1;

        onlineUsers.set(
          userId,
          connectionCount
        );

        socket.data.presenceRegistered = true;
      }

      /*
       * Tell every browser in this channel which users are currently online.
       * Only user IDs are transmitted because Angular already receives the username and profile information with each chat message.
       */
      io.to(channelId).emit(
        'online-users',
        Array.from(onlineUsers.keys())
      );

      // Replace the client-supplied username with the trusted database value.
      username = user.username;

      /**
       * Retrieve the five newest messages for this channel.
       *
       * sort({ timestamp: -1 }):
       *   Newest messages first.
       *
       * limit(5):
       *   Only retrieve the five messages retained for the channel.
       *
       * reverse():
       *   MongoDB returned newest -> oldest, but the chat interface should display history chronologically from oldest -> newest.
       */
      const history = await db.Message
        .find({ channelId })
        .sort({ timestamp: -1 })
        .limit(5);

      /*
       * Enrich each persisted chat message with the sender's CURRENT
       * profile picture before sending the history to Angular.
       *
       * Older messages may have been created before profile pictures were
       * stored with messages, and users may also change their profile picture.
       *
       * The users collection is therefore the authoritative source for
       * profile information.
       */
      const enrichedHistory = await Promise.all(

        history.reverse().map(async (message) => {

          // Convert the database message document into a normal object.
          const object = message.toObject();

          // MongoDB's internal ID is not needed by Angular.
          delete object._id;

          // Retrieve the user who originally sent this message.
          const messageUser = await db.User.findOne({
            id: object.userId
          });

          /*
           * Attach the user's current profile picture.
           * An empty string causes Angular to use the default avatar.
           */
          object.profilePicture =
            messageUser?.profilePicture || '';

          return object;

        })

      );

      // Send the enriched five-message history to the joining browser.
      socket.emit(
        'chat-history',
        enrichedHistory
      );

      /*
       * Tell everyone else already inside the room that this user joined.
       *
       * socket.to(...):
       *   Broadcasts to the room EXCEPT the socket that triggered the event.
       */
      socket.to(channelId).emit('system-message', {
        text: `${username} joined the room.`
      });
    } catch (error) {
      // Return a controlled client-facing error instead of exposing database details.
      socket.emit('chat-error', {
        message: 'Could not join channel.'
      });
    }
  });

  /*
   * Receive and persist a new chat message.
   *
   * A message may contain:
   * - text,
   * - an image,
   * - or both.
   *
   * Images arrive as Base64 data URLs and are validated for both file type and decoded size before being stored.
   */
  socket.on('send-message', async (payload) => {
    try {
      /*
       * Verify that the message belongs to the same authenticated socket state established during join-channel.
       *
       * Optional chaining (?.) safely returns undefined if socket.data has not been established yet.
       *
       * This prevents a connected client from joining one channel and then submitting a payload pretending to belong
       *                                        to another channel or user.
       */
      if (
        socket.data?.channelId !== payload.channelId ||
        socket.data?.userId !== payload.userId
      ) {
        return;
      }

      /*
       * Normalise message data.
       *
       * String(...):
       *   Ensures the values are strings even if unexpected input is supplied.
       *
       * trim():
       *   Removes leading/trailing whitespace from text so a message containing only spaces is treated as empty.
       */
      const text = String(payload.text || '').trim();
      const image = String(payload.image || '');

      // Image validation is shared with the backend unit tests so tests exercise the production rule.
      const imageIsValid = validChatImage(image);

      // Reject messages that contain neither usable text nor an image.
      if (!text && !image) {
        return socket.emit('chat-error', {
          message: 'Enter a message or choose an image.'
        });
      }

      /*
       * Reject invalid or oversized images.
       *
       * 2 * 1024 * 1024 bytes = 2 MiB.
       *
       * Both conditions are checked here:
       * - the image must use an allowed MIME type/data URL format;
       * - the decoded image must not exceed the 2 MB application limit.
       */
      if (
        image &&
        !imageIsValid
      ) {
        return socket.emit('chat-error', {
          message: 'Chat images must be PNG, JPEG or GIF and no larger than 2 MB.'
        });
      }

      /*
       * Persist the new message in MongoDB.
       *
       * username is taken from socket.data instead of the client payload so users cannot
       *                impersonate another username when sending a message.
       *
       * deleted starts as false and can later be changed by delete-message.
       */
      const message = await db.Message.create({
        channelId: payload.channelId,
        userId: payload.userId,
        username: socket.data.username,
        text,
        image,
        deleted: false
      });

      /**
       * Enforce the five-message-per-channel persistence requirement.
       *
       * Messages are sorted newest first.
       * skip(5) ignores the five newest messages and therefore returns every older message that should be removed.
       */
      const oldMessages = await db.Message
        .find({ channelId: payload.channelId })
        .sort({ timestamp: -1 })
        .skip(5);

      /**
       * Delete messages outside the five-message history window.
       * $in allows MongoDB to remove every message whose custom id appears in the generated array using a single deleteMany operation.
       */
      if (oldMessages.length) {
        await db.Message.deleteMany({
          id: {
            $in: oldMessages.map((oldMessage) => oldMessage.id)
          }
        });
      }

      /**
       * Export the current database snapshot after persistent data changes.
       * Awaiting the operation ensures the snapshot is updated before the server finishes processing this message event.
       */
      await exportSnapshot();

      /**
       * Convert the database message document into a plain object before broadcasting.
       * MongoDB's internal _id is removed because clients use the application's own message ID.
       */
      const object = message.toObject();
      delete object._id;
      object.profilePicture = socket.data.profilePicture || '';

      /**
       * Broadcast the new message to EVERY socket in this channel.
       *
       * Unlike socket.to(...), io.to(...) includes the sender.
       * This means the sending client's interface receives exactly the same saved message object as every other member of the room.
       */
      io.to(payload.channelId).emit('new-message', object);
    } catch (error) {
      socket.emit('chat-error', {
        message: 'Message could not be sent.'
      });
    }
  });

  /**
   * Delete one of the current user's messages.
   *
   * The query includes messageId, channelId AND userId.
   * This means a message is only found when it belongs to both the requested channel and the user requesting the deletion.
   *
   * Instead of physically deleting the record, the application performs a soft deletion
   *            by removing its visible content and setting deleted=true.
   * 
   * This allows clients to represent the message as deleted while preserving the message record itself.
   */
  socket.on('delete-message', async ({ channelId, messageId, userId }) => {
    try {
      const message = await db.Message.findOne({
        id: messageId,
        channelId,
        userId
      });

      // Silently stop if no matching user-owned message exists.
      if (!message) {
        return;
      }

      // Remove the visible message contents and mark the record as deleted.
      message.text = '';
      message.image = '';
      message.deleted = true;

      // Persist the modified message document through the native MongoDB data layer.
      await message.save();

      // Keep the exported snapshot synchronised with the changed database state.
      await exportSnapshot();

      /**
       * Tell every connected client in the room which message was deleted.
       *
       * Clients can update the existing message immediately without reloading the page or requesting the
       *                                      complete chat history again.
       */
      io.to(channelId).emit('message-deleted', {
        messageId
      });
    } catch (error) {
      socket.emit('chat-error', {
        message: 'Message could not be deleted.'
      });
    }
  });

  /**
   * Handle a client disconnecting from Socket.io.
   *
   * socket.data is only populated after a successful join-channel event,
   * so optional chaining prevents errors when a connection disconnects before joining a room.
   *
   * socket.to(...) excludes the disconnected/current socket and informs the remaining members of the room that the user has left.
   */
  socket.on('disconnect', () => {

    const channelId = socket.data?.channelId;
    const userId = socket.data?.userId;

    if (!channelId || !userId) {
      return;
    }

    /*
    * Reduce the number of active connections belonging to this user.
    *
    * The user becomes offline only when their final active Socket.io
    * connection has disconnected.
    */
    if (socket.data.presenceRegistered) {

      const remainingConnections =
        (onlineUsers.get(userId) || 1) - 1;

      if (remainingConnections <= 0) {

        onlineUsers.delete(userId);

      } else {

        onlineUsers.set(
          userId,
          remainingConnections
        );

      }

    }

    // Tells the remaining users that this member left the chat room.
    socket.to(channelId).emit('system-message', {
      text: `${socket.data.username} left the room.`
    });

    // Broadcasts the updated presence information to the remaining clients.
    io.to(channelId).emit(
      'online-users',
      Array.from(onlineUsers.keys())
    );

  });
});

/**
 * Central Express error-handling middleware.
 *
 * Express recognises this as an error handler because it has four parameters:
 * err, req, res and next.
 *
 * Keeping common errors here avoids duplicating the same response logic across multiple route modules and
 *          prevents unexpected database/request errors from terminating the Node.js process.
 *
 * IMPORTANT:
 *   Error-handling middleware is registered after the API routes so errors forwarded by those routes can reach this handler.
 */
app.use((err, req, res, next) => {
  // Log the complete error server-side for debugging without exposing it to users.
  console.error(err);

  /**
   * Multer file-size error.
   * LIMIT_FILE_SIZE is produced when an uploaded file exceeds the configured Multer upload limit.
   */
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: 'Image is too large. Maximum size is 2 MB.'
    });
  }

  /**
   * MongoDB duplicate-key error.
   *
   * Error code 11000 means a value violated a unique database constraint,
   * such as attempting to create another record with a unique value that is already stored.
   */
  if (err?.code === 11000) {
    return res.status(400).json({
      message: 'That value is already in use.'
    });
  }

  /**
   * Fallback for unexpected server errors.
   *
   * A generic response is intentionally returned rather than sending the raw exception,
   *                  stack trace or database details to the browser.
   */
  return res.status(500).json({
    message: 'Server error. Please retry or check the server terminal.'
  });
});

/**
 * Start the application.
 * 
 * This async Immediately Invoked Function Expression (IIFE) allows await to be used during startup without converting the
 *                                              entire file into an ES module.
 *
 * Startup order:
 * 1. Connect to MongoDB.
 * 2. Export the initial database snapshot.
 * 3. Start listening for HTTP and Socket.io traffic on port 3000.
 *
 * The server deliberately does NOT begin accepting browser requests until MongoDB has connected successfully.
 * This prevents requests from reaching routes while the application's required persistent database is unavailable.
 */
(async () => {
  try {
    // Establish the MongoDB database connection first.
    await db.connectDatabase();

    // Generate/update the initial snapshot from the connected database.
    await exportSnapshot();

    /**
     * Start the shared HTTP server.
     *
     * server.listen() is used instead of app.listen() because Socket.io and Express both need to operate through the
     *                                            same Node HTTP server.
     */
    server.listen(3000, () => {
      console.log(
        'Fabuloso API + Socket.io running on http://localhost:3000'
      );
    });
  } catch (error) {
    /**
     * Fail clearly if MongoDB cannot be reached.
     * The application must use MongoDB as its persistent database, so silently continuing without a database could
     *                                  produce inconsistent or misleading behaviour.
     */
    console.error(
      'FATAL: MongoDB connection failed. Start MongoDB and retry.'
    );

    // Print the underlying connection error to the server terminal for debugging.
    console.error(error.message);

    /**
     * Exit with status code 1.
     * A non-zero process exit code communicates to the operating system or development tooling that startup failed rather
     *                                           than shutting down normally.
     */
    process.exit(1);
  }
})();