import {Component, OnInit, ChangeDetectorRef} from '@angular/core'; // Imports Angular's Component decorator and OnInit lifecycle interface.
import {CommonModule} from '@angular/common'; // Imports Angular's common functionality and directives used by the component.
import {FormsModule} from '@angular/forms'; // Imports FormsModule so the template can use form controls and two-way data binding.

// Imports HttpClient for sending API requests and HttpHeaders for attaching the authenticated user's ID.
import {HttpClient, HttpHeaders} from '@angular/common/http';


// Defines this class as an Angular component.
@Component({

    // Sets the custom HTML element name used to display the audit logs component.
    selector: 'app-audit-logs',

    // Imports the Angular modules required by the audit logs template.
    imports: [CommonModule, FormsModule],

    // Specifies the HTML template and CSS stylesheet used to display the audit logs page.
    templateUrl: './audit-logs.html',
    styleUrl: './audit-logs.css'
})


// Defines the AuditLogs component class and implements OnInit so audit records can be loaded when the component starts.
export class AuditLogs implements OnInit {

    // Stores the audit log records returned by the backend.
    logs: any[] = [];

    // Stores the selected audit action type used to filter the audit log.
    type = '';

    // Stores the selected date used to filter the audit log.
    date = '';


    // Injects HttpClient so the component can communicate with the backend API.
    constructor(
        private http: HttpClient,
        private cdr: ChangeDetectorRef
    ) {}


    // Runs automatically when Angular initialises the component.
    ngOnInit(): void {

        // Loads the audit log records when the page first opens.
        this.load();

    }


    // Loads audit log records from the backend using the currently selected filters.
    load(): void {

        // Stores the query parameters that will be added to the API URL.
        const query: string[] = [];

        // Adds the selected audit action type to the query when a type filter has been entered.
        if (this.type) {
            query.push('type=' + encodeURIComponent(this.type));
        }

        // Adds the selected date to the query when a date filter has been entered.
        if (this.date) {
            query.push('date=' + encodeURIComponent(this.date));
        }

        // Creates the authenticated request header using the current user's ID stored by the application.
        const headers = new HttpHeaders({
            'x-user-id': localStorage.getItem('userId') || ''
        });

        // Builds the audit endpoint URL and only adds the query string when at least one filter is active.
        const url = 'http://localhost:3000/api/admin/audit' +
            (query.length ? '?' + query.join('&') : '');

        // Requests the matching audit records from the Super Admin API.
        this.http.get<any[]>(url, {headers}).subscribe({

            // Stores the returned audit records so Angular can display them in the template.
            next: logs => {

                // Protects the component if an unexpected response type is returned.
                this.logs = Array.isArray(logs)
                    ? logs
                    : [];

                console.log(
                    'Audit logs:',
                    this.logs
                );

                /*
                * Forces Angular to refresh the template after the asynchronous
                * HTTP request updates the audit log data.
                */
                this.cdr.detectChanges();
            },

            // Logs API failures so a failed request is not silently ignored.
            error: error => {

                console.error(
                    'Failed to load audit logs:',
                    error
                );

                // Prevents stale audit records from remaining visible after an error.
                this.logs = [];

                // Refreshes the template after the failed request.
                this.cdr.detectChanges();
            }

        });

    }

}