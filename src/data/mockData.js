export const jobs = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA (Remote)',
    type: 'Full-time',
    salary: { min: 120000, max: 160000 },
    description: 'We are looking for an experienced Frontend Developer to join our growing team. You will be responsible for building and maintaining scalable web applications using React and modern JavaScript.',
    requirements: ['5+ years React experience', 'TypeScript proficiency', 'CSS/Tailwind expertise', 'CI/CD knowledge'],
    tags: ['React', 'TypeScript', 'Tailwind', 'Remote'],
    postedAt: '2026-07-20T10:00:00Z',
    applicants: 45,
    logo: 'https://ui-avatars.com/api/?name=TechCorp&background=2563eb&color=fff',
    status: 'active'
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    company: 'StartupXYZ',
    location: 'New York, NY (Hybrid)',
    type: 'Full-time',
    salary: { min: 100000, max: 140000 },
    description: 'Join our fast-paced startup building the next generation of AI-powered productivity tools. Work across the entire stack from React frontend to Node.js backend.',
    requirements: ['3+ years full-stack experience', 'Node.js & React', 'PostgreSQL', 'AWS experience'],
    tags: ['React', 'Node.js', 'PostgreSQL', 'AI'],
    postedAt: '2026-07-18T14:30:00Z',
    applicants: 32,
    logo: 'https://ui-avatars.com/api/?name=StartupXYZ&background=7c3aed&color=fff',
    status: 'active'
  },
  {
    id: '3',
    title: 'UI/UX Designer',
    company: 'DesignStudio',
    location: 'Remote',
    type: 'Contract',
    salary: { min: 80, max: 120 },
    salaryType: 'hourly',
    description: 'Create beautiful, intuitive user interfaces for web and mobile applications. Collaborate with product managers and engineers to deliver exceptional user experiences.',
    requirements: ['Portfolio demonstrating UI/UX skills', 'Figma expertise', 'User research experience', 'Design systems knowledge'],
    tags: ['Figma', 'UI/UX', 'Design Systems', 'Remote'],
    postedAt: '2026-07-19T09:00:00Z',
    applicants: 28,
    logo: 'https://ui-avatars.com/api/?name=DesignStudio&background=059669&color=fff',
    status: 'active'
  },
  {
    id: '4',
    title: 'DevOps Engineer',
    company: 'CloudSystems',
    location: 'Austin, TX (On-site)',
    type: 'Full-time',
    salary: { min: 130000, max: 170000 },
    description: 'Lead our infrastructure modernization efforts. Build and maintain CI/CD pipelines, manage cloud infrastructure, and ensure high availability of our services.',
    requirements: ['Kubernetes expertise', 'Terraform/IaC', 'AWS/GCP', 'Monitoring & observability'],
    tags: ['Kubernetes', 'Terraform', 'AWS', 'DevOps'],
    postedAt: '2026-07-15T11:00:00Z',
    applicants: 19,
    logo: 'https://ui-avatars.com/api/?name=CloudSystems&background=dc2626&color=fff',
    status: 'active'
  },
  {
    id: '5',
    title: 'Product Manager',
    company: 'ProductFirst',
    location: 'Seattle, WA (Hybrid)',
    type: 'Full-time',
    salary: { min: 110000, max: 150000 },
    description: 'Drive product strategy and execution for our core platform. Work closely with engineering, design, and stakeholders to deliver products that customers love.',
    requirements: ['4+ years PM experience', 'Agile/Scrum', 'Data-driven decision making', 'Technical background'],
    tags: ['Product', 'Agile', 'Strategy', 'Hybrid'],
    postedAt: '2026-07-17T16:00:00Z',
    applicants: 56,
    logo: 'https://ui-avatars.com/api/?name=ProductFirst&background=d97706&color=fff',
    status: 'active'
  },
  {
    id: '6',
    title: 'Data Scientist',
    company: 'DataDriven Co.',
    location: 'Remote',
    type: 'Full-time',
    salary: { min: 115000, max: 155000 },
    description: 'Build machine learning models and data pipelines to extract insights from large datasets. Collaborate with cross-functional teams to drive data-informed decisions.',
    requirements: ['Python & SQL expertise', 'ML frameworks (PyTorch/TensorFlow)', 'Statistics background', 'Data visualization'],
    tags: ['Python', 'Machine Learning', 'SQL', 'Remote'],
    postedAt: '2026-07-16T08:00:00Z',
    applicants: 38,
    logo: 'https://ui-avatars.com/api/?name=DataDriven&background=0891b2&color=fff',
    status: 'active'
  }
]

export const users = [
  { id: 'u1', name: 'Alice Johnson', email: 'alice@example.com', role: 'employee', status: 'active', joined: '2026-01-15', applications: 12 },
  { id: 'u2', name: 'Bob Smith', email: 'bob@example.com', role: 'worker', status: 'active', joined: '2026-02-20', jobs: 8 },
  { id: 'u3', name: 'Carol Williams', email: 'carol@example.com', role: 'employee', status: 'active', joined: '2026-03-10', applications: 5 },
  { id: 'u4', name: 'David Brown', email: 'david@example.com', role: 'worker', status: 'inactive', joined: '2026-01-05', jobs: 3 },
  { id: 'u5', name: 'Eva Martinez', email: 'eva@example.com', role: 'admin', status: 'active', joined: '2025-12-01', applications: 0 },
  { id: 'u6', name: 'Frank Lee', email: 'frank@example.com', role: 'employee', status: 'active', joined: '2026-04-22', applications: 7 },
  { id: 'u7', name: 'Grace Chen', email: 'grace@example.com', role: 'worker', status: 'active', joined: '2026-05-15', jobs: 15 },
  { id: 'u8', name: 'Henry Wilson', email: 'henry@example.com', role: 'employee', status: 'inactive', joined: '2026-02-01', applications: 2 },
]

export const applications = [
  { id: 'a1', jobId: '1', userId: 'u1', status: 'interview', appliedAt: '2026-07-21T10:00:00Z', jobTitle: 'Senior Frontend Developer', company: 'TechCorp Inc.' },
  { id: 'a2', jobId: '2', userId: 'u1', status: 'applied', appliedAt: '2026-07-20T14:00:00Z', jobTitle: 'Full Stack Engineer', company: 'StartupXYZ' },
  { id: 'a3', jobId: '5', userId: 'u1', status: 'rejected', appliedAt: '2026-07-18T09:00:00Z', jobTitle: 'Product Manager', company: 'ProductFirst' },
  { id: 'a4', jobId: '3', userId: 'u6', status: 'applied', appliedAt: '2026-07-22T11:00:00Z', jobTitle: 'UI/UX Designer', company: 'DesignStudio' },
]

export const workerJobs = [
  { id: 'w1', title: 'Website Redesign', client: 'Acme Corp', status: 'in-progress', earnings: 3500, startDate: '2026-07-01', endDate: '2026-07-30', hours: 45 },
  { id: 'w2', title: 'Mobile App UI', client: 'TechStart', status: 'completed', earnings: 2800, startDate: '2026-06-01', endDate: '2026-06-25', hours: 38 },
  { id: 'w3', title: 'API Integration', client: 'DataFlow', status: 'pending', earnings: 0, startDate: '2026-08-01', endDate: '2026-08-15', hours: 0 },
  { id: 'w4', title: 'Brand Identity', client: 'GreenLeaf', status: 'completed', earnings: 4200, startDate: '2026-05-01', endDate: '2026-05-20', hours: 52 },
]

export const earningsData = [
  { month: 'Jan', earnings: 3200 },
  { month: 'Feb', earnings: 4100 },
  { month: 'Mar', earnings: 2800 },
  { month: 'Apr', earnings: 5200 },
  { month: 'May', earnings: 4200 },
  { month: 'Jun', earnings: 2800 },
  { month: 'Jul', earnings: 3500 },
]

export const adminStats = {
  totalUsers: 1248,
  totalJobs: 342,
  totalApplications: 5680,
  activeWorkers: 156,
  revenue: 124500,
  growth: 23.5
}

export const monthlyStats = [
  { month: 'Jan', users: 180, jobs: 45, applications: 420 },
  { month: 'Feb', users: 220, jobs: 52, applications: 580 },
  { month: 'Mar', users: 280, jobs: 48, applications: 640 },
  { month: 'Apr', users: 320, jobs: 55, applications: 720 },
  { month: 'May', users: 380, jobs: 62, applications: 850 },
  { month: 'Jun', users: 420, jobs: 58, applications: 920 },
  { month: 'Jul', users: 450, jobs: 70, applications: 1050 },
]
