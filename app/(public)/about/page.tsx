import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">About Us</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Learn more about our mission, vision, and the team behind this application.
        </p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
            <CardDescription>What drives us forward</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              We are committed to building innovative solutions that make a difference
              in people's lives. Our mission is to create technology that is both
              powerful and accessible to everyone.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Our Vision</CardTitle>
            <CardDescription>Where we're headed</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              We envision a world where technology seamlessly integrates with
              daily life, empowering individuals and organizations to achieve
              their goals more efficiently and effectively.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Our Values</CardTitle>
            <CardDescription>What we stand for</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Innovation and creativity</li>
              <li>User-centered design</li>
              <li>Quality and reliability</li>
              <li>Transparency and integrity</li>
              <li>Continuous learning</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Get in Touch</CardTitle>
            <CardDescription>We'd love to hear from you</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Have questions or want to learn more? Don't hesitate to reach out
              to our team.
            </p>
            <a 
              href="/contact" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Contact Us
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 