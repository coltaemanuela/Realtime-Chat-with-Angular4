import { Component, ErrorHandler } from '@angular/core';

import { UserSessionService } from './_services/user-session.service';

// import { GlobalErrorHandler } from './_services/error-handling.service';

@Component({
    selector: 'thumbsplit-app',
    templateUrl: 'app.component.html',
    // providers: [
    //     {
    //         provide: ErrorHandler,
    //         useClass: GlobalErrorHandler,
    //     }
    // ]
})

export class AppComponent { 

    constructor( public logged_user: UserSessionService ) {}

}