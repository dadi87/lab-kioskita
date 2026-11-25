<template>
  <div class="app-root">
    <!-- Banner Wajib Lab Keamanan -->
    <div class="lab-banner">
      <span class="banner-long">⚠️ LOCAL SECURITY TRAINING LAB — DATA DUMMY &amp; LINGKUNGAN ISOLASI</span>
      <span class="banner-short">⚠️ LAB KEAMANAN — DATA DUMMY &amp; ISOLASI</span>
    </div>

    <template v-if="user">
      <div class="app-shell">
        <!-- Sidebar Navigasi -->
        <aside class="sidebar" :class="{ open: mobileOpen }">
          <div class="brand">
            <div class="brand-mark">📦</div>
            <div class="brand-text">
              <div class="brand-name">KiosKita</div>
              <div class="brand-tenant">{{ user.tenant_name }}</div>
            </div>
          </div>

          <nav>
            <div v-if="visibleOperasional.length" class="nav-section">
              <div class="nav-section-title">Operasional</div>
              <router-link
                v-for="item in visibleOperasional"
                :key="item.to"
                :to="item.to"
                class="nav-link"
              >
                <NavIcon :name="item.icon" />
                <span>{{ item.label }}</span>
              </router-link>
            </div>

            <div v-if="visibleAkun.length" class="nav-section">
              <div class="nav-section-title">Akun</div>
              <router-link
                v-for="item in visibleAkun"
                :key="item.to"
                :to="item.to"
                class="nav-link"
              >
                <NavIcon :name="item.icon" />
                <span>{{ item.label }}</span>
              </router-link>
            </div>

            <div v-if="visibleAdministrasi.length" class="nav-section">
              <div class="nav-section-title">Administrasi</div>
              <router-link
                v-for="item in visibleAdministrasi"
                :key="item.to"
                :to="item.to"
                class="nav-link"
              >
                <NavIcon :name="item.icon" />
                <span>{{ item.label }}</span>
              </router-link>
            </div>
          </nav>

          <div class="sidebar-footer">
            <div class="user-card">
              <div class="avatar">{{ initials }}</div>
              <div class="user-meta">
                <div class="user-name">{{ user.name }}</div>
                <div class="user-role">{{ user.role }}</div>
              </div>
            </div>
            <button class="btn-logout" type="button" @click="logout">
              <NavIcon name="logout" />
              <span>Keluar</span>
            </button>
          </div>
        </aside>

        <div v-if="mobileOpen" class="sidebar-overlay" @click="mobileOpen = false"></div>

        <!-- Area Konten -->
        <div class="main-area">
          <header class="topbar">
            <button
              class="mobile-toggle"
              type="button"
              aria-label="Buka menu navigasi"
              @click="mobileOpen = !mobileOpen"
            >
              <NavIcon :name="mobileOpen ? 'close' : 'menu'" />
            </button>

            <div class="topbar-title">
              <h1>{{ pageTitle }}</h1>
              <div class="topbar-sub">Sistem Operasional Pesanan &amp; Gudang</div>
            </div>

            <div class="topbar-spacer"></div>

            <div class="user-chip">
              <div class="avatar">{{ initials }}</div>
              <div class="user-chip-meta">
                <div class="user-chip-name">{{ user.name }}</div>
                <div class="user-chip-role">{{ user.role }} · {{ user.tenant_name }}</div>
              </div>
            </div>
          </header>

          <main class="content">
            <router-view />
          </main>
        </div>
      </div>
    </template>

    <!-- Halaman tanpa sidebar (Login) -->
    <main v-else class="auth-shell">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { clearToken, getCurrentUser } from './api';
import NavIcon from './components/NavIcon.vue';

const router = useRouter();
const route = useRoute();
const user = ref<any>(getCurrentUser());
const mobileOpen = ref(false);

type Role = 'admin' | 'manager' | 'staff' | 'customer';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles?: Role[];
}

const navOperasional: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/catalog', label: 'Katalog', icon: 'catalog' },
  { to: '/cart', label: 'Keranjang', icon: 'cart', roles: ['customer'] },
  { to: '/orders', label: 'Pesanan', icon: 'orders' },
  { to: '/shipments', label: 'Pengiriman', icon: 'shipments' },
];

const navAkun: NavItem[] = [{ to: '/profile', label: 'Profil', icon: 'profile' }];

const navAdministrasi: NavItem[] = [
  { to: '/admin/users', label: 'Kelola User', icon: 'users', roles: ['admin'] },
];

function canSee(item: NavItem, role?: string): boolean {
  if (!item.roles) return true;
  return !!role && item.roles.includes(role as Role);
}

const visibleOperasional = computed(() =>
  navOperasional.filter((item) => canSee(item, user.value?.role))
);
const visibleAkun = computed(() => navAkun.filter((item) => canSee(item, user.value?.role)));
const visibleAdministrasi = computed(() =>
  navAdministrasi.filter((item) => canSee(item, user.value?.role))
);

function refreshUser() {
  user.value = getCurrentUser();
}

onMounted(() => {
  refreshUser();
  window.addEventListener('storage', refreshUser);
  window.addEventListener('user-updated', refreshUser);
});

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
);

const initials = computed(() => {
  if (!user.value?.name) return '?';
  return user.value.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase() ?? '')
    .join('');
});

const pageTitle = computed(() => {
  const path = route.path;
  if (path === '/') return 'Dashboard';
  if (path.startsWith('/catalog')) return 'Katalog Produk';
  if (path.startsWith('/cart')) return 'Keranjang';
  if (path === '/orders') return 'Pesanan';
  if (path.startsWith('/orders/')) return 'Detail Pesanan';
  if (path.startsWith('/invoices/')) return 'Faktur Penjualan';
  if (path.startsWith('/shipments')) return 'Pengiriman';
  if (path.startsWith('/profile')) return 'Profil & Alamat';
  if (path.startsWith('/admin/users')) return 'Kelola User';
  return 'KiosKita';
});

function logout() {
  clearToken();
  user.value = null;
  router.push('/login');
}
</script>
