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


var map = L.map('map').setView([43.6, 23.6], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const geojsonCache = {};

Promise.all(
    Array.from({length: (2030-2015+1)}, (_, i) => 2015 + i).map(year =>
        fetch(`data_${year}.geojson`)
            .then(res => res.json())
            .then(data => geojsonCache[year] = data)
    )
).then(() => updateMarkers(2020));

let allCountriesGroup = L.layerGroup().addTo(map);
let otherCountriesGroup = L.layerGroup().addTo(map);

function updateMarkers(year) {
    allCountriesGroup.clearLayers();
    otherCountriesGroup.clearLayers();

    const geojson = geojsonCache[year];
    if (!geojson) return;

    // All Countries layer
    L.geoJSON(geojson, {
        filter: feature => feature.properties.country.includes("All Countries"),
        pointToLayer: (feature, latlng) => {
            return L.marker(latlng, { icon: purpleIcon })
                .bindPopup(`
                    <b>${feature.properties.country}</b><br>
                    Population: ${feature.properties.population}<br>
                    <br>${latlng.lat.toFixed(7)}, ${latlng.lng.toFixed(7)}
                `);
        }
    }).addTo(allCountriesGroup);

    // Other Countries layer
    L.geoJSON(geojson, {
        filter: feature => !feature.properties.country.includes("All Countries"),
        pointToLayer: (feature, latlng) => {
            return L.marker(latlng, { icon: grayIcon })
                .bindPopup(`
                    <b>${feature.properties.country}</b><br>
                    Population: ${feature.properties.population}<br>
                    <br>${latlng.lat.toFixed(7)}, ${latlng.lng.toFixed(7)}
                `);
        }
    }).addTo(otherCountriesGroup);
}



// Create a custom control for the slider
const YearSliderControl = L.Control.extend({
    onAdd: function (map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        container.style.background = 'white';
        container.style.padding = '8px';

        container.innerHTML = `
      <label for="yearSlider" style="font-weight:bold; display:block; margin-bottom:4px;">Year: <span id="yearLabel">2020</span></label>
      <input type="range" id="yearSlider" min="2015" max="2030" step="1" value="2020" />
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



// Add layer control to toggle them
L.control.layers(null, {
    "All Countries": allCountriesGroup,
    "Other Countries": otherCountriesGroup
}).addTo(map);