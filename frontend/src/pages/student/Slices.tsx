import { motion } from "framer-motion";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import { Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const slices = [
  {
    id: 1,
    amount: 5000,
    dueDate: "Jan 10, 2025",
    status: "upcoming",
    daysLeft: 15,
    principal: 4500,
    interest: 500,
  },
  {
    id: 2,
    amount: 5000,
    dueDate: "Feb 10, 2025",
    status: "pending",
    principal: 4500,
    interest: 500,
  },
  {
    id: 3,
    amount: 5000,
    dueDate: "Mar 10, 2025",
    status: "pending",
    principal: 4500,
    interest: 500,
  },
  {
    id: 4,
    amount: 5000,
    dueDate: "Dec 10, 2024",
    status: "paid",
    paidOn: "Dec 8, 2024",
    principal: 4500,
    interest: 500,
  },
  {
    id: 5,
    amount: 5000,
    dueDate: "Nov 10, 2024",
    status: "paid",
    paidOn: "Nov 10, 2024",
    principal: 4500,
    interest: 500,
  },
];

export default function Slices() {
  const upcomingSlices = slices.filter((s) => s.status !== "paid");
  const paidSlices = slices.filter((s) => s.status === "paid");
  const totalOutstanding = upcomingSlices.reduce((acc, s) => acc + s.amount, 0);

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Summary */}
        <div className="grid sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <p className="text-sm text-muted-foreground mb-1">Total Outstanding</p>
            <p className="text-2xl font-bold">₹{totalOutstanding.toLocaleString()}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <p className="text-sm text-muted-foreground mb-1">Next Slice</p>
            <p className="text-2xl font-bold">₹5,000</p>
            <p className="text-xs text-muted-foreground">Due in 15 days</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <p className="text-sm text-muted-foreground mb-1">Slices Paid</p>
            <p className="text-2xl font-bold">{paidSlices.length}/{slices.length}</p>
            <p className="text-xs text-credora-emerald">All on time</p>
          </motion.div>
        </div>

        {/* Upcoming Slices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <h3 className="font-semibold text-lg mb-6">Upcoming Slices</h3>
          <div className="space-y-4">
            {upcomingSlices.map((slice, index) => (
              <div
                key={slice.id}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border",
                  slice.status === "upcoming"
                    ? "border-credora-amber/30 bg-credora-amber/5"
                    : "border-border bg-secondary/30"
                )}
              >
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      slice.status === "upcoming"
                        ? "bg-credora-amber/10"
                        : "bg-secondary"
                    )}
                  >
                    <Calendar
                      className={cn(
                        "w-5 h-5",
                        slice.status === "upcoming"
                          ? "text-credora-amber"
                          : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">Slice #{slice.id}</p>
                      {slice.status === "upcoming" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-credora-amber/10 text-credora-amber">
                          Due in {slice.daysLeft} days
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Due: {slice.dueDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">₹{slice.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      ₹{slice.principal} + ₹{slice.interest} interest
                    </p>
                  </div>
                  {slice.status === "upcoming" && (
                    <Button variant="hero" size="sm">
                      Pay Now
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Payment History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <h3 className="font-semibold text-lg mb-6">Payment History</h3>
          <div className="space-y-4">
            {paidSlices.map((slice) => (
              <div
                key={slice.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-credora-emerald/30 bg-credora-emerald/5"
              >
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div className="w-10 h-10 rounded-xl bg-credora-emerald/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-credora-emerald" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">Slice #{slice.id}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-credora-emerald/10 text-credora-emerald">
                        Paid
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Paid on {slice.paidOn}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-credora-emerald">
                    ₹{slice.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ₹{slice.principal} + ₹{slice.interest} interest
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </StudentLayout>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
