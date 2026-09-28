import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GuestHome } from './guest-home';

describe('GuestHome', () => {

    // Holds the instance of the GuestHome component being tested.
    let component: GuestHome;

    // Fixture provides access to the component instance, template, and Angular testing utilities.
    let fixture: ComponentFixture<GuestHome>;


    // Runs before each test to set up a fresh testing environment.
    beforeEach(async () => {

        // Configures the Angular testing module.
        await TestBed.configureTestingModule({
            // Since GuestHome is a standalone component, it is added to the imports array.
            imports: [GuestHome],
        }).compileComponents();


        // Creates an instance of the GuestHome component and retrieves its instance from the fixture.
        fixture = TestBed.createComponent(GuestHome);
        component = fixture.componentInstance;


        // Waits for any asynchronous initialization to complete before running tests.
        await fixture.whenStable();
    });


    // Verifies that the component is created successfully.
    it('should create', () => {
        expect(component).toBeTruthy();
    });

});