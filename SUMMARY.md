# Fabuloso Phase 2 - Interview Summary

Angular provides the responsive browser UI, Router guards, forms and REST calls. Express is the HTTP API and repeats all important authorization checks server-side. The **official `mongodb` Node.js driver** connects directly to the `fabuloso_phase2` database; Mongoose is not used. Socket.io provides persistent two-way channel communication for live text/images and join/leave events. bcrypt stores password hashes rather than plaintext.

MongoDB collections are `users`, `groups`, `channels`, `requests`, `messages`, `audit_logs` and `banned_emails`. Fabuloso uses application UUID `id` values while MongoDB retains internal `_id`. The server keeps only five persistent message slots per channel, but an open Angular chat retains additional messages received during that live session until the component is left/destroyed.

Security rules worth explaining: Angular guards improve UX but Express is authoritative; users cannot self-grant membership/admin; group admins are scoped through each group's `admins` array; last-admin demotion is rejected; underage join requests are rejected server-side; only the sender can delete a message; profile/chat images are allow-listed and limited to 2 MB; deleted/banned emails cannot be reused; password hashes are excluded from safe API/export/inspection output.

Use `Phase2.md` for the complete API/socket protocol, data structures, testing commands and revised storyboard.