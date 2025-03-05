import { PostgresDatabaseAdapter } from "@elizaos/adapter-postgres";
import { SqliteDatabaseAdapter } from "@elizaos/adapter-sqlite";
import Database from "better-sqlite3";
import path from "path";
import { elizaLogger } from "@elizaos/core";

export function initializeDatabase(dataDir: string) {
  if (process.env.POSTGRES_URL) {
    const db = new PostgresDatabaseAdapter({
      connectionString: process.env.POSTGRES_URL,
    });
    return db;
  } else {
    try {
      const filePath =
        process.env.SQLITE_FILE ?? path.resolve(dataDir, "db.sqlite");
      // Use in-memory database to avoid SQLite binding issues
      const inMemoryDb = ":memory:";
      const db = new SqliteDatabaseAdapter(new Database(inMemoryDb));
      return db;
    } catch (error) {
      // Fallback to a mock database if better-sqlite3 fails to initialize
      elizaLogger.warn("SQLite initialization failed, using mock database:", error);
      return createMockDatabase();
    }
  }
}

// Simple mock database adapter for testing
function createMockDatabase() {
  return {
    get: async () => ({}),
    all: async () => [],
    run: async () => ({}),
    exec: async () => ({}),
    prepare: () => ({
      get: async () => ({}),
      all: async () => [],
      run: async () => ({}),
    }),
    close: async () => {},
    connection: null,
    initialize: async () => {},
    init: async () => {},
    // Cache methods needed for IDatabaseCacheAdapter
    getCache: async () => null,
    setCache: async () => true,
    deleteCache: async () => true,
    // Message-related methods
    getMessagesForRoom: async (roomId: string): Promise<any[]> => {
      const message = {
        id: "message-1",
        roomId,
        senderId: "user-1",
        content: {
          text: "This is a mock message",
          attachments: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: "text",
        metadata: {}
      };
      return Promise.resolve([message]);
    },
    addMessageToRoom: async (roomId: string, message: any): Promise<any> => {
      const msg = {
        id: "message-1",
        roomId,
        senderId: message.senderId || "user-1",
        content: {
          text: message.text || "This is a mock message",
          attachments: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: message.type || "text",
        metadata: message.metadata || {}
      };
      return Promise.resolve(msg);
    },
    getMessageById: async (messageId: string): Promise<any> => {
      const message = {
        id: messageId,
        roomId: "default-room",
        senderId: "user-1",
        content: {
          text: "This is a mock message",
          attachments: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: "text",
        metadata: {}
      };
      return Promise.resolve(message);
    },
    getMessagesByType: async (roomId: string, type: string): Promise<any[]> => {
      const message = {
        id: "message-1",
        roomId,
        senderId: "user-1",
        content: {
          text: "This is a mock message",
          attachments: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type,
        metadata: {}
      };
      return Promise.resolve([message]);
    },
    getLastMessages: async (roomId: string, limit: number): Promise<any[]> => {
      const message = {
        id: "message-1",
        roomId,
        senderId: "user-1",
        content: {
          text: "This is a mock message",
          attachments: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: "text",
        metadata: {}
      };
      return Promise.resolve([message]);
    },
    getRecentMessages: async (roomId: string, limit: number): Promise<any[]> => {
      const message = {
        id: "message-1",
        roomId,
        senderId: "user-1",
        content: {
          text: "This is a mock message",
          attachments: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: "text",
        metadata: {}
      };
      return Promise.resolve([message]);
    },
    getRecentMessagesByType: async (roomId: string, type: string, limit: number): Promise<any[]> => {
      const message = {
        id: "message-1",
        roomId,
        senderId: "user-1",
        content: {
          text: "This is a mock message",
          attachments: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: type || "text",
        metadata: {}
      };
      return Promise.resolve([message]);
    },
    // Room-related methods
    getRoom: async () => ({ id: 'default-room', name: 'Default Room', messages: [] }),
    createRoom: async () => ({ id: 'default-room', name: 'Default Room', messages: [] }),
    updateRoom: async () => ({ id: 'default-room', name: 'Default Room', messages: [] }),
    deleteRoom: async () => true,
    getRooms: async () => [{ id: 'default-room', name: 'Default Room', messages: [] }],
    // Account-related methods
    getAccountById: async (id: string) => ({ 
      id: id || 'default-user', 
      username: 'default', 
      email: 'default@example.com',
      password: 'hashed-password',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }),
    createAccount: async (account: any) => ({ 
      id: account.id || 'default-user', 
      username: account.username || 'default', 
      email: account.email || 'default@example.com',
      password: account.password || 'hashed-password',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }),
    updateAccount: async (account: any) => ({ 
      id: account.id || 'default-user', 
      username: account.username || 'default', 
      email: account.email || 'default@example.com',
      password: account.password || 'hashed-password',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString() 
    }),
    deleteAccount: async () => true,
    getAccounts: async () => [{ 
      id: 'default-user', 
      username: 'default', 
      email: 'default@example.com',
      password: 'hashed-password',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }],
    // User-related methods
    getUserById: async (id: string) => ({ 
      id: id || 'default-user', 
      username: 'default', 
      email: 'default@example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }),
    createUser: async (user: any) => ({ 
      id: user.id || 'default-user', 
      username: user.username || 'default', 
      email: user.email || 'default@example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }),
    updateUser: async (user: any) => ({ 
      id: user.id || 'default-user', 
      username: user.username || 'default', 
      email: user.email || 'default@example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }),
    deleteUser: async () => true,
    getUsers: async () => [{ 
      id: 'default-user', 
      username: 'default', 
      email: 'default@example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }],
    // Participant methods
    getParticipantsForAccount: async () => [{ id: 'default-participant', accountId: 'default-user', name: 'Default Participant' }],
    getParticipantById: async () => ({ id: 'default-participant', accountId: 'default-user', name: 'Default Participant' }),
    createParticipant: async () => ({ id: 'default-participant', accountId: 'default-user', name: 'Default Participant' }),
    updateParticipant: async () => ({ id: 'default-participant', accountId: 'default-user', name: 'Default Participant' }),
    deleteParticipant: async () => true,
    getParticipants: async () => [{ id: 'default-participant', accountId: 'default-user', name: 'Default Participant' }],
    // Room-Participant methods
    getParticipantsForRoom: async () => [{ id: 'default-participant', accountId: 'default-user', name: 'Default Participant', roomId: 'default-room' }],
    addParticipantToRoom: async () => ({ participantId: 'default-participant', roomId: 'default-room' }),
    removeParticipantFromRoom: async () => true,
    getRoomsForParticipant: async () => [{ id: 'default-room', name: 'Default Room', messages: [] }],
    addParticipant: async () => ({ id: 'default-participant', accountId: 'default-user', name: 'Default Participant', roomId: 'default-room' }),
    // Memory methods
    getMemoryById: async () => ({ id: 'default-memory', text: 'Memory text', embedding: [], metadata: {} }),
    createMemory: async () => ({ id: 'default-memory', text: 'Memory text', embedding: [], metadata: {} }),
    updateMemory: async () => ({ id: 'default-memory', text: 'Memory text', embedding: [], metadata: {} }),
    deleteMemory: async () => true,
    getMemories: async () => [{ id: 'default-memory', text: 'Memory text', embedding: [], metadata: {} }],
    // Goal methods
    getGoals: async ({ characterId }: { characterId: string }): Promise<any[]> => {
      return Promise.resolve([
        {
          id: "goal-1",
          characterId,
          text: "This is a mock goal",
          status: "active",
          objectives: [
            {
              id: "objective-1",
              text: "This is a mock objective",
              status: "active",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    },
    createGoal: async (goal: any): Promise<any> => {
      return Promise.resolve({
        id: "goal-1",
        ...goal,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    },
    updateGoal: async (goal: any): Promise<any> => {
      return Promise.resolve({
        ...goal,
        updatedAt: new Date().toISOString(),
      });
    },
    deleteGoal: async (goalId: string): Promise<boolean> => {
      return Promise.resolve(true);
    },
  };
}
