import axios from "axios";
import { POBrowser } from "js-pageoffice";
// 创建 axios 实例
const service = axios.create({
  baseURL: "/dev-api", // 设置你的基础 URL
  timeout: 5000, // 设置请求超时时间
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 假设你的token存储在cookie中，就使用此行代码，在此为了方便演示，我们使用常量 token = "123"
    //const token = Cookies.get('token');
    const token = "123";
    if (token) {
      config.headers["Authorization"] = "Bearer " + token; // 将token添加到请求头中

      // PageOffice的设置代码开始 -------------------------------------------------
      // PageOffice全局配置，必须在此拦截器中定义
      POBrowser.setProxyBaseAPI("/dev-api"); //必须。设置后端代理,具体属性值以您实际开发为准,比如POBrowser.setProxyBaseAPI(import.meta.env.VITE_APP_BASE_API)。
      POBrowser.setHeader("Authorization", "Bearer " + token); //必须。向PageOffice后端请求设置header，支持多次调用setHeader()设置更多的值，具体属性名称和属性值以您实际开发为准。
      /**
       * 前端存储token的方案
       *方案1.使用Cookie
       *如果您的令牌(token)存储在Cookie中，PageOffice会默认支持通过Cookie方式保存令牌，因此您无需编写任何额外的代码。
       *方案2.使用Localstorage或者SessionStorage
       *如果令牌(token)是保存在LocalStorage或SessionStorage中，您必须调用POBrowser.setStorage()方法。
       */
      //POBrowser.setStorage("Admin-Token",getToken());//支持多次调用setStorage()设置更多的值，具体属性名称和属性值以您实际开发为准。
      // PageOffice的设置代码结束 -------------------------------------------------
    }
    return config;
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error);
  },
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    return response.data;
  },
  (error) => {
    // 对响应错误做点什么
    return Promise.reject(error);
  },
);

export default service;
