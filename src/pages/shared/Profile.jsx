import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import { auth, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "../../services/firebase";

export default function Profile() {
  const navigate = useNavigate();
  const { user, userProfile, refreshProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: userProfile?.name || "", email: userProfile?.email || user?.email || "", bio: userProfile?.bio || "" });
  const [avatar, setAvatar] = useState(null);
  const [saving, setSaving] = useState(false);

  const [showChangePw, setShowChangePw] = useState(false);
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [changingPw, setChangingPw] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await refreshProfile();
      toast.success("Profile updated!");
      setEditing(false);
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      toast.error("Please fill all password fields");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setChangingPw(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, pwForm.oldPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, pwForm.newPassword);
      toast.success("Password changed successfully!");
      setShowChangePw(false);
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      const msg = err.code === "auth/wrong-password" ? "Old password is incorrect" : err.code === "auth/weak-password" ? "New password is too weak" : err.message || "Failed to change password";
      toast.error(msg);
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white text-xl">&larr;</button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Profile</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">{userProfile?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}</div>
              )}
              {editing && (
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer text-sm">
                  &#9999;&#65039;
                  <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = () => setAvatar(r.result); r.readAsDataURL(f); } }} className="hidden" />
                </label>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Name</label>
              {editing ? (
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600" />
              ) : (
                <p className="text-gray-800 dark:text-white">{userProfile?.name || user?.email || "User"}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Email</label>
              <p className="text-gray-800 dark:text-white">{userProfile?.email || user?.email || "—"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Role</label>
              <p className="text-gray-800 dark:text-white capitalize">{userProfile?.role?.replace(/_/g, " ") || "User"}</p>
            </div>
          </div>
          <div className="mt-6 flex gap-3 justify-end">
            {editing ? (
              <>
                <button onClick={() => { setEditing(false); setForm({ name: userProfile?.name || "", email: userProfile?.email || user?.email || "", bio: userProfile?.bio || "" }); setAvatar(null); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Edit Profile</button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Change Password</h2>
            <button onClick={() => { setShowChangePw(!showChangePw); setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" }); }} className="text-sm text-blue-600 hover:text-blue-700 font-medium">{showChangePw ? "Cancel" : "Change"}</button>
          </div>
          {showChangePw && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Old Password</label>
                <input type="password" value={pwForm.oldPassword} onChange={e => setPwForm({ ...pwForm, oldPassword: e.target.value })} className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600" placeholder="Enter current password" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">New Password</label>
                <input type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600" placeholder="Min 6 characters" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Confirm New Password</label>
                <input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600" placeholder="Re-enter new password" required />
              </div>
              <button type="submit" disabled={changingPw} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50">{changingPw ? "Changing..." : "Update Password"}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
