import { Component, signal } from '@angular/core'; // Imports Angular tools for creating components and reactive values.
import { RouterOutlet } from '@angular/router'; // Imports the RouterOutlet directive for displaying routed components.

// Defines this class as an Angular component.
@Component({
  selector: 'app-root', // The HTML tag used to display this component.
  imports: [RouterOutlet], // Lists any standalone modules required by this component.

  // Specifies the HTML template and CSS stylesheet for this component.
  templateUrl: './app.html', 
  styleUrl: './app.css'
})

export class App { // Defines the App component class.
  protected readonly title = signal('Fabulari'); // Creates a protected reactive value containing the app title.
}