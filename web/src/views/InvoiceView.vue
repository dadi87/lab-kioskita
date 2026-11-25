<template>
  <div style="max-width: 820px; margin: 0 auto;">
    <div class="page-header no-print">
      <router-link :to="`/orders/${orderId}`" class="text-muted" style="font-size: 13px;">
        &larr; Kembali ke Detail Pesanan
      </router-link>
      <button class="btn btn-outline btn-sm" @click="printInvoice">🖨️ Cetak Faktur</button>
    </div>

    <div v-if="loading" class="loading-state">Memuat dokumen faktur...</div>
    <div v-else-if="invoice" class="invoice-doc">
      <!-- Header Faktur -->
      <div class="invoice-header">
        <div>
          <h1 class="invoice-title">FAKTUR PENJUALAN</h1>
          <div class="text-muted" style="font-size: 13px; margin-top: 4px;">
            {{ invoice.tenant_name }} ({{ invoice.tenant_code }})
          </div>
          <div class="text-soft" style="font-size: 12px;">Distribusi Perlengkapan Rumah Tangga</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 700; font-size: 16px;">{{ invoice.order_number }}</div>
          <div class="text-muted" style="font-size: 13px;">Tanggal: {{ invoice.created_at }}</div>
          <div style="margin-top: 6px;">
            <span class="badge badge-primary">LUNAS / TERCATAT</span>
          </div>
        </div>
      </div>

      <!-- Informasi Pelanggan & Pengiriman -->
      <div class="invoice-meta-grid">
        <div>
          <b style="color: #475569;">Ditagihkan Kepada:</b>
          <div style="font-weight: 600; font-size: 15px; margin-top: 4px;">{{ invoice.customer_name }}</div>
          <div>Email: {{ invoice.customer_email }}</div>
          <div>Telp: {{ invoice.customer_phone || '-' }}</div>
        </div>
        <div>
          <b style="color: #475569;">Alamat Pengiriman &amp; Kurir:</b>
          <div style="font-weight: 600; margin-top: 4px;">Penerima: {{ invoice.recipient_name }}</div>
          <div>{{ invoice.address_line }}, {{ invoice.city }} {{ invoice.postal_code }}</div>
          <div class="mono" style="margin-top: 4px; color: var(--color-info);">
            Resi: {{ invoice.tracking_number || 'Belum Terbit' }} ({{ invoice.courier || 'Kurir Standar' }})
          </div>
        </div>
      </div>

      <!-- Tabel Produk -->
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>SKU</th>
              <th>Nama Barang</th>
              <th>Harga</th>
              <th>Qty</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(it, idx) in invoice.items" :key="it.id">
              <td>{{ idx + 1 }}</td>
              <td class="mono">{{ it.sku }}</td>
              <td><b>{{ it.product_name }}</b></td>
              <td>Rp {{ Number(it.unit_price).toLocaleString('id-ID') }}</td>
              <td>{{ it.quantity }}</td>
              <td style="text-align: right;">Rp {{ Number(it.total_price).toLocaleString('id-ID') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Kalkulasi -->
      <div class="invoice-totals">
        <div class="invoice-total-row">
          <span>Subtotal:</span>
          <span>Rp {{ Number(invoice.subtotal).toLocaleString('id-ID') }}</span>
        </div>
        <div v-if="invoice.discount > 0" class="invoice-total-row" style="color: var(--color-success);">
          <span>Potongan Kupon:</span>
          <span>- Rp {{ Number(invoice.discount).toLocaleString('id-ID') }}</span>
        </div>
        <div class="invoice-total-row">
          <span>Biaya Kirim:</span>
          <span>Rp {{ Number(invoice.shipping_cost).toLocaleString('id-ID') }}</span>
        </div>
        <div class="invoice-grand-total">
          <span>Total Tagihan:</span>
          <span class="amount">Rp {{ Number(invoice.grand_total).toLocaleString('id-ID') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { apiFetch } from '../api';

const route = useRoute();
const orderId = ref(route.params.id);
const invoice = ref<any>(null);
const loading = ref(true);

async function fetchInvoice() {
  loading.value = true;
  try {
    const res = await apiFetch(`/invoices/${orderId.value}`);
    if (res.success && res.data) {
      invoice.value = res.data;
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

function printInvoice() {
  window.print();
}

onMounted(() => {
  fetchInvoice();
});
</script>
