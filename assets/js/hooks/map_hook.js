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
    // 如果已加载
    if (window.google && window.google.maps) {
      this.initMap();
      return;
    }
    
    // 如果正在加载中
    if (window.googleMapsApiLoading) {
      // 等待加载完成
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          this.initMap();
        }
      }, 100);
      return;
    }
    
    // 标记为加载中
    window.googleMapsApiLoading = true;
    
    // 创建全局回调
    const callbackName = "initMap_" + Math.random().toString(36).substring(2, 9);
    window[callbackName] = () => {
      window.googleMapsApiLoaded = true;
      window.googleMapsApiLoading = false;
      this.initMap();
    };
    
    // 加载API
    const script = document.createElement("script");
    script.src = `${apiProxyUrl}/maps/api/js?libraries=geometry&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    
    console.log("Google Maps API loading through proxy...");
  },
  
  // 初始化地图
  initMap() {
    console.log("Initializing map on inner container");
    
    try {
      // 默认位置
      const defaultLocation = { lat: -27.4698, lng: 153.0251 }; // Brisbane
      
      // 创建地图
      this.map = new google.maps.Map(this.innerContainer, {
        center: defaultLocation,
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      });
      
      // 创建信息窗口
      this.infoWindow = new google.maps.InfoWindow();
      
      // 一旦地图加载完成，加载提供商数据
      google.maps.event.addListenerOnce(this.map, 'idle', () => {
        console.log("Map fully loaded");
        this.loadProviderData();
        
        // 添加此代码以请求用户位置
        setTimeout(() => {
          this.requestUserLocation();
        }, 1000);
      });
      
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  },
  
  // 请求用户位置
  requestUserLocation() {
    console.log("Requesting user location");
    
    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      // 成功回调
      (position) => {
        console.log("Got user location");
        
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // 更新地图
        this.map.setCenter(userLocation);
        
        // 创建用户位置标记
        this.createUserMarker(userLocation);
        
        // 通知服务器更新位置
        this.updateLocationToServer(userLocation);
      },
      // 错误回调
      (error) => {
        console.log("Geolocation error:", error.code);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 0
      }
    );
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
      title: "您的位置",
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
  
  // 更新位置到服务器
  updateLocationToServer(location) {
    console.log("Updating location to server");
    
    try {
      // 计算到每个提供商的距离
      const providerDistances = {};
      if (this.providersById) {
        Object.entries(this.providersById).forEach(([id, data]) => {
          const providerLocation = data.marker.getPosition();
          const distance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(location.lat, location.lng),
            providerLocation
          );
          providerDistances[id] = distance;
        });
      }
      
      this.pushEvent("update-location", {
        latitude: location.lat.toString(),
        longitude: location.lng.toString(),
        provider_distances: providerDistances
      });
    } catch (error) {
      console.error("Error pushing event:", error);
    }
  },
  
  // 加载提供商数据
  loadProviderData() {
    try {
      if (!this.outerContainer || !this.outerContainer.dataset.providers) {
        console.warn("No provider data found");
        return;
      }
      
      const providersData = JSON.parse(this.outerContainer.dataset.providers);
      
      if (!providersData || !providersData.length) {
        console.log("Empty provider data");
        return;
      }
      
      console.log(`Loading ${providersData.length} providers`);
      
      // 处理数据
      const providers = providersData.map(item => {
        const parts = item.split('|');
        if (parts.length >= 4) {
          return {
            id: parts[0],
            latitude: parseFloat(parts[1]),
            longitude: parseFloat(parts[2]),
            name: parts[3]
          };
        }
        return null;
      }).filter(p => p !== null);
      
      // 创建标记
      this.createProviderMarkers(providers);
      
    } catch (error) {
      console.error("Error loading provider data:", error);
    }
  },
  
  // 创建提供商标记
  createProviderMarkers(providers) {
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
    
    console.log(`Creating ${providers.length} markers`);
    
    // 边界对象
    const bounds = new google.maps.LatLngBounds();
    
    // 如果有用户位置，添加到边界
    if (this.userMarker) {
      bounds.extend(this.userMarker.getPosition());
    }
    
    // 创建标记
    providers.forEach(provider => {
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
  }
};

export default MapHook;