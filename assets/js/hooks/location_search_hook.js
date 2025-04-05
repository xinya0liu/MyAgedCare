// location_search_hook.js - 地址搜索钩子
const LocationSearchHook = {
  mounted() {
    // 获取DOM元素
    this.input = document.getElementById("location-input");
    this.searchBtn = this.el.querySelector('[data-action="search"]');
    this.locationBtn = this.el.querySelector('[data-action="current-location"]');
    
    // 确保有输入框
    if (!this.input) return;
    
    // 绑定事件处理
    if (this.searchBtn) {
      this.searchBtn.addEventListener("click", () => this.searchLocation());
    }
    
    if (this.locationBtn) {
      this.locationBtn.addEventListener("click", () => this.getCurrentLocation());
    }
    
    this.input.addEventListener("keypress", e => {
      if (e.key === "Enter") this.searchLocation();
    });
    
    // 初始化地址自动完成
    this.initAutocomplete();
  },
  
  // 初始化Google地址自动完成
  initAutocomplete() {
    // 检查Google Maps API是否已加载
    const checkGoogleMapsLoaded = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        // 创建自动完成
        this.autocomplete = new google.maps.places.Autocomplete(this.input, {
          types: ['geocode'],
          fields: ['formatted_address', 'geometry']
        });
        
        // 处理地址选择
        this.autocomplete.addListener('place_changed', () => {
          const place = this.autocomplete.getPlace();
          
          if (!place.geometry || !place.geometry.location) {
            this.showNotification("找不到该地址，请尝试更精确的搜索");
            return;
          }
          
          // 获取经纬度并更新地图
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          this.input.value = place.formatted_address;
          this.updateMap(lat, lng);
        });
      } else {
        // API尚未加载，继续等待
        setTimeout(checkGoogleMapsLoaded, 500);
      }
    };
    
    checkGoogleMapsLoaded();
  },
  
  // 搜索位置
  searchLocation() {
    const address = this.input.value.trim();
    if (!address) {
      this.showNotification("请输入位置");
      return;
    }
    
    this.showNotification(`正在搜索: ${address}`);
    this.geocodeAddress(address);
  },
  
  // 地址转坐标
  geocodeAddress(address) {
    if (!window.google || !window.google.maps) {
      this.showNotification("地图服务尚未加载");
      return;
    }
    
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results && results.length > 0) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        
        // 更新输入框并更新地图
        this.input.value = results[0].formatted_address;
        this.updateMap(lat, lng);
      } else {
        this.showNotification(`无法找到位置: ${address}`);
      }
    });
  },
  
  // 获取当前位置
  getCurrentLocation() {
    if (!navigator.geolocation) {
      this.showNotification("您的浏览器不支持位置服务");
      return;
    }
    
    this.showNotification("正在获取您的位置...");
    
    navigator.geolocation.getCurrentPosition(
      // 成功回调
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // 反向解析地址
        this.reverseGeocode(lat, lng);
        this.updateMap(lat, lng);
      },
      // 错误回调
      (error) => {
        let message;
        switch(error.code) {
          case error.PERMISSION_DENIED:
            message = "位置访问被拒绝，请授权浏览器访问您的位置";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "位置信息不可用";
            break;
          case error.TIMEOUT:
            message = "获取位置超时";
            break;
          default:
            message = "无法位置";
        }
        
        this.showNotification(message);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  },
  
  // 坐标转地址
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
  
  // 更新地图
  updateMap(lat, lng) {
    this.showNotification("正在搜索附近提供商...");
    
    // 使用MapHook或发送事件
    if (window.currentMapHook && window.currentMapHook._fetchNearbyProviders) {
      window.currentMapHook._fetchNearbyProviders({ lat, lng });
    } else {
      this.pushEvent("update-location", {
        latitude: lat.toString(),
        longitude: lng.toString()
      });
    }
  },
  
  // 显示通知
  showNotification(message) {
    // 通过MapHook显示通知
    if (window.currentMapHook && window.currentMapHook._showNotification) {
      window.currentMapHook._showNotification(message);
      return;
    }
    
    // 简易通知
    console.log(`通知: ${message}`);
    
    // 创建通知元素
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      background-color: rgba(0, 0, 0, 0.7); color: white; padding: 10px 20px;
      border-radius: 20px; font-size: 14px; z-index: 10000; text-align: center;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 自动隐藏
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
};

export default LocationSearchHook; 