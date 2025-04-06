// location_search_hook.js - Address search hook
const LocationSearchHook = {
  mounted() {
    // Get DOM elements
    this.input = document.getElementById("location-input");
    this.searchBtn = this.el.querySelector('[data-action="search"]');
    this.locationBtn = this.el.querySelector('[data-action="current-location"]');

    // Ensure input field exists
    if (!this.input) return;

    // Bind event handlers
    if (this.searchBtn) {
      this.searchBtn.addEventListener("click", () => this.searchLocation());
    }

    if (this.locationBtn) {
      this.locationBtn.addEventListener("click", () => this.getCurrentLocation());
    }

    this.input.addEventListener("keypress", e => {
      if (e.key === "Enter") this.searchLocation();
    });

    // Initialize address autocomplete
    this.initAutocomplete();
  },

  // Initialize Google address autocomplete
  initAutocomplete() {
    // Check if Google Maps API is loaded
    const checkGoogleMapsLoaded = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        // Create autocomplete
        this.autocomplete = new google.maps.places.Autocomplete(this.input, {
          types: ['geocode'],
          fields: ['formatted_address', 'geometry']
        });

        // Handle address selection
        this.autocomplete.addListener('place_changed', () => {
          const place = this.autocomplete.getPlace();

          if (!place.geometry || !place.geometry.location) {
            this.showNotification("Cannot find this address, please try a more specific search");
            return;
          }

          // Get coordinates and update map
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          this.input.value = place.formatted_address;
          this.updateMap(lat, lng);
        });
      } else {
        // API not yet loaded, continue waiting
        setTimeout(checkGoogleMapsLoaded, 500);
      }
    };

    checkGoogleMapsLoaded();
  },

  // Search location
  searchLocation() {
    const address = this.input.value.trim();
    if (!address) {
      this.showNotification("Please enter a location");
      return;
    }

    this.showNotification(`Searching: ${address}`);
    this.geocodeAddress(address);
  },

  // Geocode address to coordinates
  geocodeAddress(address) {
    if (!window.google || !window.google.maps) {
      this.showNotification("Map service is not loaded yet");
      return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results && results.length > 0) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();

        // Update input field and map
        this.input.value = results[0].formatted_address;
        this.updateMap(lat, lng);
      } else {
        this.showNotification(`Unable to find location: ${address}`);
      }
    });
  },

  // Get current location
  getCurrentLocation() {
    if (!navigator.geolocation) {
      this.showNotification("Your browser does not support location services");
      return;
    }

    this.showNotification("Getting your location...");

    navigator.geolocation.getCurrentPosition(
      // Success callback
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Reverse geocode address
        this.reverseGeocode(lat, lng);
        this.updateMap(lat, lng);
      },
      // Error callback
      (error) => {
        let message;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied, please authorize your browser to access your location";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            message = "Location request timed out";
            break;
          default:
            message = "Unable to get location";
        }

        this.showNotification(message);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  },

  // Reverse geocode coordinates to address
  reverseGeocode(lat, lng) {
    if (!window.google || !window.google.maps) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === "OK" && results && results.length > 0) {
          this.input.value = results[0].formatted_address;
        } else {
          this.input.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
      }
    );
  },

  // Update map
  updateMap(lat, lng) {
    this.showNotification("Searching for nearby providers...");

    // Use MapHook or send event
    if (window.currentMapHook && window.currentMapHook._fetchNearbyProviders) {
      window.currentMapHook._fetchNearbyProviders({ lat, lng });
    } else {
      this.pushEvent("update-location", {
        latitude: lat.toString(),
        longitude: lng.toString()
      });
    }
  },

  // Show notification
  showNotification(message) {
    // Display notification through MapHook
    if (window.currentMapHook && window.currentMapHook._showNotification) {
      window.currentMapHook._showNotification(message);
      return;
    }

    // Simple notification
    console.log(`Notification: ${message}`);

    // Create notification element
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      background-color: rgba(0, 0, 0, 0.7); color: white; padding: 10px 20px;
      border-radius: 20px; font-size: 14px; z-index: 10000; text-align: center;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    // Auto hide
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
};

export default LocationSearchHook; 