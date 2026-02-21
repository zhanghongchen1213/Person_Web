import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const Home = React.lazy(() => import("./pages/Home"));
const Articles = React.lazy(() => import("./pages/Articles"));
const ArticleDetail = React.lazy(() => import("./pages/ArticleDetail"));
const Archive = React.lazy(() => import("./pages/Archive"));
const About = React.lazy(() => import("./pages/About"));
const WriteArticle = React.lazy(() => import("./pages/WriteArticle"));
const DocReader = React.lazy(() => import("./pages/DocReader"));
const AdminArticles = React.lazy(() => import("./pages/AdminArticles"));
const AdminDatabase = React.lazy(() => import("./pages/AdminDatabase"));
const AdminAnalytics = React.lazy(() => import("./pages/AdminAnalytics"));
const Login = React.lazy(() => import("./pages/Login"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/articles" component={Articles} />
      <Route path="/article/:slug" component={ArticleDetail} />
      <Route path="/docs/:category/:slug" component={DocReader} />
      <Route path="/archive" component={Archive} />
      <Route path="/about" component={About} />
      <Route path="/login" component={Login} />
      <Route path="/write" component={WriteArticle} />
      <Route path="/edit/:id" component={WriteArticle} />
      <Route path="/admin/articles" component={AdminArticles} />
      <Route path="/admin/database" component={AdminDatabase} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Suspense fallback={<div />}>
            <Router />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
