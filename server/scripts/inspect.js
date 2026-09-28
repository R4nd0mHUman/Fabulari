/**
 * Direct MongoDB inspection utility for Fabuloso Phase 2.
 *
 * This development/marking script connects to the Fabuloso database and prints the contents of each application
 *                                          collection directly to the terminal.
 *
 * IMPORTANT RUBRIC REQUIREMENT:
 * Database access is performed through database.js, which uses the official `mongodb` Node.js driver rather than Mongoose.
 *
 * The script is read-only:
 * - It retrieves records using native MongoDB collection operations.
 * - It does not insert, update or delete database records.
 * - Stored password hashes are replaced with a placeholder before records are displayed.
 */

const db = require('../database');

/**
 * Run the MongoDB inspection immediately.
 *
 * An async Immediately Invoked Function Expression (IIFE) allows await to be used directly inside this standalone script.
 *
 * Inspection process:
 * 1. Connect to MongoDB.
 * 2. Display the database name.
 * 3. Display the Fabuloso collection names.
 * 4. Retrieve and display every record from each collection.
 * 5. Hide stored password hashes from terminal output.
 * 6. Disconnect from MongoDB when inspection finishes or fails.
 */
(async () => {
  try {
    // Establish the native MongoDB connection before attempting to inspect any collections.
    await db.connectDatabase();

    /**
     * Display the configured database name.
     *
     * Leading and trailing newline characters separate the heading from other terminal output and make the inspection results
     *                                                      easier to read.
     */
    console.log(`\nDatabase: ${db.DATABASE_NAME}\n`);

    /**
     * Define the collections included in the inspection.
     *
     * Keeping the collection names in one array makes it straightforward to iterate over every relevant Fabuloso collection
     *                                          using the same inspection logic.
     */
    const names = [
      'users',
      'groups',
      'requests',
      'banned_emails',
      'audit_logs',
      'channels',
      'messages'
    ];

    /**
     * Display the collection names as a readable terminal list.
     *
     * join('\n  - '):
     *   Places each collection on its own line with the same list prefix.
     */
    console.log(
      'Collections:\n  - ' + names.join('\n  - ')
    );

    /**
     * Inspect each collection individually.
     *
     * for...of is used instead of forEach() because each MongoDB query must be awaited before the script continues processing
     *                                                   that collection.
     */
    for (const name of names) {
      /**
       * Retrieve every document from the current collection.
       *
       * db.collection(name):
       *   Returns the native MongoDB Collection instance from database.js.
       *
       * find({}):
       *   The empty filter matches every document in the collection.
       *
       * toArray():
       *   Executes the MongoDB cursor and returns all matching records as an array.
       */
      const records = await db
        .collection(name)
        .find({})
        .toArray();

      /**
       * Create safe copies of the records before displaying them.
       *
       * map():
       *   Produces a new array so the retrieved database records are not directly modified for display.
       *
       * {...record}:
       *   Creates a shallow copy of each MongoDB document.
       *
       * password:
       *   If a record contains a password field, its stored hash is replaced with a clear placeholder before terminal output.
       *
       * This does not modify the password stored in MongoDB; only the temporary copy printed by this script is changed.
       */
      const safe = records.map((record) => {
        const copy = { ...record };

        if (copy.password) {
          copy.password = '[BCRYPT HASH HIDDEN]';
        }

        return copy;
      });

      /**
       * Print a clear heading for the current collection.
       *
       * '='.repeat(50):
       *   Creates visual separators around each collection section.
       *
       * name.toUpperCase():
       *   Makes the collection name stand out as a terminal heading.
       *
       * safe.length:
       *   Displays the number of records retrieved from the collection.
       */
      console.log(
        `\n${'='.repeat(50)}\n` +
        `${name.toUpperCase()}\n` +
        `Records: ${safe.length}\n` +
        `${'='.repeat(50)}`
      );

      /**
       * Display the complete records using Node.js's object inspection output.
       *
       * depth: null:
       *   Expands nested objects and arrays without applying the normal inspection depth limit.
       *
       * colors: true:
       *   Enables syntax colouring in terminals that support ANSI colours, making complex records easier to inspect.
       */
      console.dir(safe, {
        depth: null,
        colors: true
      });
    }
  } catch (error) {
    /**
     * Handle connection or inspection failures.
     *
     * The complete error is printed for development/marking diagnosis.
     *
     * process.exitCode = 1:
     *   Marks the script as unsuccessful without immediately terminating it, allowing the finally block to close the
     *                                              MongoDB connection first.
     */
    console.error(
      'Unable to inspect MongoDB:',
      error
    );

    process.exitCode = 1;
  } finally {
    /**
     * Always close the MongoDB connection.
     *
     * finally executes whether the inspection succeeds or throws an error, preventing this standalone script from leaving its
     *                                              database connection open.
     */
    await db.disconnectDatabase();
  }
})();