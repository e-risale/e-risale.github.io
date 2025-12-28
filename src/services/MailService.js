import { CONFIG } from '../config';
import emailjs from '@emailjs/browser';
// import { getPublicationStatus, savePublicationStatus } from './DataService'; // Unused


// SIMULATED EMAIL SERVICE
// In a real app, this would use EmailJS, SendGrid API, or a Firebase Function.
// Since we are client-side only (mostly), we'll implement the LOGIC here but print to console/toast.
// User can replace 'sendEmailToProvider' with actual EmailJS call.

export const checkAndSendAdminNotification = async (newMsgCategory, allMessages, force = false) => {
    const { recipients, dailyLimit } = CONFIG.ADMIN_EMAIL_CONFIG;
    if (!recipients || recipients.length === 0) return;

    // 1. Get Current Status (Last Sent Time, Sent Count Today)
    let status = await getMailStatus();

    // Reset daily count if new day
    const now = new Date();
    const lastDate = status.lastSentDate ? new Date(status.lastSentDate) : null;

    if (!lastDate || lastDate.getDate() !== now.getDate() || lastDate.getMonth() !== now.getMonth()) {
        status.dailySentCount = 0;
        status.pendingCounts = {};
    }

    // 2. Aggregate Pending Counts
    if (!status.pendingCounts) status.pendingCounts = {};
    if (!status.pendingCounts[newMsgCategory]) status.pendingCounts[newMsgCategory] = 0;
    status.pendingCounts[newMsgCategory]++;

    // 3. Check Rules
    // Rule: Don't exceed daily limit
    if (status.dailySentCount >= dailyLimit) {
        console.log("Creation of mail skipped: Daily limit reached.");
        await saveMailStatus(status);
        return;
    }

    // Rule: Min Interval (e.g. dont send 2 mails in 1 minute). 
    // Let's say we pool messages for at least X minutes or until specific triggers.
    // The user requirement: "her yeni bildirime mail gelmemeli".
    // Strategy: Only send if it's been > 4 hours OR if pending count > threshold?
    // User proposed: "Mail içinde önceki mailden o ana kadar gelen maillerin kategorilerine göre sayılarını belirtmesi yeterli."
    // Let's implement a 'Buffer Time' strategy. 
    // If we haven't sent a mail in [Interval] hours, and we have pending messages, Send.

    const intervalMs = (CONFIG.ADMIN_EMAIL_CONFIG.minIntervalHours || 4) * 60 * 60 * 1000;
    const timeSinceLast = lastDate ? (now.getTime() - lastDate.getTime()) : Infinity;

    const shouldSendImmediately = force || CONFIG.EMAILJS_CONFIG.immediateMode;

    if (timeSinceLast < intervalMs && !shouldSendImmediately) {
        // Too soon, just save the updated pending count
        console.log(`Mail buffered. Time since last: ${(timeSinceLast / 60000).toFixed(1)} mins. Needed: ${(intervalMs / 60000)} mins.`);
        await saveMailStatus(status);
        return;
    }

    // 4. Send Email
    const success = await sendEmailToProvider({
        to: recipients,
        subject: `Yeni Gelen Bildirimler (${Object.values(status.pendingCounts).reduce((a, b) => a + b, 0)})`,
        body: generateEmailBody(status.pendingCounts)
    });

    if (success) {
        status.dailySentCount++;
        status.lastSentDate = now.toISOString();
        status.pendingCounts = {}; // Reset pending
        await saveMailStatus(status);
        console.log("Admin notification email sent.");
    }
};

const getMailStatus = async () => {
    // Re-using DataService logic conceptually but maybe minimal implementation here
    // In real app, import { db } from '../firebase' ...
    if (window.api && window.api.isElectron) {
        const result = await window.api.readFile({ filename: 'mail_status.json' });
        return result.success ? JSON.parse(result.content) : { dailySentCount: 0, pendingCounts: {} };
    } else {
        const local = localStorage.getItem('risale_mail_status');
        return local ? JSON.parse(local) : { dailySentCount: 0, pendingCounts: {} };
    }
};

const saveMailStatus = async (status) => {
    if (window.api && window.api.isElectron) {
        await window.api.saveFile({ filename: 'mail_status.json', content: JSON.stringify(status, null, 2) });
    } else {
        localStorage.setItem('risale_mail_status', JSON.stringify(status));
    }
};

const generateEmailBody = (counts) => {

    // Kategori isimlerinin Türkçe karşılıkları
    const CATEGORY_LABELS = {
        bug: "Hata Bildirimi",
        typo: "Yazım Yanlışı",
        suggestion: "Öneri",
        report: "Şikayet/Rapor",
        inappropriate: "Uygunsuz İçerik",
        general: "Genel Yorum"
    };

    let text = "";
    for (const [cat, count] of Object.entries(counts)) {
        const label = CATEGORY_LABELS[cat] || cat; // Varsa Türkçe karşılığı, yoksa orjinal key
        text += `- ${label}: ${count} adet\n`;
    }
    text += "\nPanelden detayları görebilirsiniz.";
    return text;
};

// --- REAL SENDING LOGIC ---
// import emailjs from '@emailjs/browser'; // Moved to top

const sendEmailToProvider = async ({ to, subject, body }) => {
    // INTEGRATION POINT: EmailJS
    console.group("📨 SENDING REAL EMAIL...");

    // EmailJS usually takes template params. 
    // We need to map our 'subject' and 'body' to the variable names in your EmailJS template.
    // Assuming your template uses {{subject}} and {{message}}

    // Note: 'to' field handling relies on what your Template expects. 
    // Usually EmailJS sends to the configured 'To Email' in dashboard, 
    // OR you can pass a 'to_email' variable if your template has it.
    // For now, we will send the aggregated report to the fixed recipient in Config.

    const templateParams = {
        to_email: to.join(','),
        subject: subject,
        message: body
    };

    try {
        const response = await emailjs.send(
            CONFIG.EMAILJS_CONFIG.SERVICE_ID,
            CONFIG.EMAILJS_CONFIG.TEMPLATE_ID,
            templateParams,
            CONFIG.EMAILJS_CONFIG.PUBLIC_KEY
        );
        console.log('SUCCESS!', response.status, response.text);
        console.groupEnd();
        return true;
    } catch (error) {
        console.error('FAILED...', error);
        console.groupEnd();
        return false;
    }
};
