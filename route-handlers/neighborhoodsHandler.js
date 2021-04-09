const sqlHelper = require('../db/sql-helper');
const xmlconverter = require('js2xmlparser');

const neighborhoodsHandler = (db, req, res) => {
  let query = 'SELECT * FROM Neighborhoods';
  let params = [];

  if (req.query.id) {
    let ids = req.query.id.split(',');
    query += ' WHERE ' + sqlHelper.createConditionals('neighborhood_number', ids);
    ids.forEach(id => { params.push(id); });
  }

  db.all(`${query} `, params, (err, neighborhoods) => {
    if (err) {
      console.error(err);
    } else {
      let result = {};
      //loop through all codes
      for (neighborhood in neighborhoods) {
        //create a key-value pair for the neighborhood in format: "N + neighborhood_number": "neighborhood_name"
        result[`N${neighborhoods[neighborhood].neighborhood_number}`] =
          neighborhoods[neighborhood].neighborhood_name;
      }

      if (req.query.format && req.query.format == 'xml') {
        result = xmlconverter.parse('neighborhoodsList', result);
      }
      res.send(result);
    }
  });
};

module.exports = neighborhoodsHandler;
