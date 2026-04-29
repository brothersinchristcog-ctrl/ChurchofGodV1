import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Note: With React Native Firebase, you don't need to manually 
// initializeApp or set persistence. It's handled automatically 
// by the native plugins via app.json/Google-Services.json configuration.

export const db = firestore();
export const FieldValue = firestore.FieldValue;

export { auth, firestore };
