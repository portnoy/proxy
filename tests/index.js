/*
 * 
 * Written for proxy.co by EP
 * April 4, 2018
 *
 */ const axios = require('axios');

module.exports = {
  getUser(username) {
    return axios
      .get(`https://api.github.com/users/${username}`)
      .then(res => res.data)
      .catch(error => { console.log(error.response.status + ' ' + error.response.statusText); throw error; }); 
  },
  getReq(url) {
    return axios
      .get(`${url}`)
      .then(res => res);
      // do NOT catch here, we need it @chai level
  },
  headReq(url) {
    return axios
      .head(`${url}`)
      .then(res => res);
      // do NOT catch here, we need it @chai level
  },
};

