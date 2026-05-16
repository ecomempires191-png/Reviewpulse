import { useState } from "react";

const MOCK_BUSINESSES = [
  { id: 1, name: "Sharma's Kitchen", category: "Restaurant", rating: 3.8, reviews: 14, target: 4.7, city: "New York", status: "active", reviewsGoal: 80, daysLeft: 67, trend: [3.2, 3.4, 3.5, 3.6, 3.8] },
  { id: 2, name: "The Cuts Studio", category: "Salon", rating: 4.1, reviews: 32, target: 4.8, city: "London", status: "active", reviewsGoal: 100, daysLeft: 45, trend: [3.8, 3.9, 4.0, 4.0, 4.1] },
  { id: 3, name: "QuickFix Auto", category: "Auto Repair", rating: 3.5, reviews: 8, target: 4.5, city: "Chicago", status: "pending", reviewsGoal: 60, daysLeft: 88, trend: [3.1, 3.2, 3.3, 3.4, 3.5] },
  { id: 4, name: "Bloom Boutique", category: "Fashion", rating: 4.4, reviews: 67, target: 4.9, city: "Manchester", status: "active", reviewsGoal: 120, daysLeft: 22, trend: [3.9, 4.1, 4.2, 4.3, 4.4] },
];

const RECENT_REVIEWS = [
  { id: 1, business: "Sharma's Kitchen", author: "Sarah M.", rating: 5, text: "Best food in the city! Service was prompt and staff very friendly.", time: "2h ago", sentiment: "positive" },
  { id: 2, business: "The Cuts Studio", author: "James K.", rating: 4, text: "Great haircut, took a bit longer than expected but worth it.", time: "5h ago", sentiment: "positive" },
  { id: 3, business: "QuickFix Auto", author: "Anna S.", rating: 2, text: "Waited 3 hours and the issue wasn't fully fixed. Disappointed.", time: "1d ago", sentiment: "negative" },
  { id: 4, business: "Bloom Boutique", author: "Emily R.", rating: 5, text: "Absolutely love their collection! Helped me find the perfect outfit.", time: "1d ago", sentiment: "positive" },
];

const SMS_TEMPLATES = [
  { id: 1, name: "Post-Visit Warm Ask", text: "Hi {name}! Thank you for visiting {business} today. We hope you had a wonderful experience! Could you spare 2 mins to share your feedback? 🙏 → {link}" },
  { id: 2, name: "7-Day Follow-up", text: "Hi {name}, it's been a week since your visit to {business}. We'd love to hear how your experience has been. A quick Google review would help us serve you better! → {link}" },
  { id: 3, name: "Loyalty Appreciation", text: "Thank you for being a valued customer at {business}, {name}! Your continued trust means everything. Would you help other customers find us? Drop us a review here → {link}" },
];

const StarRating = ({ rating, size = 14 }) => (
  <span style={{ display: "inline-flex", gap: 1 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= Math.round(rating) ? "#F59E0B" : "none"} stroke={i <= Math.round(rating) ? "#F59E0B" : "#6B7280"} strokeWidth="1.5">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ))}
  </span>
);

const MiniChart = ({ trend, color = "#22D3EE" }) => {
  const w = 80, h = 32;
  const min = Math.min(...trend), max = Math.max(...trend);
  const pts = trend.map((v, i) => {
    const x = (i / (trend.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {trend.map((v, i) => {
        const x = (i / (trend.length - 1)) * w;
        const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
        return i === trend.length - 1 ? <circle key={i} cx={x} cy={y} r="3" fill={color} /> : null;
      })}
    </svg>
  );
};

export default function ReviewPulseApp() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [smsPreview, setSmsPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [newBiz, setNewBiz] = useState({ name: "", category: "", city: "", phone: "", rating: "", reviews: "" });
  const [businesses, setBusinesses] = useState(MOCK_BUSINESSES);
  const [notification, setNotification] = useState(null);

  const showNotif = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSendSMS = async () => {
    setSending(true);
    await new Promise(r => setTimeout(r, 1800));
    setSending(false);
    setSentCount(c => c + 1);
    showNotif("SMS sent successfully via Twilio!");
    setSmsPreview(null);
  };

  const handleAIReply = async (review) => {
    setReplyTarget(review.id);
    setAiLoading(true);
    setAiResponse("");
    try {
      const res = await fetch("https://reviewpulse-h316.onrender.com/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review: review.text,
          business: review.business,
          rating: review.rating
        })
      });
      const data = await res.json();
      setAiResponse(data.reply || "Thank you so much for your feedback!");
    } catch {
      setAiResponse("Thank you so much for your feedback! We truly value your experience and hope to welcome you back soon!");
    }
    setAiLoading(false);
  };

  const totalReviews = businesses.reduce((s, b) => s + b.reviews, 0);
  const avgRating = (businesses.reduce((s, b) => s + b.rating, 0) / businesses.length).toFixed(1);
  const activeCount = businesses.filter(b => b.status === "active").length;

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "businesses", label: "Businesses", icon: "🏪" },
    { id: "campaigns", label: "Campaigns", icon: "📲" },
    { id: "reviews", label: "Reviews", icon: "⭐" },
    { id: "analytics", label: "Analytics", icon: "📈" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#060B14", fontFamily: "sans-serif", color: "#E5E7EB", display: "flex" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .nav-item { transition: all 0.2s; cursor: pointer; border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 500; color: #6B7280; }
        .nav-item:hover { background: #0D1420; color: #E5E7EB; }
        .nav-item.active { background: linear-gradient(135deg, #0E2D4F, #163B62); color: #22D3EE; border: 1px solid #1E4A7A; }
        .card { background: #0A1628; border: 1px solid #1A2E4A; border-radius: 14px; padding: 20px; }
        .btn-primary { background: linear-gradient(135deg, #0EA5E9, #22D3EE); color: #060B14; border: none; border-radius: 8px; padding: 10px 18px; font-weight: 600; cursor: pointer; font-size: 13px; transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(34,211,238,0.3); }
        .btn-ghost { background: transparent; border: 1px solid #1E3A5F; color: #9CA3AF; border-radius: 8px; padding: 8px 14px; cursor: pointer; font-size: 13px; transition: all 0.2s; }
        .btn-ghost:hover { border-color: #22D3EE; color: #22D3EE; }
        .tag { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .tag-active { background: rgba(34,197,94,0.15); color: #22C55E; border: 1px solid rgba(34,197,94,0.3); }
        .tag-pending { background: rgba(245,158,11,0.15); color: #F59E0B; border: 1px solid rgba(245,158,11,0.3); }
        .tag-pos { background: rgba(34,197,94,0.1); color: #4ADE80; border: 1px solid rgba(34,197,94,0.2); }
        .tag-neg { background: rgba(239,68,68,0.1); color: #F87171; border: 1px solid rgba(239,68,68,0.2); }
        .input { background: #0D1420; border: 1px solid #1E3A5F; border-radius: 8px; padding: 10px 14px; color: #E5E7EB; font-size: 13px; font-family: inherit; width: 100%; outline: none; }
        .input:focus { border-color: #22D3EE; }
        .progress-bar { height: 6px; border-radius: 3px; background: #1A2E4A; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #0EA5E9, #22D3EE); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(6,11,20,0.85); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .modal { background: #0A1628; border: 1px solid #1A2E4A; border-radius: 16px; padding: 28px; width: 480px; max-width: 95vw; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .notif { position: fixed; top: 20px; right: 20px; z-index: 200; background: #0A2E1A; border: 1px solid #14532D; color: #4ADE80; padding: 12px 20px; border-radius: 10px; font-size: 13px; font-weight: 500; }
      `}</style>

      {notification && <div className="notif">{notification}</div>}

      <div style={{ width: 220, background: "#07101E", borderRight: "1px solid #0F2035", padding: "24px 16px", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #0EA5E9, #22D3EE)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#22D3EE" }}>ReviewPulse</span>
          </div>
          <div style={{ fontSize: 11, color: "#374151", marginLeft: 42 }}>AI Review Engine</div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {tabs.map(t => (
            <div key={t.id} className={`nav-item ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              <span>{t.label}</span>
            </div>
          ))}
        </nav>
        <div style={{ borderTop: "1px solid #0F2035", paddingTop: 16 }}>
          <div style={{ fontSize: 12, color: "#4B5563", marginBottom: 8 }}>Total SMS Sent</div>
          <div style={{ fontSize: 22, color: "#22D3EE", fontWeight: 500 }}>{(1240 + sentCount).toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "#374151", marginTop: 2 }}>this month</div>
        </div>
      </div>

      <div style={{ marginLeft: 220, flex: 1, padding: "28px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F9FAFB" }}>
              {activeTab === "dashboard" && "Command Center"}
              {activeTab === "businesses" && "Business Portfolio"}
              {activeTab === "campaigns" && "SMS Campaigns"}
              {activeTab === "reviews" && "Review Monitor"}
              {activeTab === "analytics" && "Analytics"}
            </h1>
            <div style={{ fontSize: 13, color: "#4B5563", marginTop: 2 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
          </div>
          {activeTab === "businesses" && (
            <button className="btn-primary" onClick={() => setAddModal(true)}>+ Add Business</button>
          )}
        </div>

        {activeTab === "dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Businesses", value: businesses.length, sub: `${activeCount} active`, icon: "🏪", color: "#22D3EE" },
                { label: "Avg Rating", value: avgRating, sub: "↑ 0.3 this month", icon: "⭐", color: "#F59E0B" },
                { label: "Total Reviews", value: totalReviews, sub: "+12 this week", icon: "💬", color: "#A78BFA" },
                { label: "SMS Sent", value: (1240 + sentCount).toLocaleString(), sub: "94% delivered", icon: "📲", color: "#34D399" },
              ].map((k, i) => (
                <div key={i} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#4B5563", marginBottom: 6 }}>{k.label}</div>
                      <div style={{ fontSize: 28, fontWeight: 500, color: k.color }}>{k.value}</div>
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{k.sub}</div>
                    </div>
                    <span style={{ fontSize: 24 }}>{k.icon}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20 }}>
              <div className="card">
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 18, color: "#9CA3AF" }}>🎯 90-DAY CAMPAIGN PROGRESS</h3>
                {businesses.map(b => (
                  <div key={b.id} style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#E5E7EB" }}>{b.name}</span>
                        <span style={{ fontSize: 11, color: "#4B5563", marginLeft: 8 }}>{b.city}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <MiniChart trend={b.trend} />
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 13, color: "#22D3EE" }}>{b.rating} → {b.target}</div>
                          <div style={{ fontSize: 11, color: "#4B5563" }}>{b.daysLeft}d left</div>
                        </div>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(100, (b.reviews / b.reviewsGoal) * 100)}%` }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: "#4B5563" }}>{b.reviews} reviews</span>
                      <span style={{ fontSize: 11, color: "#4B5563" }}>Goal: {b.reviewsGoal}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card">
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#9CA3AF" }}>🔔 LATEST REVIEWS</h3>
                {RECENT_REVIEWS.slice(0, 3).map(r => (
                  <div key={r.id} style={{ borderBottom: "1px solid #0F2035", paddingBottom: 14, marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#E5E7EB" }}>{r.author}</span>
                      <span className={`tag ${r.sentiment === "positive" ? "tag-pos" : "tag-neg"}`}>{r.sentiment}</span>
                    </div>
                    <StarRating rating={r.rating} size={12} />
                    <p style={{ fontSize: 12, color: "#6B7280", marginTop: 4, lineHeight: 1.5 }}>{r.text.slice(0, 60)}...</p>
                    <div style={{ fontSize: 11, color: "#374151", marginTop: 4 }}>{r.business} · {r.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "businesses" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
            {businesses.map(b => (
              <div key={b.id} className="card" style={{ cursor: "pointer", borderColor: selectedBiz === b.id ? "#22D3EE" : "#1A2E4A" }} onClick={() => setSelectedBiz(selectedBiz === b.id ? null : b.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#F9FAFB" }}>{b.name}</div>
                    <div style={{ fontSize: 12, color: "#4B5563" }}>{b.category} · {b.city}</div>
                  </div>
                  <span className={`tag ${b.status === "active" ? "tag-active" : "tag-pending"}`}>{b.status}</span>
                </div>
                <StarRating rating={b.rating} />
                <span style={{ fontSize: 13, color: "#22D3EE", marginLeft: 8 }}>{b.rating} → {b.target} goal</span>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>{b.reviews} reviews · {b.daysLeft} days left</div>
                <div className="progress-bar" style={{ marginTop: 8 }}>
                  <div className="progress-fill" style={{ width: `${(b.reviews / b.reviewsGoal) * 100}%` }} />
                </div>
                {selectedBiz === b.id && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #0F2035", display: "flex", gap: 8 }}>
                    <button className="btn-primary" style={{ flex: 1 }} onClick={e => { e.stopPropagation(); setActiveTab("campaigns"); }}>📲 Send Campaign</button>
                    <button className="btn-ghost" onClick={e => { e.stopPropagation(); showNotif("Review link copied!"); }}>🔗 Copy Link</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "campaigns" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20 }}>
            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#9CA3AF" }}>📲 SMS TEMPLATES</h3>
              {SMS_TEMPLATES.map(t => (
                <div key={t.id} style={{ background: "#060B14", border: "1px solid #0F2035", borderRadius: 10, padding: 16, marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#E5E7EB" }}>{t.name}</span>
                    <button className="btn-primary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setSmsPreview(t)}>Use Template</button>
                  </div>
                  <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6, background: "#07101E", padding: "10px 12px", borderRadius: 8, borderLeft: "3px solid #22D3EE" }}>{t.text}</p>
                </div>
              ))}
            </div>
            <div>
              <div className="card" style={{ marginBottom: 18 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#9CA3AF" }}>⚡ QUICK SEND</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 6 }}>Select Business</label>
                    <select className="input" style={{ background: "#0D1420", color: "#E5E7EB" }}>
                      {businesses.map(b => <option key={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 6 }}>Customer Phone</label>
                    <input className="input" placeholder="+1 212 555 0100" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 6 }}>Customer Name</label>
                    <input className="input" placeholder="John Smith" />
                  </div>
                  <button className="btn-primary" style={{ width: "100%", padding: 12 }} onClick={() => { showNotif("SMS sent! ✓"); setSentCount(c => c + 1); }}>📤 Send Review Request</button>
                </div>
              </div>
              <div className="card">
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: "#9CA3AF" }}>📊 CAMPAIGN STATS</h3>
                {[{ label: "Delivery Rate", value: "94%", color: "#22C55E" }, { label: "Open Rate", value: "67%", color: "#22D3EE" }, { label: "Click Rate", value: "38%", color: "#A78BFA" }, { label: "Review Conversion", value: "21%", color: "#F59E0B" }].map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: "#6B7280" }}>{s.label}</span>
                    <span style={{ fontSize: 15, color: s.color, fontWeight: 500 }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {RECENT_REVIEWS.map(r => (
              <div key={r.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #1E3A5F, #0EA5E9)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{r.author[0]}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#E5E7EB" }}>{r.author}</div>
                      <div style={{ fontSize: 11, color: "#4B5563" }}>{r.business} · {r.time}</div>
                    </div>
                  </div>
                  <span className={`tag ${r.sentiment === "positive" ? "tag-pos" : "tag-neg"}`}>{r.sentiment}</span>
                </div>
                <StarRating rating={r.rating} />
                <p style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.7, margin: "10px 0" }}>{r.text}</p>
                {replyTarget === r.id ? (
                  <div style={{ background: "#060B14", border: "1px solid #0F2035", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 12, color: "#22D3EE", marginBottom: 8, fontWeight: 600 }}>🤖 AI-Generated Reply</div>
                    {aiLoading ? <div className="pulse" style={{ fontSize: 13, color: "#4B5563" }}>Generating response...</div> : (
                      <>
                        <p style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.7, marginBottom: 12 }}>{aiResponse}</p>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="btn-primary" style={{ fontSize: 12 }} onClick={() => { showNotif("Reply posted!"); setReplyTarget(null); }}>✓ Post Reply</button>
                          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => handleAIReply(r)}>↻ Regenerate</button>
                          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setReplyTarget(null)}>✕ Close</button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-primary" style={{ fontSize: 12 }} onClick={() => handleAIReply(r)}>🤖 AI Reply</button>
                    <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => showNotif("Flagged for review")}>🚩 Flag</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "analytics" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
              {[{ label: "Avg Rating Improvement", value: "+0.6", unit: "stars", color: "#F59E0B" }, { label: "Review Growth", value: "124%", unit: "this quarter", color: "#22D3EE" }, { label: "Response Rate", value: "89%", unit: "within 24h", color: "#34D399" }].map((m, i) => (
                <div key={i} className="card">
                  <div style={{ fontSize: 12, color: "#4B5563", marginBottom: 10 }}>{m.label}</div>
                  <div style={{ fontSize: 36, fontWeight: 500, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>{m.unit}</div>
                </div>
              ))}
            </div>
            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#9CA3AF" }}>💰 REVENUE IMPACT PER CLIENT</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                {businesses.map(b => (
                  <div key={b.id} style={{ background: "#060B14", border: "1px solid #0F2035", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#E5E7EB", marginBottom: 8 }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: "#4B5563", marginBottom: 4 }}>Est. Revenue Lift</div>
                    <div style={{ fontSize: 20, color: "#34D399" }}>+${(Math.round((b.rating - 3.5) * 1200)).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: "#374151", marginTop: 2 }}>per month</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Add New Business</h3>
            <p style={{ fontSize: 13, color: "#4B5563", marginBottom: 20 }}>Enroll a business in the 90-day review campaign</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[{ label: "Business Name", key: "name", placeholder: "Joe's Pizza" }, { label: "Category", key: "category", placeholder: "Restaurant" }, { label: "City", key: "city", placeholder: "New York" }, { label: "Phone", key: "phone", placeholder: "+1 212 555 0100" }, { label: "Current Rating", key: "rating", placeholder: "3.8" }, { label: "Current Reviews", key: "reviews", placeholder: "14" }].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 5 }}>{f.label}</label>
                  <input className="input" placeholder={f.placeholder} value={newBiz[f.key]} onChange={e => setNewBiz(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => {
                if (newBiz.name) {
                  setBusinesses(prev => [...prev, { id: Date.now(), name: newBiz.name, category: newBiz.category || "General", rating: parseFloat(newBiz.rating) || 3.5, reviews: parseInt(newBiz.reviews) || 0, target: 4.7, city: newBiz.city || "US", status: "pending", reviewsGoal: 80, daysLeft: 90, trend: [parseFloat(newBiz.rating) || 3.5] }]);
                  showNotif(`${newBiz.name} enrolled!`);
                  setAddModal(false);
                  setNewBiz({ name: "", category: "", city: "", phone: "", rating: "", reviews: "" });
                }
              }}>🚀 Enroll Business</button>
              <button className="btn-ghost" onClick={() => setAddModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {smsPreview && (
        <div className="modal-overlay" onClick={() => setSmsPreview(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{smsPreview.name}</h3>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>Send this campaign to your client's customers</p>
            <div style={{ background: "#060B14", border: "1px solid #0F2035", borderRadius: 10, padding: 14, marginBottom: 18, fontSize: 13, color: "#9CA3AF", lineHeight: 1.7 }}>{smsPreview.text}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-primary" style={{ flex: 1 }} disabled={sending} onClick={handleSendSMS}>
                {sending ? <span className="pulse">Sending...</span> : "📤 Send Campaign"}
              </button>
              <button className="btn-ghost" onClick={() => setSmsPreview(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
