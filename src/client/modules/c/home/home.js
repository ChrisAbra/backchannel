import { LightningElement } from 'lwc';

export default class Home extends LightningElement {
    joinPlaceholderText = 'Enter code here';

    clearPlaceholder(event) {
        event.target.placeholder = '';
    }
    resetPlaceholder(event) {
        event.target.placeholder = this.joinPlaceholderText;
    }

    newRoom = function (event) {
        console.log(event);
    };

    joinRoom = function (event) {
        event.preventDefault();
        let code = this.template.querySelector('[data-id="roomCode"]').value;

        if (code) {
            console.log(code);
            const event = new CustomEvent('joinattempt', { detail: code });
            this.dispatchEvent(event);
        }
    };
}
