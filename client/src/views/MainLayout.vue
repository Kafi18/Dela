<template>
  <div class="layout">
    <header class="header">
      <div class="header-left">
        <div class="logo">Система голосования</div>
        <nav class="nav">
          <RouterLink to="/" class="nav-link" active-class="nav-link-active">Главная</RouterLink>
          <RouterLink to="/voting" class="nav-link" active-class="nav-link-active">Голосования</RouterLink>
          <RouterLink to="/about" class="nav-link" active-class="nav-link-active">О Нас</RouterLink>
          <RouterLink
            v-if="auth.isAdmin"
            :to="{ name: 'admin-results', params: { id: 1 } }"
            class="nav-link"
            active-class="nav-link-active"
          >
            Админ-панель
          </RouterLink>
        </nav>
      </div>
      <div class="header-right" v-if="auth.isAuthenticated">
        <div class="user-block">
          <div class="user-name">{{ auth.user?.fullName || auth.user?.email }}</div>
          <div class="user-role">{{ auth.isAdmin ? 'Администратор' : 'Акционер' }}</div>
        </div>
        <button class="btn-outline" @click="onLogout">Выход</button>
      </div>
    </header>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { useRouter, RouterLink, RouterView } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();

const onLogout = () => {
  auth.logout();
  router.push({ name: 'login' });
};
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  height: 64px;
  border-bottom: 2px solid var(--border);
  border-left: var(--accent-bar) solid var(--accent-strong);
  background: var(--bg-card);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  box-shadow: var(--shadow-panel);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 28px;
}

.logo {
  font-size: 16px;
  letter-spacing: 0.06em;
  font-weight: 600;
  color: var(--accent-strong);
  padding-bottom: 2px;
  border-bottom: 2px solid var(--accent-strong);
}

.nav {
  display: flex;
  gap: 4px;
}

.nav-link {
  font-size: 14px;
  color: var(--text-muted);
  padding: 8px 14px;
  text-decoration: none;
  border: 1px solid transparent;
  border-left: 2px solid transparent;
  transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.nav-link:hover {
  color: var(--text);
  background: var(--accent-light);
}

.nav-link-active {
  color: var(--accent-strong);
  background: var(--accent-light);
  border-left-color: var(--accent-strong);
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-block {
  text-align: right;
  padding: 10px 16px;
  background: linear-gradient(180deg, #f8f9fa 0%, var(--accent-light-secondary) 100%);
  border: 1px solid var(--border-light);
}

.user-name {
  font-size: 14px;
  color: var(--text);
}

.user-role {
  font-size: 12px;
  color: var(--text-soft);
}

.btn-outline {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font-size: 13px;
  padding: 8px 16px;
  letter-spacing: 0.02em;
  transition: background 0.15s, border-color 0.15s;
}

.btn-outline:hover {
  background: var(--accent-light);
  border-color: var(--accent);
  color: var(--accent);
}

.content {
  flex: 1;
  padding: 36px 32px 48px;
  max-width: 1200px;
  margin: 24px auto 32px;
  width: 100%;
  min-height: 360px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-left: 4px solid var(--accent-secondary);
  box-shadow: var(--shadow-panel);
}
</style>
