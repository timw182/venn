"""Seed the catalog_items table. Safe to run multiple times (skips if already seeded)."""
import asyncio
import aiosqlite
from database import DB_PATH, init_db

CATALOG = [
    # Foreplay
    ("Slow Massage", "foreplay", "Full body, no rush. Let the tension build on its own.", "🫶", "standard"),
    ("Ice & Warmth", "foreplay", "Alternate between ice cubes and warm breath. Trace slow lines.", "🧊", "quick"),
    ("Blindfolded Touch", "foreplay", "One of you can't see. Every sensation becomes a surprise.", "🙈", "standard"),
    ("Strip Tease", "foreplay", "Low lights, good music. Make a show of it.", "🎵", "standard"),
    ("Oral Focus", "foreplay", "One person receives, no reciprocation expected. Just giving.", "💋", "standard"),
    ("Dirty Talk", "foreplay", "Say what you want before you do it. Be explicit.", "🗣️", "quick"),
    ("Body Worship", "foreplay", "Kiss every inch. Tell them what you love about each part.", "✨", "standard"),
    ("Mutual Masturbation", "foreplay", "Watch each other. Show them exactly what you like.", "👀", "standard"),
    ("Neck & Ears", "foreplay", "Just focus there. Breathing, kissing, whispering. Nothing else.", "🌬️", "quick"),
    ("Teasing Only", "foreplay", "Get close but don't finish. See how long you can both last.", "😈", "standard"),
    ("Shower Together", "foreplay", "Soap each other up slowly. Let the hot water do its thing.", "🚿", "quick"),
    ("Feather Touch", "foreplay", "Barely-there fingertips across skin. Goosebumps guaranteed.", "🪶", "quick"),
    # Positions
    ("Spooning", "positions", "Intimate, close, lazy. Perfect for slow mornings.", "🥄", "quick"),
    ("On Top (Them)", "positions", "Let them take control of the pace and depth.", "👆", "standard"),
    ("On Top (You)", "positions", "You set the rhythm. They enjoy the view.", "👇", "standard"),
    ("From Behind", "positions", "Classic for a reason. Deep and intense.", "🔥", "standard"),
    ("Face to Face", "positions", "Eye contact, kissing, foreheads together. Maximum connection.", "🫂", "standard"),
    ("69", "positions", "Both giving and receiving at the same time. Teamwork.", "🔄", "standard"),
    ("Against the Wall", "positions", "Standing, urgent, can't-wait energy.", "🧱", "standard"),
    ("Sitting / Lap", "positions", "Wrap around each other. Deep and close.", "💺", "standard"),
    ("Edge of the Bed", "positions", "One standing, one lying back. Great angle for both.", "🛏️", "standard"),
    ("Legs Over Shoulders", "positions", "Deep, intense, good stretch. Eye contact optional.", "🦵", "standard"),
    ("Reverse", "positions", "Facing away. Different angle, different sensation entirely.", "🔀", "standard"),
    ("Prone", "positions", "Lying flat, face down. Full body pressure and closeness.", "⬇️", "standard"),
    # Settings
    ("Morning Sex", "settings", "Before coffee, before plans. Just wake up and reach over.", "☀️", "quick"),
    ("In the Dark", "settings", "Pitch black. No visuals, just sound and touch.", "🌑", "quick"),
    ("Hotel Room", "settings", "Somewhere that isn't home. New bed, new energy.", "🏨", "splurge"),
    ("On the Couch", "settings", "Don't even make it to the bedroom.", "🛋️", "quick"),
    ("Bath / Hot Tub", "settings", "Warm water, skin on skin, slippery and slow.", "🛁", "standard"),
    ("Outdoors", "settings", "Balcony, tent, secluded beach. The thrill of open air.", "🌲", "splurge"),
    ("By Candlelight", "settings", "Flickering shadows, warm glow. Everything looks better.", "🕯️", "quick"),
    ("After a Date Night", "settings", "Dressed up, a little tipsy, can't keep hands off.", "🥂", "standard"),
    ("Middle of the Night", "settings", "Half asleep, reaching for each other. Dreamy and unplanned.", "🌙", "quick"),
    ("In Front of a Mirror", "settings", "Watch yourselves. See what they see.", "🪞", "standard"),
    ("Kitchen Counter", "settings", "Cooking interrupted. Dinner can wait.", "🍳", "quick"),
    ("On the Floor", "settings", "Rug, blankets, pillows. Primal and grounded.", "🔻", "quick"),
    # Roleplay
    ("Strangers at a Bar", "roleplay", "Pretend you don't know each other. Flirt from scratch.", "🍸", "standard"),
    ("Power Dynamic", "roleplay", "One person is in charge. The other follows instructions.", "👑", "standard"),
    ("Massage Therapist", "roleplay", "Professional at first. Then... not professional at all.", "💆", "standard"),
    ("Sexting First", "roleplay", "Build anticipation all day with messages. Then meet at home.", "📱", "quick"),
    ("Teacher / Student", "roleplay", "One shows, the other learns. Patient instruction.", "📖", "standard"),
    ("Dare Game", "roleplay", "Take turns daring each other. Escalate slowly.", "🎲", "standard"),
    ("Photographer", "roleplay", "One poses, the other shoots. Tasteful, playful, or explicit.", "📸", "standard"),
    ("Wear Something New", "roleplay", "Lingerie, outfit, or costume. Surprise them with the reveal.", "🎀", "standard"),
    ("Written Instructions", "roleplay", "Leave a note with exactly what to do when they get home.", "✉️", "quick"),
    ("First Time Again", "roleplay", "Pretend it's all new. Nervous energy, asking permission.", "🦋", "standard"),
    # Toys & Gear
    ("Vibrator Together", "toys-gear", "Use it on them, or let them use it while you do other things.", "〰️", "standard"),
    ("Blindfold", "toys-gear", "Take away sight. Heighten everything else.", "🖤", "quick"),
    ("Restraints", "toys-gear", "Soft ties, scarves, or proper cuffs. Trust and surrender.", "🔗", "standard"),
    ("Massage Oil", "toys-gear", "Scented, warming, or cooling. Makes everything glide.", "🫧", "quick"),
    ("Couples Toy", "toys-gear", "Something designed for both of you to feel at the same time.", "💎", "splurge"),
    ("Lingerie", "toys-gear", "Something that makes them feel irresistible. Worth the investment.", "🎀", "standard"),
    ("Remote Control Toy", "toys-gear", "One person holds the remote. The other holds on.", "📡", "splurge"),
    ("Feather Tickler", "toys-gear", "Light, teasing strokes across sensitive areas.", "🪶", "quick"),
    ("Warming Lube", "toys-gear", "Adds a slow heat that builds. Small change, big difference.", "🌡️", "quick"),
    ("Silk or Satin", "toys-gear", "Sheets, pillowcases, or a scarf. Everything feels luxurious.", "🧣", "standard"),
    # Adventurous
    ("Tantric / Slow", "adventurous", "No goal, no rush. Breathe together. Stay connected for as long as you can.", "🧘", "standard"),
    ("Light Bondage", "adventurous", "Wrists, ankles. Soft and safe. Trust is the point.", "🎗️", "standard"),
    ("Edging", "adventurous", "Get close, then stop. Repeat. The payoff is worth the wait.", "🌊", "standard"),
    ("Sensation Play", "adventurous", "Wax, ice, scratching, biting — mix pain and pleasure carefully.", "⚡", "standard"),
    ("Film Yourselves", "adventurous", "Make something just for you two. Delete it or keep it.", "🎥", "standard"),
    ("Read Erotica Together", "adventurous", "Pick a story. Read it aloud. See where it leads.", "📕", "quick"),
    ("Watch Together", "adventurous", "Find something you both enjoy. Use it as a warm-up.", "💻", "quick"),
    ("Quickie Challenge", "adventurous", "Set a timer. Five minutes. Make it count.", "⏱️", "quick"),
    ("New Location in the House", "adventurous", "Laundry room, closet, garage. Somewhere you haven't tried.", "🚪", "quick"),
    ("Marathon Session", "adventurous", "Clear the whole afternoon. No phone, no plans, no clothes.", "🏔️", "splurge"),
    ("Surprise Initiation", "adventurous", "Start something when they least expect it. Spontaneity wins.", "💥", "quick"),
    ("Fantasy Sharing", "adventurous", "Take turns describing a fantasy. No judgment, just honesty.", "💭", "quick"),
]


async def seed():
    await init_db()
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT COUNT(*) FROM catalog_items")
        row = await cursor.fetchone()
        if row and row[0] > 0:
            print(f"Catalog already has {row[0]} items — skipping seed.")
            return

        await db.executemany(
            "INSERT INTO catalog_items (title, category, description, emoji, tier) VALUES (?,?,?,?,?)",
            CATALOG,
        )
        await db.commit()
        print(f"Seeded {len(CATALOG)} catalog items.")


if __name__ == "__main__":
    asyncio.run(seed())
