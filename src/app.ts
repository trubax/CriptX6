import { Application } from '@nativescript/core';
import { firebase } from '@nativescript/firebase-core';

firebase.initializeApp();

Application.run({ moduleName: 'app-root' });