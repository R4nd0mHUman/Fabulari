import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ChatRoom } from './chat-room';

@Component({ standalone: true, template: '' })
class DummyRouteComponent {}

describe('ChatRoom', () => {
  beforeEach(async () => {
    // Keep smoke tests isolated from a developer's real browser session.
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ChatRoom],
      providers: [
        // Components use HttpClient, but unit tests must never call the live API.
        provideHttpClient(),
        provideHttpClientTesting(),

        // RouterLink/ActivatedRoute require a router. These dummy destinations also make authentication
        //                    redirects safe during component initialisation.
        provideRouter([
          { path: 'login', component: DummyRouteComponent },
          { path: 'groups', component: DummyRouteComponent }
        ])
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ChatRoom);
    expect(fixture.componentInstance).toBeTruthy();
  });
});