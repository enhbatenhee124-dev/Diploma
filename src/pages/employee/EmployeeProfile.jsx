import { useState } from 'react'
import { User, Mail, Phone, MapPin, FileText, Save, Camera } from 'lucide-react'

export default function EmployeeProfile() {
  const [form, setForm] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    bio: 'Passionate Frontend Developer with 5+ years of experience building scalable web applications.',
  })
  const [saved, setSaved] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold emp-text-heading">My Profile</h1>
        <p className="mt-1 emp-text-body">Manage your personal information and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar Card */}
        <div className="emp-card">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-emp-accent/20 flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-emp-accent" />
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emp-accent text-white hover:bg-emp-accent-hover">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-xl font-bold emp-text-heading">{form.name}</h2>
            <p className="emp-text-body">Frontend Developer</p>
            <div className="mt-4 space-y-2 text-sm emp-text-body">
              <div className="flex items-center gap-2 justify-center"><Mail className="w-4 h-4" /> {form.email}</div>
              <div className="flex items-center gap-2 justify-center"><Phone className="w-4 h-4" /> {form.phone}</div>
              <div className="flex items-center gap-2 justify-center"><MapPin className="w-4 h-4" /> {form.location}</div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 emp-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium emp-text-body mb-1.5">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} className="emp-input" />
              </div>
              <div>
                <label className="block text-sm font-medium emp-text-body mb-1.5">Email</label>
                <input name="email" value={form.email} onChange={handleChange} className="emp-input" />
              </div>
              <div>
                <label className="block text-sm font-medium emp-text-body mb-1.5">Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="emp-input" />
              </div>
              <div>
                <label className="block text-sm font-medium emp-text-body mb-1.5">Location</label>
                <input name="location" value={form.location} onChange={handleChange} className="emp-input" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium emp-text-body mb-1.5">Bio</label>
              <textarea name="bio" rows={4} value={form.bio} onChange={handleChange} className="emp-input resize-none" />
            </div>
            <div className="flex items-center gap-4">
              <button type="submit" className="emp-btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </button>
              {saved && <span className="text-sm text-emerald-400">Profile updated!</span>}
            </div>
          </form>
        </div>
      </div>

      {/* Resume */}
      <div className="emp-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emp-accent/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emp-accent" />
            </div>
            <div>
              <h3 className="font-semibold emp-text-heading">Resume / CV</h3>
              <p className="text-sm emp-text-body">Upload your latest resume (PDF, DOCX)</p>
            </div>
          </div>
          <button className="emp-btn-secondary">Upload</button>
        </div>
      </div>
    </div>
  )
}
