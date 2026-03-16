import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import client from "../api/client";
import { ROUTES } from "../lib/constants";
import "./Admin.css";

const TABS = ["overview", "users", "tickets", "cards"];

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [cards, setCards] = useState([]);
  const [ticketNote, setTicketNote] = useState({});
  const [cardEdit, setCardEdit] = useState(null);
  const [cardForm, setCardForm] = useState({ category: "", title: "", description: "" });
  const [pendingDeleteUser, setPendingDeleteUser] = useState(null);
  const [pendingDeleteCard, setPendingDeleteCard] = useState(null);

  const categories = useMemo(
    () => [...new Set(cards.map((c) => c.category))].sort(),
    [cards],
  );

  const load = useCallback(async () => {
    try {
      if (tab === "overview") {
        setStats(await client.get("/admin/stats"));
      } else if (tab === "users") {
        setUsers(await client.get("/admin/users"));
      } else if (tab === "tickets") {
        setTickets(await client.get("/admin/tickets"));
      } else if (tab === "cards") {
        setCards(await client.get("/admin/cards"));
      }
    } catch {}
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function deleteUser(id) {
    try {
      await client.delete(`/admin/users/${id}`);
      setPendingDeleteUser(null);
      load();
    } catch {}
  }

  async function toggleAdmin(id, isAdmin) {
    try {
      await client.patch(`/admin/users/${id}/admin`, { is_admin: !isAdmin });
      load();
    } catch {}
  }

  async function resolveTicket(id) {
    try {
      await client.patch(`/admin/tickets/${id}`, { status: "resolved", admin_note: ticketNote[id] || "" });
      load();
    } catch {}
  }

  async function reopenTicket(id) {
    try {
      await client.patch(`/admin/tickets/${id}`, { status: "open" });
      load();
    } catch {}
  }

  async function saveCard() {
    try {
      if (cardEdit === "new") {
        await client.post("/admin/cards", cardForm);
      } else {
        await client.patch(`/admin/cards/${cardEdit}`, cardForm);
      }
      setCardEdit(null);
      load();
    } catch {}
  }

  async function deleteCard(id) {
    try {
      await client.delete(`/admin/cards/${id}`);
      setPendingDeleteCard(null);
      load();
    } catch {}
  }

  return (
    <div className="admin">
      <div className="admin-header">
        <button className="admin-back" onClick={() => navigate(ROUTES.BROWSE)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
          Back to app</button>
        <h1 className="admin-title">Admin</h1>
        <span className="admin-badge">{user.isSuperadmin ? "Superadmin" : "Admin"}</span>
      </div>

      <nav className="admin-tabs">
        {TABS.map((t) => (
          <button key={t} className={`admin-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === "tickets" && tickets.filter((x) => x.status === "open").length > 0 && (
              <span className="admin-tab-badge">{tickets.filter((x) => x.status === "open").length}</span>
            )}
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
                {users.map((u) => (
                  <tr key={u.id} className={u.is_superadmin ? "row-super" : u.is_admin ? "row-admin" : ""}>
                    <td>{u.id}</td>
                    <td><code>{u.username}</code></td>
                    <td>{u.display_name}</td>
                    <td>{u.email || "—"}</td>
                    <td>{u.paired ? "✓" : "—"}</td>
                    <td>{u.created_at?.slice(0, 10)}</td>
                    <td>{u.is_superadmin ? "Superadmin" : u.is_admin ? "Admin" : "User"}</td>
                    <td className="admin-actions">
                      {user.isSuperadmin && !u.is_superadmin && (
                        <button className="btn-tiny" onClick={() => toggleAdmin(u.id, u.is_admin)}>
                          {u.is_admin ? "Revoke admin" : "Make admin"}
                        </button>
                      )}
                      {!u.is_superadmin && (
                        pendingDeleteUser === u.id ? (
                          <>
                            <span className="admin-confirm-text">Sure?</span>
                            <button className="btn-tiny danger" onClick={() => deleteUser(u.id)}>Yes, delete</button>
                            <button className="btn-tiny" onClick={() => setPendingDeleteUser(null)}>Cancel</button>
                          </>
                        ) : (
                          <button className="btn-tiny danger" onClick={() => setPendingDeleteUser(u.id)}>Delete</button>
                        )
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
            {tickets.map((t) => (
              <div key={t.id} className={`ticket ${t.status}`}>
                <div className="ticket-header">
                  <span className="ticket-user">@{t.username}</span>
                  <span className="ticket-date">{t.created_at?.slice(0, 16).replace("T", " ")}</span>
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
                      onChange={(e) => setTicketNote((n) => ({ ...n, [t.id]: e.target.value }))}
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
              <button
                className="btn-tiny primary"
                onClick={() => { setCardEdit("new"); setCardForm({ category: categories[0] || "", title: "", description: "" }); }}
              >
                + New card
              </button>
            </div>

            {cardEdit && (
              <div className="card-edit-form">
                <h3>{cardEdit === "new" ? "New card" : "Edit card"}</h3>
                <select value={cardForm.category} onChange={(e) => setCardForm((f) => ({ ...f, category: e.target.value }))}>
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
                <input
                  placeholder="Title"
                  value={cardForm.title}
                  onChange={(e) => setCardForm((f) => ({ ...f, title: e.target.value }))}
                />
                <textarea
                  placeholder="Description (optional)"
                  value={cardForm.description}
                  onChange={(e) => setCardForm((f) => ({ ...f, description: e.target.value }))}
                />
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
                  {cards.map((c) => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td><span className="cat-pill">{c.category}</span></td>
                      <td>{c.title}</td>
                      <td className="desc-cell">{c.description}</td>
                      <td className="admin-actions">
                        <button
                          className="btn-tiny"
                          onClick={() => { setCardEdit(c.id); setCardForm({ category: c.category, title: c.title, description: c.description || "" }); }}
                        >
                          Edit
                        </button>
                        {pendingDeleteCard === c.id ? (
                          <>
                            <span className="admin-confirm-text">Sure?</span>
                            <button className="btn-tiny danger" onClick={() => deleteCard(c.id)}>Yes, delete</button>
                            <button className="btn-tiny" onClick={() => setPendingDeleteCard(null)}>Cancel</button>
                          </>
                        ) : (
                          <button className="btn-tiny danger" onClick={() => setPendingDeleteCard(c.id)}>Delete</button>
                        )}
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
