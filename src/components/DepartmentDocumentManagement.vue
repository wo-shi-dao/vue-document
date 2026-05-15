<template>
  <div class="department-document-management">
    <!-- 顶部区域 -->
    <div class="department-selector">
      <el-button
        v-if="templateName"
        link
        type="primary"
        @click="handleBack"
        style="margin-right: 12px"
      >
        <el-icon><arrow-left /></el-icon>
        返回
      </el-button>
      <span
        v-if="templateName"
        class="template-name-display"
        style="font-size: 16px; font-weight: 500; margin-right: 16px"
      >
        {{ templateName }}
      </span>
    </div>

    <!-- 文档管理区域 -->
    <div class="document-content">
      <!-- 操作按钮 -->
      <div class="table-head">
        <el-button type="primary" @click="handleShowUploadDialog">
          上传
        </el-button>
        <d-button
          class="table-head-button"
          variant="solid"
          color="secondary"
          @click="handleCreateFolder"
        >
          新建文件夹
        </d-button>
        <DateTimeRangeFilter :category="category" @search="handleSearch" />
      </div>

      <!-- 文档表格 -->
      <el-table
        :data="documentList"
        style="width: 100%"
        border
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        lazy
        :load="loadTreeChildren"
        v-loading="loading"
        default-expand-all
      >
        <el-table-column prop="name" label="文档目录名称" min-width="220">
          <template #default="{ row }">
            <span
              class="file-icon"
              v-html="getOfficeIconSvg(row.type, row?.children)"
            ></span>
            <span class="name-text">{{ row.name }}</span>
            <el-tag
              v-if="row?.tag === 'new'"
              type="danger"
              size="small"
              style="margin-left: 6px"
            >
              NEW
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="modifier" label="修改人" width="120" />
        <el-table-column prop="modifyTime" label="修改时间" width="180" />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <template v-if="row.isFolder">
              <el-button link type="primary" @click="handleRenameFolder(row)">
                重命名
              </el-button>
              <el-button link type="primary" @click="handleShowUploadDialog">
                上传
              </el-button>
              <el-button
                link
                type="danger"
                @click="handleDeleteFolder(row)"
              >
                删除
              </el-button>
            </template>
            <template v-else>
              <el-button
                link
                type="primary"
                @click.prevent="handleViewDocument(row)"
              >
                查看
              </el-button>
              <el-button
                link
                type="primary"
                @click.prevent="handleEditDocument(row)"
              >
                编辑
              </el-button>
              <el-button link type="danger" @click="handleDeleteDocument(row)">
                删除
              </el-button>
              <el-button
                link
                type="primary"
                @click="handleDownloadDocument(row)"
              >
                下载
              </el-button>
              <el-button link type="primary" @click="handleRenameDocument(row)">
                重命名
              </el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-config-provider :locale="zhCn">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </el-config-provider>
    </div>

    <!-- 新增文件夹弹窗 -->
    <el-dialog v-model="showAddFolderDialog" title="新增文件夹" width="500px">
      <el-form
        :model="folderForm"
        :rules="folderRules"
        ref="folderFormRef"
        label-width="100px"
      >
        <el-form-item label="文件夹名称" prop="name">
          <el-input
            v-model="folderForm.name"
            placeholder="请输入文件夹名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="所属文件夹">
          <el-tree-select
            v-model="folderForm.parentId"
            :data="folderTreeData"
            placeholder="请选择文件夹(不选则为根目录)"
            clearable
            check-strictly
            style="width: 100%"
          >
            <template #default="{ data: { label } }">
              <div class="folder-laber">
                <span class="file-icon" v-html="folderIcon"></span>{{ label }}
              </div>
            </template>
          </el-tree-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddFolderDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddFolder">确定</el-button>
      </template>
    </el-dialog>

    <!-- 重命名弹窗 -->
    <el-dialog v-model="showRenameDialog" title="重命名" width="500px">
      <el-form
        :model="renameForm"
        :rules="renameRules"
        ref="renameFormRef"
        label-width="100px"
      >
        <el-form-item label="名称" prop="name">
          <el-input
            v-model="renameForm.name"
            placeholder="请输入名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRenameDialog = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmRename">确定</el-button>
      </template>
    </el-dialog>

    <!-- 上传弹窗 -->
    <el-dialog v-model="showUploadDialog" title="上传" width="500px">
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        :file-list="fileList"
        accept=".doc,.docx,.xls,.xlsx,.pdf"
        multiple
        drag
        style="margin-bottom: 10px"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">点击或拖拽文件到此处上传</div>
        <div class="upload_text_tip">
          支持 .doc, .docx, .xls, .xlsx, .pdf 格式
        </div>
      </el-upload>

      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmUpload">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import { POBrowser } from "js-pageoffice";
import DateTimeRangeFilter from "./DateTimeRangeFilter.vue";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import {
  downloadDocument,
} from "../api/document";

// Props
const props = defineProps({
  templateId: {
    type: String,
    default: "",
  },
  templateName: {
    type: String,
    default: "",
  },
});

// Emits
const emit = defineEmits(["back"]);

const handleBack = () => {
  emit("back");
};

// 响应式数据
const loading = ref(false);
const documentList = ref([]);

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0,
});

const category = ref([
  {
    label: "创建人",
    field: "creator",
    type: "textInput",
    group: "Basic",
  },
  {
    label: "创建时间",
    field: "createTime",
    type: "custom",
    group: "Basic",
  },
]);

// 文档列表模拟数据 - 根据 InitDocument.vue 的 mockTreeData 结构
const mockDocumentData = {
  1: [
    {
      id: "1",
      name: "项目文档",
      isFolder: true,
      creator: "admin",
      createTime: "2025-01-01 16:30:00",
      modifier: "admin",
      modifyTime: "2025-01-01 18:30:00",
      children: [
        {
          id: "2",
          name: "需求文档.docx",
          type: "word",
          isFolder: false,
          creator: "张三",
          createTime: "2025-01-02 10:00:00",
          modifier: "张三",
          modifyTime: "2025-01-02 11:00:00",
        },
        {
          id: "3",
          name: "设计文档.pdf",
          type: "ppt",
          isFolder: false,
          creator: "李四",
          createTime: "2025-01-02 14:00:00",
          modifier: "李四",
          modifyTime: "2025-01-02 15:00:00",
        },
        {
          id: "4",
          name: "计划文档.xlsx",
          type: "excel",
          isFolder: false,
          creator: "王五",
          createTime: "2025-01-02 16:00:00",
          modifier: "王五",
          modifyTime: "2025-01-02 17:00:00",
        },
      ],
    },
    {
      id: "5",
      name: "技术文档",
      isFolder: true,
      creator: "admin",
      createTime: "2025-01-03 08:30:00",
      modifier: "admin",
      modifyTime: "2025-01-03 09:30:00",
      children: [
        {
          id: "6",
          name: "接口文档.docx",
          type: "word",
          isFolder: false,
          creator: "张三",
          createTime: "2025-01-03 10:00:00",
          modifier: "张三",
          modifyTime: "2025-01-03 11:00:00",
        },
        {
          id: "7",
          name: "部署文档.docx",
          type: "word",
          isFolder: false,
          creator: "李四",
          createTime: "2025-01-03 14:00:00",
          modifier: "李四",
          modifyTime: "2025-01-03 15:00:00",
        },
        {
          id: "8",
          name: "架构文档.xlsx",
          type: "excel",
          isFolder: false,
          creator: "王五",
          createTime: "2025-01-03 16:00:00",
          modifier: "王五",
          modifyTime: "2025-01-03 17:00:00",
        },
        {
          id: "9",
          name: "数据库文档",
          isFolder: true,
          creator: "admin",
          createTime: "2025-01-04 08:00:00",
          modifier: "admin",
          modifyTime: "2025-01-04 09:00:00",
          children: [
            {
              id: "10",
              name: "ER图文档.xlsx",
              type: "excel",
              isFolder: false,
              creator: "张三",
              createTime: "2025-01-04 10:00:00",
              modifier: "张三",
              modifyTime: "2025-01-04 11:00:00",
            },
            {
              id: "11",
              name: "表结构文档.pdf",
              type: "ppt",
              isFolder: false,
              creator: "李四",
              createTime: "2025-01-04 14:00:00",
              modifier: "李四",
              modifyTime: "2025-01-04 15:00:00",
            },
          ],
        },
      ],
    },
    {
      id: "12",
      name: "管理文档",
      isFolder: true,
      creator: "admin",
      createTime: "2025-01-05 08:00:00",
      modifier: "admin",
      modifyTime: "2025-01-05 09:00:00",
      children: [
        {
          id: "13",
          name: "会议纪要文档.docx",
          type: "word",
          isFolder: false,
          creator: "张三",
          createTime: "2025-01-05 10:00:00",
          modifier: "张三",
          modifyTime: "2025-01-05 11:00:00",
        },
        {
          id: "14",
          name: "风险评估文档.pdf",
          type: "ppt",
          isFolder: false,
          creator: "李四",
          createTime: "2025-01-05 14:00:00",
          modifier: "李四",
          modifyTime: "2025-01-05 15:00:00",
        },
        {
          id: "15",
          name: "进度报告文档.docx",
          type: "word",
          isFolder: false,
          creator: "王五",
          createTime: "2025-01-05 16:00:00",
          modifier: "王五",
          modifyTime: "2025-01-05 17:00:00",
        },
      ],
    },
    {
      id: "16",
      name: "用户文档",
      isFolder: true,
      creator: "admin",
      createTime: "2025-01-06 08:00:00",
      modifier: "admin",
      modifyTime: "2025-01-06 09:00:00",
      children: [
        {
          id: "17",
          name: "用户手册文档.docx",
          type: "word",
          isFolder: false,
          creator: "张三",
          createTime: "2025-01-06 10:00:00",
          modifier: "张三",
          modifyTime: "2025-01-06 11:00:00",
        },
        {
          id: "18",
          name: "安装指南文档.xlsx",
          type: "excel",
          isFolder: false,
          creator: "李四",
          createTime: "2025-01-06 14:00:00",
          modifier: "李四",
          modifyTime: "2025-01-06 15:00:00",
        },
        {
          id: "19",
          name: "FAQ文档.docx",
          type: "word",
          isFolder: false,
          creator: "王五",
          createTime: "2025-01-06 16:00:00",
          modifier: "王五",
          modifyTime: "2025-01-06 17:00:00",
        },
        {
          id: "20",
          name: "更新日志文档.pdf",
          type: "ppt",
          isFolder: false,
          creator: "张三",
          createTime: "2025-01-06 18:00:00",
          modifier: "张三",
          modifyTime: "2025-01-06 19:00:00",
        },
      ],
    },
  ],
  2: [
    {
      id: "1",
      name: "项目文档",
      isFolder: true,
      creator: "admin",
      createTime: "2025-01-01 16:30:00",
      modifier: "admin",
      modifyTime: "2025-01-01 18:30:00",
      children: [
        {
          id: "2",
          name: "需求文档.docx",
          type: "word",
          tag: "old",
          isFolder: false,
          creator: "李四",
          createTime: "2025-01-02 10:00:00",
          modifier: "李四",
          modifyTime: "2025-01-02 11:00:00",
        },
      ],
    },
    {
      id: "5",
      name: "技术文档",
      isFolder: true,
      creator: "admin",
      createTime: "2025-01-03 08:30:00",
      modifier: "admin",
      modifyTime: "2025-01-03 09:30:00",
      children: [
        {
          id: "6",
          name: "接口文档.docx",
          type: "word",
          isFolder: false,
          creator: "李四",
          createTime: "2025-01-03 10:00:00",
          modifier: "李四",
          modifyTime: "2025-01-03 11:00:00",
        },
      ],
    },
  ],
  3: [
    {
      id: "1",
      name: "项目文档",
      isFolder: true,
      creator: "admin",
      createTime: "2025-01-01 16:30:00",
      modifier: "admin",
      modifyTime: "2025-01-01 18:30:00",
      children: [
        {
          id: "2",
          name: "需求文档.docx",
          type: "word",
          isFolder: false,
          creator: "王五",
          createTime: "2025-01-02 10:00:00",
          modifier: "王五",
          modifyTime: "2025-01-02 11:00:00",
        },
        {
          id: "3",
          name: "设计文档.pdf",
          type: "ppt",
          isFolder: false,
          creator: "王五",
          createTime: "2025-01-02 14:00:00",
          modifier: "王五",
          modifyTime: "2025-01-02 15:00:00",
        },
      ],
    },
  ],
  4: [
    {
      id: "12",
      name: "管理文档",
      isFolder: true,
      creator: "admin",
      createTime: "2025-01-05 08:00:00",
      modifier: "admin",
      modifyTime: "2025-01-05 09:00:00",
      children: [
        {
          id: "13",
          name: "会议纪要文档.docx",
          type: "word",
          isFolder: false,
          creator: "张三",
          createTime: "2025-01-05 10:00:00",
          modifier: "张三",
          modifyTime: "2025-01-05 11:00:00",
        },
      ],
    },
  ],
  5: [
    {
      id: "16",
      name: "用户文档",
      isFolder: true,
      creator: "admin",
      createTime: "2025-01-06 08:00:00",
      modifier: "admin",
      modifyTime: "2025-01-06 09:00:00",
      children: [
        {
          id: "17",
          name: "用户手册文档.docx",
          type: "word",
          isFolder: false,
          creator: "李四",
          createTime: "2025-01-06 10:00:00",
          modifier: "李四",
          modifyTime: "2025-01-06 11:00:00",
        },
        {
          id: "18",
          name: "安装指南文档.xlsx",
          type: "excel",
          isFolder: false,
          creator: "李四",
          createTime: "2025-01-06 14:00:00",
          modifier: "李四",
          modifyTime: "2025-01-06 15:00:00",
        },
      ],
    },
  ],
  6: [
    {
      id: "5",
      name: "技术文档",
      isFolder: true,
      creator: "admin",
      createTime: "2025-01-03 08:30:00",
      modifier: "admin",
      modifyTime: "2025-01-03 09:30:00",
      children: [
        {
          id: "8",
          name: "架构文档.xlsx",
          type: "excel",
          isFolder: false,
          creator: "王五",
          createTime: "2025-01-03 16:00:00",
          modifier: "王五",
          modifyTime: "2025-01-03 17:00:00",
        },
      ],
    },
  ],
  7: [
    {
      id: "12",
      name: "管理文档",
      isFolder: true,
      creator: "admin",
      createTime: "2025-01-05 08:00:00",
      modifier: "admin",
      modifyTime: "2025-01-05 09:00:00",
      children: [
        {
          id: "14",
          name: "风险评估文档.pdf",
          type: "ppt",
          isFolder: false,
          creator: "张三",
          createTime: "2025-01-05 14:00:00",
          modifier: "张三",
          modifyTime: "2025-01-05 15:00:00",
        },
      ],
    },
  ],
};

// 文件夹目录
const folderTreeData = ref([]);

const folderIcon = `
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H12L10 4Z" fill="#F7C331"/>
  </svg>
`;

// 新增文件夹
const showAddFolderDialog = ref(false);
const folderFormRef = ref(null);
const folderForm = reactive({
  name: "",
  parentId: "",
});
const folderRules = {
  name: [{ required: true, message: "请输入文件夹名称", trigger: "blur" }],
};

// 重命名
const showRenameDialog = ref(false);
const renameFormRef = ref(null);
const renameForm = reactive({
  name: "",
  id: "",
  isFolder: false,
});
const renameRules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
};

// 上传
const showUploadDialog = ref(false);
const uploadRef = ref(null);
const fileList = ref([]);
const showFileList = ref([]);

// 加载文档列表
const loadDocumentList = async () => {
  if (!props.templateId) {
    documentList.value = [];
    return;
  }

  loading.value = true;
  try {
    documentList.value = mockDocumentData[props.templateId] || [];
    pagination.total = documentList.value.length;
  } catch (error) {
    ElMessage.error("获取文档列表失败");
  } finally {
    loading.value = false;
  }
};

// 树形表格懒加载
const loadTreeChildren = (row, treeNode, resolve) => {
  setTimeout(() => {
    resolve(row.children || []);
  }, 100);
};

// 图标
const getOfficeIconSvg = (type, children) => {
  const size = 24;
  if (children != undefined) {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H12L10 4Z" fill="#F7C331"/>
      </svg>
    `;
  }
  if (type === "word") {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H14L20 10V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z" fill="#2B57D9"/>
        <path d="M14 4V10H20" fill="white" opacity="0.3"/>
        <text x="12" y="16" font-size="10" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">W</text>
      </svg>
    `;
  }
  if (type === "excel") {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H14L20 10V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z" fill="#21A366"/>
        <path d="M14 4V10H20" fill="white" opacity="0.3"/>
        <text x="12" y="16" font-size="10" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">X</text>
      </svg>
    `;
  }
  if (type === "ppt") {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H14L20 10V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z" fill="#D24726"/>
        <path d="M14 4V10H20" fill="white" opacity="0.3"/>
        <text x="12" y="16" font-size="10" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">P</text>
      </svg>
    `;
  }
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4H14L20 10V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z" fill="#c0c6cc"/>
      <path d="M14 4V10H20" fill="white" opacity="0.3"/>
    </svg>
  `;
};

// 分页
const handlePageSizeChange = () => {
  pagination.current = 1;
  loadDocumentList();
};

const handleSearch = (selectedTags) => {
  console.log("selectedTags", selectedTags);
  pagination.current = 1;
  loadDocumentList();
};

const handlePageChange = () => {
  loadDocumentList();
};

const handleCreateFolder = () => {
  folderForm.name = "";
  folderForm.parentId = "";
  updateFolderTreeData();
  showAddFolderDialog.value = true;
};

const updateFolderTreeData = () => {
  const buildTree = (items) => {
    return items
      .filter(item => item.isFolder)
      .map(item => ({
        value: item.id,
        label: item.name,
        children: item.children ? buildTree(item.children) : undefined
      }));
  };
  
  folderTreeData.value = buildTree(documentList.value);
};

const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

const handleAddFolder = async () => {
  try {
    await folderFormRef.value.validate();
    
    const newFolder = {
      id: generateId(),
      name: folderForm.name,
      isFolder: true,
      creator: "当前用户",
      createTime: new Date().toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      }).replace(/\//g, '-'),
      modifier: "当前用户",
      modifyTime: new Date().toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      }).replace(/\//g, '-'),
      children: []
    };

    if (folderForm.parentId) {
      const addToFolder = (items, parentId, newFolder) => {
        for (let item of items) {
          if (item.id === parentId && item.isFolder) {
            if (!item.children) {
              item.children = [];
            }
            item.children.push(newFolder);
            return true;
          }
          if (item.children && addToFolder(item.children, parentId, newFolder)) {
            return true;
          }
        }
        return false;
      };
      
      addToFolder(documentList.value, folderForm.parentId, newFolder);
    } else {
      documentList.value.push(newFolder);
    }
    
    pagination.total = documentList.value.length;
    
    ElMessage.success("新增成功");
    showAddFolderDialog.value = false;
  } catch (error) {
    if (error !== false) {
      ElMessage.error("新增失败");
    }
  }
};

// 重命名
const handleRenameFolder = (row) => {
  renameForm.name = row.name;
  renameForm.id = row.id;
  renameForm.isFolder = true;
  showRenameDialog.value = true;
};

const handleRenameDocument = (row) => {
  renameForm.name = row.name.replace(/\.[^/.]+$/, "");
  renameForm.id = row.id;
  renameForm.isFolder = false;
  showRenameDialog.value = true;
};

const handleConfirmRename = async () => {
  try {
    await renameFormRef.value.validate();
    
    const findAndRename = (items, id, newName, isFolder) => {
      for (let item of items) {
        if (item.id === id) {
          if (isFolder) {
            item.name = newName;
          } else {
            const ext = item.name.match(/\.[^/.]+$/);
            item.name = newName + (ext ? ext[0] : '');
          }
          item.modifier = "当前用户";
          item.modifyTime = new Date().toLocaleString('zh-CN', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false 
          }).replace(/\//g, '-');
          return true;
        }
        if (item.children && findAndRename(item.children, id, newName, isFolder)) {
          return true;
        }
      }
      return false;
    };
    
    findAndRename(documentList.value, renameForm.id, renameForm.name, renameForm.isFolder);
    
    ElMessage.success("修改成功");
    showRenameDialog.value = false;
  } catch (error) {
    if (error !== false) {
      ElMessage.error("修改失败");
    }
  }
};

// 删除
const handleDeleteFolder = async (row) => {
  try {
    const hasChildren = row.children && row.children.length > 0;
    const message = hasChildren 
      ? "该文件夹下有文件或子文件夹,删除后将一并删除,是否继续?" 
      : "是否删除该文件夹?";
      
    await ElMessageBox.confirm(message, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    
    const findAndDelete = (items, id) => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === id) {
          items.splice(i, 1);
          return true;
        }
        if (items[i].children && findAndDelete(items[i].children, id)) {
          return true;
        }
      }
      return false;
    };
    
    findAndDelete(documentList.value, row.id);
    pagination.total = documentList.value.length;
    
    ElMessage.success("删除成功");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

const handleDeleteDocument = async (row) => {
  try {
    await ElMessageBox.confirm("确定要删除该文档吗?", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    
    const findAndDelete = (items, id) => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === id) {
          items.splice(i, 1);
          return true;
        }
        if (items[i].children && findAndDelete(items[i].children, id)) {
          return true;
        }
      }
      return false;
    };
    
    findAndDelete(documentList.value, row.id);
    pagination.total = documentList.value.length;
    
    ElMessage.success("删除成功");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

// 查看/编辑文档
const handleViewDocument = (row) => {
  open_pageoffice("/pageOffice/ReadWord", row);
};

const handleEditDocument = (row) => {
  open_pageoffice("/pageOffice/EditWord", row);
};

const open_pageoffice = (vue_page_url, row) => {
  let paramJson = {};
  paramJson.file_id = row.id;
  paramJson.file_name = row.name;
  let paramString = JSON.stringify(paramJson);
  POBrowser.openWindow(vue_page_url, "fullscreen=yes", paramString);
};

// 下载
const handleDownloadDocument = async (row) => {
  try {
    await downloadDocument(row.id);
    ElMessage.success("下载成功");
  } catch (error) {
    ElMessage.error("下载失败");
  }
};

// 上传
const handleShowUploadDialog = () => {
  showUploadDialog.value = true;
};

const handleFileChange = (file, uploadFiles) => {
  fileList.value = uploadFiles;
  const newShowFileList = uploadFiles.map((newItem) => {
    const oldItem = showFileList.value.find((f) => f.uid === newItem.uid);
    return {
      ...newItem,
      fileType: oldItem ? oldItem.fileType : "",
    };
  });
  showFileList.value = newShowFileList;
};

const handleFileRemove = (uploadFile, uploadFiles) => {
  fileList.value = uploadFiles;
  const newFiles = uploadFiles.map((item) => ({
    ...item,
    fileType: item.fileType || "",
  }));
  showFileList.value = newFiles;
};

const handleConfirmUpload = () => {
  showUploadDialog.value = false;
  ElMessage.success("上传成功");
  loadDocumentList();
};

// 监听 templateId prop 变化
watch(
  () => props.templateId,
  (newVal) => {
    if (newVal) {
      loadDocumentList();
    }
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.department-document-management {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.department-selector {
  margin-bottom: 20px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 4px;
}

.document-content {
  flex: 1;
  background: #fff;
  padding: 16px 20px;
  border-radius: 4px;

  .table-head {
    display: flex;
    margin-bottom: 10px;

    .table-head-button {
      margin: 0 12px;
    }
  }
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 4px;
}

.el-pagination {
  margin-top: 20px;
  justify-content: flex-end;
}

.name-text {
  margin-left: 4px;
}

.folder-laber {
  display: flex;
  align-items: center;
}

.file-icon {
  margin-right: 4px;
}

.upload_text_tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}
</style>
