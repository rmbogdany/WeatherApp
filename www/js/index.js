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
var week = new Array();
week[0] = "Sunday";
week[1] = "Monday";
week[2] = "Tuesday";
week[3] = "Wednesday";
week[4] = "Thursday";
week[5] = "Friday";
week[6] = "Saturday";

var dataCurrent = '', dataTemp = '', dataFeelsLike = '';
var app = {
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
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
		navigator.geolocation.getCurrentPosition( onSuccess, onError, { timeout: 30000 } );
		
		function onSuccess( position ) {
			if ( position.coords ) {
				//sets up the initial screen
				let lat = position.coords.latitude,
					lng=position.coords.longitude;
				var map = L.map('map').setView([lat, lng], 10);

				L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
				}).addTo(map);

				var marker = L.marker([lat,lng]);
				marker.addTo(map).bindPopup(lat +', '+ lng);
					
				var searchControl = L.esri.Geocoding.geosearch().addTo(map);
				var results = L.layerGroup().addTo(map);
				
				//gets weather data
				getAddress(lat, lng).then(data => {handleAddress(data, lat, lng);});
				getData(lat, lng).then(data => {handleData(data)});
				
				//initializes the search control
				searchControl.on('results', function (data) {
					clearData();
					results.clearLayers();
					if(marker != ''){
						map.removeLayer(marker);
						marker = '';
						document.getElementById('inside').innerHTML = '';
					}
					for (var i = data.results.length - 1; i >= 0; i--) {
						results.addLayer(L.marker(data.results[i].latlng).bindPopup(data.results[i].text));
					}
					if(data.results.length == 1){
						getAddress(data.results[0].latlng.lat, data.results[0].latlng.lng).then(data => {handleAddress(data, lat, lng);});
						getData(data.results[0].latlng.lat, data.results[0].latlng.lng).then(data => {handleData(data)});
					}
				});
				
				//allows user to click on the map
				map.on('click',function(e){
					lat = e.latlng.lat;
					lng = e.latlng.lng;
					results.clearLayers();
					if(marker != '') {
						map.removeLayer(marker);
					};

					//Add a marker to show where you clicked.
					marker = L.marker([lat,lng]).addTo(map).bindPopup(lat +', '+ lng);
				
					getAddress(lat, lng).then(data => {handleAddress(data, lat, lng);});
					getData(lat, lng).then(data => {handleData(data);});
				});
				
				document.onclick = function(e){
					var popup = document.getElementById("myPopup");
					if(e.target.id != "myPopup" && e.target.id != "head" && e.target.id != "inside" && popup.classList.contains("show")){
						popup.classList.toggle("show");
					}
				};
				
				var hourly = document.getElementById('inside2');
				hourly.onclick = function(e){
					document.getElementById('outside').classList.remove("view");
				};
				
				//Allows the three pieces of data to update when clicked
				var currentW = document.getElementById('currentW');
				currentW.onclick = function(e){
					if(dataCurrent != ''){
						this.getElementsByTagName('span')[0].innerHTML = dataCurrent;
					}
					else{
						this.getElementsByTagName('span')[0].innerHTML = "Can't Retrieve Data";
					}
				};
				var temp = document.getElementById('temp');
				temp.onclick = function(e){
					if(dataTemp != ''){
						var temp = Math.ceil(((parseInt(dataTemp)-273.15) *(9/5) + 32) * 100) / 100;
						this.getElementsByTagName('span')[0].innerHTML = temp + '°F';
					}
					else{
						this.getElementsByTagName('span')[0].innerHTML = "Can't Retrieve Data";
					}
				};
				var feelsLike = document.getElementById('feelsLike');
				feelsLike.onclick = function(e){
					if(dataFeelsLike != ''){
						var temp = Math.ceil(((parseInt(dataFeelsLike)-273.15) *(9/5) + 32) * 100) / 100;
						this.getElementsByTagName('span')[0].innerHTML = temp + '°F';
					}
					else{
						this.getElementsByTagName('span')[0].innerHTML = "Can't Retrieve Data";
					}
				};
				
				var popUp = document.getElementById('head');
				popUp.onclick = function(e){
					popUpFunc();
				};
				var popForecast = document.getElementById('click');
				popForecast.onclick = function(e){
					popUpForecast();
				};
			}	
		}
		
		function onError(error) {
			alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
		}
	}
	
};

app.initialize();

//gets weather data
async function getData(lat, lng){
	let response = await fetch('https://api.openweathermap.org/data/2.5/weather?lat='+ lat +'&lon='+lng+'&appid=5953bf96ecf09e3cebaf5bd5cb85da5d');
	let data = await response.json();
	return data;
}

//gets address data
async function getAddress(lat, lng){
	let response = await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat='+ lat +'&lon='+lng);
	let data = await response.json();
	return data;
}

//gets forecast data
async function getForecast(lat, lng){
	let response = await fetch('https://api.openweathermap.org/data/2.5/forecast?lat='+ lat +'&lon='+lng+'&appid=5953bf96ecf09e3cebaf5bd5cb85da5d');
	let data = await response.json();
	return data;
}

function handleAddress(data1, lat, lng){
	//adds the bottom data to the screen
	var str = '';
	if(data1.error != 'Unable to geocode'){
		if(data1.address.county != undefined){
			var county = data1.address.county;
			var state = ', ' + data1.address.state;
			str += county + state;
		}
		else{
			var country = data1.address.country;
			state = data1.address.state;
			str += state + ', ' + country;
		}
	}
	document.getElementById('head').getElementsByTagName('span')[0].innerHTML = str;
	document.getElementById('location').getElementsByTagName('span')[0].innerHTML = str;
	document.getElementById('lat').getElementsByTagName('span')[0].innerHTML = lat;
	document.getElementById('lon').getElementsByTagName('span')[0].innerHTML = lng;
	getForecast(lat, lng).then(data => {handleForecast(data, data1);});
}

function handleData(data){
	if(data){
		dataCurrent = data.weather[0].main;
		dataTemp = data.main.temp;
		dataFeelsLike = data.main.feels_like;
	}
	else{
		dataTemp = '';
		dataCurrent = '';
		dataFeelsLike = '';
	}
}  

function handleForecast(data2, lat, lng){
	//if data is returned, add it to the forecast div
	if(data2.cod == '200'){
		var len = data2.list.length;
		var html = '';
		currentdate = '';
		var i = 0;
		var x = 0;
		while(x < 5){
			var date = data2.list[i].dt_txt;
			var arr = date.split(/[- :]/);
			date = new Date(arr[0], arr[1]-1, arr[2], arr[3], arr[4], arr[5]);
			currentdate = date;
			var maxtemp = parseInt(data2.list[i].main.temp);
			var mintemp = parseInt(data2.list[i].main.temp);
			var icon = data2.list[i].weather[0].icon;
			var stop = '';
			while(currentdate.getDate() == date.getDate() && stop == ''){
				currentdate = date;
				if(parseInt(data2.list[i].main.temp) < mintemp){
					mintemp = parseInt(data2.list[i].main.temp);
				}
				if(parseInt(data2.list[i].main.temp) > maxtemp){
					maxtemp = parseInt(data2.list[i].main.temp);
				}
				if(parseInt(data2.list[i].weather[0].icon) > parseInt(icon) && data2.list[i].weather[0].icon.charAt(2) != 'n'){
					icon = data2.list[i].weather[0].icon;
				}
				i += 1;
				if(i < len){
					var t = data2.list[i].dt_txt;
					var arr = t.split(/[- :]/);
					date = new Date(arr[0], arr[1]-1, arr[2], arr[3], arr[4], arr[5]);
				}
				else{
					stop = 'stop';
				}
			}
			var img = '<img src="https://openweathermap.org/img/wn/' + icon + '@2x.png"/>';
			var temp = Math.ceil(((parseInt(maxtemp)-273.15) *(9/5) + 32) * 100) / 100;
			var temp2 = Math.ceil(((parseInt(mintemp)-273.15) *(9/5) + 32) * 100) / 100;
			html += '<div><h4>' + week[currentdate.getDay()].substring(0,3) + '</h4>' + img + '<p class="bold">' + temp + '°F' + '</p>' + '<p>' + temp2 + '°F' + '</p>' + '</div>';
			x += 1;
		}
		document.getElementById('forecast').innerHTML = html;
	}
}

function clearData(){
	//clears data on the map
	document.getElementById('location').getElementsByTagName('span')[0].innerHTML = '';
	document.getElementById('lat').getElementsByTagName('span')[0].innerHTML = '';
	document.getElementById('lon').getElementsByTagName('span')[0].innerHTML = '';
	document.getElementById('inside').innerHTML = '';
	document.getElementById('forecast').innerHTML = '';
}

function popUpFunc() {
  var popup = document.getElementById("myPopup");
  popup.innerHTML = document.getElementById('inside').innerHTML;
  popup.classList.toggle("show");
}

function popUpForecast() {
  var popup = document.getElementById('outside');
  popup.classList.toggle("view");
}

function getOrdinal(date){
	return (date % 10 == 1 && date != 11 ? 'st' : (date % 10 == 2 && date != 12 ? 'nd' : (date % 10 == 3 && date != 13 ? 'rd' : 'th')))
}