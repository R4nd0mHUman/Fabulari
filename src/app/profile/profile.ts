import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // Imports Angular's Component decorator, OnInit lifecycle interface, and ChangeDetectorRef service.
import { CommonModule } from '@angular/common'; // Imports Angular's common functionality and directives used by the component.
import { FormsModule } from '@angular/forms'; // Imports FormsModule so Angular can use two-way data binding with ngModel.
import { Router } from '@angular/router'; // Imports Router so the component can navigate between different application pages.
import { HttpClient } from '@angular/common/http'; // Imports HttpClient so the component can communicate with the Express backend.


// Defines this class as an Angular component.
@Component({

    // Sets the custom HTML element name used to display the profile component.
    selector: 'app-profile',

    // Imports the Angular modules and features required by the profile template.
    imports: [CommonModule, FormsModule],

    // Specifies the HTML template and CSS stylesheet used to display the profile page.
    templateUrl: './profile.html',
    styleUrl: './profile.css'
})


// Defines the Profile component class and implements Angular's OnInit lifecycle interface.
export class Profile implements OnInit {

    // Stores the unique ID of the currently logged-in user.
    userId = '';

    // Stores the user's profile information.
    username = '';
    firstName = '';
    lastName = '';
    email = '';
    age: number | null = null;

    // Stores the current password entered by the user when changing their password.
    currentPassword = '';

    // Stores the new password entered by the user.
    newPassword = '';

    // Stores the confirmation of the new password.
    confirmPassword = '';

    // Tracks whether a password change request is currently being processed.
    changingPassword = false;

    // Stores the URL of the user's currently saved profile picture (default usually, unless specified otherwise).
    profilePicture = 'assets/Images/defaultusertransparent.png';

    // Stores a newly selected profile picture file before it is uploaded.
    selectedProfilePicture: File | null = null;

    // Stores a temporary URL used to preview a newly selected profile picture.
    profilePicturePreview = '';

    // Controls whether the profile loading message is displayed.
    loading = true;

    // Tracks whether profile information is currently being saved to prevent multiple save requests.
    saving = false;


    // Injects the services required for HTTP requests, navigation, and manually updating the Angular view.
    constructor(
        private http: HttpClient,
        private router: Router,
        private changeDetectorRef: ChangeDetectorRef
    ) {}


    // Runs automatically when the profile component finishes loading.
    ngOnInit(): void {

        // Gets the ID of the currently logged-in user from local storage.
        this.userId = localStorage.getItem('userId') || '';

        // Checks whether a valid user ID was found before attempting to load the profile.
        if (!this.userId) {
            // Tells the user that they must be logged in to access the profile page before redirecting them to the login page.
            alert('You must be logged in to view your profile.');
            this.router.navigate(['/login']);
            return;
        }

        // Loads the logged-in user's profile information from the backend.
        this.loadProfile();

    }


    // Converts a profile picture path returned by the server into a URL that the browser can load.
    getProfilePictureUrl(profilePicture: string): string {

        // Uses the default profile picture when the user does not have a profile picture.
        if (!profilePicture) {
            return 'assets/Images/defaultusertransparent.png';
        }

        // Checks whether the profile picture is an uploaded image served by the Node.js backend.
        if ( profilePicture.startsWith('/uploads/')) {
            // Builds the complete backend image URL and adds a timestamp to prevent the browser from using an old cached image.
            return ('http://localhost:3000' + profilePicture + '?t=' + Date.now());
        }

        // Returns the original path when the image is already stored inside Angular's assets folder.
        return profilePicture;

    }


    // Retrieves the user's profile information from the Express backend.
    loadProfile(): void {

        // Sends a GET request to the backend using the logged-in user's ID.
        this.http.get<any>(`http://localhost:3000/api/profile/${this.userId}`)

        // Handles the response returned by the backend request.
        .subscribe({
            // Runs when the profile request succeeds.
            next: (response) => {

                // Logs the profile response for debugging purposes.
                console.log('PROFILE RESPONSE RECEIVED:', response);

                // Stores the user's profile information returned by the backend.
                this.username = response.username;
                this.firstName = response.firstName;
                this.lastName = response.lastName;
                this.email = response.email;
                this.age = response.age;


                // Converts the stored profile picture path into a URL that the browser can load.
                this.profilePicture = this.getProfilePictureUrl(response.profilePicture);

                // Logs the final profile picture URL for debugging purposes.
                console.log('PROFILE PICTURE URL:', this.profilePicture);

                // Marks the profile as finished loading so the loading message can disappear.
                this.loading = false;

                // Logs the current loading state for debugging purposes.
                console.log('LOADING STATE AFTER PROFILE:', this.loading);

                // Tells Angular to immediately update the view with the newly loaded profile information.
                this.changeDetectorRef.detectChanges();

            },


            // Runs if the profile request fails.
            error: (err) => {

                // Logs the error returned by the failed profile request.
                console.error('Failed to load profile:', err);

                // Tells the user that their profile could not be loaded.
                alert('Unable to load your profile.');

                // Stops displaying the loading state after the request fails and tells Angular to update the view after loading state changes.
                this.loading = false;
                this.changeDetectorRef.detectChanges();

            }

        });

    }


    // Handles the file selection event when the user chooses a new profile picture.
    selectProfilePicture(event: Event): void {

        // Gets the file input element that triggered the change event.
        const input = event.target as HTMLInputElement;

        // Makes sure the user actually selected at least one file, stopping the method if not.
        if (!input.files || input.files.length === 0) {
            return;
        }


        // Gets the first file selected by the user.
        const file = input.files[0];

        // Checks that the selected file is an image before allowing it to be used as a profile picture.
        if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type) || file.size > 2 * 1024 * 1024) {
            // Mirrors the backend allow-list so the user can recover before an upload is attempted.
            alert('Please select a PNG, JPEG or GIF image no larger than 2 MB.');
            input.value = '';
            return;
        }

        // Stores the selected image file so it can later be uploaded to the backend.
        this.selectedProfilePicture = file;

        // Creates a temporary browser URL so the selected image can be previewed immediately.
        this.profilePicturePreview = URL.createObjectURL(file);

    }


    // Saves the user's profile information and uploads a new profile picture if one was selected.
    saveProfile(): void {

        // Prevents another save request from starting while one is already in progress.
        if (this.saving) {
            return;
        }

        // Makes sure a valid user ID exists before attempting to save the profile.
        if (!this.userId) {
            // Tells the user that their account could not be identified.
            alert('Unable to identify your account.');
            return;
        }

        // Makes sure the username contains actual text after removing unnecessary spaces.
        if (!this.username.trim()) {
            // Tells the user that a username is required.
            alert('Username cannot be empty.');
            return;
        }

        // Checks that the entered age is either empty or within the allowed range of 1 to 150.
        if ( this.age !== null &&
            (this.age < 1 || this.age > 150)
        ) {
            // Tells the user that the entered age is outside the allowed range.
            alert('Please enter a valid age.');
            return;
        }

        // Locks the save button while the profile update is being processed.
        this.saving = true;

        // Creates an object containing only the editable profile information that will be sent to the backend.
        const profileData = {

            // Includes the user's updated username, first/last name, and age.
            username: this.username,
            firstName: this.firstName,
            lastName: this.lastName,
            age: this.age

        };


        // Sends the updated profile information to the backend before uploading a new picture.
        this.http.put<any>(`http://localhost:3000/api/profile/${this.userId}`, profileData)

        // Handles the response from the profile update request.
        .subscribe({

            // Runs when the normal profile information is successfully updated.
            next: (response) => {

                // Updates the username stored in local storage with the latest username.
                localStorage.setItem('username', response.username);

                // Checks whether the user selected a new profile picture that also needs to be uploaded.
                if (this.selectedProfilePicture) {

                    // Uploads the selected profile picture after the normal profile information has been saved.
                    this.uploadProfilePicture();

                }

                // Runs when there is no new profile picture to upload.
                else {
                    // Tells the user that the profile update was successful.
                    alert('Profile updated successfully.');

                    // Unlocks the save button because all saving operations are complete.
                    this.saving = false;
                }

            },


            // Runs if the normal profile information could not be updated.
            error: (err) => {

                // Logs the error returned by the failed profile update.
                console.error('Failed to update profile:', err);

                // Shows the backend error message when available, otherwise displays a general error message.
                alert(err.error?.message || 'Unable to update your profile.');

                // Unlocks the save button after the failed request.
                this.saving = false;

            }

        });

    }

    // Changes the user's password after verifying the current password and validating the new password.
    changePassword(): void {

        // Prevents multiple password change requests from being sent at once.
        if (this.changingPassword) {
            return;
        }

        // Makes sure the user ID is available.
        if (!this.userId) {
            alert('Unable to identify your account.');
            return;
        }

        // Makes sure the current password was entered.
        if (!this.currentPassword) {
            alert('Please enter your current password.');
            return;
        }

        // Makes sure the new password was entered.
        if (!this.newPassword) {
            alert('Please enter a new password.');
            return;
        }

        // Checks that the new password contains at least 8 characters.
        if (this.newPassword.length < 8) {
            alert('Password must be at least 8 characters.');
            return;
        }

        // Checks that the new password contains at least one uppercase letter.
        if (!/[A-Z]/.test(this.newPassword)) {
            alert(
                'Password must contain at least one uppercase letter.'
            );
            return;
        }

        // Makes sure the new password was entered again for confirmation.
        if (!this.confirmPassword) {
            alert('Please confirm your new password.');
            return;
        }

        // Checks that both new password fields match.
        if (this.newPassword !== this.confirmPassword) {
            alert('New passwords do not match.');
            return;
        }

        // Prevents the password save button from being pressed again
        // while the request is being processed.
        this.changingPassword = true;

        // Sends the current password and new password to the backend.
        this.http.put<any>(
            `http://localhost:3000/api/profile/${this.userId}/password`,
            {
                currentPassword: this.currentPassword,
                newPassword: this.newPassword
            }
        ).subscribe({

            // Runs when the backend successfully changes the password.
            next: (response) => {

                // Tells the user that the password was changed successfully.
                alert(
                    response.message ||
                    'Password changed successfully.'
                );

                // Clears the password fields after a successful change.
                this.currentPassword = '';
                this.newPassword = '';
                this.confirmPassword = '';

                // Allows the Save Password button to be used again.
                this.changingPassword = false;

                // Forces Angular to update the button and input fields.
                this.changeDetectorRef.detectChanges();

            },

            // Runs when the password change fails.
            error: (err) => {

                // Logs the error for debugging.
                console.error(
                    'Failed to change password:',
                    err
                );

                // Displays the backend's error message.
                alert(
                    err.error?.message ||
                    'Unable to change password.'
                );

                // Allows the user to try again.
                this.changingPassword = false;

                // Updates the Angular view.
                this.changeDetectorRef.detectChanges();

            }

        });

    }


    // Uploads the selected profile picture to the backend.
    uploadProfilePicture(): void {

        // Makes sure a profile picture file exists before attempting the upload.
        if (!this.selectedProfilePicture) {

            // Unlocks the save button because there is no file to upload.
            this.saving = false;

            // Tells Angular to immediately update the button's disabled state.
            this.changeDetectorRef.detectChanges();

            // Stops the method because there is no profile picture to upload.
            return;

        }

        // Creates a FormData object because image files need to be sent as multipart form data.
        const formData = new FormData();

        // Adds the selected profile picture to the FormData using the field name expected by the backend.
        formData.append(
            'profilePicture',
            this.selectedProfilePicture
        );

        // Sends the selected profile picture to the Node.js backend using the user's ID.
        this.http.put<any>(`http://localhost:3000/api/profile/${this.userId}/picture`, formData)

        // Handles the response returned by the profile picture upload request.
        .subscribe({

            // Runs when the profile picture is successfully uploaded.
            next: (response) => {

                // Logs the upload response for debugging purposes.
                console.log('PROFILE PICTURE UPLOAD RESPONSE:', response);

                // Converts the new profile picture path returned by the backend into a browser-accessible URL.
                this.profilePicture = this.getProfilePictureUrl(response.profilePicture);

                // Removes the temporary preview because the uploaded image is now the current profile picture.
                this.profilePicturePreview = '';

                // Clears the selected file because it has already been uploaded.
                this.selectedProfilePicture = null;

                // Unlocks the Save Changes button before displaying the success message.
                this.saving = false;

                // Tells Angular to immediately update the screen with the new profile picture and button state.
                this.changeDetectorRef.detectChanges();

                // Tells the user that the profile and profile picture were successfully updated.
                alert('Profile updated successfully.');
            },


            // Runs if the profile picture upload fails.
            error: (err) => {

                // Logs the upload error for debugging purposes.
                console.error('Failed to upload profile picture:', err);

                // Removes the temporary image preview after the failed upload.
                this.profilePicturePreview = '';

                // Clears the selected file so it is no longer waiting to be uploaded.
                this.selectedProfilePicture = null;

                // Unlocks the save button after the failed upload.
                this.saving = false;

                // Tells Angular to immediately update the screen after the upload fails.
                this.changeDetectorRef.detectChanges();

                // Shows the backend error message when available, otherwise displays a general error message.
                alert(err.error?.message || 'Unable to change profile picture.');
            }

        });

    }



    // Deletes the current standard account. The server refuses deletion when the
    // user is the last administrator of a group, preserving the assignment invariant.
    deleteAccount(): void {
        if (!confirm('Permanently delete this account? This cannot be undone.')) return;
        this.http.delete<any>('http://localhost:3000/api/auth/me', {headers: {'x-user-id': this.userId}}).subscribe({
            next: () => { localStorage.clear(); this.router.navigate(['/login']); },
            error: err => alert(err.error?.message || 'Unable to delete account.')
        });
    }

    // Navigates the user back to the dashboard.
    backToDashboard(): void {
        // Changes the current route to the user dashboard.
        this.router.navigate(['/user']);
    }

}