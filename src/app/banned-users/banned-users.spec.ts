import { ComponentFixture, TestBed } from '@angular/core/testing'; // Imports Angular testing utilities for creating and testing components.
import { BannedUsers } from './banned-users'; // Imports the BannedUsers component that will be tested.

// Creates a test suite for the BannedUsers component.
describe('BannedUsers', () => {

  let component: BannedUsers; // Stores the instance of the BannedUsers component being tested.
  let fixture: ComponentFixture<BannedUsers>; // Provides access to the component instance, template, and Angular testing features.

  // Runs before each test to create a fresh component instance.
  beforeEach(async () => {

    // Configures the Angular testing environment for the component.
    await TestBed.configureTestingModule({

      // Imports the standalone BannedUsers component into the test module.
      imports: [BannedUsers],

    // Compiles the component template and styles before testing.
    }).compileComponents();

    // Creates an instance of the BannedUsers component, getting its actual instance from the fixture.
    fixture = TestBed.createComponent(BannedUsers);
    component = fixture.componentInstance;

    // Waits for any asynchronous Angular tasks to finish.
    await fixture.whenStable();
  });

  // Checks that the component is created successfully.
  it('should create', () => {

    expect(component).toBeTruthy(); // Expects the component instance to exist.

  });
});