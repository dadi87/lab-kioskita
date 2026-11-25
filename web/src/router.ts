import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { getToken, getCurrentUser } from './api';

import Login from './views/Login.vue';
import Dashboard from './views/Dashboard.vue';
import Catalog from './views/Catalog.vue';
import Cart from './views/Cart.vue';
import Orders from './views/Orders.vue';
import OrderDetail from './views/OrderDetail.vue';
import Shipments from './views/Shipments.vue';
import Profile from './views/Profile.vue';
import AdminUsers from './views/AdminUsers.vue';
import InvoiceView from './views/InvoiceView.vue';

const routes: RouteRecordRaw[] = [
  { path: '/login', component: Login, meta: { guest: true } },
  { path: '/', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/catalog', component: Catalog, meta: { requiresAuth: true } },
  { path: '/cart', component: Cart, meta: { requiresAuth: true, roles: ['customer'] } },
  { path: '/orders', component: Orders, meta: { requiresAuth: true } },
  { path: '/orders/:id', component: OrderDetail, meta: { requiresAuth: true } },
  { path: '/invoices/:id', component: InvoiceView, meta: { requiresAuth: true } },
  { path: '/shipments', component: Shipments, meta: { requiresAuth: true } },
  { path: '/profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/admin/users', component: AdminUsers, meta: { requiresAuth: true, roles: ['admin'] } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const token = getToken();
  if (to.meta.requiresAuth && !token) {
    return next('/login');
  }
  if (to.meta.guest && token) {
    return next('/');
  }

  const allowedRoles = to.meta.roles as string[] | undefined;
  if (allowedRoles && allowedRoles.length > 0) {
    const currentUser = getCurrentUser();
    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return next('/');
    }
  }

  next();
});

export default router;

