"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, ShieldCheck, Mail, User as UserIcon, Lock } from "lucide-react";

export default function ProfilePage() {
  const { user, checkAuth } = useAuth();
  
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Sync form fields when user data becomes available
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setIsUpdatingProfile(true);
    try {
      await api.auth.updateProfile({ 
        full_name: fullName.trim(), 
        email: email.trim().toLowerCase() 
      });
      toast.success("Profile updated successfully");
      await checkAuth(); // Refresh user data in context
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await api.auth.updateProfile({ 
        password: newPassword 
      });
      toast.success("Password changed successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Profile Settings</h1>
          <p className="text-slate-500">Manage your account information and security preferences.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Personal Info Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <UserIcon className="h-5 w-5" />
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </div>
              <CardDescription>Update your public information and email address.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input 
                    id="full_name" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Lock className="h-5 w-5" />
                <CardTitle className="text-lg">Security & Password</CardTitle>
              </div>
              <CardDescription>Keep your account secure by using a strong password.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input 
                    id="new_password" 
                    type="password"
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input 
                    id="confirm_password" 
                    type="password"
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Repeat new password"
                    required
                  />
                </div>
                <Button type="submit" variant="outline" className="w-full border-blue-200 hover:bg-blue-50 text-blue-700" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Account Status Information */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 text-green-700 rounded-full">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Account Verified</h4>
                <p className="text-sm text-slate-500 mt-1">
                  Your account is fully functional and protected by our security systems. 
                  Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}.
                </p>
                <div className="mt-4 p-3 bg-white rounded border border-slate-200 text-xs text-slate-500 flex items-center">
                  <Mail className="h-3 w-3 mr-2 text-slate-400" />
                  Your email is managed securely and never shared with third parties.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
