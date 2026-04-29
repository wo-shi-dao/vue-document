<template>
  <div class="page-nav">
    <p><span class="nav-firstTitle">文档管理 / </span> <span>文档导出</span></p>
  </div>
  <div class="document-management-container">
    <!-- Tab页签 -->
    <d-tabs type="wrapped" v-model="activeTab" class="content-tabs">
      <d-tab id="content" class="tab-panal" title="文档内容">
        <!-- 筛选条件 -->
        <div class="table-head">
          <el-button type="primary" @click="openCreateDoc">
            初始化文档模板
          </el-button>
          <el-button
            type="primary"
            :disabled="!documentList.length"
            @click="handleShowGenerateDialog"
          >
            生成文档
          </el-button>
          <el-button type="primary"> 上传 </el-button>
          <d-button
            class="table-head-button"
            variant="solid"
            color="secondary"
            @click="handleCreateFolder"
            >新建文件夹</d-button
          >
          <d-category-search
            class="head-search"
            :category="category"
            placeholder="请输入关键字，按Enter键搜索"
            @selectedTagsChange="onSelectedTagsChange"
          >
          </d-category-search>
          <!-- <d-range-date-picker-pro
            v-model="datePickerProValue1"
            class="head-search"
            :showTime="true"
            format="YYYY/MM/DD HH:mm:ss"
          /> -->
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
        >
          <el-table-column prop="name" label="文档名称" min-width="220">
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
          <!-- <el-table-column prop="type" label="文档类型" width="120" /> -->
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
                <el-button link type="primary"> 上传 </el-button>
                <el-button
                  v-if="row.isEmpty"
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
                  @click.prevent="open_pageoffice('/pageOffice/ReadWord')"
                >
                  查看
                </el-button>
                <el-button
                  link
                  type="primary"
                  @click.prevent="open_pageoffice('/pageOffice/EditWord')"
                >
                  编辑
                </el-button>
                <el-button
                  link
                  type="danger"
                  @click="handleDeleteDocument(row)"
                >
                  删除
                </el-button>
                <el-button
                  link
                  type="primary"
                  @click="handleDownloadDocument(row)"
                >
                  下载
                </el-button>
                <el-button
                  link
                  type="primary"
                  @click="handleRenameDocument(row)"
                >
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
      </d-tab>
      <d-tab id="history" class="tab-panal" title="历史记录">
        <el-table :data="mockHistoryList" style="width: 100%" border>
          <el-table-column prop="name" label="文档名称" min-width="180" />
          <el-table-column prop="creator" label="创建人" min-width="120" />
          <el-table-column prop="createTime" label="创建时间" min-width="180" />
          <el-table-column prop="type" label="文档类型" min-width="120" />
          <el-table-column prop="modifier" label="修改人" min-width="120" />
          <el-table-column prop="modifyTime" label="修改时间" min-width="180" />
          <el-table-column label="状态" min-width="120">
            <template #default="{ row }">
              <el-tag v-if="row.status === 'success'" type="success"
                >成功</el-tag
              >
              <el-tag v-else-if="row.status === 'processing'" type="warning"
                >处理中</el-tag
              >
              <el-tag v-else-if="row.status === 'failed'" type="danger"
                >失败</el-tag
              >
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :total="3"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </d-tab>
    </d-tabs>

    <!-- 生成文档弹窗 -->
    <CreateDocumentDialog
      v-model:visible="showGenerateDialog"
      v-model:submitting="createDocSubmitting"
      @submit="handleGenerateDocument"
    />

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
            placeholder="请选择文件夹（不选则为根目录）"
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

    <!-- 进度条弹窗 -->
    <ProgressDialog
      v-model="showProgress"
      title="正在生成文档"
      description="请稍候，正在根据筛选条件生成文档..."
      progress-text="生成进度"
      :footer-text="progressFooterText"
      :percentage="progressPercentage"
      :status="progressStatus"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ProgressDialog from "../components/ProgressDialog.vue";
import { POBrowser } from "js-pageoffice";
import request from "../utils/request";
import { useRouter } from "vue-router";
import { Document, Folder } from "@element-plus/icons-vue";
import CreateDocumentDialog from "../components/CreateDocumentDialog.vue";
import {
  getDocumentList,
  deleteDocument,
  downloadDocument,
  renameDocument,
  addFolder,
  deleteFolder,
  renameFolder,
  generateDocument,
  getHistoryList,
} from "../api/document";

const router = useRouter();
const activeTab = ref("content");
const loading = ref(false);
const documentList = ref([]);
const historyList = ref([]);

const datePickerProValue1 = ref(["", ""]);

const pagination = reactive({
  current: 1,
  size: 10,
  total: 0,
});

// 生成文档
const showGenerateDialog = ref(false);
// 生成文档提交loading
const createDocSubmitting = ref(false);

const titleText = ref("");

// 文件夹目录
const folderTreeData = [
  {
    value: "1",
    label: "项目文档",
    children: [
      {
        value: "1-1",
        label: "软件需求",
      },
    ],
  },
  {
    value: "2",
    label: "测试报告",
  },
];

const folderIcon = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H12L10 4Z" fill="#F7C331"/>
      </svg>
    `;

//搜索
const category = ref([
  {
    label: "创建时间",
    field: "createTime",
    type: "date",
    group: "Time-related",
    showTime: true,
  },
]);

onMounted(() => {
  loadDocumentList();
});

function open_pageoffice(vue_page_url) {
  let paramJson = {};
  paramJson.file_id = 1;
  paramJson.file_name = "test.docx";
  let paramString = JSON.stringify(paramJson);

  //openWindow()第三个参数用来向弹出的PageOffice浏览器（POBrowser）窗口传递参数(参数长度不限)，支持json格式字符串。
  //此处为了方便演示，我们传递了file_id和file_name两个参数，具体以您实际开发为准。
  POBrowser.openWindow(vue_page_url, "fullscreen=yes", paramString);
}

const mockTreeData = ref([
  {
    id: "f1",
    name: "项目文档",
    isFolder: true,
    creator: "admin",
    createTime: "2025-01-01 16:30:00",
    modifier: "admin",
    modifyTime: "2025-01-01 18:30:00",
    children: [
      {
        id: "1-1",
        name: "软件需求",
        isFolder: true,
        creator: "admin",
        createTime: "2025-01-01 16:30:00",
        modifier: "admin",
        modifyTime: "2025-01-01 18:30:00",
        children: [
          {
            id: "d1",
            name: "需求规格.docx",
            type: "word",
            isFolder: false,
            creator: "张三",
            createTime: "2025-01-02 16:30:00",
            modifier: "李四",
            modifyTime: "2025-01-03 17:30:00",
            parentId: "f1",
          },
          {
            id: "d2",
            name: "设计文档.docx",
            type: "word",
            isFolder: false,
            creator: "王五",
            createTime: "2025-01-04 12:30:00",
            modifier: "王五",
            modifyTime: "2025-01-04 18:30:00",
            parentId: "f1",
          },
        ],
      },
    ],
  },
  {
    id: "f2",
    name: "测试报告",
    isFolder: true,
    creator: "admin",
    createTime: "2025-01-05 08:30:00",
    modifier: "admin",
    modifyTime: "2025-01-05 11:30:00",
    children: [
      {
        id: "d3",
        name: "测试用例.pdf",
        type: "ppt",
        isFolder: false,
        creator: "赵六",
        createTime: "2025-01-06 16:30:00",
        modifier: "赵六",
        modifyTime: "2025-01-06 19:30:00",
        parentId: "f2",
      },
    ],
  },
  {
    id: "d4",
    name: "会议记录.docx",
    type: "word",
    isFolder: false,
    creator: "孙七",
    createTime: "2025-01-07 16:30:00",
    modifier: "孙七",
    modifyTime: "2025-01-07 22:30:00",
    parentId: null,
  },
  {
    id: "d4",
    name: "测试记录.xlsx",
    type: "excel",
    isFolder: false,
    creator: "孙七",
    createTime: "2025-01-07 16:30:00",
    modifier: "孙七",
    modifyTime: "2025-01-07 20:30:00",
    parentId: null,
  },
  {
    id: "d4",
    name: "软件需求.pdf",
    type: "ppt",
    isFolder: false,
    creator: "孙七",
    createTime: "2025-01-07 16:30:00",
    modifier: "孙七",
    modifyTime: "2025-01-07 19:30:00",
    parentId: null,
  },
]);

const testData = [
  {
    id: "f1",
    name: "项目文档",
    isFolder: true,
    creator: "admin",
    createTime: "2025-01-01 16:30:00",
    modifier: "admin",
    modifyTime: "2025-01-01 18:30:00",
    children: [
      {
        id: "1-1",
        name: "软件需求",
        isFolder: true,
        creator: "admin",
        createTime: "2025-01-01 16:30:00",
        modifier: "admin",
        modifyTime: "2025-01-01 18:30:00",
        children: [
          {
            id: "d3",
            name: "需求说明文档.docx",
            type: "word",
            tag: "new",
            isFolder: false,
            creator: "李四",
            createTime: "2026-04-23 16:30:00",
            modifier: "李四",
            modifyTime: "2026-04-23 18:30:00",
            parentId: "f1",
          },
          {
            id: "d1",
            name: "需求规格.docx",
            type: "word",
            isFolder: false,
            creator: "张三",
            createTime: "2025-01-02 16:30:00",
            modifier: "李四",
            modifyTime: "2025-01-03 17:30:00",
            parentId: "f1",
          },
          {
            id: "d2",
            name: "设计文档.docx",
            type: "word",
            isFolder: false,
            creator: "王五",
            createTime: "2025-01-04 12:30:00",
            modifier: "王五",
            modifyTime: "2025-01-04 18:30:00",
            parentId: "f1",
          },
        ],
      },
    ],
  },
  {
    id: "f2",
    name: "测试报告",
    isFolder: true,
    creator: "admin",
    createTime: "2025-01-05 08:30:00",
    modifier: "admin",
    modifyTime: "2025-01-05 11:30:00",
    children: [
      {
        id: "d3",
        name: "测试用例.pdf",
        type: "ppt",
        isFolder: false,
        creator: "赵六",
        createTime: "2025-01-06 16:30:00",
        modifier: "赵六",
        modifyTime: "2025-01-06 19:30:00",
        parentId: "f2",
      },
    ],
  },
  {
    id: "d4",
    name: "会议记录.docx",
    type: "word",
    isFolder: false,
    creator: "孙七",
    createTime: "2025-01-07 16:30:00",
    modifier: "孙七",
    modifyTime: "2025-01-07 22:30:00",
    parentId: null,
  },
  {
    id: "d4",
    name: "测试记录.xlsx",
    type: "excel",
    isFolder: false,
    creator: "孙七",
    createTime: "2025-01-07 16:30:00",
    modifier: "孙七",
    modifyTime: "2025-01-07 20:30:00",
    parentId: null,
  },
  {
    id: "d4",
    name: "软件需求.pdf",
    type: "ppt",
    isFolder: false,
    creator: "孙七",
    createTime: "2025-01-07 16:30:00",
    modifier: "孙七",
    modifyTime: "2025-01-07 19:30:00",
    parentId: null,
  },
];

const mockHistoryList = ref([
  {
    id: "d3",
    name: "设计文档.docx",
    type: "IR",
    isFolder: false,
    creator: "赵六",
    createTime: "2025-01-06",
    modifier: "赵六",
    modifyTime: "2025-01-06",
    parentId: "f2",
    status: "success",
  },
  {
    id: "d3",
    name: "需求文档.docx",
    type: "docx",
    isFolder: false,
    creator: "孙七",
    createTime: "2025-01-06",
    modifier: "孙七",
    modifyTime: "2025-01-06",
    parentId: "f2",
    status: "processing",
  },
  {
    id: "d3",
    name: "测试用例.docx",
    type: "docx",
    isFolder: false,
    creator: "王五",
    createTime: "2025-01-06",
    modifier: "王五",
    modifyTime: "2025-01-06",
    parentId: "f2",
    status: "failed",
  },
]);

// 新增文件夹
const showAddFolderDialog = ref(false);
const folderFormRef = ref(null);
const folderForm = reactive({
  name: "",
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

// 进度条
const showProgress = ref(false);
const progressPercentage = ref(0);
const progressStatus = ref("");
const progressFooterText = ref("正在生成文档...");

//获取文档列表
const loadDocumentList = async () => {
  loading.value = true;
  try {
    // const res = await getDocumentList({
    //   page: pagination.current,
    //   size: pagination.size,
    // });
    documentList.value = mockTreeData.value || [];
    pagination.total = 6 || 0;
  } catch (error) {
    ElMessage.error("获取文档列表失败");
  } finally {
    loading.value = false;
  }
};

// 树形表格懒加载（如果不需要懒加载可移除 lazy 和 load 属性）
const loadTreeChildren = (row, treeNode, resolve) => {
  setTimeout(() => {
    resolve(row.children || []);
  }, 100);
};

//图标
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

const handleSearch = () => {
  pagination.current = 1;
  loadDocumentList();
};

const handleCreateFolder = () => {
  showAddFolderDialog.value = true;
};

const handlePageSizeChange = () => {
  pagination.current = 1;
  loadDocumentList();
};

const handlePageChange = () => {
  loadDocumentList();
};

// 跳转初始化文档模板
const openCreateDoc = () => {
  router.push("/init-document");
};

const handleViewDocument = (row) => {
  ElMessage.info("打开PageOffice查看文档（只读模式）");
};

const handleEditDocument = (row) => {
  ElMessage.info("打开PageOffice编辑文档");
};

const onSelectedTagsChange = (val) => {
  console.log("val", val);
};

const handleDeleteDocument = async (row) => {
  try {
    await ElMessageBox.confirm("确定要删除该文档吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await deleteDocument(row.id);
    ElMessage.success("删除成功");
    loadDocumentList();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

const handleDownloadDocument = async (row) => {
  try {
    await downloadDocument(row.id);
    ElMessage.success("下载成功");
  } catch (error) {
    ElMessage.error("下载失败");
  }
};

const handleRenameDocument = (row) => {
  renameForm.name = row.name.replace(/\.[^/.]+$/, "");
  renameForm.id = row.id;
  renameForm.isFolder = false;
  showRenameDialog.value = true;
};

const handleShowAddFolderDialog = () => {
  folderForm.name = "";
  showAddFolderDialog.value = true;
};

const handleAddFolder = async () => {
  try {
    await folderFormRef.value.validate();
    await addFolder(folderForm.name);
    ElMessage.success("新增成功");
    showAddFolderDialog.value = false;
    loadDocumentList();
  } catch (error) {
    if (error !== false) {
      ElMessage.error("新增失败");
    }
  }
};

const handleRenameFolder = (row) => {
  renameForm.name = row.name;
  renameForm.id = row.id;
  renameForm.isFolder = true;
  showRenameDialog.value = true;
};

const handleDeleteFolder = async (row) => {
  try {
    await ElMessageBox.confirm("是否删除该文件夹？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await deleteFolder(row.id);
    ElMessage.success("删除成功");
    loadDocumentList();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

const handleConfirmRename = async () => {
  try {
    await renameFormRef.value.validate();
    if (renameForm.isFolder) {
      await renameFolder(renameForm.id, renameForm.name);
    } else {
      await renameDocument(renameForm.id, renameForm.name);
    }
    ElMessage.success("修改成功");
    showRenameDialog.value = false;
    loadDocumentList();
  } catch (error) {
    if (error !== false) {
      ElMessage.error("修改失败");
    }
  }
};

const handleShowGenerateDialog = () => {
  showGenerateDialog.value = true;
};

const handleGenerateDocument = async (form) => {
  try {
    showGenerateDialog.value = false;
    showProgress.value = true;
    progressPercentage.value = 0;
    progressStatus.value = "";
    progressFooterText.value = "正在生成文档...";

    const result = await generateDocument(form, (progress) => {
      progressPercentage.value = progress;
    });

    if (result.success) {
      progressPercentage.value = 100;
      progressStatus.value = "success";
      progressFooterText.value = "生成完成";

      setTimeout(() => {
        showProgress.value = false;
        mockTreeData.value = testData;
        pagination.total = 7;
        ElMessage.success("文档生成成功");
        open_pageoffice("/pageOffice/EditWord");
        loadDocumentList();
      }, 1000);
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    if (error !== false) {
      showProgress.value = false;
      ElMessage.error(error.message || "生成失败");
    }
  }
};

const handleSearchHistory = async () => {
  try {
    // const res = await getHistoryList();
    historyList.value = mockHistoryList.value || [];
  } catch (error) {
    ElMessage.error("获取历史记录失败");
  }
};
</script>

<style lang="scss" scoped>
.document-management-container {
  background-color: #f3f3f3;
  min-height: calc(100vh - 92px);
}

.content-tabs :deep(.devui-tabs__nav) {
  padding-top: 4px;
  padding-left: 4px;
  margin-bottom: -1px;

  .active a {
    color: #252b3a;
  }
}

.tab-panal {
  padding: 12px 20px 0;
  margin: 0;

  .table-head {
    display: flex;
    margin-bottom: 10px;

    .table-head-button {
      margin-left: 12px;
    }

    .head-search {
      max-width: 400px;
      margin-left: 12px;
    }
  }
}

.page-nav {
  background: #fff;
  height: 32px;
  font-size: 14px;
  padding: 0 16px;
  line-height: 32px;

  .nav-firstTitle {
    color: #777777;
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin: 0;
}

.filter-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.el-pagination {
  margin-top: 20px;
  justify-content: flex-end;
}

.name-text {
  margin-left: 4px;
}

.folder-icon {
  color: #eab308;
}
.document-icon {
  color: #0077b8;
}

.create-button {
  margin-bottom: 16px;
}

.folder-laber {
  display: flex;
  align-items: center;
}

.file-icon {
  margin-right: 4px;
}
</style>
