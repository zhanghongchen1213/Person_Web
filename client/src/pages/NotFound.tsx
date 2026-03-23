import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";
import SEOHead from "@/components/SEOHead";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <SEOHead
        title="404 页面不存在"
        description="请求的页面不存在或已被移动。"
        pathname="/404"
        noindex
      />
      <main className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-lg mx-4 border-2 border-border">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex justify-center mb-6">
              <AlertCircle className="h-16 w-16 text-destructive" />
            </div>

            <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>

            <h2 className="text-xl font-semibold text-foreground mb-4">
              Page Not Found
            </h2>

            <p className="text-muted-foreground mb-8 leading-relaxed">
              Sorry, the page you are looking for doesn't exist.
              <br />
              It may have been moved or deleted.
            </p>

            <div
              id="not-found-button-group"
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Button onClick={handleGoHome}>
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
