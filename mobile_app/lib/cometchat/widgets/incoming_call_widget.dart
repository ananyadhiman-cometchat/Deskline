import 'package:cometchat_calls_sdk/cometchat_calls_sdk.dart';
import 'package:cometchat_chat_uikit/cometchat_chat_uikit.dart';
import 'package:flutter/material.dart';

/// Global navigator key for call navigation.
///
/// This key must be set on `MaterialApp.navigatorKey` so that call overlays
/// can navigate regardless of the current route. Uses a plain
/// `GlobalKey<NavigatorState>` (the 5.x SDK does not provide
/// CallNavigationContext — that's a 4.x-kit symbol).
///
/// Requirements: 7.2, 7.3
final callNavigatorKey = GlobalKey<NavigatorState>();

/// Incoming call widget that listens for CometChat call events at the app root.
///
/// Must be mounted at the MaterialApp level (above all route-specific screens)
/// so incoming calls ring regardless of the user's current page. Uses the
/// Chat SDK CallListener for incoming call signaling, then joins the WebRTC
/// session via the 5.x Calls SDK on acceptance.
///
/// Requirements: 7.2, 7.4
class IncomingCallWidget extends StatefulWidget {
  /// The child widget tree (typically the app's main content).
  final Widget child;

  const IncomingCallWidget({
    super.key,
    required this.child,
  });

  @override
  State<IncomingCallWidget> createState() => _IncomingCallWidgetState();
}

class _IncomingCallWidgetState extends State<IncomingCallWidget>
    implements CallListener {
  static const _listenerId = 'deskline-incoming-call-listener';

  Call? _incomingCall;
  bool _isAccepting = false;

  @override
  void initState() {
    super.initState();
    CometChat.addCallListener(_listenerId, this);
  }

  @override
  void dispose() {
    CometChat.removeCallListener(_listenerId);
    super.dispose();
  }

  // ─── CallListener callbacks ───────────────────────────────────

  @override
  void onIncomingCallReceived(Call call) {
    if (!mounted) return;
    setState(() => _incomingCall = call);
  }

  @override
  void onOutgoingCallAccepted(Call call) {
    // Handled by the outgoing call screen
  }

  @override
  void onOutgoingCallRejected(Call call) {
    // Handled by the outgoing call screen
  }

  @override
  void onIncomingCallCancelled(Call call) {
    if (!mounted) return;
    setState(() => _incomingCall = null);
  }

  @override
  void onCallEndedMessageReceived(Call call) {
    if (!mounted) return;
    setState(() => _incomingCall = null);
  }

  // ─── Call actions ─────────────────────────────────────────────

  /// Accept the incoming call: tell the Chat SDK, then join the WebRTC session.
  Future<void> _acceptCall() async {
    final call = _incomingCall;
    if (call == null || _isAccepting) return;

    setState(() => _isAccepting = true);

    CometChat.acceptCall(
      call.sessionId!,
      onSuccess: (Call acceptedCall) {
        if (!mounted) return;
        setState(() {
          _incomingCall = null;
          _isAccepting = false;
        });
        // Navigate to ongoing call screen using the root navigator
        callNavigatorKey.currentState?.push(
          MaterialPageRoute(
            builder: (_) => _AcceptedCallScreen(
              sessionId: acceptedCall.sessionId!,
              isVideo: acceptedCall.type == CometChatCallType.video,
              callerName: acceptedCall.sender?.name ?? 'Unknown',
            ),
          ),
        );
      },
      onError: (CometChatException e) {
        if (!mounted) return;
        setState(() => _isAccepting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to accept call: ${e.message ?? "Unknown error"}'),
          ),
        );
      },
    );
  }

  /// Decline the incoming call.
  void _declineCall() {
    final call = _incomingCall;
    if (call == null) return;

    CometChat.rejectCall(
      call.sessionId!,
      CometChatCallStatus.rejected,
      onSuccess: (Call rejectedCall) {
        if (!mounted) return;
        setState(() => _incomingCall = null);
      },
      onError: (CometChatException e) {
        if (!mounted) return;
        setState(() => _incomingCall = null);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        // Incoming call overlay
        if (_incomingCall != null)
          _IncomingCallOverlay(
            call: _incomingCall!,
            isAccepting: _isAccepting,
            onAccept: _acceptCall,
            onDecline: _declineCall,
          ),
      ],
    );
  }
}

/// Full-screen overlay shown when an incoming call is received.
///
/// Displays caller information with accept and decline buttons.
/// Times out after 30 seconds (handled by CometChat platform —
/// the call is auto-cancelled if not answered).
///
/// Requirements: 7.2, 7.4
class _IncomingCallOverlay extends StatelessWidget {
  final Call call;
  final bool isAccepting;
  final VoidCallback onAccept;
  final VoidCallback onDecline;

  const _IncomingCallOverlay({
    required this.call,
    required this.isAccepting,
    required this.onAccept,
    required this.onDecline,
  });

  @override
  Widget build(BuildContext context) {
    final callerName = call.sender?.name ?? 'Unknown Caller';
    final isVideo = call.type == CometChatCallType.video;
    final callTypeLabel = isVideo ? 'Video Call' : 'Voice Call';

    return Positioned.fill(
      child: Material(
        color: Colors.black87,
        child: SafeArea(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(flex: 2),
              // Call type icon
              Icon(
                isVideo ? Icons.videocam : Icons.phone,
                color: Colors.white70,
                size: 48,
              ),
              const SizedBox(height: 16),
              // Incoming call label
              Text(
                'Incoming $callTypeLabel',
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 12),
              // Caller name
              Text(
                callerName,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
              ),
              const Spacer(flex: 3),
              // Accept / Decline buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Decline button
                  Semantics(
                    button: true,
                    label: 'Decline call',
                    child: GestureDetector(
                      onTap: onDecline,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 64,
                            height: 64,
                            decoration: const BoxDecoration(
                              color: Colors.red,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.call_end,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Decline',
                            style: TextStyle(color: Colors.white70, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 80),
                  // Accept button
                  Semantics(
                    button: true,
                    label: 'Accept call',
                    child: GestureDetector(
                      onTap: isAccepting ? null : onAccept,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 64,
                            height: 64,
                            decoration: const BoxDecoration(
                              color: Colors.green,
                              shape: BoxShape.circle,
                            ),
                            child: isAccepting
                                ? const SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Icon(
                                    Icons.call,
                                    color: Colors.white,
                                    size: 28,
                                  ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Accept',
                            style: TextStyle(color: Colors.white70, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const Spacer(flex: 1),
            ],
          ),
        ),
      ),
    );
  }
}

/// Screen shown after accepting an incoming call.
/// Joins the WebRTC session and renders call controls.
///
/// This reuses the same ongoing-call pattern as outgoing calls,
/// with mute, camera toggle, and end call controls.
class _AcceptedCallScreen extends StatefulWidget {
  final String sessionId;
  final bool isVideo;
  final String callerName;

  const _AcceptedCallScreen({
    required this.sessionId,
    required this.isVideo,
    required this.callerName,
  });

  @override
  State<_AcceptedCallScreen> createState() => _AcceptedCallScreenState();
}

class _AcceptedCallScreenState extends State<_AcceptedCallScreen> {
  Widget? _callWidget;
  bool _isMuted = false;
  bool _isCameraOff = false;
  bool _isJoining = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _joinSession();
  }

  void _joinSession() {
    final settings = (SessionSettingsBuilder()
          ..startAudioMuted(false)
          ..startVideoPaused(!widget.isVideo))
        .build();

    CometChatCalls.joinSession(
      sessionId: widget.sessionId,
      sessionSettings: settings,
      onSuccess: (Widget? callWidget) {
        if (!mounted) return;
        setState(() {
          _callWidget = callWidget;
          _isJoining = false;
        });
      },
      onError: (CometChatCallsException e) {
        if (!mounted) return;
        setState(() {
          _error = e.message ?? 'Failed to join call session';
          _isJoining = false;
        });
      },
    );
  }

  void _toggleMute() {
    final session = CallSession.getInstance();
    if (session == null) return;

    if (_isMuted) {
      session.unMuteAudio();
    } else {
      session.muteAudio();
    }
    setState(() => _isMuted = !_isMuted);
  }

  void _toggleCamera() {
    final session = CallSession.getInstance();
    if (session == null) return;

    if (_isCameraOff) {
      session.resumeVideo();
    } else {
      session.pauseVideo();
    }
    setState(() => _isCameraOff = !_isCameraOff);
  }

  Future<void> _endCall() async {
    // Leave the WebRTC session
    await CallSession.getInstance()?.leaveSession();

    // End the call in CometChat's signaling system so it's no longer "ongoing"
    try {
      CometChat.endCall(
        widget.sessionId,
        onSuccess: (Call call) {
          debugPrint('[AcceptedCall] ✓ CometChat.endCall succeeded');
        },
        onError: (CometChatException e) {
          // Non-fatal: the call may already be ended by the other party
          debugPrint('[AcceptedCall] endCall error (non-fatal): ${e.message}');
        },
      );
    } catch (e) {
      debugPrint('[AcceptedCall] endCall exception (non-fatal): $e');
    }

    if (mounted) {
      Navigator.of(context, rootNavigator: true).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      resizeToAvoidBottomInset: false,
      body: SafeArea(
        child: Stack(
          children: [
            // Call view
            if (_isJoining)
              const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: Colors.white),
                    SizedBox(height: 16),
                    Text(
                      'Joining call...',
                      style: TextStyle(color: Colors.white, fontSize: 16),
                    ),
                  ],
                ),
              )
            else if (_error != null)
              Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline, color: Colors.red, size: 48),
                    const SizedBox(height: 16),
                    Text(
                      _error!,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () => Navigator.of(context, rootNavigator: true).pop(),
                      child: const Text('Close'),
                    ),
                  ],
                ),
              )
            else if (_callWidget != null)
              SizedBox.expand(child: _callWidget),

            // Call controls overlay
            if (!_isJoining && _error == null)
              Positioned(
                left: 0,
                right: 0,
                bottom: 32,
                child: _AcceptedCallControls(
                  isMuted: _isMuted,
                  isCameraOff: _isCameraOff,
                  onToggleMute: _toggleMute,
                  onToggleCamera: _toggleCamera,
                  onEndCall: _endCall,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Call controls for the accepted call screen.
class _AcceptedCallControls extends StatelessWidget {
  final bool isMuted;
  final bool isCameraOff;
  final VoidCallback onToggleMute;
  final VoidCallback onToggleCamera;
  final VoidCallback onEndCall;

  const _AcceptedCallControls({
    required this.isMuted,
    required this.isCameraOff,
    required this.onToggleMute,
    required this.onToggleCamera,
    required this.onEndCall,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Mute button
        Semantics(
          button: true,
          label: isMuted ? 'Unmute microphone' : 'Mute microphone',
          child: GestureDetector(
            onTap: onToggleMute,
            child: Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: isMuted ? Colors.white : Colors.white24,
                shape: BoxShape.circle,
              ),
              child: Icon(
                isMuted ? Icons.mic_off : Icons.mic,
                color: isMuted ? Colors.black : Colors.white,
                size: 24,
              ),
            ),
          ),
        ),
        const SizedBox(width: 20),
        // End call button
        Semantics(
          button: true,
          label: 'End call',
          child: GestureDetector(
            onTap: onEndCall,
            child: Container(
              width: 64,
              height: 64,
              decoration: const BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.call_end,
                color: Colors.white,
                size: 28,
              ),
            ),
          ),
        ),
        const SizedBox(width: 20),
        // Camera toggle button
        Semantics(
          button: true,
          label: isCameraOff ? 'Turn camera on' : 'Turn camera off',
          child: GestureDetector(
            onTap: onToggleCamera,
            child: Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: isCameraOff ? Colors.white : Colors.white24,
                shape: BoxShape.circle,
              ),
              child: Icon(
                isCameraOff ? Icons.videocam_off : Icons.videocam,
                color: isCameraOff ? Colors.black : Colors.white,
                size: 24,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
