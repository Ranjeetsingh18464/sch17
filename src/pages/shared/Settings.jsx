import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import { db, doc, getDoc, updateDoc, serverTimestamp, auth, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "../../services/firebase";

export default function Settings() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [notifications, setNotifications] = useState({ email: true, push: true, sms: false });
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [changingPw, setChangingPw] = useState(false);
  const [showPw, setShowPw] = useState({ old: false, new: false, confirm: false });

  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) {
        const prefs = snap.data().notificationPreferences;
        if (prefs) setNotifications(prefs);
      }
    }).catch(() => {});
  }, [user?.uid]);

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        notificationPreferences: notifications,
        updatedAt: serverTimestamp(),
      });
      toast.success("Notification preferences saved");
    } catch (err) {
      toast.error("Failed to save notification preferences");
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
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      const msg = err.code === "auth/wrong-password" ? "Old password is incorrect" : err.code === "auth/weak-password" ? "New password is too weak" : err.message || "Failed to change password";
      toast.error(msg);
    } finally {
      setChangingPw(false);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white text-xl">&larr;</button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h1>
        </div>
        <div className="space-y-6">

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Notification Preferences</h3>
            <div className="space-y-3">
              {[
                { key: "email", label: "Email Notifications" },
                { key: "push", label: "Push Notifications" },
                { key: "sms", label: "SMS Notifications" },
              ].map(item => (
                <label key={item.key} className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                  <input type="checkbox" checked={notifications[item.key]} onChange={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })} className="w-5 h-5 cursor-pointer" />
                </label>
              ))}
            </div>
            <button onClick={handleSaveNotifications} disabled={saving} className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition">{saving ? "Saving..." : "Save"}</button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Old Password</label>
                <div className="relative">
                  <input type={showPw.old ? "text" : "password"} value={pwForm.oldPassword} onChange={e => setPwForm({ ...pwForm, oldPassword: e.target.value })} className="w-full px-3 py-2 pr-10 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600" placeholder="Enter current password" required />
                  <button type="button" onClick={() => setShowPw({ ...showPw, old: !showPw.old })} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPw.old ? "🙈" : "👁️"}</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">New Password</label>
                <div className="relative">
                  <input type={showPw.new ? "text" : "password"} value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} className="w-full px-3 py-2 pr-10 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600" placeholder="Min 6 characters" required />
                  <button type="button" onClick={() => setShowPw({ ...showPw, new: !showPw.new })} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPw.new ? "🙈" : "👁️"}</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input type={showPw.confirm ? "text" : "password"} value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} className="w-full px-3 py-2 pr-10 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600" placeholder="Re-enter new password" required />
                  <button type="button" onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPw.confirm ? "🙈" : "👁️"}</button>
                </div>
              </div>
              <button type="submit" disabled={changingPw} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition">{changingPw ? "Updating..." : "Update Password"}</button>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Account Info</h3>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600 dark:text-gray-400"><span className="font-medium">Name:</span> {userProfile?.name || user?.displayName || "—"}</p>
              <p className="text-gray-600 dark:text-gray-400"><span className="font-medium">Email:</span> {userProfile?.email || user?.email || "—"}</p>
              <p className="text-gray-600 dark:text-gray-400"><span className="font-medium">Role:</span> {(userProfile?.role || "").replace(/_/g, " ") || "—"}</p>
              <p className="text-gray-600 dark:text-gray-400"><span className="font-medium">Member Since:</span> {formatDate(userProfile?.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
