import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateGroup } from './create-group';

describe('CreateGroup', () => {

    // Holds the instance of the CreateGroup component being tested.
    let component: CreateGroup;

    // Fixture provides access to the component instance, template, and Angular testing utilities.
    let fixture: ComponentFixture<CreateGroup>;


    // Runs before each test to set up a fresh testing environment.
    beforeEach(async () => {

        // Configures the Angular testing module.
        await TestBed.configureTestingModule({
            // Since CreateGroup is a standalone component, it is added to the imports array.
            imports: [CreateGroup],
        }).compileComponents();


        // Creates an instance of the CreateGroup component and retrieves its instance from the fixture.
        fixture = TestBed.createComponent(CreateGroup);
        component = fixture.componentInstance;


        // Waits for any asynchronous initialization to complete before running tests.
        await fixture.whenStable();
    });


    // Verifies that the component is created successfully.
    it('should create', () => {
        expect(component).toBeTruthy();
    });

});