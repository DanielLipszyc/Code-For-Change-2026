"use client";

import { useState } from "react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const stats = [
    { label: "Total Users", value: "2,543", change: "+12.5%", positive: true },
    { label: "Active Projects", value: "48", change: "+3", positive: true },
    { label: "Tasks Completed", value: "1,284", change: "+156", positive: true },
    { label: "Hours Saved", value: "892", change: "+24%", positive: true },
  ];

  const recentActivity = [
    { action: "Project Created", item: "Community App", time: "2 hours ago" },
    { action: "Task Completed", item: "Design Review", time: "4 hours ago" },
    { action: "Team Added", item: "Development Team B", time: "1 day ago" },
    { action: "Milestone Reached", item: "Beta Launch", time: "2 days ago" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Dashboard Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Welcome back! Here&apos;s what&apos;s happening today.
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors">
                + New Project
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stat.value}
              </p>
              <span
                className={`text-sm ${
                  stat.positive ? "text-green-600" : "text-red-600"
                }`}
              >
                {stat.change}
              </span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex overflow-x-auto" aria-label="Tabs">
              {["overview", "projects", "activity", "settings"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 sm:px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-primary-500 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {recentActivity.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.action}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.item}
                        </p>
                      </div>
                      <span className="text-sm text-gray-400">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "projects" && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📁</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Your Projects
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Project management features coming soon
                </p>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Activity Feed
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Detailed activity tracking coming soon
                </p>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">⚙️</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Settings
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Dashboard settings coming soon
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
