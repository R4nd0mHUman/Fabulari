import {Component, OnInit, ChangeDetectorRef} from '@angular/core'; // Imports Angular's Component decorator and OnInit lifecycle interface.
import {CommonModule} from '@angular/common'; // Imports Angular's common functionality and directives used by the component.

// Imports HttpClient for sending API requests and HttpHeaders for attaching the authenticated user's ID.
import {HttpClient, HttpHeaders} from '@angular/common/http';

import {RouterLink} from '@angular/router'; // Imports RouterLink so the template can contain Angular navigation links.


// Defines this class as an Angular component.
@Component({

    // Sets the custom HTML element name used to display the banned users component.
    selector: 'app-banned-users',

    // Marks this as a standalone Angular component that does not need to be declared inside an NgModule.
    standalone: true,

    // Imports the Angular modules and features required by the banned users template.
    imports: [CommonModule, RouterLink],

    // Specifies the HTML template and CSS stylesheet used to display the banned users page.
    templateUrl: './banned-users.html',
    styleUrl: './banned-users.css'
})


// Defines the BannedUsers component class and implements OnInit so banned email records can be loaded when the component starts.
export class BannedUsers implements OnInit {

    // Stores the permanently banned email records returned by the backend.
    banned: any[] = [];

    // Tracks whether the banned users data is currently being loaded.
    loading = true;

    // Stores an error message when the banned users cannot be loaded.
    error = '';


    // Injects HttpClient so the component can communicate with the backend API.
    constructor(
        private http: HttpClient,
        private cdr: ChangeDetectorRef
    ) {}


    // Runs automatically when Angular initialises the component.
    ngOnInit(): void {

        // Creates the authenticated request header using the current user's ID stored by the application.
        const headers = new HttpHeaders({
            'x-user-id': localStorage.getItem('userId') || ''
        });

        // Requests the permanently banned email records from the Super Admin API.
        this.http.get<any[]>(
            'http://localhost:3000/api/admin/banned-emails',
            {headers}
        ).subscribe({

            // Stores the returned records and ends the loading state when the request succeeds.
            next: rows => {
                this.banned = rows;
                this.loading = false;
                this.cdr.detectChanges();
            },

            // Displays the backend error message, or a fallback message, and ends the loading state when the request fails.
            error: error => {
                this.error = error.error?.message || 'Unable to load banned users.';
                this.loading = false;
                this.cdr.detectChanges();
            }

        });

    }

}