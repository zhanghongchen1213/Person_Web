import { Link } from "wouter";
import { Github, MessageCircle, Mail, BookOpen, Video } from "lucide-react";

export default function Footer() {
  const icpRecordNumber = "鲁ICP备2024057224号";
  const beianUrl = "https://beian.miit.gov.cn/";

  return (
    <footer className="border-t-2 border-border bg-background">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <span className="text-2xl md:text-3xl font-black tracking-tighter uppercase">
              [BLOG]
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              鸿尘客的个人博客，专注于技术分享与思考。
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider">导航</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                首页
              </Link>
              <Link href="/articles" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                文章
              </Link>
              <Link href="/archive" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                归档
              </Link>
              <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                关于
              </Link>
            </nav>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider">联系</h4>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com/zhanghongchen1213"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border-2 border-border hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('微信号: 18954242710');
                }}
                className="p-2 border-2 border-border hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="微信"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('邮箱: m18954242710@163.com');
                }}
                className="p-2 border-2 border-border hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="https://blog.csdn.net/weixin_46477159?spm=1000.2115.3001.5343"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border-2 border-border hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="CSDN"
              >
                <BookOpen className="w-5 h-5" />
              </a>
              <a
                href="https://space.bilibili.com/3690998351792801"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border-2 border-border hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Bilibili"
              >
                <Video className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t-2 border-border">
          <div className="flex justify-center">
            <a
              href={beianUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex min-h-10 items-center px-3 text-center text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              aria-label="工业和信息化部备案管理系统（新窗口打开）"
              title="点击前往工信部备案管理系统查询备案信息"
            >
              {icpRecordNumber}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
