let popupTime = d3.timeFormat("%a %B %d, %H:%M");

//Custom map icons
let waterMapIcon = L.icon({
    iconUrl: '/images/environment/water-15.svg',
    iconSize: [30, 30], //orig size
    iconAnchor: [iconAX, iconAY]//,
            //popupAnchor: [-3, -76]
});

proj4.defs("EPSG:29902", "+proj=tmerc +lat_0=53.5 +lon_0=-8 +k=1.000035 \n\
+x_0=200000 \n\+y_0=250000 +a=6377340.189 +b=6356034.447938534 +units=m +no_defs");
var firstProjection = "EPSG:29902";
var secondProjection = "EPSG:4326";

/************************************
 * OPW Water Levels
 ************************************/

let osmWater = new L.TileLayer(stamenTerrainUrl, {
    minZoom: min_zoom,
    maxZoom: max_zoom,
    attribution: stamenTonerAttrib
});
let waterMap = new L.Map('chart-water-map');
waterMap.setView(new L.LatLng(dubLat, dubLng), zoom);
waterMap.addLayer(osmWater);
let markerRefWater; //TODO: fix horrible hack!!!
waterMap.on('popupopen', function (e) {
    markerRefWater = e.popup._source;
    //console.log("ref: "+JSON.stringify(e));
});

let waterOPWCluster = L.markerClusterGroup();

d3.json('/data/Environment/waterlevel.json')
        .then(function (data) {
//            console.log(data.features);
            processWaterLevels(data.features);
        });

function processWaterLevels(data_) {
//    console.log("WL data \n");
    data_.forEach(function (d) {
        d.lat = +d.geometry.coordinates[1];
        d.lng = +d.geometry.coordinates[0];
        d.type = "OPW GPRS Station Water Level Monitor";
    });
//   console.log("Monitor:" + JSON.stringify(data_[0]));
    updateMapWaterLevels(data_);
}
;
function updateMapWaterLevels(data__) {
    waterOPWCluster.clearLayers();
    waterMap.removeLayer(waterOPWCluster);
    _.each(data__, function (d, i) {
        waterOPWCluster.addLayer(L.marker(new L.LatLng(d.lat, d.lng), {icon: waterMapIcon})
                .bindPopup(getWaterLevelContent(d)));
    });
    waterMap.addLayer(waterOPWCluster);
}

function getWaterLevelContent(d_) {
    let str = '';
    if (d_.properties["station.name"]) {
        str += '<b>' + d_.properties["station.name"] + '</b><br>'
                + 'Sensor ' + d_.properties["sensor.ref"] + '<br>'
                + d_.type + '<br>';
    }
    if (d_.properties["value"]) {
        str += '<br><b>Water level: </b>' + d_.properties["value"] + '<br>';
    }
    if (d_.properties.datetime) {
        str += '<br>Last updated on ' + popupTime(new Date(d_.properties.datetime)) + '<br>';
    }
    return str;
}

/************************************
 * Hydronet 
 ************************************/

let hydronetCluster = L.markerClusterGroup();

d3.csv("/data/Environment/Register of Hydrometric Stations in Ireland 2017_Dublin.csv").then(function (data) {
//    let keys = d3.keys(data.carparks);
//    console.log("carpark data.carparks :" + JSON.stringify(data.carparks[keys[0]]));
    //console.log("EPA :" + JSON.stringify(data[0]));
    processHydronet(data);
});
function processHydronet(data_) {

    data_.forEach(function (d, i) {

        let result = proj4(firstProjection, secondProjection,
                [+d["EASTING"], +d["NORTHING"]]);
        d.lat = result[1];
        d.lng = result[0];
        d.type = "Hydronet Water Level Monitor";
//        console.log("d: " + d["EASTING"]+" | "+d["NORTHING"]);
//        console.log("dlat " + d.lat+" | dlng "+d.lng);
    });
    updateMapHydronet(data_);
}
;
function updateMapHydronet(data__) {
    hydronetCluster.clearLayers();
    waterMap.removeLayer(hydronetCluster);
    _.each(data__, function (d, k) {

        let marker = L.marker(new L.LatLng(d.lat, d.lng), {icon: waterMapIcon});
        marker.bindPopup(getHydronetContent(d, k));
        hydronetCluster.addLayer(marker);

    });
    waterMap.addLayer(hydronetCluster);
}

function getHydronetContent(d_, k_) {
    let str = '';
    if (d_["Station Name"]) {
        str += '<b>' + d_["Station Name"] + '</b><br>';
    }
    if (d_.type) {
        str += d_.type + '<br>';
    }
    if (d_.Waterbody) {
        str += 'at ' + d_.Waterbody + '<br>';
    }
    if (d_.Owner) {
        str += '<br>' + d_.Owner + '<br>';
    }

    if (d_["Station Status"]) {
        str += 'Status: ' + d_["Station Status"] + '<br>';

    }
    if (d_["Hydrometric Data Available"]) {
        str += d_["Hydrometric Data Available"] + ' Available<br>';
    }
    if (d_["Station Status"] === "Inactive") {
        str += '<br/><button type="button" class="btn btn-primary hydronet-popup-btn" data="'
                + k_ + '">Get Historical Data</button>';
    } else {
        str += '<br/><button type="button" class="btn btn-primary hydronet-popup-btn" data="'
                + k_ + '">Get Latest Data</button>';

    }
    return str;
}

function displayHydronet(k_) {
    return markerRefWater.getPopup().setContent(markerRefWater.getPopup().getContent()
            + '<br><br> Data not currently available<br><br>'
            );
}

let displayHydronetBounced = _.debounce(displayHydronet, 100); //debounce using underscore

//TODO: replace jQ w/ d3 version
$("div").on('click', '.hydronet-popup-btn', function () {
    displayHydronetBounced($(this).attr("data"));
});


/************************************
 * Sound Map
 ************************************/
let soundMapIcon = L.icon({
    iconUrl: '/images/environment/microphone-black-shape.svg',
    iconSize: [30, 30], //orig size
    iconAnchor: [iconAX, iconAY]//,
            //popupAnchor: [-3, -76]
});

let iconAttrib = "Microophone icon by <a href=\"https://www.flaticon.com/authors/dave-gandy\">Dave Gandy</a>";

let osmSound = new L.TileLayer(stamenTerrainUrl, {
    minZoom: min_zoom,
    maxZoom: max_zoom,
    attribution: iconAttrib + "  "+stamenTonerAttrib
});

let soundMap = new L.Map('chart-sound-map');
soundMap.setView(new L.LatLng(dubLat, dubLng), zoom);
soundMap.addLayer(osmSound);
let markerRefSound; //TODO: fix horrible hack!!!

soundMap.on('popupopen', function (e) {
    markerRefSound = e.popup._source;
//    console.log("popup: "+JSON.stringify(e);

});

d3.json('/data/Environment/soundsites.json')
        .then(function (data) {
//            console.log(data.features);
            processSoundSites(data.sound_monitoring_sites);
        });

function processSoundSites(data_) {
    //console.log("sound data \n"+ JSON.stringify(data_));
    data_.forEach(function (d) {
        d.type = "Sound Level Monitor";
        //console.log("d:" + JSON.stringify(d["lat"]));
    });
    updateMapSoundsites(data_);
}
;

let soundCluster = L.markerClusterGroup();

function updateMapSoundsites(data__) {
    soundCluster.clearLayers();
    soundMap.removeLayer(soundCluster);
    _.each(data__, function (d, i) {
        let m = L.marker(new L.LatLng(+d["lon"], +d["lat"]), {icon: soundMapIcon});
        m.bindPopup(getSoundsiteContent(d));
        m.on('click', function (e) {
            var p = e.target.getPopup();
            getSoundReading(p, d);
//            console.log("p: " + );
        });
        soundCluster.addLayer(m);
    });
    soundMap.addLayer(soundCluster);
}

function getSoundsiteContent(d_) {
    let str = '';
    if (d_["name"]) {
        str += '<h3>' + d_["name"] + '</h3>';
    }
    if (d_.type) {
        str += d_.type + '<br>';
    }
    return str;
}

function getSoundReading(p_, d_) {
    d3.json("../data/Environment/sound_levels/sound_reading_" + d_.site_id + ".json")
            .then(function (reading) {
                if (reading.aleq) {
                    let lastRead = reading.aleq[reading.aleq.length - 1];
                    let lastTime = reading.times[reading.times.length - 1];
                    let lastDate = reading.dates[reading.dates.length - 1];
                    p_.setContent(getSoundsiteContent(d_, )
                            + "<h2>" + lastRead + " dB</h2>"
                            + "Updated at "
                            + lastTime
                            + " on " + lastDate
                            );
                    p_.update();
                } else {
                    p_.setContent(p_.getContent()
                            + "<br> Data currently unavailable");
                    p_.update();
                }
            });
}

/************************************
 * Air Quality Map
 ************************************/
let airMapIcon = L.icon({
    iconUrl: '/images/environment/water-15.svg',
    iconSize: [30, 30], //orig size
    iconAnchor: [iconAX, iconAY]//,
            //popupAnchor: [-3, -76]
});

let osmAir = new L.TileLayer(stamenTerrainUrl, {
    minZoom: min_zoom,
    maxZoom: max_zoom,
    attribution: stamenTonerAttrib
});

let airMap = new L.Map('chart-air-map');
airMap.setView(new L.LatLng(dubLat, dubLng), zoom);
airMap.addLayer(osmAir);
let markerRefAir; //TODO: fix horrible hack!!!
airMap.on('popupopen', function (e) {
    markerRefAir = e.popup._source;
    //console.log("ref: "+JSON.stringify(e));
});

/************************************
 * Button listeners
 ************************************/
d3.select(".water-opw-btn").on("click", function () {
//    console.log("bikes");
    waterMap.removeLayer(hydronetCluster);
    if (!waterMap.hasLayer(waterOPWCluster)) {
        waterMap.addLayer(waterOPWCluster);
    }
    waterMap.fitBounds(waterOPWCluster.getBounds());
});

d3.select(".water-hydronet-btn").on("click", function () {
//    console.log("bikes");
    waterMap.removeLayer(waterOPWCluster);
    if (!waterMap.hasLayer(hydronetCluster)) {
        waterMap.addLayer(hydronetCluster);
    }
    waterMap.fitBounds(hydronetCluster.getBounds());
});

d3.select(".water-all-btn").on("click", function () {
//    console.log("bikes");

    if (!waterMap.hasLayer(waterOPWCluster)) {
        waterMap.addLayer(waterOPWCluster);
    }
    if (!waterMap.hasLayer(hydronetCluster)) {
        waterMap.addLayer(hydronetCluster);
    }
    waterMap.fitBounds(waterOPWCluster.getBounds());
});




