"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  LogOut,
  Users,
  Trash2,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Calendar,
  FileText,
  Mail,
  AlertCircle,
} from "lucide-react";

interface User {
  userId: string;
  email: string;
  planType: string;
  planPeriod: string | null;
  subscriptionStatus: string;
  literatureReviewCount: number;
  trialStartDate: string | null;
  subscriptionId: string | null;
  createdAt: string;
  projectCount: number;
}

interface UserDetails {
  profile: User;
  projects: any[];
  totalPapers: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<Record<string, UserDetails>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/users");
      if (response.status === 401) {
        router.push("/secretlogin");
        return;
      }
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    if (userDetails[userId]) {
      setExpandedUser(expandedUser === userId ? null : userId);
      return;
    }

    setLoadingDetails((prev) => ({ ...prev, [userId]: true }));
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user details");
      const data = await response.json();
      setUserDetails((prev) => ({ ...prev, [userId]: data }));
      setExpandedUser(userId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to fetch details");
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const updateUserSubscription = async (
    userId: string,
    planType: string,
    planPeriod: string | null,
    subscriptionStatus: string
  ) => {
    setUpdatingUser(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType, planPeriod, subscriptionStatus }),
      });

      if (!response.ok) throw new Error("Failed to update user");

      const data = await response.json();
      
      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === userId
            ? { 
                ...u, 
                planType: data.profile.planType, 
                planPeriod: data.profile.planPeriod,
                subscriptionStatus: data.profile.subscriptionStatus 
              }
            : u
        )
      );

      alert("User subscription updated successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setUpdatingUser(null);
    }
  };

  const deleteUser = async (userId: string, email: string) => {
    if (
      !confirm(
        `Are you absolutely sure you want to delete user ${email}?\n\nThis will permanently delete:\n- User account\n- All projects\n- All papers\n- All PDF files\n\nThis action CANNOT be undone!`
      )
    ) {
      return;
    }

    if (
      prompt(`Type "${email}" to confirm deletion:`) !== email
    ) {
      alert("Deletion cancelled - email did not match");
      return;
    }

    setDeletingUser(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete user");

      setUsers((prev) => prev.filter((u) => u.userId !== userId));
      setExpandedUser(null);
      delete userDetails[userId];

      alert("User deleted successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeletingUser(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/secretlogin");
  };

  const getPlanBadgeColor = (planType: string) => {
    switch (planType) {
      case "FREE": return "bg-gray-100 text-gray-700";
      case "PREMIUM": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getPlanPeriodBadgeColor = (period: string | null) => {
    if (!period) return "bg-gray-100 text-gray-700";
    switch (period) {
      case "MONTHLY": return "bg-green-100 text-green-700";
      case "YEARLY": return "bg-purple-100 text-purple-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-700";
      case "TRIALING": return "bg-yellow-100 text-yellow-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      case "PAST_DUE": return "bg-orange-100 text-orange-700";
      case "EXPIRED": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-xs text-gray-500">User Management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                <p className="text-sm text-gray-500">Total Users</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {users.reduce((sum, u) => sum + u.projectCount, 0)}
                </p>
                <p className="text-sm text-gray-500">Total Projects</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter((u) => u.planType === "PREMIUM").length}
                </p>
                <p className="text-sm text-gray-500">Premium Users</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-gray-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter((u) => u.planType === "FREE").length}
                </p>
                <p className="text-sm text-gray-500">Free Users</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Users List */}
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.userId} className="overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                      <p className="font-medium text-gray-900 truncate">
                        {user.email}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge className={getPlanBadgeColor(user.planType)}>
                        {user.planType}
                      </Badge>
                      {user.planPeriod && (
                        <Badge className={getPlanPeriodBadgeColor(user.planPeriod)}>
                          {user.planPeriod}
                        </Badge>
                      )}
                      <Badge className={getStatusBadgeColor(user.subscriptionStatus)}>
                        {user.subscriptionStatus}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {user.projectCount} projects
                      </span>
                      <span className="text-xs text-gray-500">
                        {user.literatureReviewCount} reviews used
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchUserDetails(user.userId)}
                      disabled={loadingDetails[user.userId]}
                      className="gap-2"
                    >
                      {loadingDetails[user.userId] ? (
                        <Spinner className="w-4 h-4" />
                      ) : expandedUser === user.userId ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Details
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteUser(user.userId, user.email)}
                      disabled={deletingUser === user.userId}
                      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingUser === user.userId ? (
                        <Spinner className="w-4 h-4" />
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedUser === user.userId && userDetails[user.userId] && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Plan Type
                        </label>
                        <Select
                          value={user.planType}
                          onValueChange={(value) =>
                            updateUserSubscription(user.userId, value, value === "PREMIUM" ? (user.planPeriod || "MONTHLY") : null, user.subscriptionStatus)
                          }
                          disabled={updatingUser === user.userId}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FREE">Free</SelectItem>
                            <SelectItem value="PREMIUM">Premium</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Plan Period
                        </label>
                        <Select
                          value={user.planPeriod || "NONE"}
                          onValueChange={(value) =>
                            updateUserSubscription(user.userId, user.planType, value === "NONE" ? null : value, user.subscriptionStatus)
                          }
                          disabled={updatingUser === user.userId || user.planType === "FREE"}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">None</SelectItem>
                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                            <SelectItem value="YEARLY">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subscription Status
                        </label>
                        <Select
                          value={user.subscriptionStatus}
                          onValueChange={(value) =>
                            updateUserSubscription(user.userId, user.planType, user.planPeriod, value)
                          }
                          disabled={updatingUser === user.userId}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="TRIALING">Trialing</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            <SelectItem value="PAST_DUE">Past Due</SelectItem>
                            <SelectItem value="EXPIRED">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Projects ({userDetails[user.userId].projects.length})</h4>
                      <div className="space-y-2">
                        {userDetails[user.userId].projects.slice(0, 5).map((project: any) => (
                          <div
                            key={project.id}
                            className="flex items-center justify-between text-sm bg-white p-2 rounded border border-gray-200"
                          >
                            <span className="font-medium text-gray-700 truncate flex-1">
                              {project.topic}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {project.status}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {project._count.projectPapers} papers
                              </span>
                            </div>
                          </div>
                        ))}
                        {userDetails[user.userId].projects.length > 5 && (
                          <p className="text-xs text-gray-500 text-center pt-2">
                            And {userDetails[user.userId].projects.length - 5} more...
                          </p>
                        )}
                        {userDetails[user.userId].projects.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-2">
                            No projects yet
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {users.length === 0 && (
            <Card className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No users found</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
