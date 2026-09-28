import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupAdmin } from './group-admin';

describe('GroupAdmin', () => {

    // Holds the instance of the GroupAdmin component being tested.
    let component: GroupAdmin;

    // Fixture provides access to the component instance, template, and Angular testing utilities.
    let fixture: ComponentFixture<GroupAdmin>;


    // Runs before each test to set up a fresh testing environment.
    beforeEach(async () => {

        // Configures the Angular testing module.
        await TestBed.configureTestingModule({
            // Since GroupAdmin is a standalone component, it is added to the imports array.
            imports: [GroupAdmin],
        }).compileComponents();


        // Creates an instance of the GroupAdmin component and retrieves its instance from the fixture.
        fixture = TestBed.createComponent(GroupAdmin);
        component = fixture.componentInstance;


        // Waits for any asynchronous initialization to complete before running tests.
        await fixture.whenStable();
    });


    // Verifies that the component is created successfully.
    it('should create', () => {
        expect(component).toBeTruthy();
    });

});