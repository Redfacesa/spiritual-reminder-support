// Guided reading plans. Each plan has an ordered list of days; each day has a
// verse/teaching, a short reflection, and a suggested prayer prompt.

export interface ReadingDay {
  day: number;
  title: string;
  reference: string;
  text: string;
  reflection: string;
  prompt: string;
}

export interface ReadingPlan {
  id: string;
  title: string;
  length: number; // number of days
  desc: string;
  accent: string;
  icon: string; // Ionicons name
  days: ReadingDay[];
}

export const READING_PLANS: ReadingPlan[] = [
  {
    id: 'peace-7',
    title: '7 Days of Peace',
    length: 7,
    desc: 'A week of verses to calm an anxious heart.',
    accent: '#0EA5E9',
    icon: 'leaf',
    days: [
      {
        day: 1,
        title: 'Release Your Worries',
        reference: 'Philippians 4:6-7',
        text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God will guard your hearts.',
        reflection: 'Anxiety shrinks when it is spoken honestly in prayer. Name one worry today and hand it over deliberately.',
        prompt: 'God, today I release my worry about ______ into Your hands.',
      },
      {
        day: 2,
        title: 'Be Still',
        reference: 'Psalm 46:10',
        text: 'Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.',
        reflection: 'Stillness is not emptiness — it is trust. Sit quietly for two minutes before you pray.',
        prompt: 'Help me to be still and trust that You are in control.',
      },
      {
        day: 3,
        title: 'Rest for the Weary',
        reference: 'Matthew 11:28',
        text: 'Come to me, all you who are weary and burdened, and I will give you rest.',
        reflection: 'You were not made to carry everything alone. Where are you tired today?',
        prompt: 'I bring my tiredness to You and ask for true rest.',
      },
      {
        day: 4,
        title: 'A Guarded Heart',
        reference: 'John 14:27',
        text: 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.',
        reflection: 'The peace offered to you is steady, not dependent on circumstances.',
        prompt: 'Let Your peace settle the places in me that feel afraid.',
      },
      {
        day: 5,
        title: 'Cast Your Cares',
        reference: '1 Peter 5:7',
        text: 'Cast all your anxiety on him because he cares for you.',
        reflection: 'Casting is an action. Picture placing each concern down as you breathe out.',
        prompt: 'I cast my cares on You because You care for me.',
      },
      {
        day: 6,
        title: 'Renewed Mind',
        reference: 'Isaiah 26:3',
        text: 'You will keep in perfect peace those whose minds are steadfast, because they trust in you.',
        reflection: 'Peace follows focus. Return your attention gently whenever it drifts to fear.',
        prompt: 'Keep my mind steadfast and fixed on You.',
      },
      {
        day: 7,
        title: 'Peace That Overflows',
        reference: 'Romans 15:13',
        text: 'May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.',
        reflection: 'You have practiced peace for a week. Notice how trust has grown.',
        prompt: 'Fill me with peace until it overflows to those around me.',
      },
    ],
  },
  {
    id: 'gratitude-14',
    title: 'Gratitude Journey',
    length: 14,
    desc: 'Cultivate thankfulness every morning.',
    accent: '#22C55E',
    icon: 'sunny',
    days: Array.from({ length: 14 }, (_, i) => {
      const refs = [
        ['1 Thessalonians 5:18', 'Give thanks in all circumstances; for this is God’s will for you in Christ Jesus.'],
        ['Psalm 100:4', 'Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name.'],
        ['Psalm 107:1', 'Give thanks to the Lord, for he is good; his love endures forever.'],
        ['Colossians 3:15', 'Let the peace of Christ rule in your hearts. And be thankful.'],
        ['Psalm 9:1', 'I will give thanks to you, Lord, with all my heart; I will tell of all your wonderful deeds.'],
        ['James 1:17', 'Every good and perfect gift is from above, coming down from the Father.'],
        ['Psalm 28:7', 'The Lord is my strength and my shield; my heart trusts in him, and he helps me.'],
        ['Ephesians 5:20', 'Always giving thanks to God the Father for everything.'],
        ['Psalm 95:2', 'Let us come before him with thanksgiving and extol him with music and song.'],
        ['Philippians 4:8', 'Whatever is true, noble, right, pure, lovely — think about such things.'],
        ['Psalm 136:1', 'Give thanks to the Lord, for he is good. His love endures forever.'],
        ['2 Corinthians 9:15', 'Thanks be to God for his indescribable gift!'],
        ['Psalm 118:24', 'This is the day the Lord has made; let us rejoice and be glad in it.'],
        ['Hebrews 12:28', 'Let us be thankful, and so worship God acceptably with reverence and awe.'],
      ];
      const [reference, text] = refs[i];
      return {
        day: i + 1,
        title: `Day ${i + 1}: A Grateful Heart`,
        reference,
        text,
        reflection: 'Write down three specific things you are thankful for this morning before you do anything else.',
        prompt: 'Thank You for ______, ______, and ______ today.',
      };
    }),
  },
  {
    id: 'strength-21',
    title: 'Strength in Trials',
    length: 21,
    desc: 'Daily readings for difficult seasons.',
    accent: '#5B5BD6',
    icon: 'shield',
    days: Array.from({ length: 21 }, (_, i) => {
      const refs = [
        ['Isaiah 41:10', 'Do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you.'],
        ['Joshua 1:9', 'Be strong and courageous. Do not be afraid; the Lord your God will be with you wherever you go.'],
        ['Psalm 18:2', 'The Lord is my rock, my fortress and my deliverer; my God is my rock, in whom I take refuge.'],
        ['2 Corinthians 12:9', 'My grace is sufficient for you, for my power is made perfect in weakness.'],
        ['Philippians 4:13', 'I can do all this through him who gives me strength.'],
        ['Psalm 34:18', 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.'],
        ['Romans 8:28', 'In all things God works for the good of those who love him.'],
        ['Psalm 73:26', 'My flesh and my heart may fail, but God is the strength of my heart and my portion forever.'],
        ['Nehemiah 8:10', 'The joy of the Lord is your strength.'],
        ['Isaiah 40:31', 'Those who hope in the Lord will renew their strength. They will soar on wings like eagles.'],
        ['Psalm 27:1', 'The Lord is my light and my salvation — whom shall I fear?'],
        ['Deuteronomy 31:6', 'Be strong and courageous. He will never leave you nor forsake you.'],
        ['Psalm 46:1', 'God is our refuge and strength, an ever-present help in trouble.'],
        ['James 1:12', 'Blessed is the one who perseveres under trial because, having stood the test, that person will receive the crown of life.'],
        ['Romans 5:3-4', 'Suffering produces perseverance; perseverance, character; and character, hope.'],
        ['Psalm 55:22', 'Cast your cares on the Lord and he will sustain you.'],
        ['2 Timothy 1:7', 'God gave us a spirit not of fear but of power and love and self-control.'],
        ['Psalm 121:1-2', 'I lift up my eyes to the mountains — where does my help come from? My help comes from the Lord.'],
        ['Lamentations 3:22-23', 'His compassions never fail. They are new every morning; great is your faithfulness.'],
        ['Psalm 31:24', 'Be strong and take heart, all you who hope in the Lord.'],
        ['Jeremiah 29:11', 'For I know the plans I have for you, plans to prosper you and not to harm you, to give you hope and a future.'],
      ];
      const [reference, text] = refs[i];
      return {
        day: i + 1,
        title: `Day ${i + 1}: Take Heart`,
        reference,
        text,
        reflection: 'Trials are seasons, not destinations. Name where you need strength today and read the verse aloud.',
        prompt: 'Give me strength to face ______ today, one step at a time.',
      };
    }),
  },
];

export function getReadingPlan(id: string): ReadingPlan | undefined {
  return READING_PLANS.find((p) => p.id === id);
}
