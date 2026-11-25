<template>
  <div class="auth-card">
    <div class="auth-logo">📦</div>
    <h2 class="auth-heading">Masuk ke KiosKita</h2>
    <p class="auth-sub">Sistem Distribusi Perlengkapan Rumah Tangga</p>

    <div v-if="errorMsg" class="alert alert-danger" role="alert" style="margin-top: 20px;">
      {{ errorMsg }}
    </div>

    <form @submit.prevent="submitLogin" style="margin-top: 20px;">
      <div class="form-group">
        <label class="form-label" for="login-email">Email Akun</label>
        <input
          id="login-email"
          v-model="email"
          type="email"
          required
          placeholder="nama@kioskita.local"
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="login-password">Kata Sandi</label>
        <input
          id="login-password"
          v-model="password"
          type="password"
          required
          placeholder="••••••••"
        />
      </div>

      <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
        {{ loading ? 'Memproses...' : 'Masuk Sekarang' }}
      </button>
    </form>

    <div class="auth-divider">Akun Dummy Lab</div>

    <div class="account-grid">
      <button
        v-for="acc in accounts"
        :key="acc.email"
        class="account-btn"
        type="button"
        @click="fillAccount(acc.email)"
      >
        <span class="account-emoji">{{ acc.emoji }}</span>
        <span>{{ acc.label }}</span>
      </button>
    </div>

    <p class="form-hint" style="text-align: center; margin-top: 14px;">
      Password seragam semua akun lab: <code>password123</code>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiFetch, setCurrentUser, setToken } from '../api';

const router = useRouter();
const email = ref('budi@customer.local');
const password = ref('password123');
const errorMsg = ref('');
const loading = ref(false);

const accounts = [
  { email: 'admin@kioskita.local', label: 'Admin Pusat', emoji: '👑' },
  { email: 'manager@kioskita.local', label: 'Manager Hendra', emoji: '💼' },
  { email: 'staff1@kioskita.local', label: 'Staff Agus', emoji: '📦' },
  { email: 'budi@customer.local', label: 'Customer Budi', emoji: '🛒' },
  { email: 'joko@customer.local', label: 'Customer Joko', emoji: '🛒' },
];

function fillAccount(accEmail: string) {
  email.value = accEmail;
  password.value = 'password123';
}

async function submitLogin() {
  loading.value = true;
  errorMsg.value = '';
  try {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.value, password: password.value }),
    });

    if (res.success && res.token) {
      setToken(res.token);
      setCurrentUser(res.user);
      window.dispatchEvent(new Event('user-updated'));
      router.push('/');
    } else {
      errorMsg.value = res.error || 'Login gagal, periksa email dan password.';
    }
  } catch (err: any) {
    errorMsg.value = err.message || 'Terjadi kesalahan jaringan';
  } finally {
    loading.value = false;
  }
}
</script>
