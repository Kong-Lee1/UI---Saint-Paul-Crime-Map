const xmlconverter = require('js2xmlparser');
const sqlHelper = require('../db/sql-helper');

const codesHandler = (db, req, res) => {
  let query = 'SELECT * FROM Codes';
  let params = [];

  if (req.query.code) {
    let codes = req.query.code.split(',');
    query += ' WHERE ' + sqlHelper.createConditionals('code', codes);
    codes.forEach(code => { params.push(code); })
  }

  db.all(query, params, (err, codes) => {
    if (err) {
      console.error(err);
    } else {
      let results = {};

      for (code in codes) {
        let current = codes[code];
        results[`C${current.code}`] = current.incident_type;
      }

      if (req.query.format && req.query.format == 'xml') {
        results = xmlconverter.parse('codeList', results);
      }

      res.send(results);
    }
  });
};

module.exports = codesHandler;
