// Imports Angular's Component decorator, OnInit lifecycle interface, and ChangeDetectorRef service.
import {Component, OnInit, ChangeDetectorRef} from '@angular/core';

// Imports Angular's common functionality and directives used by the component.
import {CommonModule} from '@angular/common';

// Imports FormsModule so Angular can use form controls and two-way data binding.
import {FormsModule} from '@angular/forms';

// Imports HttpClient for backend requests and HttpHeaders for sending request headers.
import {HttpClient, HttpHeaders} from '@angular/common/http';

// Imports Router so the component can navigate between application pages.
import {Router} from '@angular/router';


// Defines this class as an Angular component.
@Component({

    // Sets the custom HTML element name used to display the group requests component.
    selector: 'app-group-requests',

    // Specifies that this component is a standalone Angular component.
    standalone: true,

    // Imports the Angular modules and features required by the group requests template.
    imports: [CommonModule, FormsModule],

    // Specifies the HTML template and CSS stylesheet used to display the group requests page.
    templateUrl: './group-requests.html',
    styleUrl: './group-requests.css'
})


// Defines the GroupRequests component class and implements Angular's OnInit lifecycle interface.
export class GroupRequests implements OnInit {

    // Stores the base URL used for requests to the backend API.
    private readonly apiUrl =
        'http://localhost:3000/api';


    // Stores the global role assigned to the currently logged-in user.
    role = '';

    // Tracks whether the current user has the regular user role.
    isRegularUser = false;

    // Tracks whether the current user administers at least one group.
    isGroupAdmin = false;

    // Tracks whether the current user has the super-admin role.
    isSuperAdmin = false;


    // Stores the current user's own group creation requests.
    creationRequests: any[] = [];

    // Stores the current user's own membership requests.
    membershipRequests: any[] = [];

    // Stores membership requests submitted by users who want to join groups administered by the current user.
    adminMembershipRequests: any[] = [];

    // Stores group creation requests waiting for super-admin approval.
    creationApprovalRequests: any[] = [];


    // Controls whether the join group form is displayed.
    showJoinForm = false;

    // Stores the group ID entered into the join group form.
    joinGroupId = '';

    // Tracks whether a membership request is currently being submitted.
    submittingJoin = false;


    // Controls whether the group requests page is displaying its loading state.
    loading = true;


    // Injects the services required for HTTP requests, navigation, and manually updating the Angular view.
    constructor(
        private http: HttpClient,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {}


    // Runs automatically when the group requests component finishes loading.
    ngOnInit(): void {

        // Logs that the group requests page has been initialised.
        console.log(
            'GROUP REQUESTS PAGE INITIALISED'
        );

        // Gets the ID of the currently logged-in user from local storage.
        const userId =
            localStorage.getItem('userId');

        // Gets the currently logged-in user's global role from local storage.
        this.role =
            localStorage.getItem('role') || 'user';

        // Logs the current user's ID for debugging purposes.
        console.log(
            'User ID:',
            userId
        );

        // Logs the current user's role for debugging purposes.
        console.log(
            'Role:',
            this.role
        );


        // Checks whether a logged-in user's ID is available.
        if (!userId) {

            // Logs an error when no logged-in user was found.
            console.error('No user ID found. Redirecting to login.');

            // Sends the user to the login page when they are not logged in.
            this.router.navigate(['/login']);
            return;
        }


        // Determines whether the current user has the super-admin role.
        this.isSuperAdmin =
            this.role === 'super-admin';

        // Determines whether the current user has the regular user role.
        this.isRegularUser =
            this.role === 'user';


        // Determines the user's group administrator status through the backend rather than relying only on their global role.
        this.isGroupAdmin =
            this.role === 'group-admin';

        // Logs whether the current user has the regular user role.
        console.log(
            'Is Regular User:',
            this.isRegularUser
        );

        // Logs whether the current user is a group administrator.
        console.log(
            'Is Group Admin:',
            this.isGroupAdmin
        );

        // Logs whether the current user is a super administrator.
        console.log(
            'Is Super Admin:',
            this.isSuperAdmin
        );


        // Loads the appropriate request information based on the current user's global role.
        if (this.isSuperAdmin) {
            // Loads group creation requests that require super-admin approval.
            this.loadSuperAdminRequests(userId);
        } else {
            // Loads the current user's requests and any requests for groups they administer.
            this.loadUserRequests(userId);
        }

        // Forces Angular to immediately update the group requests page.
        this.cdr.detectChanges();

    }


    // Creates the request headers required by the backend.
    private getHeaders(
        userId: string
    ): HttpHeaders {
        // Returns the current user's ID in the request headers.
        return new HttpHeaders({'x-user-id': userId});
    }


    // Loads the requests associated with a regular user or group administrator.
    loadUserRequests(
        userId: string
    ): void {

        // Displays the loading state while the request information is being retrieved.
        this.loading = true;

        // Creates the request headers using the current user's ID.
        const headers =this.getHeaders(userId);

        // Logs that the current user's own group creation requests are being loaded.
        console.log('Loading own creation requests...');

        // Retrieves the current user's group creation requests from the backend.
        this.http.get<any[]>(
            `${this.apiUrl}/groups/requests/user/${userId}`,
            {headers}

        ).subscribe({

            // Runs when the user's group creation requests are successfully retrieved.
            next: (requests) => {

                // Logs the returned group creation requests for debugging purposes.
                console.log(
                    'Own creation requests:',
                    requests
                );

                // Stores the returned group creation requests.
                this.creationRequests = requests || [];

                // Forces Angular to refresh the creation request list.
                this.cdr.detectChanges();

            },


            // Runs if the user's group creation requests cannot be loaded.
            error: (err) => {

                // Logs the group creation request loading error for debugging purposes.
                console.error(
                    'FAILED TO LOAD CREATION REQUESTS:',
                    err
                );

                // Clears the creation request list when the request fails.
                this.creationRequests = [];

                // Forces Angular to refresh the page after the failed request.
                this.cdr.detectChanges();

            }

        });


        /**
         * LOAD THE CURRENT USER'S MEMBERSHIP REQUESTS
         * ===========================================
         * The MongoDB Request collection stores the persistent request records.
         *
         * This HTTP GET asks Express for only this user's "join" requests.
         * This means pending AND previously rejected/approved requests can survive
         * browser refreshes because Angular is no longer relying on temporary memory.
         *
         * Flow:
         *
         * Angular
         *    |
         *    | GET /api/groups/membership-requests/user/:userId
         *    v
         * Express
         *    |
         *    | Request.find({ requesterId: userId, type: 'join' })
         *    v
         * MongoDB
         */
        this.http.get<any[]>(
            `${this.apiUrl}/groups/membership-requests/user/${userId}`,
            {headers}
        ).subscribe({

            // Runs after Express successfully returns the MongoDB request records.
            next: (requests) => {
                console.log('Own membership requests:', requests);

                // Defensive Array.isArray(...) check prevents Angular from treating an unexpected object response as an array.
                this.membershipRequests = Array.isArray(requests) ? requests : [];

                // Tell Angular to immediately refresh the displayed request history.
                this.cdr.detectChanges();
            },

            // Runs if Express/MongoDB cannot load the user's membership requests.
            error: (err) => {
                console.error('FAILED TO LOAD MEMBERSHIP REQUESTS:', err);

                this.membershipRequests = [];
                this.cdr.detectChanges();
            }
        });

        // Loads membership requests submitted by users who want to join groups administered by the current user.
        this.loadAdminRequests(userId);

        // Forces Angular to refresh the page after starting the request loading processes.
        this.cdr.detectChanges();

    }


    // Retrieves membership requests for groups administered by the current user.
    loadAdminRequests(userId: string): void {

        // Logs that the backend is being checked for groups administered by the current user.
        console.log('Checking for groups administered by user:', userId);

        // Retrieves membership requests for groups administered by the current user.
        this.http.get<any>(`${this.apiUrl}/groups/requests/admin/${userId}`,
            // Sends the current user's ID in the request headers.
            {headers: this.getHeaders(userId)}
        ).subscribe({

            // Runs when the administrator membership requests are successfully retrieved.
            next: (response) => {
                // Logs the returned administrator request information for debugging purposes.
                console.log('Admin membership request response:', response);

                // Stores the membership requests returned by the backend.
                this.adminMembershipRequests = response?.requests || [];

                // Updates the group administrator state using the value returned by the backend.
                this.isGroupAdmin = response?.isGroupAdmin === true;

                // Stops displaying the loading state after the administrator requests have loaded.
                this.loading = false;

                // Forces Angular to refresh the request lists and administrator state.
                this.cdr.detectChanges();
            },


            // Runs if the administrator membership requests cannot be loaded.
            error: (err) => {
                // Logs the administrator request loading error for debugging purposes.
                console.error('FAILED TO LOAD GROUP ADMIN REQUESTS:', err);

                // Logs the HTTP error status for debugging purposes.
                console.error('Status:', err.status);

                // Logs the backend error response for debugging purposes.
                console.error('Response:', err.error);

                // Clears the administrator membership request list after the request fails.
                this.adminMembershipRequests = [];

                // Resets the group administrator state after the request fails.
                this.isGroupAdmin = false;

                // Stops displaying the loading state after the request fails.
                this.loading = false;

                // Forces Angular to refresh the page after the failed request.
                this.cdr.detectChanges();
            }

        });

    }


    // Loads group creation requests that require super-admin approval.
    loadSuperAdminRequests(userId: string): void {

        // Displays the loading state while the approval requests are being retrieved.
        this.loading = true;

        // Logs that pending group creation requests are being loaded for the super administrator.
        console.log('Loading super-admin group creation requests...');

        // Retrieves group creation requests from the backend.
        this.http.get<any[]>(`${this.apiUrl}/groups/requests/creation`,
            {headers: this.getHeaders(userId)}
        ).subscribe({

            // Runs when the group creation requests are successfully retrieved.
            next: (requests) => {
                // Logs the returned super-admin creation requests for debugging purposes.
                console.log('Super-admin creation requests:', requests);

                // Stores only group creation requests that are still waiting for approval.
                this.creationApprovalRequests =
                    (requests || []).filter(
                        request =>
                            request.status === 'pending'
                    );

                // Stops displaying the loading state after the requests have loaded.
                this.loading = false;

                // Forces Angular to refresh the approval request list.
                this.cdr.detectChanges();
            },


            // Runs if the super-admin creation requests cannot be loaded.
            error: (err) => {
                // Logs the super-admin request loading error for debugging purposes.
                console.error('FAILED TO LOAD SUPER ADMIN REQUESTS:', err
                );

                // Logs the HTTP error status for debugging purposes.
                console.error('Status:', err.status);

                // Logs the backend error response for debugging purposes.
                console.error('Response:', err.error);

                // Clears the approval request list after the request fails.
                this.creationApprovalRequests = [];

                // Stops displaying the loading state after the request fails.
                this.loading = false;

                // Forces Angular to refresh the page after the failed request.
                this.cdr.detectChanges();
            }

        });

    }


    // Shows or hides the join group form.
    toggleJoinForm(): void {

        // Reverses the current visibility state of the join group form.
        this.showJoinForm = !this.showJoinForm;

        // Clears the group ID input whenever the join form is closed.
        if (!this.showJoinForm) {
            this.joinGroupId = '';
        }

        // Forces Angular to refresh the join form.
        this.cdr.detectChanges();

    }


    // Submits a request for the current user to join a group.
    submitJoinRequest(): void {

        // Gets the ID of the currently logged-in user from local storage.
        const userId = localStorage.getItem('userId');


        // Checks whether a logged-in user's ID is available.
        if (!userId) {
            // Sends the user to the login page when they are not logged in.
            this.router.navigate(['/login']);
            return;
        }


        // Removes unnecessary spaces from the entered group ID.
        const groupId = this.joinGroupId.trim();

        // Checks that a group ID was entered.
        if (!groupId) {
            // Tells the user that a group ID is required.
            alert('Please enter the group ID.');
            return;
        }

        // Prevents another membership request from being submitted while one is already processing.
        if (this.submittingJoin) {
            return;
        }

        // Locks the membership request submission while the backend request is being processed.
        this.submittingJoin = true;

        // Logs the group ID being used for the membership request.
        console.log(
            'Submitting membership request:',
            groupId
        );


        // Sends the membership request to the backend.
        this.http.post<any>(
            `${this.apiUrl}/groups/${encodeURIComponent(groupId)}/membership-requests`,
            {},
            {headers: this.getHeaders(userId)}
        ).subscribe({

            // Runs when the membership request is successfully created.
            next: (response) => {

                // Logs the returned membership request information for debugging purposes.
                console.log('Membership request created:', response);

                // Tells the user that their membership request was submitted successfully.
                alert(response.message || 'Group membership request submitted.');

                // Adds the returned membership request to the local list so it appears without refreshing the page.
                if (response?.request) {
                    this.membershipRequests = [
                        ...this.membershipRequests,
                        response.request
                    ];
                }

                // Clears the group ID input after the request has been submitted.
                this.joinGroupId = '';

                // Closes the join group form after the request has been submitted.
                this.showJoinForm = false;

                // Unlocks the membership request submission after the request completes.
                this.submittingJoin = false;

                // Refreshes administrator membership requests in case the current user also administers a group.
                this.loadAdminRequests(userId);

                // Forces Angular to immediately update the request lists and form state.
                this.cdr.detectChanges();
            },


            // Runs if the membership request cannot be created.
            error: (err) => {

                // Logs the membership request error for debugging purposes.
                console.error('FAILED TO CREATE MEMBERSHIP REQUEST:', err);

                // Logs the HTTP error status for debugging purposes.
                console.error('Status:', err.status);

                // Logs the backend error response for debugging purposes.
                console.error('Response:', err.error);

                // Displays the backend error message when available, otherwise shows a general error message.
                alert(err.error?.message || 'Unable to submit membership request.');

                // Unlocks the membership request submission after the failed request.
                this.submittingJoin = false;

                // Forces Angular to refresh the page after the failed request.
                this.cdr.detectChanges();

            }

        });

    }


    // Approves a pending group creation request.
    approveCreation(
        request: any
    ): void {

        // Gets the ID of the currently logged-in user from local storage.
        const userId = localStorage.getItem('userId');

        // Checks whether a logged-in user's ID is available.
        if (!userId) {
            // Sends the user to the login page when they are not logged in.
            this.router.navigate(['/login']);
            return;
        }

        // Sends an approval request to the backend for the selected group creation request.
        this.http.post<any>(
            `${this.apiUrl}/groups/requests/${request.requestId}/approve`,

            {},

            {
                headers:
                    this.getHeaders(userId)
            }

        ).subscribe({

            // Runs when the group creation request is successfully approved.
            next: (response) => {

                // Tells the super administrator that the group was approved successfully.
                alert(
                    response.message ||
                    'Group approved successfully.'
                );

                // Removes the approved request from the local approval queue.
                this.creationApprovalRequests =
                    this.creationApprovalRequests.filter(
                        currentRequest =>
                            currentRequest.requestId !==
                            request.requestId
                    );

                // Forces Angular to refresh the approval request list.
                this.cdr.detectChanges();

            },


            // Runs if the group creation request cannot be approved.
            error: (err) => {

                // Logs the group approval error for debugging purposes.
                console.error(
                    'FAILED TO APPROVE GROUP:',
                    err
                );

                // Displays the backend error message when available, otherwise shows a general error message.
                alert(
                    err.error?.message ||
                    'Unable to approve group request.'
                );

            }

        });

    }


    // Rejects a pending group creation request.
    rejectCreation(
        request: any
    ): void {

        // Gets the ID of the currently logged-in user from local storage.
        const userId = localStorage.getItem('userId');

        // Checks whether a logged-in user's ID is available.
        if (!userId) {
            // Sends the user to the login page when they are not logged in.
            this.router.navigate(['/login']);
            return;
        }

        // Sends a rejection request to the backend for the selected group creation request.
        this.http.post<any>(
            `${this.apiUrl}/groups/requests/${request.requestId}/reject`,

            {},

            {
                headers:
                    this.getHeaders(userId)
            }

        ).subscribe({

            // Runs when the group creation request is successfully rejected.
            next: (response) => {

                // Tells the super administrator that the group request was rejected.
                alert(
                    response.message ||
                    'Group request rejected.'
                );

                // Removes the rejected request from the local approval queue.
                this.creationApprovalRequests =
                    this.creationApprovalRequests.filter(
                        currentRequest =>
                            currentRequest.requestId !==
                            request.requestId
                    );

                // Forces Angular to refresh the approval request list.
                this.cdr.detectChanges();

            },


            // Runs if the group creation request cannot be rejected.
            error: (err) => {

                // Logs the group rejection error for debugging purposes.
                console.error(
                    'FAILED TO REJECT GROUP:',
                    err
                );

                // Displays the backend error message when available, otherwise shows a general error message.
                alert(
                    err.error?.message ||
                    'Unable to reject group request.'
                );

            }

        });

    }


    // Approves a pending membership request for a group administered by the current user.
    approveMembership(
        request: any
    ): void {

        // Gets the ID of the currently logged-in user from local storage.
        const userId = localStorage.getItem('userId');

        // Checks whether a logged-in user's ID is available.
        if (!userId) {
            // Sends the user to the login page when they are not logged in.
            this.router.navigate(['/login']);
            return;
        }

        // Sends an approval request to the backend for the selected membership request.
        this.http.post<any>(
            `${this.apiUrl}/groups/${request.groupId}/membership-requests/${request.requestId}/approve`,

            {},

            {
                headers:
                    this.getHeaders(userId)
            }

        ).subscribe({

            // Runs when the membership request is successfully approved.
            next: (response) => {

                // Tells the group administrator that the membership request was approved.
                alert(
                    response.message ||
                    'Membership request approved.'
                );

                // Updates the local membership request status to approved.
                this.updateAdminMembershipStatus(
                    request.requestId,
                    'approved'
                );

            },


            // Runs if the membership request cannot be approved.
            error: (err) => {

                // Logs the membership approval error for debugging purposes.
                console.error(
                    'FAILED TO APPROVE MEMBERSHIP:',
                    err
                );

                // Displays the backend error message when available, otherwise shows a general error message.
                alert(
                    err.error?.message ||
                    'Unable to approve membership request.'
                );

            }

        });

    }


    // Rejects a pending membership request for a group administered by the current user.
    rejectMembership(
        request: any
    ): void {

        // Gets the ID of the currently logged-in user from local storage.
        const userId = localStorage.getItem('userId');

        // Checks whether a logged-in user's ID is available.
        if (!userId) {
            // Sends the user to the login page when they are not logged in.
            this.router.navigate(['/login']);
            return;
        }

        // Sends a rejection request to the backend for the selected membership request.
        this.http.post<any>(
            `${this.apiUrl}/groups/${request.groupId}/membership-requests/${request.requestId}/reject`,

            {},

            {
                headers:
                    this.getHeaders(userId)
            }

        ).subscribe({

            // Runs when the membership request is successfully rejected.
            next: (response) => {

                // Tells the group administrator that the membership request was rejected.
                alert(
                    response.message ||
                    'Membership request rejected.'
                );

                // Updates the local membership request status to rejected.
                this.updateAdminMembershipStatus(
                    request.requestId,
                    'rejected'
                );

            },


            // Runs if the membership request cannot be rejected.
            error: (err) => {

                // Logs the membership rejection error for debugging purposes.
                console.error(
                    'FAILED TO REJECT MEMBERSHIP:',
                    err
                );

                // Displays the backend error message when available, otherwise shows a general error message.
                alert(
                    err.error?.message ||
                    'Unable to reject membership request.'
                );

            }

        });

    }


    // Updates the status of a membership request in the local administrator request list.
    private updateAdminMembershipStatus(
        requestId: any,
        status: string
    ): void {

        // Creates a new request list with the selected request's status updated.
        this.adminMembershipRequests =
            this.adminMembershipRequests.map(
                request => {

                    // Checks whether the current request matches the request being updated.
                    if (request.requestId === requestId) {

                        // Returns the request with its updated status.
                        return {
                            ...request,
                            status
                        };

                    }

                    // Returns requests that do not match without changing them.
                    return request;

                }
            );

        // Forces Angular to refresh the membership request list.
        this.cdr.detectChanges();

    }


    // Navigates the user to the create group page.
    goToCreateGroup(): void {
        // Changes the current route to the create group page.
        this.router.navigate(['/groups/create']);
    }


    // Navigates the user to the group search page.
    goToGroupSearch(): void {
        // Changes the current route to the group search page.
        this.router.navigate(['/groups/search']);
    }


    // Navigates the user back to the appropriate dashboard based on their role.
    backToDashboard(): void {

        // Sends super administrators to the super-admin dashboard.
        if (this.isSuperAdmin) {
            this.router.navigate(['/super-admin']);
            return;
        }

        // Sends regular users and group administrators to the user dashboard.
        this.router.navigate(['/user']);

    }

}