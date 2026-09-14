// Nhận lead từ công cụ "Tự kiểm tra lợi nhuận" trên landing page, báo qua Telegram.
// Dùng lại TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID đã cấu hình cho /api/sepay-webhook.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    console.error('Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID');
    return res.status(500).json({ error: 'Notification not configured' });
  }

  const body = req.body || {};
  const phone = (body.phone || '').toString().slice(0, 30).trim();
  if (!phone || phone.replace(/\D/g, '').length < 9) {
    return res.status(400).json({ error: 'Missing or invalid phone' });
  }

  const name = (body.name || 'Chưa để tên').toString().slice(0, 100);
  const email = (body.email || 'Không có').toString().slice(0, 100);

  const fmt = (n) => Math.round(Number(n) || 0).toLocaleString('vi-VN') + 'đ';
  const pct = (n) => Number(n || 0).toFixed(1);
  const time = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  const message =
    `🧮 <b>LEAD MỚI — TỰ KIỂM TRA LỢI NHUẬN</b>\n\n` +
    `Tên: ${name}\n` +
    `SĐT/Zalo: <code>${phone}</code>\n` +
    `Email: ${email}\n\n` +
    `<b>Số liệu shop nhập:</b>\n` +
    `Giá vốn: ${fmt(body.cost)}\n` +
    `Giá bán: ${fmt(body.price)}\n` +
    `Số đơn/tháng: ${body.orders || 0}\n` +
    `Ads/tháng: ${fmt(body.ads)}\n` +
    `% phí sàn dùng để tính: ${body.feePct || 0}%\n\n` +
    `<b>Kết quả:</b>\n` +
    `Doanh thu/tháng: ${fmt(body.revenue)}\n` +
    `Phí sàn/tháng: ${fmt(body.feeAmount)}\n` +
    `Lợi nhuận thực: ${fmt(body.profit)} (${pct(body.profitPct)}%)\n\n` +
    `⏰ ${time}\n` +
    `👉 Liên hệ trong 24h.`;

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

  return res.status(200).json({ status: 'ok' });
};
