# Fabuloso - 3813ICT Phase 2

Angular + Express + Socket.io + **native MongoDB Node.js driver** group chat application.

## Quick start

1. Start local MongoDB.
2. `cd server && npm install && npm test && npm start`
3. In another terminal: `npm install && npm start`
4. Open the Angular URL shown by the CLI. A fresh database redirects to one-time Super Admin bootstrap.

Useful commands: `cd server && npm run inspect` for direct MongoDB inspection, `cd server && npm run reset` for an intentional clean marking reset, `npm test` for Angular tests, and `npm run test:e2e` for Playwright after `npx playwright install chromium`.

See `Phase2.md` for complete architecture, API/socket protocol, data structures, testing methodology, revised storyboard and submission notes.