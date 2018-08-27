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
    origLocation: {},
    walkDistance: 0,
    secondPress: 0,
    treeTop: 0,
    treeBottom: 0,
    x: 0,
    y: 0,
    z: 0,
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        this.receivedEvent('deviceready');
        
        var onSuccess = function(position) {
            // On second button press (Stop)
            if(app.secondPress === 2) {
                app.origLocation = app.location;
                app.location = position;
                // Rounded 2 decimal places
                app.walkDistance = Math.round(distance(app.origLocation['coords']['latitude'], app.origLocation['coords']['longitude'], app.location['coords']['latitude'], app.location['coords']['longitude'], 'F') * 100)/100;
                app.location = {};
                app.origLocation = {};
                app.secondPress = 0;
                // alert('Walk Distance ' + app.walkDistance);
                $('#showLocalStorage').text('Start');
                $('#distance').text(app.walkDistance + ' Feet');
            } else {
                app.location = position;
            }
        };

        // onError Callback receives a PositionError object
        function onError(error) {
            alert('code: '    + error.code    + '\n' +
                'message: ' + error.message + '\n');
        }

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

        function testFunc() {
            app.secondPress = app.secondPress + 1;
            $('#showLocalStorage').text('Stop');
            navigator.geolocation.getCurrentPosition(onSuccess, onError);
        }

        function toRadians (angle) {
            return angle / 180 * Math.PI;
        }

        function angles(e) {
            console.log(e.target.id)
            if(e.target.id === 'treeTop') {
                app.treeTop = app.x;
            } else if(e.target.id === 'treeBottom') {
                app.treeBottom = app.x;
            }

            if(app.treeBottom !== 0 && app.treeTop !== 0) {
                var angle1 = 90 - app.treeBottom;
                var angle2 = app.treeBottom;
                var side2 = 6;
                var angle1Rad = toRadians(angle1);
                var angle2Rad = toRadians(angle2);
                var side1 = (side2 * Math.sin(angle1Rad))/Math.sin(angle2Rad);

                var angle3 = app.treeTop - 90;
                var angle4 = 90 - angle3;
                var side4 = 6;
                var angle3Rad = toRadians(angle3);
                var angle4Rad = toRadians(angle4);
                var side3 = (side4 * Math.sin(angle3Rad))/Math.sin(angle4Rad);
                console.log(angle1, angle2, angle3, angle4, side1, side2, side3, side4)
                
                var height = side1 + side3;
                console.log('Height ' + height);
            }
            console.log('app.treeTop: ' + app.treeTop + ' app.treeBottom: ' + app.treeBottom + '. Angle: ' + (app.treeTop - app.treeBottom));
            $('#outputTop').text('Top: ' + app.treeTop);
            $('#outputBottom').text('Bottom: ' + app.treeBottom);
            $('#output').text('Output: ' + height);
        }

        // Device orientation test
        var output = $('#output');
        function handleOrientation(event) {
            app.x = event.beta;  // In degree in the range [-180,180] tilt vert
            app.y = event.gamma; // In degree in the range [-90,90] tilt horizontal
            app.z = event.alpha; // spin
        }

        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleOrientation);
            console.log('works')
        } else {
            console.log('error')
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

        // window.addEventListener("devicemotion", handleMotionEvent, true);


        // Camera
        let options = {
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
            $('.crosshair').css('display', 'none');
            $('html').css('background-color', '#E4E4E4');
            $('body').css('background-color', '#E4E4E4');
            CameraPreview.stopCamera();
        }
        
        document.getElementById("showLocalStorage").addEventListener("click", testFunc);
        document.getElementById("treeTop").addEventListener("click", angles);
        document.getElementById("treeBottom").addEventListener("click", angles);
        document.getElementById("camera").addEventListener("click", cameraFunction);
        document.getElementById("cameraStop").addEventListener("click", cameraFunctionStop);
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
