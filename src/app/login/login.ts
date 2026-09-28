// Imports Angular's Component decorator and HostListener for responding to browser events.
import {Component, HostListener, OnInit} from '@angular/core';

import {CommonModule} from '@angular/common'; // Imports Angular's common functionality and directives used by the component.
import {FormsModule} from '@angular/forms'; // Imports FormsModule so Angular can use form controls and two-way data binding.
import {Router} from '@angular/router'; // Imports Router so the component can navigate between application pages.
import {HttpClient} from '@angular/common/http'; // Imports HttpClient so the component can communicate with the Express backend.


// Defines this class as an Angular component.
@Component({

    // Sets the custom HTML element name used to display the login component.
    selector: 'app-login',

    // Imports the Angular modules and features required by the login template.
    imports: [CommonModule, FormsModule],

    // Specifies the HTML template and CSS stylesheet used to display the login page.
    templateUrl: './login.html',
    styleUrl: './login.css'
})


// Defines the Login component class.
export class Login implements OnInit {

    // Stores the username and password entered into the login form.
    username = '';
    password = '';


    // Tracks whether the browser window is currently using the mobile layout.
    isMobile = window.innerWidth <= 768;

    // Stores the desktop background image used by the login page.
    desktopBase = 'assets/Images/JustChattingBaseWindowLogin.png';

    // Stores the mobile background image used by the login page.
    mobileBase ='assets/Images/JustChattingBaseWindowLoginMobile.png';


    // Stores the computer image displayed on the login page.
    computerImage = 'assets/Images/Computer.png';

    // Stores the title image displayed on the login page.
    titleImage = 'assets/Images/JustChattingTitle.png';


    // Stores the default login button flower image + its hover.
    loginFlower = 'assets/Images/LoginFlower.png';
    loginFlowerHover = 'assets/Images/LoginFlowerHover.png';


    // Stores the default sign-up button flower image + its hover.
    signUpFlower = 'assets/Images/SignUpFlower.png';
    signUpFlowerHover = 'assets/Images/SignUpFlowerHover.png';


    // Stores the default guest button flower image + its hover.
    guestFlower = 'assets/Images/GuestLoginFlower.png';
    guestFlowerHover = 'assets/Images/GuestLoginFlowerHover.png';


    // Stores the currently selected desktop or mobile background image.
    currentBase = this.isMobile ? this.mobileBase : this.desktopBase;

    // Stores the currently displayed login + sign up + guest flower image.
    currentLoginFlower = this.loginFlower;
    currentSignUpFlower = this.signUpFlower;
    currentGuestFlower = this.guestFlower;


    // Injects the services required for navigation and HTTP requests.
    constructor(
        private router: Router,
        private http: HttpClient
    ) {}


    // Before showing login, ask the backend whether this is a brand-new data set.
    // A missing Super Admin means the marker must be offered the bootstrap screen.
    ngOnInit(): void {
        this.http.get<any>('http://localhost:3000/api/auth/bootstrap-status').subscribe({
            next: result => { if (result.bootstrapRequired) this.router.navigate(['/bootstrap']); },
            error: () => alert('Cannot reach the Fabuloso server on port 3000.')
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


    // Submits the login form and authenticates the user with the backend.
    login(): void {

        // Checks that both a username and password have been entered.
        if (!this.username || !this.password) {
            // Tells the user that both login fields are required.
            alert('Please enter username and password.');
            return;
        }


        // Sends the login credentials to the backend.
        this.http.post<any>(
            'http://localhost:3000/api/auth/login',

            // Sends the username and password entered by the user.
            {
                username: this.username,
                password: this.password
            }

        ).subscribe({

            // Runs when the login request is successfully completed.
            next: response => {

                // Removes guest mode when a user successfully logs in.
                localStorage.removeItem('guest');

                // Stores the logged-in user's ID in local storage.
                localStorage.setItem(
                    'userId',
                    response.id
                );

                // Stores the logged-in user's username in local storage.
                localStorage.setItem(
                    'username',
                    response.username
                );

                // Stores the logged-in user's role in local storage.
                localStorage.setItem(
                    'role',
                    response.role
                );

                // Sends super administrators to the super-admin dashboard.
                if (response.role === 'super-admin') {
                    this.router.navigate(['/super-admin']);
                } else {
                    // Sends regular users and group administrators to the user dashboard.
                    this.router.navigate(['/user']);
                }

            },

            // Runs if the login request fails.
            error: err => {

                // Displays the backend error message when available, otherwise shows a general login error.
                alert(
                    err.error?.message ||
                    'Invalid username or password.'
                );

            }

        });

    }


    // Navigates the user to the registration page.
    goToRegister(): void {
        // Changes the current route to the registration page.
        this.router.navigate(['/register']);
    }


    // Enters guest mode and navigates the user to the guest home page.
    continueAsGuest(): void {

        // Removes any previously stored logged-in user ID.
        localStorage.removeItem('userId');

        // Removes any previously stored username.
        localStorage.removeItem('username');

        // Removes any previously stored user role.
        localStorage.removeItem('role');

        // Stores the guest login state in local storage.
        localStorage.setItem('guest', 'true');

        // Sends the user to the guest home page.
        this.router.navigate(['/guest']);

    }


    // Changes the login flower image when the login button is hovered.
    loginHover(isHovering: boolean): void {
        // Displays the hover image while the button is being hovered and restores the default image otherwise.
        this.currentLoginFlower = isHovering ? this.loginFlowerHover : this.loginFlower;
    }


    // Changes the sign-up flower image when the sign-up button is hovered.
    signUpHover(isHovering: boolean): void {
        // Displays the hover image while the button is being hovered and restores the default image otherwise.
        this.currentSignUpFlower = isHovering ? this.signUpFlowerHover : this.signUpFlower;
    }


    // Changes the guest flower image when the guest button is hovered.
    guestHover(isHovering: boolean): void {
        // Displays the hover image while the button is being hovered and restores the default image otherwise.
        this.currentGuestFlower = isHovering ? this.guestFlowerHover : this.guestFlower;
    }

}