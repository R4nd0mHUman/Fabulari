import { ComponentFixture, TestBed } from '@angular/core/testing'; // Imports Angular testing utilities for creating and testing components.
import { SuperAdmin } from './super-admin'; // Imports the SuperAdmin component that will be tested.

// Creates a test suite for the SuperAdmin component.
describe('SuperAdmin', () => {
  
  let component: SuperAdmin; // Stores the instance of the SuperAdmin component being tested.
  let fixture: ComponentFixture<SuperAdmin>; // Provides access to the component instance, template, and Angular testing features.

  // Runs before each test to create a fresh component instance.
  beforeEach(async () => {

    // Configures the Angular testing environment for the component.
    await TestBed.configureTestingModule({

      // Imports the standalone SuperAdmin component into the test module.
      imports: [SuperAdmin],

    // Compiles the component template and styles before testing.
    }).compileComponents();

    // Creates an instance of the SuperAdmin component. getting its actual instance from the fixture.
    fixture = TestBed.createComponent(SuperAdmin);
    component = fixture.componentInstance;

    // Waits for any asynchronous Angular tasks to finish.
    await fixture.whenStable();
  });

  // Checks that the component is created successfully.
  it('should create', () => {

    expect(component).toBeTruthy(); // Expects the component instance to exist.

  });
});