import { LightningElement, api } from 'lwc';

export default class Chat extends LightningElement {
    @api
    member;
    @api
    user;
    @api
    roomCode;

    get isOrder() {
        return this.member ? this.member.type == 'orders' : false;
    }

    @api
    socket;
    @api
    lastPostId;

    renderedCallback() {
        console.log('rendered');
        this.template.querySelector('[data-id="message"]').focus();
        let chatWindow = this.template.querySelector('.chat-window');
        chatWindow.scrollTop = chatWindow.scrollHeight;
        const event = new CustomEvent('messagesread', { detail: this.member._id });
        this.dispatchEvent(event);
    }

    post(event) {
        event.preventDefault();
        let message = this.template.querySelector('[data-id="message"]').value;
        if (!message) {
            return;
        }
        this.template.querySelector('[data-id="message"]').value = null;
        let payload = {
            senderId: this.user.userId,
            recipientId: this.member._id,
            message: message,
            type: this.member.type,
            roomCode: this.roomCode
        }
        this.socket.emit('message', payload);
    }

    resolveRound() {
        if(confirm('Are you sure you want to resolve the round?')){
            this.socket.emit('resolveround', { roomCode: this.roomCode });

        }
    }
}
