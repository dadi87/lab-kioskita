<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-title">Keranjang Belanja</h2>
        <p class="page-subtitle">Tinjau item pesanan sebelum membuat pesanan distribusi</p>
      </div>
    </div>

    <div v-if="cartItems.length === 0" class="card empty-state">
      <p style="font-size: 16px;">Keranjang Anda masih kosong.</p>
      <router-link to="/catalog" class="btn btn-primary">Lihat Katalog Produk</router-link>
    </div>

    <div v-else class="cart-layout">
      <!-- Daftar Item Keranjang -->
      <div>
        <div class="card">
          <div class="card-header">
            <h3 class="section-title">Item dalam Keranjang ({{ cartItems.length }})</h3>
          </div>
          <div class="table-wrap">
            <table class="cart-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Harga</th>
                  <th style="width: 110px;">Jumlah</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in cartItems" :key="item.product_id">
                  <td data-label="Produk">
                    <b>{{ item.name }}</b>
                    <div class="text-soft mono" style="font-size: 11px;">{{ item.sku }}</div>
                  </td>
                  <td data-label="Harga">Rp {{ item.price.toLocaleString('id-ID') }}</td>
                  <td data-label="Jumlah">
                    <input
                      type="number"
                      min="1"
                      v-model.number="item.quantity"
                      @change="saveCart"
                      style="width: 74px; padding: 6px 8px;"
                    />
                  </td>
                  <td data-label="Total">Rp {{ (item.price * item.quantity).toLocaleString('id-ID') }}</td>
                  <td data-label="Aksi">
                    <button class="btn btn-outline btn-sm" @click="removeItem(idx)" style="color: var(--color-danger); border-color: #fca5a5;">
                      Hapus
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pemilihan Alamat Pengiriman -->
        <div class="card">
          <div class="card-header">
            <h3 class="section-title">Alamat Tujuan Pengiriman</h3>
          </div>
          <div v-if="addresses.length > 0">
            <label v-for="addr in addresses" :key="addr.id" class="address-option">
              <input type="radio" name="address" :value="addr.id" v-model="selectedAddressId" />
              <span style="font-size: 13px;">
                <b>{{ addr.recipient_name }}</b> ({{ addr.phone }})<br />
                <span class="text-muted">
                  {{ addr.address_line }}, {{ addr.city }} {{ addr.postal_code }}
                </span>
              </span>
            </label>
          </div>
          <div v-else class="text-muted" style="font-size: 13px;">
            Belum ada alamat tersimpan. <router-link to="/profile">Tambah Alamat di Profil</router-link>
          </div>
        </div>
      </div>

      <!-- Ringkasan Pembayaran & Kupon -->
      <div>
        <div class="card">
          <div class="card-header">
            <h3 class="section-title">Ringkasan Belanja</h3>
          </div>

          <!-- Form Kupon -->
          <div class="form-group">
            <label class="form-label">Kupon Diskon</label>
            <div style="display: flex; gap: 6px;">
              <input v-model="couponCode" type="text" placeholder="Ketik kode kupon..." style="text-transform: uppercase;" />
              <button class="btn btn-outline btn-sm" @click="applyCoupon" :disabled="checkingCoupon">
                Terapkan
              </button>
            </div>
            <div
              v-if="couponMessage"
              class="form-hint"
              :style="{ color: couponDiscount > 0 ? 'var(--color-success)' : 'var(--color-danger)' }"
            >
              {{ couponMessage }}
            </div>
            <div class="form-hint">
              Kupon uji lab: <code>HEMAT10</code>, <code>DISKON50K</code>, <code>GRATISONGKIR</code>
            </div>
          </div>

          <hr />

          <div class="summary-row">
            <span class="label">Subtotal Barang:</span>
            <span>Rp {{ subtotal.toLocaleString('id-ID') }}</span>
          </div>

          <div v-if="couponDiscount > 0" class="summary-row" style="color: var(--color-success);">
            <span>Potongan Kupon ({{ appliedCouponCode }}):</span>
            <span>- Rp {{ couponDiscount.toLocaleString('id-ID') }}</span>
          </div>

          <div class="summary-row">
            <span class="label">Biaya Pengiriman:</span>
            <span>Rp {{ shippingCost.toLocaleString('id-ID') }}</span>
          </div>

          <div class="summary-total">
            <span>Total Tagihan:</span>
            <span class="amount">Rp {{ grandTotal.toLocaleString('id-ID') }}</span>
          </div>

          <button
            class="btn btn-primary btn-block"
            @click="submitOrder"
            :disabled="submitting || cartItems.length === 0"
          >
            {{ submitting ? 'Memproses Pesanan...' : 'Buat Pesanan Sekarang' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiFetch } from '../api';

const router = useRouter();
const cartItems = ref<any[]>([]);
const addresses = ref<any[]>([]);
const selectedAddressId = ref<number | null>(null);

const couponCode = ref('');
const appliedCouponCode = ref('');
const couponDiscount = ref(0);
const couponMessage = ref('');
const checkingCoupon = ref(false);
const shippingCost = ref(15000);
const submitting = ref(false);

const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

const grandTotal = computed(() => {
  return Math.max(0, subtotal.value - couponDiscount.value + shippingCost.value);
});

function loadCart() {
  cartItems.value = JSON.parse(localStorage.getItem('kioskita_cart') || '[]');
}

function saveCart() {
  localStorage.setItem('kioskita_cart', JSON.stringify(cartItems.value));
}

function removeItem(idx: number) {
  cartItems.value.splice(idx, 1);
  saveCart();
}

async function loadAddresses() {
  try {
    const res = await apiFetch('/addresses');
    if (res.success && res.data) {
      addresses.value = res.data;
      if (res.data.length > 0) {
        selectedAddressId.value = res.data[0].id;
      }
    }
  } catch (err) {
    console.error(err);
  }
}

async function applyCoupon() {
  if (!couponCode.value.trim()) return;
  checkingCoupon.value = true;
  couponMessage.value = '';
  try {
    const res = await apiFetch('/coupons/verify', {
      method: 'POST',
      body: JSON.stringify({
        code: couponCode.value.trim(),
        subtotal: subtotal.value,
      }),
    });

    if (res.success && res.coupon) {
      appliedCouponCode.value = res.coupon.code;
      couponDiscount.value = res.coupon.discount_amount;
      couponMessage.value = res.message;
    } else {
      couponDiscount.value = 0;
      appliedCouponCode.value = '';
      couponMessage.value = res.error || 'Kupon tidak dapat digunakan';
    }
  } catch (err: any) {
    couponMessage.value = err.message || 'Gagal memverifikasi kupon';
  } finally {
    checkingCoupon.value = false;
  }
}

async function submitOrder() {
  submitting.value = true;
  try {
    const payload = {
      items: cartItems.value,
      shipping_address_id: selectedAddressId.value,
      coupon_code: appliedCouponCode.value || null,
      shipping_cost: shippingCost.value,
    };

    const res = await apiFetch('/cart/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success && res.order) {
      localStorage.removeItem('kioskita_cart');
      alert(`Pesanan berhasil dibuat: ${res.order.order_number}`);
      router.push(`/orders/${res.order.id}`);
    } else {
      alert(`Gagal membuat pesanan: ${res.error || 'Terjadi kesalahan'}`);
    }
  } catch (err: any) {
    alert(`Error: ${err.message}`);
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadCart();
  loadAddresses();
});
</script>
