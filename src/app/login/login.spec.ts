import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';

describe('Login', () => {
  
  let component: Login; // Holds the instance of the Login component being tested.

  // Fixture provides access to the component instance, template, and Angular testing utilities.
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => { // Runs before each test to set up a fresh testing environment.
    // Configures the Angular testing module.
    await TestBed.configureTestingModule({
      imports: [Login], // Since Login is a standalone component, it is added to the imports array.
    }).compileComponents();

    // Creates an instance of the Login component and retrieves its instance from the fixture.
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;

    // Waits for any asynchronous initialization to complete before running tests.
    await fixture.whenStable();
  });

  // Verifies that the component is created successfully.
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});