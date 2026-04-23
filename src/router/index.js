import { createRouter, createWebHistory } from "vue-router";
import { checkPermission } from "../utils/permission";

const routes = [
  {
    path: "/",
    redirect: "/document-management",
  },
  {
    path: "/no-permission",
    name: "NoPermission",
    component: () => import("../views/NoPermission.vue"),
    meta: { title: "无权限" },
  },
  {
    path: "/init-document",
    name: "InitDocument",
    component: () => import("../views/InitDocument.vue"),
    meta: { title: "初始化文档目录", requiresAuth: true },
  },
  {
    path: "/document-management",
    name: "DocumentManagement",
    component: () => import("../views/DocumentManagement.vue"),
    meta: { title: "文档管理", requiresAuth: true },
  },
  {
    path: "/document-import",
    name: "DocumentImport",
    component: () => import("../views/DocumentImport.vue"),
    meta: { title: "文档导入", requiresAuth: true },
  },
  {
    path: "/pageOffice/EditWord",
    component: () => import("../views/pageOffice/EditWord.vue"),
    meta: { type: "pageOffice" },
  },
  {
    path: "/pageOffice/ReadWord",
    component: () => import("../views/pageOffice/ReadWord.vue"),
    meta: { type: "pageOffice" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title;
  }

  // 检查权限
  if (to.meta.requiresAuth) {
    const hasPermission = await checkPermission(to);
    if (!hasPermission) {
      // 获取权限拒绝信息
      const permissionDenied = sessionStorage.getItem("permissionDenied");
      if (permissionDenied) {
        const query = JSON.parse(permissionDenied);
        next({
          path: "/no-permission",
          query,
        });
        sessionStorage.removeItem("permissionDenied");
      } else {
        next("/no-permission");
      }
      return;
    }
  }

  next();
});

export default router;
