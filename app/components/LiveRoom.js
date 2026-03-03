"use client";
import { useState, useRef, useEffect } from "react";
import { Room, RoomEvent, Track } from "livekit-client";

export default function LiveRoom({ room: roomData, onClose }) {
  const { token, wsUrl, isBroadcaster, roomName } = roomData;
  const [connected, setConnected] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [level, setLevel] = useState(0);
  const [participants, setParticipants] = useState(0);
  const [muted, setMuted] = useState(false);

  const roomRef = useRef(null);
  const rafRef = useRef(null);
  const analyserRef = useRef(null);
  const dataRef = useRef(null);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  const connect = async () => {
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;

    room.on(RoomEvent.ParticipantConnected, () => setParticipants(room.remoteParticipants.size + 1));
    room.on(RoomEvent.ParticipantDisconnected, () => setParticipants(room.remoteParticipants.size + 1));

    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind === Track.Kind.Audio) {
        const el = track.attach();
        el.autoplay = true;
        document.body.appendChild(el);
      }
    });

    await room.connect(wsUrl, token);
    setConnected(true);
    setParticipants(room.remoteParticipants.size + 1);
  };

  const startBroadcast = async () => {
    const room = roomRef.current;
    if (!room) return;
    await room.localParticipant.setMicrophoneEnabled(true);
    setBroadcasting(true);
    startMeter();
  };

  const stopBroadcast = async () => {
    const room = roomRef.current;
    if (!room) return;
    await room.localParticipant.setMicrophoneEnabled(false);
    setBroadcasting(false);
    cancelAnimationFrame(rafRef.current);
    setLevel(0);
  };

  const toggleMute = async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !muted;
    await room.localParticipant.setMicrophoneEnabled(!next);
    setMuted(next);
  };

  const startMeter = () => {
    const room = roomRef.current;
    if (!room) return;
    const pub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
    if (!pub?.track?.mediaStreamTrack) return;
    const stream = new MediaStream([pub.track.mediaStreamTrack]);
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;
    dataRef.current = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(dataRef.current);
      const avg = dataRef.current.reduce((a, b) => a + b, 0) / dataRef.current.length;
      setLevel(Math.min(100, (avg / 128) * 100));
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const disconnect = () => {
    cancelAnimationFrame(rafRef.current);
    roomRef.current?.disconnect();
  };

  const bars = 24;

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#111118", borderTop: "1px solid #ff4422", padding: "20px 24px", zIndex: 50, boxShadow: "0 -20px 60px rgba(255,68,34,0.15)" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <div style={{ fontSize: "10px", color: "#ff4422", letterSpacing: "3px" }}>🔴 {isBroadcaster ? "BROADCASTING" : "LISTENING"}</div>
            <div style={{ fontSize: "11px", color: "#444", marginTop: "2px" }}>{participants} in room</div>
          </div>
          <button onClick={() => { disconnect(); onClose(); }} style={{ background: "transparent", border: "1px solid #333", borderRadius: "6px", color: "#666", padding: "6px 14px", fontSize: "11px", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}>LEAVE</button>
        </div>

        {/* VU Meter */}
        <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "28px", marginBottom: "14px" }}>
          {Array.from({ length: bars }).map((_, i) => {
            const threshold = (i / bars) * 100;
            const lit = broadcasting && !muted && level > threshold;
            const color = i > bars * 0.8 ? "#ff3333" : i > bars * 0.6 ? "#ffaa00" : "#00e676";
            return <div key={i} style={{ flex: 1, height: `${40 + Math.sin((i / bars) * Math.PI) * 40}%`, background: lit ? color : "#1a1a28", borderRadius: "2px", transition: "background 0.04s" }} />;
          })}
        </div>

        {isBroadcaster && (
          <div style={{ display: "flex", gap: "10px" }}>
            {!broadcasting ? (
              <button onClick={startBroadcast} disabled={!connected} style={{ flex: 1, padding: "14px", background: "linear-gradient(135deg,#cc2200,#ff4422)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontFamily: "'Courier New', monospace", letterSpacing: "3px", fontWeight: "700" }}>
                🎙 GO LIVE
              </button>
            ) : (
              <>
                <button onClick={stopBroadcast} style={{ flex: 1, padding: "14px", background: "#1a1a28", border: "1px solid #333", borderRadius: "8px", color: "#666", fontSize: "13px", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}>
                  ■ STOP
                </button>
                <button onClick={toggleMute} style={{ padding: "14px 20px", background: muted ? "#2a1a00" : "#1a1a28", border: `1px solid ${muted ? "#884400" : "#333"}`, borderRadius: "8px", color: muted ? "#ff8800" : "#666", fontSize: "12px", fontFamily: "'Courier New', monospace" }}>
                  {muted ? "🔇" : "🔈"}
                </button>
              </>
            )}
          </div>
        )}

        {!isBroadcaster && (
          <div style={{ textAlign: "center", fontSize: "12px", color: "#444", letterSpacing: "2px", padding: "8px" }}>
            {connected ? "📻 TUNED IN — LISTENING LIVE" : "CONNECTING..."}
          </div>
        )}
      </div>
    </div>
  );
}
