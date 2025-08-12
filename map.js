const dataByYear = {}
for (i = 2020; i < 2026; i++) {
    for (j = 0; j < 3; j++) {
        dataByYear[i] = [
        { lat: 51.505+(i-2020)/1000, lng: -0.09-(i-2020)/1000, name: "Country A", population: 673563161+i },
        { lat: 51.51+(i-2020)/1000, lng: -0.1-(i-2020)/1000, name: "Country B", population: 89437171+i },
        { lat: 51.515+(i-2020)/1000, lng: -0.11-(i-2020)/1000, name: "all_countries", population: 94611+i }
    ]
    }
}

// Convert to GeoJSON FeatureCollection
const features = [];

for (const year in dataByYear) {
  dataByYear[year].forEach(point => {
    features.push({
      type: "Feature",
      properties: {
        name: point.name,
        population: point.population,
        year: Number(year)
      },
      geometry: {
        type: "Point",
        coordinates: [point.lng, point.lat] // GeoJSON uses [lng, lat]
      }
    });
  });
}

const geojson = {
  type: "FeatureCollection",
  features: features
};

console.log(JSON.stringify(geojson, null, 2));

const purpleIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const grayIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});


var map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let markersGroup = L.layerGroup().addTo(map);

function updateMarkers(year) {
    markersGroup.clearLayers();

    if (dataByYear[year]) {
        dataByYear[year].forEach(point => {
            if (point.name.includes("all_countries")) {
                icon = purpleIcon;
            } else {
                icon = grayIcon;
            }
            L.marker([point.lat, point.lng], { icon: icon })
                .bindPopup(`<b>${point.name}</b><br>Population: ${point.population}<br><br>${point.lat}, ${point.lng}`)
                .addTo(markersGroup);
        });
    }
}

// Create a custom control for the slider
const YearSliderControl = L.Control.extend({
    onAdd: function (map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        container.style.background = 'white';
        container.style.padding = '8px';

        container.innerHTML = `
      <label for="yearSlider" style="font-weight:bold; display:block; margin-bottom:4px;">Year: <span id="yearLabel">2020</span></label>
      <input type="range" id="yearSlider" min="2020" max="2025" step="1" value="2020" />
    `;

        // Prevent map interactions when interacting with the slider
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        return container;
    }
});

const yearSliderControl = new YearSliderControl({ position: 'topright' });
yearSliderControl.addTo(map);

const slider = document.getElementById('yearSlider');
const label = document.getElementById('yearLabel');

slider.addEventListener('input', (e) => {
    const year = e.target.value;
    label.textContent = year;
    updateMarkers(year);
});

// Initialize markers
updateMarkers(slider.value);

