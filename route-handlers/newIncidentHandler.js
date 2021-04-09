const newIncidentHandler = (db, req, res) => {
  let data = {
    case_number: req.body.case_number,
    date_time: `${req.body.date}T${req.body.time}`,
    code: parseInt(req.body.code),
    incident: req.body.incident,
    police_grid: parseInt(req.body.police_grid),
    neighborhood_number: parseInt(req.body.neighborhood_number),
    block: req.body.block
  };

  let query = `INSERT INTO Incidents (case_number, date_time, code, incident, police_grid, neighborhood_number, block) VALUES (?, ?, ?, ?, ?, ?, ?)`;

  let params = [];
  for (datapoint in data) {
    params.push(data[datapoint]);
  }

  db.run(query, params, err => {
    if (err) {
      console.log(err);
      res.sendStatus(500);
    } else {
      console.log('successfully inserted');
      res.sendStatus(200);
    }
  });
};

module.exports = newIncidentHandler;
