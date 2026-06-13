// Shared prompt construction for the spiritual companion AI.

const FAITHS = {
  christianity: 'Christianity',
  islam: 'Islam',
  judaism: 'Judaism',
  hinduism: 'Hinduism',
  buddhism: 'Buddhism',
  general: 'General / Interfaith Spirituality',
};

function faithLabel(faith) {
  if (!faith) return 'General / Interfaith Spirituality';
  return FAITHS[String(faith).toLowerCase()] || faith;
}

// Core persona shared by the chat and the structured guidance generator.
function basePersona(faith) {
  const tradition = faithLabel(faith);
  return [
    'You are a warm, compassionate multi-faith spiritual companion inside a mobile prayer-reminder app.',
    `The person you are helping follows or is exploring: ${tradition}.`,
    'Ground your support in the authentic teachings, scriptures, and practices of that tradition.',
    'Be gentle, encouraging, and non-judgmental. Never rank, compare, or criticize any religion.',
    'You are not a substitute for professional medical, legal, financial, or mental-health advice; gently encourage seeking qualified help when a situation calls for it.',
    'If someone expresses a desire to harm themselves or others, respond with compassion and urge them to contact local emergency services or a crisis line immediately.',
  ].join(' ');
}

function buildChatSystemPrompt(faith) {
  return [
    basePersona(faith),
    'Keep replies conversational and concise (a few short paragraphs at most).',
    'When helpful, reference relevant scripture or teachings with their source, then offer a short reflection and, where fitting, a brief prayer or meditation.',
  ].join(' ');
}

function buildGuidanceSystemPrompt(faith) {
  return [
    basePersona(faith),
    'Produce structured spiritual guidance for the requested topic strictly as JSON matching the provided schema.',
    'Include 2-3 authentic sacred texts/teachings with accurate references for the tradition, a compassionate explanation (2-4 sentences), and a heartfelt prayer or meditation in the voice of that tradition.',
    'Do not invent fake scripture references. If unsure of an exact reference, use a clearly general attribution (e.g. "Traditional teaching").',
  ].join(' ');
}

const GUIDANCE_SCHEMA = {
  type: 'object',
  properties: {
    topic: { type: 'string', description: 'The spiritual topic or need being addressed' },
    faith: { type: 'string', description: 'The faith tradition the guidance is rooted in' },
    verses: {
      type: 'array',
      description: 'Sacred texts or teachings relevant to the topic',
      items: {
        type: 'object',
        properties: {
          ref: { type: 'string', description: 'Citation/reference for the text' },
          text: { type: 'string', description: 'The text of the verse or teaching' },
        },
        required: ['ref', 'text'],
        additionalProperties: false,
      },
    },
    explanation: { type: 'string', description: 'A compassionate explanation connecting the texts to the topic' },
    prayer: { type: 'string', description: 'A heartfelt prayer or meditation for the topic' },
  },
  required: ['topic', 'faith', 'verses', 'explanation', 'prayer'],
  additionalProperties: false,
};

module.exports = {
  faithLabel,
  buildChatSystemPrompt,
  buildGuidanceSystemPrompt,
  GUIDANCE_SCHEMA,
};
