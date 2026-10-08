const DB_KEY = "psgks_db_v1";
const SESSION_KEY = "psgks_session";
const MILE_LIMIT = 25;
const OVERAGE = 0.55;

const VEHICLES = [
  {
    id: "accord-2016",
    year: 2016,
    make: "Honda",
    model: "Accord",
    trim: "EX",
    name: "2016 Honda Accord EX",
    color: "Crystal Black Pearl",
    miles: 85000,
    seats: 5,
    body: "Sedan",
    drivetrain: "Front-wheel drive",
    transmission: "6-speed automatic",
    engine: "2.4L i-VTEC inline-4",
    horsepower: 185,
    mpg: "27 city / 36 highway",
    dailyRate: 52,
    deposit: 200,
    status: "available",
    images: [
      "images/accord-quarter.jpg",
      "images/accord-front.jpg",
      "images/accord-rear.jpg",
      "images/accord-dash.jpg",
      "images/accord-cabin.jpg",
    ],
    features: [
      "Projector headlights with LED daytime running lights",
      "Chrome grille bar and 17-inch alloy wheels",
      "Touchscreen audio with Bluetooth and USB",
      "Backup camera",
      "Cruise control and tilt-telescoping wheel",
      "Cloth seating for five with wood-tone trim",
      "Power windows, locks, and mirrors",
    ],
    summary:
      "A quiet midsize sedan for highway days and everyday errands, finished in Crystal Black Pearl.",
    description:
      "This 2016 Honda Accord EX is a well-kept midsize sedan with 85,000 owner-reported miles. The Crystal Black Pearl paint is paired with a chrome grille bar, projector headlights, and multi-spoke alloy wheels. Inside, cloth seats, wood-tone trim, and a touchscreen audio stack with Bluetooth keep the cabin straightforward. A backup camera, cruise control, and a roomy trunk make it an easy daily driver. Power is Honda’s 2.4-liter i-VTEC four-cylinder, rated at 185 horsepower, paired with a 6-speed automatic transmission. EPA estimates for this generation are about 27 city and 36 highway. Best for renters who want a calm, capable car and can stay inside the 25-mile daily allowance.",
  },
  {
    id: "cruze-2015",
    year: 2015,
    make: "Chevrolet",
    model: "Cruze",
    trim: "LT",
    name: "2015 Chevrolet Cruze LT",
    color: "Black",
    miles: 20000,
    seats: 5,
    body: "Sedan",
    drivetrain: "Front-wheel drive",
    transmission: "6-speed automatic",
    engine: "1.4L turbocharged inline-4",
    horsepower: 138,
    mpg: "26 city / 38 highway",
    dailyRate: 38,
    deposit: 150,
    status: "available",
    images: [
      "images/cruze-front.jpg",
      "images/cruze-side.jpg",
      "images/cruze-rear.jpg",
      "images/cruze-dash.jpg",
      "images/cruze-cabin.jpg",
    ],
    features: [
      "Only 20,000 owner-reported miles",
      "LT trim with Chevrolet MyLink touchscreen",
      "Bluetooth, USB, and steering-wheel audio controls",
      "Cruise control",
      "Two-tone cloth seats",
      "16-inch alloy wheels and body-color mirrors",
      "Compact footprint, easy to park",
    ],
    summary:
      "A low-mileage compact sedan. Easy to park and inexpensive to run inside the daily mile cap.",
    description:
      "This 2015 Chevrolet Cruze LT is unusual for the year: 20,000 owner-reported miles, black paint, and the LT equipment group. The bowtie grille, body-color mirrors, and alloy wheels are intact, and the cabin has two-tone cloth seats plus a MyLink touchscreen with Bluetooth. The 1.4-liter turbo four makes 138 horsepower through a 6-speed automatic. EPA estimates are about 26 city and 38 highway. It is the better pick for short Kansas trips, errands, and airport-style hops that fit inside 25 miles a day.",
  },
];

const ui = { gallery: {}, toastTimer: null, search: "" };

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => {
    if (c === "&") return "&" + "amp;";
    if (c === "<") return "&" + "lt;";
    if (c === ">") return "&" + "gt;";
    if (c === '"') return "&" + "quot;";
    return "&" + "#39;";
  });
}
function uid(prefix) {
  return (
    prefix +
    "-" +
    Math.random().toString(36).slice(2, 8) +
    Date.now().toString(36).slice(-4)
  );
}
function money(n) {
  return "$" + Number(n).toFixed(2);
}
function parseDate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function iso(date) {
  const z = (n) => String(n).padStart(2, "0");
  return (
    date.getFullYear() + "-" + z(date.getMonth() + 1) + "-" + z(date.getDate())
  );
}
function todayIso() {
  return iso(new Date());
}
function addDays(s, n) {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}
function fmtDate(s) {
  if (!s) return "";
  return parseDate(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function rentalDays(start, end) {
  const diff = Math.round((parseDate(end) - parseDate(start)) / 86400000);
  return Math.max(1, diff);
}
function occupyEnd(start, end) {
  return start === end ? addDays(end, 1) : end;
}
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < occupyEnd(bStart, bEnd) && bStart < occupyEnd(aStart, aEnd);
}
function cardBrand(num) {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^6/.test(n)) return "Discover";
  return "Card";
}

function seed() {
  return {
    users: [
      {
        id: "u-admin",
        userId: "admin",
        name: "Prime Admin",
        email: "admin@primeservicesgroupks.com",
        phone: "",
        password: "primeadmin",
        role: "admin",
        license: "",
        dob: "1985-01-01",
        createdAt: new Date().toISOString(),
      },
    ],
    vehicles: VEHICLES.map((v) => ({ ...v })),
    bookings: [],
    notifications: [],
    paymentMethods: [],
    payments: [],
    payout: {
      holder: "Prime Services Group KS",
      bankName: "Sample operating bank",
      accountType: "Checking",
      routingLast4: "0021",
      accountLast4: "4481",
      sample: true,
    },
  };
}
function load() {
  return { users: [], vehicles: [], bookings: [], notifications: [], paymentMethods: [], payments: [], payout: { holder: "", bankName: "", accountType: "Checking", routingLast4: "", accountLast4: "", sample: true }, me: null };
}
let db = load();
const TOKEN_KEY = "psgks_token";
async function api(action, data) {
  const res = await fetch(action ? "/api/action" : "/api/state", {
    method: action ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + (localStorage.getItem(TOKEN_KEY) || "")
    },
    body: action ? JSON.stringify({ action, data }) : undefined
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || "Request failed");
  if (payload.token) localStorage.setItem(TOKEN_KEY, payload.token);
  if (action === "logout") localStorage.removeItem(TOKEN_KEY);
  if (payload.state) db = payload.state;
  return payload;
}
function save() {}
function currentUser() {
  return db.me || null;
}
function vehicleById(id) {
  return db.vehicles.find((v) => v.id === id);
}
function userById(id) {
  return db.users.find((u) => u.id === id);
}

function notify(userId, type, title, body, bookingId) {
  const item = {
    id: uid("nt"),
    userId,
    type,
    title,
    body,
    bookingId: bookingId || null,
    read: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.unshift(item);
  if (
    currentUser() &&
    currentUser().id === userId &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    try {
      new Notification(title, { body });
    } catch (e) {}
  }
  return item;
}
function unreadCount(user) {
  if (!user) return 0;
  return db.notifications.filter((n) => n.userId === user.id && !n.read).length;
}
function toast(text) {
  const host = document.getElementById("toasts");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = text;
  host.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function blockingBookings(vehicleId, ignoreId) {
  return db.bookings.filter(
    (b) =>
      b.vehicleId === vehicleId &&
      b.id !== ignoreId &&
      ["pending", "approved", "pickup", "paid"].includes(b.status),
  );
}
function isAvailable(vehicleId, start, end) {
  return !blockingBookings(vehicleId).some((b) =>
    rangesOverlap(start, end, b.startDate, b.endDate),
  );
}

function route() {
  const hash = location.hash || "#/";
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  return { name: parts[0] || "home", parts };
}
function go(path) {
  location.hash = path;
}

function chrome() {
  const user = currentUser();
  document.getElementById("topbar").textContent =
    "25 miles included each rental day  ·  Spring Hill, Kansas  ·  Card, cash, Venmo, or Cash App";
  const r = route();
  document.getElementById("header").innerHTML = `
    <button class="brand" data-go="#/">
      <img class="mark" src="images/logo.png" alt="Prime Services Group logo" />
      <span><b>Prime Services Group</b><span>Kansas car rentals</span></span>
    </button>
    <nav class="nav">
      <button data-go="#/" class="${r.name === "home" ? "active" : ""}">Home</button>
      <button data-go="#/fleet" class="${r.name === "fleet" || r.name === "cars" ? "active" : ""}">Fleet</button>
      <button data-go="#/how" class="${r.name === "how" ? "active" : ""}">How it works</button>
      ${user && user.role === "admin" ? `<button data-go="#/admin" class="${r.name === "admin" ? "active" : ""}">Admin</button>` : ""}
    </nav>
    <div class="header-actions">
      ${
        user
          ? `<button class="icon-btn" data-action="drawer" aria-label="Notifications">${unreadCount(user) ? `<span class="badge">${unreadCount(user)}</span>` : ""}&#128276;</button>
      <button class="btn small" data-go="${user.role === "admin" ? "#/admin" : "#/account"}">${esc(user.userId)}</button>`
          : `<button class="btn small secondary" data-go="#/login">Log in</button><button class="btn small" data-go="#/register">Create ID</button>`
      }
    </div>`;
  const tabs = [
    ["#/", "Home", r.name === "home"],
    [
      "#/fleet",
      "Fleet",
      r.name === "fleet" || r.name === "cars" || r.name === "book",
    ],
    ["#/notifications", "Alerts", r.name === "notifications"],
    [
      user ? (user.role === "admin" ? "#/admin" : "#/account") : "#/login",
      user ? (user.role === "admin" ? "Admin" : "Account") : "Log in",
      ["account", "admin", "login", "register", "pay"].includes(r.name),
    ],
  ];
  document.getElementById("tabbar").innerHTML = tabs
    .map(
      ([href, label, on]) =>
        `<button data-go="${href}" class="${on ? "active" : ""}">${label}</button>`,
    )
    .join("");
  document.getElementById("footer").innerHTML = `
    <img class="mark" src="images/logo.png" alt="" style="width:36px;height:36px;margin-bottom:8px" />
    <strong>Prime Services Group KS</strong> · primeservicesgroupks<br>
    Pickup arranged in Spring Hill, Kansas. Daily mileage limit ${MILE_LIMIT} miles, then ${money(OVERAGE)} per extra mile.
    Card and bank numbers are not charged or stored in full. Cash, Venmo, and Cash App are collected at pickup.`;
}

function homeView() {
  return `
    <section class="hero">
      <div class="hero-copy">
        <div class="kicker">Prime Services Group KS</div>
        <h1>A car when you need it. Twenty Five miles a day.</h1>
        <p class="lede">Browse the Prime Services Group fleet, request the dates, and wait for a yes or no. Every rental day includes ${MILE_LIMIT} miles. After we confirm, pay by card or bank, or settle in cash, Venmo, or Cash App when you pick up.</p>
        <div class="row-actions">
          <button class="btn" data-go="#/fleet">Choose a car</button>
          <button class="btn secondary" data-go="#/register">Create a renter ID</button>
        </div>
      </div>
      <div class="hero-photo" style="background-image:url('images/accord-quarter.jpg')">
        <span>2016 Accord EX · 85,000 miles</span>
      </div>
    </section>
    <section class="section">
      <div class="kicker">Fleet</div>
      <h2>Available now</h2>
      <div class="car-grid">${db.vehicles.map(carCard).join("")}</div>
    </section>
    <section class="section">
      <div class="kicker">Rental rules</div>
      <h2>How a booking moves</h2>
      <div class="steps">
        ${[
          [
            "01",
            "Create your ID",
            "Name, user ID, license, and date of birth. Renters must be 21 or older.",
          ],
          [
            "02",
            "Request dates",
            "Pick a car. We show the day count, price, deposit, and miles included.",
          ],
          [
            "03",
            "Admin decides",
            "Prime confirms or denies the request. You get an alert either way.",
          ],
          [
            "04",
            "Pay after yes",
            "Pay by card or bank now, or choose cash, Venmo, or Cash App at pickup. Both sides are notified.",
          ],
        ]
          .map(
            ([n, t, b]) =>
              `<article class="card pad"><div class="step-no">${n}</div><h3>${t}</h3><p class="muted">${b}</p></article>`,
          )
          .join("")}
      </div>
    </section>`;
}

function carCard(v) {
  return `<article class="card car-card">
    <img src="${v.images[0]}" alt="${esc(v.name)}" />
    <div class="pad">
      <div class="spread"><h3>${esc(v.name)}</h3><span class="pill">${esc(v.status)}</span></div>
      <p class="muted small">${esc(v.summary)}</p>
      <div class="chips">
        <span class="chip">${Number(v.miles).toLocaleString()} mi</span>
        <span class="chip">${esc(v.transmission)}</span>
        <span class="chip strong">${MILE_LIMIT} mi/day</span>
      </div>
      <div class="spread">
        <div class="price">${money(v.dailyRate)} <small>/ day</small></div>
        <button class="btn small" data-go="#/cars/${v.id}">View & book</button>
      </div>
    </div>
  </article>`;
}

function fleetView() {
  const q = ui.search.trim().toLowerCase();
  const list = db.vehicles.filter(
    (v) => !q || (v.name + v.color + v.trim + v.body).toLowerCase().includes(q),
  );
  return `
    <div class="kicker">Fleet</div>
    <h2>Select a vehicle</h2>
    <div class="search">
      <input id="fleet-search" placeholder="Search Accord, Cruze, sedan…" value="${esc(ui.search)}" />
    </div>
    <div class="car-grid">${list.map(carCard).join("") || `<p class="muted">No cars match that search.</p>`}</div>`;
}

function carView(id) {
  const v = vehicleById(id);
  if (!v) return `<h2>Car not found</h2>`;
  const shot = ui.gallery[id] || 0;
  return `
    <button class="text-btn" data-go="#/fleet">← Fleet</button>
    <div class="grid-2" style="margin-top:8px">
      <div>
        <div class="gallery">
          <img class="gallery-main" src="${v.images[shot]}" alt="${esc(v.name)} photo ${shot + 1}" />
          <div class="thumbs">
            ${v.images.map((src, i) => `<button data-action="thumb" data-car="${v.id}" data-i="${i}" class="${i === shot ? "active" : ""}"><img src="${src}" alt="" /></button>`).join("")}
          </div>
        </div>
        <div class="section">
          <h3>About this car</h3>
          <p>${esc(v.description)}</p>
          <div class="chips">${v.features.map((f) => `<span class="chip">${esc(f)}</span>`).join("")}</div>
        </div>
      </div>
      <aside>
        <div class="card pad">
          <div class="kicker">${esc(v.trim)} · ${esc(v.color)}</div>
          <h2 style="margin-top:6px">${esc(v.name)}</h2>
          <div class="price">${money(v.dailyRate)} <small>per day</small></div>
          <p class="small muted">Refundable deposit ${money(v.deposit)} · ${MILE_LIMIT} miles included per day · ${money(OVERAGE)} each mile over</p>
          <div class="spec-grid">
            ${[
              ["Mileage", Number(v.miles).toLocaleString() + " owner-reported"],
              ["Engine", v.engine],
              ["Output", v.horsepower + " hp"],
              ["Transmission", v.transmission],
              ["Drive", v.drivetrain],
              ["Economy", v.mpg],
              ["Seats", String(v.seats)],
              ["Body", v.body],
            ]
              .map(
                ([k, val]) =>
                  `<div class="spec"><span>${k}</span><b>${esc(val)}</b></div>`,
              )
              .join("")}
          </div>
          <button class="btn full" style="margin-top:14px" data-go="#/book/${v.id}" ${v.status === "available" ? "" : "disabled"}>${v.status === "available" ? "Request this car" : "Not available"}</button>
        </div>
        <div class="callout" style="margin-top:12px">
          <span class="small">Daily mileage limit</span>
          <strong>${MILE_LIMIT} miles</strong>
          <p class="small">A 3-day rental includes 75 miles. Extra miles are billed after return at ${money(OVERAGE)} each. Fuel is full-to-full.</p>
        </div>
      </aside>
    </div>`;
}

function authView(mode) {
  const login = mode === "login";
  return `
    <div class="grid-2">
      <div class="card pad">
        <div class="kicker">${login ? "Welcome back" : "New renter"}</div>
        <h2>${login ? "Log in with your user ID" : "Create a user ID"}</h2>
        <form data-action="${login ? "login" : "register"}">
          ${
            login
              ? ""
              : `<label>Full name<input name="name" required placeholder="Ada Adewunmi" /></label>
          <div class="form-row">
            <label>Email<input name="email" type="email" required /></label>
            <label>Phone<input name="phone" required placeholder="913-555-0100" /></label>
          </div>
          <div class="form-row">
            <label>Driver license<input name="license" required /></label>
            <label>Date of birth<input name="dob" type="date" required max="${todayIso()}" /></label>
          </div>`
          }
          <label>User ID<input name="userId" required autocomplete="username" placeholder="yourname" /></label>
          <label>Password<input name="password" type="password" required minlength="${login ? 1 : 6}" autocomplete="${login ? "current-password" : "new-password"}" /></label>
          <p class="error" id="form-error"></p>
          <button class="btn" type="submit">${login ? "Log in" : "Create ID and continue"}</button>
        </form>
        <p class="small muted">${login ? `No ID yet? <button class="text-btn" data-go="#/register">Create one</button>` : `Already registered? <button class="text-btn" data-go="#/login">Log in</button>`}</p>
      </div>
      <div>
        <div class="demo">
          <strong>Shared rental desk</strong>
          <p class="small">Bookings are stored on the server, so a renter and admin can use different phones. Admin signs in with the user ID set on the host.</p>
        </div>
        <div class="card pad" style="margin-top:12px">
          <h3>Before you book</h3>
          <p class="small muted">Renters must be 21, hold a valid license, and carry their own auto insurance. The 25-mile daily limit is firm. Requests are not confirmed until admin approves them. Payment opens only after approval.</p>
        </div>
      </div>
    </div>`;
}

function bookView(id) {
  const user = currentUser();
  const v = vehicleById(id);
  if (!v) return `<h2>Car not found</h2>`;
  if (!user) {
    return `<div class="card pad"><h2>Log in to request ${esc(v.name)}</h2><p>Bookings are tied to a renter ID.</p><button class="btn" data-go="#/login">Log in</button></div>`;
  }
  if (v.status !== "available") {
    return `<div class="card pad"><h2>${esc(v.name)} is not available</h2><p>Admin has this car marked ${esc(v.status)}.</p></div>`;
  }
  if (user.role === "admin") {
    return `<div class="card pad"><h2>Admin accounts don’t book cars</h2><p>Use a renter ID to send a request, then switch back to admin to confirm it.</p></div>`;
  }
  const start = todayIso();
  return `
    <button class="text-btn" data-go="#/cars/${v.id}">← ${esc(v.name)}</button>
    <div class="grid-2" style="margin-top:8px">
      <form class="card pad" data-action="book" data-car="${v.id}">
        <div class="kicker">Request</div>
        <h2>Choose dates</h2>
        <div class="form-row">
          <label>Pickup<input type="date" name="start" min="${start}" value="${start}" required /></label>
          <label>Return<input type="date" name="end" min="${start}" value="${addDays(start, 1)}" required /></label>
        </div>
        <label>Notes for admin<textarea name="notes" placeholder="Pickup window, where you’ll drive, anything we should know"></textarea></label>
        <p class="error" id="form-error"></p>
        <button class="btn" type="submit">Submit request</button>
        <p class="small muted">Submitting sends an alert to you and to admin. The car is held while the request is pending.</p>
      </form>
      <aside class="card pad" id="quote" data-rate="${v.dailyRate}" data-deposit="${v.deposit}">
        <h3>${esc(v.name)}</h3>
        <p class="small muted">${esc(v.color)} · ${Number(v.miles).toLocaleString()} miles · ${money(v.dailyRate)}/day</p>
        <div id="quote-body"></div>
      </aside>
    </div>`;
}

function quoteHtml(days, rate, deposit) {
  const miles = days * MILE_LIMIT;
  const sub = days * rate;
  return `
    <div class="spec"><span>Days billed</span><b>${days}</b></div>
    <div class="spec"><span>Miles included</span><b>${miles} miles</b></div>
    <div class="spec"><span>Rental</span><b>${money(sub)}</b></div>
    <div class="spec"><span>Refundable deposit</span><b>${money(deposit)}</b></div>
    <div class="spec"><span>Due after approval</span><b>${money(sub + deposit)}</b></div>
    <p class="small muted">Overage beyond ${miles} miles is ${money(OVERAGE)} per mile, billed after the car is returned. Deposit is held and released if the car comes back as agreed.</p>`;
}

function accountView() {
  const user = currentUser();
  if (!user) return authView("login");
  if (user.role === "admin") return adminView();
  const methods = db.paymentMethods.filter((m) => m.userId === user.id);
  const bookings = db.bookings.filter((b) => b.renterId === user.id);
  return `
    <div class="kicker">Renter</div>
    <h2>${esc(user.name)}</h2>
    <p class="muted">User ID ${esc(user.userId)} · ${esc(user.email)}</p>
    <div class="stat-grid">
      <div class="card stat"><span class="small muted">Requests</span><b>${bookings.length}</b></div>
      <div class="card stat"><span class="small muted">Awaiting payment</span><b>${bookings.filter((b) => b.status === "approved").length}</b></div>
      <div class="card stat"><span class="small muted">Payment methods</span><b>${methods.length}</b></div>
    </div>
    <div class="grid-2 section">
      <div>
        <h3>Your bookings</h3>
        ${bookings.length ? `<div class="list">${bookings.map(bookingCard).join("")}</div>` : `<div class="card pad"><p>No requests yet.</p><button class="btn small" data-go="#/fleet">Browse cars</button></div>`}
      </div>
      <div>
        <h3>Card or bank</h3>
        <div class="note">Demo only. Full numbers are not stored — just the brand and last four, so you can pay after a booking is approved.</div>
        <div class="list" style="margin-top:10px">
          ${methods.map((m) => `<article class="card pad spread"><div><b>${esc(m.label)}</b><div class="small muted">${esc(m.detail)}</div></div><button class="text-btn" data-action="remove-method" data-id="${m.id}">Remove</button></article>`).join("") || `<p class="small muted">No method on file.</p>`}
        </div>
        <form class="card pad" data-action="add-method" style="margin-top:10px">
          <label>Type
            <select name="type">
              <option value="card">Debit or credit card</option>
              <option value="bank">Bank account</option>
            </select>
          </label>
          <label>Name on account<input name="holder" required value="${esc(user.name)}" /></label>
          <div id="method-fields"></div>
          <p class="error" id="form-error"></p>
          <button class="btn" type="submit">Save payment method</button>
        </form>
        <p style="margin-top:14px"><button class="btn secondary small" data-action="logout">Log out</button></p>
      </div>
    </div>`;
}

function bookingCard(b) {
  const v = vehicleById(b.vehicleId);
  const renter = userById(b.renterId);
  const user = currentUser();
  return `<article class="card booking">
    <div class="booking-top">
      <strong>${esc(b.ref)}</strong>
      <span class="pill ${b.status}">${esc(b.status)}</span>
    </div>
    <div>${esc(v ? v.name : "Vehicle")} · ${fmtDate(b.startDate)} to ${fmtDate(b.endDate)}</div>
    <div class="small muted">${b.days} day${b.days > 1 ? "s" : ""} · ${b.milesIncluded} miles included · due ${money(b.total)}</div>
    ${renter && user && user.role === "admin" ? `<div class="small">Renter ${esc(renter.name)} · ID ${esc(renter.userId)} · ${esc(renter.phone || renter.email)}</div>` : ""}
    ${b.notes ? `<div class="small muted">Note: ${esc(b.notes)}</div>` : ""}
    ${b.denialReason ? `<div class="small">Denied: ${esc(b.denialReason)}</div>` : ""}
    ${b.paymentLabel ? `<div class="small muted">Payment: ${esc(b.paymentLabel)}</div>` : ""}
    <div class="actions">
      ${user && user.role === "admin" && b.status === "pending" ? `<button class="btn small" data-action="approve" data-id="${b.id}">Confirm</button><button class="btn small danger" data-action="deny" data-id="${b.id}">Deny</button>` : ""}
      ${user && user.role === "admin" && b.status === "pickup" ? `<button class="btn small" data-action="mark-paid" data-id="${b.id}">Mark payment received</button>` : ""}
      ${user && user.role !== "admin" && b.status === "approved" ? `<button class="btn small" data-go="#/pay/${b.id}">Choose payment</button>` : ""}
      ${user && user.role !== "admin" && b.status === "pending" ? `<button class="btn small secondary" data-action="cancel" data-id="${b.id}">Cancel request</button>` : ""}
    </div>
  </article>`;
}

function payView(id) {
  const user = currentUser();
  const b = db.bookings.find((x) => x.id === id);
  if (!user || !b || b.renterId !== user.id)
    return `<h2>Payment unavailable</h2>`;
  if (b.status === "paid")
    return `<div class="card pad"><h2>Paid</h2><p>${esc(b.ref)} is paid. Pickup will be arranged in Spring Hill.</p><button class="btn" data-go="#/account">Back to bookings</button></div>`;
  if (b.status === "pickup")
    return `<div class="card pad"><h2>Pay at pickup</h2><p>${esc(b.ref)} will be settled by ${esc(b.paymentLabel)} when you pick up in Spring Hill.</p><button class="btn" data-go="#/account">Back to bookings</button></div>`;
  if (b.status !== "approved")
    return `<div class="card pad"><h2>Not ready to pay</h2><p>This request is ${esc(b.status)}. Payment opens only after admin confirms it.</p></div>`;
  const methods = db.paymentMethods.filter((m) => m.userId === user.id);
  const payout = db.payout;
  return `
    <div class="kicker">Checkout</div>
    <h2>Pay for ${esc(b.ref)}</h2>
    <div class="grid-2">
      <form class="card pad" data-action="pay" data-id="${b.id}">
        <p>Admin confirmed this rental. Pay now, or choose cash, Venmo, or Cash App at pickup.</p>
        <label>How to pay
          <select name="payChoice">
            <option value="now">Card or bank now</option>
            <option value="Cash">Cash at pickup</option>
            <option value="Venmo">Venmo at pickup</option>
            <option value="Cash App">Cash App at pickup</option>
          </select>
        </label>
        ${methods.length ? `<label>Card or bank on file<select name="methodId">${methods.map((m) => `<option value="${m.id}">${esc(m.label)} · ${esc(m.detail)}</option>`).join("")}</select></label>` : `<div class="note">Add a card or bank only if you want to pay now. Cash, Venmo, and Cash App do not need a card on file.</div>`}
        <p class="error" id="form-error"></p>
        <button class="btn" type="submit">Confirm ${money(b.total)}</button>
        <button class="btn secondary" type="button" data-go="#/account">Add a payment method</button>
      </form>
      <aside class="card pad">
        <h3>${esc(vehicleById(b.vehicleId).name)}</h3>
        <div class="spec"><span>Dates</span><b>${fmtDate(b.startDate)} – ${fmtDate(b.endDate)}</b></div>
        <div class="spec"><span>Rental</span><b>${money(b.subtotal)}</b></div>
        <div class="spec"><span>Deposit hold</span><b>${money(b.deposit)}</b></div>
        <div class="spec"><span>Total</span><b>${money(b.total)}</b></div>
        <div class="spec"><span>Receiving account</span><b>${esc(payout.holder)} · ${esc(payout.bankName)} · ••••${esc(payout.accountLast4)}</b></div>
        <p class="small muted">${payout.sample ? "Admin is still on the sample payout account. Replace it in the admin desk before taking real payments." : "Funds are marked received into the payout account on file."} This demo does not charge the card.</p>
      </aside>
    </div>`;
}

function notificationsView() {
  const user = currentUser();
  if (!user)
    return `<div class="card pad"><h2>Log in to see alerts</h2><button class="btn" data-go="#/login">Log in</button></div>`;
  const items = db.notifications.filter((n) => n.userId === user.id);
  return `
    <div class="spread"><h2>Notifications</h2><button class="btn small secondary" data-action="read-all">Mark all read</button></div>
    <div class="list">
      ${items.map((n) => `<article class="card pad"><div class="spread"><strong>${esc(n.title)}</strong><span class="small muted">${new Date(n.createdAt).toLocaleString()}</span></div><p>${esc(n.body)}</p>${n.read ? "" : `<span class="pill pending">New</span>`}</article>`).join("") || `<p class="muted">No alerts yet. A request, decision, or payment will land here.</p>`}
    </div>`;
}

function adminView() {
  const user = currentUser();
  if (!user || user.role !== "admin")
    return `<div class="card pad"><h2>Admin only</h2><p>Log in with user ID admin.</p><button class="btn" data-go="#/login">Log in</button></div>`;
  const pending = db.bookings.filter((b) => b.status === "pending").length;
  const approved = db.bookings.filter((b) => b.status === "approved").length;
  const paid = db.payments.reduce((s, p) => s + p.amount, 0);
  const p = db.payout;
  return `
    <div class="kicker">Admin desk</div>
    <h2>Confirm rentals and receive payment</h2>
    <div class="stat-grid">
      <div class="card stat"><span class="small muted">Needs a decision</span><b>${pending}</b></div>
      <div class="card stat"><span class="small muted">Approved, unpaid</span><b>${approved}</b></div>
      <div class="card stat"><span class="small muted">Marked received</span><b>${money(paid)}</b></div>
    </div>
    <section class="section">
      <h3>Booking queue</h3>
      <div class="list">${db.bookings.map(bookingCard).join("") || `<p class="muted">No requests yet.</p>`}</div>
    </section>
    <div class="grid-2">
      <form class="card pad" data-action="save-payout">
        <h3>Account that receives payment</h3>
        <p class="small muted">Renters pay only after you confirm. The receipt names this account. Full routing and account numbers are not stored.</p>
        <label>Account holder<input name="holder" required value="${esc(p.holder)}" /></label>
        <label>Bank name<input name="bankName" required value="${esc(p.bankName)}" /></label>
        <label>Account type
          <select name="accountType">
            <option ${p.accountType === "Checking" ? "selected" : ""}>Checking</option>
            <option ${p.accountType === "Savings" ? "selected" : ""}>Savings</option>
          </select>
        </label>
        <div class="form-row">
          <label>Routing number<input name="routing" inputmode="numeric" placeholder="9 digits" /></label>
          <label>Account number<input name="account" inputmode="numeric" placeholder="Account number" /></label>
        </div>
        <p class="small muted">On file now: routing ••••${esc(p.routingLast4)} · account ••••${esc(p.accountLast4)}${p.sample ? " · sample" : ""}</p>
        <button class="btn" type="submit">Save payout account</button>
      </form>
      <div>
        <div class="card pad">
          <h3>Payments received</h3>
          ${db.payments.length ? db.payments.map((pay) => `<div class="spec"><span>${esc(pay.ref)} · ${esc(pay.method)}</span><b>${money(pay.amount)}</b></div>`).join("") : `<p class="small muted">None yet.</p>`}
        </div>
        <div class="card pad" style="margin-top:12px">
          <h3>Fleet</h3>
          ${db.vehicles
            .map(
              (
                v,
              ) => `<form data-action="save-rate" data-id="${v.id}" class="spec">
            <span>${esc(v.name)}<br><span class="small muted">${esc(v.status)} · ${Number(v.miles).toLocaleString()} mi</span></span>
            <span style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">
              <input name="dailyRate" type="number" min="1" step="1" value="${v.dailyRate}" style="width:90px" />
              <button class="btn small" type="submit">Rate</button>
              <button class="btn small secondary" type="button" data-action="toggle-car" data-id="${v.id}">${v.status === "available" ? "Pause" : "List"}</button>
              <button class="btn small danger" type="button" data-action="remove-car" data-id="${v.id}">Remove</button>
            </span>
          </form>`,
            )
            .join("")}
          <p style="margin-top:12px"><button class="btn secondary small" data-action="logout">Log out</button> <button class="btn secondary small" data-action="reset-password">Reset a password</button></p>
        </div>
      </div>
    </div>
    <section class="section">
      <form class="card pad" data-action="add-car">
        <div class="kicker">Fleet</div>
        <h3>Add a car</h3>
        <p class="small muted">New cars show on the fleet immediately and use the same 25-mile daily limit. Photos stay in this browser. Add up to 5, and cover the plate before you upload.</p>
        <div class="form-row">
          <label>Year<input name="year" type="number" min="1990" max="2030" required placeholder="2017" /></label>
          <label>Make<input name="make" required placeholder="Toyota" /></label>
        </div>
        <div class="form-row">
          <label>Model<input name="model" required placeholder="Camry" /></label>
          <label>Trim<input name="trim" placeholder="SE" /></label>
        </div>
        <div class="form-row">
          <label>Color<input name="color" required placeholder="Silver" /></label>
          <label>Mileage<input name="miles" type="number" min="0" required placeholder="60000" /></label>
        </div>
        <div class="form-row">
          <label>Daily rate<input name="dailyRate" type="number" min="1" step="1" required placeholder="45" /></label>
          <label>Deposit<input name="deposit" type="number" min="0" step="1" required placeholder="150" /></label>
        </div>
        <div class="form-row">
          <label>Body<input name="body" placeholder="Sedan" /></label>
          <label>Seats<input name="seats" type="number" min="2" max="15" value="5" /></label>
        </div>
        <div class="form-row">
          <label>Transmission<input name="transmission" placeholder="Automatic" /></label>
          <label>Drivetrain<input name="drivetrain" placeholder="Front-wheel drive" /></label>
        </div>
        <div class="form-row">
          <label>Engine<input name="engine" placeholder="2.5L inline-4" /></label>
          <label>Horsepower<input name="horsepower" type="number" min="0" placeholder="178" /></label>
        </div>
        <label>Fuel economy<input name="mpg" placeholder="28 city / 39 highway" /></label>
        <label>Short summary<input name="summary" required placeholder="One line renters see on the fleet card" /></label>
        <label>Listing description<textarea name="description" required placeholder="Condition, equipment, and who the car suits"></textarea></label>
        <label>Features, separated by commas<input name="features" placeholder="Bluetooth, backup camera, cruise control" /></label>
        <label>Photos<input name="photos" type="file" accept="image/*" multiple required /></label>
        <p class="error" id="form-error"></p>
        <button class="btn" type="submit">Add car to fleet</button>
      </form>
    </section>`;
}

function howView() {
  return `
    <div class="kicker">Policy</div>
    <h2>Rental terms</h2>
    <div class="card pad">
      <div class="spec"><span>Mileage</span><b>${MILE_LIMIT} miles per rental day, then ${money(OVERAGE)} per mile</b></div>
      <div class="spec"><span>Day count</span><b>Return date minus pickup date, minimum 1 day</b></div>
      <div class="spec"><span>Fuel</span><b>Full to full</b></div>
      <div class="spec"><span>Driver</span><b>21 or older, valid license, renter’s own insurance</b></div>
      <div class="spec"><span>Pickup</span><b>Spring Hill, Kansas, after the rental is confirmed</b></div>
      <div class="spec"><span>Decision</span><b>A request is not a reservation until admin confirms</b></div>
      <div class="spec"><span>Payment</span><b>Card or bank after approval, or cash, Venmo, or Cash App at pickup</b></div>
    </div>
    <p class="small muted">Mileage figures on the cars are owner-reported. Listing photos are the actual vehicles.</p>`;
}

function render() {
  chrome();
  const r = route();
  const app = document.getElementById("app");
  let html = "";
  if (r.name === "home") html = homeView();
  else if (r.name === "fleet") html = fleetView();
  else if (r.name === "cars") html = carView(r.parts[1]);
  else if (r.name === "login") html = authView("login");
  else if (r.name === "register") html = authView("register");
  else if (r.name === "book") html = bookView(r.parts[1]);
  else if (r.name === "account") html = accountView();
  else if (r.name === "pay") html = payView(r.parts[1]);
  else if (r.name === "admin") html = adminView();
  else if (r.name === "notifications") html = notificationsView();
  else if (r.name === "how") html = howView();
  else html = `<h2>Page not found</h2>`;
  app.innerHTML = html;
  const quote = document.getElementById("quote");
  if (quote) refreshQuote();
  const methodFields = document.getElementById("method-fields");
  if (methodFields) fillMethodFields();
  document.getElementById("drawer").hidden = true;
}

function refreshQuote() {
  const form = document.querySelector('form[data-action="book"]');
  const quote = document.getElementById("quote");
  if (!form || !quote) return;
  const start = form.start.value;
  const end = form.end.value;
  const body = document.getElementById("quote-body");
  if (!start || !end || parseDate(end) < parseDate(start)) {
    body.innerHTML = `<p class="error">Return must be on or after pickup.</p>`;
    return;
  }
  body.innerHTML = quoteHtml(
    rentalDays(start, end),
    Number(quote.dataset.rate),
    Number(quote.dataset.deposit),
  );
}
function fillMethodFields() {
  const form = document.querySelector('form[data-action="add-method"]');
  const host = document.getElementById("method-fields");
  if (!form || !host) return;
  const type = form.type.value;
  host.innerHTML =
    type === "card"
      ? `<label>Card number<input name="number" inputmode="numeric" required placeholder="4242 4242 4242 4242" /></label>
       <div class="form-row"><label>Expiry<input name="exp" required placeholder="MM/YY" /></label><label>CVC<input name="cvc" required placeholder="123" /></label></div>`
      : `<label>Bank name<input name="bankName" required /></label>
       <label>Account number<input name="number" inputmode="numeric" required /></label>
       <label>Routing number<input name="routing" inputmode="numeric" required /></label>`;
}

function openDrawer() {
  const user = currentUser();
  const drawer = document.getElementById("drawer");
  if (!user) {
    go("#/login");
    return;
  }
  const items = db.notifications
    .filter((n) => n.userId === user.id)
    .slice(0, 8);
  drawer.hidden = false;
  drawer.innerHTML = `<div class="drawer-panel">
    <div class="spread"><h3>Alerts</h3><button class="text-btn" data-action="close-drawer">Close</button></div>
    ${items.map((n) => `<article class="card pad" style="margin-bottom:8px"><strong>${esc(n.title)}</strong><p class="small">${esc(n.body)}</p></article>`).join("") || `<p class="muted">No alerts yet.</p>`}
    <button class="btn small" data-go="#/notifications">See all</button>
  </div>`;
  db.notifications.forEach((n) => {
    if (n.userId === user.id) n.read = true;
  });
  api("read-all", {}).catch(() => {});
  chrome();
}

function readPhotos(fileList) {
  const files = [...fileList].slice(0, 5);
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error("Could not read a photo"));
          reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error("Could not open a photo"));
            img.onload = () => {
              const max = 1100;
              const scale = Math.min(1, max / Math.max(img.width, img.height));
              const canvas = document.createElement("canvas");
              canvas.width = Math.max(1, Math.round(img.width * scale));
              canvas.height = Math.max(1, Math.round(img.height * scale));
              canvas
                .getContext("2d")
                .drawImage(img, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL("image/jpeg", 0.72));
            };
            img.src = reader.result;
          };
          reader.readAsDataURL(file);
        }),
    ),
  );
}

async function handleSubmit(form) {
  const action = form.dataset.action;
  const data = Object.fromEntries(new FormData(form).entries());
  if (form.dataset.id) data.id = form.dataset.id;
  if (form.dataset.car) data.vehicleId = form.dataset.car;
  const err = form.querySelector("#form-error");
  const fail = (msg) => { if (err) err.textContent = msg; toast(msg); };
  try {
    if (action === "add-car") {
      const photos = form.photos.files;
      if (!photos || !photos.length) return fail("Add at least one photo.");
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      const images = await readPhotos(photos);
      data.images = images;
      data.features = String(data.features || "").split(",").map((f) => f.trim()).filter(Boolean);
      await api("add-car", data);
      toast("Car added to the fleet");
      render();
      return;
    }
    await api(action, data);
    if (action === "login") toast("Logged in");
    if (action === "register") toast("User ID created");
    if (action === "book") toast("Request sent. Admin has been alerted.");
    if (action === "add-method") toast("Payment method saved");
    if (action === "pay") toast("Payment choice saved. Both sides were notified.");
    if (action === "save-payout" || action === "save-rate") toast("Saved");
    if (action === "login") go(currentUser() && currentUser().role === "admin" ? "#/admin" : "#/account");
    else if (action === "register") go("#/fleet");
    else if (action === "book" || action === "add-method" || action === "pay") go("#/account");
    else render();
  } catch (e) {
    fail(e.message);
    const btn = form.querySelector("button[type=submit]");
    if (btn) btn.disabled = false;
  }
}

document.body.addEventListener("click", async (e) => {
  const goBtn = e.target.closest("[data-go]");
  if (goBtn) {
    e.preventDefault();
    document.getElementById("drawer").hidden = true;
    go(goBtn.dataset.go);
    return;
  }
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === "drawer") return openDrawer();
  if (action === "close-drawer") { document.getElementById("drawer").hidden = true; return; }
  if (action === "thumb") {
    ui.gallery[btn.dataset.car] = Number(btn.dataset.i);
    render();
    return;
  }
  try {
    if (action === "logout") {
      await api("logout", {});
      toast("Logged out");
      go("#/");
      return;
    }
    if (action === "read-all") { await api("read-all", {}); render(); return; }
    if (action === "remove-method") { await api("remove-method", { id: btn.dataset.id }); render(); return; }
    if (action === "cancel") { await api("cancel", { id: btn.dataset.id }); toast("Request cancelled"); render(); return; }
    if (action === "approve") { await api("approve", { id: btn.dataset.id }); toast("Confirmed. Renter was notified."); render(); return; }
    if (action === "deny") {
      const reason = window.prompt("Reason for denying this request?");
      if (!reason) return;
      await api("deny", { id: btn.dataset.id, reason });
      toast("Denied. Renter was notified.");
      render();
      return;
    }
    if (action === "mark-paid") { await api("mark-paid", { id: btn.dataset.id }); toast("Pickup payment marked received"); render(); return; }
    if (action === "toggle-car") { await api("toggle-car", { id: btn.dataset.id }); render(); return; }
    if (action === "remove-car") {
      if (!window.confirm("Remove this car from the fleet?")) return;
      await api("remove-car", { id: btn.dataset.id });
      toast("Car removed");
      render();
      return;
    }
    if (action === "reset-password") {
      const userId = window.prompt("User ID to reset");
      const password = window.prompt("New password, at least 6 characters");
      if (!userId || !password) return;
      await api("reset-password", { userId, password });
      toast("Password updated");
    }
  } catch (err) {
    toast(err.message);
  }
});

document.body.addEventListener("submit", (e) => {
  const form = e.target.closest("form[data-action]");
  if (!form) return;
  e.preventDefault();
  handleSubmit(form);
});
document.body.addEventListener("input", (e) => {
  if (e.target.id === "fleet-search") {
    ui.search = e.target.value;
    const keep = e.target;
    const pos = keep.selectionStart;
    render();
    const next = document.getElementById("fleet-search");
    if (next) { next.focus(); next.setSelectionRange(pos, pos); }
  }
  if (e.target.name === "start" || e.target.name === "end") refreshQuote();
});
document.body.addEventListener("change", (e) => {
  if (e.target.name === "type" && e.target.form && e.target.form.dataset.action === "add-method") fillMethodFields();
});

window.addEventListener("hashchange", render);
if (!location.hash) location.hash = "#/";
api().then(() => render()).catch(() => render());
