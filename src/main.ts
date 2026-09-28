import { bootstrapApplication } from '@angular/platform-browser'; // Imports the function used to start an Angular application in the browser.
import { appConfig } from './app/app.config'; // Imports the application's configuration settings.
import { App } from './app/app'; // Imports the main App component that acts as the root of the application.

// Starts the Angular application using the root App component and configuration.
bootstrapApplication(App, appConfig)

  // Handles and displays any errors that occur during application startup.
  .catch((err) => console.error(err));