const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3000;
const BASE_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=UTF-8'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  let reqPath = decodeURI(parsedUrl.pathname);
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  if (reqPath === '/admin' || reqPath === '/admin/') reqPath = '/admin.html';
  if (reqPath === '/rooms' || reqPath === '/rooms/') reqPath = '/rooms.html';
  if (reqPath === '/booking' || reqPath === '/booking/') reqPath = '/booking.html';

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // --- API: Staff Authentication ---
  if (reqPath === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { username, password } = JSON.parse(body || '{}');
        const usersPath = path.join(BASE_DIR, 'data', 'users.json');
        fs.readFile(usersPath, 'utf8', (err, data) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ error: 'Failed to access user directory' }));
          }
          let users = {};
          try { users = JSON.parse(data); } catch (e) { users = {}; }

          const targetUser = users[username];
          if (!targetUser) {
            res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ error: 'Invalid username or password' }));
          }

          const passwordHash = crypto.createHash('sha256').update(password || '').digest('hex');
          if (passwordHash !== targetUser.password_hash) {
            res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ error: 'Invalid username or password' }));
          }

          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({
            success: true,
            user: {
              username,
              role: targetUser.role,
              full_name: targetUser.full_name
            }
          }));
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ error: 'Malformed JSON payload' }));
      }
    });
    return;
  }

  // --- API: Room Inventory Management & Publishing ---
  if (reqPath === '/api/rooms') {
    const roomsPath = path.join(BASE_DIR, 'data', 'rooms.json');

    // GET /api/rooms
    if (req.method === 'GET') {
      fs.readFile(roomsPath, 'utf8', (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({ error: 'Failed to read room catalog' }));
        }
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(data);
      });
      return;
    }

    // POST /api/rooms (Add or Update Room)
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const roomData = JSON.parse(body || '{}');
          if (!roomData.name || !roomData.rate_per_night) {
            res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ error: 'Room name and nightly rate are required' }));
          }

          fs.readFile(roomsPath, 'utf8', (err, data) => {
            let rooms = [];
            if (!err && data) {
              try { rooms = JSON.parse(data); } catch (e) { rooms = []; }
            }

            // Assign unique ID if not present
            if (!roomData.id) {
              roomData.id = roomData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            }

            // Normalize fields
            roomData.rate_per_night = Number(roomData.rate_per_night);
            roomData.max_guests = Number(roomData.max_guests) || 2;
            roomData.inventory_units = Number(roomData.inventory_units) || 5;
            roomData.available_units = Number(roomData.available_units !== undefined ? roomData.available_units : roomData.inventory_units);
            roomData.status = roomData.status || 'available';
            roomData.date_posted = roomData.date_posted || new Date().toISOString().slice(0, 10);
            roomData.amenities = Array.isArray(roomData.amenities) ? roomData.amenities : [];
            roomData.image = roomData.image || 'assets/images/deluxe-room.jpg';

            const existingIdx = rooms.findIndex(r => r.id === roomData.id);
            if (existingIdx >= 0) {
              rooms[existingIdx] = { ...rooms[existingIdx], ...roomData };
            } else {
              rooms.push(roomData);
            }

            fs.writeFile(roomsPath, JSON.stringify(rooms, null, 2), 'utf8', writeErr => {
              if (writeErr) {
                res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                return res.end(JSON.stringify({ error: 'Failed to write room catalog' }));
              }
              res.writeHead(201, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
              return res.end(JSON.stringify({ success: true, room: roomData }));
            });
          });
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({ error: 'Malformed JSON payload' }));
        }
      });
      return;
    }

    // DELETE /api/rooms (Delete or Unpublish room)
    if (req.method === 'DELETE') {
      const roomId = parsedUrl.searchParams.get('id');
      if (!roomId) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ error: 'Missing room ID parameter' }));
      }

      fs.readFile(roomsPath, 'utf8', (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({ error: 'Failed to read rooms' }));
        }
        let rooms = [];
        try { rooms = JSON.parse(data); } catch (e) { rooms = []; }

        const initialLen = rooms.length;
        rooms = rooms.filter(r => r.id !== roomId);

        if (rooms.length === initialLen) {
          res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({ error: 'Room not found' }));
        }

        fs.writeFile(roomsPath, JSON.stringify(rooms, null, 2), 'utf8', writeErr => {
          if (writeErr) {
            res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ error: 'Failed to update rooms' }));
          }
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({ success: true, message: `Room ${roomId} unpopulated` }));
        });
      });
      return;
    }
  }

  // --- API: Reservations Management ---
  if (reqPath === '/api/reservations') {
    const dataFilePath = path.join(BASE_DIR, 'data', 'reservations.json');

    // GET /api/reservations
    if (req.method === 'GET') {
      fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({ error: 'Failed to read reservations' }));
        }
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(data);
      });
      return;
    }

    // POST /api/reservations (Add or Update)
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const newReservation = JSON.parse(body || '{}');
          fs.readFile(dataFilePath, 'utf8', (err, data) => {
            let reservations = [];
            if (!err && data) {
              try { reservations = JSON.parse(data); } catch (e) { reservations = []; }
            }
            // Check if existing reference or append
            const existingIndex = reservations.findIndex(r => r.reference_id === newReservation.reference_id);
            if (existingIndex >= 0) {
              reservations[existingIndex] = newReservation;
            } else {
              reservations.push(newReservation);
            }
            fs.writeFile(dataFilePath, JSON.stringify(reservations, null, 2), 'utf8', (writeErr) => {
              if (writeErr) {
                res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                return res.end(JSON.stringify({ error: 'Failed to save reservation' }));
              }
              res.writeHead(201, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
              return res.end(JSON.stringify({ success: true, reservation: newReservation }));
            });
          });
        } catch (parseErr) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        }
      });
      return;
    }

    // DELETE /api/reservations?reference_id=...
    if (req.method === 'DELETE') {
      const refId = parsedUrl.searchParams.get('reference_id');
      if (!refId) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ error: 'Missing reference_id parameter' }));
      }

      fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({ error: 'Failed to read reservations' }));
        }
        let reservations = [];
        try { reservations = JSON.parse(data); } catch (e) { reservations = []; }

        const initialLen = reservations.length;
        reservations = reservations.filter(r => r.reference_id !== refId);

        if (reservations.length === initialLen) {
          res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({ error: 'Reservation not found' }));
        }

        fs.writeFile(dataFilePath, JSON.stringify(reservations, null, 2), 'utf8', writeErr => {
          if (writeErr) {
            res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ error: 'Failed to save update' }));
          }
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({ success: true, message: `Reservation ${refId} removed` }));
        });
      });
      return;
    }
  }

  // --- Static Files Handling ---
  const safePath = path.normalize(path.join(BASE_DIR, reqPath));
  if (!safePath.startsWith(BASE_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(safePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Casa Amara server running at http://localhost:${PORT}`);
});
