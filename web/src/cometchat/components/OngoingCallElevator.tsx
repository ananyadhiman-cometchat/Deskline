import { useEffect, useRef, useState } from "react";
import { Phone, MessageSquare } from "lucide-react";

// ============================================================
// OngoingCallElevator — DOM reparenting for ongoing call UI
// ============================================================
// Problem: CometChat renders the ongoing-call UI inside the
// CometChatMessageHeader which is inside the .ticket-chat-section.
// That container has overflow:hidden and a fixed height, so the
// call UI gets clipped/trapped inside.
//
// Solution: Use MutationObserver to detect when .cometchat-ongoing-call
// appears in the DOM, then physically move it into a portal overlay
// that covers the ticket-chat-section area. The user can toggle
// between the call view and the chat view.
//
// On call end: clears the overlay, hides the toggle button, and
// navigates back to the ticket page (user stays on same page — 
// just the overlay is removed).

export function OngoingCallElevator() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [callActive, setCallActive] = useState(false);
  const [showCall, setShowCall] = useState(true);
  const observerRef = useRef<MutationObserver | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    observerRef.current = new MutationObserver(() => {
      const ongoingCall = document.querySelector(
        '[class*="cometchat-ongoing-call"], [class*="cometchat__ongoing-call"], [class*="cc-ongoing-call"]'
      );

      if (ongoingCall && !overlay.contains(ongoingCall)) {
        // Move the call element into our overlay
        overlay.appendChild(ongoingCall);
        setCallActive(true);
        setShowCall(true);

        // Start polling for call end
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = window.setInterval(() => {
          // Check if the call iframe/element still exists inside our overlay
          const iframes = overlay.querySelectorAll("iframe");
          const callEls = overlay.querySelectorAll(
            '[class*="cometchat-ongoing-call"], [class*="cometchat__ongoing-call"], [class*="cc-ongoing-call"]'
          );

          // Call ended when: no iframes AND (no call elements OR call element is empty)
          const isCallEnded = iframes.length === 0 && 
            (callEls.length === 0 || (callEls.length > 0 && callEls[0].children.length === 0));

          if (isCallEnded) {
            // Clean up the overlay content
            overlay.innerHTML = "";
            setCallActive(false);
            setShowCall(true);
            if (pollRef.current) clearInterval(pollRef.current);
          }
        }, 500);
      }
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observerRef.current?.disconnect();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  return (
    <>
      {/* The call overlay — covers the full viewport when call is active */}
      <div
        ref={overlayRef}
        className="ongoing-call-elevator"
        style={{ display: callActive && showCall ? "block" : "none" }}
      />

      {/* Toggle button — ONLY visible when call is actively ongoing */}
      {callActive && (
        <div className="fixed bottom-6 right-6 z-[10000] flex gap-2">
          <button
            onClick={() => setShowCall(!showCall)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-red)] text-white text-xs font-bold uppercase tracking-wider shadow-lg hover:bg-[#e63d4b] transition-colors"
            title={showCall ? "Show chat" : "Show call"}
          >
            {showCall ? (
              <>
                <MessageSquare size={14} />
                Show Chat
              </>
            ) : (
              <>
                <Phone size={14} />
                Show Call
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}
