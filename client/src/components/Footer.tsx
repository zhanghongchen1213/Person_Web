import { Link } from "wouter";
import { Github, MessageCircle, Mail } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

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
              一个极简主义的个人博客，专注于技术分享与思考。
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
            <div className="flex gap-4">
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
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t-2 border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} [BLOG]. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Built with brutalist aesthetics
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
