/**
 * Curated educational content. This is the static backbone of the Learn and
 * Caregiver sections: accurate, plain-language material that renders with
 * zero network access. AI enrichment ("explain simply", situation scripts)
 * layers on top of it and degrades gracefully back to this content.
 */

export interface LearnTopic {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
}

export const LEARN_TOPICS: LearnTopic[] = [
  {
    id: "cravings",
    title: "What cravings actually are",
    summary:
      "A craving is a strong, temporary urge produced by the brain's reward system, not a sign of weak willpower. Cravings behave like waves: they build, peak within about 20-30 minutes, and then fade — whether or not you act on them.",
    keyPoints: [
      "Cravings are time-limited; most peak and pass in under half an hour.",
      "They are triggered by cues — places, people, feelings — not by lack of character.",
      "\"Urge surfing\" (observing the craving without fighting it) makes waves smaller over time.",
      "Every craving you ride out weakens the cue-craving link in the brain.",
    ],
  },
  {
    id: "triggers",
    title: "Triggers and how to map them",
    summary:
      "A trigger is anything that switches on the urge to use: a street corner, a payday, an argument, even a song. Mapping your personal triggers turns surprise attacks into events you can predict and plan around.",
    keyPoints: [
      "Triggers can be external (people, places, times) or internal (stress, boredom, shame).",
      "Write down what was happening right before each craving — patterns appear fast.",
      "For each trigger, prepare one specific response in advance (call, leave, breathe).",
      "Avoid what you can early on; build coping skills for what you can't avoid.",
    ],
  },
  {
    id: "withdrawal",
    title: "What withdrawal feels like — and when it's dangerous",
    summary:
      "Withdrawal is the body recalibrating after it adapted to a substance. Symptoms range from unpleasant (sweating, anxiety, poor sleep, nausea) to medically dangerous. Alcohol and benzodiazepine withdrawal in particular can cause seizures and can be life-threatening — stopping these suddenly without medical supervision is not safe.",
    keyPoints: [
      "Alcohol and benzo withdrawal can be MEDICALLY DANGEROUS — always seek medical supervision before stopping.",
      "Opioid withdrawal is intensely uncomfortable but rarely life-threatening on its own.",
      "Confusion, seizures, fever, or hallucinations during withdrawal are emergencies — call 112.",
      "Medically supervised detox exists precisely for this; asking for it is the safe choice, not the weak one.",
    ],
  },
  {
    id: "relapse",
    title: "Relapse is not failure — the cycle of change",
    summary:
      "Most people take several attempts to sustain recovery, and research treats relapse as a common stage of a chronic condition, not proof that treatment failed. What matters most is how quickly and safely someone returns to their plan afterwards.",
    keyPoints: [
      "Relapse rates for substance use are similar to other chronic illnesses like asthma or hypertension.",
      "A slip becomes a spiral mainly through shame — quick, honest reconnection prevents that.",
      "Each attempt teaches which triggers and gaps to plan for next time.",
      "After a slip: get safe, tell one trusted person, and restart the plan — in that order.",
    ],
  },
  {
    id: "halt",
    title: "HALT: hungry, angry, lonely, tired",
    summary:
      "HALT is a quick self-check used across recovery programs. The four states — Hungry, Angry, Lonely, Tired — quietly magnify cravings, and each one has a simple, physical fix you can apply within minutes.",
    keyPoints: [
      "Cravings often ride on top of an unmet basic need, not on the substance itself.",
      "Run the check before reacting: eaten recently? holding anger? isolated? exhausted?",
      "Fix the need first — a meal, a message to a friend, a nap — then reassess the urge.",
      "Keeping HALT needs met daily is cheap, unglamorous relapse prevention.",
    ],
  },
  {
    id: "support-network",
    title: "Building a support network",
    summary:
      "Recovery is far more durable with people around it. A support network mixes professionals (doctor, counsellor), peers who understand the road (groups like AA/NA/SMART), and personal allies — and each layer catches what the others miss.",
    keyPoints: [
      "Aim for at least one person you can call at 2 a.m. without explaining yourself first.",
      "Peer groups reduce isolation and normalise setbacks; try several before judging the format.",
      "Tell supporters specifically how to help (\"walk with me on Fridays\") — vague offers evaporate.",
      "Professional help is a layer, not a last resort; add it early.",
    ],
  },
  {
    id: "support-without-enabling",
    title: "How to support without enabling",
    summary:
      "Supporting means backing the person's recovery; enabling means shielding them from the consequences that would otherwise prompt change. The line is subtle in the moment — the test is whether your help makes using easier or recovery easier.",
    keyPoints: [
      "Paying debts, covering absences, or lying to others usually protects the addiction, not the person.",
      "Say yes to recovery costs (treatment, meetings, food) and no to untraceable cash.",
      "Boundaries are commitments about YOUR behaviour (\"I won't ride with you if you've used\"), not threats.",
      "Consistency beats intensity: one calmly kept boundary outweighs ten ultimatums.",
    ],
  },
  {
    id: "harm-reduction",
    title: "Harm reduction basics",
    summary:
      "Harm reduction meets people where they are: if someone is not ready or able to stop today, there are still proven ways to keep them alive and healthier until they can. It is a bridge to recovery, not a surrender.",
    keyPoints: [
      "Never using alone and knowing the signs of overdose save lives.",
      "Naloxone reverses opioid overdose — families can be trained to carry and use it.",
      "Sterile equipment and not mixing substances (especially with alcohol or benzos) cut the biggest risks.",
      "Every safer choice keeps the door to treatment open another day.",
    ],
  },
];

export interface CaregiverSituation {
  id: string;
  label: string;
  context: string;
}

export const CAREGIVER_SITUATIONS: CaregiverSituation[] = [
  {
    id: "came-home-high",
    label: "They came home high/drunk",
    context:
      "My loved one has just come home intoxicated and I need to handle the next few hours safely without a blow-up.",
  },
  {
    id: "suspect-relapse",
    label: "I think they relapsed",
    context:
      "I have noticed signs that my loved one may have started using again, but I am not certain and I don't want to push them away.",
  },
  {
    id: "denial",
    label: "They're in denial",
    context:
      "My loved one refuses to acknowledge that their substance use is a problem, and conversations keep turning into arguments.",
  },
  {
    id: "boundaries",
    label: "Setting boundaries without pushing them away",
    context:
      "I need to protect myself and our household with clear boundaries, while making sure they know the boundaries come from love.",
  },
  {
    id: "telling-children",
    label: "Talking to our children about it",
    context:
      "The children are noticing something is wrong at home and I need age-appropriate, honest ways to talk about a parent's substance use.",
  },
  {
    id: "burnout",
    label: "Taking care of my own burnout",
    context:
      "I am exhausted from caring for someone with a substance use disorder and I am starting to lose myself in the process.",
  },
];

/** Shown in the caregiver flow when the AI request fails. */
export const CAREGIVER_FALLBACK_TIPS: string[] = [
  "Stay calm and keep the conversation for later — nothing important gets resolved mid-crisis or mid-intoxication.",
  "Use \"I\" statements about what you observe and feel, not accusations about who they are.",
  "State one clear boundary you can actually keep, and keep it kindly and consistently.",
  "Make sure everyone is physically safe tonight; everything else can wait until tomorrow.",
  "Reach out to a helpline or support group for yourself — caregivers need care too.",
];
