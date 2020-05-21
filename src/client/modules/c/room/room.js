/* eslint-disable no-alert */
import { LightningElement, api } from 'lwc';
import { generateGUID } from 'imports/guid';
import { playNotification } from 'imports/sound';
import io from 'imports/io';

export default class Room extends LightningElement {
    @api
    roomCode;

    loadingRoom = true;

    user;

    roomData;

    socket;

    activeMember;

    defaultChatMember;

    lastPostId;

    members;

    showOptions = false;

    unreadMessages = 0;

    navClass = 'nav hide';
    chatClass = 'active-chat show';

    async connectedCallback() {

        this.roomData = await this.getRoomData();
        if (this.roomCode) {
            this.defaultChatMember = { userName: 'Everyone', _id: this.roomCode }
        }

        this.user = await this.getUserData();
        if (this.user) {
            await this.registerUser();
        }
        this.loadingRoom = false;
    }

    async getUserData() {
        let existingUser = localStorage.getItem('user');
        if (existingUser) {
            return JSON.parse(existingUser);
        }
        return null;
    }

    leaveRoom() {
        // eslint-disable-next-line no-restricted-globals
        if (confirm('Are you sure you want to leave the room')) {
            const e = new CustomEvent('leaveroom');
            this.dispatchEvent(e);
        }
    }

    openNav(){
        this.navClass = 'nav show';
        this.chatClass = 'active-chat hide';
    }

    closeNav(){
        this.navClass = 'nav hide';
        this.chatClass = 'active-chat show';

    }

    logOut() {
        if (
            // eslint-disable-next-line no-restricted-globals
            confirm(
                "Are you sure you want to log out. You won't be able to receive any messages and all current messages will be lost"
            )
        ) {
            this.socket.emit('logout',{userId: this.user.userId, roomCode:this.roomCodey});
            this.showOptions = false;
            this.clearData();
        }
    }

    clearData() {
        localStorage.removeItem('user');
        this.user = null;
    }

    toggleOptions() {
        this.showOptions = !this.showOptions;
    }

    async getRoomData() {
        const response = await fetch('/api/join?roomCode=' + this.roomCode);
        let roomData;
        if (response.ok) {
            roomData = await response.json();
            document.title = '🕊️ ' + roomData.roomName;
            this.roomData = null;
            this.roomData = roomData;
            return roomData;
        }
        console.error(response.status);
        return roomData;
    }

    listenToRoom() {
        this.socket.on('members', (members) => {
            let filteredMembers = members.filter(member => member._id !== this.user.userId);
            filteredMembers.forEach(member => {
                if (member._id !== this.defaultChatMember._id) {
                    let memberIds = [];
                    memberIds.push(this.user.userId, member._id);
                    memberIds.sort(); // alphabetically sort to ensure same codes for both pairs
                    member.chatId = this.roomCode + '-' + memberIds[0] + memberIds[1];
                }
            });

            filteredMembers.unshift(this.defaultChatMember)
            this.members = filteredMembers;
            let activeMemberId = this.activeMember ? this.activeMember._id : this.defaultChatMember._id;
            this.setActiveMember(activeMemberId);
        })

        this.socket.on('message', (msg) => {
            this.newMessage(msg);
        })
    }

    async newMessage(msg) {
        let members = this.members;
        this.lastPostId = msg.postId;
        let unreadMessages = this.unreadMessages;
        members.forEach(member => {
            if (member._id == msg.recipientId) {
                if (msg.senderId == this.user.userId) { // own posts
                    msg.from = 'self';
                    msg.showSender = false;
                    member.posts = member.posts ? member.posts : [];
                    member.posts.push(msg);
                }
                else if (member._id == msg.recipientId) { // room post
                    msg.from = 'other';
                    if (member.posts) {
                        if (member.posts[member.posts.length - 1].senderId != msg.senderId) {
                            msg.showSender = true; // if this sender is different from the last sender
                        }
                    }
                    else {
                        msg.showSender = true
                        member.posts = [];
                    }
                    member.unread = member.unread ? member.unread + 1 : 1;
                    unreadMessages++;
                    member.posts.push(msg);

                }
            }
            else if (member._id == msg.senderId && msg.recipientId.length > 12) { // chat post
                msg.from = 'other';
                if (member.posts) {
                    if (member.posts[member.posts.length - 1].senderId != msg.senderId) {
                        msg.showSender = true; // if this sender is different from the last sender
                    }
                }
                else {
                    msg.showSender = true
                    member.posts = [];
                }
                member.unread = member.unread ? member.unread + 1 : 1;
                unreadMessages++;
                member.posts.push(msg);
            }
        });
        if(unreadMessages != this.unreadMessages){
            playNotification();
        }
        this.unreadMessages = unreadMessages;
        this.members = null;
        this.members = members;

    }

    messagesRead(event){
        let memberId = event.detail;
        let members = this.members;
        let unreadMessages = this.unreadMessages
        members.forEach(member => {
            if(member._id == memberId){
                if(member.unread){
                    unreadMessages = unreadMessages - member.unread;
                }
                member.unread = 0;
            }
        })
        this.unreadMessages = unreadMessages;
        this.members = members;
        this.setActiveMember(memberId);
    }


    setActiveMember(memberId) {
        this.members.forEach(member => {
            if (member._id == memberId) {
                this.activeMember = null;
                this.activeMember = member;
                this.closeNav();
            }
        });
    }


    async registerUser() {
        let userData = {
            userId: this.user.userId,
            userName: this.user.userName,
            roomCode: this.roomCode
        };
        let socket = io.connect(window.location.origin);
        socket.on('connect', () => {
            this.socket = socket;
            socket.emit('register', userData);
            this.listenToRoom();
        })
    }

    memberSelect(event) {
        this.setActiveMember(event.detail);
    }


    createUser(event) {
        event.preventDefault();

        let displayName = this.template.querySelector('[data-id="displayName"]')
            .value;

        if (displayName) {
            const user = {
                userName: displayName,
                userId: generateGUID(),
            };

            this.user = user;
            localStorage.setItem('user', JSON.stringify(user));
            this.registerUser();
        }
    }
}
