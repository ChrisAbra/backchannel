import { LightningElement, api } from 'lwc';

export default class NavMember extends LightningElement {
	@api 
	member

	@api
	lastPostId;
	@api
	unread;

	lastMessage;


	member;


	renderedCallback(){
		if(this.member && this.member.posts){
			this.lastMessage = this.member.posts[this.member.posts.length -1].message;
		}
	}

	selectActiveMember(){
        const event = new CustomEvent('memberselect', { detail: this.member._id });
        this.dispatchEvent(event);
	}


}
