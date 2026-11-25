<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-title">Dashboard Ringkasan Operasional</h2>
        <p class="page-subtitle">
          Selamat datang kembali, <b>{{ user?.name }}</b> — {{ user?.tenant_name }}
        </p>
      </div>
      <div>
        <router-link to="/catalog" class="btn btn-primary">
          <NavIcon name="plus" /> Buat Pesanan Baru
        </router-link>
      </div>
    </div>

    <!-- Statistik Ringkas -->
    <div class="stat-grid">
      <div class="stat-card accent-success">
        <div class="stat-icon"><NavIcon name="orders" /></div>
        <span class="stat-label">Total Pesanan</span>
        <div class="stat-value">{{ stats.total_orders }}</div>
        <span class="stat-hint">Aktif &amp; tercatat di sistem</span>
      </div>

      <div class="stat-card accent-info">
        <div class="stat-icon"><NavIcon name="box" /></div>
        <span class="stat-label">Katalog Produk</span>
        <div class="stat-value">{{ stats.total_products }}</div>
        <span class="stat-hint">Item perlengkapan rumah tangga</span>
      </div>

      <div class="stat-card accent-warning">
        <div class="stat-icon"><NavIcon name="alert" /></div>
        <span class="stat-label">Stok Menipis (&lt; 25)</span>
        <div class="stat-value">{{ stats.low_stock_products }}</div>
        <span class="stat-hint">Perlu restock segera</span>
      </div>
    </div>

    <!-- Pesanan Terbaru -->
    <div class="card">
      <div class="card-header">
        <h3 class="section-title">Pesanan Terbaru</h3>
        <router-link to="/orders" class="btn btn-ghost btn-sm">Lihat Semua &rarr;</router-link>
      </div>

      <div v-if="loading" class="loading-state">Memuat data...</div>
      <div v-else-if="stats.recent_orders && stats.recent_orders.length > 0" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>No. Pesanan</th>
              <th>Pelanggan</th>
              <th>Status</th>
              <th>Total Tagihan</th>
              <th>Waktu Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ord in stats.recent_orders" :key="ord.id">
              <td><b>{{ ord.order_number }}</b></td>
              <td>{{ ord.customer_name }}</td>
              <td>
                <span class="badge" :class="statusBadge(ord.status)">{{ ord.status }}</span>
              </td>
              <td>Rp {{ Number(ord.grand_total).toLocaleString('id-ID') }}</td>
              <td class="text-muted" style="font-size: 12px;">{{ ord.created_at }}</td>
              <td>
                <router-link :to="`/orders/${ord.id}`" class="btn btn-outline btn-sm">
                  Buka Detail
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">Belum ada pesanan terbaru.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiFetch, getCurrentUser } from '../api';
import NavIcon from '../components/NavIcon.vue';

const user = ref(getCurrentUser());
const stats = ref<any>({ total_orders: 0, total_products: 0, low_stock_products: 0, recent_orders: [] });
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await apiFetch('/dashboard/stats');
    if (res.success && res.data) {
      stats.value = res.data;
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
});

function statusBadge(status: string) {
  switch (status) {
    case 'delivered': return 'badge-primary';
    case 'shipped': return 'badge-info';
    case 'processing': return 'badge-warning';
    case 'cancelled': return 'badge-danger';
    default: return 'badge-secondary';
  }
}
</script>
