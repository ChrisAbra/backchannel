import { LightningElement } from 'lwc';

export default class Home extends LightningElement {

    clearPlaceholder(event) {
        event.target.dataset.placeholder = event.target.placeholder;
        event.target.placeholder = '';
    }
    resetPlaceholder(event) {
        event.target.placeholder = event.target.dataset.placeholder;
    }

    newRoomEvent = function (event) {
        event.preventDefault();
        let roomName = this.template.querySelector('[data-id="newRoomName"]').value;
        if (!roomName) {
            return;
        }
        this.newRoom(roomName);

    }

    newRoom = async function (roomName) {
        const response = await fetch('/api/create', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({roomName: roomName})
        });
        if (response.ok) {
            let roomCode = await response.json();
            this.joinRoom(roomCode.roomCode)
        }
        else {
            console.error(response.status);
        }
    };

    joinRoom = function (roomCode) {
        const event = new CustomEvent('joinattempt', { detail: roomCode });
        this.dispatchEvent(event);
    }

    joinRoomEvent = function (event) {
        event.preventDefault();
        let roomCode = this.template.querySelector('[data-id="roomCode"]').value;

        if (roomCode) {
            this.joinRoom(roomCode);
        }
    };
}
