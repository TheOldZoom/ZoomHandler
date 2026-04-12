const { Event } = require("zoomhandler");

module.exports = Event("clientReady", async (client) => {
  console.log(`Logged in as ${client.user?.tag}`);
});
