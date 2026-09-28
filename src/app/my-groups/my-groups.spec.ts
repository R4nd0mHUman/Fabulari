import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MyGroups } from './my-groups';

describe('MyGroups', () => {

    // Holds the instance of the MyGroups component being tested.
    let component: MyGroups;

    // Fixture provides access to the component instance, template, and Angular testing utilities.
    let fixture: ComponentFixture<MyGroups>;


    // Runs before each test to set up a fresh testing environment.
    beforeEach(async () => {

        // Configures the Angular testing module.
        await TestBed.configureTestingModule({
            // Since MyGroups is a standalone component, it is added to the imports array.
            imports: [MyGroups],

            // Provides HTTP functionality required by the component.
            providers: [
                provideHttpClient()
            ]
        }).compileComponents();


        // Creates an instance of the MyGroups component and retrieves its instance from the fixture.
        fixture = TestBed.createComponent(MyGroups);
        component = fixture.componentInstance;


        // Waits for any asynchronous initialization to complete before running tests.
        await fixture.whenStable();
    });


    // Verifies that the component is created successfully.
    it('should create', () => {
        expect(component).toBeTruthy();
    });

});