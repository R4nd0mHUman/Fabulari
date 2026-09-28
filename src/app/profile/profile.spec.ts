import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Profile } from './profile';

describe('Profile', () => {

    // Holds the instance of the Profile component being tested.
    let component: Profile;

    // Fixture provides access to the component instance, template, and Angular testing utilities.
    let fixture: ComponentFixture<Profile>;


    // Runs before each test to set up a fresh testing environment.
    beforeEach(async () => {

        // Configures the Angular testing module.
        await TestBed.configureTestingModule({
            // Since Profile is a standalone component, it is added to the imports array.
            imports: [Profile],
        }).compileComponents();


        // Creates an instance of the Profile component and retrieves its instance from the fixture.
        fixture = TestBed.createComponent(Profile);
        component = fixture.componentInstance;


        // Waits for any asynchronous initialization to complete before running tests.
        await fixture.whenStable();
    });


    // Verifies that the component is created successfully.
    it('should create', () => {
        expect(component).toBeTruthy();
    });

});