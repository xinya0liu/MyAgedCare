// map_hook.js - Complete version, including automatic geolocation request functionality
const MapHook = {
  mounted() {
    console.log("MapHook mounted");

    // 1. Create an internal container that LiveView won't update directly
    this.setupMapContainers();

    // 2. Get proxy URL
    const apiProxyUrl = this.el.getAttribute('data-api-proxy-url');
    if (!apiProxyUrl) {
      console.error("No Google Maps API proxy URL found");
      this.hideLoadingIndicator();
      return;
    }

    // 3. Load Google Maps API and initialize map
    this.loadGoogleMapsAPI(apiProxyUrl);
  },

  // Create stable internal map container
  setupMapContainers() {
    console.log("Setting up map containers");

    // Hide loading indicator
    this.hideLoadingIndicator();

    // Retain reference to outer container
    this.outerContainer = this.el;

    // Set outer container style
    this.outerContainer.style.position = "relative";
    this.outerContainer.style.height = "400px";
    this.outerContainer.style.width = "100%";

    // If internal container already exists, don't recreate
    if (this.outerContainer.querySelector("#inner-map-container")) {
      console.log("Inner map container already exists");
      this.innerContainer = this.outerContainer.querySelector("#inner-map-container");
      return;
    }

    // Create internal container as stable map mounting point
    this.innerContainer = document.createElement("div");
    this.innerContainer.id = "inner-map-container";
    this.innerContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    `;

    // Add to outer container
    this.outerContainer.appendChild(this.innerContainer);

    console.log("Inner map container created");
  },

  // Hide loading indicator
  hideLoadingIndicator() {
    const loadingIndicator = document.getElementById("map-loading-indicator");
    if (loadingIndicator) {
      loadingIndicator.style.display = "none";
    }
  },

  // Load Google Maps API
  loadGoogleMapsAPI(apiProxyUrl) {
    console.log("Starting Google Maps API load process");

    // Add check and cleanup functions
    const checkMapsAPI = () => {
      return window.google &&
        window.google.maps &&
        window.google.maps.Map &&
        window.google.maps.geometry &&
        window.google.maps.geometry.spherical;
    };

    // If fully loaded
    if (checkMapsAPI()) {
      console.log("Google Maps API already fully loaded, initializing map");
      this.initMap();
      return;
    }

    // If currently loading
    if (window.googleMapsApiLoading) {
      console.log("Google Maps API already loading, waiting for completion");

      // Set timeout to prevent infinite waiting
      let checkCount = 0;
      const maxChecks = 50; // 5 second timeout

      const checkInterval = setInterval(() => {
        checkCount++;

        if (checkMapsAPI()) {
          clearInterval(checkInterval);
          console.log("Google Maps API load completed during wait");
          this.initMap();
        } else if (checkCount >= maxChecks) {
          // Timeout, try reloading
          clearInterval(checkInterval);
          console.warn("Timeout waiting for Google Maps API, attempting reload");
          window.googleMapsApiLoading = false;
          this.loadGoogleMapsAPI(apiProxyUrl); // Recursive retry
        }
      }, 100);
      return;
    }

    // Mark as loading
    window.googleMapsApiLoading = true;

    // Don't display loading prompt to avoid possible error notifications

    // Create unique global callback name
    const callbackName = "initMapCallback_" + Math.floor(Math.random() * 10000000);

    // Set callback function
    window[callbackName] = () => {
      console.log("Google Maps API callback executed");

      // Validate loaded components
      if (checkMapsAPI()) {
        console.log("Google Maps API fully loaded with geometry library");
        window.googleMapsApiLoaded = true;
        window.googleMapsApiLoading = false;
        this.initMap();
      } else {
        console.error("Google Maps API loaded but geometry library is missing");
        // Don't display error notification
        window.googleMapsApiLoading = false;
      }
    };

    // Set error handling
    const handleScriptError = () => {
      console.error("Failed to load Google Maps API script");
      window.googleMapsApiLoading = false;
      // Don't display error notification
      script.removeEventListener('error', handleScriptError);
    };

    // Create script element
    const script = document.createElement("script");
    script.src = `${apiProxyUrl}/maps/api/js?libraries=geometry,places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.addEventListener('error', handleScriptError);

    // Add to document
    document.head.appendChild(script);

    console.log(`Google Maps API loading through proxy: ${apiProxyUrl}`);

    // Set timeout protection
    setTimeout(() => {
      if (!checkMapsAPI() && window.googleMapsApiLoading) {
        console.error("Google Maps API load timeout after 15 seconds");
        window.googleMapsApiLoading = false;
        // Don't display error notification
      }
    }, 15000);
  },

  // Initialize map
  initMap() {
    console.log("Initializing map on inner container");

    // Ensure container exists and is visible
    if (!this.innerContainer || !document.body.contains(this.innerContainer)) {
      console.error("Map container is not in the DOM");
      this.showNotification("Map container does not exist, please refresh the page and try again", true);
      // Try to recreate container
      this.setupMapContainers();
      if (!this.innerContainer || !document.body.contains(this.innerContainer)) {
        return; // If still fails, exit initialization
      }
    }

    try {
      // Hide loading indicator
      this.hideLoadingIndicator();

      // Default location - Brisbane
      const defaultLocation = { lat: -27.4698, lng: 153.0251 };

      // Check if Google Maps is available
      if (!window.google || !window.google.maps || !window.google.maps.Map) {
        throw new Error("Google Maps API not available");
      }

      // Define map options
      const mapOptions = {
        center: defaultLocation,
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          position: google.maps.ControlPosition.TOP_RIGHT
        },
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER
        },
        scaleControl: true,
        streetViewControl: true,
        streetViewControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        fullscreenControl: true,
        gestureHandling: 'greedy' // Allow single finger zoom even on mobile devices
      };

      // Create map
      this.map = new google.maps.Map(this.innerContainer, mapOptions);

      if (!this.map) {
        throw new Error("Failed to create map object");
      }

      console.log("Map object created successfully");

      // Create info window
      this.infoWindow = new google.maps.InfoWindow({
        maxWidth: 300,
        pixelOffset: new google.maps.Size(0, -30)
      });

      // Register error handler
      google.maps.event.addListener(this.map, 'error', (e) => {
        console.error("Map error event:", e);
      });

      // Don't display initialization notification

      // Once map is fully loaded, load provider data and automatically request location
      google.maps.event.addListenerOnce(this.map, 'idle', () => {
        console.log("Map fully loaded and idle");

        // First load provider data
        try {
          this.loadProviderData();
        } catch (error) {
          console.error("Error loading provider data:", error);
        }

        // Then automatically request user location
        setTimeout(() => {
          // Use try/catch to wrap location request
          try {
            this.requestUserLocation();
          } catch (error) {
            console.error("Error requesting user location:", error);
            // Don't display error notification, use default location

            // Use default location
            const defaultLocation = { lat: -27.4698, lng: 153.0251 };
            this.createUserMarker(defaultLocation);
            this.updateLocationToServer(defaultLocation);
          }
        }, 1000); // Increase delay to ensure map fully loaded

        // Keep button click event for user manual trigger
        const locationBtn = document.getElementById("get-location-btn");
        if (locationBtn) {
          // Remove any existing event listeners to avoid duplicate binding
          locationBtn.replaceWith(locationBtn.cloneNode(true));

          // Re-get button reference and add event
          const newLocationBtn = document.getElementById("get-location-btn");
          if (newLocationBtn) {
            newLocationBtn.addEventListener("click", () => {
              console.log("Location button clicked");
              try {
                this.requestUserLocation();
              } catch (error) {
                console.error("Error handling location button click:", error);
              }
            });
            console.log("Location button event handler attached");
          }
        } else {
          console.warn("Location button not found in the DOM");
        }
      });

      // Add additional event listeners to prevent 'idle' event from not firing
      setTimeout(() => {
        if (!this.providers || this.providers.length === 0) {
          console.warn("Map idle event might not have fired, forcing provider data load");
          this.loadProviderData();
        }
      }, 3000);

    } catch (error) {
      console.error("Error initializing map:", error);

      // Try to recover
      setTimeout(() => {
        if (window.google && window.google.maps) {
          console.log("Attempting to recover map initialization");
          this.setupMapContainers();
          this.initMap();
        }
      }, 2000);
    }
  },

  // Request user location
  requestUserLocation() {
    console.log("Requesting user location");

    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      this.showNotification("Your browser does not support location services", true);
      return;
    }

    // Display loading status
    this.showNotification("Getting your location...");

    // Directly use try/catch to wrap location request
    try {
      navigator.geolocation.getCurrentPosition(
        // Success callback
        (position) => {
          try {
            console.log("Got user location successfully:", position);

            if (!position || !position.coords) {
              console.error("Position object is invalid:", position);
              throw new Error("Invalid position data");
            }

            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };

            console.log("User location coordinates:", userLocation);

            // Update map
            this.map.setCenter(userLocation);

            // Create user location marker
            this.createUserMarker(userLocation);

            // Location retrieved successfully, but here no notification is displayed
            // Delay a bit before updating server to avoid fast request issues
            setTimeout(() => {
              this.updateLocationToServer(userLocation);
            }, 500);
          } catch (err) {
            console.error("Error processing position:", err);
            this.handleLocationError({ code: 999, message: "Error processing position: " + err.message });
          }
        },
        // Error callback
        (error) => {
          console.error("Geolocation error:", error.code, error.message);
          this.handleLocationError(error);
        },
        // Location options
        {
          enableHighAccuracy: true,  // Try to get more precise location
          timeout: 10000,            // Increase timeout time
          maximumAge: 60000          // Allow cache 1 minute
        }
      );
    } catch (error) {
      console.error("Exception during geolocation request:", error);
      this.handleLocationError({ code: 999, message: "Exception during geolocation request: " + error.message });
    }
  },

  // Handle location error
  handleLocationError(error) {
    console.error("Handling location error:", error);

    // Simplified message handling - all errors show a single notification
    this.showNotification("Using default location", true);

    // Use default location (Brisbane)
    const defaultLocation = { lat: -27.4698, lng: 153.0251 };

    // Still keep map centered on default location
    this.map.setCenter(defaultLocation);

    // Use default location to create user marker
    this.createUserMarker(defaultLocation);

    // Use default location to calculate distance
    setTimeout(() => {
      this.updateLocationToServer(defaultLocation);
    }, 500);
  },

  // Create user location marker
  createUserMarker(location) {
    // If marker already exists, remove
    if (this.userMarker) {
      this.userMarker.setMap(null);
    }

    // Create marker
    this.userMarker = new google.maps.Marker({
      position: location,
      map: this.map,
      title: "Your Location",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2,
        scale: 8
      }
    });
  },

  // Update location to server - Improved version
  updateLocationToServer(location) {
    console.log("Updating location to server:", location);

    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      console.error("Invalid location data:", location);
      this.showNotification("Invalid location data, using default location", true);

      // Use default location
      location = { lat: -27.4698, lng: 153.0251 };
    }

    try {
      // First check if Google Maps API is available
      if (!google || !google.maps || !google.maps.geometry || !google.maps.geometry.spherical) {
        throw new Error("Google Maps Geometry library unavailable, cannot calculate distance");
      }

      // Check if provider data is valid
      if (!this.providers || !Array.isArray(this.providers) || this.providers.length === 0) {
        console.warn("No valid providers available for distance calculation");
        this.showNotification("No available provider data found", true);
        return;
      }

      // No notification here

      // Calculate distance to each provider
      const providerDistances = {};
      const userLatLng = new google.maps.LatLng(location.lat, location.lng);

      // Valid provider count
      let validProviderCount = 0;

      // Calculate distance and store
      this.providers.forEach(provider => {
        try {
          // Validate provider data
          if (!provider || !provider.id ||
            typeof provider.latitude !== 'number' ||
            typeof provider.longitude !== 'number' ||
            isNaN(provider.latitude) || isNaN(provider.longitude)) {
            console.warn(`Invalid provider data:`, provider);
            return;  // Skip this provider
          }

          // Use Google Maps distance calculation function
          const providerLatLng = new google.maps.LatLng(provider.latitude, provider.longitude);
          const distance = google.maps.geometry.spherical.computeDistanceBetween(userLatLng, providerLatLng);

          if (typeof distance !== 'number' || isNaN(distance)) {
            console.warn(`Invalid distance calculated for provider ${provider.id}:`, distance);
            return;
          }

          // Store distance data (converted to integer meters)
          const distanceInMeters = Math.round(distance);
          providerDistances[provider.id] = distanceInMeters;
          console.log(`Distance to provider ${provider.id} (${provider.name}): ${distanceInMeters}m`);

          validProviderCount++;
        } catch (err) {
          console.error(`Error calculating distance for provider ${provider.id}:`, err);
        }
      });

      if (validProviderCount === 0) {
        console.warn("No valid distances calculated for any provider");
        this.showNotification("Cannot calculate distance to providers", true);
        return;
      }

      console.log(`Successfully calculated distances for ${validProviderCount} providers`);

      // Prepare data to send to server
      const payload = {
        latitude: location.lat.toString(),
        longitude: location.lng.toString(),
        provider_distances: providerDistances
      };

      // Send to server
      this.pushEvent("update-location", payload);

      // Display success notification - This is the main notification point
      this.showNotification("Got your location, display nearby aged care providers", true);

    } catch (error) {
      console.error("Error updating location to server:", error);
    }
  },

  // Load provider data
  loadProviderData() {
    console.log("Loading provider data");

    try {
      // Get and parse provider data
      const providersData = this.el.getAttribute('data-providers');
      if (!providersData) {
        console.log("No provider data found");
        return;
      }

      // Parse provider data
      this.providers = JSON.parse(providersData)
        .map(str => {
          if (!str) return null;
          const [id, lat, lng, name] = str.split('|');
          return {
            id: parseInt(id),
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
            name: name
          };
        })
        .filter(p => p !== null);

      console.log("Parsed providers:", this.providers);

      // Create provider markers
      this.createProviderMarkers();

      // Adjust map boundaries to display all markers
      this.fitMapBounds();

    } catch (error) {
      console.error("Error loading provider data:", error);
    }
  },

  // Create provider markers
  createProviderMarkers() {
    if (!this.map) {
      console.warn("Map not available for creating markers");
      return;
    }

    // Clear existing markers
    if (this.markers) {
      this.markers.forEach(marker => marker.setMap(null));
    }

    this.markers = [];
    this.providersById = {};

    console.log(`Creating ${this.providers.length} markers`);

    // Boundary object
    const bounds = new google.maps.LatLngBounds();

    // If there's a user location, add to boundary
    if (this.userMarker) {
      bounds.extend(this.userMarker.getPosition());
    }

    // Create markers
    this.providers.forEach(provider => {
      try {
        // Create point location
        const position = {
          lat: provider.latitude,
          lng: provider.longitude
        };

        // Add to boundary
        bounds.extend(position);

        // Create marker
        const marker = new google.maps.Marker({
          position: position,
          map: this.map,
          title: provider.name
        });

        // Save reference
        this.markers.push(marker);
        this.providersById = this.providersById || {};
        this.providersById[provider.id] = { marker, provider };

        // Create info window content
        const infoContent = `
          <div style="padding: 10px; max-width: 250px; text-align: center;">
            <h3 style="margin: 0 0 8px; font-size: 16px; cursor: pointer; color: #4285F4;"
                onclick="document.dispatchEvent(new CustomEvent('select-provider', {detail: {id: '${provider.id}'}}))">
              ${provider.name}
            </h3>
            <img src="/images/provider_${provider.id}.jpg" 
                 style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px;"
                 onerror="this.src='/images/aged-care-default.jpg'" />
          </div>
        `;

        // Add click event
        marker.addListener("click", () => {
          if (this.infoWindow) {
            this.infoWindow.close();
          }

          this.infoWindow.setContent(infoContent);
          this.infoWindow.open(this.map, marker);
        });

      } catch (error) {
        console.error(`Error creating marker for provider ${provider.id}:`, error);
      }
    });

    // Adjust map view
    if (!bounds.isEmpty() && this.markers.length > 0) {
      this.map.fitBounds(bounds);
    }

    // Add custom event listeners
    document.addEventListener('select-provider', (e) => {
      this.selectProvider(e.detail.id);
    });
  },

  // Select provider
  selectProvider(id) {
    console.log("Provider selected:", id);

    // Close info window
    if (this.infoWindow) {
      this.infoWindow.close();
    }

    // Highlight marker
    if (this.providersById && this.providersById[id] && this.providersById[id].marker) {
      const marker = this.providersById[id].marker;

      // Add bounce animation
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => {
        marker.setAnimation(null);
      }, 1500);
    }

    // Trigger LiveView event
    try {
      this.pushEvent("select-provider", { id: id });
    } catch (error) {
      console.error("Error selecting provider:", error);
    }
  },

  updated() {
    console.log("MapHook updated");

    // Hide loading indicator
    this.hideLoadingIndicator();

    // Ensure container settings
    this.outerContainer = this.el;

    // If internal container not in DOM, re-add it
    if (!document.body.contains(this.innerContainer)) {
      console.log("Inner container lost, recreating");
      this.setupMapContainers();

      // If map already exists, reload
      if (this.map) {
        // Re-set map container
        const center = this.map.getCenter();
        const zoom = this.map.getZoom();

        // Use brief delay to ensure DOM update completed
        setTimeout(() => {
          // Re-create map
          this.map = new google.maps.Map(this.innerContainer, {
            center: center,
            zoom: zoom,
            mapTypeId: google.maps.MapTypeId.ROADMAP
          });

          // Re-load provider data
          this.loadProviderData();

          // If there's a user location, re-create user marker
          if (this.userLocation) {
            this.createUserMarker(this.userLocation);
          }
        }, 10);
      }
    } else if (this.map) {
      // Trigger map resize event
      google.maps.event.trigger(this.map, 'resize');

      // Re-load provider data
      this.loadProviderData();
    }
  },

  // Clean up resources
  destroyed() {
    console.log("MapHook destroyed");

    // Remove event listeners
    document.removeEventListener('select-provider', this.selectProvider);

    // Clean up markers
    if (this.markers) {
      this.markers.forEach(marker => marker.setMap(null));
      this.markers = [];
    }

    // Clean up user location marker
    if (this.userMarker) {
      this.userMarker.setMap(null);
      this.userMarker = null;
    }

    // Clean up info window
    if (this.infoWindow) {
      this.infoWindow.close();
    }
  },

  // Notification system variable
  _notification: null,
  _notificationTimeout: null,
  
  // Override simplified notification method to ensure only location-related notifications are displayed
  showNotification(message, force = false) {
    // First: check if this is one of our allowed location-related notifications
    const allowedMessages = [
      'Getting your location',  // Location retrieval in progress
      'Location retrieved',     // Location retrieved successfully
      'Using default location'  // Using default location
    ];
    
    // Check if this is an allowed location-related notification
    let isAllowedMessage = false;
    for (const key of allowedMessages) {
      if (message.includes(key)) {
        isAllowedMessage = true;
        break;
      }
    }
    
    // If not an explicitly allowed message and not forced, don't display
    if (!isAllowedMessage && !force) {
      console.log(`Notification filtered: ${message}`);
      return;
    }
    
    // Additional check: exclude any messages containing error terms, both in English and Chinese
    const errorTerms = [
      // English error terms
      'wrong', 'error', 'failed', 'hang on', 'something', 'went', 'not', 'hang in', 'hang', 'track', 'back', 
      // Chinese error terms (keeping these for backward compatibility)
      '错误', '失败', '不可用', '超时', '刷新页面', '不存在', '重新连接'
    ];
    
    for (const term of errorTerms) {
      if (message.toLowerCase().includes(term.toLowerCase())) {
        console.log(`Notification with error term filtered: ${message} (contains: ${term})`);
        return;
      }
    }
    
    // Simplify message content
    let displayMessage = message;
    if (message.includes('Location retrieved')) {
      displayMessage = '✅ Location retrieved';
    } else if (message.includes('Getting your location')) {
      displayMessage = '⏳ Getting your location...';
    } else if (message.includes('Using default location')) {
      displayMessage = '📍 Using default location';
    }
    
    console.log(`Displaying notification: ${displayMessage}`);
    
    // Cancel any existing notifications
    this._clearNotification();
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'map-notification';
    
    // Set style - clean and modern style
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(20, 20, 20, 0.9);
      color: white;
      padding: 10px 18px;
      border-radius: 24px;
      font-size: 15px;
      font-weight: 500;
      z-index: 10000;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    
    // Set content
    notification.textContent = displayMessage;
    document.body.appendChild(notification);
    
    // Save reference
    this._notification = notification;
    
    // Auto-hide
    this._notificationTimeout = setTimeout(() => {
      this._clearNotification();
    }, 2500);
  },
  
  // Clear notification
  _clearNotification() {
    if (this._notificationTimeout) {
      clearTimeout(this._notificationTimeout);
      this._notificationTimeout = null;
    }
    
    if (this._notification && this._notification.parentNode) {
      this._notification.remove();
      this._notification = null;
    }
  },

  // Display help guide for location permission denied
  showPermissionDeniedHelp() {
    // Remove any existing notification
    const existingNotification = document.getElementById("map-notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    // Create detailed help prompt
    const helpBox = document.createElement("div");
    helpBox.id = "permission-help-box";
    helpBox.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      z-index: 10000;
      max-width: 90%;
      width: 350px;
      text-align: center;
    `;

    let browserName = "Your browser";
    if (navigator.userAgent.indexOf("Chrome") !== -1) {
      browserName = "Chrome";
    } else if (navigator.userAgent.indexOf("Safari") !== -1) {
      browserName = "Safari";
    } else if (navigator.userAgent.indexOf("Firefox") !== -1) {
      browserName = "Firefox";
    } else if (navigator.userAgent.indexOf("Edge") !== -1) {
      browserName = "Edge";
    }

    helpBox.innerHTML = `
      <h3 style="margin: 0 0 15px; color: #3b82f6; font-size: 18px;">Need location permission</h3>
      <p style="margin: 0 0 15px; line-height: 1.5; color: #4b5563;">We need access to your location information to find nearby aged care providers.</p>
      <div style="margin-bottom: 15px; text-align: left; background: #f9fafb; padding: 12px; border-radius: 8px;">
        <p style="margin: 0 0 8px; font-weight: 500; color: #374151;">How to enable location permission in ${browserName}:</p>
        <ol style="margin: 0; padding-left: 20px; color: #6b7280;">
          <li style="margin-bottom: 5px;">Click the lock/info icon on the left side of the address bar</li>
          <li style="margin-bottom: 5px;">Find the "Location" option in the pop-up menu</li>
          <li style="margin-bottom: 5px;">Change the setting to "Allow"</li>
          <li>Refresh the page and click "Use my location" again</li>
        </ol>
      </div>
      <button id="close-permission-help" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: 500;">I understand</button>
    `;

    document.body.appendChild(helpBox);

    // Add close button event
    document.getElementById("close-permission-help").addEventListener("click", () => {
      helpBox.remove();
    });
  }
};

export default MapHook;