// notification_hook.js

const NotificationHook = {
  mounted() {
    console.log("NotificationHook mounted");
    
    // 监听从服务器发送的toggle-notification事件
    this.handleEvent("toggle-notification", () => {
      this.toggleNotification();
    });
    
    // 添加点击外部关闭下拉框的监听
    document.addEventListener("click", (e) => {
      const notificationBtn = document.getElementById("notification-btn");
      const notificationDropdown = document.getElementById("notification-dropdown");
      
      if (notificationBtn && notificationDropdown) {
        if (!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
          notificationDropdown.classList.add("hidden");
        }
      }
    });
  },
  
  // 切换通知下拉框显示/隐藏
  toggleNotification() {
    const dropdown = document.getElementById("notification-dropdown");
    if (dropdown) {
      dropdown.classList.toggle("hidden");
    }
  }
};

export default NotificationHook; 