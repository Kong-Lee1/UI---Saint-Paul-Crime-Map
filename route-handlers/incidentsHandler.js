const sqlHelper = require('../db/sql-helper');

const incidentsHandler = (db, req, res) => {
  let conditionals = [];
  let params = [];

  if (req.query.code) {
    let codes = req.query.code.split(',');
    conditionals.push(sqlHelper.createConditionals('code', codes));
    codes.forEach(code => { params.push(code); });
  }

  if (req.query.grid) {
    let grids = req.query.grid.split(',');
    conditionals.push(sqlHelper.createConditionals('grid', grids));
    grids.forEach(grid => { params.push(grid); });
  }

  if (req.query.id) {
    let ids = req.query.id.split(',');
    conditionals.push(sqlHelper.createConditionals('neighborhood_number', ids));
    ids.forEach(id => { params.push(id); });
  }

  //if the results should be in a range
  if (req.query.start_date && req.query.end_date) {
    conditionals.push('date_time BETWEEN (?) AND (?)');
    //T:23:59:59 is added to these because we still want to include incidents on that day
    params.push(req.query.start_date + 'T23:59:59');
    params.push(req.query.end_date + 'T23:59:59');
  } 
  //if the results should come after a date
  else if (req.query.start_date) {
    conditionals.push('date_time >= (?)');
    //T:23:59:59 is added to these because we still want to include incidents on that day
    params.push(req.query.start_date + 'T23:59:59');
  }
  else if (req.query.end_date) {
    conditionals.push('date_time <= (?)');
    //T:23:59:59 is added to these because we still want to include incidents on that day
    params.push(req.query.end_date + 'T23:59:59');
  }

  //push limit onto the params array since it's always present
  params.push(req.query.limit < 10000 ? req.query.limit : 10000);

  let query;
  if(conditionals.length > 0) {
    query = 'SELECT * FROM Incidents' + sqlHelper.linkTogether(conditionals) + ' ORDER BY date_time DESC LIMIT (?)';
  }
  else {
    query = 'SELECT * FROM Incidents ORDER BY date_time DESC LIMIT (?)';
  }

  db.all(query, params, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      let result = {};

      for (row in data) {
        let current = data[row];
        result[`I${current.case_number}`] = {
          date: current.date_time.split('T')[0],
          time: current.date_time.split('T')[1],
          code: current.code,
          incident: current.incident,
          police_grid: current.police_grid,
          neighborhood_number: current.neighborhood_number,
          block: current.block
        };
      }

      res.send(result);
    }
  });
};

module.exports = incidentsHandler;
