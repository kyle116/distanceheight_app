document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    // Now safe to use device APIs
    var intervalLocation;
    var numberOfSamples = $('#samples').val() ? $('#samples').val() : 5;
    var timeOfInterval = $('#time').val() ? $('#time').val() : 500;
    var measurement = new Measurement();
    var measurementKeys;
    var pressNumber = 0;
    var x = 0;
    var y = 0;
    var z = 0;
    function Measurement(startPoints, endPoints, accuracies1, accuracies2, distance, top, bottom, height) {
        this.numberOfSamples = numberOfSamples;
        this.timeOfInterval = timeOfInterval;
        this.startPoints = startPoints;
        this.startLatArr = [];
        this.startLongArr = [];
        this.finalStart;
        this.endPoints = endPoints;
        this.endLatArr = [];
        this.endLongArr = [];
        this.finalEnd;
        this.startAccuracies = accuracies1 ? accuracies1 : [];
        this.endAccuracies = accuracies2 ? accuracies2 : [];
        this.distance = distance;
        this.top = top;
        this.bottom = bottom;
        this.height = height;
        this.timeDate = new Date();
        this.date = this.timeDate.getFullYear()+'-'+(this.timeDate.getMonth()+1)+'-'+this.timeDate.getDate();
        this.time = formatAMPM(this.timeDate);

        function formatAMPM(date) {
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0'+minutes : minutes;
            var strTime = hours + ':' + minutes + ' ' + ampm;
            return strTime;
        }
    }

    document.getElementById("startLocation").addEventListener("click", accuracyFinder);
    document.getElementById("treeTop").addEventListener("click", angles);
    document.getElementById("treeBottom").addEventListener("click", angles);
    document.getElementById("camera").addEventListener("click", cameraFunction);
    document.getElementById("cameraStop").addEventListener("click", cameraFunctionStop);
    // document.getElementById("clearMeasurements").addEventListener("click", clearMeasurements);
    document.getElementById("resetMeasurement").addEventListener("click", resetMeasurement);
    document.getElementById("samples").addEventListener("change", function() {
        numberOfSamples = $('#samples').val() !== '' ? parseInt($('#samples').val()) : 5;
    });
    document.getElementById("time").addEventListener("change", function() {
        timeOfInterval = $('#time').val() !== '' ? parseInt($('#time').val()) : 500;
    });

    var toggleReadings = document.getElementsByClassName("displayReadings");
    for (var i = 0; i < toggleReadings.length; i++) {
        toggleReadings[i].addEventListener('click', displayReadings);
    }

    typeof localStorage.measurements === 'string' ? '' : localStorage.setItem('measurements', JSON.stringify([]));
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation);
        console.log('works')
    } else {
        console.log('error')
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

    function toRadians (angle) {
        return angle / 180 * Math.PI;
    }

    function angles(e) {
        if(e.target.id === 'treeTop') {
            measurement.top = x;
        } else if(e.target.id === 'treeBottom') {
            measurement.bottom = x;
        }

        if(measurement.bottom !== 0 && measurement.top !== 0) {
            var angle1 = 90 - measurement.bottom;
            var angle2 = measurement.bottom;
            // var side2 = 6;
            var side2 = measurement.distance;
            var angle1Rad = toRadians(angle1);
            var angle2Rad = toRadians(angle2);
            var side1 = (side2 * Math.sin(angle1Rad))/Math.sin(angle2Rad);

            var angle3 = measurement.top - 90;
            var angle4 = 90 - angle3;
            // var side4 = 6;
            var side4 = measurement.distance;
            var angle3Rad = toRadians(angle3);
            var angle4Rad = toRadians(angle4);
            var side3 = (side4 * Math.sin(angle3Rad))/Math.sin(angle4Rad);
            // console.log(angle1, angle2, angle3, angle4, side1, side2, side3, side4)
            
            var height = side1 + side3;
            measurement.height = height;
            // console.log('Height ' + height);
        }
        // console.log('measurement.top: ' + measurement.top + ' measurement.bottom: ' + measurement.bottom + '. Angle: ' + (measurement.top - measurement.bottom));
        // measurement = saveMeasurement(measurement);
        console.log(measurement)
        $('#outputTop').text(Math.round(measurement.top * 100)/100 + ' Degrees');
        $('#outputBottom').text(Math.round(measurement.bottom * 100)/100 + ' Degrees');
        $('#outputHeight').text(Math.round(height * 100)/100 + ' Feet');
        
        var fails = 0;
        measurementKeys = Object.keys(measurement);
        for (var i = 0; i < measurementKeys.length; i++) {
            if(!measurement[measurementKeys[i]]) {
                fails++;
            }

            if(measurementKeys.length - 1 === i && fails === 0) {
                measurement.numberOfSamples = numberOfSamples;
                measurement.timeOfInterval = timeOfInterval;
                var arr = JSON.parse(localStorage.measurements);
                arr.push(measurement);
                localStorage.setItem('measurements', JSON.stringify(arr));
                measurement = new Measurement();
                disableTopBottomButtons();
                // return;
            }
        }
    }

    // Device orientation test
    function handleOrientation(event) {
        x = event.beta;  // In degree in the range [-180,180] tilt vert
        y = event.gamma; // In degree in the range [-90,90] tilt horizontal
        z = event.alpha; // spin
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
    // var options = {
    //     x: window.screen.width/4,
    //     y: 20,
    //     width: window.screen.width/2,
    //     height: window.screen.height/2,
    //     camera: CameraPreview.CAMERA_DIRECTION.BACK,
    //     toBack: true,
    //     tapPhoto: true,
    //     tapFocus: false,
    //     previewDrag: false
    // };
    var options = {
        x: 0,
        y: 0,
        width: window.screen.width,
        height: window.screen.height,
        camera: CameraPreview.CAMERA_DIRECTION.BACK,
        toBack: true,
        tapPhoto: true,
        tapFocus: false,
        previewDrag: false
    };
    
    var newLeft = parseInt($('.crosshair').css('left'));
    var newTop = parseInt($('.crosshair').css('top'));
    function cameraFunction() {
        // $('.cameraDiv').css('display', 'block');
        // $('.cameraDiv').css('height', '100vh');
        // $('.cameraDiv').css('background-color', 'white');
        $('.contentDiv').css('display', 'none');
        $('.cameraDiv').css('display', 'block');

        $('.crosshair').css('display', 'block');
        $('.crosshair').css('left', (window.screen.width/2 - 50) + 'px');
        $('.crosshair').css('top', (window.screen.height/2 - 75) + 'px');

        $('html').css('background-color', 'transparent');
        $('body').css('background-color', 'transparent');
        // $('.crosshair').css('display', 'block');
        // $('.crosshair').css('left', (newLeft - 50) + 'px');
        // $('.crosshair').css('top', (newTop + 30) + 'px');
        CameraPreview.startCamera(options);
    }

    function cameraFunctionStop() {
        $('.cameraDiv').css('display', 'none');
        $('.contentDiv').css('display', 'block');

        $('html').css('background-color', '#E4E4E4');
        $('body').css('background-color', '#E4E4E4');
        $('.crosshair').css('display', 'none');
        CameraPreview.stopCamera();
    }


    function displayReadings() {
        window.scrollTo(0, 0);
        $('#readings').toggleClass('readingsClosed');
        $('#readings').toggleClass('readingsOpen');
        $('#readings').css('height', $('html').height());

        if($('#readings').hasClass('readingsOpen')) {
            var measurementsStorage = JSON.parse(localStorage.measurements);
            var htmlContents = '<button id="closeReadings" class="but displayReadings">Close Measurements</button><button id="clearMeasurements" class="but">Clear Measurements</button>';
            var emailBody = '';
            for (var i = 0; i < measurementsStorage.length; i++) {
                emailBody += 
                    `<b>Measurement ${i + 1}</b>
                    Taken at: ${measurementsStorage[i].date} ${measurementsStorage[i].time}
                    Samples: ${measurementsStorage[i].numberOfSamples}, Interval Time: ${measurementsStorage[i].timeOfInterval}\n
                    Start Lat/Lon: ${JSON.stringify(measurementsStorage[i].finalStart.lat + '/' + measurementsStorage[i].finalStart.long)}
                    End Lat/Lon: ${JSON.stringify(measurementsStorage[i].finalEnd.lat + '/' + measurementsStorage[i].finalEnd.long)}\n
                    Start Points Measured Lat/Lon: ${JSON.stringify(measurementsStorage[i].startPoints)}\n
                    End Points Observed Lat/Lon: ${JSON.stringify(measurementsStorage[i].endPoints)}\n
                    Distance: ${measurementsStorage[i].distance}
                    Start Accuracy: ${avg(measurementsStorage[i].startAccuracies)}
                    End Accuracy: ${avg(measurementsStorage[i].endAccuracies)}
                    Top: ${measurementsStorage[i].top}
                    Bottom: ${measurementsStorage[i].bottom}
                    Height: ${measurementsStorage[i].height}\n\n`
                htmlContents += 
                    `<button class="collapsible">Measurement ${i + 1}</button>
                    <div class="content">
                        <p>
                            Taken at: ${measurementsStorage[i].date} ${measurementsStorage[i].time}<br/>
                            Samples: ${measurementsStorage[i].numberOfSamples}, Interval Time: ${measurementsStorage[i].timeOfInterval}<br/>
                            Start Lat/Lon:<br/> ${JSON.stringify(measurementsStorage[i].finalStart.lat + '/' + measurementsStorage[i].finalStart.long)}<br/>
                            End Lat/Lon:<br/> ${JSON.stringify(measurementsStorage[i].finalEnd.lat + '/' + measurementsStorage[i].finalEnd.long)}<br/>
                            Start Points Measured Lat/Lon: ${JSON.stringify(measurementsStorage[i].startPoints)}<br/>
                            End Points Observed Lat/Lon: ${JSON.stringify(measurementsStorage[i].endPoints)}<br/>
                            Distance: ${measurementsStorage[i].distance}<br/>
                            Start Accuracy: ${avg(measurementsStorage[i].startAccuracies)}<br/>
                            End Accuracy: ${avg(measurementsStorage[i].endAccuracies)}<br/>
                            Top: ${measurementsStorage[i].top}<br/>
                            Bottom: ${measurementsStorage[i].bottom}<br/>
                            Height: ${measurementsStorage[i].height}<br/>
                        </p>
                    </div>`;
            }
            $('#readings').html(htmlContents);
            $('#closeReadings').after(`<button class="but"><a  href="mailto:?body=${encodeURI(emailBody)}">Email Results</a></button>`);

            document.getElementById("clearMeasurements").addEventListener("click", clearMeasurements);


            createCollapsible();
            for (var i = 0; i < toggleReadings.length; i++) {
                toggleReadings[i].addEventListener('click', displayReadings);
            }
        }
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
        pressNumber = pressNumber + 1;
        $('#startLocation').html('Locating....');
        $('#startLocation').addClass('loadButton');
        $('#startLocation').removeClass('startButton');
        $('#startLocation').removeClass('stopButton');
        document.getElementById("startLocation").removeEventListener("click", accuracyFinder);
        var locator, movingLocation;

        function successForLoop(position) {
            var crd = position.coords;
            if(crd.accuracy < 100) {

                var posAccurancy = Math.round(position.coords.accuracy * 100)/100;
                $('#accuracy').text(posAccurancy);

                if(pressNumber === 1 && measurement.startLatArr.length < numberOfSamples) {
                    measurement.startLatArr.push(crd.latitude);
                    measurement.startLongArr.push(crd.longitude);
                    measurement.startAccuracies.push(crd.accuracy);
                    position['coords']['latitude'] = avg(measurement.startLatArr);
                    position['coords']['longitude'] = avg(measurement.startLongArr);

                    measurement.finalStart = {lat: position['coords']['latitude'], long: position['coords']['longitude']};
                    $('#startLatLon').html(Math.round(measurement.finalStart.lat * 1000000) / 1000000 + '/' + Math.round(measurement.finalStart.long * 1000000) / 1000000);

                } else if(pressNumber === 2) {
                    measurement.endLatArr.push(crd.latitude);
                    measurement.endLongArr.push(crd.longitude);
                    measurement.endAccuracies.push(crd.accuracy);
                    position['coords']['latitude'] = avg(measurement.endLatArr);
                    position['coords']['longitude'] = avg(measurement.endLongArr);

                    measurement.finalEnd = {lat: position['coords']['latitude'], long: position['coords']['longitude']};
                    $('#endLatLon').html(Math.round(position['coords']['latitude'] * 1000000) / 1000000 + '/' + Math.round(position['coords']['longitude'] * 1000000) / 1000000);
                }

                // Displays Accuracy
                $('#accuracy').text(posAccurancy);

                // Moving Lat/Lon
                if(pressNumber === 1 && measurement.startLatArr.length === numberOfSamples) {
                    $('#movingLatLon').html(Math.round(crd['latitude'] * 1000000) / 1000000 + '/' + Math.round(crd['longitude'] * 1000000) / 1000000);
                    var movingDistance = Math.round(distance(measurement.finalStart.lat, measurement.finalStart.long, crd['latitude'], crd['longitude'], 'F') * 100)/100;
                    $('#movingDistance').text(movingDistance + ' Feet');
                }

                if((measurement.startLatArr.length >= numberOfSamples && pressNumber === 1) || (measurement.endLatArr.length >= numberOfSamples && pressNumber === 2)) {
                    console.log('Avg Lat: ' + position['coords']['latitude'] + '. Avg Long: ' + position['coords']['longitude']);
                    console.log('Press number: ' + pressNumber);

                    if(pressNumber === 1) {

                        $('#startLocation').html('Stop Point');
                        $('#startLocation').addClass('stopButton');
                        $('#startLocation').removeClass('loadButton');
                        $('#startLocation').removeClass('startButton');
                        $('#startLatLon').html(Math.round(measurement.finalStart.lat * 1000000) / 1000000 + '/' + Math.round(measurement.finalStart.long * 1000000) / 1000000);
                        document.getElementById("startLocation").addEventListener("click", accuracyFinder);
                    }

                    // On second button press (Stop)
                    if(pressNumber === 2) {
                        // Rounded 2 decimal places
                        measurement.distance = Math.round(distance(measurement.finalStart.lat, measurement.finalStart.long, measurement.finalEnd.lat, measurement.finalEnd.long, 'F') * 100)/100;
                        measurement.startAccuracies = measurement.startAccuracies;
                        measurement.endAccuracies = measurement.endAccuracies;
                        measurement.startPoints = pointsToArray(measurement.startLatArr, measurement.startLongArr);
                        measurement.endPoints = pointsToArray(measurement.endLatArr, measurement.endLongArr);

                        $('#startLocation').html('Start Point');
                        $('#startLocation').removeClass('stopButton');
                        $('#startLocation').removeClass('loadButton');
                        $('#startLocation').addClass('startButton');
                        $('#endLatLon').html(Math.round(measurement.finalEnd.lat * 1000000) / 1000000 + '/' + Math.round(measurement.finalEnd.long * 1000000) / 1000000);
                        document.getElementById("startLocation").addEventListener("click", accuracyFinder);

                        pressNumber = 0;
                        clearInterval(intervalLocation);
                        enableTopBottomButtons();
                        $('#distance').text(measurement.distance + ' Feet');

                        $('#locatorLabel').text('Press Start Point');
                        console.log('Reset', measurement)
                    }
                
                }
            } else {
                console.log("Locating", crd.accuracy);
            }
        }

        var optionsForLoop = {
          enableHighAccuracy: true,
          timeout: 30000
        };

        function onErrorForLoop(e) {
            console.log('error finding location', e)
            pressNumber = 1;
            $('#startLocation').html('Start');
            $('#startLocation').removeClass('stopButton');
            $('#startLocation').removeClass('loadButton');
            $('#startLocation').addClass('startButton');

            $('#distance').text(measurement.distance + ' Feet');

            $('#locatorLabel').text('Press Start Point');
            return;
        };

        if(pressNumber === 0) {
            clearInterval(intervalLocation);
        }
        
        if(pressNumber === 1) {
            clearDisplay();
            // Resets lat/lon start and end if measurement isnt complete
            if(measurement.startLatArr.length === measurement.endLatArr.length && measurement.endLatArr.length > 0) {
                measurement = new Measurement();
            } else if((measurement.top && measurement.startLatArr.length === 0) || (measurement.bottom && measurement.startLatArr.length === 0)) {
                measurement = new Measurement();
            }

            intervalLocation = setInterval(function() {   
                navigator.geolocation.getCurrentPosition(successForLoop, onErrorForLoop, optionsForLoop);
            }, timeOfInterval);
        }

    }

    function saveMeasurement(mnt) {
        var fails = 0;
        measurementKeys = Object.keys(mnt);
        for (var i = 0; i < measurementKeys.length; i++) {
            if(!mnt[measurementKeys[i]]) {
                fails++;
            }

            if(measurementKeys.length - 1 === i && fails === 0) {
                var arr = JSON.parse(localStorage.measurements);
                arr.push(mnt);
                localStorage.setItem('measurements', JSON.stringify(arr));
                return new Measurement();
            }
        }
    }

    function avg(arr) {
        var total = 0;
        for (var i = 0; i < arr.length; i++) {
            total += arr[i];
        }
        return total/arr.length;
    }

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

    function clearDisplay() {
        $('#startLatLon').text('0');
        $('#endLatLon').text('0');
        $('#outputTop').text('0');
        $('#outputBottom').text('0');
        $('#outputHeight').text('0');
        $('#movingLatLon').text('0');
        $('#movingDistance').text('0');
        $('#distance').text('0');
        $('#accuracy').text('0');
    }

    function clearMeasurements() {
        localStorage.setItem('measurements', JSON.stringify([]));
    }

    function enableTopBottomButtons() {
        $('#treeTop').prop('disabled', false);
        $('#treeBottom').prop('disabled', false);
        $('#camera').prop('disabled', false);
        $('#cameraStop').prop('disabled', false);
    }

    function disableTopBottomButtons() {
        $('#treeTop').prop('disabled', true);
        $('#treeBottom').prop('disabled', true);
        $('#camera').prop('disabled', true);
        // $('#cameraStop').prop('disabled', true);
    }

    function resetMeasurement() {
        disableTopBottomButtons();
        clearDisplay();
        measurement = new Measurement;
    }
}
