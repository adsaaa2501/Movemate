import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'movemate_auth_token';
const USER_KEY = 'movemate_user_data';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
};

export async function saveAuthToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TOKEN_KEY, token);
      }
    } catch {}
    return;
  }

  try {
    const available = await SecureStore.isAvailableAsync();
    if (available) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch {}
}

export async function getAuthToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(TOKEN_KEY);
      }
    } catch {}
    return null;
  }

  try {
    const available = await SecureStore.isAvailableAsync();
    if (available) {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
  } catch {}
  return null;
}

export async function saveUserData(user: UserProfile): Promise<void> {
  const json = JSON.stringify(user);
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(USER_KEY, json);
      }
    } catch {}
    return;
  }

  try {
    const available = await SecureStore.isAvailableAsync();
    if (available) {
      await SecureStore.setItemAsync(USER_KEY, json);
    }
  } catch {}
}

export async function getUserData(): Promise<UserProfile | null> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
      }
    } catch {}
    return null;
  }

  try {
    const available = await SecureStore.isAvailableAsync();
    if (available) {
      const raw = await SecureStore.getItemAsync(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    }
  } catch {}
  return null;
}

export async function removeAuthSession(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
      }
    } catch {}
    return;
  }

  try {
    const available = await SecureStore.isAvailableAsync();
    if (available) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    }
  } catch {}
}
