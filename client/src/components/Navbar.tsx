import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Menu, Search, X, User, LogOut, PenSquare, LayoutList } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavbarProps {
  onSearch?: (query: string) => void;
}

export default function Navbar({ onSearch }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navLinks = [
    { href: "/", label: "首页" },
    { href: "/articles", label: "文章" },
    { href: "/archive", label: "归档" },
    { href: "/about", label: "关于" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/articles?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b-2 border-border">
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl md:text-2xl font-black tracking-tighter uppercase">
              [BLOG]
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-bold uppercase tracking-wider transition-all hover:underline underline-offset-4 decoration-2 ${
                  location === link.href ? "underline" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 hover:bg-muted transition-colors"
              aria-label="搜索"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Auth */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 hover:bg-muted transition-colors">
                    <Avatar className="w-8 h-8 border-2 border-border">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 border-2 border-border">
                  <div className="px-2 py-1.5 text-sm font-medium">{user.name}</div>
                  <DropdownMenuSeparator />
                  {user.role === "admin" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/write" className="flex items-center gap-2 cursor-pointer">
                          <PenSquare className="w-4 h-4" />
                          写文章
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/articles" className="flex items-center gap-2 cursor-pointer">
                          <LayoutList className="w-4 h-4" />
                          文章管理
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" />
                      个人中心
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer">
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 hover:bg-muted transition-colors"
              aria-label="搜索"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-muted transition-colors"
              aria-label="菜单"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="py-4 border-t-2 border-border animate-fade-in">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索文章..."
                className="brutalist-input flex-1"
                autoFocus
              />
              <button type="submit" className="brutalist-btn">
                搜索
              </button>
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t-2 border-border animate-fade-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-3 px-4 text-lg font-bold uppercase tracking-wider transition-colors hover:bg-muted ${
                    location === link.href ? "bg-muted" : ""
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="geo-line-h my-2" />
              {isAuthenticated && user ? (
                <>
                  {user.role === "admin" && (
                    <>
                      <Link
                        href="/write"
                        onClick={() => setMobileMenuOpen(false)}
                        className="py-3 px-4 text-lg font-bold uppercase tracking-wider transition-colors hover:bg-muted flex items-center gap-2"
                      >
                        <PenSquare className="w-5 h-5" />
                        写文章
                      </Link>
                      <Link
                        href="/admin/articles"
                        onClick={() => setMobileMenuOpen(false)}
                        className="py-3 px-4 text-lg font-bold uppercase tracking-wider transition-colors hover:bg-muted flex items-center gap-2"
                      >
                        <LayoutList className="w-5 h-5" />
                        文章管理
                      </Link>
                    </>
                  )}
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-3 px-4 text-lg font-bold uppercase tracking-wider transition-colors hover:bg-muted flex items-center gap-2"
                  >
                    <User className="w-5 h-5" />
                    个人中心
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="py-3 px-4 text-lg font-bold uppercase tracking-wider transition-colors hover:bg-muted flex items-center gap-2 text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    退出登录
                  </button>
                </>
              ) : (
                <a
                  href={getLoginUrl()}
                  className="py-3 px-4 text-lg font-bold uppercase tracking-wider bg-primary text-primary-foreground"
                >
                  登录
                </a>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
