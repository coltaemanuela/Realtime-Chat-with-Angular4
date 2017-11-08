import { Component, OnInit, ViewChild, Inject  } from '@angular/core';
import { Router } from '@angular/router';
import { Http, Headers, Response } from '@angular/http';
import { LinksService } from '../../_services/links.service';
import { MdDialog, MdDialogRef, MD_DIALOG_DATA } from '@angular/material';
import { UserSessionService } from '../../_services/user-session.service';

import {AngularFireDatabase, FirebaseListObservable} from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { IndividualChat } from '../../chat/chat.component';
import { FirebaseApp } from 'angularfire2';
import 'firebase/storage';

@Component({
    selector: 'add-user-component',
    templateUrl: 'add-user.component.html',
    styleUrls: ['add-user.component.css']
})
export class AddUserDialogComponent implements OnInit {
    user_data:  any = {};   
    public noblocking_users: Array<any> = [];
    public total_noblocking_users: Array<any> = [];


    constructor( @Inject(MD_DIALOG_DATA) public data: any, private router: Router, private http: Http, private links: LinksService, private user_session_service: UserSessionService, public dialog: MdDialog) { }
   
    ngOnInit() {     
        this.user_data= this.data; 
        let  user_details= this.data;

        this.noblockingFollowing().subscribe( noblocking_following => { 
           this.total_noblocking_users =  noblocking_following;       
        });       


        this.total_noblocking_users = this.total_noblocking_users.filter(item => !user_details.includes(item) );
       // this.total_noblocking_users =  this.total_noblocking_users.filter(x => { return user_details.indexOf(x) < 0 });   

       console.log(this.user_data, this.total_noblocking_users);
    }

    AddUser() { }

  public noblockingFollowing() { 
    var headers = new Headers();
    headers.append('Authorization', 'Bearer ' + window.localStorage.getItem('user_token'));

    return this.http.post( this.links.noblockingFollowing(),{}, { headers: headers })
    .map((r: Response) => {
      var rr  = r.json();

     var rrr  = rr;
     rrr.data = rr.data.users.map(v => {
      return {
        profile_image: v.profile_image,
        user_id: v.user_id,
        firebase_uid: v.firebase_uid,
        username: v.username
      }
    });
    return  rrr.data;        
    });    
  } 

}

@Component({
    selector: 'new-conversation-component',
    templateUrl: 'new-individual-conversation.component.html',
    styleUrls: ['add-user.component.css']
})
export class NewIndividualConversationDialogComponent implements OnInit {
  
    constructor( @Inject(MD_DIALOG_DATA) public data: any, public afAuth: AngularFireAuth, public logged_user: UserSessionService,public af: AngularFireDatabase, private router: Router, private http: Http, private links: LinksService, private user_session_service: UserSessionService, public dialog: MdDialog) { }
   
       ngOnInit() {  } 
       
}

@Component({
    selector: 'new-group-component',
    templateUrl: 'new-group.component.html',
    styleUrls: ['add-user.component.css']
})
export class NewGroupDialogComponent implements OnInit {

    public group_data: any ={};
    public new_group_id:  any = {};   
    interlocutor_username: any;
    interlocutor_image :any;
    selected_users: Array<Object> = [];
    users_to_add: Object;
    user_fid:any;
    public firebaseApp: FirebaseApp;
    public image: any;
    public img: any;

    constructor(
        @Inject(MD_DIALOG_DATA) public data: any,
        firebaseApp: FirebaseApp,
        public afAuth: AngularFireAuth,
        private router: Router,
        public af: AngularFireDatabase,
        private http: Http,
        private links: LinksService,
        public logged_user: UserSessionService,
        private user_session_service: UserSessionService,
        public dialog: MdDialog )
        {
            this.firebaseApp = firebaseApp;
        }
          
        chooseFile() {
            let file_element = document.getElementById("fileInput");
            file_element.click();
        }
  
        addGroupConversation() {       

            this.af.list('groups/').push({
                creatorUserId: this.logged_user.getFirebaseUid(),
            }).then( new_group => {
                this.new_group_id = new_group.key;

                Object.keys(this.selected_users).forEach( user_fid => {   
                var headers = new Headers();
                headers.append('Authorization', 'Bearer ' + window.localStorage.getItem('user_token'));    

                this.http.get(this.links.getProfile() + "?user_id="+ user_fid, { headers: headers })
                .map((r: Response) => {
                return r.json();
                })
                .subscribe(user_data => { 
                    let me= this.logged_user.getFirebaseUid();

                    this.af.object(`groups/${new_group.key}/users/${user_fid}`).set({ 
                        isDeleted: false,
                        username:  user_data.data.user.username, 
                        photoUrl: user_data.data.profile_image ? user_data.data.profile_image: ''
                    });                    

                    this.af.object(`groups/${new_group.key}/users/${me}`).set({ 
                        isDeleted: false,
                        username:  this.logged_user.getUsername(), 
                        photoUrl: this.logged_user.getProfileImage() ? this.logged_user.getProfileImage(): ''
                    });

                    this.af.object(`groupConversations/${user_fid}/${this.new_group_id}`).set({             
                        groupName: this.group_data.name ? this.group_data.name : 'Group conversation' ,
                        groupPhotoUrl:this.image ? this.image : '',
                        lastMessage:{ 
                            fromUserId: this.logged_user.getFirebaseUid(), 
                            isRead: false, 
                            text: this.logged_user.getUsername() + ' created a group',
                            timestamp: + new Date()
                        },
                        unreadMessages: 1
                    });

                    this.af.object(`groupConversations/${me}/${this.new_group_id}`).set({             
                        groupName: this.group_data.name ? this.group_data.name : 'Group conversation' ,
                        groupPhotoUrl:this.image ? this.image : '', 
                        lastMessage:{ 
                            fromUserId: this.logged_user.getFirebaseUid(), 
                            isRead: false, 
                            text: this.logged_user.getUsername() + ' created a group',
                            timestamp: + new Date()
                        },
                        unreadMessages: 0
                    });

                    this.af.object('users/' + user_fid +'/unreadGroupConversations').$ref.transaction( unreadGroupConversations => {
                        return unreadGroupConversations ? unreadGroupConversations + 1 : 1;
                    });

                });
            });

        });        
             
    };

  onChange(files) {

    this.img= files[0];
      let storageRef = this.firebaseApp.storage().ref().child('groupImages/' + this.new_group_id );
      storageRef.put(files[0]).then( snapshot => {
        console.log('successfully added', snapshot);        
      });

    storageRef.getDownloadURL().then(url => { 
        this.image= url;
    });

  }

    
    ngOnInit() { 
    }
}
