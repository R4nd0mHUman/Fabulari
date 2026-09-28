import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core'; // Imports Angular tools for configuring the application and handling errors.
import { provideRouter } from '@angular/router'; // Imports the function used to configure application routing.
import { provideHttpClient } from '@angular/common/http'; // Imports the function that makes Angular's HttpClient service available throughout the application.

import { routes } from './app.routes'; // Imports the application's route definitions.

// Defines the application configuration settings.
export const appConfig: ApplicationConfig = {

   // Lists the services and features available throughout the application.
  providers: [
    provideBrowserGlobalErrorListeners(), // Enables global error handling for the application.
    provideRouter(routes), // Enables routing using the defined application routes.
    provideHttpClient() // Enables HttpClient so components can communicate with the Express backend.
  ]
  
};