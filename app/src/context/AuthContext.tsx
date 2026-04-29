import React, { createContext, useContext, useState, useEffect } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

import { SalesforceMember } from '../services/SalesforceService';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  member: SalesforceMember | null;
  loading: boolean;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  setMember: (member: SalesforceMember | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import SalesforceService from '../services/SalesforceService';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [member, setMember] = useState<SalesforceMember | null>(null);
  const [loading, setLoading] = useState(true);

  const updateMember = (newMember: SalesforceMember | null) => {
    setMember(newMember);
  };

  useEffect(() => {
    // Handle user state changes
    const subscriber = auth().onAuthStateChanged(async (userState) => {
      setUser(userState);
      
      if (userState && !userState.isAnonymous) {
        try {
          const phone = userState.phoneNumber;
          console.log('🔐 [Auth] User Logged In:', phone);
          if (phone) {
            // ── Race Salesforce check against an 8-second timeout ──
            // This prevents the app from getting stuck if the network is slow
            const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
            const sfCheck = SalesforceService.checkContactExists(phone, userState.uid);
            
            const check = await Promise.race([sfCheck, timeout]);
            
            if (check?.exists && check.member) {
              console.log('👤 [Auth] Member Profile Loaded:', check.member.name);
              setMember(check.member);
            } else if (check === null) {
              console.warn('⚠️ [Auth] Salesforce check timed out — proceeding without profile.');
            }
          }
        } catch (err) {
          console.error('❌ [Auth] Salesforce Profile Fetch Failed:', err);
          // Silently continue — app still works without Salesforce profile
        }
      } else {
        setMember(null);
      }
      
      // Always clear loading — never block the user
      setLoading(false);
    });
    return subscriber; 
  }, []);

  const signInAnonymously = async () => {
    try {
      await auth().signInAnonymously();
    } catch (error) {
      console.error('Anonymous sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, member, loading, signInAnonymously, signOut, setMember }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
