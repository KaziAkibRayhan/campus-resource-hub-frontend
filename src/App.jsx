import React, { useState } from 'react';
import { Search, Upload, Calendar, AlertCircle, Users, BookOpen, Bell, Home, Menu, X, Download, Eye, Star, Filter, ChevronDown, User, LogOut, Settings, FileText, Image as ImageIcon, MapPin } from 'lucide-react';

// Dummy Data
const dummyResources = [
  { id: 1, title: 'Data Structures Notes - Complete', course: 'CSE 201', semester: '3rd', department: 'CSE', type: 'PDF', uploadedBy: 'Akib Rayhan', rating: 4.5, downloads: 245, date: '2024-12-10', approved: true },
  { id: 2, title: 'Algorithm Analysis Slides', course: 'CSE 205', semester: '3rd', department: 'CSE', type: 'PPTX', uploadedBy: 'Rakibul Hasan', rating: 4.8, downloads: 189, date: '2024-12-08', approved: true },
  { id: 3, title: 'Database Management System - Mid Questions', course: 'CSE 301', semester: '5th', department: 'CSE', type: 'PDF', uploadedBy: 'Student123', rating: 4.2, downloads: 156, date: '2024-12-05', approved: true },
  { id: 4, title: 'Operating Systems Lab Manual', course: 'CSE 303', semester: '5th', department: 'CSE', type: 'DOCX', uploadedBy: 'Akib Rayhan', rating: 4.6, downloads: 203, date: '2024-12-03', approved: true },
];

const dummyAnnouncements = [
  { id: 1, title: 'Mid-Term Exam Schedule Released', department: 'CSE', postedBy: 'Department Head', date: '2024-12-12', content: 'The mid-term examination schedule for all semesters has been published. Check the notice board.', approved: true },
  { id: 2, title: 'Tech Fest 2024 Registration Open', department: 'All', postedBy: 'Cultural Club', date: '2024-12-10', content: 'Annual tech fest registration is now open. Participate in hackathons, coding contests, and more!', approved: true },
  { id: 3, title: 'Library Hours Extended', department: 'All', postedBy: 'Admin', date: '2024-12-08', content: 'Central library will remain open until 10 PM during exam week.', approved: true },
];

const dummyEvents = [
  { id: 1, title: 'Web Development Workshop', club: 'Programming Club', date: '2024-12-20', time: '2:00 PM', location: 'Room 301', description: 'Learn MERN stack development from industry experts.' },
  { id: 2, title: 'Career Fair 2024', club: 'Career Development', date: '2024-12-25', time: '10:00 AM', location: 'Main Auditorium', description: 'Meet recruiters from top tech companies.' },
  { id: 3, title: 'Debate Competition', club: 'Debate Society', date: '2024-12-18', time: '3:00 PM', location: 'Room 205', description: 'Inter-department debate competition with exciting prizes.' },
];

const dummyLostFound = [
  { id: 1, type: 'lost', item: 'Blue Backpack', description: 'Contains laptop and notebooks', location: 'Library 2nd Floor', contact: 'stu****@email.com', date: '2024-12-13', image: true },
  { id: 2, type: 'found', item: 'Student ID Card', description: 'ID: 4223020***', location: 'Cafeteria', contact: '017****5678', date: '2024-12-12', image: true },
  { id: 3, type: 'lost', item: 'Scientific Calculator', description: 'Casio FX-991EX', location: 'Room 401', contact: 'stu****@email.com', date: '2024-12-11', image: false },
];

const dummyClubs = [
  { id: 1, name: 'Programming Club', members: 156, description: 'Learn and compete in programming contests', posts: 23 },
  { id: 2, name: 'Robotics Club', members: 89, description: 'Build and program robots', posts: 15 },
  { id: 3, name: 'Cultural Club', members: 234, description: 'Organize cultural events and festivals', posts: 45 },
  { id: 4, name: 'Debate Society', members: 67, description: 'Enhance public speaking and debate skills', posts: 12 },
];

// Main App Component
function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState('student'); // student, moderator, admin
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');

  // Navigation Component
  const Sidebar = () => (
    <div className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">CRH</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X size={24} />
          </button>
        </div>
        
        <nav className="space-y-2">
          <NavItem icon={<Home size={20} />} text="Dashboard" page="dashboard" />
          <NavItem icon={<BookOpen size={20} />} text="Resources" page="resources" />
          <NavItem icon={<Bell size={20} />} text="Announcements" page="announcements" />
          <NavItem icon={<Calendar size={20} />} text="Events" page="events" />
          <NavItem icon={<AlertCircle size={20} />} text="Lost & Found" page="lostfound" />
          <NavItem icon={<Users size={20} />} text="Clubs" page="clubs" />
          {(userRole === 'admin' || userRole === 'moderator') && (
            <NavItem icon={<Settings size={20} />} text="Admin Panel" page="admin" />
          )}
        </nav>

        <div className="mt-8 pt-8 border-t border-blue-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User size={20} />
            </div>
            <div>
              <p className="font-semibold">Akib Rayhan</p>
              <p className="text-xs text-blue-300">{userRole}</p>
            </div>
          </div>
          <button className="flex items-center space-x-2 text-blue-300 hover:text-white transition">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );

  const NavItem = ({ icon, text, page }) => (
    <button
      onClick={() => { setCurrentPage(page); setSidebarOpen(false); }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${currentPage === page ? 'bg-blue-700' : 'hover:bg-blue-700/50'}`}
    >
      {icon}
      <span>{text}</span>
    </button>
  );

  // Dashboard Page
  const Dashboard = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<BookOpen />} title="Total Resources" value="1,234" color="blue" />
        <StatCard icon={<Bell />} title="Announcements" value="45" color="green" />
        <StatCard icon={<Calendar />} title="Upcoming Events" value="12" color="purple" />
        <StatCard icon={<AlertCircle />} title="Lost Items" value="8" color="orange" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Recent Resources</h3>
          <div className="space-y-3">
            {dummyResources.slice(0, 3).map(resource => (
              <div key={resource.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800">{resource.title}</p>
                  <p className="text-sm text-gray-600">{resource.course} • {resource.department}</p>
                </div>
                <Download size={20} className="text-blue-600" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Latest Announcements</h3>
          <div className="space-y-3">
            {dummyAnnouncements.slice(0, 3).map(announcement => (
              <div key={announcement.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-800">{announcement.title}</p>
                <p className="text-sm text-gray-600">{announcement.department} • {announcement.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const StatCard = ({ icon, title, value, color }) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
    };

    return (
      <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-xl shadow-lg p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <div className="opacity-80">{icon}</div>
        </div>
      </div>
    );
  };

  // Resources Page
  const Resources = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800">Academic Resources</h2>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition">
          <Upload size={20} />
          <span>Upload Resource</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search resources..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
            <option value="all">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="EEE">EEE</option>
            <option value="BBA">BBA</option>
          </select>
          <select className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
            <option value="all">All Semesters</option>
            <option value="1st">1st Semester</option>
            <option value="3rd">3rd Semester</option>
            <option value="5th">5th Semester</option>
          </select>
          <button className="bg-gray-100 px-4 py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-200 transition">
            <Filter size={20} />
            <span>Filters</span>
          </button>
        </div>

        <div className="space-y-4">
          {dummyResources.map(resource => (
            <div key={resource.id} className="border rounded-lg p-4 hover:shadow-md transition">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <FileText className="text-red-500" size={24} />
                    <h3 className="text-lg font-bold text-gray-800">{resource.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-2">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{resource.course}</span>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">{resource.department}</span>
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">{resource.semester}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>By {resource.uploadedBy}</span>
                    <span>•</span>
                    <span>{resource.date}</span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      <span>{resource.rating}</span>
                    </span>
                    <span>•</span>
                    <span>{resource.downloads} downloads</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition flex items-center space-x-2">
                    <Eye size={18} />
                    <span>View</span>
                  </button>
                  <button className="bg-green-50 text-green-600 px-4 py-2 rounded-lg hover:bg-green-100 transition flex items-center space-x-2">
                    <Download size={18} />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Announcements Page
  const Announcements = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Announcements</h2>
        {(userRole === 'admin' || userRole === 'moderator') && (
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
            Create Announcement
          </button>
        )}
      </div>

      <div className="space-y-4">
        {dummyAnnouncements.map(announcement => (
          <div key={announcement.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{announcement.title}</h3>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{announcement.department}</span>
                  <span>Posted by {announcement.postedBy}</span>
                  <span>•</span>
                  <span>{announcement.date}</span>
                </div>
              </div>
              <Bell className="text-blue-600" size={24} />
            </div>
            <p className="text-gray-700">{announcement.content}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // Events Page
  const Events = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Upcoming Events</h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dummyEvents.map(event => (
          <div key={event.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-32 flex items-center justify-center">
              <Calendar size={48} className="text-white" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{event.title}</h3>
              <p className="text-gray-600 mb-4">{event.description}</p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Users size={16} />
                  <span>{event.club}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar size={16} />
                  <span>{event.date} at {event.time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin size={16} />
                  <span>{event.location}</span>
                </div>
              </div>
              <button className="mt-4 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition">
                Register
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Lost & Found Page
  const LostFound = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Lost & Found</h2>
        <button className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition">
          Report Item
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {dummyLostFound.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${item.type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {item.type.toUpperCase()}
              </span>
              <span className="text-sm text-gray-500">{item.date}</span>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                {item.image ? <ImageIcon className="text-gray-400" size={32} /> : <AlertCircle className="text-gray-400" size={32} />}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{item.item}</h3>
                <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                  <MapPin size={14} />
                  <span>{item.location}</span>
                </div>
                <p className="text-sm text-gray-600">Contact: {item.contact}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Clubs Page
  const Clubs = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Campus Clubs</h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dummyClubs.map(club => (
          <div key={club.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Users size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 text-center mb-2">{club.name}</h3>
            <p className="text-gray-600 text-center text-sm mb-4">{club.description}</p>
            <div className="flex justify-around text-center pt-4 border-t">
              <div>
                <p className="text-2xl font-bold text-blue-600">{club.members}</p>
                <p className="text-xs text-gray-500">Members</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{club.posts}</p>
                <p className="text-xs text-gray-500">Posts</p>
              </div>
            </div>
            <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
              View Club
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // Admin Panel
  const AdminPanel = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Admin Panel</h2>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Pending Approvals</h3>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <p className="font-semibold text-gray-800">3 Resources</p>
              <p className="text-sm text-gray-600">Waiting for approval</p>
            </div>
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <p className="font-semibold text-gray-800">2 Announcements</p>
              <p className="text-sm text-gray-600">Waiting for approval</p>
            </div>
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <p className="font-semibold text-gray-800">1 Lost Item</p>
              <p className="text-sm text-gray-600">Waiting for approval</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">User Management</h3>
          <div className="space-y-3">
            <button className="w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition">
              <p className="font-semibold text-gray-800">View All Users</p>
              <p className="text-sm text-gray-600">1,234 registered</p>
            </button>
            <button className="w-full p-3 bg-green-50 hover:bg-green-100 rounded-lg text-left transition">
              <p className="font-semibold text-gray-800">Manage Moderators</p>
              <p className="text-sm text-gray-600">15 active moderators</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">System Reports</h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-800">Storage Used</p>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">6.5 GB / 10 GB</p>
            </div>
            <button className="w-full p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition">
              <p className="font-semibold text-gray-800">Download Reports</p>
              <p className="text-sm text-gray-600">Export system data</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'resources': return <Resources />;
      case 'announcements': return <Announcements />;
      case 'events': return <Events />;
      case 'lostfound': return <LostFound />;
      case 'clubs': return <Clubs />;
      case 'admin': return <AdminPanel />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Campus Resource Hub</h1>
            <div className="flex items-center space-x-4">
              <button className="relative">
                <Bell size={24} className="text-gray-600" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">3</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;