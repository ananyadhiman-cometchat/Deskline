import { useEffect, useState, useCallback } from "react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { Mic, Video, ShieldAlert } from "lucide-react";

// ============================================================
// CallPermissionGate — Media permission prompt on call start/join
// ============================================================
// Listens for outgoing call initiation and incoming call acceptance.
// When a call event fires, checks if mic/camera permissions are granted.
// If not, shows a prompt and requests them before the call proceeds.

export function CallPermissionGate() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [denied, setDenied] = useState(false);

  const requestPermissions = useCallback(async () => {
    setShowPrompt(true);
    setDenied(false);
  }, []);

  // Listen for call events — trigger permission check when a call starts
  useEffect(() => {
    const LISTENER_ID = "CALL_PERMISSION_GATE_LISTENER";

    CometChat.addCallListener(
      LISTENER_ID,
      new CometChat.CallListener({
        onOutgoingCallAccepted: () => {
          // User's outgoing call was accepted — they need mic/camera
          checkAndPrompt();
        },
        onIncomingCallReceived: () => {
          // Incoming call — prompt now so permissions are ready when they accept
          checkAndPrompt();
        },
      })
    );

    // Also listen for when the user clicks call buttons (outgoing)
    // CometChat fires this before the call connects
    CometChat.addMessageListener(
      LISTENER_ID + "_MSG",
      new CometChat.MessageListener({
        onCustomMessageReceived: (message: CometChat.CustomMessage) => {
          // Meeting (group call) started — prompt if joining
          if (message.getType() === "meeting") {
            checkAndPrompt();
          }
        },
      })
    );

    async function checkAndPrompt() {
      try {
        // Quick check if permissions are already granted
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        stream.getTracks().forEach((t) => t.stop());
        // Already granted — no prompt needed
      } catch {
        // Not granted — show our prompt
        requestPermissions();
      }
    }

    return () => {
      CometChat.removeCallListener(LISTENER_ID);
      CometChat.removeMessageListener(LISTENER_ID + "_MSG");
    };
  }, [requestPermissions]);

  const handleAllow = async () => {
    setRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      stream.getTracks().forEach((t) => t.stop());
      setShowPrompt(false);
    } catch (err) {
      console.warn("[CallPermissionGate] Permission denied:", err);
      setDenied(true);
    } finally {
      setRequesting(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60">
      <div
        className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl max-w-sm w-full mx-4"
        role="dialog"
        aria-labelledby="call-perm-title"
      >
        {!denied ? (
          <>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 bg-[rgba(255,70,85,0.1)] text-[var(--color-brand-red)]">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h4
                  id="call-perm-title"
                  className="text-sm font-bold text-[var(--theme-text-main)] mb-1"
                >
                  Allow Camera &amp; Microphone
                </h4>
                <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                  To join this call, DeskLine needs access to your camera and
                  microphone. Click Allow when prompted by your browser.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={handleAllow}
                disabled={requesting}
                className="btn btn-primary btn-sm flex-1"
              >
                <Mic size={14} />
                <Video size={14} />
                {requesting ? "Requesting…" : "Allow Access"}
              </button>
              <button
                onClick={handleDismiss}
                className="btn btn-ghost btn-sm"
              >
                Skip
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 bg-[rgba(255,70,85,0.1)] text-[var(--color-brand-red)]">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--theme-text-main)] mb-1">
                  Permissions Blocked
                </h4>
                <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                  Camera/microphone access was denied. To use calls, click the
                  lock/site-settings icon in your browser's address bar, allow
                  camera &amp; microphone, then refresh.
                </p>
              </div>
            </div>
            <div className="mt-5">
              <button onClick={handleDismiss} className="btn btn-ghost btn-sm w-full">
                Dismiss
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
