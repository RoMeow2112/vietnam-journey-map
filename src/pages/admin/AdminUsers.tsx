import { useEffect, useState } from "react";
import { adminSupabase } from "@/lib/supabase";
import { Plus, Pencil, Trash2, Save, X, KeyRound } from "lucide-react";

type UserRole = "admin" | "user";

type Profile = {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: "",
    role: "user" as UserRole,
    is_active: true,
  });

  const [editForm, setEditForm] = useState({
    email: "",
    role: "user" as UserRole,
    is_active: true,
  });

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedPasswordUser, setSelectedPasswordUser] =
    useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  async function loadUsers() {
    setLoading(true);

    const { data, error } = await adminSupabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load users error:", error);
      alert(error.message);
    } else {
      setUsers(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function createUser() {
    if (!form.email.trim()) {
      alert("Email is required");
      return;
    }

    const { error } = await adminSupabase.from("profiles").insert({
      email: form.email.trim(),
      role: form.role,
      is_active: form.is_active,
    });

    if (error) {
      console.error("Create user error:", error);
      alert(error.message);
      return;
    }

    setForm({
      email: "",
      role: "user",
      is_active: true,
    });

    loadUsers();
  }

  function startEdit(user: Profile) {
    setEditingId(user.id);
    setEditForm({
      email: user.email,
      role: user.role,
      is_active: user.is_active,
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function updateUser(id: string) {
    const { error } = await adminSupabase
      .from("profiles")
      .update({
        email: editForm.email.trim(),
        role: editForm.role,
        is_active: editForm.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Update user error:", error);
      alert(error.message);
      return;
    }

    setEditingId(null);
    loadUsers();
  }

  async function deleteUser(id: string) {
    const ok = confirm("Delete this user?");
    if (!ok) return;

    const { error } = await adminSupabase.from("profiles").delete().eq("id", id);

    if (error) {
      console.error("Delete user error:", error);
      alert(error.message);
      return;
    }

    loadUsers();
  }

  function openChangePasswordModal(user: Profile) {
    setSelectedPasswordUser(user);
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordMessage("");
    setPasswordModalOpen(true);
  }

  function closeChangePasswordModal() {
    if (changingPassword) return;

    setPasswordModalOpen(false);
    setSelectedPasswordUser(null);
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordMessage("");
  }

  async function handleChangeUserPassword() {
    if (!selectedPasswordUser) return;

    const password = newPassword.trim();
    const confirmPassword = confirmNewPassword.trim();

    if (!password) {
      setPasswordMessage("Vui lòng nhập mật khẩu mới.");
      return;
    }

    if (password.length < 6) {
      setPasswordMessage("Mật khẩu tối thiểu 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    const ok = confirm(
      `Bạn chắc chắn muốn đổi mật khẩu cho user ${selectedPasswordUser.email}?`,
    );

    if (!ok) return;

    try {
      setChangingPassword(true);
      setPasswordMessage("");

      const { data, error } = await adminSupabase.functions.invoke(
        "change-user-password",
        {
          body: {
            userId: selectedPasswordUser.id,
            newPassword: password,
          },
        },
      );

      if (error) {
        console.error("Change password invoke error:", error);
        setPasswordMessage(error.message || "Không đổi được mật khẩu.");
        return;
      }

      if (data?.error) {
        console.error("Change password function error:", data);
        setPasswordMessage(data.message || "Không đổi được mật khẩu.");
        return;
      }

      setPasswordMessage("Đổi mật khẩu thành công.");
      setNewPassword("");
      setConfirmNewPassword("");

      setTimeout(() => {
        setPasswordModalOpen(false);
        setSelectedPasswordUser(null);
        setPasswordMessage("");
      }, 900);
    } catch (error) {
      console.error("Change password error:", error);
      setPasswordMessage("Không đổi được mật khẩu.");
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Users</h1>
        <p className="mt-2 text-sm text-slate-500">
          Quản lý user cho hệ thống Vietnam Discovery.
        </p>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Create user
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Thêm người dùng mới vào hệ thống.
            </p>
          </div>

          <button
            onClick={createUser}
            className="inline-flex items-center justify-center gap-2 rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <input
            className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
          />

          <select
            className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            value={form.role}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                role: e.target.value as UserRole,
              }))
            }
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <select
            className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            value={form.is_active ? "true" : "false"}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                is_active: e.target.value === "true",
              }))
            }
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">User list</h2>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý quyền và trạng thái tài khoản.
            </p>
          </div>

          <button
            onClick={loadUsers}
            className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
            Loading...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] divide-y divide-slate-200 text-sm text-slate-700">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => {
                  const isEditing = editingId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="border-b transition last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-4">
                        {isEditing ? (
                          <input
                            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            value={editForm.email}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          user.email
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {isEditing ? (
                          <select
                            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            value={editForm.role}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                role: e.target.value as UserRole,
                              }))
                            }
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {user.role}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {isEditing ? (
                          <select
                            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            value={editForm.is_active ? "true" : "false"}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                is_active: e.target.value === "true",
                              }))
                            }
                          >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        ) : (
                          <span
                            className={
                              user.is_active
                                ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                                : "inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                            }
                          >
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => updateUser(user.id)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-3xl bg-emerald-600 text-white transition hover:bg-emerald-700"
                                title="Save"
                              >
                                <Save className="h-4 w-4" />
                              </button>

                              <button
                                onClick={cancelEdit}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-3xl border border-slate-200 text-slate-700 transition hover:bg-slate-100"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => openChangePasswordModal(user)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-3xl border border-orange-200 text-orange-600 transition hover:bg-orange-50"
                                title="Đổi mật khẩu"
                              >
                                <KeyRound className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() => startEdit(user)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-3xl border border-slate-200 text-slate-700 transition hover:bg-slate-100"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() => deleteUser(user.id)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-3xl border border-red-200 text-red-600 transition hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {passwordModalOpen && selectedPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Đổi mật khẩu user
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  User:{" "}
                  <span className="font-semibold text-slate-900">
                    {selectedPasswordUser.email}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={closeChangePasswordModal}
                disabled={changingPassword}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Mật khẩu mới
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    setPasswordMessage("");
                  }}
                  placeholder="Nhập mật khẩu mới"
                  className="mt-2 h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Xác nhận mật khẩu mới
                </label>

                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(event) => {
                    setConfirmNewPassword(event.target.value);
                    setPasswordMessage("");
                  }}
                  placeholder="Nhập lại mật khẩu mới"
                  className="mt-2 h-12 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>

            {passwordMessage && (
              <div
                className={
                  passwordMessage.includes("thành công")
                    ? "mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
                    : "mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                }
              >
                {passwordMessage}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeChangePasswordModal}
                disabled={changingPassword}
                className="rounded-3xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Huỷ
              </button>

              <button
                type="button"
                onClick={handleChangeUserPassword}
                disabled={changingPassword}
                className="inline-flex items-center justify-center gap-2 rounded-3xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
              >
                <KeyRound className="h-4 w-4" />
                {changingPassword ? "Đang đổi..." : "Xác nhận đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}