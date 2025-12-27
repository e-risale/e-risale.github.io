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
    updateCategory,
    darkMode = false,
    toggleDarkMode
}) => {
    const [activeTab, setActiveTab] = useState('pending'); // Default: İncelenecekler
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [autoFocusReply, setAutoFocusReply] = useState(false);

    // Date Helper
    const formatDate = (dateObj) => {
        if (!dateObj || !dateObj.toDate) return '-';
        return dateObj.toDate().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(' ', ' - ');
    };

    // Client-side filtering
    const getFilteredFeedbacks = () => {
        if (!feedbacks) return [];
        return feedbacks.filter(fb => {
            const status = fb.status || 'unread';

            // 1. Yorumlar / Öneri / Hata (Sadece 'unread' veya 'new' olan YENİ mesajlar)
            // Okunan mesajlar 'pending' (İncelenecekler) sekmesine gider.

            // 1. Yorumlar
            if (activeTab === 'comments') return fb.category === 'general' && (status === 'unread' || status === 'new');
            // 2. Öneriler
            if (activeTab === 'suggestions') return fb.category === 'suggestion' && (status === 'unread' || status === 'new');
            // 3. Hatalar
            if (activeTab === 'errors') return (fb.category === 'bug' || fb.category === 'typo') && (status === 'unread' || status === 'new');

            // 4. İncelenecekler (Okunmuş/İncelenmiş ama henüz onaylanmamış/arşivlenmemiş)
            if (activeTab === 'pending') return status === 'read';

            // 5. Yayındakiler (Onaylanmışlar)
            if (activeTab === 'approved') return status === 'approved';

            // 6. Arşiv/Çöp
            if (activeTab === 'archived') return status === 'archived';

            return false;
        });
    };

    const filteredFeedbacks = getFilteredFeedbacks();

    // Tab Counts
    const counts = {
        comments: feedbacks?.filter(f => f.category === 'general' && (f.status === 'unread' || f.status === 'new')).length || 0,
        suggestions: feedbacks?.filter(f => f.category === 'suggestion' && (f.status === 'unread' || f.status === 'new')).length || 0,
        errors: feedbacks?.filter(f => (f.category === 'bug' || f.category === 'typo') && (f.status === 'unread' || f.status === 'new')).length || 0,
        pending: feedbacks?.filter(f => f.status === 'read').length || 0,
        approved: feedbacks?.filter(f => f.status === 'approved').length || 0,
        archived: feedbacks?.filter(f => f.status === 'archived').length || 0
    };

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-[#1a1b1e] text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
            {/* Header */}
            <div className={`fixed top-0 inset-x-0 h-16 z-30 flex items-center justify-between px-4 md:px-8 border-b transition-colors duration-300 ${darkMode ? 'bg-[#25262b]/90 border-gray-700 backdrop-blur-md shadow-md' : 'bg-white/90 border-gray-200 backdrop-blur-md shadow-sm'}`}>
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
                        ←
                    </button>
                    <h1 className={`font-bold text-xl font-serif ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Mesaj Yönetimi</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={toggleDarkMode} className={`p-2 rounded-lg text-xl transition-colors ${darkMode ? 'bg-gray-700 text-amber-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                    <button onClick={onExport} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>
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
            <div className={`fixed top-16 left-0 right-0 z-20 border-b shadow-sm overflow-x-auto transition-colors duration-300 ${darkMode ? 'bg-[#1a1b1e] border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="max-w-7xl mx-auto px-4 md:px-8 flex gap-4 md:gap-8 pb-3 pt-3">
                    <TabButton active={activeTab === 'comments'} onClick={() => setActiveTab('comments')} count={counts.comments} color="blue" darkMode={darkMode}>Yorumlar</TabButton>
                    <TabButton active={activeTab === 'suggestions'} onClick={() => setActiveTab('suggestions')} count={counts.suggestions} color="green" darkMode={darkMode}>Öneri</TabButton>
                    <TabButton active={activeTab === 'errors'} onClick={() => setActiveTab('errors')} count={counts.errors} color="red" darkMode={darkMode}>Hata</TabButton>
                    <TabButton active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} count={counts.pending} color="amber" darkMode={darkMode}>İncelenecekler</TabButton>
                    <TabButton active={activeTab === 'approved'} onClick={() => setActiveTab('approved')} count={counts.approved} color="purple" darkMode={darkMode}>Yayındakiler</TabButton>
                    <TabButton active={activeTab === 'archived'} onClick={() => setActiveTab('archived')} count={counts.archived} color="gray" darkMode={darkMode}>Arşiv/Çöp</TabButton>
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
                                actions={{
                                    onMarkRead,
                                    onApprove,
                                    onArchive,
                                    onDelete,
                                    onReply: () => { setSelectedFeedback(fb); setAutoFocusReply(true); }, // Hijack onReply to open modal
                                    updateCategory
                                }}
                                darkMode={darkMode}
                                formatDate={formatDate}
                            />
                        ))}
                    </div>
                )}
            </div>

            {selectedFeedback && (
                <FeedbackDetailModal
                    fb={selectedFeedback}
                    onClose={() => { setSelectedFeedback(null); setAutoFocusReply(false); }}
                    darkMode={darkMode}
                    formatDate={formatDate}
                    onMarkRead={onMarkRead}
                    onApprove={onApprove}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    onReply={onReply}
                    updateCategory={updateCategory}
                    initialShowReply={autoFocusReply}
                />
            )}
        </div>
    );
};

// Extracted FeedbackDetailModal to fix re-rendering/focus issues
const FeedbackDetailModal = ({ fb, onClose, darkMode, formatDate, onMarkRead, onApprove, onArchive, onDelete, onReply, updateCategory, initialShowReply = false }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showReplyInput, setShowReplyInput] = useState(initialShowReply);
    const [replyText, setReplyText] = useState(fb.reply || "");

    const handleSendReply = async () => {
        await onReply(fb.id, replyText);
        setShowReplyInput(false);
        onClose();
    };

    if (!fb) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 relative ${darkMode ? 'bg-[#1a1b1e] border border-gray-700' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                {/* Close Button - Increased z-index */}
                <button onClick={onClose} className={`absolute top-4 right-4 text-2xl opacity-50 hover:opacity-100 z-10 p-1 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>×</button>

                <div className="flex items-center gap-3 mb-6 mr-8"> {/* Added mr-8 to avoid overlap with Close button */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                        {fb.name ? fb.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div className={`font-bold text-lg ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{fb.name || 'Anonim'}</div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <div
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className={`font-bold text-sm px-2 py-1 rounded uppercase cursor-pointer hover:opacity-80 transition-opacity select-none flex items-center gap-1 ${fb.category === 'bug' || fb.category === 'typo' ? (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800') : fb.category === 'suggestion' ? (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800') : (darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800')}`}
                                    >
                                        {fb.category === 'bug' || fb.category === 'typo' ? 'HATA' : fb.category === 'suggestion' ? 'ÖNERİ' : 'YORUM'}
                                        <span className="text-[10px]">▼</span>
                                    </div>

                                    {/* Category Switcher Dropdown - Click based */}
                                    {isDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div> {/* Overlay to close */}
                                            <div className={`absolute top-full right-0 mt-1 rounded-lg border shadow-xl overflow-hidden z-50 min-w-[120px] ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-white border-gray-200'}`}>
                                                <button onClick={() => { updateCategory(fb.id, 'general'); onClose(); }} className={`block w-full text-left px-3 py-2 text-sm font-bold hover:bg-gray-100 text-blue-600 ${darkMode ? 'hover:bg-gray-700' : ''}`}>
                                                    YORUM
                                                </button>
                                                <button onClick={() => { updateCategory(fb.id, 'suggestion'); onClose(); }} className={`block w-full text-left px-3 py-2 text-sm font-bold hover:bg-gray-100 text-green-600 ${darkMode ? 'hover:bg-gray-700' : ''}`}>
                                                    ÖNERİ
                                                </button>
                                                <button onClick={() => { updateCategory(fb.id, 'bug'); onClose(); }} className={`block w-full text-left px-3 py-2 text-sm font-bold hover:bg-gray-100 text-red-600 ${darkMode ? 'hover:bg-gray-700' : ''}`}>
                                                    HATA
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Action Buttons in Modal Header */}
                                <div className="flex items-center gap-1 pl-2 border-l border-dashed border-gray-300 dark:border-gray-700">
                                    {fb.status !== 'approved' && fb.status !== 'archived' && (
                                        <>
                                            <ActionButton onClick={() => { onMarkRead(fb.id); onClose(); }} icon="👁️" color="gray" title="İncele/Okundu" darkMode={darkMode} />
                                            {!(fb.category === 'bug' || fb.category === 'typo') && <ActionButton onClick={() => { onApprove(fb.id); onClose(); }} icon="✅" color="green" title="Yayınla" darkMode={darkMode} />}
                                            <ActionButton onClick={() => { onArchive(fb.id); onClose(); }} icon="🗑" color="red" title="Arşivle" darkMode={darkMode} />
                                        </>
                                    )}
                                    {fb.status === 'approved' && (
                                        <>
                                            <ActionButton onClick={() => setShowReplyInput(!showReplyInput)} icon="💬" color={fb.reply ? "green" : "amber"} title="Yanıtla" darkMode={darkMode} />
                                            <ActionButton onClick={() => { onArchive(fb.id); onClose(); }} icon="🚫" color="red" title="Yayından Kaldır" darkMode={darkMode} />
                                        </>
                                    )}
                                    {fb.status === 'archived' && (
                                        <>
                                            <ActionButton onClick={() => { onMarkRead(fb.id); onClose(); }} icon="↩️" color="blue" title="Geri Al" darkMode={darkMode} />
                                            <ActionButton onClick={() => { onDelete(fb.id); onClose(); }} icon="🗑" color="red" title="Tamamen Sil" darkMode={darkMode} />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {formatDate(fb.date)}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className={`text-sm font-mono opacity-80 border-b pb-2 ${fb.category === 'bug' || fb.category === 'typo' ? 'text-red-500' : fb.category === 'suggestion' ? 'text-green-600' : 'text-blue-500'} ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>Konum: {fb.page}</div>

                    {fb.selectedText && (
                        <div className={`my-4 pl-4 py-3 border-l-4 rounded-r-lg italic font-serif text-lg ${darkMode ? 'border-amber-600 bg-amber-900/20 text-gray-300' : 'border-amber-400 bg-amber-50 text-gray-700'}`}>
                            "{fb.selectedText}"
                        </div>
                    )}

                    <div className={`p-4 rounded-xl text-lg leading-relaxed whitespace-pre-wrap ${darkMode ? 'bg-[#25262b] text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
                        {fb.feedback}
                    </div>

                    {fb.reply && (
                        <div className={`p-4 rounded-xl border-l-4 ${darkMode ? 'bg-amber-900/10 border-amber-600' : 'bg-amber-50 border-amber-400'}`}>
                            <div className="font-bold text-amber-600 text-sm mb-1">EDİTÖR YANITI:</div>
                            <div>{fb.reply}</div>
                        </div>
                    )}

                    {showReplyInput && (
                        <div className="mt-4 animate-fade-in">
                            <textarea
                                className={`w-full p-3 rounded-xl text-base border focus:ring-2 focus:ring-amber-500 outline-none ${darkMode ? 'bg-[#25262b] border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300'}`}
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

const TabButton = ({ active, onClick, children, count, color, darkMode }) => {
    let activeClass = '';
    if (active) {
        if (color === 'red') activeClass = 'border-red-500 text-red-600';
        else if (color === 'amber') activeClass = 'border-amber-500 text-amber-600';
        else if (color === 'green') activeClass = 'border-green-500 text-green-600';
        else if (color === 'purple') activeClass = 'border-purple-500 text-purple-600';
        else activeClass = 'border-gray-500 text-gray-600';
    } else {
        activeClass = `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`;
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

const FeedbackCard = ({ fb, onClick, actions, darkMode, formatDate }) => {
    const { onMarkRead, onApprove, onArchive, onDelete, onReply, updateCategory } = actions;
    // Determine category label and color
    const isBug = fb.category === 'bug' || fb.category === 'typo';
    const isSuggestion = fb.category === 'suggestion';
    const catLabel = isBug ? '[HATA]' : isSuggestion ? '[ÖNERİ]' : '[YORUM]';
    const catClass = isBug ? 'text-red-500' : isSuggestion ? 'text-green-600' : 'text-blue-500';
    const bgHover = darkMode ? 'hover:bg-[#2c2e33]' : 'hover:shadow-md';

    return (
        <div onClick={onClick} className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-white border-gray-200'} ${bgHover}`}>

            {/* 1. User Info Section */}
            <div className="flex items-center gap-3 shrink-0 w-64">
                <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-bold ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                    {fb.name ? fb.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="min-w-0 flex-1">
                    <div className={`font-bold text-base truncate ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {fb.name || 'Anonim'}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className={`font-mono font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {formatDate(fb.date)}
                        </span>
                        <span className={`font-bold ${catClass}`}>
                            {catLabel}
                        </span>
                    </div>
                </div>
            </div>

            {/* Vertical Divider */}
            <div className={`w-px h-12 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>

            {/* 2. Content Section */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                {/* Top Line: Location & Snippet */}
                <div className={`text-xs font-bold truncate ${catClass}`}>
                    {fb.page ? `Konum: ${fb.page}` : 'Genel'}
                    {fb.selectedText && <span className="font-medium opacity-80"> • "{fb.selectedText.substring(0, 50)}..."</span>}
                </div>

                {/* Bottom Line: User Message */}
                <div className={`text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {fb.feedback}
                </div>
            </div>

            {/* Vertical Divider */}
            <div className={`w-px h-12 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>

            {/* 3. Actions Section (Moved to Right) */}
            <div className="flex items-center gap-1 shrink-0 pl-2" onClick={e => e.stopPropagation()}>
                {/* Logic: Show relevant buttons based on status */}

                {/* Actions for active/unread/pending items */}
                {fb.status !== 'approved' && fb.status !== 'archived' && (
                    <>
                        <ActionButton onClick={() => onMarkRead(fb.id)} icon="👁️" color="gray" title="İncele/Okundu" darkMode={darkMode} />
                        {!isBug && <ActionButton onClick={() => onApprove(fb.id)} icon="✅" color="green" title="Yayınla" darkMode={darkMode} />}
                        <ActionButton onClick={() => onArchive(fb.id)} icon="🗑" color="red" title="Arşivle" darkMode={darkMode} />
                    </>
                )}

                {/* Actions for Approved items */}
                {fb.status === 'approved' && (
                    <>
                        <ActionButton onClick={() => onReply(fb)} icon="💬" color={fb.reply ? "green" : "amber"} title="Yanıtla" darkMode={darkMode} />
                        <ActionButton onClick={() => onArchive(fb.id)} icon="🚫" color="red" title="Yayından Kaldır" darkMode={darkMode} />
                    </>
                )}

                {/* Actions for Archived items */}
                {fb.status === 'archived' && (
                    <>
                        <ActionButton onClick={() => onMarkRead(fb.id)} icon="↩️" color="blue" title="Geri Al" darkMode={darkMode} />
                        <ActionButton onClick={() => onDelete(fb.id)} icon="🗑" color="red" title="Tamamen Sil" darkMode={darkMode} />
                    </>
                )}
            </div>
        </div>
    );
};

const ActionButton = ({ onClick, icon, color, title, darkMode }) => {
    const colorClasses = {
        gray: darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
        green: darkMode ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-green-100 text-green-700 hover:bg-green-200',
        red: darkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100',
        amber: darkMode ? 'bg-amber-900/30 text-amber-400 hover:bg-amber-900/50' : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
        blue: darkMode ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
    };
    return (
        <button onClick={onClick} className={`p-2 rounded-lg text-xs font-bold transition-colors ${colorClasses[color]}`} title={title}>
            {icon}
        </button>
    );
};

export default MessageManager;
