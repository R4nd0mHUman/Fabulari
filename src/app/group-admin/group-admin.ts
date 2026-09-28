// Imports Angular's ChangeDetectorRef service, Component decorator, and OnInit lifecycle interface.
import {ChangeDetectorRef, Component, OnInit} from '@angular/core';

import {CommonModule} from '@angular/common'; // Imports Angular's common functionality and directives used by the component.
import {FormsModule} from '@angular/forms'; // Imports FormsModule so Angular can use form controls and two-way data binding.

// Imports ActivatedRoute to read route parameters, Router to navigate between application pages, and RouterLink for router links in the template.
import {ActivatedRoute, Router} from '@angular/router';

import {HttpClient} from '@angular/common/http'; // Imports HttpClient so the component can communicate with the Express backend.


// Defines this class as an Angular component.
@Component({

    // Sets the custom HTML element name used to display the group admin component.
    selector: 'app-group-admin',

    // Imports the Angular modules and features required by the group admin template.
    imports: [CommonModule, FormsModule],

    // Specifies the HTML template and CSS stylesheet used to display the group admin page.
    templateUrl: './group-admin.html',
    styleUrl: './group-admin.css'
})


// Defines the GroupAdmin component class and implements Angular's OnInit lifecycle interface.
export class GroupAdmin implements OnInit {

    // Stores the ID of the group currently being managed.
    groupId = '';

    // Stores the group information loaded from the backend.
    group: any = null;

    // Stores the members and channels belonging to the group.
    members: any[] = [];
    channels: any[] = [];

    // Controls whether the group loading message is displayed.
    loading = true;

    // Tracks whether group changes are currently being saved.
    saving = false;

    // Tracks whether a new channel is currently being created.
    creatingChannel = false;

    // Stores the editable group name and description.
    name = '';
    description = '';

    // Stores the editable group age limit.
    ageLimit = 0;

    // Stores the selected group theme mode.
    themeMode = 'default';

    // Stores the selected group theme colour.
    themeColour = '';

    // Stores the name and description entered for a new channel.
    channelName = '';
    channelDescription = '';

    
    // Stores the ID of the channel currently being renamed.
    // An empty string means that no channel is currently being edited.
    renamingChannelId = '';

    // Stores the temporary channel name entered while renaming a channel.
    renameChannelName = '';


    // Injects the services required for route data, navigation, HTTP requests, and manually updating the Angular view.
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private http: HttpClient,
        private cdr: ChangeDetectorRef
    ) {}


    // Runs automatically when the group admin component finishes loading.
    ngOnInit(): void {

        // Gets the group ID from the current route.
        this.groupId =
            this.route.snapshot.paramMap.get('groupId') || '';

        // Checks that a logged-in user and valid group ID are available.
        if (
            !localStorage.getItem('userId') ||
            !this.groupId
        ) {

            // Sends the user to the login page when the required information is missing.
            this.router.navigate(['/login']);

            return;
        }

        // Loads the selected group's information.
        this.loadGroup();

    }


    // Creates the request headers required by the backend.
    private headers() {
        // Returns the currently logged-in user's ID in the request headers.
        return {'x-user-id': localStorage.getItem('userId') || ''};

    }


    // Retrieves the selected group's information from the backend.
    loadGroup(): void {

        // Displays the loading state while the group information is being retrieved.
        this.loading = true;

        // Sends a GET request to retrieve the selected group.
        this.http.get<any>(
            `http://localhost:3000/api/groups/${this.groupId}`,
            {headers: this.headers()}
        ).subscribe({

            // Runs when the group information is successfully retrieved.
            next: group => {

                // Gets the ID of the currently logged-in user.
                const userId = localStorage.getItem('userId');

                // Checks whether the current user is an administrator of this group.
                if (!group.admins?.includes(userId)) {

                    // Tells the user that they do not have permission to manage this group.
                    alert('You are not a Group Admin for this group.');

                    // Returns the user to their groups page.
                    this.router.navigate(['/groups']);

                    return;
                }

                // Stores the group returned by the backend.
                this.group = group;

                // Loads the group name, description, and age limit into the editable form field.
                this.name = group.name || '';
                this.description = group.description || '';
                this.ageLimit = group.ageLimit || 0;

                // Loads the group's theme mode into the editable form field.
                this.themeMode = group.theme?.mode || 'default';

                // Loads the group's theme colour into the editable form field.
                this.themeColour = group.theme?.colour || '';

                // Loads the group's members and channels.
                this.loadMembers();
                this.loadChannels();

                // Stops displaying the loading state after the group has loaded.
                this.loading = false;

                // Forces Angular to refresh the page after the group data and form values have been loaded from the server.
                this.cdr.detectChanges();

            },

            // Runs if the group information cannot be loaded.
            error: err => {

                // Stops displaying the loading state after the request fails.
                this.loading = false;

                // Forces Angular to update the loading message before navigating away.
                this.cdr.detectChanges();

                // Displays the backend error message when available, otherwise shows a general error message.
                alert(
                    err.error?.message ||
                    'Unable to load group.'
                );

                // Returns the user to the groups page after the request fails.
                this.router.navigate(['/groups']);

            }

        });

    }


    // Retrieves the members belonging to the current group.
    loadMembers(): void {

        // Sends a GET request to retrieve the group's members.
        this.http.get<any[]>(
            `http://localhost:3000/api/groups/${this.groupId}/members`,
            {headers: this.headers()}
        ).subscribe({

            // Runs when the member list is successfully retrieved.
            next: members => {

                // Sorts the members alphabetically by username.
                this.members =
                    (members || []).sort(
                        (a, b) =>
                            String(a.username).localeCompare(
                                String(b.username)
                            )
                    );

                // Forces Angular to refresh the member list.
                this.cdr.detectChanges();

            },

            // Runs if the member list cannot be loaded.
            error: err => {

                // Logs the member loading error for debugging purposes.
                console.error(
                    'Failed to load members:',
                    err
                );

                // Refreshes the view even if loading members fails.
                this.cdr.detectChanges();

            }

        });

    }


    // Retrieves the channels belonging to the current group.
    loadChannels(): void {

        // Sends a GET request to retrieve the group's channels.
        this.http.get<any[]>(
            `http://localhost:3000/api/groups/${this.groupId}/rooms`,
            {headers: this.headers()}
        ).subscribe({

            // Runs when the channel list is successfully retrieved.
            next: channels => {

                // Stores the channels returned by the server.
                this.channels = channels || [];

                // Forces Angular to refresh the channel list.
                this.cdr.detectChanges();

            },

            // Runs if the channel list cannot be loaded.
            error: err => {

                // Logs the channel loading error for debugging purposes.
                console.error(
                    'Failed to load channels:',
                    err
                );

                // Refreshes the view even if loading channels fails.
                this.cdr.detectChanges();

            }

        });

    }


    // Saves the edited group information to the backend.
    saveGroup(): void {

        // Removes unnecessary spaces from the group name.
        const cleanName =
            this.name.trim();

        // Removes unnecessary spaces from the group description.
        const cleanDescription =
            this.description.trim();

        // Checks that the group name exists and does not exceed 30 characters.
        if (
            !cleanName ||
            cleanName.length > 30
        ) {
            // Tells the user that the group name is invalid.
            alert('Group name is required and must be 30 characters or fewer.');
            return;
        }

        // Checks that the group description does not exceed 250 characters.
        if (cleanDescription.length > 250) {
            // Tells the user that the group description is too long.
            alert('Group description must be 250 characters or fewer.');
            return;
        }

        // Checks that the age limit is a valid whole number that is zero or greater.
        if (
            !Number.isInteger(Number(this.ageLimit)) ||
            Number(this.ageLimit) < 0
        ) {
            // Tells the user that the age limit is invalid.
            alert('Age limit must be a whole number of 0 or greater.');
            return;
        }

        // Locks the save button while the group update is being processed.
        this.saving = true;

        // Forces Angular to refresh the button so it can display its saving state.
        this.cdr.detectChanges();

        // Sends the updated group information to the backend.
        this.http.put<any>(
            `http://localhost:3000/api/groups/${this.groupId}`,

            // Sends the updated group details and theme information.
            {
                name: cleanName,
                description: cleanDescription,
                ageLimit: Number(this.ageLimit),

                theme: {
                    mode: this.themeMode,
                    colour: this.themeColour
                }
            },

            // Sends the current user's ID in the request headers.
            {headers: this.headers()}

        ).subscribe({

            // Runs when the group is successfully updated.
            next: response => {

                // Updates the local group with the response returned by the server.
                this.group = response.group;

                // Tells the user that the group was successfully updated.
                alert('Group updated.');

                // Allows the Save Group button to become active again.
                this.saving = false;

                // Forces Angular to refresh the updated group state.
                this.cdr.detectChanges();

            },

            // Runs if the group update fails.
            error: err => {

                // Displays the backend error message when available, otherwise shows a general error message.
                alert(
                    err.error?.message ||
                    'Unable to update group.'
                );

                // Allows the Save Group button to become active again.
                this.saving = false;

                // Forces Angular to update the button.
                this.cdr.detectChanges();

            }

        });

    }


    // Creates a new channel for the current group.
    createChannel(): void {

        // Makes sure the channel name contains actual text after removing unnecessary spaces.
        if (!this.channelName.trim()) {

            // Tells the user that a channel name is required.
            alert('Please enter a channel name.');

            return;
        }

        // Locks the Create Channel button while the request is being processed.
        this.creatingChannel = true;

        // Forces Angular to refresh the button so it can display its creating state.
        this.cdr.detectChanges();

        // Sends the new channel information to the backend.
        this.http.post<any>(
            'http://localhost:3000/api/groups/channels',

            // Sends the group ID and new channel information.
            {
                groupId: this.groupId,
                name: this.channelName.trim(),
                description: this.channelDescription.trim()
            },

            // Sends the current user's ID in the request headers.
            {headers: this.headers()}

        ).subscribe({

            // Runs when the channel is successfully created.
            next: () => {

                // Clears the channel creation form after the backend confirms creation.
                this.channelName = '';
                this.channelDescription = '';

                // Allows the Create Channel button to become active again.
                this.creatingChannel = false;

                /*
                * Reloads the channel list from MongoDB rather than relying on the
                * POST response to represent the complete current channel state.
                */
                this.loadChannels();

                // Forces Angular to refresh the creation form immediately.
                this.cdr.detectChanges();

            },

            // Runs if the channel cannot be created.
            error: err => {

                // Displays the backend error message when available, otherwise shows a general error message.
                alert(
                    err.error?.message ||
                    'Unable to create channel.'
                );

                // Allows the Create Channel button to become active again.
                this.creatingChannel = false;

                // Forces Angular to update the button.
                this.cdr.detectChanges();

            }

        });

    }


    // Opens the inline rename controls for the selected channel.
    startRenameChannel(channel: any): void {

        // Stores the selected channel ID so Angular knows which
        // channel should display its rename controls.
        this.renamingChannelId = channel.id;

        // Pre-fills the rename field with the channel's current name.
        this.renameChannelName = channel.name || '';

        // Forces Angular to display the rename controls immediately.
        this.cdr.detectChanges();

    }


    // Cancels renaming without changing the channel.
    cancelRenameChannel(): void {

        // Clears the selected channel ID so the rename controls disappear.
        this.renamingChannelId = '';

        // Clears the temporary channel name.
        this.renameChannelName = '';

        // Forces Angular to refresh the channel controls.
        this.cdr.detectChanges();

    }

    // Renames an existing channel using the inline rename form.
    renameChannel(channel: any): void {

        // Removes unnecessary spaces from the proposed channel name.
        const cleanName =
            this.renameChannelName.trim();

        // Prevents an empty channel name from being submitted.
        if (!cleanName) {

            // Tells the Group Admin that a channel name is required.
            alert('Please enter a channel name.');

            return;
        }

        // Sends the updated channel information to the backend.
        this.http.put<any>(
            `http://localhost:3000/api/groups/channels/${channel.id}`,

            // Sends the new channel name while preserving its existing description.
            {
                name: cleanName,
                description: channel.description || ''
            },

            // Sends the current user's ID in the request headers.
            {headers: this.headers()}

        ).subscribe({

            // Runs when the channel is successfully renamed.
            next: () => {

                // Closes and clears the inline rename controls.
                this.renamingChannelId = '';
                this.renameChannelName = '';

                // Reloads the authoritative channel list after the rename succeeds.
                this.loadChannels();

                // Forces Angular to refresh the rename controls immediately.
                this.cdr.detectChanges();

            },

            // Runs if the channel cannot be renamed.
            error: err => {

                // Displays the backend error message when available,
                // otherwise shows a general error message.
                alert(
                    err.error?.message ||
                    'Unable to rename channel.'
                );

                // Forces Angular to refresh the channel controls.
                this.cdr.detectChanges();

            }

        });

    }


    // Deletes an existing channel.
    deleteChannel(channel: any): void {

        // Asks the group administrator to confirm that the channel should be deleted.
        if (
            !window.confirm(
                `Delete #${channel.name}?`
            )
        ) {
            return;
        }

        // Sends a DELETE request to remove the selected channel.
        this.http.delete<any>(
            `http://localhost:3000/api/groups/channels/${channel.id}`,
            {headers: this.headers()}
        ).subscribe({

            // Runs when the channel is successfully deleted.
            next: () => {

                // Reloads the authoritative channel list after deletion.
                this.loadChannels();    

                // Forces Angular to remove the deleted channel from the page.
                this.cdr.detectChanges();

            },

            // Runs if the channel cannot be deleted.
            error: err => {

                // Displays the backend error message when available, otherwise shows a general error message.
                alert(
                    err.error?.message ||
                    'Unable to delete channel.'
                );

                // Forces Angular to refresh the channel list.
                this.cdr.detectChanges();

            }

        });

    }


    // Removes a member from the current group.
    removeMember(member: any): void {

        // Asks the group administrator to confirm that the member should be removed.
        if (!confirm(`Remove ${member.username} from this group?`)) {
            return;
        }

        // Sends a DELETE request to remove the selected member from the group.
        this.http.delete<any>(
            `http://localhost:3000/api/groups/${this.groupId}/members/${member.id}`,
            {headers: this.headers()}
        ).subscribe({

            // Runs when the member is successfully removed.
            next: response => {

                // Tells the administrator that the member was removed successfully.
                alert(response.message);

                // Reloads the members so the removed member disappears from the list.
                this.loadMembers();

                // Reloads the group so the group information stays current.
                this.loadGroup();

                // Forces Angular to check the view immediately.
                this.cdr.detectChanges();

            },

            // Runs if the member cannot be removed.
            error: err => {

                // Displays the backend error message when available, otherwise shows a general error message.
                alert(
                    err.error?.message ||
                    'Unable to remove member.'
                );

                // Forces Angular to refresh the member list.
                this.cdr.detectChanges();

            }

        });

    }



    // Promotes an existing member to Group Admin. The role is scoped to this group,
    // so the same person can be an admin here and a normal member elsewhere.
    promoteMember(member: any): void {
        this.http.post<any>(`http://localhost:3000/api/groups/${this.groupId}/admins/${member.id}/promote`, {}, {headers:this.headers()})
            .subscribe({next:()=>this.loadMembers(), error:err=>alert(err.error?.message || 'Unable to promote member.')});
    }

    // Demotes a Group Admin while keeping them as a group member. The backend blocks
    // this operation when it would leave the group with zero administrators.
    demoteMember(member: any): void {
        this.http.post<any>(`http://localhost:3000/api/groups/${this.groupId}/admins/${member.id}/demote`, {}, {headers:this.headers()})
            .subscribe({next:()=>{this.loadMembers(); if(member.id===localStorage.getItem('userId')) this.router.navigate(['/groups']);}, error:err=>alert(err.error?.message || 'Unable to demote administrator.')});
    }

    // Navigates the group administrator to the group requests page.
    openRequests(): void {

        // Changes the current route to the group requests page.
        this.router.navigate([
            '/groups/requests'
        ]);

    }


    // Navigates the user back to their groups page.
    back(): void {

        // Changes the current route to the user's groups page.
        this.router.navigate([
            '/groups'
        ]);

    }

}