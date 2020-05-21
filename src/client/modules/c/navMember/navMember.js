import { LightningElement, api } from 'lwc';

export default class NavMember extends LightningElement {
	@api 
	member
	@api
	socket;
	@api
	user;

	@api
	roomCode;

	@api
	unread;

	@api
	chatId;


	member;


	renderedCallback(){
		console.log('nav member connected');
		console.log(this.member.unread);
	}

	selectActiveMember(){
		console.log('fire memberselect');
        const event = new CustomEvent('memberselect', { detail: this.member._id });
        this.dispatchEvent(event);
	}


}
