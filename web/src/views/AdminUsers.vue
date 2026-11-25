<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-title">Manajemen Pengguna &amp; Staf</h2>
        <p class="page-subtitle">Area Khusus Administrator Pusat KiosKita</p>
      </div>
      <button class="btn btn-primary" @click="showAddModal = true">
        <NavIcon name="plus" /> Tambah Akun Pengguna
      </button>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state">Memuat data pengguna...</div>
      <div v-else-if="users.length > 0" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Lengkap</th>
              <th>Email</th>
              <th>Role</th>
              <th>Tenant / Unit Usaha</th>
              <th>Telepon</th>
              <th>Terdaftar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td>#{{ u.id }}</td>
              <td><b>{{ u.name }}</b></td>
              <td>{{ u.email }}</td>
              <td><span class="badge" :class="roleBadge(u.role)">{{ u.role }}</span></td>
              <td><span class="badge badge-secondary">{{ u.tenant_name }}</span></td>
              <td>{{ u.phone || '-' }}</td>
              <td class="text-muted" style="font-size: 12px;">{{ u.created_at }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">Belum ada pengguna terdaftar.</div>
    </div>

    <!-- Modal Tambah User -->
    <div v-if="showAddModal" class="modal-overlay">
      <div class="modal" style="max-width: 480px;">
        <div class="modal-header">
          <h3 class="modal-title">Tambah Pengguna Baru</h3>
          <button class="icon-btn" type="button" aria-label="Tutup" @click="showAddModal = false">
            <NavIcon name="close" />
          </button>
        </div>

        <form @submit.prevent="submitAddUser">
          <div class="form-group">
            <label class="form-label">Nama Lengkap:</label>
            <input v-model="newUser.name" type="text" required />
          </div>

          <div class="form-group">
            <label class="form-label">Email Akun:</label>
            <input v-model="newUser.email" type="email" required />
          </div>

          <div class="form-group">
            <label class="form-label">Kata Sandi Awal:</label>
            <input v-model="newUser.password" type="password" required />
          </div>

          <div class="form-grid form-grid-2 form-group">
            <div>
              <label class="form-label">Role:</label>
              <select v-model="newUser.role">
                <option value="customer">customer</option>
                <option value="staff">staff</option>
                <option value="manager">manager</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div>
              <label class="form-label">Tenant:</label>
              <select v-model.number="newUser.tenant_id">
                <option :value="1">CV Sumber Rejeki</option>
                <option :value="2">UD Berkah Jaya</option>
              </select>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-outline btn-sm" @click="showAddModal = false">Batal</button>
            <button type="submit" class="btn btn-primary btn-sm">Simpan Pengguna</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiFetch } from '../api';
import NavIcon from '../components/NavIcon.vue';

const users = ref<any[]>([]);
const loading = ref(true);
const showAddModal = ref(false);
const newUser = ref({ name: '', email: '', password: 'password123', role: 'staff', tenant_id: 1, phone: '' });

async function fetchUsers() {
  loading.value = true;
  try {
    const res = await apiFetch('/admin/users');
    if (res.success && res.data) {
      users.value = res.data;
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

async function submitAddUser() {
  try {
    const res = await apiFetch('/admin/users', {
      method: 'POST',
      body: JSON.stringify(newUser.value),
    });

    if (res.success) {
      alert('Pengguna baru berhasil ditambahkan');
      showAddModal.value = false;
      newUser.value = { name: '', email: '', password: 'password123', role: 'staff', tenant_id: 1, phone: '' };
      await fetchUsers();
    } else {
      alert(`Gagal: ${res.error}`);
    }
  } catch (err: any) {
    alert(`Error: ${err.message}`);
  }
}

function roleBadge(role: string) {
  switch (role) {
    case 'admin': return 'badge-danger';
    case 'manager': return 'badge-warning';
    case 'staff': return 'badge-info';
    default: return 'badge-primary';
  }
}

onMounted(() => {
  fetchUsers();
});
</script>
