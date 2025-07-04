"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, Camera, Save, Shield, Check, X, Trash2, Eye, EyeOff } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useUser } from "@/lib/contexts/UserContext";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { user, loading: profileLoading, updateUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    image: undefined as File | undefined,
  });
  
  // Original values to track changes
  const [originalName, setOriginalName] = useState("");
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  // Password verification state
  const [passwordState, setPasswordState] = useState<'initial' | 'verified'>('initial');
  
  // Check if there are any changes in the profile form
  const hasProfileChanges = () => {
    return profileForm.name !== originalName || profileForm.image !== undefined;
  };
  
  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name,
        image: undefined,
      });
      setOriginalName(user.name);
    }
  }, [user]);
  
  // Clean up image preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);
  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      const file = files?.[0];
      if (file) {
        // Clean up previous preview URL
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
        }
        
        // Create new preview URL
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
        setProfileForm((prev) => ({ ...prev, [name]: file }));
      }
    } else {
      setProfileForm((prev) => ({ ...prev, [name]: value }));
    }
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleRemoveImage = async () => {
    setLoading(true);
    
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          removeImage: true,
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        // Update global user state immediately
        updateUser(data.user);
        toast.success("Profile image removed successfully!");
        
        // Clean up preview
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
          setImagePreview(null);
        }
        setProfileForm(prev => ({ ...prev, image: undefined }));
        setShowRemoveDialog(false);
        
        // Update original name to reflect current state
        setOriginalName(data.user.name);
      } else {
        toast.error(data.error || "Failed to remove profile image");
      }
    } catch (err) {
      toast.error("Failed to remove profile image");
    } finally {
      setLoading(false);
    }
  };
  
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("name", profileForm.name);
      if (profileForm.image) {
        formData.append("image", profileForm.image);
      }
      
      const res = await fetch("/api/user", {
        method: "PATCH",
        body: formData,
      });
      
      const data = await res.json();
      if (res.ok) {
        // Update global user state immediately
        updateUser(data.user);
        toast.success("Profile updated successfully!");
        
        // Clean up preview after successful save
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
          setImagePreview(null);
        }
        setProfileForm(prev => ({ ...prev, image: undefined }));
        
        // Update original name to reflect saved changes
        setOriginalName(data.user.name);
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyPassword = async () => {
    setPasswordLoading(true);
    
    try {
      const res = await fetch("/api/user/verify-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setPasswordState('verified');
        toast.success("Password verified successfully!");
      } else {
        toast.error(data.error || "Failed to verify password");
      }
    } catch (err) {
      toast.error("Failed to verify password");
    } finally {
      setPasswordLoading(false);
    }
  };
  
  const handleUpdatePassword = async () => {
    setPasswordLoading(true);
    
    try {
      const res = await fetch("/api/user/update-password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success("Password updated successfully!");
        setPasswordState('initial');
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(data.error || "Failed to update password");
      }
    } catch (err) {
      toast.error("Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };
  
  const handleCancelPasswordChange = () => {
    setPasswordState('initial');
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };
  
  // Determine which image to show: preview, current user image, or default
  const displayImage = imagePreview || user?.image;
  
  if (profileLoading) {
    return (
      <main className="max-w-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </main>
    );
  }
  
  return (
    <main className="max-w-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="flex flex-col gap-8">
        {/* Profile Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Profile</h2>
          </div>
          
          {/* Profile Image */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {displayImage ? (
                  <Image
                    src={displayImage}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <label
                htmlFor="image"
                className="absolute bottom-0 right-0 bg-black text-white p-1.5 rounded-full cursor-pointer hover:bg-gray-800 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </label>
              {(user?.image || imagePreview) && (
                <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
                  <DialogTrigger asChild>
                    <button
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full cursor-pointer hover:bg-red-600 transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Remove Profile Image</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to remove your profile image? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowRemoveDialog(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleRemoveImage}
                        disabled={loading}
                      >
                        {loading ? "Removing..." : "Remove Image"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-2">Click to change profile picture</p>
          </div>
          
          <form className="flex flex-col gap-4" onSubmit={handleProfileSubmit}>
            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleProfileChange}
              className="hidden"
            />
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Your name"
                value={profileForm.name}
                onChange={handleProfileChange}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-gray-50"
              />
            </div>
            
            <Button 
              type="submit" 
              className="bg-black text-white hover:bg-gray-800 gap-2 cursor-pointer disabled:cursor-not-allowed"
              disabled={loading || !hasProfileChanges()}
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </Card>
        
        {/* Password Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Change Password</h2>
          </div>
          
          {passwordState === 'initial' ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter your current password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    onClick={() => setShowCurrentPassword(v => !v)}
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <Button 
                onClick={handleVerifyPassword}
                disabled={!passwordForm.currentPassword || passwordLoading}
                className="bg-black text-white hover:bg-gray-800 gap-2 w-fit cursor-pointer disabled:cursor-not-allowed"
              >
                {passwordLoading ? (
                  "Verifying..."
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Verify
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    onClick={() => setShowNewPassword(v => !v)}
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleUpdatePassword}
                  disabled={!passwordForm.newPassword || !passwordForm.confirmPassword || passwordLoading}
                  className="bg-black text-white hover:bg-gray-800 gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {passwordLoading ? (
                    "Updating..."
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Update Password
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleCancelPasswordChange}
                  variant="outline"
                  className="gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
} 