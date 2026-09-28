import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { GroupRequests } from './group-requests';

describe('GroupRequests', () => {

    // Holds the instance of the GroupRequests component being tested.
    let component: GroupRequests;

    // Fixture provides access to the component instance, template, and Angular testing utilities.
    let fixture: ComponentFixture<GroupRequests>;


    // Runs before each test to set up a fresh testing environment.
    beforeEach(async () => {

        // Configures the Angular testing module.
        await TestBed.configureTestingModule({
            // Since GroupRequests is a standalone component, it is added to the imports array.
            imports: [GroupRequests],

            // Provides HTTP and routing functionality required by the component.
            providers: [
                provideHttpClient(),
                provideRouter([])
            ]
        }).compileComponents();


        // Creates an instance of the GroupRequests component and retrieves its instance from the fixture.
        fixture = TestBed.createComponent(GroupRequests);
        component = fixture.componentInstance;


        // Runs change detection to initialize the component and update its template.
        fixture.detectChanges();
    });


    // Verifies that the component is created successfully.
    it('should create', () => {
        expect(component).toBeTruthy();
    });

});