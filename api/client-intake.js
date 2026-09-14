// Nhận thông tin onboarding khách mới từ onboarding.html, báo qua Telegram.
// Dùng lại TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID đã cấu hình sẵn.

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
  const clean = (v, max) => (v || '').toString().slice(0, max || 200).trim();

  const shopName = clean(body.shopName, 100);
  const shopIndustry = clean(body.shopIndustry, 150);
  const bankName = clean(body.bankName, 100);
  const bankAccount = clean(body.bankAccount, 50);
  const contactPhone = clean(body.contactPhone, 30);

  if (!shopName || !shopIndustry || !bankName || !bankAccount || !contactPhone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (contactPhone.replace(/\D/g, '').length < 9) {
    return res.status(400).json({ error: 'Invalid phone' });
  }

  const shopLinks = clean(body.shopLinks, 300) || 'Không có';
  const shopBrand = clean(body.shopBrand, 200) || 'Chưa có, sẽ trao đổi qua Zalo';
  const bankAccountName = clean(body.bankAccountName, 100) || 'Chưa ghi';
  const contactEmail = clean(body.contactEmail, 100) || 'Không có';
  const notes = clean(body.notes, 500) || 'Không có';
  const bizCost = clean(body.bizCost, 20) || '?';
  const bizPrice = clean(body.bizPrice, 20) || '?';
  const bizOrders = clean(body.bizOrders, 20) || '?';

  const time = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  const message =
    `📋 <b>ONBOARDING KHÁCH MỚI</b>\n\n` +
    `<b>Shop:</b> ${shopName}\n` +
    `<b>Ngành hàng:</b> ${shopIndustry}\n` +
    `<b>Link shop:</b> ${shopLinks}\n` +
    `<b>Logo/màu:</b> ${shopBrand}\n\n` +
    `<b>Số liệu:</b> giá vốn ${bizCost}đ / giá bán ${bizPrice}đ / ${bizOrders} đơn/tháng\n\n` +
    `<b>Nhận tiền:</b> ${bankName} — STK ${bankAccount} (${bankAccountName})\n\n` +
    `<b>Liên hệ:</b> ${contactPhone} / ${contactEmail}\n` +
    `<b>Ghi chú:</b> ${notes}\n\n` +
    `⏰ ${time}\n` +
    `👉 Bắt đầu dựng bản nháp landing page cho khách này.`;

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
