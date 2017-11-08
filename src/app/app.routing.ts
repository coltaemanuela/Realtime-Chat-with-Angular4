import { Routes, RouterModule } from '@angular/router';
import { ChatComponent } from './chat/chat.component';

const appRoutes: Routes = [
    { path: 'chat', component: ChatComponent, canActivate: [UserLoggedGuard] },
    // { path: 'chat/:type/:conversation_id', component: ChatComponent, canActivate: [UserLoggedGuard] },
    // otherwise redirect to home
    { path: '**', redirectTo: '' }
];

export const routing = RouterModule.forRoot(appRoutes);