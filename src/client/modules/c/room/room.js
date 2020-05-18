import { LightningElement, api } from 'lwc';

export default class Room extends LightningElement {
    @api
    roomCode;

    loadingRoom = true;

    user;

    roomData;

    chatData;

    showOptions = false;

    navClass = 'nav hide';
    chatClass = 'active-chat show';

    async connectedCallback() {
        this.user = await this.getUserData();
        this.roomData = await this.getRoomData();
        this.chatData = await this.getChatData();
        this.loadingRoom = false;
    }

    async getUserData() {
        let existingUser = localStorage.getItem('user');
        if (existingUser) {
            return JSON.parse(existingUser);
        }
        return null;
    }

    leaveRoom(event) {
        if (confirm('Are you sure you want to leave the room')) {
            const event = new CustomEvent('leaveroom');
            this.dispatchEvent(event);
        }
    }

    logOut(event) {
        if (
            confirm(
                "Are you sure you want to log out. You won't be able to receive any messages and all current messages will be lost"
            )
        ) {
            this.clearData();
        }
    }

    clearData() {
        localStorage.removeItem('user');
        this.user = null;
    }

    toggleOptions(event) {
        this.showOptions = !this.showOptions;
    }

    async getRoomData() {
        let roomData = {
            name: 'Diplomacy Game',
            code: this.roomCode,
            members: [
                {
                    id: '1',
                    name: 'Chris'
                },
                {
                    id: '2',
                    name: 'Megan'
                }
            ]
        };

        document.title = '🕊️ ' + roomData.name;

        return roomData;
    }

    async getChatData() {
        return {
            public: [
                {
                    messageId: '1',
                    senderId: '1',
                    senderName: 'Chris',
                    message: 'Hi there everyone'
                },
                {
                    messageId: '2',
                    senderId: '2',
                    senderName: 'Megan',
                    message: 'Hi Chris'
                }
            ],
            private: [
                {
                    messageId: '2',
                    participantId: '2',
                    participantName: 'Megan',
                    messages: [
                        {
                            messageId: '1',
                            senderId: '1',
                            senderName: 'Megan',
                            message: 'Hi new guy'
                        }
                    ]
                }
            ]
        };
    }

    createUser(event) {
        event.preventDefault();
        let displayName = this.template.querySelector('[data-id="displayName"]')
            .value;

        if (displayName) {
            console.log(displayName);
            const user = {
                name: displayName,
                id: 'a89efna98efnaef'
            };

            this.user = user;
            localStorage.setItem('user', JSON.stringify(user));
        }
    }
}
