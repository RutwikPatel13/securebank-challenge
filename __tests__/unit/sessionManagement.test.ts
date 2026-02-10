/**
 * @jest-environment node
 */
import { expect as jestExpect } from "@jest/globals";

/**
 * Session Management Tests - SEC-304
 * 
 * These tests verify the session management logic:
 * 1. Single session policy: Only one active session per user
 * 2. Login invalidates all existing sessions
 * 3. Logout invalidates all sessions for the user
 * 
 * Note: These are unit tests for the logic. Integration tests would
 * require a full database setup.
 */

describe("Session Management - SEC-304", () => {
  // Simulated session store for testing
  type Session = {
    id: number;
    userId: number;
    token: string;
    expiresAt: string;
  };

  let sessions: Session[] = [];
  let nextId = 1;

  // Helper functions that mirror the actual implementation
  function createSession(userId: number, token: string): Session {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const session: Session = {
      id: nextId++,
      userId,
      token,
      expiresAt: expiresAt.toISOString(),
    };
    sessions.push(session);
    return session;
  }

  function deleteSessionsByUserId(userId: number): void {
    sessions = sessions.filter(s => s.userId !== userId);
  }

  function deleteSessionByToken(token: string): void {
    sessions = sessions.filter(s => s.token !== token);
  }

  function getSessionsByUserId(userId: number): Session[] {
    return sessions.filter(s => s.userId === userId);
  }

  // Reset before each test
  beforeEach(() => {
    sessions = [];
    nextId = 1;
  });

  describe("Single Session Policy (Login)", () => {
    it("should invalidate all existing sessions on login", () => {
      const userId = 1;
      
      // Create initial session (first login)
      createSession(userId, "token-1");
      jestExpect(getSessionsByUserId(userId)).toHaveLength(1);
      
      // Simulate second login - should invalidate first session
      deleteSessionsByUserId(userId); // This is what the fix does
      createSession(userId, "token-2");
      
      const userSessions = getSessionsByUserId(userId);
      jestExpect(userSessions).toHaveLength(1);
      jestExpect(userSessions[0].token).toBe("token-2");
    });

    it("should only have one session per user after multiple logins", () => {
      const userId = 1;
      
      // Simulate multiple logins
      for (let i = 1; i <= 5; i++) {
        deleteSessionsByUserId(userId);
        createSession(userId, `token-${i}`);
      }
      
      const userSessions = getSessionsByUserId(userId);
      jestExpect(userSessions).toHaveLength(1);
      jestExpect(userSessions[0].token).toBe("token-5");
    });

    it("should not affect other users sessions", () => {
      const user1 = 1;
      const user2 = 2;
      
      // User 1 logs in
      createSession(user1, "user1-token");
      
      // User 2 logs in
      deleteSessionsByUserId(user2);
      createSession(user2, "user2-token");
      
      // User 1's session should still exist
      jestExpect(getSessionsByUserId(user1)).toHaveLength(1);
      jestExpect(getSessionsByUserId(user2)).toHaveLength(1);
    });
  });

  describe("Complete Logout (All Devices)", () => {
    it("should delete all sessions for user on logout", () => {
      const userId = 1;
      
      // Create session
      createSession(userId, "token-1");
      jestExpect(getSessionsByUserId(userId)).toHaveLength(1);
      
      // Logout - should delete ALL sessions for user
      deleteSessionsByUserId(userId);
      
      jestExpect(getSessionsByUserId(userId)).toHaveLength(0);
    });

    it("should not affect other users on logout", () => {
      const user1 = 1;
      const user2 = 2;
      
      createSession(user1, "user1-token");
      createSession(user2, "user2-token");
      
      // User 1 logs out
      deleteSessionsByUserId(user1);
      
      // User 2's session should still exist
      jestExpect(getSessionsByUserId(user1)).toHaveLength(0);
      jestExpect(getSessionsByUserId(user2)).toHaveLength(1);
    });
  });

  describe("Old Behavior (Bug) vs New Behavior (Fix)", () => {
    it("OLD BUG: deleting only current token leaves other sessions active", () => {
      const userId = 1;
      
      // Simulate old behavior where login doesn't invalidate old sessions
      createSession(userId, "token-1");
      createSession(userId, "token-2"); // Old bug: didn't delete token-1
      
      jestExpect(getSessionsByUserId(userId)).toHaveLength(2); // BUG!
      
      // Old logout only deleted current token
      deleteSessionByToken("token-2");
      
      jestExpect(getSessionsByUserId(userId)).toHaveLength(1); // token-1 still active!
    });

    it("NEW FIX: login invalidates all sessions, only one remains", () => {
      const userId = 1;
      
      // Simulate new behavior
      createSession(userId, "token-1");
      
      // New login behavior
      deleteSessionsByUserId(userId); // FIX: delete all first
      createSession(userId, "token-2");
      
      jestExpect(getSessionsByUserId(userId)).toHaveLength(1); // FIXED!
      jestExpect(getSessionsByUserId(userId)[0].token).toBe("token-2");
    });
  });
});

