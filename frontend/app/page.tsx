import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  ShieldCheck, 
  Zap,
  Globe,
  Lock,
  Sparkles
} from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-royal-gradient">
      {/* Premium Navigation */}
      <header className="px-6 lg:px-14 h-20 flex items-center glass sticky top-0 z-50 border-b-0">
        <Link className="flex items-center justify-center font-bold text-2xl text-blue-600 tracking-tight" href="/">
          <div className="p-2 bg-blue-600 rounded-lg mr-2.5 shadow-lg shadow-blue-500/20 text-white">
            <BarChart3 className="h-6 w-6" />
          </div>
          <span>FinHealth</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-8">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
            Log in
          </Link>
          <Link href="/register">
            <Button className="rounded-full px-6 shadow-md hover:shadow-lg transition-all active:scale-95 bg-blue-600">
              Sign up
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Dynamic Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-24 md:pt-32 md:pb-48">
          <div className="container mx-auto px-4 lg:px-14 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-left duration-1000">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-wide uppercase w-fit border border-blue-100">
                  <Sparkles className="h-3 w-3" />
                  <span>AI-Powered Wealth Intelligence</span>
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none text-slate-900 leading-tight">
                    Master Your <br />
                    <span className="text-blue-600">Financial Future</span>
                  </h1>
                  <p className="max-w-[600px] text-slate-500 md:text-xl/relaxed lg:text-lg/relaxed xl:text-xl/relaxed">
                    Personalized insights, real-time tracking, and predictive analytics that actually help you save. Experience the next generation of financial management.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link href="/register">
                    <Button size="lg" className="h-14 px-10 rounded-full font-semibold text-lg shadow-xl shadow-blue-600/20 hover:scale-105 transition-all bg-blue-600">
                      Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="h-14 px-10 rounded-full font-semibold text-lg glass text-slate-700 hover:bg-white/50 transition-all border-slate-200">
                      View Demo
                    </Button>
                  </Link>
                </div>
                
                {/* Stats Bar */}
                <div className="pt-8 flex items-center gap-8 text-slate-400">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-slate-900">$2.4M+</span>
                    <span className="text-xs uppercase tracking-widest font-medium">Assets Tracked</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-slate-900">15K+</span>
                    <span className="text-xs uppercase tracking-widest font-medium">Active Users</span>
                  </div>
                </div>
              </div>

              <div className="relative flex justify-center lg:justify-end animate-in fade-in slide-in-from-right duration-1000">
                <div className="relative w-full max-w-[600px] aspect-square rounded-3xl overflow-hidden glass shadow-2xl p-4 animate-float border-white/40">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-transparent pointer-events-none" />
                  <img 
                    src="/hero.png" 
                    alt="Financial Wealth Assets Illustration" 
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
                {/* Floating Elements */}
                <div className="absolute -top-6 -left-6 glass p-4 rounded-2xl shadow-xl border-white animate-float hidden md:block" style={{ animationDelay: '0.5s' }}>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
                <div className="absolute -bottom-6 -right-6 glass p-4 rounded-2xl shadow-xl border-white animate-float hidden md:block" style={{ animationDelay: '1.2s' }}>
                  <ShieldCheck className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Background Decorative Mesh */}
          <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-100/30 blur-[120px] rounded-full -z-0 translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-blue-50/50 blur-[100px] rounded-full -z-0 -translate-x-1/4 translate-y-1/4" />
        </section>

        {/* Feature Grid Section */}
        <section className="w-full py-24 md:py-32 bg-white flex justify-center relative overflow-hidden">
          <div className="container px-4 md:px-6 relative z-10 mx-auto">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">Everything you need to <span className="text-blue-600">thrive</span></h2>
              <p className="text-slate-500 max-w-[600px] mx-auto text-lg">Powerful tools built into a single elegant interface to help you make smarter financial decisions.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="group p-8 glass rounded-3xl border border-slate-100 hover:border-blue-200 transition-all hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-2">
                <div className="mb-6 p-4 bg-blue-600 text-white rounded-2xl w-fit shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                  <PieChart className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Holistic Breakdown</h3>
                <p className="text-slate-500 leading-relaxed">
                  See precisely where your money goes with auto-categorized expenses and beautiful visualizations.
                </p>
              </div>
              
              <div className="group p-8 glass rounded-3xl border border-slate-100 hover:border-blue-200 transition-all hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-2">
                <div className="mb-6 p-4 bg-blue-600 text-white rounded-2xl w-fit shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                  <Zap className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">AI Budgeting</h3>
                <p className="text-slate-500 leading-relaxed">
                  Our advanced engine detects overspending trends before they happen and suggests actionable changes.
                </p>
              </div>
              
              <div className="group p-8 glass rounded-3xl border border-slate-100 hover:border-blue-200 transition-all hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-2">
                <div className="mb-6 p-4 bg-blue-600 text-white rounded-2xl w-fit shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                  <Globe className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Savings Prediction</h3>
                <p className="text-slate-500 leading-relaxed">
                  Predict your financial future. We forecast next month's savings rate based on your real-time data.
                </p>
              </div>
            </div>
          </div>
          
          {/* Section Decoration */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        </section>

        {/* Security / Trust Section */}
        <section className="w-full py-24 bg-slate-900 text-white">
          <div className="container mx-auto px-4 lg:px-14">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl w-fit border border-blue-600/30">
                  <Lock className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl">Your security is our <br />ultimate priority</h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  We use bank-grade AES-256 encryption to protect your financial data. 
                  Your credentials are never stored, and we maintain strict SSL/TLS standards for all transmissions.
                </p>
                <div className="flex items-center gap-4 text-sm font-medium pt-4">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="h-5 w-5 text-blue-500" /> Advanced Encryption</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck className="h-5 w-5 text-blue-500" /> Biometric Ready</span>
                </div>
              </div>
              <div className="glass bg-white/10 border-white/20 p-8 rounded-3xl relative overflow-hidden backdrop-blur-3xl shadow-2xl">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/20 rounded-full blur-[60px]" />
                <div className="space-y-6 relative z-10">
                   <Sparkles className="h-8 w-8 text-blue-400 opacity-50 mb-4" />
                   <h4 className="text-2xl font-semibold italic text-white leading-snug">
                     "The smartest move I've made for my monthly budgeting. The predictions are scarily accurate."
                   </h4>
                   <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg">
                       ST
                     </div>
                     <div>
                       <p className="text-base font-bold text-white leading-none">Dr. Sarah Thompson</p>
                       <p className="text-sm text-slate-400 font-medium mt-1">
                         Financial Analyst <span className="text-blue-500 mx-1">•</span> WealthCorp
                       </p>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-24 flex justify-center">
           <div className="container px-4">
             <div className="p-12 md:p-20 rounded-[4rem] bg-blue-600 text-white text-center space-y-8 relative overflow-hidden shadow-3xl shadow-blue-500/40">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)]" />
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight relative z-10">
                  Ready to transform your <br />wealth?
                </h2>
                <div className="relative z-10 pt-4 flex flex-col items-center gap-6">
                  <Link href="/register">
                    <Button size="lg" className="h-16 px-12 rounded-full bg-white text-blue-600 font-bold text-xl hover:scale-105 transition-all shadow-2xl">
                      Get Started Now
                    </Button>
                  </Link>
                  <p className="text-blue-100/70 font-medium">Join 15,000+ users mastering their money today.</p>
                </div>
             </div>
           </div>
        </section>
      </main>

      {/* Modern Footer */}
      <footer className="py-12 bg-white flex justify-center border-t border-slate-100">
        <div className="container px-4 lg:px-14 flex flex-col md:flex-row items-center justify-between gap-8 mx-auto">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link className="flex items-center font-bold text-xl text-blue-600" href="/">
              <div className="p-1.5 bg-blue-600 rounded-lg mr-2 text-white">
                <BarChart3 className="h-4 w-4" />
              </div>
              <span>FinHealth</span>
            </Link>
            <p className="text-slate-400 text-sm">Empowering financial freedom through intelligence.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8 text-sm font-medium text-slate-500">
             <Link href="#" className="hover:text-blue-600 transition-colors">Platform</Link>
             <Link href="#" className="hover:text-blue-600 transition-colors">Resources</Link>
             <Link href="#" className="hover:text-blue-600 transition-colors">Security</Link>
             <Link href="#" className="hover:text-blue-600 transition-colors">Privacy</Link>
          </div>
          
          <div className="text-xs text-slate-400">
            © 2026 FinHealth Intelligence. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
