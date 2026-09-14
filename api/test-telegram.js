// Mở URL này trên trình duyệt để gửi thử 1 tin nhắn Telegram, không cần dùng lệnh gì cả.
// Ví dụ: https://loi-ra-landing.vercel.app/api/test-telegram

module.exports = async (req, res) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return res
      .status(500)
      .send('Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trong Environment Variables trên Vercel. Vào Project Settings > Environment Variables để thêm, rồi redeploy.');
  }

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '✅ Test thành công! Bot Telegram của Lối Ra đã sẵn sàng báo đơn.',
        parse_mode: 'HTML',
      }),
    });
    const tgData = await tgRes.json();
    if (!tgData.ok) {
      return res.status(502).send('Gửi thất bại: ' + JSON.stringify(tgData));
    }
    return res.status(200).send('Đã gửi tin nhắn test — mở Telegram kiểm tra ngay!');
  } catch (err) {
    return res.status(500).send('Lỗi: ' + err.message);
  }
};
