<template>
  <div class="page">
    <h1 class="page-title">Главная</h1>
    <div v-if="loading" class="status-row">Загрузка...</div>
    <div v-if="error" class="status-row error">{{ error }}</div>
    <div v-else class="grid">
      <section class="block">
        <h2 class="block-title">Ближайшие собрания акционеров</h2>
        <ul class="list">
          <li v-for="m in summary.meetings" :key="m.id" class="list-item">
            <button type="button" class="meeting-title-btn" @click="openModal(m)">
              {{ m.title }}
            </button>
            <div class="item-sub">Дата: {{ formatDateTime(m.scheduled_at) }}</div>
            <div v-if="m.description" class="item-text">{{ m.description }}</div>
          </li>
        </ul>
        <p v-if="!summary.meetings.length" class="empty">Нет запланированных собраний</p>
      </section>

      <section class="block">
        <h2 class="block-title">Темы голосований</h2>
        <ul class="list">
          <li v-for="t in summary.topics" :key="t.id" class="list-item">
            <button type="button" class="meeting-title-btn topic-title-btn" @click="openTopicModal(t)">
              Тема №{{ t.id }}
            </button>
            <div class="item-text">{{ t.title }}</div>
          </li>
        </ul>
        <p v-if="!summary.topics.length" class="empty">Тем пока нет</p>
      </section>

      <section class="block">
        <h2 class="block-title">Крупнейшие акционеры</h2>
        <ul class="list">
          <li v-for="s in summary.shareholders" :key="s.id" class="list-item">
            <div class="item-title">{{ s.full_name }}</div>
            <div class="item-sub">Доля: {{ s.share_count }}%</div>
            <div v-if="s.description" class="item-text">{{ s.description }}</div>
          </li>
        </ul>
        <p v-if="!summary.shareholders.length" class="empty">Данных нет</p>
      </section>
    </div>

    <!-- Модальное окно с подробной информацией о собрании -->
    <Teleport to="body">
      <div v-if="selectedMeeting" class="modal-overlay" @click.self="closeModal">
        <div class="modal-window">
          <div class="modal-header">
            <h3 class="modal-title">{{ selectedMeeting.title }}</h3>
            <button type="button" class="modal-close" aria-label="Закрыть" @click="closeModal">×</button>
          </div>
          <div class="modal-meta">
            Дата и время: {{ formatDateTime(selectedMeeting.scheduled_at) }}
          </div>
          <div class="modal-body">
            <p v-if="selectedMeeting.details" class="modal-text">{{ selectedMeeting.details }}</p>
            <p v-else class="modal-text">{{ selectedMeeting.description }}</p>
          </div>
          <button type="button" class="modal-btn-close" @click="closeModal">Закрыть</button>
        </div>
      </div>
    </Teleport>

    <!-- Модальное окно с подробной информацией о теме голосования -->
    <Teleport to="body">
      <div v-if="selectedTopic" class="modal-overlay" @click.self="closeTopicModal">
        <div class="modal-window">
          <div class="modal-header">
            <h3 class="modal-title">Тема №{{ selectedTopic.id }}</h3>
            <button type="button" class="modal-close" aria-label="Закрыть" @click="closeTopicModal">×</button>
          </div>
          <div class="modal-meta">
            {{ selectedTopic.title }}
          </div>
          <div class="modal-body">
            <p v-if="selectedTopic.details" class="modal-text">{{ selectedTopic.details }}</p>
            <p v-else class="modal-text">{{ selectedTopic.title }}</p>
          </div>
          <button type="button" class="modal-btn-close" @click="closeTopicModal">Закрыть</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import axios from 'axios';
import { API_BASE } from '../config/api.js';

const summary = reactive({
  meetings: [],
  topics: [],
  shareholders: []
});

const loading = ref(false);
const error = ref(null);
const selectedMeeting = ref(null);
const selectedTopic = ref(null);

function openModal(meeting) {
  selectedMeeting.value = meeting;
}

function closeModal() {
  selectedMeeting.value = null;
}

function openTopicModal(topic) {
  selectedTopic.value = topic;
}

function closeTopicModal() {
  selectedTopic.value = null;
}

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
    const { data } = await axios.get(`${API_BASE}/voting/summary`);
    summary.meetings = data.meetings;
    summary.topics = data.topics;
    summary.shareholders = data.shareholders;
  } catch (e) {
    error.value = e.response?.data?.message || 'Не удалось загрузить данные';
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
  margin: 0 0 20px 0;
  letter-spacing: 0.02em;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
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

.list {
  list-style: none;
  padding: 8px 20px 20px 20px;
  margin: 0;
}

.list-item {
  padding: 14px 12px 12px 12px;
  margin: 0 -12px;
  border-top: 1px solid var(--border-light);
  transition: background 0.2s ease;
}

.list-item:first-of-type {
  border-top: none;
}

.list-item:hover {
  background: rgba(243, 228, 227, 0.25);
}

.meeting-title-btn {
  display: inline;
  padding: 0;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: var(--accent-secondary);
  text-decoration: none;
  cursor: pointer;
  text-align: left;
  line-height: 1.4;
}

.meeting-title-btn:hover {
  color: var(--accent-strong);
  text-decoration: underline;
}

.topic-title-btn {
  font-weight: 600;
}

.item-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.item-sub {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.item-text {
  font-size: 13px;
  color: var(--text-soft);
  margin-top: 4px;
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
}

.status-row.error {
  color: var(--error);
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(44, 42, 38, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-window {
  width: 100%;
  max-width: 560px;
  max-height: 85vh;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-left: 4px solid var(--accent-strong);
  box-shadow: 0 8px 32px rgba(44, 42, 38, 0.2);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 12px 20px;
  border-bottom: 1px solid var(--border-light);
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  line-height: 1.35;
  flex: 1;
}

.modal-close {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--border);
  background: var(--bg-card);
  font-size: 20px;
  line-height: 1;
  color: var(--text-muted);
  cursor: pointer;
}

.modal-close:hover {
  border-color: var(--accent-strong);
  color: var(--accent-strong);
}

.modal-meta {
  font-size: 12px;
  color: var(--text-muted);
  padding: 10px 20px;
  border-bottom: 1px solid var(--border-light);
}

.modal-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.modal-text {
  font-size: 13px;
  color: var(--text-soft);
  line-height: 1.65;
  margin: 0;
  white-space: pre-line;
}

.modal-btn-close {
  margin: 0 20px 18px 20px;
  padding: 10px 16px;
  border: 1px solid var(--border);
  background: var(--bg-page);
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
}

.modal-btn-close:hover {
  border-color: var(--accent-strong);
  color: var(--accent-strong);
}
</style>
