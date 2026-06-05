import { useState } from 'react';

interface StatCard {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
  color: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'suspended' | 'pending';
  avatar: string;
  joinedAt: string;
}

const stats: StatCard[] = [
  { title: 'Tổng người dùng', value: '12,847', change: '+12.5%', positive: true, icon: '👥', color: 'from-blue-500 to-blue-600' },
  { title: 'Bài viết hôm nay', value: '1,234', change: '+8.2%', positive: true, icon: '📝', color: 'from-green-500 to-green-600' },
  { title: 'Báo cáo vi phạm', value: '23', change: '-5.1%', positive: true, icon: '⚠️', color: 'from-red-500 to-red-600' },
  { title: 'Tài liệu mới', value: '456', change: '+3.7%', positive: true, icon: '📚', color: 'from-purple-500 to-purple-600' },
];

const users: User[] = [
  { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@cmc.edu.vn', role: 'Sinh viên', status: 'active', avatar: 'https://i.pravatar.cc/150?img=1', joinedAt: '2024-09-15' },
  { id: 2, name: 'Trần Thị B', email: 'tranthib@cmc.edu.vn', role: 'Giảng viên', status: 'active', avatar: 'https://i.pravatar.cc/150?img=5', joinedAt: '2024-08-20' },
  { id: 3, name: 'Lê Văn C', email: 'levanc@cmc.edu.vn', role: 'Sinh viên', status: 'suspended', avatar: 'https://i.pravatar.cc/150?img=3', joinedAt: '2024-10-01' },
  { id: 4, name: 'Phạm Thị D', email: 'phamthid@cmc.edu.vn', role: 'Admin', status: 'active', avatar: 'https://i.pravatar.cc/150?img=9', joinedAt: '2024-07-10' },
  { id: 5, name: 'Hoàng Văn E', email: 'hoangvane@cmc.edu.vn', role: 'Sinh viên', status: 'pending', avatar: 'https://i.pravatar.cc/150?img=12', joinedAt: '2024-11-05' },
  { id: 6, name: 'Đặng Thị F', email: 'dangthif@cmc.edu.vn', role: 'Sinh viên', status: 'active', avatar: 'https://i.pravatar.cc/150?img=15', joinedAt: '2024-10-28' },
];

const navItems = [
  { icon: '📊', label: 'Tổng quan', active: true },
  { icon: '👥', label: 'Người dùng', active: false },
  { icon: '📝', label: 'Bài viết', active: false },
  { icon: '📚', label: 'Tài liệu', active: false },
  { icon: '🛒', label: 'Marketplace', active: false },
  { icon: '⚠️', label: 'Báo cáo', active: false },
  { icon: '⚙️', label: 'Cài đặt', active: false },
];

const statusColors: Record<User['status'], string> = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
};

const statusLabels: Record<User['status'], string> = {
  active: 'Hoạt động',
  suspended: 'Đã khóa',
  pending: 'Chờ duyệt',
};

export default function App() {
  const [activeNav, setActiveNav] = useState('Tổng quan');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              C
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg">CampusConnect</h1>
              <p className="text-xs text-gray-500">Admin Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeNav === item.label
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <img src="https://i.pravatar.cc/150?img=11" alt="Admin" className="w-9 h-9 rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
              <p className="text-xs text-gray-500 truncate">admin@cmc.edu.vn</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Tổng quan</h2>
          <p className="text-gray-500 mt-1">Thống kê tổng quan hệ thống CampusConnect</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map(stat => (
            <div key={stat.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-2xl shadow-md`}>
                  {stat.icon}
                </div>
                <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${
                  stat.positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.title}</p>
            </div>
          ))}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Quản lý người dùng</h3>
            <input
              type="text"
              placeholder="🔍 Tìm kiếm người dùng..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Người dùng</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vai trò</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày tham gia</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{user.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[user.status]}`}>
                        {statusLabels[user.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.joinedAt}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                          Sửa
                        </button>
                        <button className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium">
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
