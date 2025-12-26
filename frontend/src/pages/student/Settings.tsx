import { motion } from "framer-motion";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import { User, Bell, Shield, Wallet, Moon, Globe, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudentSettings() {
  return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold mb-6">Settings</h2>
        </motion.div>

        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">Profile Information</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium">Display Name</p>
                <p className="text-sm text-muted-foreground">Arjun Sharma</p>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">arjun@example.com</p>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Phone Number</p>
                <p className="text-sm text-muted-foreground">+91 98765 43210</p>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
          </div>
        </motion.div>

        {/* Wallet Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Wallet className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">Connected Wallet</h3>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-credora-emerald/10 flex items-center justify-center">
                <span className="text-credora-emerald font-bold">M</span>
              </div>
              <div>
                <p className="font-medium">MetaMask</p>
                <p className="text-sm text-muted-foreground font-mono">0x1234...5678</p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-credora-emerald/10 text-credora-emerald">
              Connected
            </span>
          </div>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">Notifications</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Payment Reminders</p>
                <p className="text-sm text-muted-foreground">Get notified before due dates</p>
              </div>
              <div className="w-12 h-6 rounded-full bg-credora-emerald flex items-center px-1">
                <div className="w-4 h-4 rounded-full bg-accent-foreground ml-auto" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Credit Updates</p>
                <p className="text-sm text-muted-foreground">Limit changes and opportunities</p>
              </div>
              <div className="w-12 h-6 rounded-full bg-credora-emerald flex items-center px-1">
                <div className="w-4 h-4 rounded-full bg-accent-foreground ml-auto" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Marketing Emails</p>
                <p className="text-sm text-muted-foreground">Tips and product updates</p>
              </div>
              <div className="w-12 h-6 rounded-full bg-secondary flex items-center px-1">
                <div className="w-4 h-4 rounded-full bg-muted-foreground" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">Security</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm">Enable</Button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Active Sessions</p>
                <p className="text-sm text-muted-foreground">Manage your logged in devices</p>
              </div>
              <Button variant="outline" size="sm">View</Button>
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold text-destructive">Danger Zone</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button variant="destructive" size="sm">Delete Account</Button>
        </motion.div>
      </div>
    </StudentLayout>
  );
}
