/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var app = {
    location: {},
    startLocation: {},
    walkDistance: 0,
    pressNumber: 0,
    treeTop: 0,
    treeBottom: 0,
    x: 0,
    y: 0,
    z: 0,
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
        typeof localStorage.measurements === 'string' ? '' : localStorage.setItem('measurements', JSON.stringify([]));
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        this.receivedEvent('deviceready');

        // https://www.geodatasource.com/developers/javascript
        function distance(lat1, lon1, lat2, lon2, unit) {
            var radlat1 = Math.PI * lat1/180;
            var radlat2 = Math.PI * lat2/180;
            var theta = lon1 - lon2;
            var radtheta = Math.PI * theta/180;
            var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
            if (dist > 1) {
                dist = 1;
            }
            dist = Math.acos(dist)
            dist = dist * 180/Math.PI;
            dist = dist * 60 * 1.1515; // default is miles
            switch(unit) {
                case 'F': // feet
                    dist = dist * 5280;
                    break;
                case 'K': // km
                    dist = dist * 1.609344;
                    break;
                case 'N': // nautical miles
                    dist = dist * 0.8684;
                    break;
                case 'Y': // yards
                    dist = dist * 1760;
                    break;
                // default:
                //     dist = dist;
            }
            return dist
        }

        function toRadians (angle) {
            return angle / 180 * Math.PI;
        }

        function angles(e) {
            if(e.target.id === 'treeTop') {
                app.treeTop = app.x;
                measurement.top = app.x;
            } else if(e.target.id === 'treeBottom') {
                app.treeBottom = app.x;
                measurement.bottom = app.x;
            }

            if(app.treeBottom !== 0 && app.treeTop !== 0) {
                var angle1 = 90 - app.treeBottom;
                var angle2 = app.treeBottom;
                // var side2 = 6;
                var side2 = app.walkDistance;
                var angle1Rad = toRadians(angle1);
                var angle2Rad = toRadians(angle2);
                var side1 = (side2 * Math.sin(angle1Rad))/Math.sin(angle2Rad);

                var angle3 = app.treeTop - 90;
                var angle4 = 90 - angle3;
                // var side4 = 6;
                var side4 = app.walkDistance;
                var angle3Rad = toRadians(angle3);
                var angle4Rad = toRadians(angle4);
                var side3 = (side4 * Math.sin(angle3Rad))/Math.sin(angle4Rad);
                console.log(angle1, angle2, angle3, angle4, side1, side2, side3, side4)
                
                var height = side1 + side3;
                measurement.height = height;
                console.log('Height ' + height);
            }
            console.log('app.treeTop: ' + app.treeTop + ' app.treeBottom: ' + app.treeBottom + '. Angle: ' + (app.treeTop - app.treeBottom));
            var fails = 0;
            measurementKeys = Object.keys(measurement);
            for (var i = 0; i < measurementKeys.length; i++) {
                if(!measurement[measurementKeys[i]]) {
                    fails++;
                }

                if(measurementKeys.length - 1 === i && fails === 0) {
                    var arr = JSON.parse(localStorage.measurements);
                    arr.push(measurement);
                    localStorage.setItem('measurements', JSON.stringify(arr));
                    measurement = {};
                }
            }
            console.log(measurement)
            $('#outputTop').text(Math.round(app.treeTop * 100)/100 + ' Degrees');
            $('#outputBottom').text(Math.round(app.treeBottom * 100)/100 + ' Degrees');
            $('#outputHeight').text(Math.round(height * 100)/100 + ' Feet');
        }

        // Device orientation test
        function handleOrientation(event) {
            app.x = event.beta;  // In degree in the range [-180,180] tilt vert
            app.y = event.gamma; // In degree in the range [-90,90] tilt horizontal
            app.z = event.alpha; // spin
        }

        function handleMotionEvent(event) {

            var x = event.accelerationIncludingGravity.x;
            var y = event.accelerationIncludingGravity.y;
            var z = event.accelerationIncludingGravity.z;

            // Do something awesome
            console.log(event.acceleration.x + ' m/s2');
            var lastTimestamp;
            var speedX = 0, speedY = 0, speedZ = 0;
            var currentTime = new Date().getTime();
            if (lastTimestamp === undefined) {
                lastTimestamp = new Date().getTime();
                return; //ignore first call, we need a reference time
            }
            //  m/s² / 1000 * (miliseconds - miliseconds)/1000 /3600 => km/h
            speedX += event.acceleration.x / 1000 * ((currentTime - lastTimestamp)/1000)/3600;
            //... same for Y and Z
            lastTimestamp = currentTime;
            console.log(speedX)
        }

        // Camera
        var options = {
            x: window.screen.width/4,
            y: 20,
            width: window.screen.width/2,
            height: window.screen.height/2,
            camera: CameraPreview.CAMERA_DIRECTION.BACK,
            toBack: true,
            tapPhoto: true,
            tapFocus: false,
            previewDrag: false
        };
        
        var newLeft = parseInt($('.crosshair').css('left'));
        var newTop = parseInt($('.crosshair').css('top'));
        function cameraFunction() {
            $('html').css('background-color', 'transparent');
            $('body').css('background-color', 'transparent');
            $('.crosshair').css('display', 'block');
            $('.crosshair').css('left', (newLeft - 50) + 'px');
            $('.crosshair').css('top', (newTop + 30) + 'px');
            CameraPreview.startCamera(options);
        }

        function cameraFunctionStop() {
            $('html').css('background-color', '#E4E4E4');
            $('body').css('background-color', '#E4E4E4');
            $('.crosshair').css('display', 'none');
            CameraPreview.stopCamera();
        }

        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleOrientation);
            console.log('works')
        } else {
            console.log('error')
        }

        function displayReadings() {
            window.scrollTo(0, 0);
            $('#readings').toggleClass('readingsClosed');
            $('#readings').toggleClass('readingsOpen');

            if($('#readings').hasClass('readingsOpen')) {
                var measurementsStorage = JSON.parse(localStorage.measurements);
                var htmlContents = '<button id="closeReadings" class="but displayReadings">Close Readings</button>';
                var emailBody = '';
                for (var i = 0; i < measurementsStorage.length; i++) {
                    emailBody += 
                        `<b>Measurement ${i + 1}</b>
                        Start Lat/Lon: ${JSON.stringify(measurementsStorage[i].finalStart.lat + '/' + measurementsStorage[i].finalStart.long)}\n
                        End Lat/Lon: ${JSON.stringify(measurementsStorage[i].finalEnd.lat + '/' + measurementsStorage[i].finalEnd.long)}\n
                        Start Points Measured Lat/Lon: ${JSON.stringify(measurementsStorage[i].startPoints)}\n
                        End Points Observed Lat/Lon: ${JSON.stringify(measurementsStorage[i].endPoints)}\n
                        Distance: ${measurementsStorage[i].distance}
                        Start Accuracy: ${avg(measurementsStorage[i].stAcc)}
                        End Accuracy: ${avg(measurementsStorage[i].enAcc)}
                        Top: ${measurementsStorage[i].top}
                        Bottom: ${measurementsStorage[i].bottom}
                        Height: ${measurementsStorage[i].height}\n\n`
                    htmlContents += 
                        `<button class="collapsible">Measurement ${i + 1}</button>
                        <div class="content">
                            <p>
                                Start Lat/Lon:<br/> ${JSON.stringify(measurementsStorage[i].finalStart.lat + '/' + measurementsStorage[i].finalStart.long)}<br/>
                                End Lat/Lon:<br/> ${JSON.stringify(measurementsStorage[i].finalEnd.lat + '/' + measurementsStorage[i].finalEnd.long)}<br/>
                                Start Points Measured Lat/Lon: ${JSON.stringify(measurementsStorage[i].startPoints)}<br/>
                                End Points Observed Lat/Lon: ${JSON.stringify(measurementsStorage[i].endPoints)}<br/>
                                Distance: ${measurementsStorage[i].distance}<br/>
                                Start Accuracy: ${avg(measurementsStorage[i].stAcc)}<br/>
                                End Accuracy: ${avg(measurementsStorage[i].enAcc)}<br/>
                                Top: ${measurementsStorage[i].top}<br/>
                                Bottom: ${measurementsStorage[i].bottom}<br/>
                                Height: ${measurementsStorage[i].height}<br/>
                            </p>
                        </div>`;
                }
                $('#readings').html(htmlContents);
                $('#closeReadings').after(`<button class="but"><a  href="mailto:?body=${encodeURI(emailBody)}">Email Results</a></button>`);
                createCollapsible();
                for (var i = 0; i < toggleReadings.length; i++) {
                    toggleReadings[i].addEventListener('click', displayReadings);
                }
            }
        }
        
        document.getElementById("startLocation").addEventListener("click", accuracyFinder);
        document.getElementById("treeTop").addEventListener("click", angles);
        document.getElementById("treeBottom").addEventListener("click", angles);
        document.getElementById("camera").addEventListener("click", cameraFunction);
        document.getElementById("cameraStop").addEventListener("click", cameraFunctionStop);
        document.getElementById("measurements").addEventListener("change", function() {
            numberOfMeasurements = $('#measurements').val() !== '' ? $('#measurements').val() : 5;
        });
        document.getElementById("time").addEventListener("change", function() {
            timeOfInterval = $('#time').val() !== '' ? $('#time').val() : 500;
        });

        var toggleReadings = document.getElementsByClassName("displayReadings");

        for (var i = 0; i < toggleReadings.length; i++) {
            toggleReadings[i].addEventListener('click', displayReadings);
        }
        // document.getElementById("displayReadings").addEventListener("click", displayReadings);
        
        var startLatArr = [];
        var startLongArr = [];
        var startAccuracies = [];
        var startPoint, endPoint;
        var endLatArr = [];
        var endLongArr = [];
        var endAccuracies = [];
        var intervalLocation;
        var numberOfMeasurements = $('#measurements').val() ? $('#measurements').val() : 5;
        var timeOfInterval = $('#time').val() ? $('#time').val() : 500;
        var measurement;
        var measurementKeys;
        function Measurement(startPoints, endPoints, accuracies1, accuracies2, distance, top, bottom, height) {
            // constructor(startPoints, endPoints, accuracies1, accuracies2, distance, top, bottom, height) {
                this.startPoints = startPoints;
                this.finalStart;
                this.endPoints = endPoints;
                this.finalEnd;
                this.stAcc = accuracies1;
                this.enAcc = accuracies2;
                this.distance = distance;
                this.top = top;
                this.bottom = bottom;
                this.height = height;
            // }
        }
        function pointsToArray(lats, longs) {
            var returnArr = [];
            for (var i = 0; i < lats.length; i++) {
                var tempObj = {
                    lat: lats[i],
                    long: longs[i]
                }
                returnArr.push(tempObj);
            }
            return returnArr;
        }

        function accuracyFinder() {
            $('#locatorLabel').text('Locating...'); 
            app.pressNumber = app.pressNumber + 1;
            $('#startLocation').html('Locating....');
            $('#startLocation').addClass('loadButton');
            $('#startLocation').removeClass('startButton');
            $('#startLocation').removeClass('stopButton');
            document.getElementById("startLocation").removeEventListener("click", accuracyFinder);
            var locator, movingLocation, options;

            function successForLoop(position) {
                var crd = position.coords;
                if(crd.accuracy < 100) {
                    console.log("ACCURACY", crd.accuracy, app.location);

                    var posAccurancy = Math.round(position.coords.accuracy * 100)/100;
                    $('#accuracy').text(posAccurancy);

                    if(app.pressNumber === 1 && startLatArr.length < numberOfMeasurements) {
                        startLatArr.push(crd.latitude);
                        startLongArr.push(crd.longitude);
                        startAccuracies.push(crd.accuracy);
                        position['coords']['latitude'] = avg(startLatArr);
                        position['coords']['longitude'] = avg(startLongArr);
                    } else if(app.pressNumber === 2) {
                        endLatArr.push(crd.latitude);
                        endLongArr.push(crd.longitude);
                        endAccuracies.push(crd.accuracy);
                        position['coords']['latitude'] = avg(endLatArr);
                        position['coords']['longitude'] = avg(endLongArr);
                    }

                    // Displays Accuracy
                    $('#accuracy').text(posAccurancy);

                    if(app.pressNumber < 2 && jQuery.isEmptyObject(app.location)) {
                        startPoint = {lat: position['coords']['latitude'], long: position['coords']['longitude']};
                        $('#startLatLon').html(Math.round(position['coords']['latitude'] * 1000000) / 1000000 + '/' + Math.round(position['coords']['longitude'] * 1000000) / 1000000);
                    } else if(app.pressNumber === 1) {
                        $('#movingLatLon').html(Math.round(crd['latitude'] * 1000000) / 1000000 + '/' + Math.round(crd['longitude'] * 1000000) / 1000000);
                        var movingDistance = Math.round(distance(app.location['coords']['latitude'], app.location['coords']['longitude'], crd['latitude'], crd['longitude'], 'F') * 100)/100;
                        $('#movingDistance').text(movingDistance + ' Feet');
                    } else if(app.pressNumber === 2) {
                        endPoint = {lat: position['coords']['latitude'], long: position['coords']['longitude']};
                        // console.log(app.location, app.location['coords']['latitude'])
                        $('#endLatLon').html(Math.round(position['coords']['latitude'] * 1000000) / 1000000 + '/' + Math.round(position['coords']['longitude'] * 1000000) / 1000000);
                    }

                    if((startLatArr.length >= numberOfMeasurements && app.pressNumber === 1) || (endLatArr.length >= numberOfMeasurements && app.pressNumber === 2)) {
                        console.log('Avg Lat: ' + position['coords']['latitude'] + '. Avg Long: ' + position['coords']['longitude']);
                        console.log('Press number: ' + app.pressNumber);
                        // clearInterval(intervalLocation);
                        // latArr = [];
                        // longArr = [];

                        if(app.pressNumber < 2 && jQuery.isEmptyObject(app.location)) {

                            $('#startLocation').html('Stop Point');
                            $('#startLocation').addClass('stopButton');
                            $('#startLocation').removeClass('loadButton');
                            $('#startLocation').removeClass('startButton');
                            $('#startLatLon').html(Math.round(position['coords']['latitude'] * 1000000) / 1000000 + '/' + Math.round(position['coords']['longitude'] * 1000000) / 1000000);
                            document.getElementById("startLocation").addEventListener("click", accuracyFinder);
                            // clearInterval(movingLocation);
                            // clearInterval(intervalLocation);

                            // console.log('app.pressNumber === 1 && !jQuery.isEmptyObject(app.location)', app.pressNumber, app.pressNumber === 1, !jQuery.isEmptyObject(app.location))
                            // if(app.pressNumber === 1) { //  && !jQuery.isEmptyObject(app.location)
                            //     function success(pos) {
                            //         var crd = pos.coords;

                            //       // if (target.latitude === crd.latitude && target.longitude === crd.longitude) {
                            //       //   console.log('Congratulations, you reached the target');
                            //       //   navigator.geolocation.clearWatch(movingLocation);
                            //       // }
                            //         // Displays moving distance (Distance while moving from start to stop point)
                            //         $('#movingLatLon').html(Math.round(crd['latitude'] * 1000000) / 1000000 + '/' + Math.round(crd['longitude'] * 1000000) / 1000000);
                            //         var movingDistance = Math.round(distance(app.location['coords']['latitude'], app.location['coords']['longitude'], crd['latitude'], crd['longitude'], 'F') * 100)/100;
                            //         $('#movingDistance').text(movingDistance + ' Feet');

                            //         // Displays Accuracy
                            //         var posAccurancy = Math.round(crd.accuracy * 100)/100;
                            //         $('#accuracy').text(posAccurancy);
                            //     }

                            //     function error(err) {
                            //       console.warn('ERROR(' + err.code + '): ' + err.message);
                            //     }

                            //     options = {
                            //       enableHighAccuracy: true,
                            //       timeout: 5000,
                            //       maximumAge: 0
                            //     };
                            //     // movingLocation = navigator.geolocation.watchPosition(success, error, options);
                            //     movingLocation = setInterval(function() {   
                            //         navigator.geolocation.getCurrentPosition(success, error, options);
                            //     }, 500);
                            // }
                        }

                        // On second button press (Stop)
                        if(app.pressNumber === 2) {
                            app.startLocation = app.location;
                            app.location = position;
                            // Rounded 2 decimal places
                            app.walkDistance = Math.round(distance(app.startLocation['coords']['latitude'], app.startLocation['coords']['longitude'], app.location['coords']['latitude'], app.location['coords']['longitude'], 'F') * 100)/100;
                            measurement = new Measurement(undefined, undefined, startAccuracies, endAccuracies, app.walkDistance, undefined, undefined, undefined);
                            measurement.startPoints = pointsToArray(startLatArr, startLongArr);
                            measurement.endPoints = pointsToArray(endLatArr, endLongArr);
                            measurement.finalStart = startPoint;
                            measurement.finalEnd = endPoint;

                            $('#startLocation').html('Start Point');
                            $('#startLocation').removeClass('stopButton');
                            $('#startLocation').removeClass('loadButton');
                            $('#startLocation').addClass('startButton');
                            $('#endLatLon').html(Math.round(app.location['coords']['latitude'] * 1000000) / 1000000 + '/' + Math.round(app.location['coords']['longitude'] * 1000000) / 1000000);
                            document.getElementById("startLocation").addEventListener("click", accuracyFinder);

                            var fails = 0;
                            measurementKeys = Object.keys(measurement);
                            for (var i = 0; i < measurementKeys.length; i++) {
                                if(!measurement[measurementKeys[i]]) {
                                    fails++;
                                }

                                if(measurementKeys.length - 1 === i && fails === 0) {
                                    var arr = JSON.parse(localStorage.measurements);
                                    arr.push(measurement);
                                    localStorage.setItem('measurements', JSON.stringify(arr));
                                    measurement = {};
                                }
                            }

                            // Reset all variables for new measurement
                            startLatArr = [];
                            startLongArr = [];
                            startAccuracies = [];
                            endLatArr = [];
                            endLongArr = [];
                            endAccuracies = [];
                            app.location = {};
                            app.startLocation = {};
                            app.pressNumber = 0;
                            // navigator.geolocation.clearWatch(movingLocation);
                            // clearInterval(movingLocation);
                            clearInterval(intervalLocation);
                            $('#distance').text(app.walkDistance + ' Feet');

                            $('#locatorLabel').text('Apache Cordova');
                            console.log('Reset', app.location, measurement)
                        } else {
                            app.location = position;
                        }
                    
                    }

                    
                    

                } else {
                    console.log("Locating", crd.accuracy);
                }
                // console.log('Lat: ' + crd.latitude + '. Long: ' + crd.longitude)
            }

            var optionsForLoop = {
              enableHighAccuracy: true,
              timeout: 30000
            };

            function onErrorForLoop(e) {
                console.log('error finding location', e)
                app.pressNumber = 1;
                $('#startLocation').html('Start');
                $('#startLocation').removeClass('stopButton');
                $('#startLocation').removeClass('loadButton');
                $('#startLocation').addClass('startButton');

                $('#distance').text(app.walkDistance + ' Feet');

                $('#locatorLabel').text('Apache Cordova');
                return;
            };

            if(app.pressNumber === 0) {
                clearInterval(intervalLocation);
            }
            
            if(app.pressNumber === 1) {
                intervalLocation = setInterval(function() {   
                    navigator.geolocation.getCurrentPosition(successForLoop, onErrorForLoop, optionsForLoop);
                }, timeOfInterval);
            }

        }

        function avg(arr) {
            var total = 0;
            for (var i = 0; i < arr.length; i++) {
                total += arr[i];
            }
            return total/arr.length;
        }

        // function myMap() {
        //     console.log('clicked')
        //     var mapProp= {
        //         center:new google.maps.LatLng(51.508742,-0.120850),
        //         zoom:5,
        //     };
        //     var map=new google.maps.Map(document.getElementById("googleMap"),mapProp);
        // }
        // function initialize() {
        //     console.log('fired ')
        //     var mapOptions = {
        //         zoom: 5,
        //         center: new google.maps.LatLng(-34.000009, -56.197645),
        //         mapTypeId: google.maps.MapTypeId.ROADMAP
        //     }
        //     var mapCanvas = document.createElement("div");
        //     mapCanvas.id = "canvas";
        //     mapCanvas.style.width = "200px";
        //     mapCanvas.style.height = "200px";
        //      document.body.appendChild(mapCanvas);
        //     var map = new google.maps.Map(mapCanvas, mapOptions);
        // }
        // document.getElementById("mapsInitial").addEventListener("click", initialize);
        function createCollapsible() {
            var coll = document.getElementsByClassName('collapsible');

            for (var i = 0; i < coll.length; i++) {
                coll[i].addEventListener('click', function() {
                    this.classList.toggle('active');
                    var content = this.nextElementSibling;
                    if (content.style.display === 'block') {
                        content.style.display = 'none';
                    } else {
                        content.style.display = 'block';
                    }
                });
            }
        }

    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

app.initialize();


// var map, options, myLatLng;
// function initMap() {
//     myLatLng = {lat: 34.052235, lng: -118.243683};
//     options = {
//         center: myLatLng,
//         zoom: 12
//     }

//     var map = new google.maps.Map(document.getElementById('map'), options);

//     var marker = new google.maps.Marker({
//         position: myLatLng,
//         // map: map,
//         title: 'Hello World!'
//     });

//     marker.setMap(map);
// }
