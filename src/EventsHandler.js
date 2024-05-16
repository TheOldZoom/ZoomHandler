const fs = require("fs");
const path = require("path");

async function registerEvents(eventsFolder, client) {
  fs.readdir(eventsFolder, (err, eventFolders) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }

    eventFolders.forEach((eventFolder) => {
      const eventFolderPath = path.join(eventsFolder, eventFolder);
      
      fs.stat(eventFolderPath, (err, stats) => {
        if (err) {
          console.error("Error reading folder:", err);
          return;
        }

        if (stats.isDirectory()) {
          fs.readdir(eventFolderPath, (err, files) => {
            if (err) {
              console.error("Error reading event folder:", err);
              return;
            }

            files.filter(file => file.endsWith(".js")).forEach(file => {
              const eventHandler = require(path.join(eventFolderPath, file));
              client.on(eventFolder, eventHandler.bind(null, client));

              client.log.event(`Successfully registered event ${eventFolder}`);
            });
          });
        }
      });
    });
  });
}

module.exports = { registerEvents };
