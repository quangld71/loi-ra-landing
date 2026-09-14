// Nhận webhook thanh toán từ SePay, báo ngay qua Telegram.
// Yêu cầu 2 Environment Variables trên Vercel: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
// (tùy chọn) WEBHOOK_SECRET để kiểm tra nguồn gọi webhook là SePay thật.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
  if (WEBHOOK_SECRET) {
    const provided = req.headers['x-webhook-secret'] || req.headers['authorization'] || '';
    if (!provided.includes(WEBHOOK_SECRET)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const body = req.body || {};
  const amount = Number(body.transferAmount || body.amount || 0);
  const content = body.content || body.description || '';
  const bankName = body.bankBrandName || body.gateway || 'Ngân hàng';
  const refCode = body.referenceCode || body.id || '';
  const transferType = body.transferType || 'in';

  if (transferType !== 'in' || amount <= 0) {
    return res.status(200).json({ status: 'ignored' });
  }

  const time = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const matchedDeposit = content.toUpperCase().includes('COCLOIRA');

  const message =
    `💰 <b>CÓ TIỀN VÀO — LỐI RA</b>\n\n` +
    `Số tiền: <b>${amount.toLocaleString('vi-VN')}đ</b>\n` +
    `Nội dung CK: <code>${content}</code>\n` +
    `Ngân hàng: ${bankName}\n` +
    `Mã GD: <code>${refCode}</code>\n` +
    `Thời gian: ${time}\n\n` +
    (matchedDeposit
      ? `✅ Khớp nội dung cọc pilot (COCLOIRA) — nhắn xác nhận giữ suất cho khách ngay.`
      : `⚠️ Không thấy "COCLOIRA" trong nội dung — kiểm tra kỹ trước khi xác nhận giữ suất.`);

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trong Environment Variables');
    return res.status(500).json({ error: 'Notification not configured' });
  }

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    });
    const tgData = await tgRes.json();
    if (!tgData.ok) {
      console.error('Telegram API error:', tgData);
      return res.status(502).json({ error: 'Telegram send failed', detail: tgData });
    }
  } catch (err) {
    console.error('Telegram send error:', err);
    return res.status(502).json({ error: 'Telegram send failed' });
  }

  return res.status(200).json({ status: 'sent' });
};
