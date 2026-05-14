<template>
  <div class="layout-container">
    <el-container v-if="route?.meta?.type === 'pageOffice'">
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
    <el-container v-else>
      <el-header class="layout-header">
        <div class="header-left">
          <img src="/logo.png" class="app-logo" alt="logo" />
          <h1 class="app-title">文档管理系统</h1>
        </div>
        <div class="header-right">
          <el-dropdown>
            <span class="user-info">
              <el-icon><User /></el-icon>
              <span>用户名</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人中心</el-dropdown-item>
                <el-dropdown-item divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-container>
        <el-aside width="200px" class="layout-aside">
          <el-menu :default-active="activeMenu" router class="side-menu">
            <el-menu-item index="/document-import">
              <el-icon><Upload /></el-icon>
              <span class="menu-text">文档导入</span>
            </el-menu-item>
            <el-menu-item index="/document-export">
              <el-icon><Download /></el-icon>
              <span class="menu-text">文档导出</span>
            </el-menu-item>
          </el-menu>
        </el-aside>

        <el-main class="layout-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { User, Download, Upload, FolderAdd } from "@element-plus/icons-vue";

const route = useRoute();
console.log("route", route);

const activeMenu = computed(() => {
  return route.path;
});
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  color: black;
  padding: 0 20px;
  height: 50px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03), 
              0 2px 8px rgba(0, 0, 0, 0.05);
  /* border-bottom: 1px solid #ebeef5; */
  position: relative;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
}

.app-title {
  font-size: 16px;
  margin: 0;
}

.app-logo {
  width: 50px;
  height: 32px;
  margin-right: 10px;
  object-fit: contain;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  color: black;
}

.layout-aside {
  background-color: #fff;
  border-right: 1px solid #dcdfe6;
}

.side-menu {
  border-right: none;
}
.el-menu-item {
  height: 45px;

  border-radius: 4px;
  margin: 0px 1px;
}


.layout-main {
  background-color: #f5f7fa;
  padding: 0;
}

.menu-text {
  padding-left: 5px;
}
</style>
