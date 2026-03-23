<template>
  <div class="page">
    <div v-if="loading" class="status-row">Загрузка...</div>
    <div v-else-if="error" class="status-row error">{{ error }}</div>
    <section v-else class="block detail-block">
      <h1 class="page-title">{{ meeting.title }}</h1>
      <div class="meta">
        <div class="meta-item">
          <span class="meta-label">Дата и время</span>
          <span class="meta-value">
            {{ formatDateTime(meeting.scheduled_at) }}
          </span>
        </div>
      </div>
      <p v-if="meeting.description" class="lead">
        {{ meeting.description }}
      </p>
      <p v-if="meeting.details" class="details">{{ meeting.details }}</p>
      <RouterLink class="back-link" :to="{ name: 'dashboard' }">← Назад на главную</RouterLink>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import axios from 'axios';
import { API_BASE } from '../config/api.js';

const route = useRoute();
const meeting = ref(null);
const loading = ref(false);
const error = ref(null);

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

onMounted(async () => {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await axios.get(`${API_BASE}/voting/meeting/${route.params.id}`);
    meeting.value = data;
  } catch (e) {
    error.value = e.response?.data?.message || 'Не удалось загрузить информацию о собрании';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page {
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 16px 0;
  letter-spacing: 0.02em;
}

.block.detail-block {
  border: 1px solid var(--border);
  border-top: 1px solid rgba(255, 255, 255, 0.8);
  border-left: var(--accent-bar) solid var(--accent-strong);
  background: var(--bg-card);
  padding: 24px 26px;
  box-shadow: var(--shadow-card);
}

.meta {
  display: flex;
  gap: 24px;
  margin-bottom: 14px;
  border-top: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
  padding: 10px 0;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.meta-value {
  font-size: 14px;
  color: var(--text);
}

.lead {
  font-size: 14px;
  color: var(--text);
  margin: 10px 0 8px 0;
}

.details {
  font-size: 13px;
  color: var(--text-soft);
  margin: 0 0 20px 0;
  line-height: 1.65;
  white-space: pre-line;
}

.status-row {
  font-size: 14px;
  color: var(--text-muted);
}

.status-row.error {
  color: var(--error);
}

.back-link {
  display: inline-block;
  font-size: 13px;
  padding: 8px 14px;
  border: 1px solid var(--border);
  background: var(--bg-page);
  color: var(--text);
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}

.back-link:hover {
  border-color: var(--accent-strong);
  background: var(--accent-light);
  color: var(--accent-strong);
  text-decoration: none;
}
</style>

