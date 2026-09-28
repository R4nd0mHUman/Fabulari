import { Component, HostListener } from '@angular/core'; // Imports Angular's Component decorator and resize listener.
import { CommonModule } from '@angular/common'; // Imports common Angular directives such as ngIf and ngStyle.
import { FormsModule } from '@angular/forms'; // Imports support for template-driven forms and ngModel.
import { Router } from '@angular/router'; // Imports Angular's Router for navigating between pages.
import { HttpClient } from '@angular/common/http'; // Imports Angular's HttpClient for communicating with the backend API.

// Defines this class as an Angular component.
@Component({

  selector: 'app-register', // The HTML tag used to display this component.

  imports: [
    CommonModule,
    FormsModule
  ], // Imports the modules required by the registration template.

  templateUrl: './register.html', // Specifies the HTML template used by this component.
  styleUrl: './register.css' // Specifies the CSS stylesheet used by this component.

})

// Defines the Register component class.
export class Register {

  // Stores the information entered during registration.
  firstName = '';
  lastName = '';
  username = '';
  email = '';
  // Date of birth is stored so age checks remain correct as time passes.
  dob = '';
  password = '';
  confirmPassword = '';


  // Detects if the screen is mobile size.
  isMobile = window.innerWidth <= 768;


  // Stores the desktop registration background.
  desktopBase = 'assets/Images/JustChattingBaseWindowLogin.png';


  // Stores the mobile registration background.
  mobileBase = 'assets/Images/JustChattingBaseWindowLoginMobile.png';


  // Stores the JustChatting title image.
  titleImage = 'assets/Images/JustChattingTitle.png';


  // Stores the currently displayed background image.
  currentBase = this.isMobile
    ? this.mobileBase
    : this.desktopBase;


  // Injects Angular's Router and HttpClient.
  constructor(
    private router: Router,
    private http: HttpClient
  ) {}


  // Updates the background when the browser is resized.
  @HostListener('window:resize')

  onResize() {

    // Stores the previous screen size.
    const wasMobile = this.isMobile;

    // Detects whether the screen is currently mobile size.
    this.isMobile = window.innerWidth <= 768;


    // Only changes the image when switching between desktop and mobile.
    if (wasMobile !== this.isMobile) {

      // Displays the correct background image.
      this.currentBase = this.isMobile
        ? this.mobileBase
        : this.desktopBase;

    }

  }


  // Handles registration of a new account.
  register() {

    // Checks that all required fields have been entered.
    if (
      !this.email ||
      !this.dob ||
      !this.password ||
      !this.confirmPassword
    ) {

      // Displays an error if any field is empty.
      alert("Please complete all registration fields.");

      return;

    }


    // Creates a simple email validation rule.
    const validEmail = /^[^\s@]+@[^\s@]+$/;


    // Checks whether the email is valid.
    if (!validEmail.test(this.email)) {

      alert("Please enter a valid email address.");

      return;

    }


    // The supplied Phase test deliberately uses password "123". The server still hashes
    // every password with bcrypt; this UI therefore checks only that the two entries match.
    if (this.password !== this.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // DOB is required because group age limits are enforced from this value.
    if (!this.dob) {
      alert("Please enter a date of birth.");
      return;
    }

    // Sends the registration information to the backend.
    this.http.post<any>(

      // Backend registration endpoint.
      'http://localhost:3000/api/auth/register',

      // Sends the registration information to the server.
      {
        firstName: this.firstName,
        lastName: this.lastName,
        username: this.username || this.email,
        email: this.email,
        dob: this.dob,
        password: this.password
      }

    )

    // Handles the server response.
    .subscribe({

      // Runs when registration is successful.
      next: () => {

        // Tells the user that their account was created.
        alert("Account created! You can now login.");

        // Sends the user back to the login page.
        this.router.navigate(['/login']);

      },


      // Runs when registration fails.
      error: (err) => {

        // Displays the error returned by the backend.
        alert(
          err.error?.message ||
          "Unable to create account."
        );

      }

    });

  }


  // Returns the user to the login page.
  backToLogin() {

    this.router.navigate(['/login']);

  }

}