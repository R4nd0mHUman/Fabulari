/**
 * Optional Fabuloso Phase 2 MongoDB snapshot exporter for marking and inspection.
 *
 * MongoDB remains the application's source of truth.
 * This file only exports the current MongoDB records into a readable JSON snapshot because the supplied test plan expects
 *                                      records to be findable in a server JSON file.
 * The application never reads this exported file back as its database, so the JSON snapshot is not used for application
 *                                                      persistence.
 */

const fs = require('fs');
const path = require('path');
const db = require('./database');

/**
 * Define the location of the generated MongoDB snapshot.
 *
 * __dirname:
 *   Provides the absolute path to the directory containing this file.
 *
 * path.join():
 *   Creates a platform-safe path to data/mongodb-export.json.
 *
 * OUTPUT is exported at the bottom of this file so other server modules can reference the same snapshot location if required.
 */
const OUTPUT = path.join(__dirname, 'data', 'mongodb-export.json');

/**
 * Export the current MongoDB database contents into a readable JSON snapshot.
 *
 * This function retrieves the relevant Fabuloso collections, removes fields that should not appear in the inspection file,
 *                          builds one snapshot object and writes it to data/mongodb-export.json.
 *
 * The function is asynchronous because each MongoDB query returns a promise and must complete before the snapshot can be written.
 */
async function exportSnapshot() {
  /**
   * Convert database documents into safe plain JavaScript objects for export.
   *
   * docs:
   *   Array of documents returned from a MongoDB query.
   *
   * map():
   *   Processes every document and returns a new array containing the cleaned versions.
   *
   * toObject():
   *   Converts a application document into a normal JavaScript object when the method is available.
   *
   * {...document}:
   *   Provides a fallback copy if the supplied value is already a plain object rather than a application document.
   *
   * _id:
   *   Removed because MongoDB's internal identifier is not required in the readable marking snapshot.
   *   Fabuloso uses its own application-level IDs where applicable.
   *
   * password:
   *   Removed so password hashes or other stored password data are never written into the inspection export.
   */
  const clean = (docs) =>
    docs.map((document) => {
      const object = document.toObject
        ? document.toObject()
        : { ...document };

      delete object._id;
      delete object.password;

      return object;
    });

  /**
   * Build the complete database snapshot.
   *
   * database:
   *   Identifies which MongoDB database the exported records belong to.
   *
   * generatedAt:
   *   Records when the snapshot was generated using an ISO 8601 timestamp, making it clear when the exported data was last
   *                                                          refreshed.
   *
   * users, groups, channels, requests, auditLogs, bannedEmails and messages:
   *   Contain cleaned copies of the corresponding MongoDB collections.
   *
   * find():
   *   Retrieves every document from the relevant collection because no filter is supplied.
   *
   * lean(false):
   *   Explicitly keeps the query results as application documents rather than converting them to plain objects.
   *   This allows clean() to use each document's toObject() method before removing fields.
   *
   * Each query is awaited so its records are available before the final snapshot object is passed to JSON.stringify().
   */
  const snapshot = {
    database: 'fabuloso_phase2',
    generatedAt: new Date().toISOString(),

    users: clean(await db.User.find().lean(false)),
    groups: clean(await db.Group.find().lean(false)),
    channels: clean(await db.Channel.find().lean(false)),
    requests: clean(await db.Request.find().lean(false)),
    auditLogs: clean(await db.AuditLog.find().lean(false)),
    bannedEmails: clean(await db.BannedEmail.find().lean(false)),
    messages: clean(await db.Message.find().lean(false))
  };

  /**
   * Ensure the output directory exists before attempting to create the JSON file.
   *
   * path.dirname(OUTPUT):
   *   Extracts the containing "data" directory from the complete output file path.
   *
   * recursive: true:
   *   Creates any missing directories in the path and avoids an error if the directory already exists.
   *
   * mkdirSync():
   *   Performs the directory creation synchronously so the directory is guaranteed to exist before writeFileSync() runs.
   */
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

  /**
   * Write the snapshot to data/mongodb-export.json.
   *
   * JSON.stringify(snapshot, null, 2):
   *   Converts the JavaScript snapshot object into JSON and formats it with two-space indentation so the exported records are
   *                                                        easy to inspect.
   *
   * '\n':
   *   Adds a final newline to the generated file for cleaner text-file formatting.
   *
   * writeFileSync():
   *   Writes the complete snapshot synchronously, ensuring the file has been updated before exportSnapshot() returns.
   *
   * If the file already exists, its previous contents are replaced with the newly generated database snapshot.
   */
  fs.writeFileSync(
    OUTPUT,
    JSON.stringify(snapshot, null, 2) + '\n'
  );
}

/**
 * Export the snapshot function and output path for use by other backend files.
 *
 * exportSnapshot:
 *   Allows server.js and other modules to regenerate the inspection snapshot after persistent MongoDB data changes.
 *
 * OUTPUT:
 *   Exposes the exact location of mongodb-export.json so other modules can reference the snapshot without duplicating its path
 *                                                          definition.
 */
module.exports = {
  exportSnapshot,
  OUTPUT
};