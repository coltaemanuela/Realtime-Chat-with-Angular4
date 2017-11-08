import { Component, OnInit, Inject, Input, ViewEncapsulation } from '@angular/core';
import {AngularFireDatabase, FirebaseListObservable} from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { UserSessionService } from '../_services/user-session.service';
import { MdDialog, MdDialogRef, MD_DIALOG_DATA, MdButton } from '@angular/material';
import { LinksService } from '../_services/links.service';
import { Http, Headers, Response } from '@angular/http';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Observable} from 'rxjs/Rx';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AddUserDialogComponent, NewIndividualConversationDialogComponent, NewGroupDialogComponent } from '../_popup-dialog/chat/add-user-group.component';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { FirebaseApp } from 'angularfire2';
//import * as firebase from 'firebase';
import 'firebase/storage';

@Component({
  selector: 'individual-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  encapsulation: ViewEncapsulation.None,
})

export class IndividualChat implements OnInit {
  private personal_messages: FirebaseListObservable<any[]>;
  private group_messages: FirebaseListObservable<any[]>;
  conversation_id: any;
  all_my_conversations: any[];
 
  creator_username:any;
  creator_image:any;
  photo: any;
  name:any;
  my_id:any;
  public creator_id: any;
  time: any;
  group_id: any;
  public group_data: any;
  all_group_messages:any[];
  individual_group_messages: any[];
  public group_members: Array<any> = [];
  public messages: Array<any> = [];
  msgVal: string = '';


  personal_conversations: FirebaseListObservable<any[]>;
  user_id: any;
  messages_per_conversation: any[];
  public conversations: Array<any> = [];
  public total_unread: number =0;

  my_personal_conversations: any[];
  my_groups: any[];
  groups:any[];
  public all_my_group_conversations:Array<any> = [];
  group_users:any[];
  type:any;
  noblocking_users: any;
  noblocking_following: any;
  interlocutor_username:any;
  interlocutor_image:any;

  public group_name: any;
  public group_photo: any;
  public group_edit_data: any ={};
  public firebaseApp: FirebaseApp;
  
  constructor(
    firebaseApp: FirebaseApp,
    public afAuth: AngularFireAuth, 
    public af: AngularFireDatabase,
    public logged_user: UserSessionService,
    public route: ActivatedRoute,
    public http: Http,
    public dialog: MdDialog,
    private links: LinksService
  ){ 
    this.firebaseApp = firebaseApp;
  }

   chooseFile() {
      let file_element = document.getElementById("fileInput");
      file_element.click();
   }

  getMessageDate(timestamp){   
    let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec" ];
    let d= new Date (timestamp);
    let now = new Date();

    if(d.getDate() == now.getDate() &&d.getMonth() == now.getMonth() ){ return ( d.getHours()+":"+ d.getMinutes() ); }         
    return (  monthNames[d.getMonth()] + ' ' + d.getDate() );
  }

  blockUser(firebase_uid){
    var headers = new Headers();
    headers.append('Authorization', 'Bearer ' + window.localStorage.getItem('user_token'));
    
    this.http.post(this.links.blockUser(), { firebase_uid: firebase_uid }, { headers: headers }).map((r: Response) => {
        return r.json();
    }).subscribe(() => { 
        console.log('user blocked successfully!');        
    });
  }

  chatSend( message_text: string ) {
    let msg_observer;
    let msg_observer1;
    let last_message_individual;
    let last_message_individual_other;

    switch ( this.type ) {
      case 'i':
        msg_observer = this.af.list('/personalMessages/'+ this.conversation_id );
        this.conversations.map( individual_conversation => {
   
          if( individual_conversation.idConversation === this.conversation_id){
            last_message_individual=  this.af.object('/personalConversations/'+ this.my_id + '/'+ individual_conversation.$key); 
            last_message_individual_other= this.af.object('/personalConversations/'+ individual_conversation.$key + '/'+ this.my_id); 

            this.af.object('users/'+ this.my_id + '/unreadPersonalConversations').$ref.transaction( unreadPersonalConversations => {
              return unreadPersonalConversations ? unreadPersonalConversations - 1 : 0;
            });
          }
      
        });

      break;
      case 'g':
        this.group_members.forEach( user => {

          this.af.list( 'groupMessages/'+ user.key + '/' + this.conversation_id ).push({ 
            text: message_text,
            fromUserId: this.logged_user.getFirebaseUid(),
            isRead: false, 
            timestamp: + new Date() 
          });
          
          this.af.object( '/groupConversations/' + user.key +'/'+ this.conversation_id ).update({
            lastMessage:{
              text: message_text,
              timestamp: + new Date()              
            },
            unreadMessages: 0
          });

        });

        last_message_individual =  this.af.object('/groupConversations/' + this.my_id +'/'+ this.conversation_id );
        this.af.object('users/'+ this.my_id + '/unreadGroupConversations').$ref.transaction(unreadGroupConversations => {
            return unreadGroupConversations ? unreadGroupConversations - 1 : 0;
        });

      break;
    }

    msg_observer.push({ text: message_text, fromUserId: this.logged_user.getFirebaseUid(), isRead: false, timestamp: + new Date() });

    if( last_message_individual ||  last_message_individual ){
      last_message_individual.update({lastMessage:{text: message_text, timestamp: + new Date()}, unreadMessages: 0  });
      last_message_individual_other.update({ lastMessage:{text: message_text, timestamp: + new Date()}, unreadMessages: 0 }); 
    }
     if( !last_message_individual || !last_message_individual ){    
        
        var headers = new Headers();
        headers.append('Authorization', 'Bearer ' + window.localStorage.getItem('user_token'));    

        this.http.get(this.links.getProfile() + "?user_id="+ this.conversation_id, {headers: headers})
        .map((r: Response) => {
          return r.json();
        })
        .subscribe((user_data) => { 
          this.interlocutor_username = user_data.data.user.username;
          this.interlocutor_image = user_data.data.profile_image;
        });

       this.addPersonalCoversation( this.conversation_id, message_text, this.interlocutor_username,this.interlocutor_image );
     }
  }

  EditChatData(){
    if(this.group_edit_data.name.length > 1 && this.group_edit_data.name.length > 1){
      this.af.object('groupConversations/'+ this.my_id + '/' +this.conversation_id ).update({ groupName: this.group_edit_data.name ? this.group_edit_data.name : 'New Group' });
    }  

  }

  deleteChat() {
    let personal_chat;
    switch ( this.type ) {
      case 'i':        
        this.conversations.map(particular_conversation => {
          if( particular_conversation.idConversation === this.conversation_id){
            personal_chat =  this.af.object('/personalConversations/'+ particular_conversation.$key + '/' + this.my_id); 
          }
        });

    break;
    case 'g':
    break;
    }
    personal_chat.update({ isDeletedByOtherUser: true });
  }

  leaveChat(){
    let member;
    if(this.type === 'g') {
     this.group_members.map(m => {
       if(m.key === this.my_id){
        member = this.af.object('/groups/'+ this.conversation_id + '/users/' + this.my_id); 
       }        
     });
      member.update({ isDeleted: true });
    }
  }

  public getUserProfileImage( conv ){
    return conv.otherUser.photoUrl;
  }

  addPersonalCoversation( firebase_uid: string, first_message: string, interlocutor_username: string, interlocutor_image:string ){ 
   
    if(this.type === 'i') {    
      let personal_convs;
      personal_convs = this.af.list('personalConversations/' + this.logged_user.getFirebaseUid() +'/'+ firebase_uid );
      this.af.list( 'users/'+ firebase_uid ).subscribe( user_details => {         
        return user_details;
      });      
    
      personal_convs.push({ }).then( item => {

        this.af.object('personalConversations/' + this.logged_user.getFirebaseUid() +'/'+ firebase_uid ).update({
          idConversation: item.key,
          isDeletedByOtherUser: false,
          lastMessage:{
              text:       first_message,
              timestamp:  + new Date()
          },
          otherUser: {
              photoUrl: this.interlocutor_image,
              username: this.interlocutor_username
          },
          unreadMessages: 0
        });

        this.af.object('personalConversations/'+ firebase_uid + '/' + this.logged_user.getFirebaseUid() ).update({
          idConversation: item.key,
          isDeletedByOtherUser: false,
          lastMessage:{
              text: first_message,
              timestamp: + new Date()
          },
          otherUser: {
              photoUrl: this.logged_user.getProfileImage(),
              username: this.logged_user.getUsername()
          },
          unreadMessages: 1
        });

        this.af.object('personalMessages/'+ firebase_uid).remove();
        this.af.list(`personalMessages/${item.key}`).push({ fromUserId: this.logged_user.getFirebaseUid(), isRead: true, text: first_message,timestamp: + new Date() });
      });
    }
  }
  onChange(files) {

    let storageRef = this.firebaseApp.storage().ref().child('groupImages/'+ this.conversation_id);

    storageRef.put(files[0]).then( snapshot => {
      console.log('successfully added', snapshot);        
    }).catch(err => { console.error("Whoupsss!", err) });

    storageRef.getDownloadURL().then( url => { 
      this.af.object('groupConversations/'+ this.my_id + '/' + this.conversation_id ).update({ groupPhotoUrl:  url});

      this.group_members.forEach( user=>{ 
         this.af.object('groupConversations/'+ user.key+ '/' + this.conversation_id ).update({ groupPhotoUrl:  url});
      });
    });

  }

  ngOnInit() {
    this.my_id = this.logged_user.getFirebaseUid();     
      
    this.route.params.subscribe(params => { 

      this.type = params.type ? params.type : 'i';
      this.conversation_id = params.conversation_id ? params.conversation_id : false;
      this.af.list('/groupConversations/' + this.my_id ).subscribe(group_convs => {
        group_convs.forEach( g => { 
          if( g.unreadMessages > 0 ) this.total_unread ++;       
         });
        this.all_my_group_conversations= group_convs;      
      });

      this.personal_conversations = this.af.list('/personalConversations/'+ this.logged_user.getFirebaseUid());      
      this.personal_conversations.subscribe( convs  => {
        this.conversations = convs;
        });

      });

      switch ( this.type ) {
        case 'g':
          this.type = 'g';

          this.group_messages= this.af.list('/groups/' + this.conversation_id );

          this.group_messages.subscribe( group_mess  => {
            this.messages = group_mess;
          });

          this.af.list('groupMessages/'+ this.my_id + '/' + this.conversation_id).subscribe( g_messages => { 
            this.individual_group_messages = g_messages;
          });
          
          this.af.list('/groups/' + this.conversation_id, { preserveSnapshot: true} ).subscribe( snaps => {    
            snaps.forEach(snap => {     
           
              if( snap.key === 'creatorUserId' ) { 
                this.creator_id= snap.val();  
   
                this.af.list('/groupConversations/'+ this.my_id + '/' + this.conversation_id).subscribe( group_data => {                                 
                  this.group_data = group_data; 
  
                  this.group_data.map( details => {
                    if( details.$key === 'groupName' ) {  this.group_name = details.$value; }
                    
                    if( details.$key === 'groupPhotoUrl' ) {
                      this.group_photo = details.$value ? details.$value : "https://s3.us-east-2.amazonaws.com/myapp/default/avatar-placeholder.png";
                    }
                  });
         
                 });
               }                    
            }); 
          });     

          this.af.list('/groups/' + this.conversation_id + '/users', { preserveSnapshot: true }).subscribe(snaps => {    
            snaps.forEach(snap => {     
              this.group_members.push({ "key": snap.key, "value": snap.val() });                           
            });
          }); 

          break;
        case 'i':
          this.type = 'i';       

            if( this.conversation_id !== false ){     

              let personal_convs = this.af.list('personalConversations/' + this.logged_user.getFirebaseUid() +'/'+ this.conversation_id );                       
              this.personal_messages = this.af.list('/personalMessages/'+ this.conversation_id );
              this.personal_messages.subscribe( snaps => {
                this.messages = snaps;
              });
          }
          break;
      }    
  }

  openAddUserDialog(){
    this.dialog.open(  AddUserDialogComponent, { data: this.group_members } );
  }

  newIndividualConversation() {
      this.noblockingFollowing().subscribe( noblocking_following => { 
      this.noblocking_users =  noblocking_following;
      let dialogRef         =  this.dialog.open( NewIndividualConversationDialogComponent, { data: noblocking_following } );
    });       
  }

  public noblockingFollowing() { 
    var headers = new Headers();
    headers.append('Authorization', 'Bearer ' + window.localStorage.getItem('user_token'));

    return this.http.post( this.links.noblockingFollowing(),{}, { headers: headers })
    .map((r: Response) => {
      var rr  = r.json();
      console.log(rr);
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

  NewGroupDialog(){
    this.noblockingFollowing().subscribe( noblocking_following => { 
      this.noblocking_users =  noblocking_following;
      let dialogRef =  this.dialog.open( NewGroupDialogComponent, { data: noblocking_following } );
    });        
  }    
}
