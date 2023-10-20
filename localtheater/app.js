const addressBaseUrl = "https://api-adresse.data.gouv.fr";
const theatersBaseUrl = "https://data.culture.gouv.fr/api/records/1.0/search/";


let userCoords = null;

let mapReference = null;

function formatDistanceToString(distance) {
    if(distance < 100) {
        return `${Math.round(distance, 2)} m`;
    }
    else {
        return `${Math.round(distance / 1000, 2)} km`;
    }
}

function getCoordsFromBrowser() {
    return new Promise((resolve) => navigator.geolocation.getCurrentPosition((position) => { 
        userCoords = position.coords;
        resolve(position.coords);
    }));
}

function getCoordsFromAddress(address) {
    return new Promise((resolve) => {
        fetch(`${addressBaseUrl}/search/?q=${address}`).then(response => response.json()).then(response => {
              resolve(response.features[0].geometry.coordinates);
           });
   });
}

function getAddressFromCoords(coords) {
    return new Promise((resolve) => {
         fetch(`${addressBaseUrl}/reverse/?lon=${coords.longitude}&lat=${coords.latitude}`).then(response => response.json()).then(response => {
               resolve(response.features[0].properties.label);
            });
    });
}

function getTheatersFromCoords(coords) {
    return new Promise((resolve) => {
        fetch(`${theatersBaseUrl}/?dataset=etablissements-cinematographiques&geofilter.distance=${coords.latitude},${coords.longitude},10000`).then(response => response.json()).then(response => {
              resolve(response);
           });
   });
}

function distanceBetweenCoords(coords1, coords2) {
    // Source: https://www.movable-type.co.uk/scripts/latlong.html

    const R = 6371e3; // metres
    const φ1 = coords1.latitude * Math.PI/180; // φ, λ in radians
    const φ2 = coords2.latitude * Math.PI/180;
    const Δφ = (coords2.latitude-coords1.latitude) * Math.PI/180;
    const Δλ = (coords2.longitude-coords1.longitude) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const d = R * c; // in metres

    return d;
}

function initializeMap() {
    var map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    return map;
}

function addMapMarker(map, coords, popupContent) {
    var marker = L.marker([coords.latitude, coords.longitude]).bindPopup(popupContent).addTo(map);
}

function moveTo(map, coords) {
    map.flyTo([coords.latitude, coords.longitude]);
}

document.addEventListener('DOMContentLoaded', (event) => {
    mapReference = initializeMap();

    document.querySelector('#geolocateMe').addEventListener('click', async (event) => {
        event.preventDefault();
    
        const coords = await getCoordsFromBrowser();
        const address = await getAddressFromCoords(coords);
        document.querySelector('#addressText').value = address;
    
        moveTo(mapReference, userCoords);
    });
    
    document.querySelector('#submitForm').addEventListener('click', async (event) => {
        event.preventDefault();
    
        if(userCoords === null) {
            const address = document.querySelector('#addressText').value;
    
            if(address === null || address < 5) {
                alert(`Merci d'entrer une adresse contenant plus de 5 caractères ou de vous géolocaliser automatiquq.`);
                return;
            }
    
            userCoords = await getCoordsFromAddress(address);
        }
    
        moveTo(mapReference, userCoords);
    
        const theaters = await getTheatersFromCoords(userCoords);
    
        console.log(theaters);
    
    
        // Source: https://stackoverflow.com/questions/26836146/how-to-sort-array-items-by-longitude-latitude-distance-in-javascripts
    
        const distancedArray = [];
    
        theaters.records.map((theater) => {
            distancedArray.push(
                {
                    distance: distanceBetweenCoords(userCoords, {
                        latitude: theater.geometry.coordinates[1],
                        longitude: theater.geometry.coordinates[0]
                    }),
                    coordinates: {
                        latitude: theater.geometry.coordinates[1],
                        longitude: theater.geometry.coordinates[0]
                    },
                    theater: theater.fields
                }
            );
        });
    
        distancedArray.sort(function(a, b) { 
            return a.distance - b.distance;
        });
    
        document.querySelector('#searchResults').innerHTML = distancedArray.map((theaterWithDistance) => {
            if(mapReference !== null) {
                addMapMarker(mapReference, theaterWithDistance.coordinates, 
                        `
                        <div>
                            <b>${theaterWithDistance.theater.nom}</b>
                            <i>${theaterWithDistance.theater.adresse.toLowerCase()}, ${theaterWithDistance.theater.commune}</i>
                            <i>${formatDistanceToString(theaterWithDistance.distance)}</i>
                        </div>
                        `
                );
            }
            return `
                    <div>
                        <b>${theaterWithDistance.theater.nom}</b>
                        <i>${theaterWithDistance.theater.adresse.toLowerCase()}, ${theaterWithDistance.theater.commune}</i>
                        <i>${formatDistanceToString(theaterWithDistance.distance)}</i>
                    </div>
                    `;
        }).join('');
    });

});