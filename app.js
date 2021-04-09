const neighborhoodLocs = {
  "N1": [44.935834, -93.020826],
  "N2": [44.978384, -93.025757],
  "N3": [44.930640, -93.084738],
  "N4": [44.956374, -93.061134],
  "N5": [44.978777, -93.069996],
  "N6": [44.977648, -93.112771],
  "N7": [44.961278, -93.120756],
  "N8": [44.948975, -93.127733],
  "N9": [44.929223, -93.122552],
  "N10": [44.982312, -93.149729],
  "N11": [44.963691, -93.168449],
  "N12": [45.025594, -93.219098],
  "N13": [44.949286, -93.176973],
  "N14": [44.934180, -93.176736],
  "N15": [44.910286, -93.171280],
  "N16": [44.937674, -93.136911],
  "N17": [44.947510, -93.090378],
};

new Vue({
  el: '#app',
  data: {
    test: '',
    active: true,
    map: null,
    lat: 44.95,
    long: -93.10,
    filters: {
      startdate: '2019-10-01',
      enddate: '2019-10-31',
      starttime: '00:00:00',
      endtime: '23:59:59',
      codes: [],
      neighborhoods: []
    },
    incidents: null,
    neighborhoods: null,
    viewport: null,
    visibleNeighborhoods: {},
    popups: {},
    address: '',
    allCodes: null
  },
  methods: {
    initMap() {
      this.map = L.map('stpaulmap', {
        center: [this.lat, this.long],
        zoom: 14,
        maxZoom: 18,
        maxBounds: L.latLngBounds(
          [44.992016, -93.207787],
          [44.8872811, -93.00432]
        )
      });

      for (key in neighborhoodLocs) {
        var newIcon = L.icon({
          iconUrl: './assets/marker2.png',
          iconSize: [40, 40],
          iconAnchor: [22, 94],
          popupAnchor: [-3, -76]
        });
        let marker = L.marker(neighborhoodLocs[key], { icon: newIcon });
        marker.bindPopup();
        let popup = marker._popup;
        this.popups[key] = popup;

        marker.addTo(this.map);
      }

      this.map.on('move', () => {
        let center = this.map.getCenter();
        this.viewport = {
          SW: [
            this.map.getBounds()._southWest.lat,
            this.map.getBounds()._southWest.lng
          ], NE: [
            this.map.getBounds()._northEast.lat,
            this.map.getBounds()._northEast.lng,
          ]
        }
        this.lat = center.lat;
        this.long = center.lng;

        for (key in neighborhoodLocs) {
          let locs = neighborhoodLocs[key];

          //checks if the neighborhood is inside of the viewport
          if (locs[0] > this.viewport.SW[0] && locs[0] < this.viewport.NE[0] && locs[1] > this.viewport.SW[1] && locs[1] < this.viewport.NE[1]) {
            if (!this.visibleNeighborhoods[key]) {
              this.visibleNeighborhoods[key] = locs;
            }
          }
          else {
            if (this.visibleNeighborhoods[key]) {
              delete this.visibleNeighborhoods[key];
            }
          }
        }
      });

      L.tileLayer(
        'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
        {
          minZoom: 11,
          id: 'mapbox/streets-v11',
          accessToken:
            'pk.eyJ1IjoiZHlsYW53cm9iZXJ0cyIsImEiOiJjanh5M3h5aXUwMWZsM2ltZ3d4cWswNHp2In0.24Q_P9cOq_1IoRbUMqqgdA'
        }
      ).addTo(this.map);
    },
    //called whenever the user checks an incident type box
    handleCode(event, code) {
      //gets the code associated with the code selected
      let c = Object.keys(this.allCodes).find(key => { return this.allCodes[key] == code });
      c = c.replace('C', '');

      //checked? add it, unchecked? remove it
      if (event.target.checked) { this.filters.codes.push(c); }
      else this.filters.codes = this.filters.codes.filter(val => { return val !== c; });
    },
    handleNeighborhood(event, n) {
      //gets the neighborhood number associated with the checked neighborhood
      let neigh = Object.keys(this.neighborhoods).find(key => { return this.neighborhoods[key] == n });

      this.map.setZoom(11);
      this.map.setView(neighborhoodLocs[neigh]);

      //checked? add it, unchecked? remove it
      if(event.target.checked) { this.filters.neighborhoods.push(neigh); }
      else this.filters.neighborhoods = this.filters.neighborhoods.filter(val => { return val !== neigh });
    },
    newLatLong() {
      if (this.address.length > 0) {
        axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=minnesota, st paul, ${this.address}`).then(res => {
          this.lat = res.data[0].lat;
          this.lon = res.data[0].lon;
          this.address = '';
          this.map.setView([this.lat, this.long]);
        });
      } else {
        if (Number.isNaN(this.lat) || this.lat === '') { this.lat = 44.9504037; }
        if (Number.isNaN(this.long) || this.long === '') { this.long = -93.1015026; }
        this.map.setView([this.lat, this.long]);
      }
    },
    getCrimeCategory(incident) {
      let categories = {
        'Proactive Police Visit': 'nocrime',
        'Agg. Assault': 'violent',
        'Auto Theft': 'property',
        'Theft': 'property',
        'Vandalism': 'property',
        'Community Engagement Event': 'nocrime',
        'Burglary': 'property',
        'Narcotics': 'other',
        'Discharge': 'other',
        'Rape': 'violent',
        'Robbery': 'property'

      };
      return categories[incident];
    },
    //reaches out to crime API and grabs the incidents
    getIncidents() {
      let url = `https://web-dev-crime-api.herokuapp.com/incidents?start_date=${this.filters.startdate}&end_date=${this.filters.enddate}`;
      axios.get(url).then(res => {
        this.incidents = res.data;

        let counts = {};

        for (key in res.data) {
          let incident = res.data[key];
          //if there already is an entry - inc the count
          if (counts['N' + incident.neighborhood_number] != null) {
            counts['N' + incident.neighborhood_number] += 1;
          }
          //if there isn't an entry - set a spot and initialize it to 0
          else counts['N' + incident.neighborhood_number] = 0;
        }

        for (key in this.neighborhoods) {
          this.popups[key].setContent('<b>' + this.neighborhoods[key] + '</b>' +
            '<br><br># of crimes: ' + counts[key]);
        }
      });
    },
    determineVisibility(incident) {
      let results = [];

      //checks if the incident occurs in the timeframe
      if (incident.time > this.filters.starttime && incident.time < this.filters.endtime) { results.push(true); }
      else results.push(false);

      //checks if the incident is within the view of the map
      if (this.visibleNeighborhoods['N' + incident.neighborhood_number]) { results.push(true); }
      else results.push(false);

      //checks to see if the incident has the selected incident type (only checks if at least 1 checkbox is selected)
      if (this.filters.codes.length > 0) {
        results.push(this.filters.codes.includes(incident.code + ""));
      }

      if(this.filters.neighborhoods.length > 0) {
        results.push(this.filters.neighborhoods.includes("N" + incident.neighborhood_number));
      }

      //if any of the above conditions yield false, the table entry is not accepted
      return !results.includes(false);
    },
    handleTableRowClick(event, incident) {
      let block = event.target.innerText.replace('X', '0');
      axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=minnesota, st paul, ${block}`).then(res => {
        if (res.data[0] == null) { console.error('opps, looks like there is no location'); }
        else {
          let choords = [res.data[0].lat, res.data[0].lon];
          this.map.setView(choords);
          var newIcon = L.icon({
            iconUrl: './assets/marker.png',
            iconSize: [40, 40],
            iconAnchor: [22, 94],
            popupAnchor: [-3, -76]
          });
          let marker = L.marker(choords, { icon: newIcon });
          marker.bindPopup(`<b>${incident.block}</b>
          <br>${incident.incident}
          <br>${this.getDateTimeString(incident.date, incident.time)}`);
          marker.addTo(this.map);
        }
      });
    },
    getDateTimeString(date, time) {
      let d = new Date(date + ' ' + time);
      let t = '';
      if (d.getHours() > 12) { t = `${d.getHours() - 12}:${d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes()}pm`; }
      else t = `${d.getHours()}:${d.getSeconds()}am`;
      return `${d.toDateString()} at ${t}`;
    }
  },
  mounted() {
    axios.get('https://web-dev-crime-api.herokuapp.com/neighborhoods').then(res => {
      this.neighborhoods = res.data;

      axios.get('https://web-dev-crime-api.herokuapp.com/codes').then(res => {
        this.allCodes = res.data;
      });
      this.initMap();
      this.getIncidents();
      this.map.setView([44.9504037, -93.1015026]);
    });
  }
});
