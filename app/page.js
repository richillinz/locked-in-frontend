"use client";
import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import AuthModal from "./components/AuthModal";
import AuctionSlot from "./components/AuctionSlot";
import LiveRoom from "./components/LiveRoom";
import { io } from "socket.io-client";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const auth = useAuth();
  const user = auth?.user || null;
  const token = auth?.token || null;
  const logout = auth?.logout || (() => {});

  const [slots, setSlots] = useState([]);
  const [showAuth, setShowAuth] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);
  const [socket, setSocket] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const s = io(API);
    setSocket(s);
    fetchSlots();
    const interval = setInterval(fetchSlots, 30000);
    return () => { s.disconnect(); clearInterval(interval); };
  }, []);

  const fetchSlots = async () => {
    try {
      const res = await fetch(`${API}/api/auction/slots`);
      const data = await res.json();
      setSlots(data);
    } catch (e) { console.error(e); }
  };

  const handleBid = async (slotId, amount) => {
    if (!user) return setShowAuth(true);
    try {
      const res = await fetch(`${API}/api/auction/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slotId, amount }),
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else fetchSlots();
    } catch (e) { alert("Bid failed"); }
  };

  const handleJoin = async (slotId) => {
    if (!user) return setShowAuth(true);
    try {
      const res = await fetch(`${API}/api/livekit/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slotId }),
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else setActiveRoom(data);
    } catch (e) { alert("Failed to join"); }
  };

  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#080810" }}>
      <header style={{ borderBottom: "1px solid #1a1a2e", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "22px", fontWeight: "900", letterSpacing: "4px", color: "#fff" }}>LOCKED-IN</div>
          <div style={{ fontSize: "10px", color: "#444", letterSpacing: "3px" }}>OWN THE FREQUENCY</div>
        </div>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "12px", color: "#ff4422" }}>@{user.username}</span>
            <button onClick={logout} style={{ padding: "6px 14px", background: "transparent", border: "1px solid #333", borderRadius: "6px", color: "#666", fontSize: "11px", letterSpacing: "2px", fontFamily: "'Courier New', monospace" }}>LOGOUT</button>
          </div>
        ) : (
          <button onClick={() => setShowAuth(true)} style={{ padding: "8px 20px", background: "#ff4422", border: "none", borderRadius: "6px", color: "#fff", fontSize: "12px", letterSpacing: "2px", fontFamily: "'Courier New', monospace" }}>LOGIN</button>
        )}
      </header>

      {activeRoom && <LiveRoom room={activeRoom} onClose={() => setActiveRoom(null)} />}

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ fontSize: "11px", color: "#444", letterSpacing: "4px", marginBottom: "24px" }}>UPCOMING SLOTS</div>
        {slots.length === 0 ? (
          <div style={{ textAlign: "center", color: "#333", padding: "60px", border: "1px solid #1a1a2e", borderRadius: "12px" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>📡</div>
            <div style={{ letterSpacing: "3px", fontSize: "12px" }}>NO SLOTS AVAILABLE</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {slots.map(slot => (
              <AuctionSlot key={slot.id} slot={slot} user={user} onBid={handleBid} onJoin={handleJoin} socket={socket} />
            ))}
          </div>
        )}
      </main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
