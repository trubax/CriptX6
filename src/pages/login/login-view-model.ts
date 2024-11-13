import { Observable } from '@nativescript/core';
import { firebase } from '@nativescript/firebase-core';
import { auth } from '@nativescript/firebase-auth';

export class LoginViewModel extends Observable {
    constructor() {
        super();
    }

    async onGoogleLogin() {
        try {
            const result = await auth().signInWithGoogle();
            if (result.user) {
                // Navigate to chat
                const frame = require('@nativescript/core').Frame;
                frame.topmost().navigate('pages/chat/chat-page');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Errore durante il login. Riprova.');
        }
    }

    async onAnonymousLogin() {
        try {
            const result = await auth().signInAnonymously();
            if (result.user) {
                // Navigate to chat
                const frame = require('@nativescript/core').Frame;
                frame.topmost().navigate('pages/chat/chat-page');
            }
        } catch (error) {
            console.error('Anonymous login error:', error);
            alert('Errore durante il login anonimo. Riprova.');
        }
    }
}