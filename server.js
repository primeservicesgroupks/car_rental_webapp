const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const DATA = path.join(__dirname, "data", "db.json");
const UPLOADS = path.join(__dirname, "uploads");
const MILE_LIMIT = 25;
const OVERAGE = 0.55;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "primeadmin";

fs.mkdirSync(path.dirname(DATA), { recursive: true });
fs.mkdirSync(UPLOADS, { recursive: true });

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
    images: ["images/accord-quarter.jpg", "images/accord-front.jpg", "images/accord-rear.jpg", "images/accord-dash.jpg", "images/accord-cabin.jpg"],
    features: ["Projector headlights with LED daytime running lights", "Chrome grille bar and 17-inch alloy wheels", "Touchscreen audio with Bluetooth and USB", "Backup camera", "Cruise control and tilt-telescoping wheel", "Cloth seating for five with wood-tone trim", "Power windows, locks, and mirrors"],
    summary: "A quiet midsize sedan for highway days and everyday errands, finished in Crystal Black Pearl.",
    description: "This 2016 Honda Accord EX is a well-kept midsize sedan with 85,000 owner-reported miles. The Crystal Black Pearl paint is paired with a chrome grille bar, projector headlights, and multi-spoke alloy wheels. Inside, cloth seats, wood-tone trim, and a touchscreen audio stack with Bluetooth keep the cabin straightforward. A backup camera, cruise control, and a roomy trunk make it an easy daily driver. Power is Honda’s 2.4-liter i-VTEC four-cylinder, rated at 185 horsepower, paired with a 6-speed automatic transmission. EPA estimates for this generation are about 27 city and 36 highway. Best for renters who want a calm, capable car and can stay inside the 25-mile daily allowance."
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
    images: ["images/cruze-front.jpg", "images/cruze-side.jpg", "images/cruze-rear.jpg", "images/cruze-dash.jpg", "images/cruze-cabin.jpg"],
    features: ["Only 20,000 owner-reported miles", "LT trim with Chevrolet MyLink touchscreen", "Bluetooth, USB, and steering-wheel audio controls", "Cruise control", "Two-tone cloth seats", "16-inch alloy wheels and body-color mirrors", "Compact footprint, easy to park"],
    summary: "A low-mileage compact sedan. Easy to park and inexpensive to run inside the daily mile cap.",
    description: "This 2015 Chevrolet Cruze LT is unusual for the year: 20,000 owner-reported miles, black paint, and the LT equipment group. The bowtie grille, body-color mirrors, and alloy wheels are intact, and the cabin has two-tone cloth seats plus a MyLink touchscreen with Bluetooth. The 1.4-liter turbo four makes 138 horsepower through a 6-speed automatic. EPA estimates are about 26 city and 38 highway. It is the better pick for short Kansas trips, errands, and airport-style hops that fit inside 25 miles a day."
  }
];

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");
  return salt + ":" + hash;
}
function checkPassword(password, stored) {
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) return password === stored;
  const next = crypto.scryptSync(password, salt, 32).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(next));
}
function uid(prefix) {
  return prefix + "-" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}
function seed() {
  return {
    users: [{
      id: "u-admin",
      userId: "admin",
      name: "Prime Admin",
      email: "admin@primeservicesgroupks.com",
      phone: "",
      password: hashPassword(ADMIN_PASSWORD),
      role: "admin",
      license: "",
      dob: "1985-01-01",
      createdAt: new Date().toISOString()
    }],
    sessions: [],
    vehicles: VEHICLES,
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
      sample: true
    }
  };
}
function load() {
  try {
    if (!fs.existsSync(DATA)) return seed();
    const db = JSON.parse(fs.readFileSync(DATA, "utf8"));
    if (!db.users || !db.vehicles) return seed();
    db.sessions = db.sessions || [];
    return db;
  } catch (e) {
    return seed();
  }
}
let db = load();
function save() {
  fs.writeFileSync(DATA, JSON.stringify(db, null, 2));
}
save();

function publicUser(u) {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
}
function userFromToken(req) {
  const header = req.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  return db.users.find((u) => u.id === session.userId) || null;
}
function notify(userId, type, title, body, bookingId) {
  db.notifications.unshift({
    id: uid("nt"),
    userId,
    type,
    title,
    body,
    bookingId: bookingId || null,
    read: false,
    createdAt: new Date().toISOString()
  });
}
function stateFor(user) {
  const isAdmin = user && user.role === "admin";
  return {
    users: (isAdmin ? db.users : db.users.filter((u) => user && u.id === user.id)).map(publicUser),
    vehicles: db.vehicles,
    bookings: db.bookings.filter((b) => isAdmin || (user && b.renterId === user.id)),
    notifications: db.notifications.filter((n) => user && n.userId === user.id),
    paymentMethods: db.paymentMethods.filter((m) => user && m.userId === user.id),
    payments: isAdmin ? db.payments : [],
    payout: db.payout,
    me: publicUser(user)
  };
}
function parseDate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function iso(date) {
  const z = (n) => String(n).padStart(2, "0");
  return date.getFullYear() + "-" + z(date.getMonth() + 1) + "-" + z(date.getDate());
}
function addDays(s, n) {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}
function rentalDays(start, end) {
  return Math.max(1, Math.round((parseDate(end) - parseDate(start)) / 86400000));
}
function occupyEnd(start, end) {
  return start === end ? addDays(end, 1) : end;
}
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < occupyEnd(bStart, bEnd) && bStart < occupyEnd(aStart, aEnd);
}
function cardBrand(num) {
  if (/^4/.test(num)) return "Visa";
  if (/^5[1-5]/.test(num)) return "Mastercard";
  if (/^3[47]/.test(num)) return "Amex";
  if (/^6/.test(num)) return "Discover";
  return "Card";
}
function saveDataUrl(dataUrl) {
  const match = String(dataUrl).match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) return dataUrl;
  const ext = match[1] === "jpeg" ? "jpg" : match[1];
  const name = uid("img") + "." + ext;
  fs.writeFileSync(path.join(UPLOADS, name), Buffer.from(match[2], "base64"));
  return "/uploads/" + name;
}

const app = express();
app.use(express.json({ limit: "15mb" }));
app.use("/uploads", express.static(UPLOADS));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/state", (req, res) => {
  res.json({ state: stateFor(userFromToken(req)) });
});

app.post("/api/action", (req, res) => {
  const user = userFromToken(req);
  const { action, data } = req.body || {};
  const fail = (status, error) => res.status(status).json({ error });
  try {
    if (action === "register") {
      const userId = String(data.userId || "").trim().toLowerCase();
      if (!/^[a-z0-9._-]{3,20}$/.test(userId)) return fail(400, "User ID must be 3–20 letters, numbers, dots, or dashes.");
      if (db.users.some((u) => u.userId === userId)) return fail(400, "That user ID is taken.");
      if (db.users.some((u) => u.email.toLowerCase() === String(data.email).trim().toLowerCase())) return fail(400, "That email is already registered.");
      const age = (Date.now() - parseDate(data.dob)) / (365.25 * 86400000);
      if (age < 21) return fail(400, "Renters must be 21 or older.");
      const created = {
        id: uid("u"),
        userId,
        name: String(data.name).trim(),
        email: String(data.email).trim(),
        phone: String(data.phone).trim(),
        password: hashPassword(data.password),
        role: "renter",
        license: String(data.license).trim(),
        dob: data.dob,
        createdAt: new Date().toISOString()
      };
      db.users.push(created);
      notify(created.id, "welcome", "User ID created", "You can request a car. Admin will confirm before payment opens.");
      const token = crypto.randomBytes(24).toString("hex");
      db.sessions.push({ token, userId: created.id });
      save();
      return res.json({ token, state: stateFor(created) });
    }
    if (action === "login") {
      const found = db.users.find((u) => u.userId === String(data.userId || "").trim().toLowerCase());
      if (!found || !checkPassword(data.password, found.password)) return fail(401, "User ID or password does not match.");
      const token = crypto.randomBytes(24).toString("hex");
      db.sessions.push({ token, userId: found.id });
      save();
      return res.json({ token, state: stateFor(found) });
    }
    if (action === "logout") {
      const header = req.get("authorization") || "";
      const token = header.replace(/^Bearer\s+/i, "");
      db.sessions = db.sessions.filter((s) => s.token !== token);
      save();
      return res.json({ state: stateFor(null) });
    }
    if (!user) return fail(401, "Log in first.");
    if (action === "read-all") {
      db.notifications.forEach((n) => { if (n.userId === user.id) n.read = true; });
      save();
      return res.json({ state: stateFor(user) });
    }
    if (action === "book") {
      if (user.role === "admin") return fail(400, "Use a renter ID to request a car.");
      const v = db.vehicles.find((car) => car.id === data.vehicleId);
      if (!v || v.status !== "available") return fail(400, "That car is not available.");
      if (parseDate(data.end) < parseDate(data.start) || data.start < iso(new Date())) return fail(400, "Check the pickup and return dates.");
      const blocked = db.bookings.some((b) => b.vehicleId === v.id && ["pending", "approved", "pickup", "paid"].includes(b.status) && rangesOverlap(data.start, data.end, b.startDate, b.endDate));
      if (blocked) return fail(400, "Those dates overlap a pending or confirmed rental.");
      const days = rentalDays(data.start, data.end);
      const subtotal = days * v.dailyRate;
      const booking = {
        id: uid("bk"),
        ref: "PSG-" + Math.floor(1000 + Math.random() * 9000),
        renterId: user.id,
        vehicleId: v.id,
        startDate: data.start,
        endDate: data.end,
        days,
        milesIncluded: days * MILE_LIMIT,
        dailyRate: v.dailyRate,
        subtotal,
        deposit: v.deposit,
        total: subtotal + v.deposit,
        notes: String(data.notes || "").trim(),
        status: "pending",
        createdAt: new Date().toISOString()
      };
      db.bookings.unshift(booking);
      notify(user.id, "booking_requested", "Request sent", booking.ref + " for the " + v.name + " is waiting on admin. " + booking.milesIncluded + " miles included.", booking.id);
      db.users.filter((u) => u.role === "admin").forEach((admin) => {
        notify(admin.id, "booking_requested", "New rental request", user.name + " (" + user.userId + ") requested the " + v.name + ".", booking.id);
      });
      save();
      return res.json({ state: stateFor(user) });
    }
    if (action === "add-method") {
      const digits = String(data.number || "").replace(/\D/g, "");
      if (digits.length < 4) return fail(400, "Enter a card or account number.");
      const last4 = digits.slice(-4);
      db.paymentMethods.push(data.type === "card"
        ? { id: uid("pm"), userId: user.id, label: cardBrand(digits) + " •••• " + last4, detail: "Expires " + data.exp + " · " + data.holder }
        : { id: uid("pm"), userId: user.id, label: (data.bankName || "Bank") + " •••• " + last4, detail: "Bank account · " + data.holder });
      save();
      return res.json({ state: stateFor(user) });
    }
    if (action === "remove-method") {
      db.paymentMethods = db.paymentMethods.filter((m) => !(m.id === data.id && m.userId === user.id));
      save();
      return res.json({ state: stateFor(user) });
    }
    if (action === "cancel") {
      const b = db.bookings.find((x) => x.id === data.id && x.renterId === user.id && x.status === "pending");
      if (!b) return fail(400, "That request cannot be cancelled.");
      b.status = "cancelled";
      notify(user.id, "booking_denied", "Request cancelled", b.ref + " was cancelled.", b.id);
      save();
      return res.json({ state: stateFor(user) });
    }
    if (action === "pay") {
      const booking = db.bookings.find((b) => b.id === data.id && b.renterId === user.id);
      if (!booking || booking.status !== "approved") return fail(400, "This booking is not approved.");
      const choice = data.payChoice || "now";
      if (choice !== "now") {
        booking.status = "pickup";
        booking.paymentLabel = choice + " at pickup";
        notify(user.id, "payment_arranged", "Pay at pickup", booking.ref + " will be paid by " + choice + " when you pick up. Amount due $" + booking.total.toFixed(2) + ".", booking.id);
        db.users.filter((u) => u.role === "admin").forEach((admin) => {
          notify(admin.id, "payment_arranged", "Pay at pickup chosen", user.name + " will pay $" + booking.total.toFixed(2) + " for " + booking.ref + " by " + choice + " at pickup.", booking.id);
        });
        save();
        return res.json({ state: stateFor(user) });
      }
      const method = db.paymentMethods.find((m) => m.id === data.methodId && m.userId === user.id);
      if (!method) return fail(400, "Add a card or bank, or choose cash, Venmo, or Cash App.");
      booking.status = "paid";
      booking.paidAt = new Date().toISOString();
      booking.paymentLabel = method.label;
      db.payments.unshift({ id: uid("pay"), bookingId: booking.id, ref: booking.ref, amount: booking.total, method: method.label, payout: db.payout.holder + " ••••" + db.payout.accountLast4, at: booking.paidAt });
      notify(user.id, "payment_received", "Payment received", "$" + booking.total.toFixed(2) + " for " + booking.ref + " is marked paid.", booking.id);
      db.users.filter((u) => u.role === "admin").forEach((admin) => {
        notify(admin.id, "payment_received", "Payment received", "$" + booking.total.toFixed(2) + " for " + booking.ref + " was marked paid by card or bank.", booking.id);
      });
      save();
      return res.json({ state: stateFor(user) });
    }
    if (user.role !== "admin") return fail(403, "Admin only.");
    if (action === "approve") {
      const b = db.bookings.find((x) => x.id === data.id && x.status === "pending");
      const v = b && db.vehicles.find((car) => car.id === b.vehicleId);
      if (!b) return fail(400, "Request not found.");
      b.status = "approved";
      b.decidedAt = new Date().toISOString();
      notify(b.renterId, "booking_approved", "Rental confirmed", b.ref + " for the " + v.name + " is confirmed. Choose how to pay.", b.id);
      save();
      return res.json({ state: stateFor(user) });
    }
    if (action === "deny") {
      const b = db.bookings.find((x) => x.id === data.id && x.status === "pending");
      const v = b && db.vehicles.find((car) => car.id === b.vehicleId);
      if (!b || !data.reason) return fail(400, "A denial reason is required.");
      b.status = "denied";
      b.denialReason = String(data.reason).trim();
      b.decidedAt = new Date().toISOString();
      notify(b.renterId, "booking_denied", "Rental denied", b.ref + " for the " + v.name + " was denied. " + b.denialReason, b.id);
      save();
      return res.json({ state: stateFor(user) });
    }
    if (action === "mark-paid") {
      const b = db.bookings.find((x) => x.id === data.id && x.status === "pickup");
      if (!b) return fail(400, "Nothing to mark received.");
      b.status = "paid";
      b.paidAt = new Date().toISOString();
      db.payments.unshift({ id: uid("pay"), bookingId: b.id, ref: b.ref, amount: b.total, method: b.paymentLabel || "Pickup", payout: "Received at pickup", at: b.paidAt });
      notify(b.renterId, "payment_received", "Payment received", "$" + b.total.toFixed(2) + " for " + b.ref + " was received at pickup.", b.id);
      save();
      return res.json({ state: stateFor(user) });
    }
    if (action === "save-payout") {
      const routing = String(data.routing || "").replace(/\D/g, "");
      const account = String(data.account || "").replace(/\D/g, "");
      if (routing && routing.length !== 9) return fail(400, "Routing number should be 9 digits.");
      if (account && account.length < 4) return fail(400, "Enter the account number to update it.");
      db.payout.holder = String(data.holder).trim();
      db.payout.bankName = String(data.bankName).trim();
      db.payout.accountType = data.accountType;
      if (routing) db.payout.routingLast4 = routing.slice(-4);
      if (account) db.payout.accountLast4 = account.slice(-4);
      db.payout.sample = false;
      save();
      return res.json({ state: stateFor(user) });
    }
    if (action === "save-rate") {
      const v = db.vehicles.find((car) => car.id === data.id);
      if (!v || !(Number(data.dailyRate) > 0)) return fail(400, "Enter a rate.");
      v.dailyRate = Number(data.dailyRate);
      save();
      return res.json({ state: stateFor(user) });
    }
    if (action === "toggle-car") {
      const v = db.vehicles.find((car) => car.id === data.id);
      if (!v) return fail(404, "Car not found.");
      v.status = v.status === "available" ? "paused" : "available";
      save();
      return res.json({ state: stateFor(user) });
    }
    if (action === "remove-car") {
      const active = db.bookings.some((b) => b.vehicleId === data.id && ["pending", "approved", "pickup", "paid"].includes(b.status));
      if (active) return fail(400, "Finish or deny open bookings before removing this car.");
      db.vehicles = db.vehicles.filter((car) => car.id !== data.id);
      save();
      return res.json({ state: stateFor(user) });
    }
    if (action === "add-car") {
      const images = (data.images || []).slice(0, 5).map(saveDataUrl);
      if (!images.length) return fail(400, "Add at least one photo.");
      const name = [data.year, data.make, data.model, data.trim].filter(Boolean).join(" ");
      let id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "car";
      let n = 2;
      while (db.vehicles.some((v) => v.id === id)) id = id.replace(/-\d+$/, "") + "-" + n++;
      db.vehicles.push({
        id, year: Number(data.year), make: data.make, model: data.model, trim: data.trim, name,
        color: data.color, miles: Number(data.miles), seats: Number(data.seats) || 5,
        body: data.body || "Sedan", drivetrain: data.drivetrain || "Front-wheel drive",
        transmission: data.transmission || "Automatic", engine: data.engine || "—",
        horsepower: Number(data.horsepower) || 0, mpg: data.mpg || "—",
        dailyRate: Number(data.dailyRate), deposit: Number(data.deposit), status: "available",
        images, features: data.features || [], summary: data.summary, description: data.description
      });
      save();
      return res.json({ state: stateFor(user) });
    }
    if (action === "reset-password") {
      const target = db.users.find((u) => u.userId === String(data.userId || "").toLowerCase());
      if (!target || String(data.password || "").length < 6) return fail(400, "User not found, or password is under 6 characters.");
      target.password = hashPassword(data.password);
      db.sessions = db.sessions.filter((s) => s.userId !== target.id);
      save();
      return res.json({ state: stateFor(user) });
    }
    return fail(400, "Unknown action.");
  } catch (e) {
    return fail(500, "Could not save that change.");
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log("Prime Services Group KS listening on " + PORT);
});
