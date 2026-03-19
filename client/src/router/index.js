import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import MainLayout from '../views/MainLayout.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import DashboardView from '../views/DashboardView.vue';
import MeetingDetailView from '../views/MeetingDetailView.vue';
import VotingView from '../views/VotingView.vue';
import AdminResultsView from '../views/AdminResultsView.vue';
import AboutView from '../views/AboutView.vue';

const routes = [
  { path: '/login', name: 'login', component: LoginView },
  { path: '/register', name: 'register', component: RegisterView },
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', name: 'dashboard', component: DashboardView },
      { path: 'voting', name: 'voting', component: VotingView },
      { path: 'about', name: 'about', component: AboutView },
      { path: 'meeting/:id', name: 'meeting-detail', component: MeetingDetailView },
      { path: 'admin/results/:id', name: 'admin-results', component: AdminResultsView }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  const isPublic = ['login', 'register'].includes(to.name);

  if (!isPublic && !auth.isAuthenticated) {
    return next({ name: 'login' });
  }

  next();
});

export default router;

