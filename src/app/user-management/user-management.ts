import {Component, OnInit, ChangeDetectorRef} from '@angular/core'; // Imports Angular's Component decorator and OnInit lifecycle interface.
import {CommonModule} from '@angular/common'; // Imports Angular's common functionality and directives used by the component.

// Imports HttpClient for sending API requests and HttpHeaders for attaching the authenticated user's ID.
import {HttpClient, HttpHeaders} from '@angular/common/http';


// Defines this class as an Angular component.
@Component({

    // Sets the custom HTML element name used to display the user management component.
    selector: 'app-user-management',

    // Imports the Angular modules required by the user management template.
    imports: [CommonModule],

    // Specifies the HTML template and CSS stylesheet used to display the Super Admin user management page.
    templateUrl: './user-management.html',
    styleUrl: './user-management.css'
})


// Defines the UserManagement component class and implements OnInit so the user list can be loaded when the component starts.
export class UserManagement implements OnInit {

    // Stores the registered user accounts returned by the backend.
    users: any[] = [];

    // Tracks whether the registered-user list is currently being loaded.
    loading = false;

    // Stores a user-friendly message if the backend request fails.
    errorMessage = '';


    // Injects HttpClient so the component can communicate with the backend API.
    constructor(
        private http: HttpClient,
        private cdr: ChangeDetectorRef
    ) {}


    // Creates the authenticated HTTP headers required by the protected Super Admin endpoints.
    headers(): HttpHeaders {

        // Adds the current user's stored ID so the backend can authenticate the request and verify the Super Admin role.
        return new HttpHeaders({
            'x-user-id': localStorage.getItem('userId') || ''
        });

    }


    // Runs automatically when Angular initialises the component.
    ngOnInit(): void {

        // Loads the registered users when the user management page first opens.
        this.load();

    }


    // Loads the current list of registered users from the protected Super Admin API.
    load(): void {

        this.loading = true; // Shows the loading state while the Super Admin user list is requested.
        this.errorMessage = ''; // Clears any error left over from a previous request.
    
        // Sends an authenticated GET request to retrieve the sanitised user records from MongoDB.
        this.http.get<any[]>(
            'http://localhost:3000/api/admin/users',
            {
                headers: this.headers()
            }
        ).subscribe({

            // Stores the users returned from MongoDB.
            next: users => {

                this.users = Array.isArray(users)
                    ? users
                    : [];

                this.loading = false;

                console.log(
                    'User Management users:',
                    this.users
                );

                this.cdr.detectChanges();
            },

            // Handles authentication, permission and server errors visibly.
            error: error => {

                console.error(
                    'Failed to load User Management:',
                    error
                );

                this.users = [];
                this.loading = false;

                this.errorMessage =
                    error.error?.message ||
                    'Unable to load users from the server.';

                this.cdr.detectChanges(); // Refreshes the template so the error state is immediately displayed.
            }

        });

    }


    // Permanently deletes a selected user account after the Super Admin confirms the action.
    deleteUser(user: any): void {

        // Displays a confirmation dialog because permanent deletion also prevents the email address from being registered again.
        if (!confirm(`Permanently delete ${user.email}?`)) {
            return;
        }

        // Sends an authenticated DELETE request containing the selected user's application-level UUID.
        this.http.delete(
            `http://localhost:3000/api/admin/users/${user.id}`,
            {
                headers: this.headers()
            }
        ).subscribe({

            // Reloads the user list after successful deletion so the removed account disappears from the page.
            next: () => this.load(),

            // Displays the backend error message, or a fallback message, if the account cannot be deleted.
            error: error => alert(
                error.error?.message || 'Delete failed.'
            )

        });

    }

}