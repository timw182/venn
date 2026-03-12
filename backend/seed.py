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
    ("Scalp Massage", "foreplay", "Slow, firm fingers through the hair. Melts tension immediately.", "🤲", "quick"),
    ("Kissing Only", "foreplay", "Nothing else. Just mouths, for as long as you can stand it.", "😘", "quick"),
    ("Biting & Marking", "foreplay", "Necks, shoulders, inner thighs. Leave something to remember.", "🐺", "standard"),
    ("Inner Thigh Focus", "foreplay", "Get close but stay there. Tease until they beg you to move.", "🌡️", "standard"),
    ("Hand Play", "foreplay", "Slow, deliberate. Pay attention to their reactions and adjust.", "🤍", "standard"),
    ("Breathwork Together", "foreplay", "Sync your breathing. Press foreheads together. No rushing.", "🌬️", "quick"),
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
    ("Sideways / Scissors", "positions", "Facing each other on your sides. Slow and intimate.", "✂️", "standard"),
    ("Seated on Chair", "positions", "One sits, the other straddles. Great eye contact, great control.", "🪑", "standard"),
    ("Knees to Chest", "positions", "Deep angle. Slow is better here.", "🧎", "standard"),
    ("Standing Behind", "positions", "Both upright, one behind the other. Hands free to roam.", "🚶", "standard"),
    ("Oral — Them on Top", "positions", "Straddle their face. They don't have to do any work.", "👅", "standard"),
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
    ("Rainy Day In", "settings", "Windows fogged, nowhere to be. Let the afternoon disappear.", "🌧️", "quick"),
    ("After a Workout", "settings", "Endorphins high, bodies warm. Don't bother showering first.", "💪", "quick"),
    ("Music On", "settings", "Pick an album. Let it play start to finish.", "🎶", "quick"),
    ("Car", "settings", "Parked somewhere quiet. Cramped, urgent, nostalgic.", "🚗", "splurge"),
    ("Weekend Away", "settings", "New place, no routine. Reset everything.", "🧳", "splurge"),
    ("Completely Sober", "settings", "No drinks to loosen up. Just presence and choice.", "💧", "quick"),
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
    ("Boss & Employee", "roleplay", "Classic power imbalance. One gives orders, one obeys.", "💼", "standard"),
    ("Doctor / Patient", "roleplay", "Clinical tone that breaks down fast. Gloves optional.", "🩺", "standard"),
    ("Only Texting", "roleplay", "In the same house, only communicate by text. All night.", "💬", "quick"),
    ("Memory Replay", "roleplay", "Pick a time you both loved. Recreate it as closely as you can.", "📼", "standard"),
    ("Costume Night", "roleplay", "Full commitment — outfit, character, voice. Stay in it.", "🎭", "splurge"),
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
    ("Wand Massager", "toys-gear", "The most powerful vibration available. Intense and direct.", "⚡", "splurge"),
    ("Nipple Clamps", "toys-gear", "Pressure that builds. Remove them for a whole new sensation.", "🔩", "standard"),
    ("Cock Ring", "toys-gear", "Sustains sensation longer. Can also vibrate for both of you.", "💍", "standard"),
    ("Anal Plug", "toys-gear", "Start small. The fullness adds to everything else you're doing.", "🔵", "standard"),
    ("Body-Safe Candle", "toys-gear", "Drip it slowly from height. Watch them react.", "🕯️", "standard"),
    ("Mirror Setup", "toys-gear", "Position a mirror so you can both watch. Changes the whole dynamic.", "🪞", "quick"),
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
    ("Temperature Play", "adventurous", "Ice cold one moment, body heat the next. Alternate and linger.", "🌡️", "standard"),
    ("Blindfold + Restraints", "adventurous", "Both at once. Complete surrender to touch and sound.", "🖤", "standard"),
    ("Full Night of Service", "adventurous", "One person's entire job is pleasing the other. Switch next time.", "🎖️", "splurge"),
    ("Public Teasing", "adventurous", "Remote toy, whispered threats, hands under the table. Stay composed.", "😳", "standard"),
    ("Dirty Talk Challenge", "adventurous", "Whoever stops talking first loses. Make it explicit.", "🗣️", "standard"),
    ("Body Paint", "adventurous", "Skin-safe paint. Use each other as the canvas.", "🎨", "splurge"),

    # Foreplay — kinkier additions
    ("Spanking Warm-Up", "foreplay", "Start soft, build pressure. Over the knee or standing — your call.", "🖐️", "standard"),
    ("Hair Pulling", "foreplay", "Grip at the root. Slow and deliberate. Read their reaction.", "✊", "quick"),
    ("Degradation Lite", "foreplay", "Name-calling and put-downs — only if they're explicitly into it.", "🔥", "standard"),
    ("Face Sitting", "foreplay", "Full weight, full control. They're there to serve.", "😮", "standard"),
    ("Choking (Safe)", "foreplay", "Flat hand on the throat, no pressure on arteries. Discuss first.", "🤝", "standard"),
    ("Drool / Spit Play", "foreplay", "Messy, primal, taboo. Not for everyone — but very much for some.", "💧", "standard"),
    ("Pinning Down", "foreplay", "Hold their wrists above their head. Weight on them. Don't let them move.", "📌", "standard"),

    # Positions — kinkier additions
    ("Mating Press", "positions", "Full weight, legs pinned back, no escape. Intense and deep.", "🔒", "standard"),
    ("Pile Driver", "positions", "Extreme depth, full control for the giver. Requires flexibility.", "⬇️", "standard"),
    ("Standing Oral", "positions", "One kneels, one stands. Power in every inch of it.", "👅", "quick"),
    ("Bent Over Furniture", "positions", "Table, counter, arm of the sofa. Angle is everything.", "🪑", "standard"),
    ("Lifted Against Wall", "positions", "Strength, urgency, legs wrapped. Effort rewarded.", "🧱", "standard"),
    ("On All Fours", "positions", "Classic submission. They present, you take.", "🐾", "standard"),

    # Settings — kinkier additions
    ("Filmed & Watched Back", "settings", "Make a private video. Watch it together immediately after.", "📹", "standard"),
    ("With the Window Open", "settings", "Anyone could hear. That's the point.", "🪟", "quick"),
    ("Fully Clothed Start", "settings", "Don't undress. Work around it entirely.", "👔", "quick"),
    ("Sleep Sex (Consented)", "settings", "Pre-agreed: wake them up however you want. Trust required.", "😴", "standard"),

    # Roleplay — kinkier additions
    ("Breeding Roleplay", "roleplay", "Primal, possessive language. Pure instinct.", "🌿", "standard"),
    ("Predator / Prey", "roleplay", "One hunts, one runs — then gets caught. Adrenaline-charged.", "🐺", "standard"),
    ("Auction / Property", "roleplay", "One is owned for the night. Given orders, put on display.", "🔖", "standard"),
    ("Corruption Arc", "roleplay", "Innocent character slowly seduced into doing things they 'shouldn't'.", "😇", "standard"),
    ("Used & Objectified", "roleplay", "Pure physical use. They don't speak unless told to.", "🪆", "standard"),
    ("Confessional", "roleplay", "Tell each other the filthiest thing you've thought about. In detail.", "📿", "quick"),
    ("Punish Me", "roleplay", "They misbehave on purpose. You decide the consequence.", "📏", "standard"),

    # Toys & Gear — kinkier additions
    ("Spreader Bar", "toys-gear", "Keeps legs apart. Completely exposed. No hiding.", "↔️", "splurge"),
    ("Collar & Lead", "toys-gear", "Wear it, hold it. The symbolism is the whole point.", "🐾", "standard"),
    ("Ball Gag", "toys-gear", "Sounds only. No words. All reaction.", "⭕", "standard"),
    ("Paddle", "toys-gear", "More impact than a hand. Leaves an impression — literally.", "🏓", "standard"),
    ("Clamps Everywhere", "toys-gear", "Nipples, labia, wherever they're sensitive. Build and release.", "🔩", "standard"),
    ("Flogger", "toys-gear", "Multiple tails, wide impact. Warm the skin before you intensify.", "🎗️", "splurge"),
    ("Strap-On", "toys-gear", "Switches roles entirely. Whoever wears it leads.", "🔄", "splurge"),
    ("Chastity Device", "toys-gear", "One person controls the other's release. Long game.", "🔐", "splurge"),
    ("Tens Unit (E-Stim)", "toys-gear", "Low electrical pulses. Twitching muscles, novel sensation.", "⚡", "splurge"),

    # Adventurous — kinkier additions
    ("24h Power Exchange", "adventurous", "One Dom, one sub — for a full day. All decisions delegated.", "🎖️", "splurge"),
    ("Orgasm Control", "adventurous", "You decide when — and if — they finish. Keep them on the edge.", "🌊", "standard"),
    ("Consensual Non-Consent (CNC)", "adventurous", "Full scene with safeword. They say no but mean yes. Pre-negotiated only.", "🚦", "splurge"),
    ("Degradation Scene", "adventurous", "Explicit verbal humiliation, agreed terms, full aftercare after.", "🗣️", "standard"),
    ("Forced Orgasm", "adventurous", "Keep going past the first one. Don't stop when they ask.", "💫", "standard"),
    ("Cuckolding / Voyeur Fantasy", "adventurous", "Describe a fantasy of watching or being watched with others. Words only.", "👁️", "standard"),
    ("Bondage Scene", "adventurous", "Planned, rope or restraints, full immobility. Research safety first.", "🎗️", "splurge"),
    ("Impact Play Scene", "adventurous", "Spanking, paddling, flogging — escalating, with check-ins.", "🖐️", "standard"),
    ("Pet Play", "adventurous", "One takes an animal role — kitten, puppy. Collar, commands, rewards.", "🐱", "standard"),
    ("Knife Play (Safety)", "adventurous", "Blunt edge only — trace the skin. Psychological edge, no cutting.", "🗡️", "splurge"),
    ("Wax Play Scene", "adventurous", "Low-temp candle dripped from height. Map every reaction.", "🕯️", "standard"),
    ("Somnophilia Scene", "adventurous", "One pretends to sleep, the other takes what they want. Pre-agreed.", "🌙", "standard"),

    # Foreplay — BDSM additions
    ("Nipple Play", "foreplay", "Fingers, mouth, clamps — spend real time there before moving on.", "🌸", "quick"),
    ("Pegging Warm-Up", "foreplay", "Fingers and toys first. Slow prep is what makes it work.", "🔵", "standard"),
    ("Boot / Foot Worship", "foreplay", "On your knees. Kiss, lick, massage. Submission from the ground up.", "👢", "standard"),
    ("Over-the-Knee Spanking", "foreplay", "Classic OTK position. Slow build, check in, don't rush the warmth.", "🖐️", "standard"),
    ("Pussy / Dick Slapping", "foreplay", "Light taps, deliberate. Shocking and arousing in equal measure.", "⚡", "standard"),
    ("Rope Teasing (No Tie)", "foreplay", "Drag rope across skin without tying. The texture alone is enough.", "🎗️", "quick"),

    # Positions — BDSM additions
    ("Full Nelson", "positions", "Arms hooked behind, completely exposed and controlled.", "🔒", "standard"),
    ("Doggy with Hair Pull", "positions", "From behind, one hand gripping hair. Controlled and primal.", "🐾", "standard"),
    ("Pegging", "positions", "Strap-on from behind. Whoever wears it leads the pace entirely.", "🔄", "standard"),
    ("Over the Lap", "positions", "Draped across their lap — intimate, vulnerable, ideal for impact.", "🛋️", "standard"),
    ("Spread Eagle (Tied)", "positions", "Flat on back, all four limbs secured. Total surrender.", "↔️", "splurge"),
    ("Suspended Oral", "positions", "One sits high — chair, counter, face level. The other kneels and serves.", "👑", "standard"),

    # Settings — BDSM additions
    ("Dungeon Aesthetic", "settings", "Candles, red light, leather gear laid out. Set the scene intentionally.", "🕯️", "splurge"),
    ("After a Fight", "settings", "Tension turned into something physical. Raw and real.", "🌩️", "quick"),
    ("Formal Dinner Then Scene", "settings", "Dress up, eat slowly, exchange looks. Then go home and drop the act.", "🍷", "splurge"),
    ("Collared All Day", "settings", "They wear the collar from morning. The scene starts before the bedroom.", "🐾", "standard"),
    ("Sensory Deprivation Room", "settings", "Blackout blindfold, earplugs or white noise. Only touch remains.", "🖤", "standard"),

    # Roleplay — BDSM additions
    ("Kidnapping Scene", "roleplay", "Pre-negotiated abduction fantasy. Safeword essential. Pure adrenaline.", "🚨", "splurge"),
    ("Human Furniture", "roleplay", "They become an object — footrest, table. Silent, still, used.", "🪑", "standard"),
    ("Auctioned Off", "roleplay", "Presented, inspected, bought. Play out the whole transaction.", "🔖", "standard"),
    ("Pet Owner", "roleplay", "One is the pet — collar, commands, treats, punishment. Full dynamic.", "🐱", "standard"),
    ("Maid / Butler Service", "roleplay", "In uniform (or not). Every order followed without question.", "🫧", "standard"),
    ("Interrogation Scene", "roleplay", "One questions, one resists — until they don't. Intense and theatrical.", "💡", "standard"),
    ("Arranged Marriage Night", "roleplay", "Strangers by agreement. Nervous, curious, first-time energy.", "💍", "standard"),

    # Toys & Gear — leather & BDSM
    ("Leather Harness (Body)", "toys-gear", "Straps across chest or hips. Purely aesthetic power.", "🖤", "standard"),
    ("Leather Cuffs", "toys-gear", "Wrist or ankle. Padded, strong, and looks the part.", "⛓️", "standard"),
    ("Leather Collar", "toys-gear", "Thick, buckled, real. Wearing it means something.", "🐾", "standard"),
    ("Leather Paddle", "toys-gear", "Heavier than silicone. The sound alone changes the atmosphere.", "🏏", "standard"),
    ("Full Bondage Tape", "toys-gear", "Sticks to itself, not skin. Wrap and unwrap without marks.", "🎗️", "standard"),
    ("Latex Gloves", "toys-gear", "Clinical snap, total control. Sterile energy in the best way.", "🧤", "quick"),
    ("Posture Collar", "toys-gear", "High and rigid — forces chin up. A constant reminder of the dynamic.", "📐", "splurge"),
    ("Hogtie Kit", "toys-gear", "Wrists to ankles, face down. Complete immobility. Research safety.", "🔗", "splurge"),
    ("Under-Bed Restraint System", "toys-gear", "Straps under the mattress. Invisible until you need them.", "🛏️", "splurge"),
    ("Violet Wand", "toys-gear", "Static electricity across skin. Crackling, visual, intense.", "⚡", "splurge"),
    ("Shibari Rope (Jute)", "toys-gear", "Traditional Japanese bondage rope. Learn a tie. The ritual is the point.", "🎋", "splurge"),
    ("Leather Blindfold", "toys-gear", "Heavier and more serious than fabric. Blocks everything.", "🖤", "standard"),
    ("Bit Gag", "toys-gear", "Bar between the teeth. Between a gag and a bridle — pet play crossover.", "🐴", "standard"),
    ("Cane", "toys-gear", "Thin, precise, intense. A single strike lands differently than a paddle.", "🎋", "splurge"),
    ("Wartenberg Wheel", "toys-gear", "Pinwheel rolled across skin. Pain and pleasure at the same time.", "🌀", "standard"),

    # Adventurous — deep BDSM
    ("Full Shibari Tie", "adventurous", "Learn and perform a complete rope bondage tie. The process is intimate.", "🎋", "splurge"),
    ("TPE Night (Total Power Exchange)", "adventurous", "Complete transfer of control for a negotiated time. Every decision delegated.", "👑", "splurge"),
    ("Humiliation Walk", "adventurous", "Collar and lead, walked around the home. On display for each other.", "🐾", "standard"),
    ("Punishment Protocol", "adventurous", "Pre-agreed rules and consequences. Enforced consistently all evening.", "📋", "standard"),
    ("Figging", "adventurous", "Peeled ginger root inserted — creates intense, natural heat. Old school kink.", "🌿", "standard"),
    ("Breath Play (Light)", "adventurous", "Hand over mouth briefly during climax. Discuss fully. Never alone.", "🤚", "standard"),
    ("Collaring Ceremony", "adventurous", "Formal moment of placing the collar. Words, meaning, commitment to the dynamic.", "💍", "splurge"),
    ("Slave Contract Night", "adventurous", "Write and sign a play contract together. Limits, safewords, rules.", "📜", "splurge"),
    ("Outdoor Bondage", "adventurous", "Secured in a private outdoor space. Nature adds to the exposure.", "🌲", "splurge"),
    ("Aftercare Protocol", "adventurous", "Formal, deliberate aftercare — blanket, water, holding, debriefing.", "🫶", "quick"),
    ("Erotic Hypnosis", "adventurous", "Voice-guided relaxation into a suggestible, deeply aroused state.", "🌀", "splurge"),
    ("Fear Play", "adventurous", "Controlled scare — darkness, sounds, pretend threat. Adrenaline + arousal.", "😱", "splurge"),
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
