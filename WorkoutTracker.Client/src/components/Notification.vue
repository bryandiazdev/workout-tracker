<template>
  <transition name="notification-fade">
    <div 
      v-if="notification.show" 
      :class="['notification', `notification-${notification.type}`]"
    >
      <div class="notification-content">
        <span>{{ notification.message }}</span>
        <button class="notification-close" @click="hideNotification">×</button>
      </div>
    </div>
  </transition>
</template>

<script>
import { mapState, mapMutations } from 'vuex';

export default {
  name: 'Notification',
  computed: {
    ...mapState(['notification'])
  },
  methods: {
    ...mapMutations(['hideNotification'])
  }
};
</script>

<style scoped>
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  min-width: 300px;
  max-width: 400px;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: default;
}

.notification-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 20px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.notification-close:hover {
  opacity: 1;
}

.notification-success {
  background-color: var(--success-color);
  color: white;
}

.notification-error {
  background-color: var(--danger-color);
  color: white;
}

.notification-warning {
  background-color: var(--warning-color);
  color: white;
}

.notification-info {
  background-color: var(--primary-color);
  color: white;
}

.notification-fade-enter-active, 
.notification-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.notification-fade-enter, 
.notification-fade-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style> 