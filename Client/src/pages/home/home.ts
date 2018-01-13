import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import 'rxjs/add/operator/map';
import { ListPage } from '../list/list';
import { Http } from '@angular/http';
import * as io from 'socket.io-client';
declare var io;

declare module TTS {
    interface IOptions {
        /** text to speak */
        text: string;
        /** a string like 'en-US', 'zh-CN', etc */
        locale?: string;
        /** speed rate, 0 ~ 1 */
        rate?: number;
    }

    function speak(options: IOptions, onfulfilled: () => void, onrejected: (reason) => void): void;
    function speak(text: string, onfulfilled: () => void, onrejected: (reason) => void): void;
}
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  socket: any;
   selectedItem: any;
  icons: string;
  items: {}[];
  messages :{}[];
  socketHost:string;
  chatBox:string;
  constructor(public navCtrl: NavController, public navParams: NavParams, public http: Http) {
    this.items =[];
    this.icons='';
    this.messages = [];
      this.socketHost = "52.3.227.11";
      this.chatBox = "";
      this.socket = io(this.socketHost);
      
       this.socket.on("hockettData", (msg) => {
        if (msg.text != ''){
          this.items.push({text:msg.text, id:msg.id, date:new Date()});
          this.socket.emit('clearMsg',1);
          console.log(msg.text);
          this.chatBox = msg;
    }
      document.addEventListener('deviceready', function () {

   // or with more options
   TTS
       .speak({
           text:   this.chatBox ,
           locale: 'en-GB',
           rate: 0.75
       }, function () {
           alert('success');
       }, function (reason) {
           alert(reason);
       });
  }, false);
       });


    // If we navigated to t{his:msg} page, we will have an item available as a nav param
    this.selectedItem = navParams.get('item');

    // Let's populate this page with some filler content for funzies
    //this.icons = ['flask', 'wifi', 'beer', 'football', 'basketball', 'paper-plane',
    //'american-football', 'boat', 'bluetooth', 'build'];
  }
  openFilters(data) {
  this.chatBox = data;

    document.addEventListener('deviceready', function () {

 // or with more options
 TTS
     .speak({
         text: this.chatBox,
         locale: 'en-GB',
         rate: 0.75
     }, function () {
         alert('success');
     }, function (reason) {
         alert(reason);
     });
}, false);

   }

  itemTapped(event, item) {
    // That's right, we're pushing to ourselves!
    this.navCtrl.push(ListPage, {
      item: item
    });
  }

}
