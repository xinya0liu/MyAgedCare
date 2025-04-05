// hooks/map_hook.js

const MapHook = {
  mounted() {
    console.log("MapHook mounted");
    this.markers = [];
    this.mapInitialized = false;
    
    // 默认位置（布里斯班）
    this.defaultLocation = { lat: -27.4698, lng: 153.0251 };
    
    // 立即准备地图容器
    this._prepareMapContainer();
    
    // 简化：直接加载地图，不使用复杂的异步流程
    this._directLoadMap();
  },
  
  updated() {
    console.log("MapHook updated");
    
    // 如果地图已初始化并且有新的提供商数据，更新标记
    if (this.mapInitialized && this.el.dataset.providers) {
      try {
        const providers = JSON.parse(this.el.dataset.providers);
        this._updateProviderMarkers(providers);
      } catch (e) {
        console.error("Error parsing providers data:", e);
      }
    }
  },
  
  destroyed() {
    console.log("MapHook destroyed");
    
    // 清理资源
    if (this.map && window.google && window.google.maps) {
      // 清理标记
      if (this.markers) {
        this.markers.forEach(marker => marker.setMap(null));
      }
      
      // 清理用户标记
      if (this.userMarker) {
        this.userMarker.setMap(null);
      }
      
      // 清理打开的信息窗口
      if (this.openInfoWindow) {
        this.openInfoWindow.close();
      }
    }
  },
  
  // 准备地图容器 - 确保地图区域可见
  _prepareMapContainer() {
    console.log("Preparing map container");
    
    // 设置样式，确保容器始终可见
    this.el.style.height = "500px";
    this.el.style.width = "100%";
    this.el.style.position = "relative";
    this.el.style.backgroundColor = "#f0f0f0";
    this.el.style.border = "1px solid #ddd";
    this.el.style.borderRadius = "4px";
    
    // 创建加载和错误层
    this._createLoadingLayer();
    this._createErrorLayer();
    
    // 创建通知层
    this._createNotificationLayer();
  },
  
  // 创建加载层
  _createLoadingLayer() {
    const loadingLayer = document.createElement("div");
    loadingLayer.id = "map-loading-layer";
    loadingLayer.style.position = "absolute";
    loadingLayer.style.top = "0";
    loadingLayer.style.left = "0";
    loadingLayer.style.width = "100%";
    loadingLayer.style.height = "100%";
    loadingLayer.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
    loadingLayer.style.display = "flex";
    loadingLayer.style.justifyContent = "center";
    loadingLayer.style.alignItems = "center";
    loadingLayer.style.zIndex = "10";
    
    loadingLayer.innerHTML = `
      <div style="text-align: center;">
        <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; margin: 0 auto 10px; animation: spin 2s linear infinite;"></div>
        <p style="margin: 0; color: #333; font-weight: bold;">加载地图中...</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    
    this.el.appendChild(loadingLayer);
  },
  
  // 创建错误层
  _createErrorLayer() {
    const errorLayer = document.createElement("div");
    errorLayer.id = "map-error-layer";
    errorLayer.style.position = "absolute";
    errorLayer.style.top = "0";
    errorLayer.style.left = "0";
    errorLayer.style.width = "100%";
    errorLayer.style.height = "100%";
    errorLayer.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
    errorLayer.style.display = "none";
    errorLayer.style.justifyContent = "center";
    errorLayer.style.alignItems = "center";
    errorLayer.style.zIndex = "20";
    
    this.el.appendChild(errorLayer);
  },
  
  // 创建通知层
  _createNotificationLayer() {
    const notificationLayer = document.createElement("div");
    notificationLayer.id = "map-notification-layer";
    notificationLayer.style.position = "absolute";
    notificationLayer.style.top = "10px";
    notificationLayer.style.left = "50%";
    notificationLayer.style.transform = "translateX(-50%)";
    notificationLayer.style.padding = "8px 16px";
    notificationLayer.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    notificationLayer.style.color = "white";
    notificationLayer.style.borderRadius = "4px";
    notificationLayer.style.display = "none";
    notificationLayer.style.zIndex = "30";
    
    this.el.appendChild(notificationLayer);
  },
  
  // 直接加载地图 - 简化版
  _directLoadMap() {
    console.log("Directly loading map");
    
    // 使用后端代理，不需要获取API密钥
    // const apiKey = this.el.dataset.apiKey;
    // console.log("API Key available:", !!apiKey);
    
    // 如果Google Maps已加载，直接创建地图
    if (window.google && window.google.maps) {
      console.log("Google Maps already loaded");
      this._createMap();
      return;
    }
    
    // 加载Google Maps API (通过代理)
    const script = document.createElement("script");
    // 使用我们的代理路径，而不是直接访问Google
    script.src = `/api/google/maps/maps/api/js?libraries=places`;
    script.async = true;
    
    script.onload = () => {
      console.log("Google Maps API loaded");
      this._createMap();
    };
    
    script.onerror = (error) => {
      console.error("Error loading Google Maps API:", error);
      this._showError("无法加载Google地图API。请检查您的网络连接并刷新页面。");
    };
    
    document.head.appendChild(script);
    
    // 设置超时
    setTimeout(() => {
      if (!this.mapInitialized) {
        console.log("Map initialization timeout");
        this._showError("地图加载超时。请刷新页面重试。");
      }
    }, 10000);
  },
  
  // 创建地图
  _createMap() {
    try {
      console.log("Creating map");
      
      // 确保只初始化一次
      if (this.mapInitialized) {
        console.log("Map already initialized");
        return;
      }
      
      // 检查Google Maps是否可用
      if (!window.google || !window.google.maps) {
        throw new Error("Google Maps API not available");
      }
      
      // 创建地图实例
      this.map = new google.maps.Map(this.el, {
        center: this.defaultLocation,
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        fullscreenControl: true,
        zoomControl: true
      });
      
      // 地图加载完成事件
      google.maps.event.addListenerOnce(this.map, 'idle', () => {
        console.log("Map is idle and ready");
        
        // 隐藏加载层
        this._hideLoading();
        
        // 创建用户位置标记
        this._createUserLocationMarker(this.defaultLocation);
        
        // 加载提供商数据
        this._loadProviderData();
        
        // 请求用户位置
        this._requestUserLocation();
      });
      
      // 标记地图已初始化
      this.mapInitialized = true;
      
    } catch (error) {
      console.error("Error creating map:", error);
      this._showError(`创建地图时出错: ${error.message}`);
    }
  },
  
  // 加载提供商数据
  _loadProviderData() {
    try {
      if (this.el.dataset.providers) {
        const providers = JSON.parse(this.el.dataset.providers);
        if (providers && providers.length > 0) {
          console.log(`Loading ${providers.length} providers`);
          this._updateProviderMarkers(providers);
        }
      }
    } catch (error) {
      console.error("Error loading provider data:", error);
      this._showNotification("加载提供商数据时出错");
    }
  },
  
  // 创建用户位置标记
  _createUserLocationMarker(location) {
    if (!this.mapInitialized || !this.map) return;
    
    console.log("Creating user location marker");
    
    try {
      // 如果已存在，更新位置
      if (this.userMarker) {
        this.userMarker.setPosition(location);
        return;
      }
      
      // 创建新标记
      this.userMarker = new google.maps.Marker({
        position: location,
        map: this.map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
          scale: 8
        },
        title: "您的位置"
      });
    } catch (error) {
      console.error("Error creating user marker:", error);
    }
  },
  
  // 请求用户位置
  _requestUserLocation() {
    if (!this.mapInitialized || !navigator.geolocation) {
      console.log("Geolocation not available");
      this._showNotification("您的浏览器不支持位置服务，使用默认位置");
      return;
    }
    
    console.log("Requesting user location");
    this._showNotification("正在获取您的位置...");
    
    navigator.geolocation.getCurrentPosition(
      // 成功回调
      (position) => {
        console.log("Got user location");
        
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // 更新地图
        this.map.panTo(userLocation);
        this._createUserLocationMarker(userLocation);
        
        // 获取附近提供商
        this._fetchProviders(userLocation);
        
        this._showNotification("已更新到您的当前位置");
      },
      // 错误回调
      (error) => {
        console.error("Geolocation error:", error);
        
        let message = "无法获取您的位置，使用默认位置";
        if (error.code === 1) {
          message = "位置访问被拒绝，使用默认位置";
        }
        
        this._showNotification(message);
        this._fetchProviders(this.defaultLocation);
      },
      // 选项
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  },
  
  // 获取提供商
  _fetchProviders(location) {
    console.log("Fetching providers for location:", location);
    
    try {
      this.pushEvent("update-location", {
        latitude: location.lat.toString(),
        longitude: location.lng.toString()
      });
    } catch (error) {
      console.error("Error fetching providers:", error);
      this._showNotification("获取提供商数据失败");
    }
  },
  
  // 更新提供商标记
  _updateProviderMarkers(providers) {
    if (!this.mapInitialized || !this.map) {
      console.log("Map not initialized yet");
      return;
    }
    
    console.log("Updating provider markers");
    
    // 清除现有标记
    if (this.markers) {
      this.markers.forEach(marker => marker.setMap(null));
    }
    this.markers = [];
    
    // 如果没有提供商
    if (!providers || providers.length === 0) {
      this._showNotification("此区域没有找到提供商");
      return;
    }
    
    // 创建边界对象
    const bounds = new google.maps.LatLngBounds();
    
    // 添加用户位置到边界
    if (this.userMarker) {
      bounds.extend(this.userMarker.getPosition());
    }
    
    // 为每个提供商创建标记
    providers.forEach(provider => {
      try {
        // 获取位置数据
        const lat = parseFloat(provider.latitude);
        const lng = parseFloat(provider.longitude);
        const position = { lat, lng };
        
        // 添加到边界
        bounds.extend(position);
        
        // 创建标记
        const marker = new google.maps.Marker({
          position: position,
          map: this.map,
          title: provider.name,
          animation: google.maps.Animation.DROP
        });
        
        // 创建信息窗口
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="info-window">
              <h3>${provider.name}</h3>
              <p>${provider.address || ""}</p>
              <button class="btn btn-sm btn-primary" onclick="window.currentMapHook.selectProvider('${provider.id}')">
                查看详情
              </button>
            </div>
          `
        });
        
        // 添加点击事件
        marker.addListener("click", () => {
          // 关闭已打开的信息窗口
          if (this.openInfoWindow) {
            this.openInfoWindow.close();
          }
          
          // 打开新窗口
          infoWindow.open(this.map, marker);
          this.openInfoWindow = infoWindow;
        });
        
        // 保存标记
        this.markers.push(marker);
        
      } catch (error) {
        console.error("Error creating marker:", error);
      }
    });
    
    // 调整地图以显示所有标记
    if (!bounds.isEmpty() && this.markers.length > 0) {
      this.map.fitBounds(bounds);
      
      // 避免过度缩放
      google.maps.event.addListenerOnce(this.map, 'idle', () => {
        if (this.map.getZoom() > 15) {
          this.map.setZoom(15);
        }
      });
    }
    
    console.log(`Created ${this.markers.length} markers`);
  },
  
  // 选择提供商
  selectProvider(id) {
    console.log("Selected provider:", id);
    
    try {
      this.pushEvent("select-provider", { id: id });
    } catch (error) {
      console.error("Error selecting provider:", error);
      this._showNotification("选择提供商时出错");
    }
  },
  
  // 隐藏加载层
  _hideLoading() {
    const loadingLayer = document.getElementById("map-loading-layer");
    if (loadingLayer) {
      loadingLayer.style.display = "none";
    }
  },
  
  // 显示错误
  _showError(message) {
    console.error("Map error:", message);
    
    // 隐藏加载层
    this._hideLoading();
    
    // 显示错误层
    const errorLayer = document.getElementById("map-error-layer");
    if (errorLayer) {
      errorLayer.style.display = "flex";
      errorLayer.innerHTML = `
        <div style="text-align: center; max-width: 80%;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3 style="color: #e74c3c; margin: 10px 0;">地图加载错误</h3>
          <p style="margin-bottom: 20px;">${message}</p>
          <button onclick="window.location.reload()" style="background-color: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
            刷新页面
          </button>
        </div>
      `;
    }
  },
  
  // 显示通知
  _showNotification(message) {
    const notification = document.getElementById("map-notification-layer");
    if (notification) {
      notification.textContent = message;
      notification.style.display = "block";
      
      // 5秒后隐藏
      setTimeout(() => {
        notification.style.display = "none";
      }, 5000);
    }
  }
};

// 全局引用，用于标记点击事件
window.currentMapHook = MapHook;

// 导出 Hook
export default MapHook;
