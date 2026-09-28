import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatRoom } from './chat-room';

describe('ChatRoom', () => {

    // Holds the instance of the ChatRoom component being tested.
    let component: ChatRoom;

    // Fixture provides access to the component instance, template, and Angular testing utilities.
    let fixture: ComponentFixture<ChatRoom>;


    // Runs before each test to set up a fresh testing environment.
    beforeEach(async () => {

        // Configures the Angular testing module.
        await TestBed.configureTestingModule({
            // Since ChatRoom is a standalone component, it is added to the imports array.
            imports: [ChatRoom],
        }).compileComponents();


        // Creates an instance of the ChatRoom component and retrieves its instance from the fixture.
        fixture = TestBed.createComponent(ChatRoom);
        component = fixture.componentInstance;


        // Waits for any asynchronous initialization to complete before running tests.
        await fixture.whenStable();
    });


    // Verifies that the component is created successfully.
    it('should create', () => {
        expect(component).toBeTruthy();
    });

});
