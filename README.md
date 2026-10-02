# Fabuloso - 3813ICT Phase 2

Angular + Express + Socket.io + **native MongoDB Node.js driver** group chat application.

## Quick start

1. Start local MongoDB.
2. Install the backend dependencies, run the backend tests, and start the Express/Socket.io server:

   ```bash
   cd server
   npm install
   npm test
   npm start
   ```
3. In another terminal, from the Assignment root, install the Angular dependencies and start the frontend:

   ```bash
   npm install
   npm start
   ```
4. Open the Angular URL shown by the CLI.

A fresh database will redirect to the one-time Super Admin bootstrap/setup process.

## Automated testing

### Backend tests

From the `server` directory:
```bash
npm test
```

### Angular tests

From the Assignment root:
```bash
npm test -- --watch=false
```

### Playwright end-to-end tests

Install the Chromium browser used by Playwright if it has not already been installed:
```bash
npx playwright install chromium
```
Then run:
```bash
npm run test:e2e
```

### Production build

To verify that the Angular application builds successfully:
```bash
npm run build
```

## MongoDB inspection

Fabuloso includes an inspection script for viewing the application's current MongoDB data directly.

From the `server` directory:
```bash
npm run inspect
```

This displays the application's MongoDB collections and their current records, including users, groups, requests, banned emails, audit logs, channels, and persisted chat messages.

## Resetting Fabuloso for clean testing or marking

Fabuloso includes a database reset script that returns the application to its initial unconfigured state.

**Warning:** This intentionally deletes all existing Fabuloso application data. Stop the backend server before performing a reset.

From the `server` directory, run:
```bash
npm run reset
```
Alternatively, the reset script can be executed directly:
```bash
node reset-database.js
```

The reset clears all documents from the following application collections:
- Users
- Groups
- Channels
- Requests
- Audit logs
- Banned emails
- Messages

The reset uses the application's existing MongoDB database layer and performs `deleteMany({})` on each collection. It empties the Fabuloso collections rather than dropping the MongoDB database itself.

A successful reset should report:
```text
MongoDB connected: fabuloso_phase2 (native mongodb driver)
fabuloso cleared. Next launch will require bootstrap.
```

### Verify the database reset

After resetting, run:
```bash
npm run inspect
```

Each Fabuloso collection should report:
```text
Records: 0
```

## Clearing browser session data

After resetting MongoDB, clear any existing Fabuloso browser session data so an old login is not retained.

Open Fabuloso in the browser, open the browser Developer Tools (`F12`), select the **Console**, and run:
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```
**Important:** These are browser JavaScript commands and must be run in the browser Developer Tools Console, not in PowerShell or another terminal.

Browser storage can also be cleared through the browser's Developer Tools storage controls.

## Starting after a clean reset

After the database and browser storage have been cleared, start the backend from the `server` directory:
```bash
npm start
```
Then, in another terminal from the Assignment root, start Angular:
```bash
npm start
```

Open the Angular URL shown by the CLI.

Fabuloso should now behave as a fresh installation and require the one-time Super Admin bootstrap process again.

This provides a clean environment for testing the complete application workflow, including:
- Super Admin bootstrap
- User registration and authentication
- User deletion and banned-email handling
- Group creation requests and approval
- Group membership requests and approval/rejection
- Group Admin promotion and demotion
- Channel creation, editing, and deletion
- Real-time Socket.io chat
- Chat image uploads and validation
- Message deletion and five-message persistence
- Profile and profile-picture functionality
- Audit logging
- Application persistence after a server restart

## Useful commands

| Purpose | Command |
| --- | --- |
| Start backend | `cd server && npm start` |
| Run backend tests | `cd server && npm test` |
| Inspect MongoDB | `cd server && npm run inspect` |
| Reset MongoDB data | `cd server && npm run reset` |
| Start Angular | `npm start` |
| Run Angular tests | `npm test -- --watch=false` |
| Install Playwright Chromium | `npx playwright install chromium` |
| Run E2E tests | `npm run test:e2e` |
| Build production Angular application | `npm run build` |

## Further documentation

See `Phase2.md` for the complete architecture, REST API and Socket.io protocol documentation, data structures, testing methodology, revised storyboard, and Phase 2 submission notes.