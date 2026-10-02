/**
 * Fabuloso Phase 2 development/marking database reset script.
 *
 * This script clears all Fabuloso collections from MongoDB so the application returns to its initial unconfigured state.
 * After the reset, the next application launch will require the bootstrap/setup process to be completed again.
 */

const db = require('./database');

/**
 * Run the database reset immediately.
 *
 * An async Immediately Invoked Function Expression (IIFE) is used so await can be used directly inside this standalone script.
 *
 * Reset process:
 * 1. Connect to MongoDB.
 * 2. Delete every document from each Fabuloso collection.
 * 3. Confirm the reset in the terminal.
 * 4. Disconnect cleanly from MongoDB.
 */
(async () => {
  // Establish the MongoDB connection before attempting to access any collections.
  await db.connectDatabase();

  /**
   * Delete all documents from every Fabuloso collection.
   *
   * The array contains each application model wrapper whose collection needs to be reset:
   * - User: registered user accounts and administrator accounts.
   * - Group: created groups and their membership information.
   * - Channel: communication channels belonging to groups.
   * - Request: pending or stored application requests, such as group-related requests.
   * - AuditLog: recorded administrative/auditing actions.
   * - BannedEmail: email addresses prevented from registering or accessing the application.
   * - Message: persisted Socket.io chat messages.
   *
   * map():
   *   Calls deleteMany({}) once for each application model wrapper and produces an array of promises.
   *
   * deleteMany({}):
   *   The empty filter {} matches every document in the collection, so all records are permanently deleted.
   *
   * Promise.all():
   *   Runs the collection deletion operations concurrently and waits until every deletion has completed before continuing.
   */
  await Promise.all(
    [
      db.User,
      db.Group,
      db.Channel,
      db.Request,
      db.AuditLog,
      db.BannedEmail,
      db.Message
    ].map((Model) => Model.deleteMany({}))
  );

  // Confirm that the reset completed and explain what will happen when Fabuloso is launched again.
  console.log(
    'fabuloso cleared. Next launch will require bootstrap.'
  );

  // Close the MongoDB connection cleanly because this standalone script has finished its work.
  await db.disconnectDatabase();
})();