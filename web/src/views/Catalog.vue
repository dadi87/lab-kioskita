<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-title">Katalog Perlengkapan Rumah Tangga</h2>
        <p class="page-subtitle">Pilih produk untuk keranjang distribusi KiosKita</p>
      </div>
      <div>
        <router-link to="/cart" class="btn btn-outline">
          <NavIcon name="cart" /> Keranjang ({{ cartCount }} item)
        </router-link>
      </div>
    </div>

    <!-- Filter & Pencarian -->
    <div class="card filter-bar">
      <div class="filter-grow">
        <input
          v-model="search"
          type="text"
          placeholder="Cari nama produk atau SKU..."
          @input="fetchProducts"
        />
      </div>
      <div class="filter-shrink">
        <select v-model="selectedCategory" @change="fetchProducts">
          <option value="">Semua Kategori</option>
          <option value="Peralatan Masak">Peralatan Masak</option>
          <option value="Kebersihan">Kebersihan</option>
          <option value="Dapur & Ruang Makan">Dapur &amp; Ruang Makan</option>
          <option value="Kamar Mandi">Kamar Mandi</option>
          <option value="Elektronik Dapur">Elektronik Dapur</option>
          <option value="Penyimpanan">Penyimpanan</option>
        </select>
      </div>
    </div>

    <!-- Grid Produk -->
    <div v-if="loading" class="loading-state">Memuat katalog produk...</div>
    <div v-else class="grid-cards">
      <div v-for="prod in products" :key="prod.id" class="card product-card">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
            <span class="badge badge-secondary">{{ prod.category }}</span>
            <span class="mono text-soft" style="font-size: 11px;">{{ prod.sku }}</span>
          </div>
          <h4 style="margin: 0 0 6px; font-size: 16px;">{{ prod.name }}</h4>
          <p class="text-muted" style="font-size: 13px; margin-bottom: 12px; min-height: 40px;">
            {{ prod.description }}
          </p>
        </div>

        <div style="border-top: 1px solid var(--color-border); padding-top: 12px; margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 10px;">
            <span class="product-price">Rp {{ Number(prod.price).toLocaleString('id-ID') }}</span>
            <span
              class="text-muted"
              style="font-size: 12px;"
              :class="{ 'text-warning': prod.stock < 25 }"
            >
              Stok: {{ prod.stock }} {{ prod.unit }}
            </span>
          </div>
          <button
            class="btn btn-primary btn-block"
            @click="addToCart(prod)"
            :disabled="prod.stock <= 0"
          >
            {{ prod.stock > 0 ? '+ Tambah ke Keranjang' : 'Stok Habis' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="!loading && products.length === 0" class="empty-state">
      Tidak ada produk yang cocok dengan pencarian Anda.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiFetch } from '../api';
import NavIcon from '../components/NavIcon.vue';

const products = ref<any[]>([]);
const search = ref('');
const selectedCategory = ref('');
const loading = ref(true);
const cartCount = ref(0);

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('kioskita_cart') || '[]');
  cartCount.value = cart.reduce((acc: number, item: any) => acc + item.quantity, 0);
}

async function fetchProducts() {
  loading.value = true;
  try {
    const q = new URLSearchParams();
    if (search.value) q.set('search', search.value);
    if (selectedCategory.value) q.set('category', selectedCategory.value);
    const res = await apiFetch(`/products?${q.toString()}`);
    if (res.success) {
      products.value = res.data;
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

function addToCart(product: any) {
  const cart = JSON.parse(localStorage.getItem('kioskita_cart') || '[]');
  const existing = cart.find((i: any) => i.product_id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      product_id: product.id,
      name: product.name,
      sku: product.sku,
      price: parseFloat(product.price),
      quantity: 1,
    });
  }
  localStorage.setItem('kioskita_cart', JSON.stringify(cart));
  updateCartCount();
}

onMounted(() => {
  fetchProducts();
  updateCartCount();
});
</script>
