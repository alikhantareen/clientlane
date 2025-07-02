import {
  ArrowRight,
  CheckCircle,
  Users,
  Link,
  FileText,
  MessageCircle,
  Shield,
  Zap,
  Star,
  ChevronDown,
} from "lucide-react";
import { DarkModeToggle } from "@/components/ui/DarkModeToggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a
                href="#"
                className="text-2xl font-bold text-blue-600 cursor-pointer focus:outline-none"
                aria-label="Scroll to top"
              >
                Clientlane
              </a>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-gray-600 hover:text-gray-900"
              >
                How it Works
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">
                Pricing
              </a>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Get Early Access
              </button>
              <DarkModeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-36">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Share smarter.
              <span className="text-blue-600"> Collaborate better.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              A shared client portal system for freelancers and agencies to
              organize files, updates, and conversations in one link — no more
              messy Google Docs or emails.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center">
                Get Early Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors">
                See Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need in one place
            </h2>
            <p className="text-xl text-gray-600">
              Stop juggling multiple tools. Clientlane brings order to client
              collaboration.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Link className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">One Shareable Link</h3>
              <p className="text-gray-600">
                Generate a single link per client that contains all project
                updates, files, and communications.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">File Organization</h3>
              <p className="text-gray-600">
                Upload and organize all project deliverables, images, and
                documents in one central location.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Inline Comments</h3>
              <p className="text-gray-600">
                Collaborate with contextual comments and discussions right where
                the work happens.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Updates</h3>
              <p className="text-gray-600">
                Keep clients in the loop with activity feeds and instant
                notifications for all project changes.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Access</h3>
              <p className="text-gray-600">
                Role-based permissions ensure clients see exactly what they need
                to see, nothing more.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Client Signup</h3>
              <p className="text-gray-600">
                Clients access their portal instantly with just a link — no
                accounts or passwords required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600">
              Get up and running in minutes, not hours
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Sign Up</h3>
              <p className="text-gray-600">
                Create your Clientlane account in under 30 seconds
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Create Portal</h3>
              <p className="text-gray-600">
                Build a custom portal with drag-and-drop modules for your client
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Share Link</h3>
              <p className="text-gray-600">
                Send one secure link to your client — no setup required on their
                end
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-lg font-semibold mb-2">Collaborate</h3>
              <p className="text-gray-600">
                Share updates, get feedback, and deliver projects seamlessly
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* UI Preview Placeholder */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              See Clientlane in action
            </h2>
            <p className="text-xl text-gray-600">
              A clean, professional interface that both you and your clients
              will love
            </p>
          </div>
          <div className="bg-gray-100 rounded-lg p-8 h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="bg-white w-24 h-24 rounded-lg shadow-lg mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-12 w-12 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">
                Dashboard Preview Coming Soon
              </p>
              <p className="text-gray-400 text-sm">
                Screenshots of portal views, comment threads, and file
                management
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built for modern service providers
            </h2>
            <p className="text-xl text-gray-600">
              Whether you're a solo freelancer or growing agency, Clientlane
              scales with you
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Freelancers</h3>
              <p className="text-gray-600 mb-4">
                Design, development, marketing, and consulting professionals who
                need to keep clients organized and engaged.
              </p>
              <div className="text-sm text-gray-500">
                <strong>Current pain:</strong> Scattered files across email,
                Google Drive, and messaging apps
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Small Agencies</h3>
              <p className="text-gray-600 mb-4">
                Teams managing multiple clients who want to present a
                professional, organized front to their business.
              </p>
              <div className="text-sm text-gray-500">
                <strong>Current pain:</strong> Client confusion about project
                status and deliverable locations
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">
                Project-Based Services
              </h3>
              <p className="text-gray-600 mb-4">
                Writers, editors, marketers, and consultants who deliver work in
                phases and need client buy-in along the way.
              </p>
              <div className="text-sm text-gray-500">
                <strong>Current pain:</strong> Long email threads and version
                control nightmares
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What early users are saying
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 text-yellow-400 fill-current"
                  />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Finally, no more 'where did you put that file?' emails. My
                clients love having everything in one place."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                  JS
                </div>
                <div>
                  <div className="font-semibold">Jessica Chen</div>
                  <div className="text-sm text-gray-500">Brand Designer</div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 text-yellow-400 fill-current"
                  />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Game changer for client communication. We look so much more
                professional now, and projects move faster."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                  MR
                </div>
                <div>
                  <div className="font-semibold">Mike Rodriguez</div>
                  <div className="text-sm text-gray-500">Web Developer</div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 text-yellow-400 fill-current"
                  />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Our clients actually thank us for using Clientlane. It's that
                much easier for them to stay updated on projects."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                  AT
                </div>
                <div>
                  <div className="font-semibold">Alex Thompson</div>
                  <div className="text-sm text-gray-500">Agency Owner</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, scale as you grow
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Freemium Launch</h3>
            <div className="text-5xl font-bold text-blue-600 mb-2">Free</div>
            <p className="text-gray-600 mb-6">1 client portal to get started</p>
            <ul className="text-left mb-8 space-y-2">
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span>1 active client portal</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span>Unlimited file uploads</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span>Comments & collaboration</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span>Activity feed & notifications</span>
              </li>
            </ul>
            <p className="text-sm text-gray-500 mb-6">
              Paid plans starting at $9/month for unlimited portals, custom
              branding, and advanced features. Billing powered by Stripe.
            </p>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors w-full">
              Get Early Access
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center justify-between">
                Is my data secure?
                <ChevronDown className="h-5 w-5" />
              </h3>
              <p className="text-gray-600">
                Absolutely. We use enterprise-grade security with encrypted data
                transmission and storage. Each portal has unique access
                controls, and you can revoke access at any time.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center justify-between">
                Can I revoke access to a shared portal?
                <ChevronDown className="h-5 w-5" />
              </h3>
              <p className="text-gray-600">
                Yes, you have full control. You can disable portal links, change
                access permissions, or archive completed projects at any time
                from your dashboard.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center justify-between">
                Can I manage multiple clients?
                <ChevronDown className="h-5 w-5" />
              </h3>
              <p className="text-gray-600">
                Definitely! Your dashboard shows all client portals in one
                place. The free plan includes 1 portal, and paid plans offer
                unlimited portals for all your clients.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center justify-between">
                What's coming next?
                <ChevronDown className="h-5 w-5" />
              </h3>
              <p className="text-gray-600">
                We're building client login dashboards, analytics to see who
                viewed what and when, portal templates for faster setup, and
                custom branding options with your logo and subdomain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-blue-600 dark:bg-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to streamline your client communication?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of freelancers and agencies who've already simplified
            their workflow with Clientlane.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900"
            />
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Get Early Access
            </button>
          </div>
          <p className="text-sm text-blue-200 mt-4">
            No spam, ever. Unsubscribe at any time.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <span className="text-2xl font-bold text-white">Clientlane</span>
            </div>
            <div className="flex space-x-6 text-gray-400">
              <a href="#" className="hover:text-white">
                Privacy
              </a>
              <a href="#" className="hover:text-white">
                Terms
              </a>
              <a href="#" className="hover:text-white">
                Support
              </a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Clientlane. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
