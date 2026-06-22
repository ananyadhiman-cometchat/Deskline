import { useCallback, useState } from "react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { logCometChatError, formatCometChatError } from "../errors";
import { useUIStore } from "@/store/uiStore";

// ============================================================
// useCometChatCall — Call initiation helpers
// ============================================================
// Provides functions to initiate audio/video calls in Ringing Mode.
// The callee receives an incoming call notification via
// CometChatIncomingCall (mounted at app root).
//
// Usage:
//   const { initiateCall, isCallInProgress, error } = useCometChatCall();
//   await initiateCall(receiverUid, "audio");

export type CallType = "audio" | "video";

interface UseCometChatCallReturn {
  /** Initiate a call to the given user UID */
  initiateCall: (receiverUid: string, type: CallType) => Promise<void>;
  /** Whether a call is currently being initiated */
  isCallInProgress: boolean;
  /** Error message from the last failed call attempt */
  error: string | null;
  /** Clear any active error state */
  clearError: () => void;
}

/**
 * Hook providing call initiation helpers for CometChat Ringing Mode.
 *
 * - Initiates a 1:1 call to a user by UID
 * - Handles call initiation errors with formatted messages and toast notifications
 * - Tracks in-progress state to prevent duplicate calls
 */
export function useCometChatCall(): UseCometChatCallReturn {
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const initiateCall = useCallback(
    async (receiverUid: string, type: CallType) => {
      if (isCallInProgress) return;

      setIsCallInProgress(true);
      setError(null);

      try {
        const callType =
          type === "audio"
            ? CometChat.CALL_TYPE.AUDIO
            : CometChat.CALL_TYPE.VIDEO;

        const receiverType = CometChat.RECEIVER_TYPE.USER;

        const call = new CometChat.Call(
          receiverUid,
          callType,
          receiverType
        );

        await CometChat.initiateCall(call);
      } catch (e) {
        const formatted = formatCometChatError(e);
        logCometChatError(e);
        setError(formatted);

        useUIStore.getState().showToast({
          type: "error",
          title: "Call Failed",
          message: formatted,
        });
      } finally {
        setIsCallInProgress(false);
      }
    },
    [isCallInProgress]
  );

  return {
    initiateCall,
    isCallInProgress,
    error,
    clearError,
  };
}
