import { LightningElement, api } from 'lwc';

export default class Chat extends LightningElement {
    @api
    member;
    @api
    user;
    @api
    socket;

    renderedCallback(){
        console.log('chat rendered');
        console.log(this.member);
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
