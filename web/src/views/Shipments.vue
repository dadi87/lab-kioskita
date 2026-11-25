<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-title">Dokumen Pengiriman &amp; Resi</h2>
        <p class="page-subtitle">Pelacakan logistik dan pembuatan label pengiriman barang</p>
      </div>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state">Memuat data pengiriman...</div>
      <div v-else-if="shipments.length > 0" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>No. Resi (Tracking)</th>
              <th>No. Pesanan</th>
              <th>Penerima / Pelanggan</th>
              <th>Kurir</th>
              <th>Status Kirim</th>
              <th>Format Label</th>
              <th>Waktu Kirim</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in shipments" :key="s.id">
              <td class="mono" style="font-weight: 700; color: var(--color-info);">{{ s.tracking_number }}</td>
              <td><b>{{ s.order_number }}</b></td>
              <td>{{ s.customer_name }}</td>
              <td>{{ s.courier }}</td>
              <td>
                <span
                  class="badge"
                  :class="s.delivery_status === 'delivered' ? 'badge-primary' : 'badge-info'"
                >
                  {{ s.delivery_status }}
                </span>
              </td>
              <td><code>{{ s.label_format }}</code></td>
              <td class="text-muted" style="font-size: 12px;">{{ s.shipping_date || 'Manifested' }}</td>
              <td>
                <div style="display: flex; gap: 6px;">
                  <router-link :to="`/invoices/${s.order_id}`" class="btn btn-outline btn-sm">Faktur</router-link>
                  <button class="btn btn-outline btn-sm" @click="openLabelPreview(s)">Preview Label</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">Belum ada entri pengiriman yang dibuat.</div>
    </div>

    <!-- Modal Preview Label -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">CLI Shipping Label Generator</h3>
          <button class="icon-btn" type="button" aria-label="Tutup" @click="showModal = false">
            <NavIcon name="close" />
          </button>
        </div>

        <p class="text-muted" style="font-size: 13px; margin-bottom: 14px;">
          Pesanan: <b>{{ activeShipment?.order_number }}</b> — Kurir: <b>{{ activeShipment?.courier }}</b>
        </p>

        <div class="form-group">
          <label class="form-label">Template / Format Label:</label>
          <input v-model="selectedFormat" type="text" />
          <div class="form-hint">
            Contoh nilai format standar: <code>standard</code>, <code>thermal_100x150</code>, <code>pdf</code>
          </div>
        </div>

        <button class="btn btn-primary btn-sm" @click="runPreview" :disabled="generating">
          {{ generating ? 'Memproses di Server...' : 'Jalankan Preview CLI' }}
        </button>

        <div v-if="previewResult" style="margin-top: 14px;">
          <pre style="background: #0f172a; color: #7dd3fc; padding: 12px; border-radius: 8px; font-size: 12px; max-height: 200px; overflow-x: auto; margin: 0;">{{ previewResult }}</pre>
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline btn-sm" @click="showModal = false">Tutup</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiFetch } from '../api';
import NavIcon from '../components/NavIcon.vue';

const shipments = ref<any[]>([]);
const loading = ref(true);

const showModal = ref(false);
const activeShipment = ref<any>(null);
const selectedFormat = ref('standard');
const generating = ref(false);
const previewResult = ref('');

async function fetchShipments() {
  loading.value = true;
  try {
    const res = await apiFetch('/shipments');
    if (res.success && res.data) {
      shipments.value = res.data;
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

function openLabelPreview(shipment: any) {
  activeShipment.value = shipment;
  selectedFormat.value = shipment.label_format || 'standard';
  previewResult.value = '';
  showModal.value = true;
}

async function runPreview() {
  generating.value = true;
  previewResult.value = '';
  try {
    const res = await apiFetch('/labels/preview', {
      method: 'POST',
      body: JSON.stringify({
        order_id: activeShipment.value?.order_id,
        courier: activeShipment.value?.courier,
        format: selectedFormat.value,
      }),
    });

    if (res.success) {
      previewResult.value = res.preview;
    } else {
      previewResult.value = `Gagal: ${res.error}`;
    }
  } catch (err: any) {
    previewResult.value = `Error: ${err.message}`;
  } finally {
    generating.value = false;
  }
}

onMounted(() => {
  fetchShipments();
});
</script>
