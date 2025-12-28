import React, { useState, useRef } from 'react';
import { formatLastUpdated } from '../utils/readerUtils';
import ReportModal from './modals/ReportModal';

const ReaderComments = ({
    lastUpdate,
    chapterComments,
    darkMode,
    user,
    onLogin,
    onSendFeedback,
    feedbackText,
    setFeedbackText,
    feedbackCategory,
    setFeedbackCategory,
    isSendingFeedback,
    onLikeComment,
    onNextChapter,
    isAdmin // Passed from parent
}) => {
    const [replyToCommentId, setReplyToCommentId] = useState(null); // ID of the comment being replied to
    const [replyText, setReplyText] = useState("");
    const [postAsEditor, setPostAsEditor] = useState(false); // Admin toggle
    const [expandedThreads, setExpandedThreads] = useState({});

    // Report Logic
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportingCommentId, setReportingCommentId] = useState(null);

    const handleReportClick = (commentId) => {
        setReportingCommentId(commentId);
        setIsReportModalOpen(true);
    };

    const handleReportSubmit = (reason) => {
        if (reportingCommentId) {
            onSendFeedback('report', reason, null, null, null, null, reportingCommentId, false);
        }
        setIsReportModalOpen(false);
        setReportingCommentId(null);
    };

    // Derived state for main form vs inline reply
    // If replyToCommentId is set, standard form is clean (or independent). 
    // We'll keep main form independent.

    return (
        <div className="reader-comments-section max-w-4xl w-full mx-auto px-4 md:px-8 mt-12 flex flex-col gap-8 pb-40">
            {lastUpdate && (
                <div className={`text-xs font-mono opacity-50 pl-2 border-l-2 ${darkMode ? 'border-gray-700 text-gray-500' : 'border-amber-200 text-[#8c7b70]'}`}>
                    {formatLastUpdated(lastUpdate)}
                </div>
            )}

            <div className="py-2 flex justify-center w-full">
                <button onClick={onNextChapter} className={`w-full py-4 rounded-xl font-bold shadow-sm border transition-transform hover:-translate-y-1 active:scale-95 text-lg flex items-center justify-center gap-3 ${darkMode ? 'bg-rose-900/20 text-rose-200 border-rose-800' : 'bg-rose-50 text-rose-900 border-rose-100 hover:shadow-md'}`}>
                    Sonraki Bölüme Geç &rarr;
                </button>
            </div>

            {/* COMMENT & FEEDBACK SECTION (Main Form) */}
            <div className={`w-full rounded-2xl border p-6 shadow-sm transition-all ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-white border-[#e6e0d2]'}`}>
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">✍️</span>
                    <h3 className={`font-bold ${darkMode ? 'text-gray-200' : 'text-[#5c4033]'}`}>Katkıda Bulun</h3>
                </div>

                {user ? (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="flex gap-4 mb-2">
                            <button onClick={() => { setFeedbackCategory('general'); setFeedbackText(""); }} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all border ${feedbackCategory === 'general' ? (darkMode ? 'bg-amber-900/30 text-amber-300 border-amber-500' : 'bg-amber-50 text-amber-800 border-amber-400 shadow-sm') : (darkMode ? 'bg-gray-800 text-gray-500 border-gray-700' : 'bg-white text-gray-400 border-gray-200')}`}>Genel Görüş / Yorumunuz</button>
                            <button onClick={() => { setFeedbackCategory('bug'); setFeedbackText(""); }} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all border ${feedbackCategory === 'bug' ? (darkMode ? 'bg-amber-900/30 text-amber-300 border-amber-500' : 'bg-amber-50 text-amber-800 border-amber-400 shadow-sm') : (darkMode ? 'bg-gray-800 text-gray-500 border-gray-700' : 'bg-white text-gray-400 border-gray-200')}`}>Teknik Sorun</button>
                        </div>
                        <textarea
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            maxLength={feedbackCategory === 'general' ? 1000 : 500}
                            placeholder={feedbackCategory === 'general' ? "Düşüncelerinizi paylaşın..." : "Karşılaştığınız teknik sorunu detaylandırın..."}
                            className={`w-full p-4 rounded-xl min-h-[120px] outline-none border resize-y ${darkMode ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-[#fffcf5] border-[#e6e0d2] text-[#5c4033]'}`}
                        ></textarea>

                        <div className={`text-xs text-right opacity-60 italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Lütfen saygılı ve nezih bir dil kullanalım.</div>

                        <div className="flex justify-between items-center">
                            {/* Admin Option */}
                            {isAdmin ? (
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={postAsEditor}
                                        onChange={(e) => setPostAsEditor(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <span className={`text-sm font-bold ${darkMode ? 'text-amber-400' : 'text-amber-800'}`}>Editör Olarak Paylaş</span>
                                </label>
                            ) : <div></div>}

                            <button
                                onClick={() => {
                                    onSendFeedback(feedbackCategory, feedbackText, null, null, null, null, null, postAsEditor);
                                }}
                                disabled={isSendingFeedback || !feedbackText.trim()}
                                className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md transition-all ${isSendingFeedback || !feedbackText.trim() ? 'opacity-50 cursor-not-allowed bg-gray-400' : (darkMode ? 'bg-amber-700 hover:bg-amber-600' : 'bg-[#5c4033] hover:bg-[#4a332a]')}`}
                            >
                                {isSendingFeedback ? 'Gönderiliyor...' : 'Gönder'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={`p-8 rounded-xl border border-dashed flex flex-col items-center text-center gap-3 ${darkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-[#fffcf5] border-[#e6e0d2]'}`}>
                        <p className={`text-sm max-w-md ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Geri bildirimde bulunmak için lütfen Google hesabınızla oturum açın.</p>
                        <button onClick={onLogin} className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-bold text-sm shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2">Google ile Giriş Yap</button>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-6">
                <h3 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-[#5c4033]'}`}><span>💬</span> Yorumlar <span className="text-sm opacity-50 font-normal">({chapterComments ? chapterComments.length : 0})</span></h3>
                {chapterComments && chapterComments.length > 0 ? (
                    <div className="space-y-4">
                        {chapterComments.filter(c => !c.parentId).map((comment) => {
                            const isLiked = user && comment.likes && comment.likes.includes(user.uid);
                            const replies = chapterComments.filter(c => c.parentId === comment.id).sort((a, b) => (b.date?.toMillis ? b.date.toMillis() : 0) - (a.date?.toMillis ? a.date.toMillis() : 0));
                            const isExpanded = expandedThreads[comment.id];
                            const displayedReplies = isExpanded ? replies : replies.slice(0, 2);

                            return (
                                <div key={comment.id} className={`p-5 rounded-2xl border transition-all ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-white border-[#e6e0d2]'}`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-amber-100 text-amber-600'}`}>
                                            {comment.photo ? (
                                                <img src={comment.photo} alt={comment.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-lg font-bold">{comment.name ? comment.name.charAt(0).toUpperCase() : '👤'}</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className={`font-bold text-sm flex items-center gap-1 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                                {comment.name || 'Misafir'}
                                                {(comment.name && (comment.name === 'Editör Mesajı' || comment.name.includes('Editör'))) && <span className="text-blue-500 text-xs" title="Resmi Hesap">🛡️</span>}
                                            </div>
                                            <div className={`text-[10px] opacity-50 font-mono flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {comment.date?.toDate ? comment.date.toDate().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                                {isAdmin && <span title="Yönetici Yetkisi Var">🛡️</span>}
                                            </div>
                                        </div>
                                    </div>
                                    {comment.selectedText && <div className={`mb-3 pl-3 py-2 text-sm italic border-l-4 rounded-r-lg ${darkMode ? 'border-amber-700 bg-amber-900/10 text-gray-400' : 'border-amber-300 bg-amber-50 text-gray-600'}`}>"{comment.selectedText}"</div>}
                                    <div className={`text-base leading-relaxed whitespace-pre-wrap mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                                        {comment.feedback.split(/(\n\n\(Editör tarafından düzeltilmiştir.*?\))/).map((part, i) =>
                                            part.includes('(Editör tarafından düzeltilmiştir') ?
                                                <span key={i} className="block mt-1 text-[11px] italic opacity-60 font-serif">{part.trim()}</span> :
                                                <span key={i}>{part}</span>
                                        )}
                                    </div>

                                    {/* EDITOR REPLY (LEGACY FIELD) */}
                                    {comment.reply && (
                                        <div className={`mb-4 p-4 rounded-xl border-l-4 shadow-sm ${darkMode ? 'bg-indigo-900/20 border-indigo-500' : 'bg-gradient-to-r from-amber-50 to-white border-amber-500'}`}>
                                            <div className={`font-bold text-xs mb-1 flex items-center gap-1 ${darkMode ? 'text-indigo-400' : 'text-amber-700'}`}>
                                                <span>🛡️</span> EDİTÖR YANITI
                                            </div>
                                            <div className={`text-sm italic ${darkMode ? 'text-indigo-200' : 'text-gray-800'}`}>{comment.reply}</div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between border-t border-dashed border-gray-500/20 pt-3">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    if (replyToCommentId === comment.id) {
                                                        setReplyToCommentId(null);
                                                    } else {
                                                        setReplyToCommentId(comment.id);
                                                        setReplyText("");
                                                    }
                                                }}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all border ${replyToCommentId === comment.id ? (darkMode ? 'bg-green-900/30 text-green-400 border-green-500' : 'bg-green-50 text-green-600 border-green-200') : (darkMode ? 'border-gray-700 hover:border-green-500 text-gray-400 hover:text-green-400' : 'border-gray-200 hover:border-green-400 text-gray-500 hover:text-green-600')}`}
                                            >
                                                <span>💬</span> {replyToCommentId === comment.id ? 'İptal' : 'Yanıtla'}
                                            </button>

                                            {/* Report Button - Hidden for Editor Comments */}
                                            {!(comment.name && (comment.name === 'Editör Mesajı' || comment.name.includes('Editör'))) && (
                                                <button
                                                    onClick={() => handleReportClick(comment.id)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all border ${darkMode ? 'border-gray-700 hover:border-orange-500 text-gray-400 hover:text-orange-400' : 'border-gray-200 hover:border-orange-400 text-gray-500 hover:text-orange-600'}`}
                                                    title="Uygunsuz İçerik Bildir"
                                                >
                                                    <span>⚠️</span> Bildir
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button onClick={() => onLikeComment(comment.id, comment.likes)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all border ${isLiked ? (darkMode ? 'bg-red-900/30 text-red-400 border-red-500' : 'bg-red-50 text-red-600 border-red-200') : (darkMode ? 'border-gray-700 hover:border-red-500 text-gray-400 hover:text-red-400' : 'border-gray-200 hover:border-red-400 text-gray-500 hover:text-red-600')}`}><span>{isLiked ? '❤️' : '🤍'}</span> {comment.likes ? comment.likes.length : 0}</button>
                                        </div>
                                    </div>

                                    {/* INLINE REPLY FORM */}
                                    {replyToCommentId === comment.id && (
                                        <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex gap-2">
                                                <textarea
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    placeholder={`@${comment.name} kişisine yanıt yazın...`}
                                                    autoFocus
                                                    className={`flex-1 p-3 rounded-xl min-h-[80px] text-sm outline-none border resize-y ${darkMode ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                                                ></textarea>
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                {isAdmin ? (
                                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={postAsEditor}
                                                            onChange={(e) => setPostAsEditor(e.target.checked)}
                                                            className="w-3 h-3 rounded border-gray-300 text-amber-600"
                                                        />
                                                        <span className={`text-xs font-bold ${darkMode ? 'text-amber-400' : 'text-amber-800'}`}>Editör Olarak</span>
                                                    </label>
                                                ) : <div></div>}
                                                <button
                                                    onClick={() => {
                                                        onSendFeedback('general', replyText, null, null, null, null, comment.id, postAsEditor);
                                                        setReplyToCommentId(null);
                                                        setReplyText("");
                                                    }}
                                                    disabled={!replyText.trim()}
                                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition-all ${!replyText.trim() ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'bg-amber-600 hover:bg-amber-700'}`}
                                                >
                                                    Yanıtla
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* REPLIES SECTION */}
                                    {replies.length > 0 && (
                                        <div className={`mt-6 pt-2 pl-4 border-l-2 ${darkMode ? 'border-gray-700' : 'border-amber-200'}`}>
                                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3">YANITLAR</div>
                                            <div className="space-y-3">
                                                {displayedReplies.map(reply => {
                                                    const isEditorReply = reply.name && (reply.name === 'Editör' || reply.name.includes('Editör'));
                                                    return (
                                                        <div key={reply.id} className={`group p-3 rounded-xl border ${isEditorReply ? (darkMode ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-amber-50 border-amber-200 shadow-sm') : (darkMode ? 'bg-[#1a1b1e] border-gray-800' : 'bg-gray-50 border-gray-200')}`}>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center overflow-hidden shrink-0 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-amber-200 text-amber-700'}`}>
                                                                    {reply.photo ? (
                                                                        <img src={reply.photo} alt={reply.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span className="text-[10px] font-bold">{reply.name ? reply.name.charAt(0).toUpperCase() : '👤'}</span>
                                                                    )}
                                                                </div>
                                                                <span className={`font-bold text-xs ${isEditorReply ? (darkMode ? 'text-indigo-400' : 'text-amber-700') : (darkMode ? 'text-gray-300' : 'text-gray-900')}`}>
                                                                    {reply.name}
                                                                </span>
                                                                <span className="text-[10px] opacity-40 font-mono">
                                                                    {reply.date?.toDate ? reply.date.toDate().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                                                </span>

                                                                {!isEditorReply && (
                                                                    <button
                                                                        onClick={() => handleReportClick(reply.id)}
                                                                        className={`opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${darkMode ? 'border-gray-700 hover:border-orange-500 text-gray-500 hover:text-orange-400' : 'border-gray-200 hover:border-orange-400 text-gray-400 hover:text-orange-600'}`}
                                                                        title="Bildir"
                                                                    >
                                                                        <span>⚠️</span> Bildir
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-700'} ${isEditorReply ? 'italic' : ''} pl-8`}>
                                                                {reply.feedback.split(/(\n\n\(Editör tarafından düzeltilmiştir.*?\))/).map((part, i) =>
                                                                    part.includes('(Editör tarafından düzeltilmiştir') ?
                                                                        <span key={i} className="block mt-1 text-[11px] italic opacity-60 font-serif">{part.trim()}</span> :
                                                                        <span key={i}>{part}</span>
                                                                )}
                                                            </div>

                                                            {reply.reply && (
                                                                <div className={`mt-2 ml-8 p-3 rounded-lg border-l-4 text-xs ${darkMode ? 'bg-indigo-900/20 border-indigo-500' : 'bg-amber-50 border-amber-500'}`}>
                                                                    <div className={`font-bold mb-1 flex items-center gap-1 ${darkMode ? 'text-indigo-400' : 'text-amber-700'}`}>
                                                                        <span>🛡️</span> EDİTÖR YANITI
                                                                    </div>
                                                                    <div className={`${darkMode ? 'text-indigo-200' : 'text-gray-800'}`}>{reply.reply}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {replies.length > displayedReplies.length && (
                                                <button onClick={() => setExpandedThreads(p => ({ ...p, [comment.id]: true }))} className="mt-3 text-xs font-bold hover:underline opacity-60">
                                                    Tüm yanıtları gör ({replies.length})
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : <div className="text-center py-8 opacity-60"><p>Henüz yorum yok.</p></div>}
            </div>



            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onSubmit={handleReportSubmit}
                darkMode={darkMode}
            />
        </div>
    );
};

export default ReaderComments;
