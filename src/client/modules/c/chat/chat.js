import { LightningElement, api } from 'lwc';

export default class Chat extends LightningElement {
    @api
    member;
    @api
    user;
    @api
    socket;
    @api
    lastPostId;

    renderedCallback(){
        this.template.querySelector('[data-id="message"]').focus();
        const event = new CustomEvent('messagesread', { detail: this.member._id });
        this.dispatchEvent(event);
    }

    post(event){
        console.log(this.member._id);
        event.preventDefault();
        let message = this.template.querySelector('[data-id="message"]').value;
        this.template.querySelector('[data-id="message"]').value = null;
        let payload = {
            senderId: this.user.userId,
            recipientId: this.member._id,
            message: message
        }
        this.socket.emit('message', payload);
    }
}
