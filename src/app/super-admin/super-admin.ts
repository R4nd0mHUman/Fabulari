import { Component, HostListener } from '@angular/core'; // Imports Angular's Component decorator for defining a component and HostListener.
import { CommonModule } from '@angular/common'; // Imports Angular's CommonModule to provide common directives like ngIf and ngFor
import { Router, RouterLink } from '@angular/router'; // Imports RouterLink so buttons can navigate between pages.

  // Defines this class as an Angular component.
  @Component({
    
    selector: 'app-super-admin', // The HTML tag used to display this component.
    imports: [CommonModule, RouterLink], // Imports CommonModule so common Angular directives can be used in the template and RouterLink for navigating.
    templateUrl: './super-admin.html', // Specifies the HTML template for this component.
    styleUrl: './super-admin.css', // Specifies the CSS stylesheet for this component.
    
  })

// Defines the SuperAdmin component class.
export class SuperAdmin {

    // Determines whether the current screen width is 768 pixels or less
    isMobile = window.innerWidth <= 768;


    // Stores the image path for the desktop version and mobile version of the interface
    desktopBase = 'assets/Images/JustChattingBaseWindowSuperAdmin.png';
    mobileBase = 'assets/Images/JustChattingBaseWindowSuperAdminMobile.png';


    // Sets the current background image based on whether the device is mobile or desktop.
    currentBase = this.isMobile ? this.mobileBase : this.desktopBase;
    // Mobile image if the screen is small, otherwise use the desktop image.

    // Stores the default profile picture and display username for the super admin
    profilePicture = 'assets/Images/defaultsuperadmintransparent.png';
    username = "";

    // Displays whatever username has been entered
    constructor(private router: Router){

        this.username =
        localStorage.getItem("username") || "Super Admin";

    }

    // Listens for browser window resize events
    @HostListener('window:resize')

    // Runs whenever the browser window is resized
    onResize(){
        // Stores the previous mobile/desktop state before resizing, updating whether the screen is considered mobile.
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;

        // Checks if the screen has changed between mobile and desktop modes
        if(wasMobile !== this.isMobile){

            // Updates the displayed background image based on the new screen size
            this.currentBase = this.isMobile ? this.mobileBase : this.desktopBase;
            // Mobile image if the screen is small, otherwise use the desktop image.

        }

    }

    // Logs the Super Admin out of the application.
    logout(): void {

        // Removes the stored user ID.
        localStorage.removeItem('userId');

        // Removes the stored username.
        localStorage.removeItem('username');

        // Removes the stored user role.
        localStorage.removeItem('role');

        // Returns the Super Admin to the login page.
        this.router.navigate(['/login']);

    }
}