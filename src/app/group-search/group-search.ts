// Imports Angular's Component decorator and OnInit lifecycle interface.
import {Component, OnInit} from '@angular/core';

import {CommonModule} from '@angular/common'; // Imports Angular's common functionality and directives used by the component.
import {FormsModule} from '@angular/forms'; // Imports FormsModule so Angular can use form controls and two-way data binding.
import {HttpClient} from '@angular/common/http'; // Imports HttpClient so the component can communicate with the Express backend.
import {Router} from '@angular/router'; // Imports Router so the component can navigate between application pages.


// Defines this class as an Angular component.
@Component({

    // Sets the custom HTML element name used to display the group search component.
    selector: 'app-group-search',

    // Imports the Angular modules and features required by the group search template.
    imports: [CommonModule, FormsModule],

    // Specifies the HTML template and CSS stylesheet used to display the group search page.
    templateUrl: './group-search.html',
    styleUrl: './group-search.css'
})


// Defines the GroupSearch component class and implements Angular's OnInit lifecycle interface.
export class GroupSearch implements OnInit {

    // Stores the search text entered by the user.
    search = '';

    // Stores the groups returned by the backend search.
    groups: any[] = [];

    // Tracks whether a group search request is currently being processed.
    loading = false;

    // Tracks whether the current user is accessing the page as a guest.
    isGuest = false;


    // Injects the services required for HTTP requests and navigation.
    constructor(
        private http: HttpClient,
        private router: Router
    ) {}


    // Runs automatically when the group search component finishes loading.
    ngOnInit(): void {

        // Determines whether the current page is being accessed through the guest route.
        this.isGuest = this.router.url.startsWith('/guest');

        // Loads the available groups using the current search value.
        this.searchGroups();

    }


    // Searches the backend for groups matching the entered search text.
    searchGroups(): void {

        // Displays the loading state while the group search is being processed.
        this.loading = true;

        // Sends a GET request to retrieve groups from the backend.
        this.http.get<any[]>(
            'http://localhost:3000/api/groups',

            // Sends the current search text as a query parameter.
            {
                params: {search: this.search}
            }

        ).subscribe({

            // Runs when the group search request is successfully completed.
            next: response => {

                // Stores the groups returned by the backend.
                this.groups = response || [];

                // Stops displaying the loading state after the groups have loaded.
                this.loading = false;

            },

            // Runs if the group search request fails.
            error: err => {

                // Logs the group search error for debugging purposes.
                console.error(
                    'Failed to search groups:',
                    err
                );

                // Tells the user that the groups could not be loaded.
                alert('Unable to load groups.');

                // Stops displaying the loading state after the request fails.
                this.loading = false;

            }

        });

    }


    // Submits a request for the current user to join the selected group.
    requestToJoin(groupId: string): void {

        // Prevents guests from submitting group membership requests.
        if (this.isGuest) {
            // Tells the guest that they can browse groups but cannot join them.
            alert('Guests can browse public group information but cannot join groups.');
            return;
        }


        // Gets the ID of the currently logged-in user from local storage.
        const userId =
            localStorage.getItem('userId');

        // Checks whether a logged-in user's ID is available.
        if (!userId) {
            // Sends the user to the login page when they are not logged in.
            this.router.navigate(['/login']);
            return;
        }


        // Sends a membership request for the selected group to the backend.
        this.http.post<any>(
            `http://localhost:3000/api/groups/${groupId}/join-request`,

            // Sends an empty request body because the group ID is included in the URL.
            {},

            // Sends the current user's ID in the request headers.
            {
                headers: {
                    'x-user-id': userId
                }
            }

        ).subscribe({

            // Runs when the membership request is successfully submitted.
            next: response => {

                // Tells the user that their membership request was submitted successfully.
                alert(response.message || 'Join request submitted successfully.');

            },

            // Runs if the membership request cannot be submitted.
            error: err => {

                // Displays the backend error message when available, otherwise shows a general error message.
                alert(
                    err.error?.message ||
                    'Unable to request membership.'
                );

            }

        });

    }


    // Navigates the user back to the appropriate dashboard.
    back(): void {

        // Sends guests back to the guest page and logged-in users back to the user dashboard.
        this.router.navigate([
            this.isGuest ? '/guest' : '/user'
        ]);

    }

}