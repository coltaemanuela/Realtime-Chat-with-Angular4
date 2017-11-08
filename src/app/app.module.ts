import { NgModule, ApplicationRef, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule }    from '@angular/forms';
import { HttpModule } from '@angular/http';
import { MaterialModule, MdNativeDateModule } from '@angular/material';
import { AppComponent }  from './app.component';
import { routing }        from './app.routing';
import { ChatSettings } from './_services/chat-settings-sidebar.service';

import { GeneralErrorDialogComponent } from './_popup-dialog/error/general.component';
// import { AddUserDialogComponent, NewIndividualConversationDialogComponent, NewGroupDialogComponent } from './_popup-dialog/chat/add-user-group.component';
import { IndividualNewConversationPopupComponent } from './_popup-dialog/chat/i-new-conversation/i-new-conversation.component';

import { FooterComponent } from "./footer/footer.component";
import { AuthService, AppGlobals } from 'angular2-google-login';

//-------------------------------  New Firebase Account -----------------------------

export const firebaseConfig = {
    apiKey: "**",
    authDomain: "**",
    databaseURL: "**",
    projectId: "**",
    storageBucket: "t***.appspot.com",
    messagingSenderId: "**"
  };


@NgModule({
    imports: [ 
        BrowserModule,
        FormsModule,
        HttpModule,
        routing,
        BrowserAnimationsModule,
        MaterialModule,
        MdNativeDateModule,
        FacebookModule.forRoot(),
        AngularFireModule.initializeApp(firebaseConfig),
        AngularFireDatabaseModule,
        AngularFireAuthModule
    ],
    declarations: [ 
        AppComponent, 
      
        FooterComponent, 
        GeneralErrorDialogComponent,
        NewConversationComponent,
        ChatComponent,
        IndividualNewConversationPopupComponent,
    ],
    providers: [
        UserSessionService
        AuthService
        {
            provide: ErrorHandler, 
            useClass: GlobalErrorHandler
        }
    ],
    entryComponents: [ 
        LoginDialogComponent,
        IndividualNewConversationPopupComponent     
        ],
    bootstrap: [ AppComponent ]
})

export class AppModule {

    constructor( private user_session_service: UserSessionService, public links: LinksService ){
         console.log( this.user_session_service);
    }

 }