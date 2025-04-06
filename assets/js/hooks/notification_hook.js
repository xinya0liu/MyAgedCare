// notification_hook.js

const NotificationHook = {
  mounted() {
    console.log("NotificationHook mounted");
    
    // Listen for toggle-notification events from server
    this.handleEvent("toggle-notification", () => {
      this.toggleNotification();
    });
    
    // Add click outside listener to close dropdown
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
  
  // Toggle notification dropdown show/hide
  toggleNotification() {
    const dropdown = document.getElementById("notification-dropdown");
    if (dropdown) {
      dropdown.classList.toggle("hidden");
    }
  }
};

export default NotificationHook; 