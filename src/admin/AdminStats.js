import React, { useState, useEffect } from 'react';
import { getStats, getDailyVisits } from '../services/AnalyticsService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatPageKey = (key) => {
    if (!key) return "Bilinmiyor";
    // key format: bookId_chapterIndex (sozler_0, mektubat_1)
    try {
        const parts = key.split('_');
        if (parts.length < 2) return key;
        const book = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        const ch = parseInt(parts[1]) + 1;
        return `${book} - ${ch}. Bölüm`;
    } catch (e) {
        return key;
    }
};

const VisitChart = ({ data, darkMode }) => {
    // Reverse data for chart (Oldest to Newest) is needed if stats is Newest->Oldest.
    // getStats returns Descending (Newest first).
    // So we need to reverse it for chart to be Left(Old)->Right(New).
    const chartData = [...data].reverse().map(item => ({
        name: item.date.split('-').slice(1).join('/'), // MM/DD
        visitors: item.visitors || 0
    }));

    return (
        <div className={`p-6 rounded-xl border mb-8 ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><span className="text-2xl">📈</span> Ziyaretçi Grafiği</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke={darkMode ? "#9ca3af" : "#6b7280"}
                            tick={{ fill: darkMode ? "#9ca3af" : "#6b7280" }}
                            tickLine={false}
                        />
                        <YAxis
                            stroke={darkMode ? "#9ca3af" : "#6b7280"}
                            tick={{ fill: darkMode ? "#9ca3af" : "#6b7280" }}
                            tickLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: darkMode ? '#1f2937' : '#fff',
                                borderColor: darkMode ? '#374151' : '#e5e7eb',
                                color: darkMode ? '#f3f4f6' : '#111827',
                                borderRadius: '8px'
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="visitors"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorVisitors)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const VisitDetailModal = ({ date, onClose, darkMode }) => {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDailyVisits(date).then(data => {
            setVisits(data);
            setLoading(false);
        });
    }, [date]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div className={`w-full max-w-4xl max-h-[80vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-[#25262b] text-gray-200 border border-gray-700' : 'bg-white text-gray-800'}`} onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <span>🕵️</span>
                        {date} Ziyaretçi Detayları
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200/20 transition-colors">✕</button>
                </div>
                <div className="p-0 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="p-10 text-center opacity-60">Veriler yükleniyor...</div>
                    ) : (
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className={`sticky top-0 z-10 ${darkMode ? 'bg-[#1a1b1e] text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                                <tr>
                                    <th className="p-4 font-semibold">Saat</th>
                                    <th className="p-4 font-semibold">IP Adresi</th>
                                    <th className="p-4 font-semibold">Konum</th>
                                    <th className="p-4 font-semibold">Kullanıcı</th>
                                    <th className="p-4 font-semibold">Cihaz / Platform</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                                {visits.map(v => (
                                    <tr key={v.id} className={`transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                                        <td className="p-4 font-mono opacity-80 whitespace-nowrap">
                                            {v.timestamp?.seconds ? new Date(v.timestamp.seconds * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td className="p-4 font-mono text-xs text-blue-500">{v.ip}</td>
                                        <td className="p-4 text-sm">
                                            {v.location ? (
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{v.location.city}</span>
                                                    <span className="text-xs opacity-60">{v.location.country}</span>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4">
                                            {v.user ? (
                                                <div className="flex items-center gap-2">
                                                    {v.user.photo ? <img src={v.user.photo} alt="" className="w-6 h-6 rounded-full" /> : <span className="text-lg">👤</span>}
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{v.user.name}</span>
                                                        <span className="text-xs opacity-50">{v.user.email}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="opacity-50 italic">Misafir</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs opacity-70 max-w-[200px] truncate" title={v.userAgent}>
                                            {v.platform || 'Bilinmiyor'}
                                            <div className="opacity-50 text-[10px] truncate">{v.userAgent}</div>
                                        </td>
                                    </tr>
                                ))}
                                {visits.length === 0 && (
                                    <tr><td colSpan="5" className="p-8 text-center opacity-50">Bu tarih için detaylı kayıt bulunamadı.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

const ViewPopularPages = ({ stats, darkMode }) => {
    const pageCounts = {};
    stats.forEach(day => {
        if (day.page_stats) {
            Object.keys(day.page_stats).forEach(k => {
                pageCounts[k] = (pageCounts[k] || 0) + day.page_stats[k];
            });
        }
    });

    const sorted = Object.entries(pageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50);

    return (
        <div className={`p-6 rounded-xl border ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><span className="text-2xl">🔥</span> En Çok Okunanlar</h3>
            <div className={`overflow-y-auto max-h-[600px] pr-2 ${darkMode ? 'scroll-bar-dark' : 'scroll-bar-light'}`}>
                {sorted.length > 0 ? (
                    <ul className="space-y-1">
                        {sorted.map(([key, count], idx) => (
                            <li key={key} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}>
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx < 3 ? 'bg-amber-400 text-amber-900' : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600')}`}>
                                        {idx + 1}
                                    </span>
                                    <span className="font-medium">{formatPageKey(key)}</span>
                                </div>
                                <span className={`font-mono font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{count}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-10 opacity-50">Henüz okuma verisi yok.</div>
                )}
            </div>
        </div>
    );
};

const AdminStats = ({ onBack, darkMode, toggleDarkMode }) => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        getStats(30).then(data => {
            setStats(data);
            setLoading(false);
        });
    }, []);

    const totalVisitors = stats.reduce((acc, curr) => acc + (curr.visitors || 0), 0);
    const totalViews = stats.reduce((acc, curr) => acc + (curr.total_views || 0), 0);

    // Ensure sorted Newest -> Oldest
    const sortedStats = [...stats].sort((a, b) => b.date.localeCompare(a.date));

    const downloadCSV = () => {
        if (!sortedStats.length) return;

        const headers = ["Tarih", "Ziyaretci Sayisi", "Sayfa Gosterimi"];
        // Add BOM for Excel UTF-8 support
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
            + headers.join(",") + "\n"
            + sortedStats.map(s => `${s.date},${s.visitors || 0},${s.total_views || 0}`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `risale_istatistik_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-[#1a1b1e] text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-30 border-b transition-colors duration-300 ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className={`p-2 -ml-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                            title="Geri Dön"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>İstatistikler</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={toggleDarkMode} className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-gray-700 text-amber-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-12">
                {loading ? (
                    <div className="text-center py-20 opacity-50">Veriler yükleniyor...</div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-white border-gray-200'}`}>
                                <div className="text-sm opacity-60 mb-1">Son 30 Gün Ziyaretçi</div>
                                <div className="text-3xl font-bold text-blue-500">{totalVisitors}</div>
                            </div>
                            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-white border-gray-200'}`}>
                                <div className="text-sm opacity-60 mb-1">Son 30 Gün Sayfa Gösterimi</div>
                                <div className="text-3xl font-bold text-green-500">{totalViews}</div>
                            </div>
                        </div>

                        {/* Chart */}
                        {sortedStats.length > 0 && <VisitChart data={sortedStats} darkMode={darkMode} />}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Visits Table */}
                            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-white border-gray-200'}`}>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2"><span className="text-2xl">📅</span> Günlük Veriler</h3>
                                    <button
                                        onClick={downloadCSV}
                                        className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors shadow-sm"
                                        title="Excel Olarak İndir"
                                    >
                                        <span>📊</span> Excel
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className={`border-b ${darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-100 text-gray-500'}`}>
                                            <tr>
                                                <th className="pb-3 pl-2">Tarih</th>
                                                <th className="pb-3 text-right">Ziyaretçi</th>
                                                <th className="pb-3 text-right pr-2">Okuma</th>
                                                <th className="pb-3 text-right pr-2">Detay</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                                            {sortedStats.map(s => (
                                                <tr key={s.id} className={`transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                                                    <td className="py-3 pl-2 font-mono opacity-80">{s.date}</td>
                                                    <td className="py-3 text-right font-bold text-blue-500">{s.visitors || 0}</td>
                                                    <td className="py-3 text-right pr-2 font-bold text-green-500">{s.total_views || 0}</td>
                                                    <td className="py-3 text-right">
                                                        <button
                                                            onClick={() => setSelectedDate(s.date)}
                                                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                                        >
                                                            İncele
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {sortedStats.length === 0 && <tr><td colSpan="4" className="py-4 text-center opacity-50">Veri yok.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Popular Pages */}
                            <ViewPopularPages stats={stats} darkMode={darkMode} />
                        </div>
                    </>
                )}
            </div>

            {/* Modal */}
            {selectedDate && (
                <VisitDetailModal
                    date={selectedDate}
                    onClose={() => setSelectedDate(null)}
                    darkMode={darkMode}
                />
            )}
        </div>
    );
};

export default AdminStats;
