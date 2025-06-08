export const API_BASE = import.meta.env.VITE_API_BASE;

export async function fetchMe() {
  const res = await fetch(`${API_BASE}/me`, {
    method: "GET", 
    credentials: 'include',
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

// GET /api/quests
export async function fetchQuests() {
    const res = await fetch(`${API_BASE}/quests`, { 
        method: "GET", 
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(res.statusText);
    return res.json(); // assume JSON array of quests
  }

export async function createQuest(task){
    // Now POST to /quests so the server writes to the database
    const resp = await fetch(`${API_BASE}/quests`, {
        method: "POST",
        credentials: "include",            // <<– must include so Flask sees session['user_id']
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task)
    });

    if (!resp.ok) throw new Error("Failed to save quest");
    return resp.json();    // assuming your /quests POST returns new_q.serialize()
}


// PATCH /api/quests/:id/accept
export async function acceptQuest(id) {
    const res = await fetch(`${API_BASE}/quests/${id}/accept`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(res.statusText);
    return res.json(); // { status: "In Progress" }
  }

// DELETE /api/quests/:id/giveup
export async function giveupQuest(id) {
    const res = await fetch(`${API_BASE}/quests/${id}/giveup`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(res.statusText);
    return res.json(); // maybe a message
}

// PATCH /api/quests/:id
export async function completeQuest(id) {
    const res = await fetch(`${API_BASE}/quests/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Completed" }),
    });
    if (!res.ok) throw new Error(res.statusText);
    return res.json(); // maybe a message
}

// POST /api/logout
export async function logout() {
    const res = await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(res.statusText);
    return res.json(); // maybe a message
}
