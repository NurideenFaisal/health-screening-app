import React from 'react'
import { Settings as SettingsIcon, Database, Shield, Bell, Palette } from 'lucide-react'

export default function SuperAdminSettings() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Global system configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database & System Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Database</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Clinics</span>
              <span className="font-medium text-gray-900">View in Dashboard</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Database Region</span>
              <span className="font-medium text-gray-900">Configured in Supabase</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Edge Functions</span>
              <span className="font-medium text-gray-900">Active</span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Role-Based Access</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Enabled
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Super Admin Access</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Session Timeout</span>
              <span className="font-medium text-gray-900">24 hours</span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Email Notifications</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Default
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">System Alerts</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Enabled
              </span>
            </div>
          </div>
        </div>

        {/* Theme */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
              <Palette className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Primary Color</span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-600"></div>
                <span className="font-medium text-gray-900">Emerald-600</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Theme Mode</span>
              <span className="font-medium text-gray-900">Light</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="mt-6 bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">System Information</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Version</span>
            <p className="font-medium text-gray-900">1.0.0</p>
          </div>
          <div>
            <span className="text-gray-500">Environment</span>
            <p className="font-medium text-gray-900">Production</p>
          </div>
          <div>
            <span className="text-gray-500">API Status</span>
            <p className="font-medium text-green-600">Healthy</p>
          </div>
          <div>
            <span className="text-gray-500">Last Updated</span>
            <p className="font-medium text-gray-900">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
