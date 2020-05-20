/* eslint-disable no-alert */
import { LightningElement, api } from 'lwc';
import { generateGUID } from 'imports/guid';

export default class Room extends LightningElement {
    @api
    roomCode;

    loadingRoom = true;

    user;

    roomData;

    showOptions = false;

    navClass = 'nav hide';
    chatClass = 'active-chat show';

    async connectedCallback() {
        this.roomData = await this.getRoomData();
        this.user = await this.getUserData();
        if(this.user){
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
        if(response.ok){
            roomData = await response.json();
            console.log(roomData);
            console.log(roomData.roomName);
            document.title = '🕊️ ' + roomData.roomName;
        
        }
        else{
            console.error(response.status);
        }
        return roomData;    
    }


    async registerUser() {
        const response = await fetch('/api/register', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: this.user.userId,
                userName: this.user.userName,
                roomCode: this.roomCode
            }
            )
        });
        if (response.ok) {
            let roomData = await response.json();
            this.roomData = roomData;
        }
        else {
            console.error(response.status);
        }
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
