import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { Github, Twitter, Mail, Linkedin, ArrowRight } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-16 md:pt-20">
        {/* Hero Section */}
        <section className="border-b-2 border-border">
          <div className="container py-16 md:py-24 lg:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Text Content */}
              <div>
                <h1 className="mb-6">
                  关于
                  <br />
                  <span className="brutalist-underline">我</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
                  你好！我是一名热爱技术的开发者，专注于 Web 开发和系统设计。
                  这个博客是我记录学习历程、分享技术心得的地方。
                </p>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="mailto:contact@example.com"
                    className="brutalist-btn"
                  >
                    联系我
                    <Mail className="w-4 h-4 ml-2" />
                  </a>
                  <Link
                    href="/articles"
                    className="inline-flex items-center justify-center px-6 py-3 border-2 border-border font-bold uppercase tracking-wider transition-all hover:bg-muted"
                  >
                    阅读文章
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>

              {/* Avatar/Image Placeholder */}
              <div className="flex justify-center lg:justify-end">
                <div className="w-64 h-64 md:w-80 md:h-80 border-4 border-border bg-muted flex items-center justify-center">
                  <span className="text-8xl md:text-9xl font-black text-muted-foreground">
                    ?
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section className="border-b-2 border-border bg-muted">
          <div className="container py-16 md:py-24">
            <h2 className="text-2xl md:text-3xl mb-12">技术栈</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* 嵌入式开发 */}
              <div className="p-6 border-2 border-border bg-background">
                <h3 className="text-xl font-bold mb-4 uppercase tracking-wider">嵌入式开发</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-foreground" />
                    STM32 / ESP32
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-foreground" />
                    FreeRTOS / RT-Thread
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-foreground" />
                    C / C++ / Embedded Linux
                  </li>
                </ul>
              </div>

              {/* ROS机器人 */}
              <div className="p-6 border-2 border-border bg-background">
                <h3 className="text-xl font-bold mb-4 uppercase tracking-wider">ROS机器人</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-foreground" />
                    ROS1 / ROS2
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-foreground" />
                    导航 / SLAM
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-foreground" />
                    Gazebo / RViz
                  </li>
                </ul>
              </div>

              {/* 深度学习 */}
              <div className="p-6 border-2 border-border bg-background">
                <h3 className="text-xl font-bold mb-4 uppercase tracking-wider">深度学习</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-foreground" />
                    PyTorch / TensorFlow
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-foreground" />
                    计算机视觉 / NLP
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-foreground" />
                    模型部署 / ONNX
                  </li>
                </ul>
              </div>

              {/* DIY项目 */}
              <div className="p-6 border-2 border-border bg-background">
                <h3 className="text-xl font-bold mb-4 uppercase tracking-wider">DIY项目</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-foreground" />
                    硬件设计 / PCB
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-foreground" />
                    3D打印 / 建模
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-foreground" />
                    Arduino / 树莓派
                  </li>
                </ul>
              </div>

              {/* 编程语言 */}
              <div className="p-6 border-2 border-border bg-background">
                <h3 className="text-xl font-bold mb-4 uppercase tracking-wider">编程语言</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-foreground" />
                    Python / C++
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-foreground" />
                    TypeScript / JavaScript
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-foreground" />
                    Rust / Go
                  </li>
                </ul>
              </div>

              {/* 工具与环境 */}
              <div className="p-6 border-2 border-border bg-background">
                <h3 className="text-xl font-bold mb-4 uppercase tracking-wider">工具与环境</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-foreground" />
                    Linux / Docker
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-foreground" />
                    Git / VSCode
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-foreground" />
                    CI/CD / Nginx
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section className="border-b-2 border-border">
          <div className="container py-16 md:py-24">
            <h2 className="text-2xl md:text-3xl mb-12">项目经历</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Project 1 */}
              <div className="p-6 border-2 border-border bg-background">
                <h3 className="text-xl font-bold mb-3">智能机器人导航系统</h3>

                {/* Tech Stack Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider border border-border bg-muted">
                    ROS2
                  </span>
                  <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider border border-border bg-muted">
                    SLAM
                  </span>
                  <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider border border-border bg-muted">
                    C++
                  </span>
                </div>

                <p className="text-muted-foreground mb-4">
                  基于ROS2开发的自主导航系统，实现了室内环境的实时建图与路径规划。采用激光雷达和视觉融合方案，提升了定位精度。
                </p>

                {/* Links */}
                <div className="flex flex-wrap gap-3 text-sm">
                  <a href="#" className="font-bold hover:underline underline-offset-4">
                    GitHub →
                  </a>
                  <a href="#" className="font-bold hover:underline underline-offset-4">
                    相关文章 →
                  </a>
                </div>
              </div>

              {/* Project 2 */}
              <div className="p-6 border-2 border-border bg-background">
                <h3 className="text-xl font-bold mb-3">嵌入式视觉识别模块</h3>

                {/* Tech Stack Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider border border-border bg-muted">
                    STM32
                  </span>
                  <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider border border-border bg-muted">
                    TensorFlow Lite
                  </span>
                  <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider border border-border bg-muted">
                    Python
                  </span>
                </div>

                <p className="text-muted-foreground mb-4">
                  在STM32H7平台上部署轻量级目标检测模型，实现了实时物体识别功能。优化后的模型推理速度达到30fps。
                </p>

                {/* Links */}
                <div className="flex flex-wrap gap-3 text-sm">
                  <a href="#" className="font-bold hover:underline underline-offset-4">
                    GitHub →
                  </a>
                  <a href="#" className="font-bold hover:underline underline-offset-4">
                    相关文章 →
                  </a>
                </div>
              </div>

              {/* Project 3 */}
              <div className="p-6 border-2 border-border bg-background">
                <h3 className="text-xl font-bold mb-3">DIY四轴飞行器</h3>

                {/* Tech Stack Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider border border-border bg-muted">
                    Arduino
                  </span>
                  <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider border border-border bg-muted">
                    PID控制
                  </span>
                  <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider border border-border bg-muted">
                    PCB设计
                  </span>
                </div>

                <p className="text-muted-foreground mb-4">
                  从零开始设计制作的四轴飞行器，包括硬件电路设计、飞控算法开发和调试。实现了稳定的姿态控制和遥控飞行。
                </p>

                {/* Links */}
                <div className="flex flex-wrap gap-3 text-sm">
                  <a href="#" className="font-bold hover:underline underline-offset-4">
                    GitHub →
                  </a>
                  <a href="#" className="font-bold hover:underline underline-offset-4">
                    相关文章 →
                  </a>
                </div>
              </div>

              {/* Project 4 */}
              <div className="p-6 border-2 border-border bg-background">
                <h3 className="text-xl font-bold mb-3">深度学习图像分类系统</h3>

                {/* Tech Stack Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider border border-border bg-muted">
                    PyTorch
                  </span>
                  <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider border border-border bg-muted">
                    ResNet
                  </span>
                  <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider border border-border bg-muted">
                    Docker
                  </span>
                </div>

                <p className="text-muted-foreground mb-4">
                  基于ResNet架构的图像分类系统，在自定义数据集上达到95%以上的准确率。使用Docker容器化部署，支持REST API调用。
                </p>

                {/* Links */}
                <div className="flex flex-wrap gap-3 text-sm">
                  <a href="#" className="font-bold hover:underline underline-offset-4">
                    GitHub →
                  </a>
                  <a href="#" className="font-bold hover:underline underline-offset-4">
                    相关文章 →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="border-b-2 border-border">
          <div className="container py-16 md:py-24">
            <h2 className="text-2xl md:text-3xl mb-12">经历</h2>
            
            <div className="space-y-8 pl-4 md:pl-8 border-l-2 border-border">
              {/* Timeline Item */}
              <div className="relative">
                <div className="absolute -left-[calc(1rem+5px)] md:-left-[calc(2rem+5px)] top-0 w-2 h-2 bg-foreground" />
                <div className="mb-2">
                  <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    2023 - 至今
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">高级开发工程师</h3>
                <p className="text-muted-foreground">
                  负责核心业务系统的架构设计与开发，带领团队完成多个重要项目。
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[calc(1rem+5px)] md:-left-[calc(2rem+5px)] top-0 w-2 h-2 bg-foreground" />
                <div className="mb-2">
                  <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    2020 - 2023
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">全栈开发工程师</h3>
                <p className="text-muted-foreground">
                  参与多个 Web 应用的全栈开发，积累了丰富的项目经验。
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[calc(1rem+5px)] md:-left-[calc(2rem+5px)] top-0 w-2 h-2 bg-foreground" />
                <div className="mb-2">
                  <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    2016 - 2020
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">计算机科学学士</h3>
                <p className="text-muted-foreground">
                  系统学习计算机基础知识，培养了扎实的编程能力。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-primary text-primary-foreground">
          <div className="container py-16 md:py-24">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl mb-6">
                联系方式
              </h2>
              <p className="text-lg opacity-80 mb-8">
                欢迎通过以下方式与我联系
              </p>
              
              <div className="flex justify-center gap-4 flex-wrap">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 border-2 border-primary-foreground hover:bg-primary-foreground hover:text-primary transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="w-6 h-6" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 border-2 border-primary-foreground hover:bg-primary-foreground hover:text-primary transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-6 h-6" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 border-2 border-primary-foreground hover:bg-primary-foreground hover:text-primary transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-6 h-6" />
                </a>
                <a
                  href="mailto:contact@example.com"
                  className="p-4 border-2 border-primary-foreground hover:bg-primary-foreground hover:text-primary transition-colors"
                  aria-label="Email"
                >
                  <Mail className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
