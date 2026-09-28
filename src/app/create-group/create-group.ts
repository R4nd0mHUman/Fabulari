import { Component } from '@angular/core'; // Imports Angular's Component decorator used to define the create group component.
import { CommonModule } from '@angular/common'; // Imports Angular's common functionality and directives used by the component.
import { FormsModule } from '@angular/forms'; // Imports FormsModule so Angular can use form controls and two-way data binding.
import { Router } from '@angular/router'; // Imports Router so the component can navigate between application pages.
import { HttpClient } from '@angular/common/http'; // Imports HttpClient so the component can communicate with the Express backend.


// Defines this class as an Angular component.
@Component({

    // Sets the custom HTML element name used to display the create group component.
    selector: 'app-create-group',

    // Imports the Angular modules and features required by the create group template.
    imports: [CommonModule, FormsModule],

    // Specifies the HTML template and CSS stylesheet used to display the create group page.
    templateUrl: './create-group.html',
    styleUrl: './create-group.css'
})


// Defines the CreateGroup component class.
export class CreateGroup {

    // Stores the name entered for the new group.
    name = '';

    // Stores the description entered for the new group.
    description = '';

    // Stores the age limit entered for the new group.
    ageLimit: number | null = 0;

    // Tracks whether a group creation request is currently being submitted.
    creating = false;


    // Injects the services required for HTTP requests and navigation.
    constructor(
        private http: HttpClient,
        private router: Router
    ) {}


    // Submits a request to create a new group.
    createGroup(): void {

        // Gets the ID of the currently logged-in user from local storage.
        const userId =
            localStorage.getItem('userId');


        // Checks whether a valid user ID was found before submitting the request.
        if (!userId) {

            // Tells the user that they must be logged in to request a group.
            alert('You must be logged in to request a group.');

            // Sends the user to the login page when they are not logged in.
            this.router.navigate(['/login']);
            return;
        }


        // Makes sure the group name contains actual text after removing unnecessary spaces.
        if (!this.name.trim()) {
            // Tells the user that a group name is required.
            alert('Please enter a group name.');
            return;
        }


        // Checks that the age limit is a valid whole number that is zero or greater.
        if (
            this.ageLimit === null ||
            !Number.isInteger(Number(this.ageLimit)) ||
            Number(this.ageLimit) < 0
        ) {

            // Tells the user that the entered age limit is invalid.
            alert('Please enter a valid age limit.');
            return;
        }


        // Locks the request submission while the backend request is being processed.
        this.creating = true;

        // Sends the group creation request to the Express backend.
        this.http.post<any>(
            'http://localhost:3000/api/groups/requests',

            // Sends the group information entered by the user.
            {
                // Sends the group name without unnecessary spaces.
                name: this.name.trim(),

                // Sends the group description without unnecessary spaces.
                description: this.description.trim(),

                // Converts the age limit into a number before sending it to the backend.
                ageLimit: Number(this.ageLimit)
            },

            // Sends the current user's ID in the request headers.
            {headers: {'x-user-id': userId}}

        // Handles the response returned by the group creation request.
        ).subscribe({

            // Runs when the group creation request is successfully submitted.
            next: (response) => {

                // Logs the backend response for debugging purposes.
                console.log(
                    'GROUP CREATION REQUEST:',
                    response
                );

                // Tells the user that their group creation request was submitted successfully.
                alert(
                    response.message ||
                    'Group creation request submitted for Super Admin approval.'
                );

                // Unlocks the request submission after the request has completed.
                this.creating = false;

                // Sends the user to the group requests page to view their submitted request.
                this.router.navigate(['/groups/requests']);

            },


            // Runs if the group creation request fails.
            error: (err) => {

                // Logs the error returned by the failed request for debugging purposes.
                console.error(
                    'FAILED TO SUBMIT GROUP REQUEST:',
                    err
                );

                // Displays the backend error message when available, otherwise shows a general error message.
                alert(
                    err.error?.message ||
                    'Unable to submit group creation request.'
                );

                // Unlocks the request submission after the failed request.
                this.creating = false;

            }

        });

    }


    // Navigates the user back to the dashboard.
    backToDashboard(): void {
        // Changes the current route to the user dashboard.
        this.router.navigate(['/user']);
    }

}