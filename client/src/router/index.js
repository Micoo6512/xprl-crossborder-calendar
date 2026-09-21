import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: '节日选品日历' },
  },
  {
    path: '/pricing',
    name: 'pricing',
    component: () => import('../views/PricingView.vue'),
    meta: { title: '会员定价' },
  },
  {
    path: '/account',
    name: 'account',
    component: () => import('../views/AccountView.vue'),
    meta: { title: '个人中心', requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach((to) => {
  document.title = to.meta.title
    ? `${to.meta.title} - 跨境选品日历`
    : '跨境选品日历';
  return true;
});

export default router;
