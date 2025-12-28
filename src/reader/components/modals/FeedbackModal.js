import React, { useRef, useEffect, useState } from 'react';
// import { CATEGORY_LABELS } from '../../utils/readerUtils'; // Unused

const FeedbackModal = ({
    isOpen,
    onClose,
    selectedText,
    category,
    onCategoryChange,
    text,
    onTextChange,
    onSend,
    isSending,
    darkMode,
    user,
    onLogin,
    isAdmin
}) => {
    const textareaRef = useRef(null);
    const [postAsEditor, setPostAsEditor] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);

    // Auto-focus and scroll into view when modal opens
    useEffect(() => {
        if (isOpen) {
            setPostAsEditor(false);
            setIsPrivate(false);
            if (user && textareaRef.current) {
                // Slight delay to allow modal render and keyboard animation
                setTimeout(() => {
                    textareaRef.current.focus();

                    // On mobile, scroll the viewport to ensure the modal is at the top
                    if (window.innerWidth < 768) {
                        // 'start' tries to put the element at the top of the viewport
                        textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 400);
            }
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center md:items-center items-start justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto pb-64"
            onClick={onClose}
        >
            <div
                className={`w-full max-w-lg rounded-2xl shadow-2xl p-6 relative mt-16 md:mt-0 ${darkMode ? 'bg-[#1a1b1e] text-gray-200' : 'bg-white text-gray-800'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">{selectedText ? '💬 Seçili Metni Bildir' : '✍️ Geri Bildirim Gönder'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-xl">✕</button>
                </div>

                {!user ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-4 animate-in fade-in">
                        <div className="p-4 bg-amber-100 rounded-full text-4xl">🔒</div>
                        <p className="text-center opacity-80 max-w-xs">Geri bildirimde bulunmak için lütfen giriş yapın.</p>
                        <button onClick={onLogin} className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2">
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                            Google ile Giriş Yap
                        </button>
                    </div>
                ) : (
                    <>
                        {selectedText && (
                            <div className={`p-3 rounded-lg mb-4 text-sm italic border-l-4 max-h-32 overflow-y-auto ${darkMode ? 'bg-gray-800 border-amber-500 text-gray-300' : 'bg-amber-50 border-amber-400 text-gray-600'}`}>"{selectedText}"</div>
                        )}

                        <div className="relative">
                            <textarea
                                ref={textareaRef}
                                value={text}
                                onChange={(e) => onTextChange(e.target.value)}
                                maxLength={500}
                                placeholder={selectedText ? "Bu kısımla ilgili öneriniz veya tespitiniz nedir?" : "Detayları yazın..."}
                                className={`w-full p-4 rounded-xl min-h-[150px] outline-none border resize-y mb-2 ${darkMode ? 'bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-500' : 'bg-[#fffcf5] border-[#e6e0d2] text-[#5c4033] placeholder-gray-400'}`}
                            ></textarea>
                            <div className={`absolute bottom-4 right-3 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {text.length} / 500
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 items-center mt-2 flex-wrap">
                            {isAdmin && (
                                <label className="flex items-center gap-2 mr-4 cursor-pointer select-none group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${postAsEditor ? 'bg-amber-600 border-amber-600' : (darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50')}`}>
                                        {postAsEditor && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={postAsEditor}
                                        onChange={(e) => { setPostAsEditor(e.target.checked); if (e.target.checked) setIsPrivate(false); }}
                                        className="hidden"
                                    />
                                    <span className={`text-xs font-bold transition-colors ${postAsEditor ? 'text-amber-600' : (darkMode ? 'text-gray-400 group-hover:text-amber-400' : 'text-gray-500 group-hover:text-amber-700')}`}>
                                        Editör Modu
                                    </span>
                                </label>
                            )}

                            {!postAsEditor && (
                                <label className="flex items-center gap-2 mr-auto cursor-pointer select-none group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isPrivate ? 'bg-indigo-600 border-indigo-600' : (darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50')}`}>
                                        {isPrivate && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={isPrivate}
                                        onChange={(e) => setIsPrivate(e.target.checked)}
                                        className="hidden"
                                    />
                                    <span className={`text-xs font-bold transition-colors ${isPrivate ? 'text-indigo-600' : (darkMode ? 'text-gray-400 group-hover:text-indigo-400' : 'text-gray-500 group-hover:text-indigo-700')}`}>
                                        🔒 Gizli (Yayınlanmasın)
                                    </span>
                                </label>
                            )}

                            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold opacity-60 hover:opacity-100">İptal</button>
                            <button
                                onClick={() => onSend(category, text, null, null, null, selectedText, null, postAsEditor, isPrivate)}
                                disabled={isSending || !text.trim()}
                                className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md ${darkMode ? 'bg-amber-700 hover:bg-amber-600' : 'bg-[#2c2e33] hover:bg-black'}`}
                            >
                                {isSending ? '...' : 'Gönder'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FeedbackModal;
