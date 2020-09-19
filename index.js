const { json } = require("express");
const express = require("express");
const fetch = require("node-fetch");
const redis = require("redis");

const PORT = process.env.PORT || 4000;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);
const app = express();

//set response
function setResponse(username, repos) {
  return `<h2>${username} has ${repos} Repos on Github</h2>`;
}

//make request to github for data
async function getRepos(req, res, next) {
  try {
    console.log("Fetching Data....");
    const { username } = req.params;

    const response = await fetch(`https://api.github.com/users/${username}`);

    const data = await response.json();

    const repos = data.public_repos;
    //set data to Redis
    client.setex(username, 3600, repos);
    res.send(setResponse(username, repos));
  } catch (err) {
    console.log(err);
    res.status(500);
  }
}

//cache middleware
function cache(req, res, next) {
  const { username } = req.params;

  client.get(username, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      res.send(setResponse(username, data));
    } else {
      next();
    }
  });
}

app.get("/repos/:username/", cache, getRepos);

app.listen(4000, () => {
  console.log(`Server running on ${PORT}`);
});
