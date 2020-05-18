import { LightningElement } from 'lwc';

export default class App extends LightningElement {
    showHome = true;

    currentRoomCode;
    roomData;

    connectedCallback() {
        let roomCode = this.getRoomNameFromURL();
        if (roomCode) {
            this.joinRoom(roomCode);
        }
    }

    joinRoom(roomCode) {
        this.showHome = false;
        this.currentRoomCode = roomCode;
    }

    leaveRoom(event) {
        this.showHome = true;
        this.currentRoomCode = null;
    }

    joinAttempt(event) {
        if (event.detail) {
            this.joinRoom(event.detail);
            //window.location.href = '/' + event.detail;
        }
    }

    getRoomNameFromURL() {
        return 'B877JE8';
    }
}
