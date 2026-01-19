import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getGitHubLoginUrl } from "@/const";
import { Github } from "lucide-react";

export default function Login() {
  const handleGitHubLogin = () => {
    window.location.href = getGitHubLoginUrl();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">管理员登录</CardTitle>
          <CardDescription>
            使用 GitHub 账号登录以访问管理员功能
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGitHubLogin}
            className="w-full"
            size="lg"
            variant="default"
          >
            <Github className="mr-2 h-5 w-5" />
            使用 GitHub 登录
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>登录后将自动跳转到首页</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
