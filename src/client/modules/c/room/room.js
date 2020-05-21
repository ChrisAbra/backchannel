/* eslint-disable no-alert */
import { LightningElement, api } from 'lwc';
import { generateGUID } from 'imports/guid';
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


    members;

    showOptions = false;

    navClass = 'nav hide';
    chatClass = 'active-chat show';

    async connectedCallback() {
        if (this.roomCode) {
            this.defaultChatMember = { userName: 'Orders', _id: this.roomCode }
        }
        this.roomData = await this.getRoomData();
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

    logOut() {
        if (
            // eslint-disable-next-line no-restricted-globals
            confirm(
                "Are you sure you want to log out. You won't be able to receive any messages and all current messages will be lost"
            )
        ) {
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
            let activeMemberId = this.activeMember ? this.activeMember._id: this.defaultChatMember._id;
            this.setActiveMember(activeMemberId);
        })

        this.socket.on('message', (msg) => {
            let members = this.members;
            members.forEach(member => {
                if (member._id == msg.recipientId) {
                    if (msg.senderId == this.user.userId) {
                        msg.from = 'self';
                        member.posts = member.posts ? member.posts : [];
                        member.posts.push(msg);
                    }
                    else {
                        msg.from = 'other';
                        member.posts = member.posts ? member.posts : [];
                        member.posts.push(msg);
                    }
                    console.log(member.posts);
                    member.unread = member.unread ? member.unread + 1 : 1;
                }
            })
            this.members = null;
            this.members = members;
            //this.setActiveMember(this.activeMember._id);
        })
    }

    setActiveMember(memberId) {
        this.members.forEach(member => {
            if(member._id == memberId){
                this.activeMember = null;
                this.activeMember = member;
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

    memberSelect(event){
        this.setActiveMember(event.detail);
    }


    createUser(event) {
        event.preventDefault();

        let displayName = this.template.querySelector('[data-id="displayName"]')
            .value;

        if (displayName) {
            console.log(displayName);
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
