import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Articles from "./pages/Articles";
import ArticleDetail from "./pages/ArticleDetail";
import Archive from "./pages/Archive";
import About from "./pages/About";
import WriteArticle from "./pages/WriteArticle";
import DocReader from "./pages/DocReader";
import AdminArticles from "./pages/AdminArticles";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/articles" component={Articles} />
      <Route path="/article/:slug" component={ArticleDetail} />
      <Route path="/docs/:category/:slug" component={DocReader} />
      <Route path="/archive" component={Archive} />
      <Route path="/about" component={About} />
      <Route path="/write" component={WriteArticle} />
      <Route path="/edit/:id" component={WriteArticle} />
      <Route path="/admin/articles" component={AdminArticles} />
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
