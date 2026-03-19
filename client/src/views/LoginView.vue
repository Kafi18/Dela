<template>
  <div class="auth-page">
    <section class="auth-panel">
      <h1 class="title">Вход в систему голосования</h1>
      <form class="form" @submit.prevent="onSubmit">
        <label class="field">
          <span class="label">E-mail</span>
          <input v-model="email" type="email" required class="input" />
        </label>
        <label class="field">
          <span class="label">Пароль</span>
          <input v-model="password" type="password" required class="input" />
        </label>
        <label class="field">
          <span class="label">Капча (введите 1234)</span>
          <input v-model="captcha" type="text" required class="input" />
        </label>
        <div v-if="auth.error" class="error">{{ auth.error }}</div>
        <button type="submit" class="btn-primary" :disabled="auth.loading">
          {{ auth.loading ? 'Вход...' : 'Войти' }}
        </button>
      </form>
      <p class="hint">
        Нет аккаунта?
        <RouterLink to="/register">Зарегистрироваться</RouterLink>
      </p>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const email = ref('');
const password = ref('');
const captcha = ref('');

const auth = useAuthStore();
const router = useRouter();

const onSubmit = async () => {
  try {
    await auth.login({ email: email.value, password: password.value, captcha: captcha.value });
    router.push('/');
  } catch {
    // error already set in store
  }
};
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #eee6dc 0%, #f2f0ec 50%, #f7f5f1 100%);
}

.auth-panel {
  width: 400px;
  border: 1px solid var(--border);
  border-left: 4px solid var(--accent-strong);
  border-top: 1px solid rgba(255, 255, 255, 0.9);
  background: var(--bg-card);
  padding: 36px 32px;
  box-shadow: var(--shadow-panel);
}

.title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 24px 0;
  color: var(--text);
  letter-spacing: 0.02em;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.input {
  border: 1px solid var(--border);
  padding: 10px 12px;
  font-size: 14px;
  background: var(--bg-input);
  color: var(--text);
  border-radius: var(--radius);
}

.input::placeholder {
  color: var(--text-soft);
}

.btn-primary {
  margin-top: 4px;
  border: 1px solid var(--accent-strong);
  background: var(--accent-strong);
  color: #fff;
  font-size: 13px;
  padding: 10px 16px;
  letter-spacing: 0.04em;
  font-weight: 500;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-secondary);
  border-color: var(--accent-secondary);
}

.error {
  font-size: 13px;
  color: var(--error);
}

.hint {
  margin-top: 20px;
  font-size: 13px;
  color: var(--text-muted);
}
</style>
