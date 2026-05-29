// Demo content for the negotiation demo component
// This file contains all the text content for the demo, making it easy to edit

export const demoNarrative = `
# Roommate Agreement

You and two other people are moving into a shared apartment together and need to agree on some house rules before signing the lease. You've met briefly but don't know each other well yet, so this negotiation will help set expectations and avoid future conflicts.

## Your Preferences

You're excited about this living situation, but you have specific preferences for how the apartment should run. Some things matter a lot to you, while others you're more flexible about.

## How This Works

You are provided personal scoresheet showing how much each house rule matters to you. Higher scores mean that option is more important to you. Your goal is to negotiate an agreement that gives you the highest total score possible.

Each reason begins with a broader issue category, such as Personal Life at Home, Shared Kitchen Use, Household Chores and Comfort, or Quiet and Common Space. These categories are there to help you understand the broader interest behind each preference.

**Important:** If you can't reach an agreement with your roommates, you'll need to find a different living situation. This alternative (your BATNA) is worth 0 points. So you should only agree to a roommate arrangement that gives you positive points overall.
`;

export const demoTips = `
<h3>Tips on Negotiation</h3>

<p><strong>Know your priorities:</strong> Not all issues are equally important to you. Focus on getting what you want most, and be flexible on items that matter less.</p>

<p><strong>Look for trade-offs:</strong> If something matters a lot to you but less to others, that's an opportunity for a win-win deal. Offer to give on issues you care less about.</p>

<p><strong>Remember your BATNA:</strong> Your Best Alternative To Negotiated Agreement is finding different roommates. Don't accept a deal that gives you negative points. That's worse than your alternative!</p>

<p><strong>Communicate clearly:</strong> Explain why certain things matter to you. Understanding each other's reasoning can help find creative solutions that work for everyone.</p>
`;

export const demoBATNA = "Your best alternative to a negotiated agreement (BATNA) is to find different roommates, which is worth 0 points.";

export const demoRP = 0;

export const demoScoresheet = {
  "Pets_Allowed": [
    {
      option: "Yes",
      score: 12,
      reason: "<b>PERSONAL LIFE AT HOME:</b> You have a cat you're bringing, so the apartment needs to work for your everyday life."
    },
    {
      option: "No",
      score: 0,
      reason: ""
    }
  ],

  "Overnight_Guests": [
    {
      option: "Yes",
      score: 10,
      reason: "<b>PERSONAL LIFE AT HOME:</b> Your partner visits often on weekends, so overnight guests matter to you."
    },
    {
      option: "No",
      score: 0,
      reason: ""
    }
  ],

  "Kitchen_Storage": [
    {
      option: "Yes",
      score: 8,
      reason: "<b>SHARED KITCHEN USE:</b> More kitchen storage makes it easier to cook and use the kitchen together."
    },
    {
      option: "No",
      score: 0,
      reason: ""
    }
  ],

  "Shared_Groceries": [
    {
      option: "Yes",
      score: -9,
      reason: "<b>SHARED KITCHEN USE:</b> You prefer to buy your own food and keep groceries separate."
    },
    {
      option: "No",
      score: 0,
      reason: ""
    }
  ],

  "Clean_Ourselves": [
    {
      option: "Yes",
      score: 0,
      reason: "<b>HOUSEHOLD CHORES AND COMFORT:</b> You are flexible on this."
    },
    {
      option: "No",
      score: 0,
      reason: ""
    }
  ],

  "Cooler_Winter_Temp": [
    {
      option: "Yes",
      score: -7,
      reason: "<b>HOUSEHOLD CHORES AND COMFORT:</b> You prefer warmer temperatures and don't want the apartment kept too cold in winter."
    },
    {
      option: "No",
      score: 0,
      reason: ""
    }
  ],

  "Late_Nights_OK": [
    {
      option: "Yes",
      score: -5,
      reason: "<b>QUIET AND COMMON SPACE:</b> You prefer quiet evenings and don't want late nights to disrupt the apartment."
    },
    {
      option: "No",
      score: 0,
      reason: ""
    }
  ],

  "Living_Room": [
    {
      option: "Yes",
      score: -11,
      reason: "<b>QUIET AND COMMON SPACE</b>: You have strong preferences against this living room setup."
    },
    {
      option: "No",
      score: 0,
      reason: ""
    }
  ]
};
