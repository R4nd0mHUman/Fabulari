import { TestBed } from '@angular/core/testing'; // Imports Angular's testing tools for creating and testing components.
import { provideRouter } from '@angular/router'; // Provides router functionality for the test environment.
import { App } from './app'; // Imports the App component for testing.

// Defines the test suite for the App component.
describe('App', () => {

  // Runs setup code before each test.
  beforeEach(async () => {
    await TestBed.configureTestingModule({ // Creates a testing environment for the component.
      imports: [App], // Imports the App component into the testing environment.
      providers: [provideRouter([])] // Provides an empty router configuration for the app shell.
    }).compileComponents(); // Compiles the component and its template.
  });

  // Tests that the Fabulari application shell is created successfully.
  it('creates the Fabulari application shell', () => {
    const fixture = TestBed.createComponent(App); // Creates an instance of the App component.

    expect(fixture.componentInstance).toBeTruthy(); // Checks that the component exists.
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy(); // Checks that the router outlet is rendered.
  });
});