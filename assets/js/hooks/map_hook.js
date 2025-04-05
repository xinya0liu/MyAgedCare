// map_hook.js - 完整版，包含自动请求地理位置功能
const MapHook = {
  mounted() {
    console.log("MapHook mounted");

    // 1. 创建一个内部容器，LiveView不会直接更新它
    this.setupMapContainers();

    // 2. 获取代理URL
    const apiProxyUrl = this.el.getAttribute('data-api-proxy-url');
    if (!apiProxyUrl) {
      console.error("No Google Maps API proxy URL found");
      this.hideLoadingIndicator();
      return;
    }

    // 3. 加载Google Maps API并初始化地图
    this.loadGoogleMapsAPI(apiProxyUrl);
  },

  // 创建稳定的内部地图容器
  setupMapContainers() {
    console.log("Setting up map containers");

    // 隐藏加载指示器
    this.hideLoadingIndicator();

    // 保留对外部容器的引用
    this.outerContainer = this.el;

    // 设置外部容器样式
    this.outerContainer.style.position = "relative";
    this.outerContainer.style.height = "400px";
    this.outerContainer.style.width = "100%";

    // 如果已经有内部容器，不重新创建
    if (this.outerContainer.querySelector("#inner-map-container")) {
      console.log("Inner map container already exists");
      this.innerContainer = this.outerContainer.querySelector("#inner-map-container");
      return;
    }

    // 创建内部容器作为稳定地图挂载点
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

    // 添加到外部容器
    this.outerContainer.appendChild(this.innerContainer);

    console.log("Inner map container created");
  },

  // 隐藏加载指示器
  hideLoadingIndicator() {
    const loadingIndicator = document.getElementById("map-loading-indicator");
    if (loadingIndicator) {
      loadingIndicator.style.display = "none";
    }
  },

  // 加载Google Maps API
  loadGoogleMapsAPI(apiProxyUrl) {
    console.log("Starting Google Maps API load process");

    // 添加检查和清理函数
    const checkMapsAPI = () => {
      return window.google &&
        window.google.maps &&
        window.google.maps.Map &&
        window.google.maps.geometry &&
        window.google.maps.geometry.spherical;
    };

    // 如果已完全加载
    if (checkMapsAPI()) {
      console.log("Google Maps API already fully loaded, initializing map");
      this.initMap();
      return;
    }

    // 如果正在加载中
    if (window.googleMapsApiLoading) {
      console.log("Google Maps API already loading, waiting for completion");

      // 设置超时防止无限等待
      let checkCount = 0;
      const maxChecks = 50; // 5秒超时

      const checkInterval = setInterval(() => {
        checkCount++;

        if (checkMapsAPI()) {
          clearInterval(checkInterval);
          console.log("Google Maps API load completed during wait");
          this.initMap();
        } else if (checkCount >= maxChecks) {
          // 超时，尝试重新加载
          clearInterval(checkInterval);
          console.warn("Timeout waiting for Google Maps API, attempting reload");
          window.googleMapsApiLoading = false;
          this.loadGoogleMapsAPI(apiProxyUrl); // 递归重试
        }
      }, 100);
      return;
    }

    // 标记为加载中
    window.googleMapsApiLoading = true;

    // 不显示加载提示，避免可能的错误通知

    // 创建唯一的全局回调名称
    const callbackName = "initMapCallback_" + Math.floor(Math.random() * 10000000);

    // 设置回调函数
    window[callbackName] = () => {
      console.log("Google Maps API callback executed");

      // 验证加载的组件
      if (checkMapsAPI()) {
        console.log("Google Maps API fully loaded with geometry library");
        window.googleMapsApiLoaded = true;
        window.googleMapsApiLoading = false;
        this.initMap();
      } else {
        console.error("Google Maps API loaded but geometry library is missing");
        // 不显示错误通知
        window.googleMapsApiLoading = false;
      }
    };

    // 设置错误处理
    const handleScriptError = () => {
      console.error("Failed to load Google Maps API script");
      window.googleMapsApiLoading = false;
      // 不显示错误通知
      script.removeEventListener('error', handleScriptError);
    };

    // 创建脚本元素
    const script = document.createElement("script");
    script.src = `${apiProxyUrl}/maps/api/js?libraries=geometry,places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.addEventListener('error', handleScriptError);

    // 添加到文档
    document.head.appendChild(script);

    console.log(`Google Maps API loading through proxy: ${apiProxyUrl}`);

    // 设置超时保护
    setTimeout(() => {
      if (!checkMapsAPI() && window.googleMapsApiLoading) {
        console.error("Google Maps API load timeout after 15 seconds");
        window.googleMapsApiLoading = false;
        // 不显示错误通知
      }
    }, 15000);
  },

  // 初始化地图
  initMap() {
    console.log("Initializing map on inner container");

    // 确保容器存在且可见
    if (!this.innerContainer || !document.body.contains(this.innerContainer)) {
      console.error("Map container is not in the DOM");
      this.showNotification("地图容器不存在，请刷新页面重试", true);
      // 尝试重新创建容器
      this.setupMapContainers();
      if (!this.innerContainer || !document.body.contains(this.innerContainer)) {
        return; // 如果仍然失败，退出初始化
      }
    }

    try {
      // 隐藏加载指示器
      this.hideLoadingIndicator();

      // 默认位置 - Brisbane
      const defaultLocation = { lat: -27.4698, lng: 153.0251 };

      // 检查Google Maps是否可用
      if (!window.google || !window.google.maps || !window.google.maps.Map) {
        throw new Error("Google Maps API not available");
      }

      // 定义地图选项
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
        gestureHandling: 'greedy' // 即使在移动设备上也允许单指缩放
      };

      // 创建地图
      this.map = new google.maps.Map(this.innerContainer, mapOptions);

      if (!this.map) {
        throw new Error("Failed to create map object");
      }

      console.log("Map object created successfully");

      // 创建信息窗口
      this.infoWindow = new google.maps.InfoWindow({
        maxWidth: 300,
        pixelOffset: new google.maps.Size(0, -30)
      });

      // 注册错误处理器
      google.maps.event.addListener(this.map, 'error', (e) => {
        console.error("Map error event:", e);
      });

      // 不显示初始化通知

      // 一旦地图加载完成，加载提供商数据并自动请求位置
      google.maps.event.addListenerOnce(this.map, 'idle', () => {
        console.log("Map fully loaded and idle");

        // 先加载提供商数据
        try {
          this.loadProviderData();
        } catch (error) {
          console.error("Error loading provider data:", error);
        }

        // 然后自动请求用户位置
        setTimeout(() => {
          // 使用try/catch包裹位置请求
          try {
            this.requestUserLocation();
          } catch (error) {
            console.error("Error requesting user location:", error);
            // 不显示错误通知，直接使用默认位置

            // 使用默认位置
            const defaultLocation = { lat: -27.4698, lng: 153.0251 };
            this.createUserMarker(defaultLocation);
            this.updateLocationToServer(defaultLocation);
          }
        }, 1000); // 增加延迟确保地图完全加载

        // 保留按钮点击事件，用于用户手动触发
        const locationBtn = document.getElementById("get-location-btn");
        if (locationBtn) {
          // 移除任何现有的事件监听器，避免重复绑定
          locationBtn.replaceWith(locationBtn.cloneNode(true));

          // 重新获取按钮引用并添加事件
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

      // 添加额外事件监听器，以防 'idle' 事件不触发
      setTimeout(() => {
        if (!this.providers || this.providers.length === 0) {
          console.warn("Map idle event might not have fired, forcing provider data load");
          this.loadProviderData();
        }
      }, 3000);

    } catch (error) {
      console.error("Error initializing map:", error);

      // 尝试恢复
      setTimeout(() => {
        if (window.google && window.google.maps) {
          console.log("Attempting to recover map initialization");
          this.setupMapContainers();
          this.initMap();
        }
      }, 2000);
    }
  },

  // 请求用户位置
  requestUserLocation() {
    console.log("Requesting user location");

    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      this.showNotification("Your browser does not support location services", true);
      return;
    }

    // 显示加载状态
    this.showNotification("Getting your location...");

    // 直接使用 try/catch 包裹位置请求
    try {
      navigator.geolocation.getCurrentPosition(
        // 成功回调
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

            // 更新地图
            this.map.setCenter(userLocation);

            // 创建用户位置标记
            this.createUserMarker(userLocation);

            // 位置获取成功，但这里不再显示通知
            // 延迟一点再更新服务器，避免过快请求导致问题
            setTimeout(() => {
              this.updateLocationToServer(userLocation);
            }, 500);
          } catch (err) {
            console.error("Error processing position:", err);
            this.handleLocationError({ code: 999, message: "处理位置数据时出错: " + err.message });
          }
        },
        // 错误回调
        (error) => {
          console.error("Geolocation error:", error.code, error.message);
          this.handleLocationError(error);
        },
        // 位置选项
        {
          enableHighAccuracy: true,  // 尝试获取更精确的位置
          timeout: 10000,            // 增加超时时间
          maximumAge: 60000          // 允许缓存 1 分钟
        }
      );
    } catch (error) {
      console.error("Exception during geolocation request:", error);
      this.handleLocationError({ code: 999, message: "请求位置时发生异常: " + error.message });
    }
  },

  // 处理位置错误
  handleLocationError(error) {
    console.error("Handling location error:", error);

    // Simplified message handling - all errors show a single notification
    this.showNotification("Using default location", true);

    // Use default location (Brisbane)
    const defaultLocation = { lat: -27.4698, lng: 153.0251 };

    // 仍然保留地图居中在默认位置
    this.map.setCenter(defaultLocation);

    // 使用默认位置创建用户标记
    this.createUserMarker(defaultLocation);

    // 使用默认位置计算距离
    setTimeout(() => {
      this.updateLocationToServer(defaultLocation);
    }, 500);
  },

  // 创建用户位置标记
  createUserMarker(location) {
    // 如果已有标记，先移除
    if (this.userMarker) {
      this.userMarker.setMap(null);
    }

    // 创建标记
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

  // 更新位置到服务器 - 改进版
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

      // 计算到每个提供商的距离
      const providerDistances = {};
      const userLatLng = new google.maps.LatLng(location.lat, location.lng);

      // 有效提供商计数
      let validProviderCount = 0;

      // 计算距离和存储
      this.providers.forEach(provider => {
        try {
          // 校验提供商数据
          if (!provider || !provider.id ||
            typeof provider.latitude !== 'number' ||
            typeof provider.longitude !== 'number' ||
            isNaN(provider.latitude) || isNaN(provider.longitude)) {
            console.warn(`Invalid provider data:`, provider);
            return;  // 跳过此提供商
          }

          // 使用 Google Maps 的距离计算函数
          const providerLatLng = new google.maps.LatLng(provider.latitude, provider.longitude);
          const distance = google.maps.geometry.spherical.computeDistanceBetween(userLatLng, providerLatLng);

          if (typeof distance !== 'number' || isNaN(distance)) {
            console.warn(`Invalid distance calculated for provider ${provider.id}:`, distance);
            return;
          }

          // 存储距离数据 (转换为整数米)
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
        this.showNotification("无法计算到提供商的距离", true);
        return;
      }

      console.log(`Successfully calculated distances for ${validProviderCount} providers`);

      // 准备发送到服务器的数据
      const payload = {
        latitude: location.lat.toString(),
        longitude: location.lng.toString(),
        provider_distances: providerDistances
      };

      // 发送到服务器
      this.pushEvent("update-location", payload);

      // 显示成功通知 - 这是主要通知点
      this.showNotification("Got your location，display nearby aged care providers", true);

    } catch (error) {
      console.error("Error updating location to server:", error);
    }
  },

  // 加载提供商数据
  loadProviderData() {
    console.log("Loading provider data");

    try {
      // 获取并解析提供商数据
      const providersData = this.el.getAttribute('data-providers');
      if (!providersData) {
        console.log("No provider data found");
        return;
      }

      // 解析提供商数据
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

      // 创建提供商标记
      this.createProviderMarkers();

      // 调整地图边界以显示所有标记
      this.fitMapBounds();

    } catch (error) {
      console.error("Error loading provider data:", error);
    }
  },

  // 创建提供商标记
  createProviderMarkers() {
    if (!this.map) {
      console.warn("Map not available for creating markers");
      return;
    }

    // 清除现有标记
    if (this.markers) {
      this.markers.forEach(marker => marker.setMap(null));
    }

    this.markers = [];
    this.providersById = {};

    console.log(`Creating ${this.providers.length} markers`);

    // 边界对象
    const bounds = new google.maps.LatLngBounds();

    // 如果有用户位置，添加到边界
    if (this.userMarker) {
      bounds.extend(this.userMarker.getPosition());
    }

    // 创建标记
    this.providers.forEach(provider => {
      try {
        // 创建点位置
        const position = {
          lat: provider.latitude,
          lng: provider.longitude
        };

        // 添加到边界
        bounds.extend(position);

        // 创建标记
        const marker = new google.maps.Marker({
          position: position,
          map: this.map,
          title: provider.name
        });

        // 保存引用
        this.markers.push(marker);
        this.providersById = this.providersById || {};
        this.providersById[provider.id] = { marker, provider };

        // 创建信息窗口内容
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

        // 添加点击事件
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

    // 调整地图视图
    if (!bounds.isEmpty() && this.markers.length > 0) {
      this.map.fitBounds(bounds);
    }

    // 添加自定义事件监听器
    document.addEventListener('select-provider', (e) => {
      this.selectProvider(e.detail.id);
    });
  },

  // 选择提供商
  selectProvider(id) {
    console.log("Provider selected:", id);

    // 关闭信息窗口
    if (this.infoWindow) {
      this.infoWindow.close();
    }

    // 高亮标记
    if (this.providersById && this.providersById[id] && this.providersById[id].marker) {
      const marker = this.providersById[id].marker;

      // 添加弹跳动画
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => {
        marker.setAnimation(null);
      }, 1500);
    }

    // 触发LiveView事件
    try {
      this.pushEvent("select-provider", { id: id });
    } catch (error) {
      console.error("Error selecting provider:", error);
    }
  },

  updated() {
    console.log("MapHook updated");

    // 隐藏加载指示器
    this.hideLoadingIndicator();

    // 确保容器设置
    this.outerContainer = this.el;

    // 如果内部容器不在DOM中，重新添加它
    if (!document.body.contains(this.innerContainer)) {
      console.log("Inner container lost, recreating");
      this.setupMapContainers();

      // 如果地图已存在，重新加载
      if (this.map) {
        // 重新设置地图容器
        const center = this.map.getCenter();
        const zoom = this.map.getZoom();

        // 使用短暂延迟确保DOM更新完成
        setTimeout(() => {
          // 重新创建地图
          this.map = new google.maps.Map(this.innerContainer, {
            center: center,
            zoom: zoom,
            mapTypeId: google.maps.MapTypeId.ROADMAP
          });

          // 重新加载提供商数据
          this.loadProviderData();

          // 如果有用户位置，重新创建用户标记
          if (this.userLocation) {
            this.createUserMarker(this.userLocation);
          }
        }, 10);
      }
    } else if (this.map) {
      // 触发地图resize事件
      google.maps.event.trigger(this.map, 'resize');

      // 重新加载提供商数据
      this.loadProviderData();
    }
  },

  // 清理资源
  destroyed() {
    console.log("MapHook destroyed");

    // 移除事件监听器
    document.removeEventListener('select-provider', this.selectProvider);

    // 清理标记
    if (this.markers) {
      this.markers.forEach(marker => marker.setMap(null));
      this.markers = [];
    }

    // 清理用户位置标记
    if (this.userMarker) {
      this.userMarker.setMap(null);
      this.userMarker = null;
    }

    // 清理信息窗口
    if (this.infoWindow) {
      this.infoWindow.close();
    }
  },

  // 通知系统变量
  _notification: null,
  _notificationTimeout: null,
  
  // 重写简化的通知方法，确保只显示位置相关通知
  showNotification(message, force = false) {
    // First: check if this is one of our allowed location-related notifications
    const allowedMessages = [
      'Getting your location',  // Location retrieval in progress
      'Location retrieved',     // Location retrieved successfully
      'Using default location'  // Using default location
    ];
    
    // 检查是否为允许的位置相关通知
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
    
    // 简化消息内容
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
  
  // 清除通知
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

  // 显示位置权限被拒绝的帮助指南
  showPermissionDeniedHelp() {
    // 移除任何现有通知
    const existingNotification = document.getElementById("map-notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    // 创建详细的帮助提示
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

    let browserName = "您的浏览器";
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
      <h3 style="margin: 0 0 15px; color: #3b82f6; font-size: 18px;">需要位置权限</h3>
      <p style="margin: 0 0 15px; line-height: 1.5; color: #4b5563;">我们需要访问您的位置信息来查找附近的aged care providers。</p>
      <div style="margin-bottom: 15px; text-align: left; background: #f9fafb; padding: 12px; border-radius: 8px;">
        <p style="margin: 0 0 8px; font-weight: 500; color: #374151;">如何在${browserName}中开启位置权限：</p>
        <ol style="margin: 0; padding-left: 20px; color: #6b7280;">
          <li style="margin-bottom: 5px;">点击地址栏左侧的锁定/信息图标</li>
          <li style="margin-bottom: 5px;">在弹出菜单中找到"位置"选项</li>
          <li style="margin-bottom: 5px;">将设置更改为"允许"</li>
          <li>刷新页面并再次点击"使用我的位置"</li>
        </ol>
      </div>
      <button id="close-permission-help" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: 500;">我知道了</button>
    `;

    document.body.appendChild(helpBox);

    // 添加关闭按钮事件
    document.getElementById("close-permission-help").addEventListener("click", () => {
      helpBox.remove();
    });
  }
};

export default MapHook;