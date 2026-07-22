import { useState } from 'react'
import { User, Mail, Phone, MapPin, FileText, Save, Camera, DollarSign, Star } from 'lucide-react'

export default function WorkerProfile() {
  const [form, setForm] = useState({
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1 (555) 987-6543',
    location: 'Remote / Worldwide',
    hourlyRate: '$75',
    bio: 'Experienced full-stack developer specializing in React, Node.js, and cloud infrastructure. 7+ years building scalable products.',
    skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker'],
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
        <h1 className="text-3xl font-bold wrk-text-heading">Freelancer Profile</h1>
        <p className="mt-1 wrk-text-body">Manage your freelancer profile and settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar Card */}
        <div className="wrk-card">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-wrk-accent/20 flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-wrk-accent" />
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-wrk-accent text-white hover:bg-wrk-accent-hover">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-xl font-bold wrk-text-heading">{form.name}</h2>
            <p className="wrk-text-body">Full Stack Developer</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm wrk-text-body">4.9 (24 reviews)</span>
            </div>
            <div className="mt-4 space-y-2 text-sm wrk-text-body">
              <div className="flex items-center gap-2 justify-center"><Mail className="w-4 h-4" /> {form.email}</div>
              <div className="flex items-center gap-2 justify-center"><Phone className="w-4 h-4" /> {form.phone}</div>
              <div className="flex items-center gap-2 justify-center"><MapPin className="w-4 h-4" /> {form.location}</div>
              <div className="flex items-center gap-2 justify-center"><DollarSign className="w-4 h-4" /> {form.hourlyRate}/hr</div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 wrk-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium wrk-text-body mb-1.5">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} className="wrk-input" />
              </div>
              <div>
                <label className="block text-sm font-medium wrk-text-body mb-1.5">Email</label>
                <input name="email" value={form.email} onChange={handleChange} className="wrk-input" />
              </div>
              <div>
                <label className="block text-sm font-medium wrk-text-body mb-1.5">Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="wrk-input" />
              </div>
              <div>
                <label className="block text-sm font-medium wrk-text-body mb-1.5">Hourly Rate</label>
                <input name="hourlyRate" value={form.hourlyRate} onChange={handleChange} className="wrk-input" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium wrk-text-body mb-1.5">Bio</label>
              <textarea name="bio" rows={4} value={form.bio} onChange={handleChange} className="wrk-input resize-none" />
            </div>
            <div className="flex items-center gap-4">
              <button type="submit" className="wrk-btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </button>
              {saved && <span className="text-sm text-emerald-400">Profile updated!</span>}
            </div>
          </form>
        </div>
      </div>

      {/* Skills */}
      <div className="wrk-card">
        <h3 className="font-semibold wrk-text-heading mb-4">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {form.skills.map(skill => (
            <span key={skill} className="wrk-badge bg-wrk-accent/10 text-wrk-accent border border-wrk-accent/20">{skill}</span>
          ))}
        </div>
      </div>

      {/* Portfolio */}
      <div className="wrk-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-wrk-accent/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-wrk-accent" />
            </div>
            <div>
              <h3 className="font-semibold wrk-text-heading">Portfolio</h3>
              <p className="text-sm wrk-text-body">Showcase your work and projects</p>
            </div>
          </div>
          <button className="wrk-btn-secondary">Manage</button>
        </div>
      </div>
    </div>
  )
}
