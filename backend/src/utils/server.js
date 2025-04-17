import fetch from 'node-fetch';

async function getServerPopulation() {
  try {
    // First try to get population from Rust+ API
    if (process.env.RUST_SERVER_ID) {
      const response = await fetch(`https://api.steampowered.com/IGameServersService/GetServerList/v1/?filter=addr\\${process.env.RUST_SERVER_IP}:${process.env.RUST_SERVER_PORT}`);
      const data = await response.json();
      
      if (data.response && data.response.servers && data.response.servers[0]) {
        return data.response.servers[0].players;
      }
    }

    // If Rust+ API fails, try Battlemetrics
    if (process.env.BATTLEMETRICS_SERVER_ID) {
      const response = await fetch(`https://api.battlemetrics.com/servers/${process.env.BATTLEMETRICS_SERVER_ID}`);
      const data = await response.json();
      
      if (data.data && data.data.attributes) {
        return data.data.attributes.players;
      }
    }

    return 'Unable to get server population';
  } catch (error) {
    console.error('Error getting server population:', error);
    return 'Error getting server population';
  }
}

export default {
  getServerPopulation
}; 