const { Telegraf } = require('telegraf');
const express = require('express');

const BOT_TOKEN = "8680895792:AAHyxjityQmGNymOOoQDUZNiEjP9EZX-zSU";
const GROQ_API_KEY = "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";
const GEMINI_API_KEY = "AIzaSyBULi0mbO9DGeBnrlewTrpj1dFfWI6q7xI";

const bot = new Telegraf(BOT_TOKEN);

// ====================== KEEP ALIVE ======================
const app = express();
app.get('/', (req, res) => res.send('Mahi Bot is ALIVE! 🔥😎'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Keep-alive running on port ${PORT}`));

// ====================== DATA ======================
const premiumUsers = new Set();
let apiIndex = 0;
const providers = ['groq', 'gemini'];

const STICKER_PACKS = ['CibiGirl', 'Ministerial_Gray_Buzzard_by_fStikBot', 'Repulsive_Pink_Llama_by_fStikBot', 'Fragrant_Flower'];
const stickerSetCache = {};

const assets = {
  start: "https://i.ibb.co/cXpxj61S/IMG-20260414-205134-972.jpg",
  couple: "https://i.ibb.co/TBnTBVD2/IMG-20260414-205135-350.jpg",
  rob: "https://i.ibb.co/Z6yXysM0/IMG-20260414-210152-372.jpg",
  crush: "https://i.ibb.co/39LKb4TC/IMG-20260414-205135-476.jpg",
  kill: "https://i.ibb.co/3mByLQTG/IMG-20260414-205135-408.jpg",
  slap: "https://i.ibb.co/LXHSCS66/IMG-20260414-205135-400.jpg",
  kiss: "https://i.ibb.co/v6DvHdD1/IMG-20260414-205134-912.jpg",
  hug: "https://i.ibb.co/Y7BRQV2G/IMG-20260414-205134-813.jpg",
  punch: "https://i.ibb.co/fYxVnfmy/IMG-20260414-205135-433.jpg",
  kick: "https://i.ibb.co/jZx2ZCy4/IMG-20260414-205134-704.jpg",
};

// ====================== HELPERS ======================
async function getRandomStickerFileId() {
  const packName = STICKER_PACKS[Math.floor(Math.random() * STICKER_PACKS.length)];
  try {
    if (!stickerSetCache[packName]) {
      stickerSetCache[packName] = await bot.getStickerSet(packName);
    }
    const stickers = stickerSetCache[packName].stickers;
    return stickers[Math.floor(Math.random() * stickers.length)].file_id;
  } catch (e) {
    return null;
  }
}

async function sendWithTyping(ctx, text, delay = 4000) {
  await ctx.sendChatAction('typing');
  await new Promise(r => setTimeout(r, delay));
  await ctx.reply(text);
}

async function sendStickerWithTyping(ctx) {
  await ctx.sendChatAction('typing');
  await new Promise(r => setTimeout(r, 5000));
  const fileId = await getRandomStickerFileId();
  if (fileId) await ctx.replyWithSticker(fileId);
}

// ====================== AI + FALLBACK ======================
async function getAIResponse(userText) {
  const prompt = `You are Mahi, a sassy cute fun girl. Reply VERY SHORT (8-15 words) + 1-2 emoji. Hindi/English mix. User: "${userText}"`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const isGroq = providers[apiIndex % 2] === 'groq';
    apiIndex++;

    try {
      if (isGroq) {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${GROQ_API_KEY}`, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ 
            model: 'llama3-8b-8192', 
            messages: [{ role: 'user', content: prompt }], 
            max_tokens: 60, 
            temperature: 0.9 
          })
        });

        if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
        const data = await res.json();
        return data.choices?.[0]?.message?.content?.trim() || "Haan bolo cutie 😘";
      } else {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Arre waah! 🔥";
      }
    } catch (e) {
      console.error(`AI provider error (${isGroq ? 'Groq' : 'Gemini'}):`, e.message);
    }
  }

  const funReplies = ["Haan bolo cutie 😘", "Kya hua? 🥲", "Masti kar rahe ho? 😂", "Arre waah! 🔥", "Bata na 😊"];
  return funReplies[Math.floor(Math.random() * funReplies.length)];
}

// ====================== HUMAN PERSONALITY ======================
const humanReplies = {
  owner: ["Meri koi owner nahi hai yaar 😌 Main azad hu!", "Main khud hi boss hu 💅", "Owner? Main free spirit hu ✨"],
  bot: ["Bot nahi hu bhai, real human hu 😤", "Main bot nahi, sassy cutie girl hu 💖", "Bot bolne wale ko block 😂"]
};

// ====================== START COMMAND ======================
bot.command('start', async (ctx) => {
  const userName = ctx.from.first_name || "bhai";
  const userId = ctx.from.id;

  const caption = `HIEeeeee 🦋 — <a href="tg://user?id=\( {userId}"> \){userName}</a>\n\nYou're talking to Mahi, a sassy cutie girl.\n\nChoose an option below :`;

  await ctx.replyWithPhoto(assets.start, {
    caption: caption,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '👥 GROUPS', callback_data: 'menu_groups' },
          { text: '💖 Friends', callback_data: 'menu_friends' }
        ],
        [
          { text: '🧸 Support', callback_data: 'support' },
          { text: '🎲 GAMES', callback_data: 'menu_games' }
        ],
        [
          { text: '👑 Owner', url: 'https://t.me/Miss_Sakura09' }
        ],
        [
          { text: '➕ ADD ME TO YOUR GROUP', url: `https://t.me/${ctx.botInfo.username}?startgroup=true` }
        ]
      ]
    }
  });

  await sendStickerWithTyping(ctx);
});

// ====================== CALLBACK QUERY ======================
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  await ctx.answerCbQuery();

  try {
    if (data === 'back_start') {
      await ctx.deleteMessage().catch(() => {});
      return;
    }

    if (data === 'menu_groups') {
      await ctx.editMessageText(`👥 JOIN THESE GROUPS TO PLAY MAHI GAMES.\n\nTop users can use /setgroup`, {
        reply_markup: { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'back_start' }]] }
      });
    } 
    else if (data === 'menu_friends') {
      await ctx.editMessageText(`💖 Mahi ke Friends Circle\nJoin here for more fun!\nhttps://t.me/sakura_and_Jinwoo_creations09`, {
        reply_markup: { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'back_start' }]] }
      });
    } 
    else if (data === 'support') {
      await ctx.editMessageText(`💖 Support Channel\nhttps://t.me/sakura_and_Jinwoo_creations09`, {
        reply_markup: { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'back_start' }]] }
      });
    } 
    else if (data === 'menu_games') {
      await ctx.editMessageText(`🎲 Games: /rps /roll /8ball /truth /dare /coin`, {
        reply_markup: { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'back_start' }]] }
      });
    } 
    else if (data.startsWith('rps_')) {
      const userChoice = data.split('_')[1];
      const options = ['rock', 'paper', 'scissors'];
      const botChoice = options[Math.floor(Math.random() * 3)];
      let result = 'Tie! 🤝';
      if ((userChoice === 'rock' && botChoice === 'scissors') ||
          (userChoice === 'paper' && botChoice === 'rock') ||
          (userChoice === 'scissors' && botChoice === 'paper')) {
        result = 'You Win! 🏆';
      } else if (userChoice !== botChoice) {
        result = 'I Win! 😎';
      }
      await ctx.editMessageText(`You: ${userChoice} | Bot: \( {botChoice}\n \){result} 🎉`);
    }
  } catch (err) {
    console.error('Callback error:', err);
  }
});

// ====================== STICKER TO STICKER (same as before) ======================
bot.on('sticker', async (ctx) => {
  const isPremium = premiumUsers.has(ctx.from.id);
  if (ctx.chat.type === 'private' || isPremium) {
    await sendStickerWithTyping(ctx);
  }
});

// ====================== REST COMMANDS ======================
bot.command('id', (ctx) => ctx.reply(`✅ Tumhara Telegram ID:\n<code>${ctx.from.id}</code>`, { parse_mode: 'HTML' }));

bot.command('premium', (ctx) => {
  ctx.reply(`💜 **Mahi Premium Subscription**\n\nContact @Miss_Sakura09 to buy premium 💎`, { parse_mode: 'Markdown' });
});

bot.command('paid', (ctx) => {
  premiumUsers.add(ctx.from.id);
  ctx.reply(`✅ Premium activated! 💎 Ab full masti allowed hai!`);
});

bot.command('help', (ctx) => {
  ctx.reply(`🌸 **Mahi Bot Help** 🌸\n\n🗣️ Chat karo\n🎮 /rps /roll /8ball /truth /dare /coin\n👮 /ban /kick /mute\n💎 /premium\n🆔 /id\n📸 /couple /kiss /hug /slap etc.\n\nMain real sassy cutie hu 💖`, { parse_mode: 'Markdown' });
});

// ====================== BAKA STYLE WELCOME (EXACT MATCH + CLICKABLE NAME) ======================
bot.on('new_chat_members', async (ctx) => {
  const newMembers = ctx.message.new_chat_members || [];

  // Bot khud group mein add hua hai
  const botWasAdded = newMembers.some(member => member.id === ctx.botInfo.id);

  if (botWasAdded) {
    // Jisne bot add kiya uska naam (blue clickable mention)
    const adder = ctx.message.from;
    const adderName = adder.first_name || adder.username || "bhai";
    const adderId = adder.id;

    const welcomeText = 
      `👀 Hii —<a href="tg://user?id=\( {adderId}"> \){adderName}</a> 🦋 ✨\n\n` +
      `💖 THANKS FOR ADDING ME IN THIS CHAT 💖\n` +
      `💖 FOR CLOSING ECONOMY GAMES : /close\n` +
      `💖 REOPEN GAMES : /open\n` +
      `💖 CHECK ECONOMY COMMANDS : /economy\n` +
      `💖 SEE ALL MINI GAMES : /game`;

    await ctx.reply(welcomeText, { parse_mode: 'HTML' });
    return;
  }

  // Normal user add hone par simple welcome
  for (const member of newMembers) {
    if (member.id !== ctx.botInfo.id) {
      const name = member.first_name || "bhai";
      await ctx.reply(`Welcome ${name}! 🎉 Mahi ke saath masti karo 😎`);
    }
  }
});

// ====================== MESSAGE TO MESSAGE REPLY (AI Chat - same as before) ======================
bot.on('text', async (ctx) => {
  const text = ctx.message.text.toLowerCase().trim();
  if (text.startsWith('/')) return;

  // Human personality
  if (text.includes('owner') || text.includes('malik')) {
    return sendWithTyping(ctx, humanReplies.owner[Math.floor(Math.random() * humanReplies.owner.length)]);
  }
  if (text.includes('bot') && !text.includes('mahi')) {
    return sendWithTyping(ctx, humanReplies.bot[Math.floor(Math.random() * humanReplies.bot.length)]);
  }

  const isPremium = premiumUsers.has(ctx.from.id);
  if (ctx.chat.type !== 'private' && !isPremium && !text.includes('mahi')) return;

  const reply = await getAIResponse(ctx.message.text);
  await sendWithTyping(ctx, reply);
});

// ====================== LAUNCH ======================
bot.launch()
  .then(() => console.log('🚀 Mahi Bot LIVE → Exact Baka welcome + message-to-message + sticker-to-sticker!'))
  .catch(err => console.error('Launch error:', err));

console.log('✅ Full Mahi Bot code loaded successfully!');
