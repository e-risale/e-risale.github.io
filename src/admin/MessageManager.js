import React, { useState } from 'react';

/**
 * MessageManager Component
 * Migrated from AdminPage.js
 * Handles reading, approving, replying to, and archiving user feedbacks.
 */
const MessageManager = ({
    onBack,
    feedbacks,
    isLoading,
    onDelete,
    onMarkRead,
    onApprove,
    onArchive,
    onDeleteAll,
    onExport,
    onReply,
    darkMode = false // Admin panel has its own style usually, but supporting dark mode prop
}) => {
    const [activeTab, setActiveTab] = useState('new'); // new, pending, approved, archived, reports
    const [replyModeId, setReplyModeId] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [selectedFeedback, setSelectedFeedback] = useState(null);

    const handleOpenReply = (fb) => {
        setReplyModeId(fb.id);
        setReplyText(fb.reply || "");
    };

    const handleSendReply = async () => {
        if (!replyModeId) return;
        await onReply(replyModeId, replyText);
        setReplyModeId(null);
        setReplyText("");
    };

    // Client-side filtering
    const getFilteredFeedbacks = () => {
        if (!feedbacks) return [];
        return feedbacks.filter(fb => {
            const isReport = ['bug', 'typo'].includes(fb.category);
            const status = fb.status || 'unread';

            if (activeTab === 'reports') return isReport && status !== 'archived';

            // Other tabs exclude reports
            if (activeTab === 'new') return !isReport && (status === 'unread' || status === 'new');
            if (activeTab === 'pending') return !isReport && status === 'read';
            if (activeTab === 'approved') return !isReport && status === 'approved';
            if (activeTab === 'archived') return status === 'archived';

            return false;
        });
    };

    const filteredFeedbacks = getFilteredFeedbacks();

    // Tab Counts
    const counts = {
        new: feedbacks?.filter(f => !['bug', 'typo'].includes(f.category) && (f.status === 'unread' || f.status === 'new')).length || 0,
        pending: feedbacks?.filter(f => !['bug', 'typo'].includes(f.category) && f.status === 'read').length || 0,
        approved: feedbacks?.filter(f => !['bug', 'typo'].includes(f.category) && f.status === 'approved').length || 0,
        reports: feedbacks?.filter(f => ['bug', 'typo'].includes(f.category) && f.status !== 'archived').length || 0,
        archived: feedbacks?.filter(f => f.status === 'archived').length || 0
    };

    // Detail Modal
    const FeedbackDetailModal = ({ fb, onClose }) => {
        if (!fb) return null;
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
                <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 relative bg-white" onClick={e => e.stopPropagation()}>
                    <button onClick={onClose} className="absolute top-4 right-4 text-2xl opacity-50 hover:opacity-100">×</button>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-gray-100 text-gray-600">
                            {fb.name ? fb.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                            <div className="font-bold text-lg text-gray-900">{fb.name || 'Anonim'}</div>
                            <div className="opacity-60 text-sm text-gray-500">
                                {fb.date?.toDate ? fb.date.toDate().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Tarih yok'}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className={`px-2 py-1 inline-block rounded text-xs font-bold uppercase ${fb.category === 'bug' ? 'bg-red-100 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
                            {fb.category === 'bug' ? 'Teknik Hata' :
                                fb.category === 'typo' ? 'Tashih' :
                                    fb.category === 'suggestion' ? 'İçerik Önerisi' :
                                        'Genel Yorum'}
                        </div>

                        <div className="text-sm font-mono opacity-50 border-b pb-2 text-gray-500">Konum: {fb.page}</div>

                        <div className="p-4 rounded-xl text-lg leading-relaxed whitespace-pre-wrap bg-gray-50 text-gray-800">
                            {fb.feedback}
                        </div>

                        {fb.reply && (
                            <div className="p-4 rounded-xl border-l-4 bg-amber-50 border-amber-400">
                                <div className="font-bold text-amber-600 text-sm mb-1">EDİTÖR YANITI:</div>
                                <div>{fb.reply}</div>
                            </div>
                        )}

                        {replyModeId === fb.id && (
                            <div className="mt-4 animate-fade-in">
                                <textarea
                                    className="w-full p-3 rounded-xl text-base border focus:ring-2 focus:ring-amber-500 outline-none bg-white border-gray-300"
                                    rows="4"
                                    placeholder="Yanıtınızı yazın..."
                                    autoFocus
                                    value={replyText}
                                    onClick={e => e.stopPropagation()}
                                    onChange={(e) => setReplyText(e.target.value)}
                                />
                                <div className="flex gap-2 mt-3 justify-end">
                                    <button onClick={handleSendReply} className="px-6 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transform active:scale-95 transition-all">
                                        Yanıtı Gönder
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            {/* Header */}
            <div className="fixed top-0 inset-x-0 h-16 z-30 flex items-center justify-between px-4 md:px-8 border-b bg-white/90 backdrop-blur-md border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
                        ←
                    </button>
                    <h1 className="font-bold text-xl font-serif text-gray-800">Mesaj Yönetimi</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onExport} className="px-4 py-2 rounded-lg text-sm font-bold border border-gray-300 hover:bg-gray-50 transition-colors text-gray-700">
                        📥 Excel
                    </button>
                    {activeTab === 'archived' && (
                        <button onClick={onDeleteAll} className="px-4 py-2 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700 shadow-sm">
                            🧹 Arşivi Temizle
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="fixed top-16 left-0 right-0 z-20 border-b bg-white border-gray-200 shadow-sm overflow-x-auto">
                <div className="max-w-7xl mx-auto px-4 md:px-8 flex gap-8">
                    <TabButton active={activeTab === 'new'} onClick={() => setActiveTab('new')} count={counts.new} color="red">Yorumlar (Yeni)</TabButton>
                    <TabButton active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} count={counts.pending} color="amber">İncelenenler</TabButton>
                    <TabButton active={activeTab === 'approved'} onClick={() => setActiveTab('approved')} count={counts.approved} color="green">Yayındakiler</TabButton>
                    <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} count={counts.reports} color="purple">Bildirimler/Hata</TabButton>
                    <TabButton active={activeTab === 'archived'} onClick={() => setActiveTab('archived')} count={counts.archived} color="gray">Arşiv/Çöp</TabButton>
                </div>
            </div>

            {/* Content */}
            <div className="pt-40 pb-12 px-2 md:px-8 max-w-7xl mx-auto">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin text-4xl">⏳</div>
                    </div>
                ) : filteredFeedbacks.length === 0 ? (
                    <div className="text-center py-24 opacity-50">
                        <div className="text-6xl mb-4 text-gray-300">📭</div>
                        <h3 className="text-xl font-bold text-gray-500">Bu kategoride mesaj yok.</h3>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filteredFeedbacks.map(fb => (
                            <FeedbackCard
                                key={fb.id}
                                fb={fb}
                                activeTab={activeTab}
                                onClick={() => setSelectedFeedback(fb)}
                                actions={{ onMarkRead, onApprove, onArchive, onDelete, onReply: (fb) => { handleOpenReply(fb); setSelectedFeedback(fb); } }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {selectedFeedback && <FeedbackDetailModal fb={selectedFeedback} onClose={() => setSelectedFeedback(null)} />}
        </div>
    );
};

const TabButton = ({ active, onClick, children, count, color }) => {
    let activeClass = '';
    if (active) {
        if (color === 'red') activeClass = 'border-red-500 text-red-600';
        else if (color === 'amber') activeClass = 'border-amber-500 text-amber-600';
        else if (color === 'green') activeClass = 'border-green-500 text-green-600';
        else if (color === 'purple') activeClass = 'border-purple-500 text-purple-600';
        else activeClass = 'border-gray-500 text-gray-600';
    } else {
        activeClass = 'border-transparent text-gray-400 hover:text-gray-600';
    }

    return (
        <button onClick={onClick} className={`py-4 text-sm font-bold border-b-2 transition-colors relative whitespace-nowrap flex items-center gap-2 ${activeClass}`}>
            {children}
            {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white ${color === 'red' ? 'bg-red-500' : color === 'amber' ? 'bg-amber-500' : color === 'green' ? 'bg-green-500' : color === 'purple' ? 'bg-purple-500' : 'bg-gray-500'}`}>
                    {count}
                </span>
            )}
        </button>
    );
};

const FeedbackCard = ({ fb, activeTab, onClick, actions }) => {
    const { onMarkRead, onApprove, onArchive, onDelete, onReply } = actions;

    return (
        <div onClick={onClick} className="group p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex items-center gap-4">
            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 border-r pr-4 border-dashed border-gray-200" onClick={e => e.stopPropagation()}>
                {activeTab === 'new' && (
                    <>
                        <ActionButton onClick={() => onMarkRead(fb.id)} icon="👁️" color="gray" title="İncele" />
                        <ActionButton onClick={() => onApprove(fb.id)} icon="✅" color="green" title="Yayınla" />
                        <ActionButton onClick={() => onArchive(fb.id)} icon="🗑" color="red" title="Arşivle" />
                    </>
                )}
                {activeTab === 'pending' && (
                    <>
                        <ActionButton onClick={() => onApprove(fb.id)} icon="✅" color="green" title="Yayınla" />
                        <ActionButton onClick={() => onArchive(fb.id)} icon="🗑" color="red" title="Arşivle" />
                    </>
                )}
                {activeTab === 'approved' && (
                    <>
                        <ActionButton onClick={() => onReply(fb)} icon="💬" color="amber" title="Yanıtla" />
                        <ActionButton onClick={() => onArchive(fb.id)} icon="🚫" color="red" title="Yayından Kaldır" />
                    </>
                )}
                {activeTab === 'reports' && (
                    <>
                        <ActionButton onClick={() => onArchive(fb.id)} icon="📂" color="blue" title="Arşivle (Çözüldü)" />
                        <ActionButton onClick={() => onDelete(fb.id)} icon="🗑" color="red" title="Sil" />
                    </>
                )}
                {activeTab === 'archived' && (
                    <>
                        <ActionButton onClick={() => onMarkRead(fb.id)} icon="↩️" color="blue" title="Geri Al" />
                        <ActionButton onClick={() => onDelete(fb.id)} icon="🗑" color="red" title="Tamamen Sil" />
                    </>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold bg-gray-100 text-gray-600">
                        {fb.name ? fb.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="font-bold text-sm truncate text-gray-900">{fb.name || 'Anonim'}</div>
                    <div className="text-xs text-gray-400 whitespace-nowrap">
                        {fb.date?.toDate ? fb.date.toDate().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : ''}
                    </div>
                    {fb.likes && fb.likes.length > 0 && <span className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded">👍 {fb.likes.length}</span>}
                </div>
                <div className="text-sm text-gray-600 truncate">
                    {fb.category === 'suggestion' && <span className="font-bold text-blue-600 mr-1">[ÖNERİ]</span>}
                    {fb.category === 'bug' && <span className="font-bold text-red-600 mr-1">[HATA]</span>}
                    {fb.feedback}
                </div>
            </div>

            {/* Badge */}
            <div className="shrink-0 hidden md:block">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${fb.category === 'bug' ? 'bg-red-100 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
                    {fb.category === 'bug' ? 'HATA' : fb.category === 'typo' ? 'TASHİH' : 'YORUM'}
                </span>
            </div>
        </div>
    );
};

const ActionButton = ({ onClick, icon, color, title }) => {
    const colorClasses = {
        gray: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
        green: 'bg-green-100 text-green-700 hover:bg-green-200',
        red: 'bg-red-50 text-red-600 hover:bg-red-100',
        amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
        blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100'
    };
    return (
        <button onClick={onClick} className={`p-2 rounded-lg text-xs font-bold transition-colors ${colorClasses[color]}`} title={title}>
            {icon}
        </button>
    );
};

export default MessageManager;
