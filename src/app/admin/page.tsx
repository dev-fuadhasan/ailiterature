"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ShieldCheck,
  LogOut,
  Users,
  Trash2,
  ChevronDown,
  ChevronUp,
  Calendar,
  FileText,
  AlertCircle,
  Search,
  Filter,
  X,
} from "lucide-react";

interface User {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  planType: string;
  subscriptionStatus: string;
  literatureReviewCount: number;
  projectCount: number;
  createdAt: string;
  trialStartDate: string | null;
  trialEndDate: string | null;
  paddleCustomerId: string | null;
}

interface UserDetail {
  id: string;
  userId: string;
  email: string;
  planType: string;
  subscriptionStatus: string;
  literatureReviewCount: number;
  createdAt: string;
  projects: Array<{
    id: string;
    topic: string;
    status: string;
    createdAt: string;
    _count: {
      projectPapers: number;
    };
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Apply search and filters
    let filtered = users;

    // Search by name or email
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(query) ||
          user.name?.toLowerCase().includes(query)
      );
    }

    // Filter by plan type
    if (planFilter !== "ALL") {
      filtered = filtered.filter((user) => user.planType === planFilter);
    }

    // Filter by subscription status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((user) => user.subscriptionStatus === statusFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, planFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else if (response.status === 401) {
        router.push("/secretlogin");
      } else {
        setError("Failed to load users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("An error occurred while loading users");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data.user);
        setExpandedUserId(userId);
      } else {
        setError("Failed to load user details");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      setError("An error occurred while loading user details");
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user "${email}"?\n\nThis will permanently delete:\n- User profile\n- All projects\n- All papers and extractions (if not used by other users)\n- All uploaded files\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();
        alert(`User deleted successfully!\n\nDeleted:\n- ${data.deleted.projects} projects\n- ${data.deleted.papers} papers\n- ${data.deleted.files} files`);
        setSelectedUser(null);
        setExpandedUserId(null);
        await fetchUsers();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("An error occurred while deleting user");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/secretlogin");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleUserExpansion = (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      setSelectedUser(null);
    } else {
      fetchUserDetails(userId);
    }
  };

  const getPlanBadgeColor = (planType: string) => {
    return planType === "PREMIUM" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700";
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "TRIALING":
        return "bg-yellow-100 text-yellow-700";
      case "CANCELLED":
      case "EXPIRED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-gray-900" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">User Management</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="w-10 h-10 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Premium Users</p>
                <p className="text-3xl font-bold text-blue-600">
                  {users.filter((u) => u.planType === "PREMIUM").length}
                </p>
              </div>
              <ShieldCheck className="w-10 h-10 text-blue-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Projects</p>
                <p className="text-3xl font-bold text-gray-900">
                  {users.reduce((sum, u) => sum + u.projectCount, 0)}
                </p>
              </div>
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Plan Filter */}
            <div className="w-full lg:w-48">
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="h-10">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <SelectValue placeholder="Plan Type" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Plans</SelectItem>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="PREMIUM">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="TRIALING">Trialing</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="PAST_DUE">Past Due</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || planFilter !== "ALL" || statusFilter !== "ALL") && (
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
              <span className="font-medium">Showing {filteredUsers.length} of {users.length} users</span>
              {(planFilter !== "ALL" || statusFilter !== "ALL" || searchQuery) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setPlanFilter("ALL");
                    setStatusFilter("ALL");
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-500">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              {users.length === 0 ? "No users found" : "No users match your search criteria"}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <div key={user.id}>
                  <div
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleUserExpansion(user.userId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {user.name || "No name"}
                            </h3>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                          <Badge className={getPlanBadgeColor(user.planType)}>
                            {user.planType}
                          </Badge>
                          <Badge className={getStatusBadgeColor(user.subscriptionStatus)}>
                            {user.subscriptionStatus}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {user.projectCount} projects
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(user.userId, user.email);
                          }}
                          disabled={isDeleting}
                          className="gap-2 text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                        {expandedUserId === user.userId ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedUserId === user.userId && selectedUser && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 mb-1">User ID</p>
                            <p className="font-mono text-xs text-gray-900">{selectedUser.userId}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Reviews Created</p>
                            <p className="text-gray-900">{selectedUser.literatureReviewCount}</p>
                          </div>
                        </div>

                        {selectedUser.projects.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                              Projects ({selectedUser.projects.length})
                            </h4>
                            <div className="space-y-2">
                              {selectedUser.projects.map((project) => (
                                <div
                                  key={project.id}
                                  className="bg-white rounded-lg border border-gray-200 p-3"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 mb-1">
                                        {project.topic}
                                      </p>
                                      <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span>{project._count.projectPapers} papers</span>
                                        <span>•</span>
                                        <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                    <Badge variant="secondary" className="ml-2">
                                      {project.status}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
