<template>
  <div class="page">
    <h1 class="page-title">Результаты голосования</h1>
    <section class="block">
      <h2 class="block-title">Админ-панель</h2>
      <div class="admin-toolbar">
        <span class="toolbar-label">Тема голосования:</span>
        <div class="topic-links">
          <RouterLink
            v-for="n in 5"
            :key="n"
            :to="{ name: 'admin-results', params: { id: n } }"
            class="topic-link"
            :class="{ active: String(route.params.id) === String(n) }"
          >
            №{{ n }}
          </RouterLink>
        </div>
        <button type="button" class="btn-refresh" @click="loadResults" :disabled="loading">
          {{ loading ? 'Загрузка...' : 'Обновить' }}
        </button>
      </div>
      <div v-if="loading" class="status-row">Загрузка...</div>
      <div v-else-if="error" class="status-row error">{{ error }}</div>
      <template v-else>
        <div v-if="topic" class="topic-block">
          <div class="topic-title">{{ topic.meeting_title }} / {{ topic.title }}</div>
          <div v-if="topic.description" class="topic-desc">{{ topic.description }}</div>
        </div>

        <div class="grid">
          <div class="sub-block">
            <h3 class="sub-title">Сводка</h3>
            <ul class="list">
              <li v-for="row in aggregate" :key="row.choice" class="list-item">
                <span class="label-inline">{{ mapChoice(row.choice) }}</span>
                <span>{{ row.count }}</span>
              </li>
            </ul>
          </div>

          <div class="sub-block sub-block-wide">
            <h3 class="sub-title">Кто как проголосовал</h3>
            <table class="table" v-if="votes.length">
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>E-mail</th>
                  <th>Голос</th>
                  <th>Время</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="v in votes" :key="v.id">
                  <td>{{ v.full_name }}</td>
                  <td>{{ v.email }}</td>
                  <td>{{ mapChoice(v.choice) }}</td>
                  <td>{{ new Date(v.created_at).toLocaleString('ru-RU') }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else class="empty">Голосов пока нет.</p>
          </div>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import axios from 'axios';
import { useRoute, RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { API_BASE } from '../config/api.js';

const route = useRoute();
const auth = useAuthStore();

const topic = ref(null);
const votes = ref([]);
const aggregate = ref([]);
const loading = ref(false);
const error = ref(null);

const mapChoice = (choice) => {
  switch (choice) {
    case 'for':
      return 'За';
    case 'against':
      return 'Против';
    case 'abstain':
      return 'Воздержался';
    default:
      return choice;
  }
};

const loadResults = async () => {
  if (!auth.isAdmin) {
    error.value = 'Недостаточно прав';
    return;
  }

  loading.value = true;
  error.value = null;
  try {
    const { data } = await axios.get(
      `${API_BASE}/voting/admin/topic/${route.params.id}/results`
    );
    topic.value = data.topic;
    votes.value = data.votes;
    aggregate.value = data.aggregate;
  } catch (e) {
    error.value = e.response?.data?.message || 'Не удалось загрузить результаты';
  } finally {
    loading.value = false;
  }
};

onMounted(loadResults);
watch(() => route.params.id, () => loadResults());
</script>

<style scoped>
.page {
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 20px 0;
  letter-spacing: 0.02em;
}

.block {
  border: 1px solid var(--border);
  border-top: 1px solid rgba(255, 255, 255, 0.8);
  background: var(--bg-card);
  padding: 0;
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.block-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin: 0;
  padding: 14px 20px 12px 20px;
  border-bottom: 1px solid var(--border-light);
  border-left: var(--accent-bar) solid var(--accent-strong);
  background: linear-gradient(90deg, rgba(243, 228, 227, 0.5) 0%, rgba(243, 228, 227, 0.2) 100%);
}

.admin-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-page);
}

.toolbar-label {
  font-size: 13px;
  color: var(--text-muted);
}

.topic-links {
  display: flex;
  gap: 4px;
}

.topic-link {
  padding: 6px 12px;
  font-size: 13px;
  color: var(--text-muted);
  text-decoration: none;
  border: 1px solid var(--border);
  background: var(--bg-card);
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.topic-link:hover {
  color: var(--accent-secondary);
  border-color: var(--accent-secondary);
}

.topic-link.active {
  color: var(--accent-strong);
  border-color: var(--accent-strong);
  background: rgba(243, 228, 227, 0.5);
  font-weight: 500;
}

.btn-refresh {
  margin-left: auto;
  padding: 6px 14px;
  font-size: 13px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text);
  cursor: pointer;
}

.btn-refresh:hover:not(:disabled) {
  border-color: var(--accent-strong);
  color: var(--accent-strong);
}

.btn-refresh:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.topic-block {
  border: 1px solid var(--border-light);
  border-left: var(--accent-bar) solid var(--accent-secondary);
  padding: 14px 20px;
  margin: 20px 20px 0 20px;
  background: var(--bg-page);
}

.topic-title {
  font-size: 14px;
  color: var(--text);
  font-weight: 500;
}

.topic-desc {
  font-size: 13px;
  color: var(--text-soft);
  margin-top: 6px;
}

.grid {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 20px;
  padding: 20px;
}

.sub-block {
  border: 1px solid var(--border-light);
  padding: 14px 16px;
  background: var(--bg-page);
}

.sub-block .sub-title {
  border-left: 2px solid var(--accent-strong);
  padding-left: 10px;
}

.sub-block-wide {
  overflow-x: auto;
}

.sub-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin: 0 0 12px 0;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.list-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-top: 1px solid var(--border-light);
}

.list-item:first-of-type {
  border-top: none;
  padding-top: 0;
}

.label-inline {
  color: var(--text);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th,
td {
  border-top: 1px solid var(--border-light);
  padding: 10px;
  text-align: left;
}

tbody tr {
  transition: background 0.15s;
}

tbody tr:hover {
  background: var(--accent-light);
}

th {
  background: var(--bg-page);
  font-weight: 500;
  color: var(--text-muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.empty {
  font-size: 13px;
  color: var(--text-soft);
  margin: 0;
  padding: 16px 20px;
  text-align: center;
}

.status-row {
  font-size: 14px;
  color: var(--text-muted);
  padding: 20px;
}

.status-row.error {
  color: var(--error);
}
</style>
