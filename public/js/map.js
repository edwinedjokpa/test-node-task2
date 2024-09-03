export async function map() {
  const inputElement = document.getElementById("airport-input");
  const dropdownMenu = document.getElementById("dropdown-menu");
  const distanceElement = document.getElementById("distance");
  let map;
  let timeout;

  // Haversine formula to calculate distance between two points
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function initMap(lat, lon) {
    if (map) {
      map.getView().setCenter(ol.proj.fromLonLat([lon, lat]));
      map.getView().setZoom(12);
      return;
    }

    map = new ol.Map({
      target: "map",
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM(),
        }),
      ],
      view: new ol.View({
        center: ol.proj.fromLonLat([lon, lat]),
        zoom: 12,
      }),
    });

    const marker = new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat])),
    });

    const vectorSource = new ol.source.Vector({
      features: [marker],
    });

    const markerLayer = new ol.layer.Vector({
      source: vectorSource,
    });

    map.addLayer(markerLayer);
  }

  inputElement.addEventListener("input", function () {
    const query = inputElement.value.trim();

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (query.length >= 3) {
        fetch(`/airports?search=${query}`)
          .then((response) => response.json())
          .then((data) => {
            dropdownMenu.innerHTML = "";
            dropdownMenu.style.display = "block";

            if (data.length > 0) {
              data.forEach((airport) => {
                const item = document.createElement("a");
                item.className = "dropdown-item";
                item.href = "#";
                item.textContent = airport.name;

                item.addEventListener("click", function () {
                  inputElement.value = airport.name;
                  dropdownMenu.style.display = "none";

                  initMap(airport.latitude_deg, airport.longitude_deg);

                  // Calculate distance from Arctic Circle
                  const arcticCircleLat = 66.5;
                  const distance = haversineDistance(
                    arcticCircleLat,
                    0,
                    airport.latitude_deg,
                    airport.longitude_deg
                  );
                  distanceElement.textContent = `${distance.toFixed(2)} KM`;
                });

                dropdownMenu.appendChild(item);
              });
            } else {
              const noResults = document.createElement("a");
              noResults.className = "dropdown-item disabled";
              noResults.href = "#";
              noResults.textContent = "No airports found";
              dropdownMenu.appendChild(noResults);
            }
          })
          .catch((error) => console.error("Error fetching data:", error));
      } else {
        dropdownMenu.style.display = "none";
      }
    }, 300);
  });

  document.addEventListener("click", function (event) {
    if (
      !inputElement.contains(event.target) &&
      !dropdownMenu.contains(event.target)
    ) {
      dropdownMenu.style.display = "none";
    }
  });

  inputElement.addEventListener("blur", function () {
    setTimeout(() => {
      dropdownMenu.style.display = "none";
    }, 200);
  });
}
