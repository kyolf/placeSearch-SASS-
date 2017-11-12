'use strict';

//App State
const state = {
  marker: [],
  map: null,
  listStr: '',
  request: null
};

//Helper Functions
//Convert Price Level to a Str
function getPriceLevel(priceLevel){
  switch (priceLevel) {
    case 0:
      return 'Free';
    case 1:
      return 'Cheap';
    case 2:
      return 'Moderate';
    case 3: 
      return 'Expensive';
    case 4:
      return 'Very Expensive';
    default:
      return 'No Price Evaluations';
  }
}

//Get Rid of US in formatted address
function reformatAddress(addr){
  const addrArray = addr.split(',')
  return addrArray.slice(0, addrArray.length -1).join(',');
}


//State Manipulation Functions
//Change the request, map, and service properties in appState
function setGoogleProp(state, request, map, service){
  state.request = request;
  state.map = map;
  state.service = service;
}

//Reset list
function resetListStr(state){
  state.listStr = '';
}

//Set list to show no results
function showNoResultsText(state){
  state.listStr = `<li class="no_results_list"><p class='no_results'>No Results Found!</p></li>`;
}

//Create markers on map
function createMarker(state, markerPos){
  state.marker.push(new google.maps.Marker({
    position: markerPos,
    map: state.map
  }));
}

//Clear all markers
function clearMarker(state) {
  state.marker.map(el => el.setMap(null));
  state.marker = [];
}

//Sets the listStr to the list of results
function makeList(state, result, index){
  if(!result.photos){
    state.listStr += 
    `<li res_id=${index}>
      <div class="info_img">
        <img src="${result.icon}" alt="${result.name} pic">
        <div class="info">
          <p>${result.name}</p>
          <p>${reformatAddress(result.formatted_address)}</p>
          <p><span class="price">Price Level:</span> ${getPriceLevel(result.price_level)}</p>
          <p><span class="rating">Rating (1-5):</span> ${result.rating} stars</p>
        </div>
      <div>
    </li>`;
  }
  else{
    state.listStr += 
      `<li res_id=${index}>
        <div class="info_img">
          <img src="${result.photos[0].getUrl({maxWidth:100, maxHeight:100})}" alt="${result.name} pic">
          <div class="info">
            <p>${result.name}</p>
            <p>${reformatAddress(result.formatted_address)}</p>
            <p><span class="price">Price Level:</span> ${getPriceLevel(result.price_level)}</p>
            <p><span class="rating">Rating (1-5):</span> ${result.rating} stars</p>
          </div>
        </div>
      </li>`;
  }
}

//Render Functions
//Renders the listStr
function renderList(state, element){
  element.html(state.listStr);
}

//Reset the input bar
function resetSearchInput(element){
  element.val('');
}

//Google Functions
//Google Initialization
function initMap(){
  const sf = {
    lat: 37.7749,
    lng: -122.4194
  };

  const map = new google.maps.Map(document.getElementById('map'), {
    center: sf,
    zoom: 13,
  });

  const request = {
    location: sf,
    radius: '100',
    query: ['pizza'],
    openNow: true
  };

  const infoWindow = new google.maps.InfoWindow;
  const service = new google.maps.places.PlacesService(map);

  setGoogleProp(state, request, map, service);

  service.textSearch(state.request, callback);
  eventListeners(state, infoWindow);
}

//Makes the markers on the map and initializes the list
function callback(results, status) {
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      createMarker(state, {lat: results[i].geometry.location.lat(), lng: results[i].geometry.location.lng()});
      makeList(state, results[i], i);
    }
  }
  else{
    showNoResultsText(state);
  }
  renderList(state, $('.list'));
}

//Get your location
function getYourCoords(state, infoWindow){
  navigator.geolocation.getCurrentPosition(function(position) {
    const pos = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    state.request.location = pos;
    state.map.setCenter(pos);
    state.service.textSearch(state.request, callback);
  }, function() {
    infoWindow.setPosition(state.map.getCenter());
    infoWindow.setContent('Error: The Geolocation service was blocked.');
    infoWindow.open(state.map);
    state.service.textSearch(state.request, callback);
  });
}

//Event Listeners
function eventListeners(state, infoWindow){

  //Search for places nearby you
  $('.search').on('click', 'button', (event) => {
    event.preventDefault();
    if($('.search_input').val().trim() !== ''){
      resetListStr(state);
      clearMarker(state);
      state.request.query = [`${$('.search_input').val()}`];
      getYourCoords(state, infoWindow);
      resetSearchInput($('.search_input'));
    }
    else{
      alert('Empty input');
    }
  });

  //List Interaction with Markers
  $('.list').on('click', 'li', (event)=>{
    const liEle = event.currentTarget;

    const pos = {
      lat: state.marker[$(liEle).attr('res_id')].internalPosition.lat(),
      lng: state.marker[$(liEle).attr('res_id')].internalPosition.lng()
    };

    infoWindow.setPosition(pos);
    infoWindow.setContent('Location Found.');
    infoWindow.open(state.map);
    state.map.setCenter(pos);
    state.map.setZoom(15);
  });
}

