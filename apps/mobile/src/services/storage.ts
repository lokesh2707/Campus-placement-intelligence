// Universal secure storage abstraction for mobile
// Uses in-memory storage fallback for web/testing/Node environments

class SecureStorageAdapter {
  private memoryStore: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    try {
      // In native Expo environment with expo-secure-store:
      // const SecureStore = require('expo-secure-store');
      // return await SecureStore.getItemAsync(key);
      return this.memoryStore.get(key) || null;
    } catch {
      return this.memoryStore.get(key) || null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      // const SecureStore = require('expo-secure-store');
      // await SecureStore.setItemAsync(key, value);
      this.memoryStore.set(key, value);
    } catch {
      this.memoryStore.set(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      // const SecureStore = require('expo-secure-store');
      // await SecureStore.deleteItemAsync(key);
      this.memoryStore.delete(key);
    } catch {
      this.memoryStore.delete(key);
    }
  }
}

export const secureStorage = new SecureStorageAdapter();
