import React from 'react';

const MobileTooltip = ({ data, onClose, darkMode }) => {
    if (!data) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[70] p-4 animate-in slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
            <div className={`w-full max-w-lg mx-auto p-4 rounded-2xl shadow-2xl border flex flex-col gap-2 relative ${darkMode ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-amber-200 text-gray-900'}`}>
                <div className="flex justify-between items-start">
                    <h4 className="font-bold text-lg text-amber-600">{data.title}</h4>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-500/10 -mt-1 -mr-1">
                        <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                {data.detail && (
                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{data.detail}</p>
                )}
            </div>
        </div>
    );
};

export default MobileTooltip;
