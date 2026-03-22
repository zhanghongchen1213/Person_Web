---
title: 桌面改造新神器！墨水屏摆件让我的工位成为焦点！
slug: 2024-02-26-deskscreen
summary: 本项目是一个 DIY 桌面墨水屏摆件，采用 ESP32 作为主控芯片，搭配 1.54 寸电子墨水屏，通过 WiFi 联网获取天气信息和网络时间，并可通过 MQTT 协议与智能家居系统联动。
category: DIY
categorySlug: blog
type: blog
status: published
publishedAt: 2024-02-26T00:00:00.000Z
---

# 桌面改造新神器！墨水屏摆件让我的工位成为焦点！

> 一款基于 ESP32 的桌面墨水屏智能摆件，支持天气显示、时间同步、温湿度监测等功能，让你的工位更具科技感！

## 项目简介

本项目是一个 DIY 桌面墨水屏摆件，采用 ESP32 作为主控芯片，搭配 1.54 寸电子墨水屏，通过 WiFi 联网获取天气信息和网络时间，并可通过 MQTT 协议与智能家居系统联动。

## 开源地址

| 平台           | 链接                                                                                   |
| -------------- | -------------------------------------------------------------------------------------- |
| 个人博客       | [https://zhcmqtt.top](https://zhcmqtt.top)                                             |
| CSDN博客       | [https://blog.csdn.net](https://blog.csdn.net/weixin_46477159?spm=1000.2115.3001.5343) |
| 立创硬件开源   | [https://x.jlc.com](https://oshwhub.com/nhwjxzxz/esp32-ping-mu)                        |
| GitHub项目开源 | [https://github.com](https://github.com/zhanghongchen1213/DIY_ESP32_DesktopScreen)     |

**视频演示**

[![点击观看视频](https://i.imgs.ovh/2026/02/01/ynSMQe.md.jpeg)](https://www.bilibili.com/video/BV1iW6xBPE7T/)

> 📺 **视频作者**：B站 @鸿尘客
> 🔗 **视频链接**：[桌面墨水屏摆件](https://www.bilibili.com/video/BV1iW6xBPE7T/)

---

## 功能特性

| 功能              | 描述                               |
| ----------------- | ---------------------------------- |
| 🌤️ **天气显示**   | 通过心知天气 API 获取实时天气信息  |
| 🕐 **时间同步**   | NTP 网络时间同步，自动校准         |
| 🌡️ **温湿度监测** | AHT20 传感器采集环境温湿度         |
| 📡 **MQTT 通信**  | 支持 MQTT 协议，可接入智能家居系统 |
| 👆 **触摸交互**   | FT6336U 电容触摸屏，支持触控操作   |
| 🎨 **LVGL 界面**  | 基于 LVGL 8.3 的精美 UI 界面       |
| ⚡ **低功耗**     | 墨水屏显示，省电护眼               |

---

## 硬件清单

### 核心组件

| 组件         | 型号/规格         | 数量 | 备注           |
| ------------ | ----------------- | ---- | -------------- |
| 主控芯片     | ESP32-WROOM-32    | 1    | 双核 240MHz    |
| 显示屏       | 1.54寸 电子墨水屏 | 1    | 200x200 分辨率 |
| 触摸芯片     | FT6336U           | 1    | 电容触摸       |
| 温湿度传感器 | AHT20             | 1    | I2C 接口       |

---

## 环境搭建

### 1. 开发工具

- **IDE**: [VSCode](https://code.visualstudio.com/) + [PlatformIO](https://platformio.org/)
- **UI 设计**: [SquareLine Studio](https://squareline.io/) (LVGL 可视化设计)
- **3D 建模**: SolidWorks / Fusion 360

### 2. 安装 PlatformIO

1. 安装 VSCode
2. 在扩展商店搜索 `PlatformIO IDE` 并安装
3. 重启 VSCode

### 3. 克隆项目

```bash
git clone https://github.com/your-username/ESP32_DeskScreen.git
cd ESP32_DeskScreen/04_firmware/ESP32_Desk
```

### 4. 依赖库

项目依赖以下库（PlatformIO 会自动安装）：

```ini
lib_deps =
    knolleary/PubSubClient@^2.8      # MQTT 客户端
    bblanchon/ArduinoJson@^7.0.2     # JSON 解析
    adafruit/Adafruit AHTX0@^2.0.5   # AHT20 驱动
    lvgl/lvgl@^8.3.4                 # LVGL 图形库
```

---

## 编译烧录

### 1. 配置 WiFi

修改 `src/Application/System_Config.cpp` 中的 WiFi 配置：

```cpp
#define WIFI_SSID "你的WiFi名称"
#define WIFI_PASSWD "你的WiFi密码"
```

### 2. 配置天气 API

修改 `src/network.cpp` 中的心知天气 API 密钥：

```cpp
String reqUserKey = "你的API密钥";  // 在 seniverse.com 注册获取
```

### 3. 编译上传

```bash
# 使用 PlatformIO CLI
pio run -t upload

# 或在 VSCode 中点击 PlatformIO 工具栏的上传按钮
```

### 4. 串口监视

```bash
pio device monitor -b 9600
```

---

## 使用说明

### 首次使用

1. 按照硬件清单准备所有组件
2. 根据原理图焊接 PCB 或使用嘉立创打样
3. 3D 打印外壳并组装
4. 烧录固件
5. 上电后设备自动连接 WiFi 并显示天气信息

### 界面操作

- **主界面**: 显示当前时间、天气、温湿度
- **触摸操作**: 支持滑动切换页面（如已启用触摸功能）

---

## 参考资料

- [ESP32 官方文档](https://docs.espressif.com/projects/esp-idf/zh_CN/latest/esp32/)
- [LVGL 官方文档](https://docs.lvgl.io/8.3/)
- [PlatformIO 文档](https://docs.platformio.org/)
- [心知天气 API](https://www.seniverse.com/)
- [SquareLine Studio](https://squareline.io/)

---

## 致谢

- 感谢 [LVGL](https://lvgl.io/) 提供的开源图形库
- 感谢 [PlatformIO](https://platformio.org/) 提供的开发平台
- 感谢所有开源社区的贡献者

---

## 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

---

<p align="center">
  如果这个项目对你有帮助，欢迎 ⭐ Star 支持！
</p>

<p align="center">
  <b>Made with ❤️ by 鸿尘客</b>
</p>
