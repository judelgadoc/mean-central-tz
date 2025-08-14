const purpleIcon = new L.Icon({
    iconUrl: 'assets/images/marker-icon-violet.png',
    shadowUrl: 'assets/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const grayIcon = new L.Icon({
    iconUrl: 'assets/images/marker-icon-grey.png',
    shadowUrl: 'assets/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});


L.Control.TimeDimension.prototype._getDisplayDateFormat = function(date) {
    return date.getUTCFullYear();
};


var map = L.map('map', {
    zoom: 3,
    fullscreenControl: true,
    center: [0, 0],
    timeDimensionControl: true,
    timeDimensionControlOptions: {
        timeSliderDragUpdate: true,
        loopButton: true,
        autoPlay: false,
        playerOptions: {
            transitionTime: 125,
            loop: true
        }
    },
    timeDimension: true,
        timeDimensionOptions: {
        timeInterval: "2015-01-01/2030-01-01",
        period: "P1Y"
    },
});




L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
    noWrap: false
}).addTo(map);


const geojsonCache = {};
// Load all GeoJSON files (2015–2030)
Promise.all(
  Array.from({length: (2030-2015+1)}, (_, i) => 2015 + i).map(year =>
    fetch(`assets/geojsons/data_${year}.geojson`)
      .then(res => res.json())
      .then(data => geojsonCache[year] = data)
  )
).then(() => {
  // Split features by category & add time property
  const allCountriesFeatures = [];
  const otherCountriesFeatures = [];

  for (const [year, geojson] of Object.entries(geojsonCache)) {
    const timeString = `${year}-01-01T00:00:00Z`;
    geojson.features.forEach(feature => {
      feature.properties.time = timeString;
      if (feature.properties.country.includes("All Countries")) {
        allCountriesFeatures.push(feature);
      } else {
        otherCountriesFeatures.push(feature);
      }
    });
  }

  // Build GeoJSON objects for each layer
  const allCountriesGeoJSON = {
    type: "FeatureCollection",
    features: allCountriesFeatures
  };
  const otherCountriesGeoJSON = {
    type: "FeatureCollection",
    features: otherCountriesFeatures
  };

  // Create timeDimension layers
  const allCountriesTimeLayer = L.timeDimension.layer.geoJson(L.geoJson(allCountriesGeoJSON, {
    pointToLayer: (feature, latlng) => L.marker(latlng, { icon: purpleIcon })
      .bindPopup(`
                    <b>${feature.properties.country}</b><br>
                    Population: ${feature.properties.population.toLocaleString('en-US')}<br>
                    <br>${latlng.lat.toFixed(7)}, ${latlng.lng.toFixed(7)}
                `)
  }), {
    updateTimeDimension: true,
    updateTimeDimensionMode: 'replace',
    duration: 'P0Y'
  });

  const otherCountriesTimeLayer = L.timeDimension.layer.geoJson(L.geoJson(otherCountriesGeoJSON, {
    pointToLayer: (feature, latlng) => L.marker(latlng, { icon: grayIcon })
      .bindPopup(`
                    <b>${feature.properties.country}</b><br>
                    Population: ${feature.properties.population.toLocaleString('en-US')}<br>
                    <br>${latlng.lat.toFixed(7)}, ${latlng.lng.toFixed(7)}
                `)
  }), {
    updateTimeDimension: true,
    updateTimeDimensionMode: 'replace',
    duration: 'P0Y'
  });


  allCountriesTimeLayer.addTo(map);
  otherCountriesTimeLayer.addTo(map);



timezones = L.timezones.bindPopup(function (layer) {
    const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: layer.feature.properties.tzid,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "shortOffset"
    });
    return formatter.format(new Date())
}).addTo(map);



L.control.layers(null, {
    "Global Population Center": allCountriesTimeLayer,
    "National Population Centers": otherCountriesTimeLayer,
    "Timezones": timezones
}).addTo(map);
});