
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import client from "../api/client";
import "./Admin.css";

const TABS = ["overview", "users", "tickets", "cards"];

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [cards, setCards] = useState([]);
  const [ticketNote, setTicketNote] = useState({});
  const [cardEdit, setCardEdit] = useState(null);
  const [cardForm, setCardForm] = useState({ category: "", title: "", description: "" });
  const [categories, setCategories] = useState([]);

  const load = useCallback(async () => {
    if (tab === "overview") {
      const d = await client.get("/admin/stats"); setStats(d);
    } else if (tab === "users") {
      const d = await client.get("/admin/users"); setUsers(d);
    } else if (tab === "tickets") {
      const d = await client.get("/admin/tickets"); setTickets(d);
    } else if (tab === "cards") {
      const d = await client.get("/admin/cards");
      setCards(d);
      setCategories([...new Set(d.map(c => c.category))].sort());
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function deleteUser(id) {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    await client.delete(`/admin/users/${id}`);
    load();
  }

  async function toggleAdmin(id, isAdmin) {
    await client.patch(`/admin/users/${id}/admin`, { is_admin: !isAdmin });
    load();
  }

  async function resolveTicket(id) {
    await client.patch(`/admin/tickets/${id}`, { status: "resolved", admin_note: ticketNote[id] || "" });
    load();
  }

  async function reopenTicket(id) {
    await client.patch(`/admin/tickets/${id}`, { status: "open" });
    load();
  }

  async function saveCard() {
    if (cardEdit === "new") {
      await client.post("/admin/cards", cardForm);
    } else {
      await client.patch(`/admin/cards/${cardEdit}`, cardForm);
    }
    setCardEdit(null);
    load();
  }

  async function deleteCard(id) {
    if (!confirm("Delete card and all responses to it?")) return;
    await client.delete(`/admin/cards/${id}`);
    load();
  }

  if (loading) return null;
  if (!loading && user && !user.isAdmin) {
    navigate("/browse");
    return null;
  }
  if (!user) return null;

  return (
    <div className="admin">
      <div className="admin-header">
        <h1 className="admin-title">Admin</h1>
        <span className="admin-badge">{user.isSuperadmin ? "Superadmin" : "Admin"}</span>
        <button className="admin-back" onClick={() => navigate("/browse")}>← Back to app</button>
      </div>

      <nav className="admin-tabs">
        {TABS.map(t => (
          <button key={t} className={`admin-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === "tickets" && tickets.filter(x => x.status === "open").length > 0 &&
              <span className="admin-tab-badge">{tickets.filter(x => x.status === "open").length}</span>}
          </button>
        ))}
      </nav>

      <div className="admin-content">

        {/* Overview */}
        {tab === "overview" && stats && (
          <div className="admin-stats">
            {[
              ["Total users",   stats.total_users],
              ["Paired users",  stats.paired_users],
              ["Total swipes",  stats.total_swipes],
              ["Total matches", stats.total_matches],
              ["Open tickets",  stats.open_tickets],
            ].map(([label, val]) => (
              <div key={label} className="stat-card">
                <span className="stat-val">{val}</span>
                <span className="stat-label">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {tab === "users" && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr>
                <th>ID</th><th>Username</th><th>Display name</th><th>Email</th>
                <th>Paired</th><th>Created</th><th>Role</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className={u.is_superadmin ? "row-super" : u.is_admin ? "row-admin" : ""}>
                    <td>{u.id}</td>
                    <td><code>{u.username}</code></td>
                    <td>{u.display_name}</td>
                    <td>{u.email || "—"}</td>
                    <td>{u.paired ? "✓" : "—"}</td>
                    <td>{u.created_at?.slice(0,10)}</td>
                    <td>{u.is_superadmin ? "Superadmin" : u.is_admin ? "Admin" : "User"}</td>
                    <td className="admin-actions">
                      {user.isSuperadmin && !u.is_superadmin && (
                        <button className="btn-tiny" onClick={() => toggleAdmin(u.id, u.is_admin)}>
                          {u.is_admin ? "Revoke admin" : "Make admin"}
                        </button>
                      )}
                      {!u.is_superadmin && (
                        <button className="btn-tiny danger" onClick={() => deleteUser(u.id)}>Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tickets */}
        {tab === "tickets" && (
          <div className="admin-tickets">
            {tickets.length === 0 && <p className="admin-empty">No tickets yet.</p>}
            {tickets.map(t => (
              <div key={t.id} className={`ticket ${t.status}`}>
                <div className="ticket-header">
                  <span className="ticket-user">@{t.username}</span>
                  <span className="ticket-date">{t.created_at?.slice(0,16).replace("T"," ")}</span>
                  <span className={`ticket-status ${t.status}`}>{t.status}</span>
                </div>
                <p className="ticket-msg">{t.message}</p>
                {t.admin_note && <p className="ticket-note">📝 {t.admin_note}</p>}
                {t.status === "open" && (
                  <div className="ticket-footer">
                    <input
                      className="ticket-note-input"
                      placeholder="Add note (optional)…"
                      value={ticketNote[t.id] || ""}
                      onChange={e => setTicketNote(n => ({...n, [t.id]: e.target.value}))}
                    />
                    <button className="btn-tiny" onClick={() => resolveTicket(t.id)}>Mark resolved</button>
                  </div>
                )}
                {t.status === "resolved" && (
                  <button className="btn-tiny" onClick={() => reopenTicket(t.id)}>Reopen</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Cards */}
        {tab === "cards" && (
          <div className="admin-cards">
            <div className="admin-cards-header">
              <span>{cards.length} cards</span>
              <button className="btn-tiny primary" onClick={() => { setCardEdit("new"); setCardForm({ category: categories[0] || "", title: "", description: "" }); }}>
                + New card
              </button>
            </div>

            {cardEdit && (
              <div className="card-edit-form">
                <h3>{cardEdit === "new" ? "New card" : "Edit card"}</h3>
                <select value={cardForm.category} onChange={e => setCardForm(f => ({...f, category: e.target.value}))}>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
                <input placeholder="Title" value={cardForm.title} onChange={e => setCardForm(f => ({...f, title: e.target.value}))} />
                <textarea placeholder="Description (optional)" value={cardForm.description} onChange={e => setCardForm(f => ({...f, description: e.target.value}))} />
                <div className="card-edit-actions">
                  <button className="btn-tiny primary" onClick={saveCard}>Save</button>
                  <button className="btn-tiny" onClick={() => setCardEdit(null)}>Cancel</button>
                </div>
              </div>
            )}

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>ID</th><th>Category</th><th>Title</th><th>Description</th><th>Actions</th></tr></thead>
                <tbody>
                  {cards.map(c => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td><span className="cat-pill">{c.category}</span></td>
                      <td>{c.title}</td>
                      <td className="desc-cell">{c.description}</td>
                      <td className="admin-actions">
                        <button className="btn-tiny" onClick={() => { setCardEdit(c.id); setCardForm({ category: c.category, title: c.title, description: c.description || "" }); }}>Edit</button>
                        <button className="btn-tiny danger" onClick={() => deleteCard(c.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
