import { TestBed } from '@angular/core/testing'; // Imports Angular's testing tools for creating and testing components.
import { App } from './app'; // Imports the App component for testing.

// Defines the test suite for the App component.
describe('App', () => {

  // Runs setup code before each test.
  beforeEach(async () => { 
    await TestBed.configureTestingModule({ // Creates a testing environment for the component.
      imports: [App], // Imports the App component into the testing environment.
    }).compileComponents(); // Compiles the component and its template.
  });

  // Tests that the App component is created successfully.
  it('should create the app', () => { 
    const fixture = TestBed.createComponent(App); // Creates an instance of the App component.
    const app = fixture.componentInstance; // Gets the component instance from the test fixture.
    expect(app).toBeTruthy(); // Checks that the component exists.
  });

  // Tests that the app title is displayed correctly.
  it('should render title', async () => { 
    const fixture = TestBed.createComponent(App); // Creates an instance of the App component.
    await fixture.whenStable(); // Waits for all asynchronous tasks to finish.
    const compiled = fixture.nativeElement as HTMLElement; // Gets the component's HTML element.
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, Assignment'); // Checks that the title text is displayed.
  });
  
});