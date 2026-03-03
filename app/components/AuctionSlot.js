"use client";
import { useState, useEffect } from "react";

export default function AuctionSlot({ slot, user, onBid, onJoin, socket }) {
  const [bidAmount, setBidAmount] = useState("");
  const [currentBid, setCurrentBid] = useState(parseFloat(slot.current_bid) || 0);
  const [bidCount, setBidCount] = useState(parseInt(slot.bid_count) || 0);
  const [timeLeft, setTimeLeft] = useState("");

  const isWinner = user && slot.winner_id === user.id;
  const isLive = slot.status === "live" || slot.status === "paid";
  const start = new Date(slot.start_time);
  const end = new Date(slot.end_time);

  useEffect(() => {
    if (!socket) return;
    socket.emit("join_auction", slot.id);
    socket.on("new_bid", (data) => {
      if (data.slotId === slot.id) {
        setCurrentBid(data.amount);
        setBidCount(data.bidCount);
      }
    });
    return () => socket.off("new_bid");
  }, [socket, slot.id]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const diff = start - now;
      if (diff <= 0) { setTimeLeft("LIVE NOW"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [slot.start_time]);

  const placeBid = () => {
    const amt = parseFloat(bidAmount);
    if (!amt || amt <= currentBid) return alert(`Bid must be over $${currentBid.toFixed(2)}`);
    onBid(slot.id, amt);
    setBidAmount("");
  };

  return (
    <div style={{ background: "#111118", border: `1px solid ${isLive ? "#ff4422" : "#1e1e2e"}`, borderRadius: "12px", padding: "20px", boxShadow: isLive ? "0 0 30px rgba(255,68,34,0.1)" : "none", transition: "all 0.3s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "10px", color: "#444", letterSpacing: "3px", marginBottom: "4px" }}>
            {start.toLocaleDateString()} • {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div style={{ fontSize: "13px", color: isLive ? "#ff4422" : "#888", letterSpacing: "2px", fontWeight: "700" }}>
            {isLive ? "🔴 LIVE NOW" : `⏱ ${timeLeft}`}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "22px", fontWeight: "900", color: "#ff4422" }}>${currentBid.toFixed(2)}</div>
          <div style={{ fontSize: "10px", color: "#444" }}>{bidCount} bids</div>
        </div>
      </div>

      {isWinner && (
        <div style={{ background: "#1a1500", border: "1px solid #554400", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", fontSize: "11px", color: "#ffaa00", letterSpacing: "2px" }}>
          👑 YOU WON THIS SLOT
        </div>
      )}

      {isLive ? (
        <button onClick={() => onJoin(slot.id)} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg,#cc2200,#ff4422)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontFamily: "'Courier New', monospace", letterSpacing: "3px", fontWeight: "700" }}>
          {isWinner ? "🎙 GO LIVE" : "📻 TUNE IN"}
        </button>
      ) : (
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="number"
            placeholder={`Min $${(currentBid + 0.01).toFixed(2)}`}
            value={bidAmount}
            onChange={e => setBidAmount(e.target.value)}
            style={{ flex: 1, padding: "12px", background: "#0d0d12", border: "1px solid #1a1a28", borderRadius: "8px", color: "#fff", fontSize: "13px", fontFamily: "'Courier New', monospace" }}
          />
          <button onClick={placeBid} style={{ padding: "12px 20px", background: "#ff4422", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px", fontFamily: "'Courier New', monospace", letterSpacing: "2px", fontWeight: "700" }}>
            BID
          </button>
        </div>
      )}
    </div>
  );
}
