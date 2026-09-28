import {Component, OnInit} from '@angular/core'; // Imports Angular's Component decorator and OnInit lifecycle interface.
import {CommonModule} from '@angular/common'; // Imports Angular's common functionality and directives used by the component.
import {FormsModule} from '@angular/forms'; // Imports FormsModule so the bootstrap form can use Angular form controls and two-way data binding.
import {HttpClient} from '@angular/common/http'; // Imports HttpClient so the component can communicate with the backend API.
import {Router} from '@angular/router'; // Imports Router so the component can navigate to the login page.


// Defines this class as an Angular component.
@Component({

    // Sets the custom HTML element name used to display the bootstrap component.
    selector: 'app-bootstrap',

    // Marks this as a standalone Angular component that does not need to be declared inside an NgModule.
    standalone: true,

    // Imports the Angular modules required by the bootstrap template.
    imports: [CommonModule, FormsModule],

    // Specifies the HTML template and CSS stylesheet used to display the one-time bootstrap page.
    templateUrl: './bootstrap.html',
    styleUrl: './bootstrap.css'
})


// Defines the Bootstrap component class and implements OnInit so the bootstrap status can be checked when the component starts.
export class Bootstrap implements OnInit {

    // Stores the default email address entered into the initial Super Admin setup form.
    email = 'admin@fabuloso.local';

    // Stores the default username entered into the initial Super Admin setup form.
    username = 'SuperAdmin';

    // Stores the default first name entered into the initial Super Admin setup form.
    firstName = 'Super';

    // Stores the default last name entered into the initial Super Admin setup form.
    lastName = 'Admin';

    // Stores the default date of birth entered into the initial Super Admin setup form.
    dob = '1990-01-01';

    // Stores the password entered into the bootstrap form before it is sent to the backend for bcrypt hashing.
    password = '123';

    // Tracks whether the bootstrap request is currently being processed.
    busy = false;


    // Injects HttpClient for backend API requests and Router for navigation between application pages.
    constructor(
        private http: HttpClient,
        private router: Router
    ) {}


    // Runs automatically when Angular initialises the component.
    ngOnInit(): void {

        // Requests the bootstrap status, which ultimately checks MongoDB to determine whether a Super Admin already exists.
        this.http.get<any>(
            'http://localhost:3000/api/auth/bootstrap-status'
        ).subscribe(response => {

            // Prevents the one-time setup page from remaining accessible after the initial Super Admin has been created.
            if (!response.bootstrapRequired) {
                this.router.navigate(['/login']);
            }

        });

    }


    // Sends the bootstrap form data to the backend to create the application's initial Super Admin account.
    create(): void {

        // Marks the form as busy while the bootstrap request is being processed.
        this.busy = true;

        // Sends the initial Super Admin details to the backend, where uniqueness is checked and the password is bcrypt hashed
        //                                            before MongoDB storage.
        this.http.post<any>(
            'http://localhost:3000/api/auth/bootstrap',
            {
                email: this.email,
                username: this.username,
                firstName: this.firstName,
                lastName: this.lastName,
                dob: this.dob,
                password: this.password
            }
        ).subscribe({

            // Notifies the user and sends them to the login page when the Super Admin account is created successfully.
            next: () => {
                alert('Super admin created. Please log in.');
                this.router.navigate(['/login']);
            },

            // Restores the form and displays the backend error message, or a fallback message, when bootstrap fails.
            error: error => {
                this.busy = false;
                alert(error.error?.message || 'Bootstrap failed.');
            }

        });

    }

}