"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Home, Search, FileX, Mail } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Main 404 Card */}
        <Card className="text-center shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 dark:bg-blue-900/20 w-24 h-24 rounded-full flex items-center justify-center">
                <FileX className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              404
            </CardTitle>
            <CardDescription className="text-xl text-gray-600 dark:text-gray-300">
              Oops! This page doesn't exist
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
              The page you're looking for might have been moved, deleted, or doesn't exist. 
              Don't worry, we'll help you find your way back.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>
            
            {/* Additional Help */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Looking for something specific?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button asChild variant="ghost" className="justify-start">
                  <Link href="/portal" className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Browse Portals
                  </Link>
                </Button>
                
                <Button asChild variant="ghost" className="justify-start">
                  <Link href="/contact" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Contact Support
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Back Button */}
            <div className="pt-4">
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Branding */}
        <div className="text-center mt-8">
          <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            Clientlane
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Share smarter. Collaborate better.
          </p>
        </div>
      </div>
    </div>
  );
} 