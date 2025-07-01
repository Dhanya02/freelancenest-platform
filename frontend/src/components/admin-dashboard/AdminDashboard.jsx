import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, Users, Briefcase, CheckCircle, BarChart, User, 
  UserPlus, Settings, Home, Search, Star, Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Navbar from '../Navbar';

const SideNav = ({ activeView, setActiveView }) => (
  <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-indigo-900 to-purple-900 text-white p-6">
    <div className="mb-8">
      <h2 className="text-xl font-bold">FreelanceNest</h2>
      <p className="text-sm text-gray-300">Admin Dashboard</p>
    </div>
    
    <nav className="space-y-2">
      {[
        { icon: Home, label: 'Overview', id: 'overview' },
        { icon: User, label: 'Freelancers', id: 'freelancers' },
        { icon: Briefcase, label: 'Project Managers', id: 'managers' },
        { icon: BarChart, label: 'Analytics', id: 'analytics' }
      ].map(({ icon: Icon, label, id }) => (
        <button
          key={id}
          onClick={() => setActiveView(id)}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            activeView === id 
              ? 'bg-white/10 text-white' 
              : 'text-gray-300 hover:bg-white/5'
          }`}
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  </div>
);

const FreelancersView = ({ projectDevelopers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [developerDetails, setDeveloperDetails] = useState({});
  const [developerProjects, setDeveloperProjects] = useState({});

  useEffect(() => {
    const fetchDeveloperData = async (email) => {
      try {
        const response = await fetch(`http://localhost:3000/freelancer/developers/${email}`);
        if (response.ok) {
          const data = await response.json();
          setDeveloperDetails(prev => ({ ...prev, [email]: data }));
        }

        const projectsResponse = await fetch(`http://localhost:3000/freelancer/developers/${email}/projects`);
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setDeveloperProjects(prev => ({ ...prev, [email]: projectsData }));
        }
      } catch (error) {
        console.error('Error fetching developer data:', error);
      }
    };

    projectDevelopers.forEach(email => {
      if (!developerDetails[email]) {
        fetchDeveloperData(email);
      }
    });
  }, [projectDevelopers]);

  const filteredDevelopers = projectDevelopers.filter(email => 
    email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Freelancer Management</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search freelancers..."
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDevelopers.map((email) => {
          const developer = developerDetails[email] || {};
          const projects = developerProjects[email] || [];
          return (
            <div key={email} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {developer.firstName?.[0] || email[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {developer.firstName ? `${developer.firstName} ${developer.lastName}` : email}
                  </h3>
                  <p className="text-sm text-gray-500">{email}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {developer.techStack && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="h-4 w-4 mr-2" />
                    Tech Stack: {developer.techStack.join(', ')}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Active Projects: {projects.length}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProjectsView = ({ projects }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Project Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project._id} className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-gray-800">{project.projectName}</h3>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Level:</span> {project.level}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Duration:</span> {project.duration}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Budget:</span> ${project.money}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Status:</span> {project.feedback?.length ? 'Completed' : 'Active'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ManagersView = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [managerProjects, setManagerProjects] = useState({});
  
    useEffect(() => {
      const fetchProjects = async () => {
        try {
          setLoading(true);
          const response = await fetch('http://localhost:3000/PM/allprojects');
          if (!response.ok) throw new Error('Failed to fetch projects');
          
          const projects = await response.json();
          
          // Group projects by manager email
          const groupedProjects = projects.reduce((acc, project) => {
            const email = project.userEmail;
            if (!acc[email]) {
              acc[email] = [];
            }
            acc[email].push(project);
            return acc;
          }, {});
          
          setManagerProjects(groupedProjects);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
  
      fetchProjects();
    }, []);
  
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="text-red-500 bg-red-50 p-4 rounded-lg">
          Error: {error}
        </div>
      );
    }
  
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Project Manager Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(managerProjects).map(([email, projects]) => (
            <div key={email} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {email[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{email}</h3>
                  <p className="text-sm text-gray-500">
                    Projects: {projects.length}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Recent Projects</h4>
                <div className="space-y-2">
                  {projects.slice(0, 3).map((project) => (
                    <div key={project._id} className="text-sm text-gray-600 flex items-center">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></div>
                      <span>{project.projectName}</span>
                      <span className="ml-auto text-xs text-gray-500">${project.money}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    <span>Active: {projects.filter(p => !p.feedback?.length).length}</span>
                    <span className="mx-2">•</span>
                    <span>Completed: {projects.filter(p => p.feedback?.length).length}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

const AnalyticsView = ({ projects, projectDevelopers }) => {
  const projectStats = {
    total: projects.length,
    active: projects.filter(p => !p.feedback?.length).length,
    completed: projects.filter(p => p.feedback?.length).length
  };

  const pieData = [
    { name: 'Active', value: projectStats.active },
    { name: 'Completed', value: projectStats.completed }
  ];

  const COLORS = ['#6366f1', '#a855f7'];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Analytics Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Project Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index] }}></div>
                <span className="text-sm text-gray-600">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Developers</span>
              <span className="font-semibold">{projectDevelopers.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Projects</span>
              <span className="font-semibold">{projects.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Completion Rate</span>
              <span className="font-semibold">
                {projects.length ? ((projectStats.completed / projectStats.total) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ...existing code...

const AdminDashboard = () => {
    const [activeView, setActiveView] = useState('overview');
    const [projects, setProjects] = useState([]);
    const [projectDevelopers, setProjectDevelopers] = useState([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          // Fetch all projects
          const projectsRes = await fetch('http://localhost:3000/PM/allprojects');
          const projectsData = await projectsRes.json();
          setProjects(projectsData);
  
          // Fetch all unique developers
          const developersSet = new Set();
          await Promise.all(
            projectsData.map(async (project) => {
              try {
                const devsRes = await fetch(`http://localhost:3000/freelancer/projects/${project._id}/developers`);
                if (devsRes.ok) {
                  const devs = await devsRes.json();
                  devs.forEach(dev => developersSet.add(dev));
                }
              } catch (err) {
                console.error(`Error fetching developers for project ${project._id}:`, err);
              }
            })
          );
          setProjectDevelopers(Array.from(developersSet));
          
          setLoading(false);
        } catch (error) {
          console.error('Error fetching data:', error);
          setLoading(false);
        }
      };
  
      fetchData();
    }, []);
  
    const renderView = () => {
      if (loading) {
        return (
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        );
      }
  
      switch (activeView) {
        case 'overview':
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="font-semibold text-gray-800">Total Projects</h3>
                  <p className="text-3xl font-bold mt-2">{projects.length}</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="font-semibold text-gray-800">Active Developers</h3>
                  <p className="text-3xl font-bold mt-2">{projectDevelopers.length}</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="font-semibold text-gray-800">Completed Projects</h3>
                  <p className="text-3xl font-bold mt-2">
                    {projects.filter(p => p.feedback?.length).length}
                  </p>
                </div>
              </div>
              <ProjectsView projects={projects} />
            </div>
          );
        case 'freelancers':
          return <FreelancersView projectDevelopers={projectDevelopers} />;
        case 'managers':
          return <ManagersView />;
        case 'analytics':
          return <AnalyticsView projects={projects} projectDevelopers={projectDevelopers} />;
        default:
          return null;
      }
    };
  
    return (
        
      <div className="min-h-screen bg-gray-50">
        <SideNav activeView={activeView} setActiveView={setActiveView} />
        <div className="ml-64 p-8">
          {renderView()}
        </div>
      </div>
    );
  };
  
  export default AdminDashboard;