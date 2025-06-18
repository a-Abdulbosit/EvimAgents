//fetch('locations.json')
//    .then(res => {
//        if (!res.ok) {
//            throw new Error("Failed to fetch locations.json");
//        }
//        return res.json();
//    })
//    .then(locations => {
//        ymaps.ready(() => {
//            const map = new ymaps.Map("map", {
//                center: [41.31, 69.28], // Default: Tashkent
//                zoom: 10,
//                controls: ['zoomControl', 'fullscreenControl']
//            });

//            locations.forEach(loc => {
//                if (!loc.latitude || !loc.longitude) return;

//                const placemark = new ymaps.Placemark(
//                    [loc.latitude, loc.longitude],
//                    {
//                        balloonContent: `
//              <b>🏪 Market:</b> ${loc.marketName || "Unknown"}<br>
//              <b>👤 Agent:</b> ${loc.agentName || "Unknown"}<br>
//              <small>📅 ${new Date(loc.createdAt).toLocaleString()}</small>
//            `
//                    },
//                    {
//                        preset: 'islands#redDotIcon'
//                    }
//                );

//                map.geoObjects.add(placemark);
//            });
//        });
//    })
//    .catch(error => {
//        alert("❌ Failed to load locations");
//        console.error("❌ Error loading pins:", error);
//    });
