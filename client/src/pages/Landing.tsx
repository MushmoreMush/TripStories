import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Compass, 
  Users, 
  Lock, 
  BookOpen, 
  ArrowRight, 
  Shield, 
  Heart,
  Sparkles,
  TrendingUp,
  MessageCircle
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary via-purple-500 to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Trip Reporter</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild data-testid="button-login">
              <a href="/api/login">Log in</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative py-20 md:py-32 lg:py-40 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8" />
          <div className="absolute top-10 left-10 w-80 h-80 bg-gradient-to-br from-primary/20 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-br from-accent/20 to-rose-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/5 via-transparent to-cyan-500/5 rounded-full blur-3xl" />
          
          <div className="container px-4 md:px-8 mx-auto max-w-6xl relative">
            <div className="flex flex-col items-center text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/15 to-accent/15 text-primary text-sm font-medium border border-primary/20">
                <Sparkles className="h-4 w-4" />
                <span>Your wellness journey, documented</span>
              </div>
              
              <div className="space-y-6 max-w-3xl">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                  Reflect, Document,
                  <br />
                  <span className="bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent">
                    Share with Care
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  A safe, private platform to track and share your experiences with trusted friends.
                  Reflect on your set, setting, and journey in a supportive community.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="text-base px-8 bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25" asChild data-testid="button-get-started">
                  <a href="/api/login">
                    Start Your Journal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="text-base border-2" data-testid="button-learn-more">
                  Learn More
                </Button>
              </div>
              
              <div className="flex items-center gap-8 pt-8 text-sm text-muted-foreground flex-wrap justify-center">
                <div className="flex items-center gap-2" data-testid="feature-private">
                  <Lock className="h-4 w-4 text-primary" />
                  <span>Private by default</span>
                </div>
                <div className="flex items-center gap-2" data-testid="feature-secure">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Secure & encrypted</span>
                </div>
                <div className="flex items-center gap-2" data-testid="feature-nonjudgmental">
                  <Heart className="h-4 w-4 text-primary" />
                  <span>Non-judgmental</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-gradient-to-b from-muted/30 to-background">
          <div className="container px-4 md:px-8 mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                Thoughtful Documentation
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Track every aspect of your experiences with structured journaling designed for mindful reflection.
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="hover-elevate group overflow-visible border-0 shadow-md bg-gradient-to-br from-card via-card to-primary/5">
                <CardContent className="pt-6 pb-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform shadow-lg shadow-primary/20">
                    <BookOpen className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Structured Reports</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Document substance, amount, set (mindset), setting, and your complete experience narrative with guided prompts.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="hover-elevate group overflow-visible border-0 shadow-md bg-gradient-to-br from-card via-card to-accent/5">
                <CardContent className="pt-6 pb-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform shadow-lg shadow-accent/20">
                    <Users className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Trusted Sharing</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Share your reports only with friends you trust. Build a supportive network of like-minded individuals.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="hover-elevate group overflow-visible border-0 shadow-md bg-gradient-to-br from-card via-card to-purple-500/5">
                <CardContent className="pt-6 pb-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform shadow-lg shadow-purple-500/20">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Complete Privacy</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Your data stays private. Reports are only visible to your connected friends, never shared publicly.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="hover-elevate group overflow-visible border-0 shadow-md bg-gradient-to-br from-card via-card to-cyan-500/5">
                <CardContent className="pt-6 pb-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform shadow-lg shadow-cyan-500/20">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Personal Insights</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Track patterns over time with beautiful visualizations. Understand your journey with data-driven insights.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="hover-elevate group overflow-visible border-0 shadow-md bg-gradient-to-br from-card via-card to-rose-500/5">
                <CardContent className="pt-6 pb-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform shadow-lg shadow-rose-500/20">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Supportive Reactions</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Express care, solidarity, and support for your friends with thoughtful reaction options.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="hover-elevate group overflow-visible border-0 shadow-md bg-gradient-to-br from-card via-card to-amber-500/5">
                <CardContent className="pt-6 pb-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform shadow-lg shadow-amber-500/20">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Tagging System</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Categorize experiences with effects, emotions, and insights tags for easy filtering and reflection.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className="container px-4 md:px-8 mx-auto max-w-5xl">
            <div className="grid gap-12 md:grid-cols-2 items-center">
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Safe Space</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      A non-judgmental environment designed for honest reflection and personal growth.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-pink-500/5 flex items-center justify-center flex-shrink-0">
                    <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Community Care</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Connect with friends who understand. Read their experiences and share your own journey.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Growth Focused</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Use insights and patterns to understand yourself better and make informed decisions.
                    </p>
                  </div>
                </div>
              </div>
              
              <Card className="p-8 bg-gradient-to-br from-card to-muted/30 border-0 shadow-lg">
                <blockquote className="space-y-4">
                  <div className="text-4xl text-primary/20 font-serif">"</div>
                  <p className="text-muted-foreground italic leading-relaxed text-lg">
                    Having a structured way to document and reflect on my experiences has been invaluable. 
                    The set and setting prompts help me understand patterns I never noticed before.
                  </p>
                  <footer className="text-sm font-medium pt-2">
                    — A Trip Reporter User
                  </footer>
                </blockquote>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-gradient-to-r from-primary via-purple-600 to-accent text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="container px-4 md:px-8 mx-auto max-w-4xl text-center relative">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Ready to Start Your Journal?
            </h2>
            <p className="text-white/85 mb-8 max-w-xl mx-auto text-lg">
              Join a community of mindful explorers documenting their experiences with care and intention.
            </p>
            <Button
              size="lg"
              className="text-base px-8 bg-white text-primary shadow-xl"
              asChild
              data-testid="button-cta-login"
            >
              <a href="/api/login">
                Create Your Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-10 bg-gradient-to-br from-muted/30 to-muted/10">
        <div className="container px-4 md:px-8 mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary via-purple-500 to-accent flex items-center justify-center shadow-md">
                <Compass className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm text-muted-foreground">
                Trip Reporter - Medical Wellness Journal
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Support Resources</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
