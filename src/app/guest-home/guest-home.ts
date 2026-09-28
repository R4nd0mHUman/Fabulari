import {Component} from '@angular/core'; // Imports Angular's Component decorator.
import {CommonModule} from '@angular/common'; // Imports Angular's common functionality and directives used by the component.

// Imports Router for navigation between application pages and RouterLink for router links in the template.
import {Router, RouterLink} from '@angular/router';


// Defines this class as an Angular component.
@Component({

    // Sets the custom HTML element name used to display the guest home component.
    selector: 'app-guest-home',

    // Imports the Angular modules and features required by the guest home template.
    imports: [CommonModule, RouterLink],

    // Specifies the HTML template and CSS stylesheet used to display the guest home page.
    templateUrl: './guest-home.html',
    styleUrl: './guest-home.css'
})


// Defines the GuestHome component class.
export class GuestHome {

    // Injects Router so the component can navigate between application pages.
    constructor(
        private router: Router
    ) {}


    // Leaves guest mode and returns the user to the login page.
    leaveGuest(): void {

        // Removes the guest login state from local storage.
        localStorage.removeItem('guest');

        // Sends the user to the login page.
        this.router.navigate(['/login']);

    }

}