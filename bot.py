import os, asyncio
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

load_dotenv()
bot=Bot(os.environ["BOT_TOKEN"])
dp=Dispatcher()

@dp.message(CommandStart())
async def start(message:types.Message):
    url=os.environ["WEBAPP_URL"]
    kb=InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(
        text="🎓 Открыть расписание", web_app=WebAppInfo(url=url))]])
    await message.answer("🎓 <b>МГУ — Расписание</b>\n\nВыберите группу и день недели.",parse_mode="HTML",reply_markup=kb)

async def main():
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__=="__main__":
    asyncio.run(main())
