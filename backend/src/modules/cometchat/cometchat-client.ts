import axios, { AxiosInstance, AxiosError } from 'axios';
import { env } from '../../config/env.js';
import type {
  CometChatUser,
  CreateUserParams,
  UpdateUserParams,
  CreateGroupParams,
  GroupMember,
  CometChatGroup,
} from './cometchat.types.js';

/**
 * Error class for CometChat REST API failures.
 * Wraps the underlying HTTP error with CometChat-specific context.
 */
export class CometChatApiError extends Error {
  public readonly statusCode: number | undefined;
  public readonly cometChatCode: string | undefined;
  public readonly endpoint: string;

  constructor(
    message: string,
    endpoint: string,
    statusCode?: number,
    cometChatCode?: string
  ) {
    super(message);
    this.name = 'CometChatApiError';
    this.endpoint = endpoint;
    this.statusCode = statusCode;
    this.cometChatCode = cometChatCode;
  }
}

/**
 * CometChat REST API v3 client.
 *
 * Handles HTTP communication with the CometChat platform including
 * user management, auth token generation, conversations, and groups.
 *
 * Base URL: https://{appId}.api-{region}.cometchat.io/v3/
 * Required headers: apiKey, Content-Type, Accept
 */
export interface CometChatClient {
  createAuthToken(uid: string): Promise<{ authToken: string }>;
  createUser(params: CreateUserParams): Promise<CometChatUser>;
  createUsers(params: CreateUserParams[]): Promise<CometChatUser[]>;
  updateUser(uid: string, params: UpdateUserParams): Promise<CometChatUser>;
  deleteUser(uid: string): Promise<void>;
  setUserTags(uid: string, tags: string[]): Promise<void>;
  createOneOnOneConversation(uid1: string, uid2: string): Promise<{ conversationId: string }>;
  sendMessage(receiverId: string, message: string, senderUid: string, receiverType?: 'user' | 'group'): Promise<void>;
  createGroup(params: CreateGroupParams): Promise<CometChatGroup>;
  addMembersToGroup(groupId: string, members: GroupMember[]): Promise<void>;
  deleteConversation(conversationId: string): Promise<void>;
}


/**
 * Creates and returns a CometChatClient implementation backed by axios.
 *
 * Reads configuration from environment variables:
 * - COMETCHAT_APP_ID
 * - COMETCHAT_REGION
 * - COMETCHAT_REST_API_KEY
 *
 * Throws if required env vars are missing.
 */
export function createCometChatClient(): CometChatClient {
  const appId = env.COMETCHAT_APP_ID;
  const region = env.COMETCHAT_REGION;
  const apiKey = env.COMETCHAT_REST_API_KEY;

  if (!appId || !region || !apiKey) {
    throw new Error(
      'CometChat configuration missing. Set COMETCHAT_APP_ID, COMETCHAT_REGION, and COMETCHAT_REST_API_KEY environment variables.'
    );
  }

  const baseURL = `https://${appId}.api-${region}.cometchat.io/v3`;

  const http: AxiosInstance = axios.create({
    baseURL,
    headers: {
      apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: 10_000,
  });

  // Request logging
  http.interceptors.request.use((config) => {
    console.log(`[CometChat] → ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  });

  // Response logging
  http.interceptors.response.use(
    (response) => {
      console.log(
        `[CometChat] ← ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`
      );
      return response;
    },
    (error: AxiosError) => {
      const status = error.response?.status;
      const url = error.config?.url ?? 'unknown';
      console.error(
        `[CometChat] ✗ ${status ?? 'NETWORK_ERROR'} ${error.config?.method?.toUpperCase()} ${url}`,
        error.response?.data ?? error.message
      );
      return Promise.reject(error);
    }
  );

  /**
   * Wraps an axios call with CometChat-specific error handling.
   */
  function wrapError(error: unknown, endpoint: string): never {
    if (error instanceof AxiosError) {
      const data = error.response?.data as Record<string, unknown> | undefined;
      const message =
        (data?.error as Record<string, unknown>)?.message as string ??
        error.message;
      const code = (data?.error as Record<string, unknown>)?.code as string | undefined;
      throw new CometChatApiError(
        message,
        endpoint,
        error.response?.status,
        code
      );
    }
    throw new CometChatApiError(
      error instanceof Error ? error.message : 'Unknown CometChat API error',
      endpoint
    );
  }

  return {
    async createAuthToken(uid: string): Promise<{ authToken: string }> {
      const endpoint = `/users/${uid}/auth_tokens`;
      try {
        const response = await http.post(endpoint, { force: true });
        return { authToken: response.data.data.authToken };
      } catch (error) {
        throw wrapError(error, endpoint);
      }
    },

    async createUser(params: CreateUserParams): Promise<CometChatUser> {
      const endpoint = '/users';
      try {
        const response = await http.post(endpoint, {
          uid: params.uid,
          name: params.name,
          ...(params.avatar && { avatar: params.avatar }),
          ...(params.metadata && { metadata: params.metadata }),
          ...(params.tags && { tags: params.tags }),
        });
        return response.data.data as CometChatUser;
      } catch (error) {
        throw wrapError(error, endpoint);
      }
    },

    async createUsers(params: CreateUserParams[]): Promise<CometChatUser[]> {
      const endpoint = '/users';
      try {
        // CometChat bulk API accepts an array of user objects
        const response = await http.post(endpoint, params.map((p) => ({
          uid: p.uid,
          name: p.name,
          ...(p.avatar && { avatar: p.avatar }),
          ...(p.metadata && { metadata: p.metadata }),
          ...(p.tags && { tags: p.tags }),
        })));
        const data = response.data.data;
        // Bulk response may be an array or wrapped in an object
        return Array.isArray(data) ? data : [data];
      } catch (error) {
        throw wrapError(error, `${endpoint} (batch)`);
      }
    },

    async updateUser(uid: string, params: UpdateUserParams): Promise<CometChatUser> {
      const endpoint = `/users/${uid}`;
      try {
        const response = await http.put(endpoint, {
          ...(params.name && { name: params.name }),
          ...(params.avatar && { avatar: params.avatar }),
          ...(params.metadata && { metadata: params.metadata }),
          ...(params.tags && { tags: params.tags }),
        });
        return response.data.data as CometChatUser;
      } catch (error) {
        throw wrapError(error, endpoint);
      }
    },

    async deleteUser(uid: string): Promise<void> {
      const endpoint = `/users/${uid}`;
      try {
        await http.delete(endpoint);
      } catch (error) {
        throw wrapError(error, endpoint);
      }
    },

    async setUserTags(uid: string, tags: string[]): Promise<void> {
      const endpoint = `/users/${uid}`;
      try {
        await http.put(endpoint, { tags });
      } catch (error) {
        throw wrapError(error, endpoint);
      }
    },

    async createOneOnOneConversation(
      uid1: string,
      uid2: string
    ): Promise<{ conversationId: string }> {
      // CometChat creates a 1:1 conversation implicitly when the first message
      // is sent. We send an initial system message from uid1 to uid2 to establish
      // the conversation, then return the conversation ID.
      const endpoint = '/messages';
      try {
        const response = await http.post(
          endpoint,
          {
            receiver: uid2,
            receiverType: 'user',
            type: 'text',
            category: 'message',
            data: {
              text: 'Conversation started',
            },
          },
          {
            headers: {
              onBehalfOf: uid1,
            },
          }
        );
        const conversationId = response.data.data.conversationId;
        return { conversationId };
      } catch (error) {
        throw wrapError(error, endpoint);
      }
    },

    async sendMessage(
      receiverId: string,
      message: string,
      senderUid: string,
      receiverType: 'user' | 'group' = 'user'
    ): Promise<void> {
      const endpoint = '/messages';
      try {
        await http.post(
          endpoint,
          {
            receiver: receiverId,
            receiverType,
            type: 'text',
            category: 'message',
            data: {
              text: message,
            },
          },
          {
            headers: {
              onBehalfOf: senderUid,
            },
          }
        );
      } catch (error) {
        throw wrapError(error, endpoint);
      }
    },

    async createGroup(params: CreateGroupParams): Promise<CometChatGroup> {
      const endpoint = '/groups';
      try {
        const response = await http.post(endpoint, {
          guid: params.guid,
          name: params.name,
          type: params.type,
          ...(params.metadata && { metadata: params.metadata }),
          ...(params.tags && { tags: params.tags }),
          ...(params.members && { members: params.members }),
        });
        return response.data.data as CometChatGroup;
      } catch (error) {
        throw wrapError(error, endpoint);
      }
    },

    async addMembersToGroup(groupId: string, members: GroupMember[]): Promise<void> {
      const endpoint = `/groups/${groupId}/members`;
      try {
        const participants: string[] = [];
        const moderators: string[] = [];
        const admins: string[] = [];

        for (const member of members) {
          switch (member.scope) {
            case 'admin':
              admins.push(member.uid);
              break;
            case 'moderator':
              moderators.push(member.uid);
              break;
            case 'participant':
            default:
              participants.push(member.uid);
              break;
          }
        }

        const body: Record<string, string[]> = {};
        if (participants.length > 0) body.participants = participants;
        if (moderators.length > 0) body.moderators = moderators;
        if (admins.length > 0) body.admins = admins;

        await http.post(endpoint, body);
      } catch (error) {
        throw wrapError(error, endpoint);
      }
    },

    async deleteConversation(conversationId: string): Promise<void> {
      // CometChat REST API v3: DELETE /v3/conversations/{conversationId}
      // This ends/deletes the conversation on the platform.
      const endpoint = `/conversations/${conversationId}`;
      try {
        await http.delete(endpoint);
      } catch (error) {
        throw wrapError(error, endpoint);
      }
    },
  };
}

// Singleton instance (lazy initialization)
let clientInstance: CometChatClient | null = null;

/**
 * Returns the singleton CometChatClient instance.
 * Creates it on first access. Throws if env vars are not configured.
 */
export function getCometChatClient(): CometChatClient {
  if (!clientInstance) {
    clientInstance = createCometChatClient();
  }
  return clientInstance;
}

/**
 * Resets the singleton instance (useful for testing).
 */
export function resetCometChatClient(): void {
  clientInstance = null;
}
