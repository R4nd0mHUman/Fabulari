// Imports Angular's Component decorator, HostListener for browser events, OnInit lifecycle interface, and ChangeDetectorRef service.
import {Component, HostListener, OnInit, ChangeDetectorRef} from '@angular/core';

import {CommonModule} from '@angular/common'; // Imports Angular's common functionality and directives used by the component.

// Imports Router for navigation between application pages and RouterLink for router links in the template.
import {Router, RouterLink} from '@angular/router';

import {HttpClient} from '@angular/common/http'; // Imports HttpClient so the component can communicate with the Express backend.


// Defines this class as an Angular component.
@Component({

    // Sets the custom HTML element name used to display the user home component.
    selector: 'app-user-home',

    // Imports the Angular modules and features required by the user home template.
    imports: [CommonModule, RouterLink],

    // Specifies the HTML template and CSS stylesheet used to display the user home page.
    templateUrl: './user-home.html',
    styleUrl: './user-home.css'

})


// Defines the UserHome component class and implements Angular's OnInit lifecycle interface.
export class UserHome implements OnInit {

    // Tracks whether the browser window is currently using the mobile layout.
    isMobile =
        window.innerWidth <= 768;

    // Stores the desktop background image used by the user home page.
    desktopBase = 'assets/Images/JustChattingBaseWindowUser.png';

    // Stores the mobile background image used by the user home page.
    mobileBase = 'assets/Images/JustChattingBaseWindowUserMobile.png';

    // Stores the currently selected desktop or mobile background image.
    currentBase = this.isMobile ? this.mobileBase : this.desktopBase;

    // Stores the profile picture displayed for the current user.
    profilePicture = 'assets/Images/defaultusertransparent.png';

    // Stores the username displayed on the user home page.
    username = 'User';

    // Tracks whether the current user administers at least one group.
    hasAdminGroups = false;

    // Tracks whether the current user has pending membership requests for groups they administer.
    hasPendingAdminRequests = false;


    // Injects the services required for HTTP requests, navigation, and manually updating the Angular view.
    constructor(
        private http: HttpClient,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {
        // Loads the current user's username from local storage when the component is created.
        this.username =  localStorage.getItem('username') || 'User';
    }


    // Runs automatically when the user home component finishes loading.
    ngOnInit(): void {

        // Gets the ID of the currently logged-in user from local storage.
        const userId = localStorage.getItem('userId');

        // Checks whether a logged-in user's ID is available.
        if (!userId) {
            // Sends the user to the login page when they are not logged in.
            this.router.navigate(['/login']);
            return;
        }

        // Loads the current user's profile information.
        this.loadProfile(userId);

        // Loads the user's group and membership request information.
        this.loadMembershipState(userId);

    }


    // Creates the request headers required by the backend.
    private headers(userId: string) {
        // Returns the current user's ID in the request headers.
        return {'x-user-id': userId};
    }


    // Retrieves the current user's profile information from the backend.
    loadProfile(userId: string): void {

        // Sends a GET request to retrieve the user's profile.
        this.http.get<any>(`http://localhost:3000/api/profile/${userId}`).subscribe({

            // Runs when the user's profile is successfully retrieved.
            next: response => {

                // Updates the displayed username using the value returned by the backend.
                this.username = response.username;

                // Stores the latest username in local storage.
                localStorage.setItem('username', response.username);

                // Checks whether the user has a profile picture.
                if (response.profilePicture) {

                    // Updates the displayed profile picture using the returned profile picture path.
                    this.profilePicture =
                        response.profilePicture.startsWith(
                            '/uploads/'
                        )

                            // Adds the backend URL and timestamp to profile picture paths stored by the server.
                            ? 'http://localhost:3000' +
                              response.profilePicture +
                              '?t=' + Date.now()

                            // Uses the returned profile picture directly when it is already a complete image path.
                            : response.profilePicture;

                    // Forces Angular to refresh the profile information displayed on the page.
                    this.cdr.detectChanges();

                }

            },

            // Runs if the user's profile cannot be loaded.
            error: err => {

                // Logs the profile loading error for debugging purposes.
                console.error(
                    'Failed to load profile:',
                    err
                );

            }

        });

    }


    // Loads the current user's group membership and administrator request information.
    loadMembershipState(userId: string): void {

        // Retrieves the groups belonging to the current user.
        this.http.get<any[]>(`http://localhost:3000/api/groups/user/${userId}`,

            // Sends the current user's ID in the request headers.
            {headers: this.headers(userId)}

        ).subscribe({

            // Runs when the user's groups are successfully retrieved.
            next: groups => {

                // Checks whether the user administers at least one group.
                this.hasAdminGroups =
                    (groups || []).some(
                        group =>
                            group.membershipRole === 'admin'
                    );

            },

            // Runs if the user's groups cannot be loaded.
            error: err => {

                // Logs the group loading error for debugging purposes.
                console.error(
                    'Failed to load groups:',
                    err
                );

            }

        });


        /**
         * LOAD PENDING REQUESTS FOR GROUPS THIS USER ADMINISTERS
         * ======================================================
         * This endpoint returns an OBJECT rather than a plain array.
         *
         * Express returns:
         *
         * {
         *     requests: [...],       // membership requests for groups this user administers
         *     groups: [...],         // groups administered by this user
         *     isGroupAdmin: boolean  // whether this user administers at least one group
         * }
         *
         * The previous version treated the entire response object as an array and
         * attempted to call .some() on it. The .some() method belongs to arrays,
         * which caused:
         *
         * TypeError: (...).some is not a function
         */
        this.http.get<{
            requests: any[];
            groups: any[];
            isGroupAdmin: boolean;
        }>(
            `http://localhost:3000/api/groups/requests/admin/${userId}`,
            {headers: this.headers(userId)}
        ).subscribe({

            // Runs when Express successfully returns the administrator request information.
            next: response => {

                // Extract the requests array from the response object.
                // Array.isArray() protects the frontend if an unexpected response is returned.
                const requests: any[] = Array.isArray(response?.requests)
                    ? response.requests
                    : [];

                // Checks whether at least one request is still waiting for an administrator decision.
                this.hasPendingAdminRequests = requests.some(
                    (request: any) => request.status === 'pending'
                );
            },

            // Runs if the administrator request information cannot be loaded.
            error: err => {

                console.error(
                    'Failed to load admin requests:',
                    err
                );

                // Default to no pending requests if the HTTP request fails.
                this.hasPendingAdminRequests = false;
            }

        });

    }


    // Runs whenever the browser window is resized.
    @HostListener('window:resize')
    onResize(): void {

        // Stores the previous mobile layout state before checking the new window size.
        const wasMobile = this.isMobile;

        // Updates the mobile layout state based on the current browser width.
        this.isMobile = window.innerWidth <= 768;

        // Checks whether the layout has changed between desktop and mobile.
        if (wasMobile !== this.isMobile) {
            // Selects the appropriate background image for the new layout.
            this.currentBase = this.isMobile ? this.mobileBase : this.desktopBase;
        }

    }


    // Logs the current user out of the application.
    logout(): void {

        // Removes the logged-in user's ID from local storage.
        localStorage.removeItem('userId');

        // Removes the logged-in user's username from local storage.
        localStorage.removeItem('username');

        // Removes the logged-in user's role from local storage.
        localStorage.removeItem('role');

        // Removes any stored guest login state.
        localStorage.removeItem('guest');

        // Sends the user to the login page after logging out.
        this.router.navigate(['/login']);
    }

}