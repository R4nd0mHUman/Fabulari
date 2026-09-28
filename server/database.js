/**
 * Native MongoDB data-access layer for Fabuloso Phase 2.
 *
 * This module centralises the application's MongoDB connection, collections, reusable database operations,
 *                  document/query wrappers and common database-related helper functions.
 *                It also uses MongoClient directly from the native MongoDB Node.js driver.
 *
 * A small custom Model/Document/Query abstraction keeps the route code readable while still translating every database
 * operation into native MongoDB collection calls. These classes are application-defined helpers only; they are not Mongoose models, documents or queries.
 */

const { MongoClient } = require('mongodb');
const crypto = require('crypto');

/**
 * Configure the MongoDB connection.
 *
 * MONGODB_URI:
 *   Uses the MONGODB_URI environment variable when one has been configured, otherwise defaults to the local fabuloso
 *                                                  MongoDB database.
 *
 * DATABASE_NAME:
 *   Identifies the MongoDB database used by Fabuloso.
 *
 * client:
 *   Stores the MongoClient instance responsible for the connection to the MongoDB server.
 *
 * database:
 *   Stores the connected Db instance used to access Fabuloso collections.
 *
 * Both client and database begin as undefined and are populated by connectDatabase().
 */
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/fabuloso_phase2';

const DATABASE_NAME = 'fabuloso_phase2';

let client;
let database;

/**
 * Connect to MongoDB and prepare the indexes required by Fabuloso.
 *
 * If a database connection already exists, the existing Db instance is returned instead of creating another MongoClient connection.
 *
 * MongoClient:
 *   Comes directly from the official `mongodb` Node.js driver and manages the connection to the MongoDB server.
 *
 * client.connect():
 *   Establishes the connection before any collections are accessed.
 *
 * client.db():
 *   Selects the fabuloso_phase2 database from the connected MongoDB server.
 *
 * The required indexes are created after connecting so important identifiers remain unique and message history queries
 *                                             can be performed efficiently.
 */
async function connectDatabase() {
  // Reuse the existing database connection if this module has already connected.
  if (database) {
    return database;
  }

  // Create and establish a new native MongoDB client connection.
  client = new MongoClient(MONGODB_URI);
  await client.connect();

  // Select the Fabuloso database used by the application.
  database = client.db(DATABASE_NAME);

  /**
   * Create the database indexes required by the application.
   *
   * Promise.all():
   *   Creates the independent indexes concurrently and waits for all index operations to complete before startup continues.
   *
   * { id: 1 }:
   *   Creates an ascending index for the application's custom UUID-style id fields.
   *
   * { unique: true }:
   *   Prevents multiple documents from using the same indexed value.
   *
   * User email is also unique so two accounts cannot register with the same stored email address.
   *
   * { channelId: 1, timestamp: -1 }:
   *   Creates a compound message index ordered first by channel and then by newest timestamp.
   *   This supports the chat queries that retrieve recent messages for a particular channel.
   */
  await Promise.all([
    database.collection('users').createIndex(
      { id: 1 },
      { unique: true }
    ),

    database.collection('users').createIndex(
      { email: 1 },
      { unique: true }
    ),

    database.collection('groups').createIndex(
      { id: 1 },
      { unique: true }
    ),

    database.collection('channels').createIndex(
      { id: 1 },
      { unique: true }
    ),

    database.collection('messages').createIndex({
      channelId: 1,
      timestamp: -1
    })
  ]);

  // Confirm the successful connection and identify that the native MongoDB driver is being used.
  console.log(
    `MongoDB connected: ${database.databaseName} (native mongodb driver)`
  );

  return database;
}

/**
 * Close the current MongoDB connection.
 *
 * client.close():
 *   Gracefully closes the MongoClient connection when one exists.
 *
 * Resetting both variables to undefined ensures a later call to connectDatabase() creates a fresh connection rather than
 *                                          incorrectly reusing the closed client.
 */
async function disconnectDatabase() {
  if (client) {
    await client.close();
  }

  client = undefined;
  database = undefined;
}

/**
 * Retrieve a native MongoDB collection from the connected Fabuloso database.
 *
 * name:
 *   MongoDB collection name to retrieve, such as "users", "groups" or "messages".
 *
 * The connection check prevents database operations from silently running before connectDatabase() has successfully completed.
 *
 * @param {string} name MongoDB collection name.
 * @returns {import('mongodb').Collection} Native MongoDB collection instance.
 */
function collection(name) {
  if (!database) {
    throw new Error('MongoDB has not been connected yet.');
  }

  return database.collection(name);
}

/**
 * Create a deep copy of a value using JavaScript's native structuredClone().
 *
 * Deep cloning prevents nested arrays or objects in defaults/database values from accidentally sharing references and
 *                                      being modified elsewhere in the application.
 *
 * @param {*} value Value to copy.
 * @returns {*} Independent deep copy of the supplied value.
 */
function clone(value) {
  return structuredClone(value);
}

/**
 * Lightweight application document wrapper.
 *
 *                          MongoDB's native driver normally returns plain JavaScript objects.
 * Document wraps those objects with helper behaviour used throughout Fabuloso, such as toObject(), save() and addToSet()
 *                                                  support for arrays.
 *
 * This is a custom Fabuloso class and is NOT a Mongoose Document.
 */
class Document {
  /**
   * Create a wrapped database document.
   *
   * model:
   *   Custom model definition that identifies which MongoDB collection owns this document.
   *
   * data:
   *   Plain object returned from MongoDB or created by makeModel().
   *
   * _model is deliberately non-enumerable so internal model metadata is not included when the document is converted back
   *                                        into a plain object or saved to MongoDB.
   */
  constructor(model, data) {
    Object.defineProperty(this, '_model', {
      value: model,
      enumerable: false
    });

    // Copy the document's stored fields directly onto this wrapper instance.
    Object.assign(this, data);

    // Add the custom addToSet() helper to any array fields contained in the document.
    this._decorateArrays();
  }

  /**
   * Add a non-enumerable addToSet() helper to array fields on this document.
   *
   * addToSet():
   *   Adds a value only when the array does not already contain it.
   *   This provides convenient set-like behaviour for fields such as group membership without creating duplicates.
   *
   * Object.keys(this):
   *   Examines the document's enumerable data fields while automatically ignoring the non-enumerable internal _model property.
   *
   * The helper itself is also non-enumerable so it is not treated as database data by Object.entries(), toObject() or save().
   */
  _decorateArrays() {
    for (const key of Object.keys(this)) {
      if (
        Array.isArray(this[key]) &&
        typeof this[key].addToSet !== 'function'
      ) {
        Object.defineProperty(this[key], 'addToSet', {
          enumerable: false,

          value: (value) => {
            if (!this[key].includes(value)) {
              this[key].push(value);
            }
          }
        });
      }
    }
  }

  /**
   * Convert this Document wrapper into a plain independent JavaScript object.
   *
   * Object.entries(this):
   *   Reads the enumerable database fields while excluding internal non-enumerable properties such as _model
   *                                    and the custom array addToSet() methods.
   *
   * clone():
   *   Deep-copies each value so callers can work with the returned object without accidentally mutating this Document instance.
   *
   * @returns {Object} Plain copy of the document's stored data.
   */
  toObject() {
    const output = {};

    for (const [key, value] of Object.entries(this)) {
      output[key] = clone(value);
    }

    return output;
  }

  /**
   * Persist the current state of this document to MongoDB.
   *
   * _decorateArrays():
   *   Ensures newly assigned array properties also receive the custom addToSet() helper before conversion.
   *
   * replaceOne():
   *   Replaces the stored document whose application-level id matches this document's id.
   *
   * { upsert: true }:
   *   Updates the existing document when found or inserts it if no matching document currently exists.
   *
   * Returning this allows callers to continue working with the same Document instance after saving.
   *
   * @returns {Promise<Document>} This saved document.
   */
  async save() {
    this._decorateArrays();

    const data = this.toObject();

    delete data._id;

    await collection(this._model.collectionName).updateOne(
      { id: this.id },
      { $set: data},
      { upsert: true }
    );

    return this;
  }
}

/**
 * Lightweight chainable query wrapper for native MongoDB find operations.
 *
 * This provides readable syntax such as:
 *   db.Message.find({ channelId }).sort({ timestamp: -1 }).limit(5)
 *
 * Internally, exec() translates the stored options into operations on a native MongoDB cursor.
 *
 * This is a custom Fabuloso query abstraction and is NOT a Mongoose Query.
 */
class Query {
  /**
   * Create a query for a particular model and MongoDB filter.
   *
   * sortSpec:
   *   Stores an optional MongoDB sort specification.
   *
   * limitCount:
   *   Stores an optional maximum number of results. null means no limit has been requested.
   *
   * skipCount:
   *   Stores the number of matching documents to skip before returning results.
   */
  constructor(model, filter = {}) {
    this.model = model;
    this.filter = filter;
    this.sortSpec = null;
    this.limitCount = null;
    this.skipCount = 0;
  }

  /**
   * Store the MongoDB sort specification and return this query for method chaining.
   *
   * Example:
   *   .sort({ timestamp: -1 })
   */
  sort(spec) {
    this.sortSpec = spec;
    return this;
  }

  /**
   * Store the maximum number of documents to return and preserve method chaining.
   *
   * Example:
   *   .limit(5)
   */
  limit(count) {
    this.limitCount = count;
    return this;
  }

  /**
   * Store the number of matching documents to skip and preserve method chaining.
   *
   * Example:
   *   .skip(5)
   */
  skip(count) {
    this.skipCount = count;
    return this;
  }

  /**
   * Compatibility helper used by existing application code.
   *
   * The native wrapper already controls conversion itself, so lean() does not need to change query behaviour.
   * Returning this preserves the chain when existing code calls methods such as .find().lean(false).
   */
  lean() {
    return this;
  }

  /**
   * Execute the configured query using a native MongoDB cursor.
   *
   * find():
   *   Creates the native cursor using the query's collection and filter.
   *
   * sort(), skip() and limit():
   *   Are applied only when their corresponding query options have been configured.
   *
   * toArray():
   *   Executes the cursor and returns all matching results as an array of plain MongoDB documents.
   *
   * Each result is then wrapped in the custom Document class so the rest of Fabuloso can use helpers such as
   *                                            save() and toObject().
   *
   * @returns {Promise<Document[]>} Wrapped documents matching the query.
   */
  async exec() {
    let cursor = collection(this.model.collectionName).find(this.filter);

    if (this.sortSpec) {
      cursor = cursor.sort(this.sortSpec);
    }

    if (this.skipCount) {
      cursor = cursor.skip(this.skipCount);
    }

    if (this.limitCount !== null) {
      cursor = cursor.limit(this.limitCount);
    }

    const documents = await cursor.toArray();

    return documents.map(
      (document) => new Document(this.model, document)
    );
  }

  /**
   * Make Query objects awaitable.
   *
   * JavaScript treats an object containing a then() method as a "thenable".
   * This allows route code to write `await db.User.find(...)` directly without manually calling exec().
   *
   * resolve and reject are supplied by the Promise/await machinery and are forwarded to the promise returned by exec().
   */
  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

/**
 * Create a lightweight model for a MongoDB collection.
 *
 * collectionName:
 *   Name of the native MongoDB collection used by the model.
 *
 * defaults:
 *   Default values automatically applied when a new document is created.
 *
 * The returned model exposes the common database operations required by the application while still using
 *                      the official MongoDB driver's collection methods internally.
 *
 * @param {string} collectionName MongoDB collection name.
 * @param {Object} defaults Default values for newly created documents.
 * @returns {Object} Custom Fabuloso model wrapper.
 */
function makeModel(collectionName, defaults = {}) {
  const model = {
    // Store the collection name so Document and Query instances know which native MongoDB collection to access.
    collectionName,

    /**
     * Begin a chainable query for documents matching the supplied filter.
     *
     * An empty filter {} matches all documents.
     */
    find(filter = {}) {
      return new Query(model, filter);
    },

    /**
     * Find the first document matching the supplied MongoDB filter.
     *
     * Native MongoDB returns null when no document matches, so this method preserves null or wraps the result in the
     *                                            custom Document class.
     */
    async findOne(filter = {}) {
      const document = await collection(collectionName).findOne(filter);

      return document
        ? new Document(model, document)
        : null;
    },

    /**
     * Check whether at least one matching document exists.
     *
     * projection: { _id: 1 }:
     *   Requests only MongoDB's internal _id because the full document is unnecessary for an existence check.
     *
     * !!:
     *   Converts the returned document or null value into a true/false result.
     */
    async exists(filter = {}) {
      return !!(
        await collection(collectionName).findOne(
          filter,
          { projection: { _id: 1 } }
        )
      );
    },

    /**
     * Create and insert a new document.
     *
     * The configured defaults are deep-cloned first so mutable arrays/objects are not shared between documents.
     *
     * Special boolean default markers:
     * - createdAt: true -> replaced with the current Date.
     * - timestamp: true -> replaced with the current Date.
     * - deletedAt: true -> replaced with the current Date.
     *
     * Data supplied by the caller is spread after the defaults, allowing explicitly supplied values to override default values.
     *
     * crypto.randomUUID():
     *   Generates the application's custom unique ID when the caller has not supplied one.
     *
     * insertOne():
     *   Uses the official MongoDB driver's native collection method to persist the new document.
     */
    async create(data = {}) {
      const seed = clone(defaults);

      if (seed.createdAt === true) {
        seed.createdAt = new Date();
      }

      if (seed.timestamp === true) {
        seed.timestamp = new Date();
      }

      if (seed.deletedAt === true) {
        seed.deletedAt = new Date();
      }

      const document = {
        ...seed,
        ...clone(data)
      };

      if (!document.id) {
        document.id = crypto.randomUUID();
      }

      await collection(collectionName).insertOne(document);

      return new Document(model, document);
    },

    /**
     * Delete the first document matching the supplied native MongoDB filter.
     */
    deleteOne(filter) {
      return collection(collectionName).deleteOne(filter);
    },

    /**
     * Delete every document matching the supplied filter.
     *
     * The default empty filter {} intentionally allows scripts such as the development reset utility to
     *                                      clear an entire collection.
     */
    deleteMany(filter = {}) {
      return collection(collectionName).deleteMany(filter);
    },

    /**
     * Update the first document matching the supplied filter using a native MongoDB update document such as $set, $push or $pull.
     */
    updateOne(filter, update) {
      return collection(collectionName).updateOne(filter, update);
    },

    /**
     * Update every document matching the supplied filter using the supplied native MongoDB update document.
     */
    updateMany(filter, update) {
      return collection(collectionName).updateMany(filter, update);
    }
  };

  return model;
}

/**
 * Define the application's collection models and their default document values.
 *
 * These are lightweight wrappers created by makeModel(); they are NOT Mongoose models.
 *
 * User:
 *   Standard users begin with the "user" role, no group memberships, an empty profile picture and the current creation time.
 *
 * Group:
 *   New groups begin with an empty theme, member/admin arrays and the current creation time.
 *
 * Channel and Request:
 *   Automatically record when they were created.
 *
 * AuditLog:
 *   Automatically records the current timestamp when an audit entry is created.
 *
 * BannedEmail:
 *   Automatically records deletedAt using the current time.
 *
 * Message:
 *   New chat messages are not deleted by default, begin without an image and automatically receive the current timestamp.
 */
const User = makeModel('users', {
  role: 'user',
  groups: [],
  profilePicture: '',
  createdAt: true
});

const Group = makeModel('groups', {
  theme: {},
  members: [],
  admins: [],
  createdAt: true
});

const Channel = makeModel('channels', {
  createdAt: true
});

const Request = makeModel('requests', {
  createdAt: true
});

const AuditLog = makeModel('audit_logs', {
  timestamp: true
});

const BannedEmail = makeModel('banned_emails', {
  deletedAt: true
});

const Message = makeModel('messages', {
  deleted: false,
  image: '',
  timestamp: true
});

/**
 * Convert a user document into a safe object for client-facing responses.
 *
 * The function accepts either a custom Document or a plain user object.
 *
 * password:
 *   Removed so password hashes or credentials are never returned to the frontend.
 *
 * _id:
 *   Removes MongoDB's internal identifier because Fabuloso uses its own application-level id field.
 *
 * @param {Document|Object} user User document or plain user object.
 * @returns {Object} Sanitised public user data.
 */
function publicUser(user) {
  const output = user?.toObject
    ? user.toObject()
    : { ...user };

  delete output.password;
  delete output._id;

  return output;
}

/**
 * Calculate a user's current age from a date-of-birth string.
 *
 * dob:
 *   Expected to contain a date value that can be combined with midnight and parsed by JavaScript's Date constructor.
 *
 * `${dob}T00:00:00`:
 *   Parses the supplied date at midnight rather than relying on a date-only UTC interpretation.
 *
 * Number.isNaN(birth.getTime()):
 *   Detects an invalid date and returns null rather than attempting an incorrect age calculation.
 *
 * The initial year difference is reduced by one when the user's birthday has not yet occurred in the current year.
 *
 * @param {string} dob Date of birth.
 * @returns {number|null} Current age or null when the supplied date is invalid.
 */
function ageFromDob(dob) {
  const birth = new Date(`${dob}T00:00:00`);

  if (Number.isNaN(birth.getTime())) {
    return null;
  }

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();

  /**
   * Determine whether the birthday has occurred this year.
   *
   * The age is reduced when:
   * - the current month is before the birth month, or
   * - both months match but today's date is before the birth day.
   */
  if (
    now.getMonth() < birth.getMonth() ||
    (
      now.getMonth() === birth.getMonth() &&
      now.getDate() < birth.getDate()
    )
  ) {
    age--;
  }

  return age;
}

/**
 * Create an audit-log entry for an application action.
 *
 * actor:
 *   User responsible for the action. Optional chaining allows system-generated actions to be logged without requiring
 *                                                    a user object.
 *
 * action:
 *   Short description or identifier describing the action that occurred.
 *
 * details:
 *   Additional contextual information associated with the audit event. Defaults to an empty object.
 *
 * If no actor exists, actorId becomes null and actorUsername becomes "SYSTEM" so automated actions remain distinguishable
 *                                                  from user actions.
 *
 * AuditLog.create() automatically adds the timestamp configured in the AuditLog model defaults.
 *
 * @param {Document|Object|null} actor User responsible for the action.
 * @param {string} action Action being recorded.
 * @param {Object} details Additional audit information.
 */
async function audit(actor, action, details = {}) {
  await AuditLog.create({
    actorId: actor?.id || null,
    actorUsername: actor?.username || 'SYSTEM',
    action,
    details
  });
}

/**
 * Export the database configuration, connection functions, collection helper, custom models and reusable utility functions.
 *
 * Other backend modules can require('./database') and access this single shared data-access layer rather than creating
 *                              their own MongoDB connections or duplicating collection logic.
 */
module.exports = {
  MONGODB_URI,
  DATABASE_NAME,
  connectDatabase,
  disconnectDatabase,
  collection,
  User,
  Group,
  Channel,
  Request,
  AuditLog,
  BannedEmail,
  Message,
  publicUser,
  ageFromDob,
  audit
};