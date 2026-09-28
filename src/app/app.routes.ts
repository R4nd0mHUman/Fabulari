// Imports Angular's Routes type used to define the application's navigation routes.
import {Routes} from '@angular/router';
import {Bootstrap} from './bootstrap/bootstrap';


// Imports the login component used for user authentication.
import {Login} from './login/login';

// Imports the registration component used to create new user accounts.
import {Register} from './register/register';

// Imports the guest home component used when browsing the application as a guest.
import {GuestHome} from './guest-home/guest-home';

// Imports the super-admin dashboard component.
import {SuperAdmin} from './super-admin/super-admin';

// Imports the regular user dashboard component.
import {UserHome} from './user-home/user-home';


// Imports components used by regular users for group and chat functionality.
import {GroupSearch} from './group-search/group-search';
import {MyGroups} from './my-groups/my-groups';
import {CreateGroup} from './create-group/create-group';
import {GroupAdmin} from './group-admin/group-admin';
import {Profile} from './profile/profile';
import {ChatRoom} from './chat-room/chat-room';


// Imports components used by super administrators.
import {AuditLogs} from './audit-logs/audit-logs';
import {UserManagement} from './user-management/user-management';
import {GroupRequests} from './group-requests/group-requests';
import {BannedUsers} from './banned-users/banned-users';


// Imports the route guards used to control access to authenticated, guest, and super-admin pages.
import {authGuard, guestGuard, superAdminGuard} from './auth.guard';


// Defines the application's navigation routes.
export const routes: Routes = [

    // Redirects the default application route to the login page.
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },


    // First-run bootstrap route.
    { path: 'bootstrap', component: Bootstrap },

    // Provides the login page for user authentication.
    {
        path: 'login',
        component: Login
    },

    // Provides the registration page for creating a new account.
    {
        path: 'register',
        component: Register
    },


    // Provides the guest home page for users browsing without logging in.
    {
        path: 'guest',
        component: GuestHome,
        canActivate: [guestGuard]
    },

    // Provides group search functionality to users browsing as guests.
    {
        path: 'guest/groups',
        component: GroupSearch,
        canActivate: [guestGuard]
    },


    // Provides the regular user's home dashboard.
    {
        path: 'user',
        canActivate: [authGuard],
        component: UserHome
    },


    // Provides the super administrator's home dashboard.
    {
        path: 'super-admin',
        canActivate: [superAdminGuard],
        component: SuperAdmin
    },


    // Provides group search functionality for logged-in users.
    {
        path: 'groups/search',
        canActivate: [authGuard],
        component: GroupSearch
    },

    // Displays the groups belonging to the current user.
    {
        path: 'groups',
        canActivate: [authGuard],
        component: MyGroups
    },

    // Displays group creation and membership requests.
    {
        path: 'groups/requests',
        canActivate: [authGuard],
        component: GroupRequests
    },

    // Provides the page for requesting a new group.
    {
        path: 'groups/create',
        canActivate: [authGuard],
        component: CreateGroup
    },

    // Provides group management functionality for a Group Admin.
    {
        path: 'groups/manage/:groupId',
        canActivate: [authGuard],
        component: GroupAdmin
    },

    // Provides the private profile page for the current user.
    {
        path: 'profile',
        canActivate: [authGuard],
        component: Profile
    },


    // Opens a specific chat channel inside a specific group.
    // The route contains both the group ID and channel ID.

    // Example:
    // /chat/c8421e8c-25a7-4220-b2e4-96bcff2a39a4/3342dfb3-51d5-4600-b081-590bc88fc5dc

    {
        path: 'chat/:groupId/:channelId',
        canActivate: [authGuard],
        component: ChatRoom
    },


    // Provides access to the super administrator pages.
    
    // Audit logs.
    {
        path: 'super-admin/audit',
        canActivate: [superAdminGuard],
        component: AuditLogs
    },

    // Provides user management functionality for super administrators.
    {
        path: 'super-admin/users',
        canActivate: [superAdminGuard],
        component: UserManagement
    },

    // Displays group creation requests requiring super-admin approval.
    {
        path: 'super-admin/group-requests',
        canActivate: [superAdminGuard],
        component: GroupRequests
    },

    // Displays users who have been permanently banned.
    {
        path: 'super-admin/banned-users',
        canActivate: [superAdminGuard],
        component: BannedUsers
    }

];