/**
 * Admin Users & Roles Management Page
 * Allows admin to view and change user roles
 */

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  Users,
  Shield,
  ChefHat,
  User,
  UserCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Save,
  AlertTriangle,
} from "lucide-react";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import { getAllUsers, updateUserRole, getUserRoleStats } from "@/services/api/admin.service";
import { formatDate } from "@/utils/formatters";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";

const ROLES = [
  { value: "user", label: "User", icon: User, color: "bg-blue-100 text-blue-800" },
  { value: "meal_provider", label: "Meal Provider", icon: ChefHat, color: "bg-green-100 text-green-800" },
  { value: "coach", label: "Coach", icon: UserCheck, color: "bg-purple-100 text-purple-800" },
  { value: "admin", label: "Admin", icon: Shield, color: "bg-red-100 text-red-800" },
];

const getRoleBadge = (role) => {
  const roleConfig = ROLES.find(r => r.value === role);
  return roleConfig?.color || "bg-gray-100 text-gray-800";
};

const getRoleLabel = (role) => {
  const roleConfig = ROLES.find(r => r.value === role);
  return roleConfig?.label || role;
};

const AdminUsers = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Track pending role changes (userId -> newRole)
  const [pendingChanges, setPendingChanges] = useState({});

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    userId: null,
    userName: "",
    currentRole: "",
    newRole: "",
  });

  // Fetch role stats
  const { data: roleStats } = useQuery({
    queryKey: ["admin-user-role-stats"],
    queryFn: async () => {
      const result = await getUserRoleStats();
      if (result.error) throw result.error;
      return result.data;
    },
  });

  // Fetch users
  const { data: usersResult, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-users", debouncedSearch, roleFilter, page],
    queryFn: async () => {
      const filters = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
      };
      if (debouncedSearch) filters.search = debouncedSearch;
      if (roleFilter !== "all") filters.role = roleFilter;

      const result = await getAllUsers(filters);
      if (result.error) throw result.error;
      return result;
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }) => updateUserRole(userId, newRole),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-role-stats"] });
      
      // Clear pending change
      setPendingChanges(prev => {
        const updated = { ...prev };
        delete updated[variables.userId];
        return updated;
      });

      toast({
        title: t("adminUsers.roleUpdated"),
        description: t("adminUsers.roleChangedSuccess", { role: getRoleLabel(variables.newRole) }),
      });

      setConfirmDialog({ open: false, userId: null, userName: "", currentRole: "", newRole: "" });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("adminUsers.failedToUpdateRole"),
        variant: "destructive",
      });
    },
  });

  const users = usersResult?.data || [];
  const totalCount = usersResult?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Handle role selection change
  const handleRoleSelect = (userId, user, newRole) => {
    if (newRole === user.role) {
      // Remove from pending if reverting to original
      setPendingChanges(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    } else {
      setPendingChanges(prev => ({
        ...prev,
        [userId]: newRole,
      }));
    }
  };

  // Handle save button click
  const handleSaveRole = (user) => {
    const newRole = pendingChanges[user.id];
    if (!newRole) return;

    setConfirmDialog({
      open: true,
      userId: user.id,
      userName: user.full_name || user.email || "This user",
      currentRole: user.role,
      newRole,
    });
  };

  // Confirm role change
  const confirmRoleChange = () => {
    const { userId, newRole } = confirmDialog;
    updateRoleMutation.mutate({ userId, newRole });
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message={t("adminUsers.loading")} />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <ErrorMessage
          title={t("adminUsers.loadError")}
          message={error.message}
          onRetry={refetch}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("adminUsers.title")}</h1>
            <p className="text-muted-foreground">
              {t("adminUsers.subtitle")}
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 me-2" />
            {t("common.refresh")}
          </Button>
        </div>

        {/* Stats Cards */}
        {roleStats && (
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Users className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{roleStats.total}</p>
                    <p className="text-sm text-muted-foreground">{t("adminUsers.totalUsers")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {ROLES.map((role) => (
              <Card key={role.value}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${role.color.replace('text-', 'text-').split(' ')[0]}`}>
                      <role.icon className={`h-5 w-5 ${role.color.split(' ')[1]}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{roleStats[role.value] || 0}</p>
                      <p className="text-sm text-muted-foreground">{role.label}s</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("adminUsers.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="ps-10"
                  />
                </div>
              </div>

              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <Shield className="h-4 w-4 me-2" />
                  <SelectValue placeholder={t("adminUsers.filterByRole")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("adminUsers.allRoles")}</SelectItem>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("adminUsers.users")}</CardTitle>
            <CardDescription>
              {t("adminUsers.usersFound", { count: totalCount })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length > 0 ? (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("adminUsers.userId")}</TableHead>
                        <TableHead>{t("adminUsers.name")}</TableHead>
                        <TableHead>{t("adminUsers.email")}</TableHead>
                        <TableHead>{t("adminUsers.currentRole")}</TableHead>
                        <TableHead>{t("adminUsers.changeRole")}</TableHead>
                        <TableHead>{t("adminUsers.joined")}</TableHead>
                        <TableHead className="w-[100px]">{t("common.action")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => {
                        const hasPendingChange = pendingChanges[user.id] !== undefined;
                        const selectedRole = pendingChanges[user.id] || user.role;

                        return (
                          <TableRow key={user.id}>
                            <TableCell className="font-mono text-sm text-muted-foreground">
                              {user.id.slice(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {user.avatar_url ? (
                                  <img
                                    src={user.avatar_url}
                                    alt={user.full_name}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User className="h-4 w-4 text-gray-500" />
                                  </div>
                                )}
                                <span className="font-medium">
                                  {user.full_name || "—"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{user.email || "—"}</TableCell>
                            <TableCell>
                              <Badge className={getRoleBadge(user.role)}>
                                {getRoleLabel(user.role)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={selectedRole}
                                onValueChange={(newRole) => handleRoleSelect(user.id, user, newRole)}
                              >
                                <SelectTrigger className={`w-[160px] ${hasPendingChange ? 'border-yellow-500 bg-yellow-50' : ''}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ROLES.map((role) => (
                                    <SelectItem key={role.value} value={role.value}>
                                      <div className="flex items-center gap-2">
                                        <role.icon className="h-4 w-4" />
                                        {role.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(user.created_at)}
                            </TableCell>
                            <TableCell>
                              {hasPendingChange && (
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveRole(user)}
                                  disabled={updateRoleMutation.isPending}
                                >
                                  <Save className="h-4 w-4 me-1" />
                                  {t("common.save")}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {t("adminUsers.showing", { from: ((page - 1) * pageSize) + 1, to: Math.min(page * pageSize, totalCount), total: totalCount })}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t("common.previous")}
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      {t("adminUsers.pageOf", { page, total: totalPages || 1 })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= totalPages}
                    >
                      {t("common.next")}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">{t("adminUsers.noUsersFound")}</h3>
                <p className="text-muted-foreground">
                  {t("adminUsers.tryAdjustingFilters")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialog.open}
          onOpenChange={(open) => !open && setConfirmDialog({ open: false, userId: null, userName: "", currentRole: "", newRole: "" })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                {t("adminUsers.confirmRoleChange")}
              </DialogTitle>
              <DialogDescription>
                {t("adminUsers.confirmRoleChangeDesc")}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3">
              <div>
                <span className="text-muted-foreground">{t("adminUsers.user")}:</span>{" "}
                <span className="font-medium">{confirmDialog.userName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t("adminUsers.roleChange")}:</span>
                <Badge className={getRoleBadge(confirmDialog.currentRole)}>
                  {getRoleLabel(confirmDialog.currentRole)}
                </Badge>
                <span>→</span>
                <Badge className={getRoleBadge(confirmDialog.newRole)}>
                  {getRoleLabel(confirmDialog.newRole)}
                </Badge>
              </div>

              {confirmDialog.newRole === "admin" && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ {t("adminUsers.adminWarning")}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmDialog({ open: false, userId: null, userName: "", currentRole: "", newRole: "" })}
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={confirmRoleChange}
                disabled={updateRoleMutation.isPending}
                variant={confirmDialog.newRole === "admin" ? "destructive" : "default"}
              >
                {updateRoleMutation.isPending ? t("common.saving") : t("adminUsers.confirmChange")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminUsers;
