# Fabuloso - Phase 1 Documentation

**Student Number:** s5353249  
**Name:** Eden Moss  
**Workshop Time:** Thursday 11AM - 1PM  

---

# 1. Project Overview

## 1.1 Application Description

**Fabuloso** is a multi-user text and image-based chat application designed to allow users to communicate within groups and group-specific chat rooms/channels.

The application uses a role-based permission structure consisting of:

- Super Administrator
- Group Administrators
- Regular Users
- Guest users

Users can register and log in, browse and search for groups, request group membership, manage their own profile, and access group chat rooms after receiving the appropriate permissions.

Groups can contain multiple chat rooms/channels. Group administrators manage their groups, members and channels, while the Super Admin handles system-level administration and requests that require system authority.

Phase 1 focuses on the user interface, navigation, role-specific interfaces, application architecture, and the minimum server-side JSON persistence required by the prototype. MongoDB and Socket.io are deferred to Phase 2.

> **Naming note:** The assignment specification identifies the application as **Fabuloso**. The current repository and several existing assets still use the earlier **JustChatting** name that was implemented before triple-checking the requirements specification. Though attempts have been made to change the outer appearance to match the **Fabuloso** name, some of the existing assets still use the self-assigned **JustChatting** name to prevent crashes.

## 1.2 Purpose

The purpose of Fabuloso is to provide a structured communication platform where users can communicate within controlled groups and chat rooms while different permission levels determine which actions each user can perform.

The intended workflow is:

```text
Register / Login
       |
       v
Browse / Search Groups
       |
       v
Request to Join
       |
       v
Group Administrator Reviews Request
       |
       v
Request Approved
       |
       v
Access Group Chat Rooms
       |
       v
Send Text / Images / GIFs
```

A user requesting a new group follows a separate workflow:

```text
Regular User
     |
     v
Create Group Request
     |
     v
Super Admin Request Queue
     |
     +---- Reject
     |
     +---- Approve
             |
             v
      Group is created
             |
             v
     Requester becomes
      Group Administrator
```

## 1.3 Technology Stack

### Phase 1

- Angular
- TypeScript
- HTML
- CSS
- Node.js
- Express
- JSON file storage
- NPM packages
- Git/GitHub

### Phase 2

- MongoDB
- Socket.io
- Complete database-backed application
- Full real-time communication
- Complete production security/deployment configuration

---

# 2. Git Strategy

## 2.1 Repository

The project is maintained in a GitHub repository:

**GitHub Repository:** https://github.com/R4nd0mHUman/JustChatting

Git is used to track implementation changes, maintain the development history, and provide the final submission repository.

The repository contains:

- Angular frontend
- Node.js/Express backend
- JSON persistent data
- Application assets
- Design/progress assets
- Documentation
- Configuration files

## 2.2 Branching Strategy

The current primary branch is `main`.

The project can use feature branches for larger independent features before merging them into `main`.

Example:

```text
main
 |
 +-- feature/authentication
 |
 +-- feature/group-management
 |
 +-- feature/profile-system
 |
 +-- feature/chat-system
 |
 +-- feature/notifications
```

Feature branches reduce the risk of breaking the main application while larger features are being developed.

## 2.3 Commit Strategy

Commits are made after significant development tasks or related groups of changes.

Commit messages describe the purpose of each change. Examples from the repository include updates for:

- authentication/user storage
- dashboard interfaces
- profile functionality
- navigation
- logout functionality

The commit history provides evidence of the development progression.

## 2.4 Repository Management

The repository separates:

```text
src/                 Angular application
server/              Node.js/Express backend
server/data/         JSON persistent data
public/assets/       Application visual assets
Phase1.md            Phase 1 documentation
```

The `.gitignore` file is used to prevent files that should not be committed from being included in the repository.

---

# 3. Requirements and Assumptions

## 3.1 Functional Requirements

The following table defines the functional requirements relevant to the complete Fabuloso application and identifies the intended Phase 1 treatment.

| ID | Functional Requirement | Phase 1 Treatment |
|---|---|---|
| FR01 | Users can register themselves. | Implemented through the registration UI and basic server endpoint. |
| FR02 | Users can log in using username and password. | Implemented. |
| FR03 | Passwords must be at least 8 characters and contain at least one uppercase letter. | Implemented in registration and password-change validation. |
| FR04 | Passwords must be hashed when stored. | bcrypt is used by the Phase 1 server. |
| FR05 | Guest access is available without authentication. | Guest interface/navigation is implemented; full guest functionality is deferred. |
| FR06 | User private information includes name, email and password. | Represented in the user data structure. |
| FR07 | Email addresses cannot be changed. | Profile UI/API treats email as immutable. |
| FR08 | Users can change their username. | Implemented in the profile system. |
| FR09 | Users can change their password after verifying their existing password. | Implemented in the profile API; full production security remains a Phase 2 concern. |
| FR10 | Deleted/system-banned email addresses cannot be reused. | Planned; persistent banned-email enforcement is not complete in Phase 1. |
| FR11 | Users have private profiles. | Profile UI exists; strict server-side privacy enforcement is deferred. |
| FR12 | Users can upload/change their profile picture through the application. | Implemented through the profile upload workflow. |
| FR13 | Users can edit profile information except email. | Implemented for the Phase 1 profile fields. |
| FR14 | Users can provide permitted additional profile information. | First name, last name and age are represented. |
| FR15 | Users can change their page theme. | Optional feature; not required for Phase 1 completion. |
| FR16 | Group administrators can customise a group theme. | Group Admin UI includes theme controls; complete persistence/application is deferred. |
| FR17 | The application provides different interfaces for Super Admin, Group Admin and Regular User. | UI structure implemented. |
| FR18 | URLs are displayed as plain text rather than automatic hyperlinks. | Final chat rendering requirement; deferred to full chat implementation. |
| FR19 | User listings are alphabetical. | Implemented in the Group Admin member interface; final application will apply this consistently. |
| FR20 | Online/offline status uses a visual green/grey indicator. | UI structure exists; real presence is deferred to Socket.io. |
| FR21 | The interface works on tablet and computer screen sizes and responds to resizing. | Responsive desktop/mobile assets and resize handling are included. |
| FR22 | Users can view all existing groups after registration. | Group listing/search endpoint and UI are implemented. |
| FR23 | Users can search for groups. | Implemented. |
| FR24 | Users can join unlimited groups. | Data model supports multiple group memberships. |
| FR25 | Groups can contain unlimited members. | No artificial member limit is imposed by the Phase 1 data model. |
| FR26 | Group title is limited to 30 characters. | Enforced in the Group Admin UI; server validation should also be completed in the final implementation. |
| FR27 | Group description is limited to 250 characters. | Enforced in the Group Admin UI; server validation should also be completed in the final implementation. |
| FR28 | Groups have an age limit. | Implemented in the group data structure and join-request validation. |
| FR29 | Groups do not have a group profile picture. | No group profile picture field is used. |
| FR30 | A group must always have at least one administrator. | Implemented in the membership/removal logic. |
| FR31 | Groups may contain zero or unlimited chat rooms. | Data model supports zero or more channels. |
| FR32 | Group Admins can create rooms. | Implemented in the Phase 1 Group Admin interface/backend. |
| FR33 | Group Admins can rename rooms. | UI is present; complete server implementation is part of later development. |
| FR34 | Group Admins can delete rooms. | UI is present; complete server implementation is part of later development. |
| FR35 | Group Admins can edit group name, description, age limit and theme. | UI and basic group-update structure are implemented. |
| FR36 | Users request new chat rooms. | Planned through the request/queue architecture. |
| FR37 | Group Admins approve/reject room requests. | Planned; not required to be fully functional in Phase 1. |
| FR38 | Rejected requests require a reason where applicable. | Planned request-system rule. |
| FR39 | Users request permission to join groups. | Implemented for group membership requests. |
| FR40 | Join requests are sent internally to the relevant Group Admin. | Request data and admin queue are implemented for the Phase 1 membership workflow. |
| FR41 | Group Admins approve/reject membership requests. | Implemented in the Phase 1 group request backend. |
| FR42 | Users cannot cancel pending requests. | Planned final workflow rule. |
| FR43 | Users can view pending and previously rejected requests. | Request history structure is planned; Phase 1 UI primarily establishes the request interface. |
| FR44 | Users cannot directly join groups. | Implemented in the join-request backend design. |
| FR45 | Group Admins cannot invite users directly. | Final workflow rule; no invitation mechanism is provided. |
| FR46 | Newly created users initially belong to no groups. | Registration creates an empty group membership list. |
| FR47 | Users can see groups without being members. | Implemented through group discovery. |
| FR48 | Users under the group age limit cannot request/join that group. | Age validation is implemented for join requests. |
| FR49 | Existing underage members are removed when a group age limit increases. | Planned final application behaviour. |
| FR50 | Only group members can access group chat rooms. | Membership check is part of the room API design. |
| FR51 | Chat supports text, images and GIFs only. | Chat UI is established; real messaging is deferred. |
| FR52 | Voice and video are not supported. | Intentionally excluded. |
| FR53 | Replying to messages and @mentions are not supported. | Intentionally excluded. |
| FR54 | There is no automatic profanity filter. | Intentionally excluded. |
| FR55 | There is no text size/message length limit. | Final chat rule; deferred to full messaging implementation. |
| FR56 | Users may delete only their own messages. | Planned final messaging rule. |
| FR57 | Users cannot edit messages. | Intentionally excluded from the final specification. |
| FR58 | Only the five most recent messages are displayed when entering a room. | Planned final chat behaviour. |
| FR59 | Only the five most recent messages are retained persistently. | Planned final chat storage rule. |
| FR60 | Deleted messages remain as empty positions within the five-message history. | Planned final messaging behaviour. |
| FR61 | Message deletion is synchronised with active users. | Requires Socket.io and is deferred. |
| FR62 | Messages display sender and timestamp. | Chat UI design accounts for these fields. |
| FR63 | Users can see current room members. | Room-member UI/data structure is planned. |
| FR64 | Users receive join/leave notifications. | Planned Socket.io/notification functionality. |
| FR65 | Normal chat messages do not create push notifications. | Final notification rule. |
| FR66 | GIF, JPEG/JPG and PNG files are supported. | Planned final file validation. |
| FR67 | Sent images/files are limited to 2 MB. | Planned final file validation. |
| FR68 | Join/leave notifications are visible only to relevant group members. | Planned privacy rule for notifications. |
| FR69 | Internal queues support administrative requests. | Group creation and membership request structures are implemented; other request types are planned. |
| FR70 | Super Admin cannot participate in normal group chat. | Role design excludes normal chat participation. |
| FR71 | There is only one Super Admin. | Bootstrap checks for an existing Super Admin. |
| FR72 | Super Admin is created during bootstrap. | Bootstrap implementation exists. |
| FR73 | Bootstrap must be disabled after first run. | Current implementation is idempotent rather than permanently disabled; final bootstrap control should be tightened. |
| FR74 | Super Admin approves group creation requests. | Implemented. |
| FR75 | A group-creation requester becomes the default Group Admin when approved. | Implemented. |
| FR76 | Group Admins can administer multiple groups. | Data model supports multiple administered groups. |
| FR77 | A group can have multiple administrators. | Data model supports multiple administrators. |
| FR78 | Group Admins can promote/demote members while maintaining at least one admin. | Planned final administrative workflow. |
| FR79 | Group Admins can request group deletion from the Super Admin. | Planned. |
| FR80 | Group Admins can request permanent system bans. | Planned. |
| FR81 | Group Admins can ban users from an individual group. | Planned final ban workflow. |
| FR82 | Group bans are permanent within that group, while a banned user may create another account. | Planned final rule. |
| FR83 | Group Admins cannot permanently system-ban users directly. | Planned request-only workflow. |
| FR84 | Users can report/request removal or banning of another group member. | Planned internal request workflow. |
| FR85 | Ban requests require reasons. | Planned. |
| FR86 | Group Admins cannot approve their own requests. | Planned permission rule. |
| FR87 | The last Group Admin cannot leave/delete their account without a successor. | Planned final account-management rule. |
| FR88 | Requests include group creation, membership, room creation, ban and group deletion workflows. | Group creation and membership are established; other types are planned. |
| FR89 | Administrative actions are recorded in audit logs. | Audit-log UI and data structure are established; complete persistence is deferred. |
| FR90 | Super Admin can filter audit logs by date and action type. | Planned audit functionality. |
| FR91 | Phase 1 persistent prototype data is stored in JSON on the server. | Implemented. |
| FR92 | Phase 2 persistent application data will use MongoDB. | Planned. |
| FR93 | Phase 2 real-time communication will use Socket.io. | Planned. |
| FR94 | No multi-language support is required. | English-only interface. |

## 3.2 Phase 1 Prototype Requirements

The Phase 1 prototype specifically requires the system to demonstrate:

| ID | Phase 1 Prototype Requirement | Current Treatment |
|---|---|---|
| P01 | Frontend UI is the primary focus. | Implemented. |
| P02 | UI demonstrates all permission levels. | Super Admin, Group Admin, Regular User and Guest interfaces are represented. |
| P03 | Application layout follows the design documents. | Implemented through the Angular component/page structure and visual assets. |
| P04 | Complete final functionality is not required. | Phase 1 intentionally defers full chat, database and real-time functionality. |
| P05 | Users can be created. | Implemented through registration and JSON persistence. |
| P06 | Groups can be created. | Group creation is implemented through a request/approval workflow. |
| P07 | Channels can be created. | Group Admin channel creation is implemented. |
| P08 | Users, groups and channels can be associated. | User-group membership and channel-group relationships are persisted. |
| P09 | These prototype items persist in a JSON file on the server. | Implemented using `server/data/*.json`. |
| P10 | Database is not required in Phase 1. | MongoDB is deferred to Phase 2. |
| P11 | Features not required for the prototype may use mock/planned data. | Used for deferred chat, notification, audit and ban functionality. |
| P12 | Login uses basic username/password authentication. | Implemented. |

## 3.3 Assumptions

| ID | Assumption |
|---|---|
| A01 | Phase 1 uses JSON files instead of MongoDB for persistent application data. |
| A02 | MongoDB will be introduced in Phase 2. |
| A03 | Socket.io is not required to be fully implemented in Phase 1. |
| A04 | The Phase 1 backend remains lightweight and exists primarily to support basic authentication and the minimum JSON persistence required by the prototype. |
| A05 | The Phase 1 prototype does not need every final application feature to be fully functional. |
| A06 | Mock/planned data may be used for features deferred to Phase 2. |
| A07 | There is only one Super Admin. |
| A08 | The Super Admin is created during bootstrap. |
| A09 | A group must always have at least one administrator. |
| A10 | Users cannot directly join groups without approval. |
| A11 | Users may belong to multiple groups. |
| A12 | Group Admins may administer multiple groups. |
| A13 | Groups may contain zero or more channels. |
| A14 | Group age restrictions apply to all rooms in that group. |
| A15 | Guest users can browse permitted group information without registering. |
| A16 | Email addresses remain immutable after registration. |
| A17 | Design inspiration may be used, but the implementation and visual design are original. |
| A18 | The final application will use English only. |
| A19 | Local HTTP development is acceptable for Phase 1; HTTPS is a final deployment/security requirement. |
| A20 | The current repository contains legacy JustChatting branding that will be renamed to Fabuloso before submission. |

---

# 4. Data Structures

## 4.1 JSON Storage

Phase 1 stores persistent prototype data on the server in:

```text
server/data/
```

Current files include:

```text
users.json
groups.json
channels.json
group-requests.json
banned-emails.json
```

The JSON approach satisfies the Phase 1 requirement without requiring MongoDB.

## 4.2 User

Users are stored in `users.json`.

Conceptual structure:

```json
{
  "id": "user-id",
  "username": "username",
  "email": "user@example.com",
  "password": "bcrypt-hash",
  "firstName": "First",
  "lastName": "Last",
  "age": 20,
  "role": "user",
  "groups": [
    {
      "groupId": "group-id",
      "role": "member"
    }
  ],
  "profilePicture": "profile-picture-path"
}
```

Possible roles are:

```text
super-admin
user
guest
```

A user becomes a Group Admin through the group's `admins` relationship rather than requiring a separate global `group-admin` role.

## 4.3 Group

Groups are stored in `groups.json`.

Conceptual structure:

```json
{
  "id": "group-id",
  "name": "Group Name",
  "description": "Group description",
  "ageLimit": 18,
  "admins": [
    "user-id"
  ],
  "members": [
    {
      "id": "user-id",
      "username": "username"
    }
  ],
  "theme": {
    "mode": "default",
    "colour": "#000000"
  }
}
```

The group identifies its administrators and members and provides the parent relationship for channels.

## 4.4 Channel

Channels are stored in `channels.json`.

Conceptual structure:

```json
{
  "id": "channel-id",
  "groupId": "group-id",
  "name": "general",
  "description": "General discussion",
  "createdBy": "user-id"
}
```

The `groupId` establishes the channel-to-group relationship.

## 4.5 Requests

Requests are stored in `group-requests.json` during Phase 1.

Conceptual structure:

```json
{
  "requestId": "request-id",
  "type": "GROUP_CREATION",
  "requesterId": "user-id",
  "groupId": "group-id",
  "groupName": "Group Name",
  "reason": "Reason where applicable",
  "status": "pending",
  "createdAt": "date-time",
  "resolvedAt": null,
  "resolvedBy": null
}
```

Request types planned for the complete application include:

```text
GROUP_CREATION
GROUP_MEMBERSHIP
CHANNEL_CREATION
BAN_REQUEST
GROUP_DELETION
SYSTEM_BAN_REQUEST
MEMBER_REMOVAL
```

Possible statuses:

```text
pending
approved
rejected
```

## 4.6 Messages

Messages are planned for Phase 2 because Phase 1 does not require complete real-time chat.

Conceptual structure:

```json
{
  "id": "message-id",
  "channelId": "channel-id",
  "senderId": "user-id",
  "senderUsername": "username",
  "type": "text",
  "content": "Message content",
  "timestamp": "date-time",
  "deleted": false
}
```

The final implementation will retain only the five most recent messages per channel.

## 4.7 Notifications

Notifications are planned for the final application.

Conceptual structure:

```json
{
  "id": "notification-id",
  "groupId": "group-id",
  "channelId": "channel-id",
  "type": "USER_JOINED",
  "message": "A user joined the room.",
  "timestamp": "date-time"
}
```

Notifications will be scoped so that group activity is not exposed to non-members.

## 4.8 Audit Logs

Audit records are planned as:

```json
{
  "id": "audit-id",
  "action": "GROUP_CREATED",
  "performedBy": "user-id",
  "target": "group-id",
  "timestamp": "date-time",
  "details": "Description of action"
}
```

The final system will record administrative actions including group changes, member changes, room changes, request decisions and ban actions.

## 4.9 Banned Emails

The repository includes `banned-emails.json` as the planned persistent structure for system-banned email addresses.

The final registration workflow will check this data before allowing an email address to be reused.

## 4.10 Data Relationships

```text
User
 |
 +-- belongs to --> Groups
 |
 +-- creates --> Requests
 |
 +-- sends --> Messages

Group
 |
 +-- contains --> Users
 |
 +-- contains --> Channels
 |
 +-- has --> Administrators
 |
 +-- has --> Requests
 |
 +-- has --> Notifications

Channel
 |
 +-- belongs to --> Group
 |
 +-- contains --> Messages

Request
 |
 +-- created by --> User
 |
 +-- targets --> Group / Channel / User

AuditLog
 |
 +-- records --> Administrative action
```

---

# 5. Angular Architecture Design

The Angular frontend is organised using feature-based components.

## 5.1 Current Component Structure

```text
src/app/
├── audit-logs/
├── banned-users/
├── chat-room/
├── create-group/
├── group-admin/
├── group-requests/
├── group-search/
├── guest-home/
├── login/
├── my-groups/
├── profile/
├── register/
├── super-admin/
├── user-home/
├── user-management/
├── app.config.ts
├── app.css
├── app.html
├── app.routes.ts
├── app.spec.ts
├── app.ts
└── auth.guard.ts
```

Each major feature generally contains:

```text
feature/
├── feature.html
├── feature.css
├── feature.ts
└── feature.spec.ts
```

## 5.2 Implemented Components

### Login

Responsible for:

- Username/password login
- Guest entry
- Authentication navigation
- Responsive login layout

### Register

Responsible for:

- New account registration
- Required account information
- Basic validation

### Guest Home

Provides the guest landing interface and guest navigation.

### User Home

Provides the main Regular User dashboard and navigation to:

- Groups
- Profile
- Requests
- Chat-related functionality

### Group Search

Provides group discovery and search.

### My Groups

Displays groups belonging to the current user and their available channels.

### Create Group

Provides the group creation request form.

### Group Requests

Provides request-related interfaces used by users and administrators.

### Group Admin

Provides group administration UI for:

- Group details
- Theme controls
- Members
- Membership requests
- Channels
- Channel creation
- Channel management controls

### Profile

Provides:

- Username
- Name
- Email
- Age
- Profile picture
- Password change

### Chat Room

Provides the Phase 1 UI structure for a group channel.

### Super Admin

Provides the primary Super Admin interface.

### User Management

Provides Super Admin user-management UI.

### Banned Users

Provides the Super Admin banned-user interface.

### Audit Logs

Provides the Super Admin audit-log interface.

## 5.3 Services

The final architecture is intended to use services to separate UI components from business logic and backend communication.

Planned services:

```text
AuthService
UserService
GroupService
ChatService
RequestService
NotificationService
AuditService
```

The services will centralise:

- HTTP communication
- Authentication state
- Group operations
- Request operations
- Chat/socket communication
- Notifications
- Audit data

## 5.4 Models

Planned TypeScript models/interfaces include:

```text
User
Group
ChatChannel
Message
Request
Notification
AuditLog
```

These models provide consistent data structures between Angular and the backend.

## 5.5 Routes

Current route structure includes:

```text
/login
/register
/guest
/guest/groups

/user

/groups
/groups/search
/groups/requests
/groups/create
/groups/manage/:groupId

/profile

/chat/:groupId/:channelId

/super-admin
/super-admin/audit
/super-admin/users
/super-admin/group-requests
/super-admin/banned-users
```

The `auth.guard.ts` structure provides the foundation for role-based route protection.

## 5.6 Architecture Principles

The Angular architecture follows:

- Feature-based organisation
- Separation of HTML, CSS and TypeScript
- Reusable service architecture
- Route-based navigation
- Role-specific interfaces
- Responsive layout design
- Separation between UI and backend persistence

---

# 6. Server API Design

The backend uses Node.js and Express.

Current structure:

```text
server/
├── data/
│   ├── banned-emails.json
│   ├── channels.json
│   ├── group-requests.json
│   ├── groups.json
│   └── users.json
├── routes/
│   ├── auth.js
│   ├── groups.js
│   └── profile.js
├── bootstrap.js
├── package.json
├── package-lock.json
└── server.js
```

## 6.1 Authentication API

| Method | Endpoint | Purpose | Phase 1 |
|---|---|---|---|
| POST | `/api/auth/register` | Register user | Implemented |
| POST | `/api/auth/login` | Authenticate user | Implemented |
| POST | `/api/auth/logout` | End client session | Implemented as basic endpoint |
| GET | `/api/auth/me` | Retrieve authenticated user | Implemented |

## 6.2 Profile API

| Method | Endpoint | Purpose | Phase 1 |
|---|---|---|---|
| GET | `/api/profile/:id` | Retrieve profile | Implemented |
| PUT | `/api/profile/:id` | Update permitted profile fields | Implemented |
| PUT | `/api/profile/:id/password` | Verify old password and change password | Implemented |
| PUT | `/api/profile/:id/picture` | Upload/change profile picture | Implemented |

## 6.3 Group API

| Method | Endpoint | Purpose | Phase 1 |
|---|---|---|---|
| GET | `/api/groups` | List/search available groups | Implemented |
| GET | `/api/groups/:id` | Retrieve group information | Implemented |
| POST | `/api/groups/requests` | Request group creation | Implemented |
| GET | `/api/groups/requests/user/:userId` | View own group-creation requests | Implemented |
| GET | `/api/groups/requests/admin/:userId` | View pending membership requests for administered groups | Implemented |
| GET | `/api/groups/requests/creation` | Super Admin group-creation queue | Implemented |
| POST | `/api/groups/requests/:requestId/approve` | Approve group creation | Implemented |
| POST | `/api/groups/requests/:requestId/reject` | Reject group creation | Implemented |
| POST | `/api/groups/:id/join-request` | Request group membership | Implemented |
| POST | `/api/groups/:id/membership-requests/:requestId/approve` | Approve membership | Implemented |
| POST | `/api/groups/:id/membership-requests/:requestId/reject` | Reject membership | Implemented |
| GET | `/api/groups/user/:userId` | Retrieve user's groups | Implemented |
| GET | `/api/groups/owned/:userId` | Retrieve groups administered by user | Implemented |
| PUT | `/api/groups/:id` | Update group | Implemented |
| GET | `/api/groups/:id/members` | List group members | Implemented |
| DELETE | `/api/groups/:id/members/:userId` | Remove group member | Implemented |
| POST | `/api/groups/channels` | Create channel | Implemented |
| GET | `/api/groups/:id/rooms` | Retrieve group channels | Implemented |
| GET | `/api/groups/channels/group/:groupId` | Retrieve group channels for existing UI | Implemented |
| DELETE | `/api/groups/:id/rooms/:roomId` | Delete channel | Planned |
| PUT | `/api/groups/:id/rooms/:roomId` | Rename/update channel | Planned |
| POST | `/api/groups/:id/rooms/requests` | Request channel creation | Planned |
| POST | `/api/groups/:id/delete-request` | Request group deletion | Planned |

## 6.4 Request API

The final request system will support:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/requests` | Retrieve requests visible to the current administrator |
| POST | `/api/requests/:id/approve` | Approve a request |
| POST | `/api/requests/:id/reject` | Reject a request |
| GET | `/api/requests/history` | Retrieve resolved requests |
| POST | `/api/groups/:id/ban-requests` | Submit a group-ban/removal request |
| POST | `/api/groups/:id/delete-request` | Request group deletion |
| POST | `/api/users/:id/system-ban-request` | Request a permanent system ban |

The Phase 1 implementation establishes the request/queue pattern using group creation and membership requests.

## 6.5 Audit API

Planned endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/audit` | Retrieve audit records |
| GET | `/api/audit?type=GROUP_CREATED` | Filter by action type |
| GET | `/api/audit?from=DATE&to=DATE` | Filter by date |

## 6.6 Chat and Socket.io Design

Socket.io is planned for Phase 2.

Planned events:

```text
join-room
leave-room
send-message
receive-message
delete-message
user-online
user-offline
user-joined
user-left
```

The server will verify that a user is a member of the relevant group before allowing access to its rooms.

The final chat implementation will enforce:

- Text/image/GIF-only messaging
- 2 MB file limit
- Five-message persistent history
- Five-message initial display
- Sender and timestamp
- User-owned message deletion only
- Synchronized deletion
- Empty deleted-message slots
- Room membership visibility
- Join/leave notifications
- Online/offline indicators

---

# 7. Design Documents

## 7.1 Design Document Storage

The repository contains a concept/wireframe image at:

```text
public/Logs + Progress WIPS/Concept.jpg
```

The concept sketch includes early designs for:

- Login
- Main chat layout
- User interface
- Group Admin interface
- Super Admin interface
- Profile/user presentation
- Settings/theme ideas
- Responsive/future layout ideas

The repository also contains the implemented visual design assets used to translate the concepts into the Angular interface.

Relevant assets include:

```text
public/assets/Images/
├── JustChattingBaseWindowLogin.png
├── JustChattingBaseWindowLoginMobile.png
├── JustChattingBaseWindowSuperAdmin.png
├── JustChattingBaseWindowSuperAdminMobile.png
├── JustChattingBaseWindowUser.png
├── JustChattingBaseWindowUserMobile.png
├── JustChattingTitle.png
├── JustChattingICON.png
├── LoginFlower.png
├── LoginFlowerHover.png
├── GuestLoginFlower.png
├── GuestLoginFlowerHover.png
├── SignUpFlower.png
└── SignUpFlowerHover.png
```

## 7.2 Design Principles

The UI is designed around:

- Responsive layouts
- Clear role separation
- Consistent application branding
- Clear navigation
- Group/chat organisation
- Distinct administrative interfaces
- Reusable interface elements
- Desktop/tablet/mobile adaptation
- Visual status indicators

## 7.3 Responsive Design

Responsive behaviour is supported through:

- Separate desktop/mobile background assets
- Browser resize detection on the login interface
- Flexible Angular layouts
- Mobile-specific interface assets
- Responsive CSS

The final interface must remain usable when the browser/window dimensions change.

## 7.4 Login Design

The login interface includes:

- Username
- Password
- Login action
- Registration navigation
- Guest entry

The current visual design uses custom branding and flower/button assets.

## 7.5 Regular User Design

The Regular User interface provides access to:

- Group search
- My Groups
- Group creation request
- Group requests
- Profile
- Chat rooms

## 7.6 Group Admin Design

The Group Admin interface provides:

- Group settings
- Group name/description/age limit
- Theme controls
- Member list
- Online/offline indicator structure
- Membership request access
- Channel list
- Channel creation
- Channel rename/delete controls

## 7.7 Super Admin Design

The Super Admin interface provides:

- User management
- Banned users
- Audit logs
- Group creation requests
- Administrative navigation

The Super Admin interface is visually separated from normal user interfaces.

## 7.8 Chat Room Design

The Phase 1 chat room establishes the visual structure required for the final chat application.

The planned final chat UI includes:

- Group/channel navigation
- Message area
- Sender information
- Timestamps
- Text/image/GIF content
- Room members
- Online/offline indicators
- Join/leave notifications
- Message deletion controls

## 7.9 Profile Design

The profile interface supports:

- Username
- First name
- Last name
- Email
- Age
- Profile picture
- Password change

Email is displayed but is not editable.

Profile pictures can be uploaded through the application.

---

# 8. Phase 1 Prototype Implementation

## 8.1 Frontend

The Phase 1 frontend uses:

- Angular
- TypeScript
- HTML
- CSS

Current major components are:

```text
Login
Register
Guest Home
User Home
Super Admin
User Management
Banned Users
Audit Logs
Group Search
Create Group
Group Requests
Group Admin
My Groups
Profile
Chat Room
```

## 8.2 Backend

The Phase 1 backend uses:

- Node.js
- Express
- JSON persistent storage
- bcrypt

The backend is intentionally smaller than the final application.

It provides enough functionality to demonstrate the Phase 1 persistence requirements while leaving the database, real-time communication and complete production security for Phase 2.

## 8.3 User Creation and Persistence

Users can be created through the registration interface.

The backend:

1. Validates the username.
2. Validates the email.
3. Validates the password requirements.
4. Hashes the password with bcrypt.
5. Creates a unique user ID.
6. Stores the user in `server/data/users.json`.

## 8.4 Group Creation and Persistence

A Regular User submits a group creation request.

The request is stored in:

```text
server/data/group-requests.json
```

The Super Admin can approve or reject the request.

When approved:

1. A group is created.
2. The requester is assigned as the default administrator.
3. The requester is added as a member.
4. The user's group relationship is persisted.
5. The request is marked as approved.

The group is stored in:

```text
server/data/groups.json
```

## 8.5 Channel Creation and Persistence

A Group Admin can create a channel.

The channel is stored in:

```text
server/data/channels.json
```

Each channel contains a `groupId`, establishing its relationship to the parent group.

This satisfies the Phase 1 requirement that users/groups/channels can be created and associated using server-side JSON data.

## 8.6 Membership Requests

The Phase 1 backend supports the core membership request workflow:

```text
User
 |
 +-- request to join
          |
          v
   group-requests.json
          |
          v
    Group Admin
       /    \
   approve  reject
      |
      v
   group.members
```

The backend checks group age restrictions before creating a membership request.

## 8.7 Permission-Level Interfaces

The prototype provides UI structures for:

```text
Super Admin
Group Admin
Regular User
Guest
```

The Group Admin interface is reached through groups administered by the current user.

The Super Admin interface is separated from the Regular User interface.

## 8.8 Authentication

The Phase 1 authentication system supports:

- Username/password registration
- Username/password login
- bcrypt password hashing
- Minimum eight-character password length
- At least one uppercase character
- Guest entry
- Current-user lookup
- Basic logout endpoint

The Phase 1 implementation is not intended to be the final production authentication/security system.

## 8.9 Profile Functionality

The profile system supports:

- Loading the user's profile
- Username changes
- First-name changes
- Last-name changes
- Age changes
- Profile-picture uploads
- Password changes
- Existing-password verification before password changes

## 8.10 Phase 1 Backend Limitations

Phase 1 intentionally does not require:

- MongoDB
- Socket.io
- Complete real-time messaging
- Full production authentication
- Full production authorisation
- Complete notification delivery
- Complete ban workflows
- Complete audit persistence
- Complete message persistence
- Production HTTPS
- Production deployment

The backend nevertheless implements the minimum JSON persistence needed by the Phase 1 prototype:

```text
Users
Groups
Channels
Group membership relationships
Group creation requests
Membership requests
```

---

# 9. Phase 1 Limitations and Deferred Features

The following features are intentionally deferred to later development:

- MongoDB integration
- Socket.io real-time communication
- Complete role-based access control
- Complete group membership lifecycle
- Complete channel request/approval lifecycle
- Complete channel rename/delete backend endpoints
- Group deletion request workflow
- Group-level ban workflow
- Permanent system-ban workflow
- Banned-email enforcement
- Complete audit-log persistence/filtering
- Complete notification system
- Online/offline real-time presence
- Five-message persistent chat history
- Synchronized message deletion
- Image/GIF upload validation for chat
- 2 MB chat file-size enforcement
- Complete profile privacy enforcement
- Production HTTPS
- Production deployment
- Complete automated testing coverage

These limitations are consistent with the Phase 1 requirement that the prototype focus on UI design, architecture and JSON persistence rather than the complete Phase 2 application.

---

# 10. Compliance Notes and Remaining Actions

The Phase 1 documentation and prototype satisfy the main Phase 1 structural requirements:

- `Phase1.md` is Markdown.
- Student number, name and workshop time are included at the top.
- Project overview is documented.
- Git strategy is documented.
- Functional requirements and assumptions are documented in tables.
- JSON data structures are documented.
- Angular components, services, models and routes are documented.
- Proposed server API endpoints are documented.
- Responsive UI/design work is documented.
- Users, groups and channels can be represented and persisted using server-side JSON.
- Basic username/password authentication is implemented.
- Permission-level UI structures are present.

### Important remaining actions before submission

**1. Rename the application branding from JustChatting to Fabuloso.**

The assignment specification names the application Fabuloso, while the current repository contains JustChatting branding in the UI/assets and repository name. The final submission should use one consistent name.

**2. Add/commit a clearly labelled storyboard or wireframe package.**

`public/Logs + Progress WIPS/Concept.jpg` is an early concept/wireframe and should be explicitly identified as the Phase 1 design document.

The current Git history shows the concept image was added in the `Update 2` commit, after the repository's initial coding commit. Therefore, the repository history does not clearly prove that the design document was stored before coding began. A clean submission should contain the final storyboard/wireframes in the repository and, if possible, establish them in Git history before subsequent implementation work.

**3. Ensure the Group Admin theme is persisted.**

The Group Admin UI supplies theme values, but the current group update endpoint does not yet persist the `theme` object. This is acceptable as a Phase 1 UI prototype feature but should be completed before Phase 2.

**4. Complete server-side validation for group name and description.**

The Angular Group Admin UI enforces the 30-character group name and 250-character description limits. These limits should also be enforced by the Express API in the complete implementation.

**5. Keep the distinction between implemented and planned features clear.**

Phase 1 does not need every final feature to work. The documentation should therefore avoid describing deferred functionality as already implemented.

---

# 11. Future Development

Phase 2 will expand the prototype into the complete database-backed and real-time application.

Major priorities are:

1. Rename/finalise Fabuloso branding.
2. Complete production authentication and authorisation.
3. Migrate JSON persistence to MongoDB.
4. Complete all request and approval workflows.
5. Complete Group Admin permissions.
6. Complete group/channel management.
7. Complete group deletion requests.
8. Complete group-level bans.
9. Complete permanent system-ban requests.
10. Implement banned-email enforcement.
11. Implement complete audit logging.
12. Implement Socket.io communication.
13. Implement text/image/GIF messaging.
14. Enforce 2 MB chat file limits.
15. Retain only the five most recent persistent messages per room.
16. Implement synchronized message deletion.
17. Implement online/offline presence.
18. Implement join/leave notifications.
19. Implement notification privacy.
20. Complete profile privacy.
21. Complete responsive layouts.
22. Complete automated/manual testing.
23. Configure HTTPS.
24. Complete Phase 2 documentation.

---

# 12. Repository Structure

The major project structure is:

```text
JustChatting/ (application: Fabuloso)
│
├── src/
│   ├── app/
│   │   ├── audit-logs/
│   │   ├── banned-users/
│   │   ├── chat-room/
│   │   ├── create-group/
│   │   ├── group-admin/
│   │   ├── group-requests/
│   │   ├── group-search/
│   │   ├── guest-home/
│   │   ├── login/
│   │   ├── my-groups/
│   │   ├── profile/
│   │   ├── register/
│   │   ├── super-admin/
│   │   ├── user-home/
│   │   ├── user-management/
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   └── auth.guard.ts
│   │
│   ├── assets/
│   │   └── profile-pictures/
│   │
│   ├── index.html
│   └── main.ts
│
├── server/
│   ├── data/
│   │   ├── banned-emails.json
│   │   ├── channels.json
│   │   ├── group-requests.json
│   │   ├── groups.json
│   │   └── users.json
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── groups.js
│   │   └── profile.js
│   │
│   ├── bootstrap.js
│   ├── package.json
│   └── server.js
│
├── public/
│   ├── assets/
│   │   ├── cursor/
│   │   ├── font/
│   │   └── Images/
│   │
│   └── Logs + Progress WIPS/
│       └── Concept.jpg
│
└── Phase1.md
```

---

# 13. Phase 1 Completion Summary

The Phase 1 prototype establishes the required foundation for Fabuloso.

Current Phase 1 work includes:

- Angular application structure
- TypeScript components
- Login interface
- Registration interface
- Guest interface
- Regular User interface
- Group Admin interface
- Super Admin interface
- User-management interface
- Banned-user interface
- Audit-log interface
- Group-search interface
- Group-creation request interface
- My Groups interface
- Group-request interface
- Profile interface
- Chat-room interface
- Node.js backend
- Express route structure
- bcrypt password hashing
- Bootstrap structure
- Persistent JSON storage
- User JSON data
- Group JSON data
- Channel JSON data
- Group-request JSON data
- Profile-picture upload structure
- Membership request structure
- Group creation approval workflow
- Group membership approval workflow
- Responsive UI assets
- Custom application visual design
- Custom fonts
- Custom cursor assets
- Angular test-file structure
- Planned service architecture
- Planned model architecture
- Planned API architecture
- Planned Socket.io architecture
- Phase 2 MongoDB migration path

The prototype therefore provides the UI, architecture and persistent JSON foundation required to continue development into the complete Fabuloso application.

---

# 14. Repository

The source code and documentation are maintained in the GitHub repository:

https://github.com/R4nd0mHUman/JustChatting

The repository contains the Angular frontend, Node.js backend, JSON data, assets, design/progress files, testing structures and Phase 1 documentation.
