export const MOCK_USER = {
  id: 1,
  username: 'alex',
  displayName: 'Alex',
  coupleId: 1,
  partnerName: 'Jordan',
};

export const MOCK_CATALOG = [
  // Foreplay
  { id: 1, category: 'foreplay', title: 'Slow Massage', description: 'Full body, no rush. Let the tension build on its own.', emoji: '🫶', tier: 'standard' },
  { id: 2, category: 'foreplay', title: 'Ice & Warmth', description: 'Alternate between ice cubes and warm breath. Trace slow lines.', emoji: '🧊', tier: 'quick' },
  { id: 3, category: 'foreplay', title: 'Blindfolded Touch', description: 'One of you can\'t see. Every sensation becomes a surprise.', emoji: '🙈', tier: 'standard' },
  { id: 4, category: 'foreplay', title: 'Strip Tease', description: 'Low lights, good music. Make a show of it.', emoji: '🎵', tier: 'standard' },
  { id: 5, category: 'foreplay', title: 'Oral Focus', description: 'One person receives, no reciprocation expected. Just giving.', emoji: '💋', tier: 'standard' },
  { id: 6, category: 'foreplay', title: 'Dirty Talk', description: 'Say what you want before you do it. Be explicit.', emoji: '🗣️', tier: 'quick' },
  { id: 7, category: 'foreplay', title: 'Body Worship', description: 'Kiss every inch. Tell them what you love about each part.', emoji: '✨', tier: 'standard' },
  { id: 8, category: 'foreplay', title: 'Mutual Masturbation', description: 'Watch each other. Show them exactly what you like.', emoji: '👀', tier: 'standard' },
  { id: 9, category: 'foreplay', title: 'Neck & Ears', description: 'Just focus there. Breathing, kissing, whispering. Nothing else.', emoji: '🌬️', tier: 'quick' },
  { id: 10, category: 'foreplay', title: 'Teasing Only', description: 'Get close but don\'t finish. See how long you can both last.', emoji: '😈', tier: 'standard' },
  { id: 11, category: 'foreplay', title: 'Shower Together', description: 'Soap each other up slowly. Let the hot water do its thing.', emoji: '🚿', tier: 'quick' },
  { id: 12, category: 'foreplay', title: 'Feather Touch', description: 'Barely-there fingertips across skin. Goosebumps guaranteed.', emoji: '🪶', tier: 'quick' },

  // Positions
  { id: 13, category: 'positions', title: 'Spooning', description: 'Intimate, close, lazy. Perfect for slow mornings.', emoji: '🥄', tier: 'quick' },
  { id: 14, category: 'positions', title: 'On Top (Them)', description: 'Let them take control of the pace and depth.', emoji: '👆', tier: 'standard' },
  { id: 15, category: 'positions', title: 'On Top (You)', description: 'You set the rhythm. They enjoy the view.', emoji: '👇', tier: 'standard' },
  { id: 16, category: 'positions', title: 'From Behind', description: 'Classic for a reason. Deep and intense.', emoji: '🔥', tier: 'standard' },
  { id: 17, category: 'positions', title: 'Face to Face', description: 'Eye contact, kissing, foreheads together. Maximum connection.', emoji: '🫂', tier: 'standard' },
  { id: 18, category: 'positions', title: '69', description: 'Both giving and receiving at the same time. Teamwork.', emoji: '🔄', tier: 'standard' },
  { id: 19, category: 'positions', title: 'Against the Wall', description: 'Standing, urgent, can\'t-wait energy.', emoji: '🧱', tier: 'standard' },
  { id: 20, category: 'positions', title: 'Sitting / Lap', description: 'Wrap around each other. Deep and close.', emoji: '💺', tier: 'standard' },
  { id: 21, category: 'positions', title: 'Edge of the Bed', description: 'One standing, one lying back. Great angle for both.', emoji: '🛏️', tier: 'standard' },
  { id: 22, category: 'positions', title: 'Legs Over Shoulders', description: 'Deep, intense, good stretch. Eye contact optional.', emoji: '🦵', tier: 'standard' },
  { id: 23, category: 'positions', title: 'Reverse', description: 'Facing away. Different angle, different sensation entirely.', emoji: '🔀', tier: 'standard' },
  { id: 24, category: 'positions', title: 'Prone', description: 'Lying flat, face down. Full body pressure and closeness.', emoji: '⬇️', tier: 'standard' },

  // Settings & Scenarios
  { id: 25, category: 'settings', title: 'Morning Sex', description: 'Before coffee, before plans. Just wake up and reach over.', emoji: '☀️', tier: 'quick' },
  { id: 26, category: 'settings', title: 'In the Dark', description: 'Pitch black. No visuals, just sound and touch.', emoji: '🌑', tier: 'quick' },
  { id: 27, category: 'settings', title: 'Hotel Room', description: 'Somewhere that isn\'t home. New bed, new energy.', emoji: '🏨', tier: 'splurge' },
  { id: 28, category: 'settings', title: 'On the Couch', description: 'Don\'t even make it to the bedroom.', emoji: '🛋️', tier: 'quick' },
  { id: 29, category: 'settings', title: 'Bath / Hot Tub', description: 'Warm water, skin on skin, slippery and slow.', emoji: '🛁', tier: 'standard' },
  { id: 30, category: 'settings', title: 'Outdoors', description: 'Balcony, tent, secluded beach. The thrill of open air.', emoji: '🌲', tier: 'splurge' },
  { id: 31, category: 'settings', title: 'By Candlelight', description: 'Flickering shadows, warm glow. Everything looks better.', emoji: '🕯️', tier: 'quick' },
  { id: 32, category: 'settings', title: 'After a Date Night', description: 'Dressed up, a little tipsy, can\'t keep hands off.', emoji: '🥂', tier: 'standard' },
  { id: 33, category: 'settings', title: 'Middle of the Night', description: 'Half asleep, reaching for each other. Dreamy and unplanned.', emoji: '🌙', tier: 'quick' },
  { id: 34, category: 'settings', title: 'In Front of a Mirror', description: 'Watch yourselves. See what they see.', emoji: '🪞', tier: 'standard' },
  { id: 35, category: 'settings', title: 'Kitchen Counter', description: 'Cooking interrupted. Dinner can wait.', emoji: '🍳', tier: 'quick' },
  { id: 36, category: 'settings', title: 'On the Floor', description: 'Rug, blankets, pillows. Primal and grounded.', emoji: '🔻', tier: 'quick' },

  // Roleplay & Fantasy
  { id: 37, category: 'roleplay', title: 'Strangers at a Bar', description: 'Pretend you don\'t know each other. Flirt from scratch.', emoji: '🍸', tier: 'standard' },
  { id: 38, category: 'roleplay', title: 'Power Dynamic', description: 'One person is in charge. The other follows instructions.', emoji: '👑', tier: 'standard' },
  { id: 39, category: 'roleplay', title: 'Massage Therapist', description: 'Professional at first. Then... not professional at all.', emoji: '💆', tier: 'standard' },
  { id: 40, category: 'roleplay', title: 'Sexting First', description: 'Build anticipation all day with messages. Then meet at home.', emoji: '📱', tier: 'quick' },
  { id: 41, category: 'roleplay', title: 'Teacher / Student', description: 'One shows, the other learns. Patient instruction.', emoji: '📖', tier: 'standard' },
  { id: 42, category: 'roleplay', title: 'Dare Game', description: 'Take turns daring each other. Escalate slowly.', emoji: '🎲', tier: 'standard' },
  { id: 43, category: 'roleplay', title: 'Photographer', description: 'One poses, the other shoots. Tasteful, playful, or explicit.', emoji: '📸', tier: 'standard' },
  { id: 44, category: 'roleplay', title: 'Wear Something New', description: 'Lingerie, outfit, or costume. Surprise them with the reveal.', emoji: '🎀', tier: 'standard' },
  { id: 45, category: 'roleplay', title: 'Written Instructions', description: 'Leave a note with exactly what to do when they get home.', emoji: '✉️', tier: 'quick' },
  { id: 46, category: 'roleplay', title: 'First Time Again', description: 'Pretend it\'s all new. Nervous energy, asking permission.', emoji: '🦋', tier: 'standard' },

  // Toys & Gear
  { id: 47, category: 'toys-gear', title: 'Vibrator Together', description: 'Use it on them, or let them use it while you do other things.', emoji: '〰️', tier: 'standard' },
  { id: 48, category: 'toys-gear', title: 'Blindfold', description: 'Take away sight. Heighten everything else.', emoji: '🖤', tier: 'quick' },
  { id: 49, category: 'toys-gear', title: 'Restraints', description: 'Soft ties, scarves, or proper cuffs. Trust and surrender.', emoji: '🔗', tier: 'standard' },
  { id: 50, category: 'toys-gear', title: 'Massage Oil', description: 'Scented, warming, or cooling. Makes everything glide.', emoji: '🫧', tier: 'quick' },
  { id: 51, category: 'toys-gear', title: 'Couples Toy', description: 'Something designed for both of you to feel at the same time.', emoji: '💎', tier: 'splurge' },
  { id: 52, category: 'toys-gear', title: 'Lingerie', description: 'Something that makes them feel irresistible. Worth the investment.', emoji: '🎀', tier: 'standard' },
  { id: 53, category: 'toys-gear', title: 'Remote Control Toy', description: 'One person holds the remote. The other holds on.', emoji: '📡', tier: 'splurge' },
  { id: 54, category: 'toys-gear', title: 'Feather Tickler', description: 'Light, teasing strokes across sensitive areas.', emoji: '🪶', tier: 'quick' },
  { id: 55, category: 'toys-gear', title: 'Warming Lube', description: 'Adds a slow heat that builds. Small change, big difference.', emoji: '🌡️', tier: 'quick' },
  { id: 56, category: 'toys-gear', title: 'Silk or Satin', description: 'Sheets, pillowcases, or a scarf. Everything feels luxurious.', emoji: '🧣', tier: 'standard' },

  // Adventurous
  { id: 57, category: 'adventurous', title: 'Tantric / Slow', description: 'No goal, no rush. Breathe together. Stay connected for as long as you can.', emoji: '🧘', tier: 'standard' },
  { id: 58, category: 'adventurous', title: 'Light Bondage', description: 'Wrists, ankles. Soft and safe. Trust is the point.', emoji: '🎗️', tier: 'standard' },
  { id: 59, category: 'adventurous', title: 'Edging', description: 'Get close, then stop. Repeat. The payoff is worth the wait.', emoji: '🌊', tier: 'standard' },
  { id: 60, category: 'adventurous', title: 'Sensation Play', description: 'Wax, ice, scratching, biting — mix pain and pleasure carefully.', emoji: '⚡', tier: 'standard' },
  { id: 61, category: 'adventurous', title: 'Film Yourselves', description: 'Make something just for you two. Delete it or keep it.', emoji: '🎥', tier: 'standard' },
  { id: 62, category: 'adventurous', title: 'Read Erotica Together', description: 'Pick a story. Read it aloud. See where it leads.', emoji: '📕', tier: 'quick' },
  { id: 63, category: 'adventurous', title: 'Watch Together', description: 'Find something you both enjoy. Use it as a warm-up.', emoji: '💻', tier: 'quick' },
  { id: 64, category: 'adventurous', title: 'Quickie Challenge', description: 'Set a timer. Five minutes. Make it count.', emoji: '⏱️', tier: 'quick' },
  { id: 65, category: 'adventurous', title: 'New Location in the House', description: 'Laundry room, closet, garage. Somewhere you haven\'t tried.', emoji: '🚪', tier: 'quick' },
  { id: 66, category: 'adventurous', title: 'Marathon Session', description: 'Clear the whole afternoon. No phone, no plans, no clothes.', emoji: '🏔️', tier: 'splurge' },
  { id: 67, category: 'adventurous', title: 'Surprise Initiation', description: 'Start something when they least expect it. Spontaneity wins.', emoji: '💥', tier: 'quick' },
  { id: 68, category: 'adventurous', title: 'Fantasy Sharing', description: 'Take turns describing a fantasy. No judgment, just honesty.', emoji: '💭', tier: 'quick' },
];

// Pre-built mock responses
export const MOCK_RESPONSES = {
  1: 'yes',
  3: 'yes',
  5: 'no',
  8: 'maybe',
  13: 'yes',
  17: 'yes',
  25: 'yes',
  38: 'yes',
  47: 'yes',
  57: 'yes',
};

// Items where both partners said yes
export const MOCK_MATCHES = [
  { ...MOCK_CATALOG.find(i => i.id === 3), matchedAt: '2026-03-10T14:30:00Z', seen: true },
  { ...MOCK_CATALOG.find(i => i.id === 17), matchedAt: '2026-03-11T09:00:00Z', seen: true },
  { ...MOCK_CATALOG.find(i => i.id === 57), matchedAt: '2026-03-12T01:15:00Z', seen: false },
  { ...MOCK_CATALOG.find(i => i.id === 47), matchedAt: '2026-03-12T03:22:00Z', seen: false },
];
