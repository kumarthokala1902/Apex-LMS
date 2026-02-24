import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Palette, Globe, Shield, Bell, Check, Save, CheckCircle2, Award, Download, User } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { jsPDF } from 'jspdf';

export const Settings = () => {
  const { tenant, user } = useAuth();
  const [primaryColor, setPrimaryColor] = useState(tenant?.primary_color || '#4f46e5');
  const [saved, setSaved] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('branding');

  const handleSave = () => {
    document.documentElement.style.setProperty('--brand-primary', primaryColor);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const colors = [
    { name: 'Indigo', value: '#4f46e5' },
    { name: 'Blue', value: '#2563eb' },
    { name: 'Emerald', value: '#059669' },
    { name: 'Rose', value: '#e11d48' },
    { name: 'Amber', value: '#d97706' },
    { name: 'Slate', value: '#334155' },
  ];

  const settingsTabs = [
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'account', label: 'Account', icon: User },
    { id: 'domain', label: 'Custom Domain', icon: Globe },
    { id: 'security', label: 'Security & SSO', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your organization's branding and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          {settingsTabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveSettingsTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all shadow-sm ${
                activeSettingsTab === tab.id 
                  ? 'bg-slate-900 border border-slate-800 text-brand-primary' 
                  : 'text-slate-500 hover:bg-slate-900 hover:text-slate-100 border border-transparent'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="md:col-span-2 space-y-8">
          {activeSettingsTab === 'branding' && (
            <>
              <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-sm">
                <h2 className="text-xl font-bold mb-6 text-white">White-Labeling Engine</h2>
                
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-4">Primary Brand Color</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                      {colors.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setPrimaryColor(color.value)}
                          className={`aspect-square rounded-2xl transition-all flex items-center justify-center ${primaryColor === color.value ? 'ring-4 ring-slate-800 scale-110' : 'hover:scale-105'}`}
                          style={{ backgroundColor: color.value }}
                        >
                          {primaryColor === color.value && <Check size={20} className="text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-slate-300">Custom Hex Code</label>
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono">#</span>
                        <input 
                          type="text" 
                          className="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                          value={primaryColor.replace('#', '')}
                          onChange={(e) => setPrimaryColor(`#${e.target.value}`)}
                        />
                      </div>
                      <div className="w-12 h-12 rounded-xl border border-slate-700" style={{ backgroundColor: primaryColor }} />
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-800 flex justify-end">
                    <button 
                      onClick={handleSave}
                      className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-brand-primary text-white hover:shadow-lg hover:shadow-brand-primary/20'}`}
                    >
                      {saved ? <CheckCircle2 size={20} /> : <Save size={20} />}
                      {saved ? 'Branding Saved' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Certificate Template</h2>
                  <button 
                    className="flex items-center gap-2 text-brand-primary font-bold text-sm hover:underline"
                    onClick={() => {
                      const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [800, 600] });
                      doc.setFillColor(245, 242, 237);
                      doc.rect(0, 0, 800, 600, 'F');
                      doc.setDrawColor(primaryColor);
                      doc.setLineWidth(10);
                      doc.rect(20, 20, 760, 560);
                      doc.setTextColor(20, 20, 20);
                      doc.setFontSize(40);
                      doc.setFont('helvetica', 'bold');
                      doc.text('CERTIFICATE OF COMPLETION', 400, 120, { align: 'center' });
                      doc.setFontSize(20);
                      doc.text('This is to certify that', 400, 200, { align: 'center' });
                      doc.setFontSize(32);
                      doc.setTextColor(primaryColor);
                      doc.text('John Doe', 400, 260, { align: 'center' });
                      doc.setTextColor(20, 20, 20);
                      doc.text('has successfully completed the course', 400, 320, { align: 'center' });
                      doc.setFontSize(24);
                      doc.text('Sample Course Title', 400, 370, { align: 'center' });
                      doc.save('Certificate_Preview.pdf');
                    }}
                  >
                    <Download size={16} />
                    Test Download
                  </button>
                </div>
                <div className="aspect-[4/3] bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center p-8 text-center">
                  <Award size={48} className="text-slate-600 mb-4" />
                  <p className="text-slate-500 text-sm max-w-xs">
                    Certificates are automatically generated using your brand colors and organization name.
                  </p>
                </div>
              </div>

              <div className="bg-slate-800 p-8 rounded-[2.5rem] text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-2">Preview Mode</h3>
                  <p className="text-slate-400 text-sm mb-6">This is how your login button will look with the current branding.</p>
                  <button 
                    className="px-8 py-3 rounded-xl font-bold transition-all"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Sign In to {tenant?.name}
                  </button>
                </div>
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
              </div>
            </>
          )}

          {activeSettingsTab === 'account' && (
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-sm space-y-8">
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">Account Credentials</h2>
                <p className="text-slate-500 text-sm">Update your personal information and security settings.</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Full Name</label>
                    <input 
                      type="text" 
                      className="w-full px-5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                      defaultValue={user?.name}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Email Address</label>
                    <input 
                      type="email" 
                      className="w-full px-5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                      defaultValue={user?.email}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <h3 className="font-bold text-white mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Current Password</label>
                      <input 
                        type="password" 
                        className="w-full px-5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">New Password</label>
                        <input 
                          type="password" 
                          className="w-full px-5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                          placeholder="••••••••"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Confirm New Password</label>
                        <input 
                          type="password" 
                          className="w-full px-5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex justify-end">
                  <button 
                    onClick={() => {
                      setSaved(true);
                      setTimeout(() => setSaved(false), 2000);
                    }}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-brand-primary text-white hover:shadow-lg hover:shadow-brand-primary/20'}`}
                  >
                    {saved ? <CheckCircle2 size={20} /> : <Save size={20} />}
                    {saved ? 'Credentials Updated' : 'Update Credentials'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSettingsTab !== 'branding' && activeSettingsTab !== 'account' && (
            <div className="bg-slate-900 p-12 rounded-[2.5rem] border border-slate-800 shadow-sm text-center">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-slate-600 mx-auto mb-6">
                <Shield size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-white">
                {settingsTabs.find(t => t.id === activeSettingsTab)?.label}
              </h2>
              <p className="text-slate-500 max-w-md mx-auto">
                This module is part of the Enterprise plan. Please contact your account manager to enable advanced {activeSettingsTab} features.
              </p>
              <button className="mt-8 bg-brand-primary text-white px-8 py-3 rounded-xl font-bold">
                Upgrade to Enterprise
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
