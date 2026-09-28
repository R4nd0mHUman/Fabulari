import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupSearch } from './group-search';

describe('GroupSearch', () => {

    // Holds the instance of the GroupSearch component being tested.
    let component: GroupSearch;

    // Fixture provides access to the component instance, template, and Angular testing utilities.
    let fixture: ComponentFixture<GroupSearch>;


    // Runs before each test to set up a fresh testing environment.
    beforeEach(async () => {

        // Configures the Angular testing module.
        await TestBed.configureTestingModule({
            // Since GroupSearch is a standalone component, it is added to the imports array.
            imports: [GroupSearch],
        }).compileComponents();


        // Creates an instance of the GroupSearch component and retrieves its instance from the fixture.
        fixture = TestBed.createComponent(GroupSearch);
        component = fixture.componentInstance;


        // Waits for any asynchronous initialization to complete before running tests.
        await fixture.whenStable();
    });


    // Verifies that the component is created successfully.
    it('should create', () => {
        expect(component).toBeTruthy();
    });

});