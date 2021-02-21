
        var map, datasource, client, popup, searchInput, resultsPanel, searchInputLength, centerMapOnResults, userShape,watchId,bubbleLayer;

        //The minimum number of characters needed in the search input before a search is performed.
        var minSearchInputLength = 3;

        //The number of ms between key strokes to wait before performing a search.
        var keyStrokeDelay = 150;

        //A duration for the animation in ms.
        var duration = 2500;

        //Max radius of the pulse circle. 
        var maxRadius = 30;
        
        function GetMap() {
            //Initialize a map instance.
            map = new atlas.Map('myMap', {
                center: [ 75.576180, 31.326015 ],
                zoom: 14,
                view: 'Auto',
                authOptions: {
                     authType: 'subscriptionKey',
                     subscriptionKey: 'QdyA406M4-YuKetZMn-V94BP1Ho3gsFKTu3drVoZGVQ'
                 }
            });

            //Store a reference to the Search Info Panel.
            resultsPanel = document.getElementById("results-panel");

            //Add key up event to the search box. 
            searchInput = document.getElementById("search-input");
            searchInput.addEventListener("keyup", searchInputKeyup);

            //Create a popup which we can reuse for each result.
            popup = new atlas.Popup();

            //Wait until the map resources are ready.
            map.events.add('ready', function () {

                //Add the zoom control to the map.
                map.controls.add(new atlas.control.ZoomControl(), {
                    position: 'top-right'
                });

                //Create a data source and add it to the map.
                datasource = new atlas.source.DataSource();
                map.sources.add(datasource);
                map.layers.add(new atlas.layer.SymbolLayer(datasource));

                //Add a layer for rendering the results.
                var searchLayer = new atlas.layer.SymbolLayer(datasource, null, {
                    iconOptions: {
                        // change this image accordingly
                        image: 'pin-round-blue',
                        anchor: 'center',
                        allowOverlap: true
                    }
                });
//here is code for marking different loction to be picked from database
                var points = [];

                for (var i = 0; i < 50; i++) {
                    datasource.add(new atlas.data.Point([75.57 + Math.random() - 0.5, 31.32 + Math.random() / 2 - 0.25]));
                }

                datasource.add(points);
                                
                //A bubble layer that will have its radius scaled during animation to create a pulse.
                bubbleLayer = new atlas.layer.BubbleLayer(datasource, null, {
                    color: 'rgb(255, 0, 0)',

                    //Hide the stroke of the bubble. 
                    strokeWidth: 0,

                    //Make bubbles stay flat on the map when the map is pitched.
                    pitchAlignment: 'map'
                }); 

                //Add a layers for rendering data.
                map.layers.add([
                    bubbleLayer,

                    //A symbol layer to be the main icon layer for the data point.
                    new atlas.layer.SymbolLayer(datasource, null, {
                        iconOptions: {
                            //For smoother animation, ignore the placement of the icon. This skips the label collision calculations and allows the icon to overlap map labels. 
                            ignorePlacement: true,

                            //For smoother animation, allow symbol to overlap all other symbols on the map.
                            allowOverlap: true
                        },
                        textOptions: {
                            //For smoother animation, ignore the placement of the text. This skips the label collision calculations and allows the text to overlap map labels.
                            ignorePlacement: true,

                            //For smoother animation, allow text to overlap all other symbols on the map.
                            allowOverlap: true
                        }
                    })
                ]);

                animate(0);
// till here for adding new datapoints on map


                map.layers.add(searchLayer);

                //Add a click event to the search layer and show a popup when a result is clicked.
                map.events.add("click", searchLayer, function (e) {
                    //Make sure the event occurred on a shape feature.
                    if (e.shapes && e.shapes.length > 0) {
                        showPopup(e.shapes[0]);
                    }
                });

                //mark point take

                


            });
        }

        function animate(timestamp) {
            //Calculate progress as a ratio of the duration between 0 and 1.
            progress = timestamp % duration / duration;

            //Early in the animaiton, make the radius small but don't render it. The map transitions between radiis, which causes a flash when going from large radius to small radius. This resolves that.
            if (progress < 0.1) {
                bubbleLayer.setOptions({
                    radius: 0,
                    opacity: 0
                });
            } else {
                bubbleLayer.setOptions({
                    radius: maxRadius * progress,

                    //Have the opacity fade as the radius becomes larger.
                    opacity: Math.max(0.9 - progress, 0)
                });
            }

            //Request the next frame of the animation.
            animation = requestAnimationFrame(animate);
        }
        
        function startTracking() {
            if (!watchId) {
                //Watch the users position.
                watchId = navigator.geolocation.watchPosition(function (geoPosition) {

                    //Get the coordinate information from the geoPosition.
                    var userPosition = [geoPosition.coords.longitude, geoPosition.coords.latitude];

                    //TIP: altitude? in meters, speed? in meters/second and heading? in degrees are also potential properties of geoPosition.coords

                    if (!userShape) {
                        //Create a shape to show the users position and add it to the data source.
                        userShape = new atlas.Shape(new atlas.data.Feature(new atlas.data.Point(userPosition), geoPosition));
                        datasource.add(userShape);
                    } else {
                        userShape.setCoordinates(userPosition);
                        userShape.setProperties(geoPosition);
                    }

                    //Center the map on the users position.
                    map.setCamera({
                        center: userPosition,
                        zoom: 15
                    });
                }, function (error) {
                    //If an error occurs when trying to access the users position information, display an error message.
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            alert('User denied the request for Geolocation.');
                            break;
                        case error.POSITION_UNAVAILABLE:
                            alert('Position information is unavailable.');
                            break;
                        case error.TIMEOUT:
                            alert('The request to get user position timed out.');
                            break;
                        case error.UNKNOWN_ERROR:
                            alert('An unknown error occurred.');
                            break;
                    }
                });
            }
        }

        function stopTracking() {
            //Cancel the geolocation updates.
            navigator.geolocation.clearWatch(watchId);

            //Clear all data from the map.
            datasource.clear();
            userShape = null;
            watchId = null;
        }

        function searchInputKeyup(e) {
            centerMapOnResults = false;
            if (searchInput.value.length >= minSearchInputLength) {
                if (e.keyCode === 13) {
                    centerMapOnResults = true;
                }
                //Wait 100ms and see if the input length is unchanged before performing a search. 
                //This will reduce the number of queries being made on each character typed.
                setTimeout(function () {
                    if (searchInputLength == searchInput.value.length) {
                        search();
                    }
                }, keyStrokeDelay);
            } else {
                resultsPanel.innerHTML = '';
            }
            searchInputLength = searchInput.value.length;
        }
        function search() {
            //Remove any previous results from the map.
            datasource.clear();
            popup.close();
            resultsPanel.innerHTML = '';

            //Use MapControlCredential to share authentication between a map control and the service module.
            var pipeline = atlas.service.MapsURL.newPipeline(new atlas.service.MapControlCredential(map));

            //Construct the SearchURL object
            var searchURL = new atlas.service.SearchURL(pipeline);

            var query = document.getElementById("search-input").value;
            searchURL.searchPOI(atlas.service.Aborter.timeout(10000), query, {
                lon: map.getCamera().center[0],
                lat: map.getCamera().center[1],
                maxFuzzyLevel: 4,
                view: 'Auto'
            }).then((results) => {

                //Extract GeoJSON feature collection from the response and add it to the datasource
                var data = results.geojson.getFeatures();
                datasource.add(data);

                if (centerMapOnResults) {
                    map.setCamera({
                        bounds: data.bbox
                    });
                }
                console.log(data);
                //Create the HTML for the results list.
                var html = [];
                for (var i = 0; i < data.features.length; i++) {
                    var r = data.features[i];
                    html.push('<li onclick="itemClicked(\'', r.id, '\')" onmouseover="itemHovered(\'', r.id, '\')">')
                    html.push('<div class="title">');
                    if (r.properties.poi && r.properties.poi.name) {
                        html.push(r.properties.poi.name);
                    } else {
                        html.push(r.properties.address.freeformAddress);
                    }
                    html.push('</div><div class="info">', r.properties.type, ': ', r.properties.address.freeformAddress, '</div>');
                    if (r.properties.poi) {
                        if (r.properties.phone) {
                            html.push('<div class="info">phone: ', r.properties.poi.phone, '</div>');
                        }
                        if (r.properties.poi.url) {
                            html.push('<div class="info"><a href="http://', r.properties.poi.url, '">http://', r.properties.poi.url, '</a></div>');
                        }
                    }
                    html.push('</li>');
                    resultsPanel.innerHTML = html.join('');
                }

            });
        }
        function itemHovered(id) {
            //Show a popup when hovering an item in the result list.
            var shape = datasource.getShapeById(id);
            showPopup(shape);
        }
        function itemClicked(id) {
            //Center the map over the clicked item from the result list.
            var shape = datasource.getShapeById(id);
            map.setCamera({
                center: shape.getCoordinates(),
                zoom: 17
            });
        }
        function showPopup(shape) {
            var properties = shape.getProperties();
            //Create the HTML content of the POI to show in the popup.
            var html = ['<div class="poi-box">'];
            //Add a title section for the popup.
            html.push('<div class="poi-title-box"><b>');

            if (properties.poi && properties.poi.name) {
                html.push(properties.poi.name);
            } else {
                html.push(properties.address.freeformAddress);
            }
            html.push('</b></div>');
            //Create a container for the body of the content of the popup.
            html.push('<div class="poi-content-box">');
            html.push('<div class="info location">', properties.address.freeformAddress, '</div>');
            if (properties.poi) {
                if (properties.poi.phone) {
                    html.push('<div class="info phone">', properties.phone, '</div>');
                }
                if (properties.poi.url) {
                    html.push('<div><a class="info website" href="http://', properties.poi.url, '">http://', properties.poi.url, '</a></div>');
                }
            }
            html.push('</div></div>');
            popup.setOptions({
                position: shape.getCoordinates(),
                content: html.join('')
            });
            popup.open(map);
        }