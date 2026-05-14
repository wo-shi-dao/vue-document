<template>
  <div class="document-content-list">
    <div class="table-head">
      <el-button type="primary" v-if="!isCreateTemplate" @click="openCreateDoc">
        初始化文档目录
      </el-button>
      <el-button
        type="primary"
        :disabled="!documentList.length"
        v-if="isCreateTemplate"
        @click="handleShowGenerateDialog"
      >
        生成文档
      </el-button>
      <el-button
        type="primary"
        v-if="isCreateTemplate"
        @click="handleShowUploadDialog"
      >
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
              v-if="!row?.children.length"
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
            <el-button link type="danger" @click="handleDeleteDocument(row)">
              删除
            </el-button>
            <el-button link type="primary" @click="handleDownloadDocument(row)">
              下载
            </el-button>
            <el-button link type="primary" @click="handleRenameDocument(row)">
              重命名
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

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

    <!-- 生成文档弹窗 -->
    <CreateDocumentDialog
      v-model:visible="showGenerateDialog"
      v-model:submitting="createDocSubmitting"
      @submit="handleGenerateDocument"
    />

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
import { ref, reactive, onMounted, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";
import { POBrowser } from "js-pageoffice";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import DateTimeRangeFilter from "./DateTimeRangeFilter.vue";
import CreateDocumentDialog from "./CreateDocumentDialog.vue";
import ProgressDialog from "./ProgressDialog.vue";
import {
  getDocumentList,
  deleteDocument,
  downloadDocument,
  renameDocument,
  addFolder,
  deleteFolder,
  renameFolder,
  generateDocument,
} from "../api/document";

const props = defineProps({
  isCreateDocument: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["open-create-doc", "update-isCreate"]);

watch(
  () => props.isCreateDocument,
  (newVal) => {
    if (newVal && isCreateTemplate.value) {
      loadDocumentList();
    }
  },
);

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
    maxLength: 10,
    validateRules: [{ required: true, message: "不能为空", trigger: "change" }],
  },
  {
    label: "创建时间",
    field: "createTime",
    type: "custom",
    group: "Basic",
  },
]);

const isCreateTemplate = ref(false);

const showGenerateDialog = ref(false);
const createDocSubmitting = ref(false);

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

const mockTreeData = ref([
  {
    id: "f1",
    name: "项目文档",
    isFolder: true,
    creator: "admin",
    createTime: "2025-01-01 16:30:00",
    modifier: "admin",
    modifyTime: "2025-01-01 18:30:00",
    children: [],
  },
  {
    id: "f2",
    name: "技术文档",
    isFolder: true,
    creator: "admin",
    createTime: "2025-01-05 08:30:00",
    modifier: "admin",
    modifyTime: "2025-01-05 11:30:00",
    children: [
      {
        id: "f22",
        name: "数据库文档",
        isFolder: true,
        creator: "admin",
        createTime: "2025-01-05 08:30:00",
        modifier: "admin",
        modifyTime: "2025-01-05 11:30:00",
        children: [],
      },
    ],
  },
  {
    id: "f3",
    name: "管理文档",
    isFolder: true,
    creator: "admin",
    createTime: "2025-01-05 08:30:00",
    modifier: "admin",
    modifyTime: "2025-01-05 11:30:00",
    children: [],
  },
  {
    id: "f4",
    name: "用户文档",
    isFolder: true,
    creator: "admin",
    createTime: "2025-01-05 08:30:00",
    modifier: "admin",
    modifyTime: "2025-01-05 11:30:00",
    children: [],
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
        id: "d3",
        name: "需求文档.docx",
        type: "word",
        tag: "new",
        isFolder: false,
        creator: "李四",
        createTime: "2026-04-23 16:30:00",
        modifier: "李四",
        modifyTime: "2026-04-23 18:30:00",
        parentId: "f1",
      },
    ],
  },
  {
    id: "f2",
    name: "技术文档",
    isFolder: true,
    creator: "admin",
    createTime: "2025-01-05 08:30:00",
    modifier: "admin",
    modifyTime: "2025-01-05 11:30:00",
    children: [
      {
        id: "f22",
        name: "数据库文档",
        isFolder: true,
        creator: "admin",
        createTime: "2025-01-05 08:30:00",
        modifier: "admin",
        modifyTime: "2025-01-05 11:30:00",
        children: [],
      },
    ],
  },
  {
    id: "f3",
    name: "管理文档",
    isFolder: true,
    creator: "admin",
    createTime: "2025-01-05 08:30:00",
    modifier: "admin",
    modifyTime: "2025-01-05 11:30:00",
    children: [],
  },
  {
    id: "f4",
    name: "用户文档",
    isFolder: true,
    creator: "admin",
    createTime: "2025-01-05 08:30:00",
    modifier: "admin",
    modifyTime: "2025-01-05 11:30:00",
    children: [],
  },
];

const showAddFolderDialog = ref(false);
const folderFormRef = ref(null);
const folderForm = reactive({
  name: "",
});
const folderRules = {
  name: [{ required: true, message: "请输入文件夹名称", trigger: "blur" }],
};

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

const showUploadDialog = ref(false);
const uploadRef = ref(null);
const fileList = ref([]);
const showFileList = ref([]);

const showProgress = ref(false);
const progressPercentage = ref(0);
const progressStatus = ref("");
const progressFooterText = ref("正在生成文档...");

onMounted(() => {
  loadDocumentList();
});

function open_pageoffice(vue_page_url) {
  let paramJson = {};
  paramJson.file_id = 1;
  paramJson.file_name = "test.docx";
  let paramString = JSON.stringify(paramJson);
  POBrowser.openWindow(vue_page_url, "fullscreen=yes", paramString);
}

const loadDocumentList = async () => {
  loading.value = true;
  try {
    if (isCreateTemplate.value) {
      if (props.isCreateDocument) {
        mockTreeData.value = testData;
      }
      documentList.value = mockTreeData.value || [];
      pagination.total = 6 || 0;
    } else {
      documentList.value = [];
      pagination.total = 0;
    }
  } catch (error) {
    ElMessage.error("获取文档列表失败");
  } finally {
    loading.value = false;
  }
};

const loadTreeChildren = (row, treeNode, resolve) => {
  setTimeout(() => {
    resolve(row.children || []);
  }, 100);
};

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

const handleSearch = (selectedTags) => {
  console.log("selectedTags", selectedTags);
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

const openCreateDoc = () => {
  emit("open-create-doc");
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

const handleShowUploadDialog = () => {
  showUploadDialog.value = true;
};

const handleConfirmUpload = () => {
  showUploadDialog.value = false;
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
        emit("update-isCreate", true);
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

const setCreateTemplate = (value) => {
  isCreateTemplate.value = value;
  loadDocumentList();
};

defineExpose({
  setCreateTemplate,
});
</script>

<style lang="scss" scoped>
.document-content-list {
  .table-head {
    display: flex;
    margin-bottom: 10px;

    .table-head-button {
      margin: 0 12px;
    }
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
}
</style>
