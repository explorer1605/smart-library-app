/**
 * SSE Manager — keeps track of connected dashboard clients and broadcasts events.
 */
const clients = new Set();

function addClient(res) {
  clients.add(res);
}

function removeClient(res) {
  clients.delete(res);
}

function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try { client.write(msg); }
    catch (e) { clients.delete(client); }
  });
}

module.exports = { addClient, removeClient, broadcast };
