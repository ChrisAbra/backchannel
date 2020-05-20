import { LightningElement } from 'lwc';

export default class App extends LightningElement {
    showHome = true;

    currentRoomCode;
    roomCode;

    async connectedCallback() {
        let newRoomCode = this.getRoomNameFromURL();
        if (newRoomCode) {
            this.joinRoom(newRoomCode);
        }
        else {
            this.leaveRoom();
        }
        window.onpopstate = () => {
            this.connectedCallback();
        };

    }

    joinRoom(roomCode) {
        this.showHome = false;
        let roomPath = '/room/' + roomCode;
        window.history.pushState({}, 'Room: ' + roomCode, roomPath)
        this.currentRoomCode = '';
        this.currentRoomCode = roomCode;
    }

    leaveRoom() {
        window.history.pushState({}, '', '/')
        this.showHome = true;
        this.currentRoomCode = null;
    }

    joinAttempt(event) {
        if (event.detail) {
            this.joinRoom(event.detail);
        }
    }

    getRoomNameFromURL() {
        if(window.location.pathname.includes('/room/')){
            return window.location.pathname.split('/')[2];
        }
        return null;
    } 
}
