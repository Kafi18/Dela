<template>
  <div class="page">
    <h1 class="page-title">Голосования</h1>
    <section class="block">
      <h2 class="block-title">Голосования по темам собраний акционеров</h2>
      <div v-if="loading" class="status-row">Загрузка...</div>
      <div v-else-if="error" class="status-row error">{{ error }}</div>
      <template v-else>
        <table class="table" v-if="votingRows.length">
          <thead>
            <tr>
              <th>Собрание</th>
              <th>Тема</th>
              <th>Описание</th>
              <th>До окончания</th>
              <th>Ваш голос</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in votingRows" :key="row.topic.id">
              <td>
                <div class="cell-meeting-row">
                  <span class="cell-main">{{ row.meeting.title }}</span>
                  <span class="cell-sub cell-date-inline">{{ formatDateTime(row.meeting.scheduled_at) }}</span>
                </div>
              </td>
              <td>{{ row.topic.title }}</td>
              <td>{{ row.topic.description || '—' }}</td>
              <td class="countdown-cell">
                <template v-if="!row.topic.voting_ends_at">—</template>
                <template v-else-if="isExpired(row.topic.voting_ends_at)">
                  <span class="countdown-expired">Голосование завершено</span>
                </template>
                <span v-else class="countdown-simple">
                  <template v-if="countdownParts(row.topic.voting_ends_at).d > 0">
                    {{ countdownParts(row.topic.voting_ends_at).d }} д
                  </template>
                  {{ countdownParts(row.topic.voting_ends_at).h }} ч
                  {{ countdownParts(row.topic.voting_ends_at).m }} мин
                  {{ countdownParts(row.topic.voting_ends_at).s }} сек
                </span>
              </td>
              <td>
                <template v-if="row.topic.user_vote">
                  <span class="voted-label">Вы проголосовали: {{ choiceLabel(row.topic.user_vote) }}</span>
                </template>
                <template v-else>
                  <select v-model="choices[row.topic.id]" class="select">
                    <option value="for">За</option>
                    <option value="against">Против</option>
                    <option value="abstain">Воздержался</option>
                  </select>
                </template>
              </td>
              <td>
                <button
                  v-if="!row.topic.user_vote"
                  type="button"
                  class="btn-primary"
                  :disabled="votingTopicId === row.topic.id"
                  @click="submitVote(row.topic)"
                >
                  {{ votingTopicId === row.topic.id ? 'Отправка...' : 'Голосовать' }}
                </button>
                <span v-else class="voted-badge">Голос учтён</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="empty">Тем для голосования пока нет.</p>
      </template>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import axios from 'axios';

const meetings = ref([]);
const topics = ref([]);
const choices = ref({});
const loading = ref(false);
const error = ref(null);
const votingTopicId = ref(null);
const now = ref(Date.now());
let timerId = null;

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

function choiceLabel(choice) {
  const map = { for: 'За', against: 'Против', abstain: 'Воздержался' };
  return map[choice] || choice;
}

function isExpired(endsAt) {
  return endsAt && new Date(endsAt).getTime() <= now.value;
}

function countdownParts(endsAt) {
  if (!endsAt) return { d: 0, h: '00', m: '00', s: '00' };
  const end = new Date(endsAt).getTime();
  const left = Math.max(0, end - now.value);
  const d = Math.floor(left / (24 * 60 * 60 * 1000));
  const h = Math.floor((left % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const m = Math.floor((left % (60 * 60 * 1000)) / (60 * 1000));
  const s = Math.floor((left % (60 * 1000)) / 1000);
  return {
    d,
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0')
  };
}

// Порядок как на первой вкладке: строка i = i-е собрание + i-я тема (1↔1, 2↔2, …)
const votingRows = computed(() => {
  const m = meetings.value;
  const t = [...topics.value].sort((a, b) => a.id - b.id);
  const rows = [];
  for (let i = 0; i < m.length && i < t.length; i++) {
    rows.push({ meeting: m[i], topic: t[i] });
  }
  return rows;
});

const loadTopics = async () => {
  loading.value = true;
  error.value = null;
  try {
    const [summaryRes, topicsRes] = await Promise.all([
      axios.get('http://localhost:4000/api/voting/summary'),
      axios.get('http://localhost:4000/api/voting/topics')
    ]);
    meetings.value = summaryRes.data.meetings || [];
    topics.value = topicsRes.data;
    topicsRes.data.forEach((t) => {
      if (!choices.value[t.id]) {
        choices.value[t.id] = t.user_vote || 'for';
      }
    });
  } catch (e) {
    error.value = e.response?.data?.message || 'Не удалось загрузить темы';
  } finally {
    loading.value = false;
  }
};

const submitVote = async (topic) => {
  const choice = choices.value[topic.id];
  if (!choice) return;
  votingTopicId.value = topic.id;
  try {
    await axios.post('http://localhost:4000/api/voting/vote', {
      topicId: topic.id,
      choice
    });
    topic.user_vote = choice;
  } catch (e) {
    alert(e.response?.data?.message || 'Ошибка при голосовании');
  } finally {
    votingTopicId.value = null;
  }
};

onMounted(() => {
  loadTopics();
  timerId = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (timerId) clearInterval(timerId);
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

.table {
  width: calc(100% - 40px);
  border-collapse: collapse;
  font-size: 14px;
  margin: 16px 20px 20px 20px;
}

.table thead tr {
  border-bottom: 2px solid var(--border);
}

th,
td {
  border-top: 1px solid var(--border-light);
  padding: 12px 10px;
  text-align: left;
  vertical-align: middle;
}

tbody tr {
  transition: background 0.2s ease;
}

tbody tr:hover {
  background: rgba(243, 228, 227, 0.35);
}

th {
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-page);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.cell-meeting-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: nowrap;
}

.cell-meeting-row .cell-main {
  flex: 1;
  min-width: 0;
}

.cell-date-inline {
  flex-shrink: 0;
  margin-top: 0;
}

.cell-main {
  color: var(--text);
}

.cell-sub {
  font-size: 12px;
  color: var(--text-soft);
  margin-top: 2px;
}

.cell-same-meeting {
  color: var(--text-muted);
  font-style: normal;
}

.countdown-cell {
  font-variant-numeric: tabular-nums;
}

.countdown-simple {
  font-size: 13px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.countdown-expired {
  font-size: 12px;
  color: var(--text-soft);
}

.select {
  border: 1px solid var(--border);
  padding: 8px 10px;
  font-size: 13px;
  background: var(--bg-input);
  color: var(--text);
  min-width: 140px;
}

.btn-primary {
  border: 1px solid var(--accent-strong);
  background: var(--accent-strong);
  color: #fff;
  font-size: 12px;
  padding: 8px 14px;
  letter-spacing: 0.04em;
  font-weight: 500;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-secondary);
  border-color: var(--accent-secondary);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.voted-label {
  font-size: 13px;
  color: var(--accent-secondary);
  font-weight: 500;
}

.voted-badge {
  font-size: 12px;
  color: var(--text-muted);
}

.empty {
  font-size: 14px;
  color: var(--text-soft);
  margin: 0;
  padding: 20px;
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
