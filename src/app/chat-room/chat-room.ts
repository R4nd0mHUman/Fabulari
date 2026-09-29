/**
 * CHAT ROOM COMPONENT
 * ===================
 *
 * This Angular component controls the user interface for an individual chat channel in Fabuloso.
 *
 * There are two main forms of communication used by this component:
 *
 * 1. HTTP / REST
 *    Used for information that does not need to update continuously, such as the group information and list of channels.
 *
 * 2. Socket.io
 *    Used for real-time chat communication.
 *
 *    Unlike an ordinary HTTP request, a Socket.io connection remains open.
 *    This allows the Node.js server to immediately PUSH events to every connected browser.
 *
 *    For example:
 *
 *        User1 sends message
 *              |
 *              v
 *        Angular Socket.io client
 *              |
 *              v
 *        Node.js + Socket.io server
 *              |
 *              +------> MongoDB stores message
 *              |
 *              +------> User1 browser
 *              |
 *              +------> User2 browser
 *
 *    Therefore User2 does NOT need to refresh their browser to see User1's new message.
 */

import {ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { validChatImageFile } from './chat-image-validation';

import {HttpClient, HttpHeaders} from '@angular/common/http';

import {ActivatedRoute, Router} from '@angular/router';

import {io, Socket} from 'socket.io-client';


@Component({
  // This is the HTML tag Angular would use if this component were inserted directly into another Angular template.
  selector: 'app-chat-room',

  // "standalone: true" means this component does not need to be declared inside an Angular NgModule.
  standalone: true,

  // CommonModule provides Angular directives such as:
  // *ngIf
  // *ngFor
  // FormsModule provides [(ngModel)], which is used by the message input box in chat-room.html.
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-room.html', // HTML file containing the visual structure of this page.
  styleUrl: './chat-room.css' // CSS file containing styles specifically for this component.
})
export class ChatRoom implements OnInit, OnDestroy {

  /**
   * SOCKET.IO CONNECTION
   * --------------------
   * This represents this browser tab's live connection to the Socket.io server running inside the Node/Express backend.
   *   The ? means the property may initially be undefined because Angular constructs the component before ngOnInit()
   *                                            creates the connection.
   */
  socket?: Socket;


  /**
   * CURRENT USER INFORMATION
   * ------------------------
   * These values identify the currently logged-in user.
   * They are retrieved from localStorage when the component starts.
   */
  userId = '';
  username = '';


  /**
   * ROUTE INFORMATION
   * -----------------
   *
   * These identify which group and channel the user is viewing.
   *
   * For example, a route might conceptually represent:
   * /groups/GROUP_ID/channels/CHANNEL_ID
   */
  groupId = '';
  channelId = '';


  /**
   * MESSAGE INPUT
   * -------------
   *
   * This property is connected to the input element in chat-room.html using Angular two-way data binding:
   *
   * [(ngModel)]="newMessage"
   *
   * This means:
   * User types in input
   *        |
   *        v
   * newMessage changes
   * 
   * AND
   *
   * newMessage changes
   *        |
   *        v
   * input box changes
   */
  newMessage = '';

  // Optional image attached to the next chat message. Stored as a data URL so Socket.io can broadcast it immediately.
  pendingImage = '';
  pendingImageName = '';

  @ViewChild('messageHistory') messageHistory?: ElementRef<HTMLElement>;


  /**
   * GROUP AND CHANNEL INFORMATION
   * -----------------------------
   *                    These objects contain information returned by the REST API.
   * "any" is being used here because the original prototype does not currently require a strongly typed
   *                             Group/Channel object in this component.
   *   A larger production application would normally use interfaces such as Group and Channel instead.
   */
  group: any = null;
  channel: any = null;

  // Remains true while the initial group/channel information is being loaded.
  loadingChannel = true;


  /**
   * CHAT MESSAGE COLLECTION
   * -----------------------
   * This contains the current chat history displayed by Angular.
   * The assignment requires only the five most recent message positions to be retained.
   * MongoDB provides persistent storage on the backend.
   * This array is only the frontend representation of those messages.
   */
  messages: any[] = [];

  onlineUserIds = new Set<string>(); // Contains the IDs of users who currently have an active Socket.io
                                     //                     connection to the chat.


  /**
   * SYSTEM NOTIFICATIONS
   * --------------------
   * These are temporary notices such as users entering/leaving the channel.
   * They are separate from normal chat messages.
   */
  systemMessages: string[] = [];


  /**
   * DEPENDENCY INJECTION
   * --------------------
   * Angular automatically supplies these services when it creates the component.
   *
   * HttpClient:
   *     Makes REST/HTTP requests to the Express backend.
   *
   * ActivatedRoute:
   *     Lets us read parameters from the current Angular URL.
   *
   * Router:
   *     Lets this component navigate to another Angular page.
   */
  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}


  /**
   * ngOnInit()
   * ==========
   *
   * Angular automatically calls this lifecycle method once the component has been created.
   *
   * It is used to:
   *
   * 1. Determine which user is logged in.
   * 2. Determine which group/channel is being viewed.
   * 3. Load group/channel information using HTTP.
   * 4. Connect to Socket.io.
   * 5. Register the real-time event listeners.
   */
  ngOnInit(): void {

    // Retrieve the currently logged-in user's ID.
    // localStorage persists simple string values inside the browser.
    // If there is no userId, an empty string is used instead.
    this.userId = localStorage.getItem('userId') || '';

    // Retrieve the display username stored during login.
    this.username = localStorage.getItem('username') || '';


    // Read the group ID from the current Angular route.
    this.groupId = this.route.snapshot.paramMap.get('groupId') || '';

    // Read the channel ID from the current Angular route.
    this.channelId = this.route.snapshot.paramMap.get('channelId') || '';


    /**
     * AUTHENTICATION GUARD
     * --------------------
     * A user without a stored user ID should not remain inside the chat page.
     * Redirect them to login instead.
     */
    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }


    /**
     * HTTP REQUEST HEADERS
     * --------------------
     * The current prototype sends the user's ID to the backend through the x-user-id HTTP header.
     *
     * IMPORTANT:
     * The backend must still check permissions.
     *
     * Hiding something in Angular is NOT security because a user could manually send HTTP requests outside the Angular UI.
     */
    const headers = new HttpHeaders({
      'x-user-id': this.userId
    });


    /**
     * LOAD GROUP INFORMATION
     * ----------------------
     * Retrieves the group information from Express/MongoDB.
     * Change detection is triggered after the asynchronous response so the group name appears immediately.
     */
    this.http
        .get<any>(`http://localhost:3000/api/groups/${this.groupId}`)
        .subscribe({
            next: (group) => {
                this.group = group;
                this.cdr.detectChanges();
            },

            error: (error) => {
                console.error('Unable to load group information:', error);
            }
        });


    /**
     * LOAD CHANNEL INFORMATION
     * ------------------------
     * Retrieves the channels available to this group member and finds the channel matching the ID in the current route.
     *
     * Once the channel has loaded, loadingChannel becomes false and Angular is explicitly told to redraw the page.
     */
    this.http
        .get<any[]>(
            `http://localhost:3000/api/groups/${this.groupId}/rooms`,
            {headers}
        )
        .subscribe({
            next: (channels) => {

                // Find the channel represented by the channelId in the current Angular route.
                this.channel = channels.find(
                    (channel) => channel.id === this.channelId
                );

                // The initial channel information has now finished loading.
                this.loadingChannel = false;

                // Immediately refresh the template with the loaded channel information.
                this.cdr.detectChanges();
            },

            error: (error) => {
                console.error('Unable to load channel information:', error);

                // Stop displaying the loading state even if the request fails.
                this.loadingChannel = false;
                this.cdr.detectChanges();
            }
        });


    /**
     * CONNECT TO SOCKET.IO
     * ====================
     * The Express/Node server is running on localhost:3000.
     * io(...) creates a persistent Socket.io connection between this browser and that server.
     */
    this.socket = io('http://localhost:3000');


    
      /**
       * JOIN THE CHANNEL AFTER SOCKET.IO CONNECTS
       * -----------------------------------------
       * Waiting for the "connect" event makes the sequence explicit:
       *
       * Browser connects
       *       |
       *       v
       * Socket.io confirms connection
       *       |
       *       v
       * Browser requests channel membership
       *       |
       *       v
       * Server verifies user/group membership
       *       |
       *       v
       * Server sends chat history
       */
      this.socket.on('connect', () => {

          
          this.socket?.emit('join-channel', {
              channelId: this.channelId,
              userId: this.userId,
              username: this.username
          });
      });


    /**
     * RECEIVE CHAT HISTORY
     * --------------------
     * The server sends the channel's persisted message history after the socket successfully joins.
     *
     * Socket.io operates independently from Angular's normal template events, so changing this.messages does not always
     * automatically cause Angular to repaint the screen. detectChanges() makes the received messages visible immediately.
     */
    this.socket.on(
        'chat-history',
        (items: any[]) => {

            // Store the message history received from Node/MongoDB.
            this.messages = Array.isArray(items) ? items : [];

            // Immediately redraw the Angular template.
            this.cdr.detectChanges();
            this.scrollToBottom();
        }
    );


    /**
     * RECEIVE A NEW MESSAGE
     * =====================
     * Node broadcasts "new-message" whenever a user successfully sends a message to this channel.
     *
     * IMPORTANT:
     * There are TWO different message-history concepts in Fabuloso:
     *
     * 1. PERSISTENT HISTORY
     *    MongoDB stores only the five most recent message slots for each channel.
     *    This is the history a user receives when they first enter/re-enter a channel.
     *
     * 2. CURRENT SESSION HISTORY
     *    Once a user has entered the channel, Angular keeps every new message received during that visit.
     *
     * Example:
     *
     * User enters channel
     *        |
     *        v
     * MongoDB provides last 5 messages
     *        |
     *        v
     * Angular displays 5
     *        |
     *        +-- new message --> Angular displays 6
     *        |
     *        +-- new message --> Angular displays 7
     *        |
     *        +-- new message --> Angular displays 8
     *
     * When the user leaves, this Angular component is destroyed.
     *
     * When they later return:
     *
     * New ChatRoom component
     *        |
     *        v
     * Server reads MongoDB
     *        |
     *        v
     * Only the latest 5 persistent message slots are loaded again.
     *
     * Therefore we deliberately DO NOT use .slice(-5) here.
     * The five-message retention rule belongs to MongoDB/backend persistence,
     * not the current browser's temporary live chat history.
     */
    this.socket.on(
        'new-message',
        (message: any) => {

            // Add the newly received message to everything already displayed
            // during this visit to the channel.
            this.messages = [
                ...this.messages,
                message
            ];

            // Socket.io operates outside some of Angular's normal UI events,
            // so explicitly tell Angular to redraw the chat immediately.
            this.cdr.detectChanges();
            this.scrollToBottom();
        }
    );


    /**
     * RECEIVE MESSAGE DELETION
     * ------------------------
     * Node broadcasts the ID of a deleted message to every browser currently viewing the channel.
     * The original slot remains present but is marked as deleted.
     */
    this.socket.on(
        'message-deleted',
        ({messageId}: any) => {

            // Find the message currently displayed by Angular.
            const message = this.messages.find(
                (item) => item.id === messageId
            );

            if (message) {

                // Remove the visible message contents while retaining the message slot.
                message.text = '';
                message.deleted = true;

                // Immediately update all visible chat content.
                this.cdr.detectChanges();
            }
        }
    );


    /**
     * RECEIVE SYSTEM NOTIFICATIONS
     * ----------------------------
     * Displays temporary events such as users joining or leaving the channel.
     */
    this.socket.on(
        'system-message',
        (message: any) => {

            this.systemMessages = [
                ...this.systemMessages,
                message.text
            ].slice(-5);

            // Socket.io changed the notification list, so immediately update the template.
            this.cdr.detectChanges();
        }
    );


    /**
     * RECEIVE CHAT ERRORS
     * -------------------
     *
     * The backend can reject Socket.io operations.
     *
     * Examples could include:
     * - user isn't a group member;
     * - channel doesn't exist;
     * - user attempted to delete someone else's message.
     */
    this.socket.on(
      'chat-error',
      (message: any) => {
        alert(message.message || 'Chat error');
      }
    );


    /*
     * RECEIVE ONLINE USER PRESENCE
     * ----------------------------
     * The server broadcasts an array of user IDs whenever chat presence changes.
     *
     * A Set is used because checking whether a user ID exists is simple and fast.
     */
    this.socket.on(
      'online-users',
      (userIds: string[]) => {

        // Rebuild the set using the latest presence state supplied by Node.
        this.onlineUserIds =
          new Set(
            Array.isArray(userIds)
              ? userIds
              : []
          );

        // Socket.io callbacks may run outside Angular's normal UI update cycle.
        this.cdr.detectChanges();

      }
    );
  }


  /**
   * send()
   * ======
   * Called when:
   * - the user presses Enter inside the message input; OR
   * - the user clicks the Send button.
   *
   * This sends the message to Node through Socket.io.
   */
  send(): void {

    // trim() removes whitespace from the beginning and end.
    // This prevents messages containing only spaces.
    const text = this.newMessage.trim();


    // Do nothing if:
    // 1. there is no actual text; OR
    // 2. Socket.io has not been connected.
    if ((!text && !this.pendingImage) || !this.socket) {
      return;
    }


    /**
     * Emit the message to the backend.
     *
     * The backend is responsible for:
     * 1. validating the user;
     * 2. checking channel/group membership;
     * 3. creating the message;
     * 4. saving it in MongoDB;
     * 5. enforcing the five-message retention rule;
     * 6. broadcasting it to connected channel members.
     */
    this.socket.emit('send-message', {
      channelId: this.channelId,
      userId: this.userId,
      username: this.username,
      text: text,
      image: this.pendingImage
    });


    // Clear the input after sending.
    // Because newMessage is bound with [(ngModel)], Angular automatically clears the visible input box as well.
    this.newMessage = '';
    this.pendingImage = '';
    this.pendingImageName = '';
  }
  /** Validates and previews a PNG/JPEG/GIF of at most 2 MB before Socket.io sends it. */
  chooseImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!validChatImageFile(file)) {
      alert('Choose a PNG, JPEG or GIF image no larger than 2 MB.');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.pendingImage = String(reader.result || '');
      this.pendingImageName = file.name;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  /** Removes an image selected for the next message without affecting uploaded profile images. */
  clearPendingImage(): void {
    this.pendingImage = '';
    this.pendingImageName = '';
  }

  /** Scrolls only the chat-history panel after Angular has rendered a newly received message. */
  private scrollToBottom(): void {
    setTimeout(() => {
      const element = this.messageHistory?.nativeElement;
      if (element) element.scrollTop = element.scrollHeight;
    });
  }


  /**
   * deleteMessage()
   * ===============
   * Called by:
   * (click)="deleteMessage(m)"
   * 
   * in chat-room.html.
   *
   * Users are only allowed to delete their own messages.
   */
  deleteMessage(message: any): void {

    /**
     * FRONTEND CHECK
     * --------------
     * If this isn't the current user's message, don't send the deletion request.
     * This improves the user experience, but this is NOT the security boundary.
     * Node must independently verify ownership because a malicious client could bypass this Angular method entirely.
     */
    if (
      message.userId !== this.userId || !this.socket) {
      return;
    }


    /**
     * Tell the backend which message the user wants deleted.
     * Node verifies ownership and updates MongoDB.
     * It then broadcasts "message-deleted" so every connected browser updates immediately.
     */
    this.socket.emit('delete-message', {
      channelId: this.channelId,
      messageId: message.id,
      userId: this.userId
    });
  }

  /*
   * Returns true when the supplied user currently has an active Socket.io chat connection.
   */
  isUserOnline(userId: string): boolean {

    return this.onlineUserIds.has(userId);

  }

  /*
   * Converts a stored profile-picture path into a URL the Angular application can display.
   *
   * Uploaded profile pictures are served by Express from localhost:3000,
   *      while the default image belongs to Angular's local assets.
   */
  profilePictureUrl(profilePicture?: string): string {

    // Use the application's default avatar when no uploaded picture exists.
    if (!profilePicture) {
      return 'assets/Images/defaultusertransparent.png';
    }

    // Uploaded profile pictures are served by the Express backend.
    if (profilePicture.startsWith('/uploads/')) {
      return `http://localhost:3000${profilePicture}`;
    }

    // Allows already-complete URLs or other valid paths to remain unchanged.
    return profilePicture;

  }


  /**
   * back()
   * ======
   * Called by the "<-- Groups" button in chat-room.html.
   *
   * Angular Router performs client-side navigation without requiring a complete browser page reload.
   */
  back(): void {

    // Return to the application's group view.
    this.router.navigate(['/groups']);
  }


  /**
   * ngOnDestroy()
   * =============
   * Angular automatically calls this when the component is being destroyed, for example when the user navigates away.
   * Disconnecting is important because otherwise an old socket connection/listeners could remain active after leaving chat.
   */
  ngOnDestroy(): void {

    // Optional chaining ?. means:
    // "Call disconnect() only if this.socket exists."
    this.socket?.disconnect();
  }
}