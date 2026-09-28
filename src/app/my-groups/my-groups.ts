// Imports Angular's ChangeDetectorRef service, Component decorator, and OnInit lifecycle interface.
import {ChangeDetectorRef, Component, OnInit} from '@angular/core';

import {CommonModule} from '@angular/common'; // Imports Angular's common functionality and directives used by the component.
import {FormsModule} from '@angular/forms'; // Imports FormsModule so Angular can use form controls and two-way data binding.
import {HttpClient} from '@angular/common/http'; // Imports HttpClient so the component can communicate with the Express backend.
import {Router} from '@angular/router'; // Imports Router so the component can navigate between application pages.


// Defines this class as an Angular component.
@Component({

    // Sets the custom HTML element name used to display the my groups component.
    selector: 'app-my-groups',

    // Imports the Angular modules and features required by the my groups template.
    imports: [CommonModule, FormsModule],

    // Specifies the HTML template and CSS stylesheet used to display the my groups page.
    templateUrl: './my-groups.html',
    styleUrl: './my-groups.css'
})


// Defines the MyGroups component class and implements Angular's OnInit lifecycle interface.
export class MyGroups implements OnInit {

    // Stores the groups belonging to the currently logged-in user.
    groups: any[] = [];

    // Controls whether the groups page is displaying its loading state.
    loading = true;

    // Stores the ID of the currently logged-in user.
    userId = '';


    // Injects the services required for HTTP requests, navigation, and manually updating the Angular view.
    constructor(
        private http: HttpClient,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {}


    // Runs automatically when the my groups component finishes loading.
    ngOnInit(): void {

        // Gets the ID of the currently logged-in user from local storage.
        this.userId = localStorage.getItem('userId') || '';

        // Checks whether a logged-in user's ID is available.
        if (!this.userId) {
            // Sends the user to the login page when they are not logged in.
            this.router.navigate(['/login']);
            return;
        }

        // Loads the groups belonging to the current user.
        this.loadGroups();

    }


    // Creates the request headers required by the backend.
    private headers() {
        // Returns the current user's ID in the request headers.
        return {'x-user-id': this.userId};
    }


    // Retrieves the groups belonging to the current user from the backend.
    loadGroups(): void {

        // Displays the loading state while the user's groups are being retrieved.
        this.loading = true;

        // Sends a GET request to retrieve the user's groups.
        this.http.get<any[]>(
            `http://localhost:3000/api/groups/user/${this.userId}`,

            // Sends the current user's ID in the request headers.
            {headers: this.headers()}

        ).subscribe({

            // Runs when the user's groups are successfully retrieved.
            next: groups => {

                // Stores the groups returned by the backend.
                this.groups = groups || [];

                // Prepares each group to store its channels before they are loaded.
                this.groups.forEach(
                    group => {

                        // Creates an empty channels array so Angular can safely display the group's channels.
                        group.channels = [];

                        // Loads the channels belonging to the current group.
                        this.loadChannels(group);

                    }
                );

                // Stops displaying the loading state after the groups have loaded.
                this.loading = false;

                // Forces Angular to refresh the page after the groups have been loaded.
                this.cdr.detectChanges();

            },

            // Runs if the user's groups cannot be loaded.
            error: err => {

                // Logs the group loading error for debugging purposes.
                console.error(
                    'Failed to load groups:',
                    err
                );

                // Displays the backend error message when available, otherwise shows a general error message.
                alert(
                    err.error?.message ||
                    'Unable to load your groups.'
                );

                // Stops displaying the loading state after the request fails.
                this.loading = false;

                // Forces Angular to update the view after the loading state changes.
                this.cdr.detectChanges();

            }

        });

    }


    // Retrieves the channels belonging to a specific group.
    loadChannels(
        group: any
    ): void {

        // Sends a GET request to retrieve the selected group's channels.
        this.http.get<any[]>(
            `http://localhost:3000/api/groups/${group.id}/rooms`,

            // Sends the current user's ID in the request headers.
            {headers: this.headers()}

        ).subscribe({

            // Runs when the group's channels are successfully retrieved.
            next: channels => {

                // Stores the channels returned by the backend on the current group.
                group.channels =
                    channels || [];

                // Forces Angular to refresh the view so the loaded channels appear.
                this.cdr.detectChanges();

            },

            // Runs if the group's channels cannot be loaded.
            error: err => {

                // Logs the channel loading error for debugging purposes.
                console.error(
                    'Failed to load channels:',
                    err
                );

                // Forces Angular to refresh the view even if loading the channels fails.
                this.cdr.detectChanges();

            }

        });

    }


    // Opens the management page for the selected group.
    openGroup(
        groupId: string
    ): void {

        // Navigates to the group management page using the selected group ID.
        this.router.navigate([
            '/groups/manage',
            groupId
        ]);

    }


    // Opens the selected channel in the group chat.
    openChannel(
        groupId: string,
        channelId: string
    ): void {

        // Navigates to the chat page using the selected group and channel IDs.
        this.router.navigate([
            '/chat',
            groupId,
            channelId
        ]);

    }


    // Navigates the user back to their dashboard.
    backToDashboard(): void {
        // Changes the current route to the user dashboard.
        this.router.navigate(['/user']);
    }

}